/**
 * Workflow generation using OpenAI API.
 *
 * Includes:
 *  - Initial generation with few-shot prompt
 *  - P2 Auto-fix retry loop (max 3 attempts) — on validation failure, the
 *    failing JSON and the validator errors are fed back to the LLM
 *  - P1 NL edit (modifyWorkflow) — applies a user instruction to an existing
 *    workflow, reusing the retry loop
 */

import OpenAI from 'openai';
import type { WizardState } from '../types/wizard';
import type { WorkflowContent } from '../types/workflow';
import type { ValidationResult } from '../types/wizard';
import { OPERATOR_CATALOG } from '../data/operatorCatalog';
import { getFrameworkPrompt } from '../data/frameworks';
import { getGuardrailsPrompt } from '../data/guardrails';
import { getFewShotPrompt } from '../data/fewShotExamples';
import { validateWorkflow } from './workflowValidator';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const MODEL = 'gpt-4o';
const MAX_ATTEMPTS = 3;

export interface AttemptLog {
  attempt: number;
  errorCount: number;
  errors: string[];
}

export interface GeneratedWorkflow {
  workflow: WorkflowContent;
  whyExplanations: Record<string, string>;
  attempts: AttemptLog[];
}

function getClient(): OpenAI {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY environment variable.');
  }
  return new OpenAI({
    apiKey: OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  });
}

/**
 * Generate a workflow from wizard state. Retries up to MAX_ATTEMPTS on
 * validation failure, feeding the validator errors back into the LLM.
 */
export async function generateWorkflow(wizardState: WizardState): Promise<GeneratedWorkflow> {
  const openai = getClient();
  const basePrompt = buildPrompt(wizardState);
  return runWithRetry(openai, basePrompt);
}

/**
 * P1 NL edit: take an existing workflow + a natural-language instruction and
 * return an updated workflow. Goes through the same validation retry loop.
 */
export async function modifyWorkflow(
  current: WorkflowContent,
  currentWhy: Record<string, string>,
  instruction: string
): Promise<GeneratedWorkflow> {
  const openai = getClient();
  const basePrompt = buildModifyPrompt(current, currentWhy, instruction);
  return runWithRetry(openai, basePrompt);
}

/**
 * P3-A Reproduce from paper: take a free-text paper excerpt + target dataset
 * description, ask the LLM to produce a workflow that reproduces the paper's
 * pipeline on the given data. whyExplanations should include paper section
 * references.
 */
export async function reproduceFromPaper(
  paperText: string,
  datasetDescription: string
): Promise<GeneratedWorkflow> {
  const openai = getClient();
  const basePrompt = buildReproducePrompt(paperText, datasetDescription);
  return runWithRetry(openai, basePrompt);
}

/**
 * P3-B Multi-agent: a planner LLM call splits a complex research question into
 * sub-tasks. Each sub-task is generated in parallel by a worker LLM call.
 * A final merger LLM call combines them into one DAG that shares the source.
 */
export interface MultiAgentResult {
  subtasks: { name: string; goal: string }[];
  subWorkflows: GeneratedWorkflow[];
  merged: GeneratedWorkflow;
}

export async function runMultiAgent(
  query: string,
  datasetDescription: string
): Promise<MultiAgentResult> {
  const openai = getClient();

  // Step 1: Planner
  const planPrompt = buildPlannerPrompt(query, datasetDescription);
  const planResp = await openai.chat.completions.create({
    model: MODEL,
    max_tokens: 1024,
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: planPrompt }],
  });
  const plan = JSON.parse(planResp.choices[0]?.message?.content ?? '{"subtasks":[]}');
  const subtasks: { name: string; goal: string }[] = Array.isArray(plan.subtasks) ? plan.subtasks : [];
  if (subtasks.length === 0) {
    throw new Error('Planner returned no subtasks');
  }

  // Step 2: Workers in parallel
  const subWorkflows = await Promise.all(
    subtasks.map(t => runWithRetry(openai, buildWorkerPrompt(t, datasetDescription)))
  );

  // Step 3: Merger
  const mergerPrompt = buildMergerPrompt(query, datasetDescription, subtasks, subWorkflows);
  const merged = await runWithRetry(openai, mergerPrompt);

  return { subtasks, subWorkflows, merged };
}

// ============ Internal helpers ============

async function runWithRetry(openai: OpenAI, basePrompt: string): Promise<GeneratedWorkflow> {
  const attempts: AttemptLog[] = [];
  let lastParse: { workflow: WorkflowContent; whyExplanations: Record<string, string> } | null = null;
  let lastValidation: ValidationResult | null = null;

  for (let i = 1; i <= MAX_ATTEMPTS; i++) {
    const prompt =
      i === 1 ? basePrompt : buildRetryPrompt(basePrompt, lastParse!.workflow, lastValidation!);

    const completion = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = completion.choices[0]?.message?.content ?? '';
    const parsed = extractWorkflowJSON(responseText);
    const validation = validateWorkflow(parsed.workflow);

    attempts.push({
      attempt: i,
      errorCount: validation.errors.length,
      errors: validation.errors.map(e => `${e.field}: ${e.message}`),
    });

    if (validation.isValid) {
      return { ...parsed, attempts };
    }

    lastParse = parsed;
    lastValidation = validation;
  }

  const finalErrors = lastValidation!.errors.map(e => `${e.field}: ${e.message}`).join('\n');
  const err = new Error(`Workflow failed validation after ${MAX_ATTEMPTS} attempts:\n${finalErrors}`);
  (err as any).attempts = attempts;
  throw err;
}

