/**
 * Few-shot example workflows used in the LLM prompt.
 * Every example MUST follow the input-{i} / output-{i} port-ID convention.
 * Every example MUST include a whyExplanations map keyed by operatorID.
 */

export const FEW_SHOT_EXAMPLES: string[] = [
  // Example 1: Simple EDA on a CSV
  JSON.stringify(
    {
      operators: [
        {
          operatorID: 'CSVFileScan-operator-ex1-001',
          operatorType: 'CSVFileScan',
          operatorVersion: 'N/A',
          operatorProperties: { fileName: 'data.csv', hasHeader: true, customDelimiter: ',' },
          inputPorts: [],
          outputPorts: [{ portID: 'output-0' }],
          showAdvanced: false,
          customDisplayName: 'Read CSV',
        },
        {
          operatorID: 'Limit-operator-ex1-001',
          operatorType: 'Limit',
          operatorVersion: 'N/A',
          operatorProperties: { limit: 1000 },
          inputPorts: [{ portID: 'input-0' }],
          outputPorts: [{ portID: 'output-0' }],
          showAdvanced: false,
          customDisplayName: 'Sample 1000 rows',
        },
        {
          operatorID: 'Aggregate-operator-ex1-001',
          operatorType: 'Aggregate',
          operatorVersion: 'N/A',
          operatorProperties: { aggregations: [{ attribute: 'value', aggFunction: 'avg', resultAttribute: 'avg_value' }] },
          inputPorts: [{ portID: 'input-0' }],
          outputPorts: [{ portID: 'output-0' }],
          showAdvanced: false,
          customDisplayName: 'Summary stats',
        },
        {
          operatorID: 'BarChart-operator-ex1-001',
          operatorType: 'BarChart',
          operatorVersion: 'N/A',
          operatorProperties: {},
          inputPorts: [{ portID: 'input-0' }],
          outputPorts: [{ portID: 'output-0' }],
          showAdvanced: false,
          customDisplayName: 'Distribution chart',
        },
      ],
      operatorPositions: {
        'CSVFileScan-operator-ex1-001': { x: 100, y: 200 },
        'Limit-operator-ex1-001': { x: 400, y: 200 },
        'Aggregate-operator-ex1-001': { x: 700, y: 200 },
        'BarChart-operator-ex1-001': { x: 1000, y: 200 },
      },
      links: [
        {
          linkID: 'link-ex1-001',
          source: { operatorID: 'CSVFileScan-operator-ex1-001', portID: 'output-0' },
          target: { operatorID: 'Limit-operator-ex1-001', portID: 'input-0' },
        },
        {
          linkID: 'link-ex1-002',
          source: { operatorID: 'Limit-operator-ex1-001', portID: 'output-0' },
          target: { operatorID: 'Aggregate-operator-ex1-001', portID: 'input-0' },
        },
        {
          linkID: 'link-ex1-003',
          source: { operatorID: 'Aggregate-operator-ex1-001', portID: 'output-0' },
          target: { operatorID: 'BarChart-operator-ex1-001', portID: 'input-0' },
        },
      ],
      commentBoxes: [],
      settings: { dataTransferBatchSize: 400 },
      whyExplanations: {
        'CSVFileScan-operator-ex1-001': 'Load the user-uploaded CSV into the workflow.',
        'Limit-operator-ex1-001': 'Sample before expensive operations to stay responsive on large files (guardrail: sample-first).',
        'Aggregate-operator-ex1-001': 'Compute summary statistics to give the user a quick understanding of the data (CRISP-DM: Data Understanding).',
        'BarChart-operator-ex1-001': 'Visualize the aggregated results so the user can spot distributions.',
      },
    },
    null,
    2
  ),

  // Example 2: Predictive Modeling with mandatory train/test split + evaluation
  JSON.stringify(
    {
      operators: [
        {
          operatorID: 'CSVFileScan-operator-ex2-001',
          operatorType: 'CSVFileScan',
          operatorVersion: 'N/A',
          operatorProperties: { fileName: 'data.csv', hasHeader: true, customDelimiter: ',' },
          inputPorts: [],
          outputPorts: [{ portID: 'output-0' }],
          showAdvanced: false,
          customDisplayName: 'Read CSV',
        },
        {
          operatorID: 'Filter-operator-ex2-001',
          operatorType: 'Filter',
          operatorVersion: 'N/A',
          operatorProperties: { predicates: [{ attribute: 'label', condition: 'is_not_null', value: '' }] },
          inputPorts: [{ portID: 'input-0' }],
          outputPorts: [{ portID: 'output-0' }],
          showAdvanced: false,
          customDisplayName: 'Drop null labels',
        },
        {
          operatorID: 'TypeCasting-operator-ex2-001',
          operatorType: 'TypeCasting',
          operatorVersion: 'N/A',
          operatorProperties: { castUnits: [{ attribute: 'label', resultType: 'integer' }] },
          inputPorts: [{ portID: 'input-0' }],
          outputPorts: [{ portID: 'output-0' }],
          showAdvanced: false,
          customDisplayName: 'Cast label to int',
        },
        {
          operatorID: 'Split-operator-ex2-001',
          operatorType: 'Split',
          operatorVersion: 'N/A',
          operatorProperties: { trainingPercentage: 80, randomSeed: 1 },
          inputPorts: [{ portID: 'input-0' }],
          outputPorts: [{ portID: 'output-0' }, { portID: 'output-1' }],
          showAdvanced: false,
          customDisplayName: 'Train/test split 80/20',
        },
        {
          operatorID: 'SklearnDecisionTree-operator-ex2-001',
          operatorType: 'SklearnDecisionTree',
          operatorVersion: 'N/A',
          operatorProperties: { labelAttribute: 'label' },
          inputPorts: [{ portID: 'input-0' }, { portID: 'input-1' }],
          outputPorts: [{ portID: 'output-0' }],
          showAdvanced: false,
          customDisplayName: 'Train decision tree',
        },
        {
          operatorID: 'SklearnPrediction-operator-ex2-001',
          operatorType: 'SklearnPrediction',
          operatorVersion: 'N/A',
          operatorProperties: {},
          inputPorts: [{ portID: 'input-0' }, { portID: 'input-1' }],
          outputPorts: [{ portID: 'output-0' }],
          showAdvanced: false,
          customDisplayName: 'Predict on test set',
        },
        {
          operatorID: 'Scatterplot-operator-ex2-001',
          operatorType: 'Scatterplot',
          operatorVersion: 'N/A',
          operatorProperties: {},
          inputPorts: [{ portID: 'input-0' }],
          outputPorts: [{ portID: 'output-0' }],
          showAdvanced: false,
          customDisplayName: 'Evaluate predictions',
        },
      ],
      operatorPositions: {
        'CSVFileScan-operator-ex2-001': { x: 100, y: 200 },
        'Filter-operator-ex2-001': { x: 350, y: 200 },
        'TypeCasting-operator-ex2-001': { x: 600, y: 200 },
        'Split-operator-ex2-001': { x: 850, y: 200 },
        'SklearnDecisionTree-operator-ex2-001': { x: 1100, y: 120 },
        'SklearnPrediction-operator-ex2-001': { x: 1350, y: 200 },
        'Scatterplot-operator-ex2-001': { x: 1600, y: 200 },
      },
      links: [
        {
          linkID: 'link-ex2-001',
          source: { operatorID: 'CSVFileScan-operator-ex2-001', portID: 'output-0' },
          target: { operatorID: 'Filter-operator-ex2-001', portID: 'input-0' },
        },
        {
          linkID: 'link-ex2-002',
          source: { operatorID: 'Filter-operator-ex2-001', portID: 'output-0' },
          target: { operatorID: 'TypeCasting-operator-ex2-001', portID: 'input-0' },
        },
        {
          linkID: 'link-ex2-003',
          source: { operatorID: 'TypeCasting-operator-ex2-001', portID: 'output-0' },
          target: { operatorID: 'Split-operator-ex2-001', portID: 'input-0' },
        },
        {
          linkID: 'link-ex2-004',
          source: { operatorID: 'Split-operator-ex2-001', portID: 'output-0' },
          target: { operatorID: 'SklearnDecisionTree-operator-ex2-001', portID: 'input-0' },
        },
        {
          linkID: 'link-ex2-005',
          source: { operatorID: 'Split-operator-ex2-001', portID: 'output-1' },
          target: { operatorID: 'SklearnDecisionTree-operator-ex2-001', portID: 'input-1' },
        },
        {
          linkID: 'link-ex2-006',
          source: { operatorID: 'SklearnDecisionTree-operator-ex2-001', portID: 'output-0' },
          target: { operatorID: 'SklearnPrediction-operator-ex2-001', portID: 'input-0' },
        },
        {
          linkID: 'link-ex2-007',
          source: { operatorID: 'Split-operator-ex2-001', portID: 'output-1' },
          target: { operatorID: 'SklearnPrediction-operator-ex2-001', portID: 'input-1' },
        },
        {
          linkID: 'link-ex2-008',
          source: { operatorID: 'SklearnPrediction-operator-ex2-001', portID: 'output-0' },
          target: { operatorID: 'Scatterplot-operator-ex2-001', portID: 'input-0' },
        },
      ],
      commentBoxes: [],
      settings: { dataTransferBatchSize: 400 },
      whyExplanations: {
        'CSVFileScan-operator-ex2-001': 'Load the source data for modeling.',
        'Filter-operator-ex2-001': 'Drop rows with null labels — supervised learning cannot use unlabeled rows (guardrail: null-handling).',
        'TypeCasting-operator-ex2-001': 'Ensure the label column has the correct type before modeling (guardrail: type-safety).',
        'Split-operator-ex2-001': 'Split into train (80%) and test (20%) with a fixed random seed BEFORE any modeling step. Splitting first prevents data leakage and ensures reproducibility (guardrails: train-test-split, data-leakage, reproducibility).',
        'SklearnDecisionTree-operator-ex2-001': 'Train a decision tree classifier on the training partition only.',
        'SklearnPrediction-operator-ex2-001': 'Apply the trained model to the held-out test set to get unbiased predictions.',
        'Scatterplot-operator-ex2-001': 'Visualize predictions vs. ground truth so the user can assess model quality (guardrail: evaluation).',
      },
    },
    null,
    2
  ),
];

export function getFewShotPrompt(): string {
  const examples = FEW_SHOT_EXAMPLES.map(
    (ex, i) => `### Example ${i + 1}\n\`\`\`json\n${ex}\n\`\`\``
  ).join('\n\n');

  return `## Few-Shot Examples
The following are reference workflows. They use the EXACT output format you must produce, including the port-ID convention and the whyExplanations field.

${examples}`;
}
