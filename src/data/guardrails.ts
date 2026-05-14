/**
 * Guardrails configuration for workflow generation
 */

import type { Guardrail } from '../types/wizard';

export const DEFAULT_GUARDRAILS: Guardrail[] = [
  {
    id: 'data-validation',
    name: 'Data Validation',
    description: 'Always validate input data quality and schema before processing',
    enabled: true,
  },
  {
    id: 'error-handling',
    name: 'Error Handling',
    description: 'Include proper error handling operators to catch data issues',
    enabled: true,
  },
  {
    id: 'sample-first',
    name: 'Sample Data First',
    description: 'Use Limit operator to sample data before expensive operations',
    enabled: true,
  },
  {
    id: 'type-safety',
    name: 'Type Safety',
    description: 'Ensure column types are properly cast before operations',
    enabled: true,
  },
  {
    id: 'visualization',
    name: 'Visualization',
    description: 'Include visualization operators to inspect intermediate results',
    enabled: true,
  },
  {
    id: 'reproducibility',
    name: 'Reproducibility',
    description: 'Set random seeds for random operations (Split, sampling, etc.)',
    enabled: true,
  },
  {
    id: 'null-handling',
    name: 'Null Value Handling',
    description: 'Filter or handle null values before aggregations',
    enabled: true,
  },
  {
    id: 'performance',
    name: 'Performance Optimization',
    description: 'Apply filters early in the pipeline to reduce data volume',
    enabled: true,
  },
];

/**
 * Get guardrails rules as a prompt string for Claude
 */
export function getGuardrailsPrompt(guardrails: Guardrail[]): string {
  const enabledGuardrails = guardrails.filter(g => g.enabled);

  if (enabledGuardrails.length === 0) {
    return '';
  }

  const rules = enabledGuardrails.map((g, idx) =>
    `${idx + 1}. **${g.name}**: ${g.description}`
  ).join('\n');

  return `\n\n## Guardrails\nThe following guardrails MUST be followed:\n${rules}`;
}