function extractWorkflowJSON(responseText: string): { workflow: WorkflowContent; whyExplanations: Record<string, string> } {
  let jsonText = responseText.trim();
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/^```json\s*/, '').replace(/```\s*$/, '');
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```\s*/, '').replace(/```\s*$/, '');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonText);
  } catch (error) {
    console.error('Failed to parse LLM response as JSON:', error);
    console.error('Response text:', responseText);
    throw new Error('Failed to parse workflow JSON from LLM response');
  }

  const whyExplanations: Record<string, string> =
    parsed.whyExplanations && typeof parsed.whyExplanations === 'object' ? parsed.whyExplanations : {};
  const { whyExplanations: _drop, ...workflowOnly } = parsed;
  return { workflow: workflowOnly as WorkflowContent, whyExplanations };
}

// ============ Prompt builders ============

function operatorCatalogText(): string {
  return OPERATOR_CATALOG.map(op => {
    const props = op.properties
      .map(p => `    - ${p.name} (${p.type}${p.required ? ', required' : ', optional'}): ${p.description || ''}`)
      .join('\n');
    return `### ${op.operatorType} - ${op.userFriendlyName}
Category: ${op.category}
Description: ${op.description}
Input Ports: ${op.inputPorts}
Output Ports: ${op.outputPorts}
Properties:
${props}`;
  }).join('\n\n');
}

const PORT_AND_FORMAT_RULES = `## CRITICAL: Port ID Convention (must follow exactly)
Every operator MUST declare its input and output ports using this exact naming scheme:
- inputPorts: an array with one entry per input port. The i-th entry has portID "input-{i}" (zero-indexed).
- outputPorts: an array with one entry per output port. The i-th entry has portID "output-{i}" (zero-indexed).

Every link MUST reference these exact portIDs:
- link.source.portID = "output-{i}" referencing an output port that actually exists on the source operator
- link.target.portID = "input-{i}" referencing an input port that actually exists on the target operator

Source operators (0 input ports) can only appear as a link source, never a target.

## CRITICAL: Why Explanations
Include a top-level "whyExplanations" object mapping every operatorID to a short (1-2 sentence) plain-English explanation suitable for a biomedical researcher who does not write code. Reference framework phase, guardrail, or paper section when applicable.

## Output Format
Return ONLY a single JSON object (no markdown fences, no commentary):

{
  "operators": [...],
  "operatorPositions": { "operatorID": { "x": number, "y": number } },
  "links": [...],
  "commentBoxes": [],
  "settings": { "dataTransferBatchSize": 400 },
  "whyExplanations": { "operatorID": "explanation string" }
}`;

function buildPrompt(wizardState: WizardState): string {
  const { analysisGoal, dataSource, framework, guardrails } = wizardState;

  let dataSourceConfig = '';
  if (dataSource === 'CSV Upload') {
    dataSourceConfig = wizardState.csvFile
      ? `CSV file: ${wizardState.csvFile.name}`
      : 'CSV file (path to be specified)';
  } else if (dataSource === 'Database' && wizardState.databaseConfig) {
    const db = wizardState.databaseConfig;
    dataSourceConfig = `PostgreSQL database: ${db.host}:${db.port}/${db.database}, table: ${db.table}`;
  } else if (dataSource === 'API' && wizardState.apiConfig) {
    dataSourceConfig = `API: ${wizardState.apiConfig.method} ${wizardState.apiConfig.url}`;
  } else if (dataSource === 'dkNET Dataset' && wizardState.dknetDataset) {
    dataSourceConfig = `dkNET curated biomedical dataset: ${wizardState.dknetDataset.name}
Schema: ${wizardState.dknetDataset.schema}
Use CSVFileScan with fileName "${wizardState.dknetDataset.fileName}" to load this dataset.`;
  }

  return `You are a Texera workflow generation expert. Generate a complete Texera workflow JSON for the following requirements:

## Analysis Goal
${analysisGoal}

## Data Source
${dataSource}
${dataSourceConfig}

## Scientific Framework
${framework || 'None specified'}
${framework ? getFrameworkPrompt(framework) : ''}

${getGuardrailsPrompt(guardrails)}

## Available Operators
${operatorCatalogText()}

${PORT_AND_FORMAT_RULES}

${getFewShotPrompt()}

Generate the workflow now.`;
}

