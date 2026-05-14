/**
 * Workflow generation using Claude API
 */

import Anthropic from '@anthropic-ai/sdk';
import type { WizardState } from '../types/wizard';
import type { WorkflowContent } from '../types/workflow';
import { OPERATOR_CATALOG } from '../data/operatorCatalog';
import { getFrameworkPrompt } from '../data/frameworks';
import { getGuardrailsPrompt } from '../data/guardrails';

const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY || '';

/**
 * Generate workflow JSON using Claude API
 */
export async function generateWorkflow(
  wizardState: WizardState
): Promise<WorkflowContent> {
  if (!CLAUDE_API_KEY) {
    throw new Error('Claude API key not configured. Please set VITE_CLAUDE_API_KEY environment variable.');
  }

  const anthropic = new Anthropic({
    apiKey: CLAUDE_API_KEY,
    dangerouslyAllowBrowser: true, // For demo purposes only - use backend proxy in production
  });

  const prompt = buildPrompt(wizardState);

  const message = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  // Extract JSON from Claude's response
  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
  const workflowContent = extractWorkflowJSON(responseText);

  return workflowContent;
}

/**
 * Build the prompt for Claude
 */
function buildPrompt(wizardState: WizardState): string {
  const { analysisGoal, dataSource, framework, guardrails } = wizardState;

  // Build operator catalog description
  const operatorDocs = OPERATOR_CATALOG.map(op => {
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

  // Build data source configuration
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
  }

  const frameworkPrompt = framework ? getFrameworkPrompt(framework) : '';
  const guardrailsPrompt = getGuardrailsPrompt(guardrails);

  return `You are a Texera workflow generation expert. Generate a complete Texera workflow JSON for the following requirements:

## Analysis Goal
${analysisGoal}

## Data Source
${dataSource}
${dataSourceConfig}

## Scientific Framework
${framework || 'None specified'}
${frameworkPrompt}

${guardrailsPrompt}

## Available Operators
${operatorDocs}

## Instructions
1. Generate a valid Texera WorkflowContent JSON that accomplishes the analysis goal
2. Use appropriate operators from the catalog above
3. Follow the ${framework} methodology if specified
4. Apply all enabled guardrails
5. Ensure operators are properly connected via links
6. Set reasonable positions for operators (layout left-to-right, top-to-bottom)
7. Use realistic operator IDs in format: "{operatorType}-operator-{uuid}"
8. Use realistic link IDs in format: "link-{uuid}"

## Output Format
Return ONLY a valid JSON object matching this schema (no markdown, no explanation):

{
  "operators": [
    {
      "operatorID": "string",
      "operatorType": "string",
      "operatorVersion": "N/A",
      "operatorProperties": {},
      "inputPorts": [...],
      "outputPorts": [...],
      "showAdvanced": false,
      "customDisplayName": "string"
    }
  ],
  "operatorPositions": {
    "operatorID": { "x": number, "y": number }
  },
  "links": [
    {
      "linkID": "string",
      "source": { "operatorID": "string", "portID": "string" },
      "target": { "operatorID": "string", "portID": "string" }
    }
  ],
  "commentBoxes": [],
  "settings": {
    "dataTransferBatchSize": 400
  }
}

Generate the workflow now:`;
}

/**
 * Extract workflow JSON from Claude's response
 */
function extractWorkflowJSON(responseText: string): WorkflowContent {
  // Try to find JSON in the response
  let jsonText = responseText.trim();

  // Remove markdown code blocks if present
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/^```json\s*/, '').replace(/```\s*$/, '');
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```\s*/, '').replace(/```\s*$/, '');
  }

  try {
    const parsed = JSON.parse(jsonText);
    return parsed as WorkflowContent;
  } catch (error) {
    console.error('Failed to parse Claude response as JSON:', error);
    console.error('Response text:', responseText);
    throw new Error('Failed to parse workflow JSON from Claude response');
  }
}

/**
 * Generate a UUID for operator/link IDs
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