function buildModifyPrompt(
  current: WorkflowContent,
  currentWhy: Record<string, string>,
  instruction: string
): string {
  const merged = { ...current, whyExplanations: currentWhy };
  return `You are a Texera workflow editor. The user wants to modify the following existing workflow.

## Current Workflow
\`\`\`json
${JSON.stringify(merged, null, 2)}
\`\`\`

## User Instruction
${instruction}

## Editing Rules
- Apply the user instruction precisely. Do not refactor unrelated parts.
- Preserve operatorIDs of operators that are NOT being changed.
- If you add new operators, give them fresh IDs in the format "{operatorType}-operator-{shortuuid}".
- Update operatorPositions and links to keep the workflow valid and connected.
- Update or extend whyExplanations to cover any new or changed operators, and explain WHY this edit was made in the affected operators' explanations.

## Available Operators
${operatorCatalogText()}

${PORT_AND_FORMAT_RULES}

Return the FULL updated workflow JSON (not a diff).`;
}

function buildRetryPrompt(
  originalPrompt: string,
  prevWorkflow: WorkflowContent,
  validation: ValidationResult
): string {
  const errorList = validation.errors.map(e => `- ${e.field}: ${e.message}`).join('\n');
  return `${originalPrompt}

## PREVIOUS ATTEMPT FAILED VALIDATION
Your previous response was:
\`\`\`json
${JSON.stringify(prevWorkflow, null, 2)}
\`\`\`

The validator reported these errors that MUST be fixed:
${errorList}

Carefully re-read the operator catalog and the Port ID Convention. Produce a corrected workflow JSON that fixes every error above. Do not introduce new errors.`;
}

function buildReproducePrompt(paperText: string, datasetDescription: string): string {
  return `You are a Texera workflow generation expert helping a biomedical researcher reproduce a paper's data analysis pipeline.

## Paper Text
${paperText}

## Target Dataset
${datasetDescription}

## Task
1. Read the paper text and identify the data analysis methodology (preprocessing, model, evaluation, statistics).
2. Generate a Texera workflow that reproduces this methodology on the target dataset.
3. In each operator's whyExplanation, briefly cite the paper section or sentence that motivates including this step (e.g., "Reproduces 'Methods §2.1: 80/20 train/test split with seed=1'.").
4. Apply standard guardrails (no data leakage; train/test split before modeling; include an evaluation step).

## Available Operators
${operatorCatalogText()}

${PORT_AND_FORMAT_RULES}

${getFewShotPrompt()}

Generate the reproduction workflow now.`;
}

function buildPlannerPrompt(query: string, datasetDescription: string): string {
  return `You are a research planning agent for a biomedical analysis platform. Given a complex research question, split it into 2-4 independent sub-analyses that can be run in parallel.

## Research Question
${query}

## Available Dataset
${datasetDescription}

## Task
Produce a JSON object listing the sub-analyses. Each must be independent (no data dependency between siblings) and each must reduce to a Texera workflow on the dataset.

Output format (return ONLY this JSON object, no markdown):
{
  "subtasks": [
    { "name": "Short title", "goal": "One-sentence description of what this sub-workflow computes and visualizes." }
  ]
}`;
}

function buildWorkerPrompt(
  subtask: { name: string; goal: string },
  datasetDescription: string
): string {
  return `You are a Texera workflow generation expert. Generate a workflow for ONE sub-analysis of a larger multi-agent plan.

## Sub-analysis
Name: ${subtask.name}
Goal: ${subtask.goal}

## Dataset
${datasetDescription}

## Guardrails
- No data leakage; if modeling is involved, train/test split before modeling with a fixed random seed.
- Include at least one visualization or aggregate that answers the sub-goal.
- Keep the workflow small and focused on this single sub-analysis.

## Available Operators
${operatorCatalogText()}

${PORT_AND_FORMAT_RULES}

${getFewShotPrompt()}

Generate the sub-workflow now.`;
}

function buildMergerPrompt(
  query: string,
  datasetDescription: string,
  subtasks: { name: string; goal: string }[],
  subWorkflows: GeneratedWorkflow[]
): string {
  const subPayload = subtasks.map((t, i) => ({
    name: t.name,
    goal: t.goal,
    workflow: { ...subWorkflows[i].workflow, whyExplanations: subWorkflows[i].whyExplanations },
  }));

  return `You are a Texera workflow merger. You are given several independently-generated sub-workflows that each answer one sub-question of a larger research question. Merge them into a single DAG that shares a common data source and branches into parallel sub-pipelines.

## Original Research Question
${query}

## Dataset
${datasetDescription}

## Sub-workflows
\`\`\`json
${JSON.stringify(subPayload, null, 2)}
\`\`\`

## Merging Rules
- Use a SINGLE shared data source operator (typically one CSVFileScan) that all branches consume from. Drop the duplicate source operators from each sub-workflow.
- Preserve every downstream operator from each sub-workflow, renaming operatorIDs if needed to keep them globally unique.
- Update links so each branch's first operator consumes from the shared source's output-0.
- Lay out branches vertically (different y for each branch), left-to-right within a branch.
- whyExplanations must cover every operator; for branch-leading operators include "Part of branch: <subtask name>".

## Available Operators
${operatorCatalogText()}

${PORT_AND_FORMAT_RULES}

Return the merged workflow JSON.`;
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
