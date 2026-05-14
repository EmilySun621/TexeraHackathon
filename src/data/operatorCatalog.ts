/**
 * Texera Operator Catalog
 * Based on actual operators from common/workflow-operator/src/main/scala/org/apache/texera/amber/operator/
 */

export interface OperatorMetadata {
  operatorType: string;
  userFriendlyName: string;
  category: string;
  description: string;
  inputPorts: number;
  outputPorts: number;
  dynamicInputPorts?: boolean;
  dynamicOutputPorts?: boolean;
  properties: OperatorProperty[];
}

export interface OperatorProperty {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  defaultValue?: any;
  description?: string;
}

export const OPERATOR_CATALOG: OperatorMetadata[] = [
  // ============ DATA SOURCES ============
  {
    operatorType: 'CSVFileScan',
    userFriendlyName: 'CSV File Reader',
    category: 'Source',
    description: 'Read data from CSV files',
    inputPorts: 0,
    outputPorts: 1,
    properties: [
      { name: 'fileName', type: 'string', required: true, description: 'Path to CSV file' },
      { name: 'customDelimiter', type: 'string', required: false, defaultValue: ',', description: 'Delimiter character' },
      { name: 'hasHeader', type: 'boolean', required: false, defaultValue: true, description: 'Whether CSV has header row' },
      { name: 'fileEncoding', type: 'string', required: false, defaultValue: 'UTF_8' },
    ],
  },
  {
    operatorType: 'ParallelCSVScan',
    userFriendlyName: 'Parallel CSV Reader',
    category: 'Source',
    description: 'Read large CSV files in parallel',
    inputPorts: 0,
    outputPorts: 1,
    properties: [
      { name: 'fileName', type: 'string', required: true },
      { name: 'customDelimiter', type: 'string', required: false, defaultValue: ',' },
      { name: 'hasHeader', type: 'boolean', required: false, defaultValue: true },
    ],
  },
  {
    operatorType: 'JSONLScan',
    userFriendlyName: 'JSON Lines Reader',
    category: 'Source',
    description: 'Read JSON Lines (newline-delimited JSON) files',
    inputPorts: 0,
    outputPorts: 1,
    properties: [
      { name: 'fileName', type: 'string', required: true },
    ],
  },
  {
    operatorType: 'PostgreSQLSource',
    userFriendlyName: 'PostgreSQL Source',
    category: 'Source',
    description: 'Read data from PostgreSQL database',
    inputPorts: 0,
    outputPorts: 1,
    properties: [
      { name: 'host', type: 'string', required: true },
      { name: 'port', type: 'string', required: true, defaultValue: '5432' },
      { name: 'database', type: 'string', required: true },
      { name: 'table', type: 'string', required: true },
      { name: 'username', type: 'string', required: true },
      { name: 'password', type: 'string', required: true },
    ],
  },

  // ============ DATA CLEANING ============
  {
    operatorType: 'Filter',
    userFriendlyName: 'Filter',
    category: 'Cleaning',
    description: 'Filter rows based on predicates',
    inputPorts: 1,
    outputPorts: 1,
    properties: [
      { name: 'predicates', type: 'array', required: true, description: 'List of filter predicates' },
    ],
  },
  {
    operatorType: 'Projection',
    userFriendlyName: 'Select Columns',
    category: 'Cleaning',
    description: 'Select or drop specific columns',
    inputPorts: 1,
    outputPorts: 1,
    properties: [
      { name: 'attributes', type: 'array', required: true, description: 'Columns to keep or drop' },
      { name: 'isDrop', type: 'boolean', required: false, defaultValue: false },
    ],
  },
  {
    operatorType: 'Distinct',
    userFriendlyName: 'Remove Duplicates',
    category: 'Cleaning',
    description: 'Remove duplicate rows',
    inputPorts: 1,
    outputPorts: 1,
    properties: [],
  },
  {
    operatorType: 'TypeCasting',
    userFriendlyName: 'Type Casting',
    category: 'Cleaning',
    description: 'Convert column data types',
    inputPorts: 1,
    outputPorts: 1,
    properties: [
      { name: 'typeCasting', type: 'array', required: true, description: 'Type conversion specifications' },
    ],
  },

  // ============ DATA TRANSFORMATION ============
  {
    operatorType: 'Aggregate',
    userFriendlyName: 'Aggregate (Group By)',
    category: 'Analytics',
    description: 'Perform aggregation operations (sum, avg, count, etc.)',
    inputPorts: 1,
    outputPorts: 1,
    properties: [
      { name: 'groupByKeys', type: 'array', required: false, defaultValue: [], description: 'Columns to group by' },
      { name: 'aggregations', type: 'array', required: true, description: 'Aggregation functions to apply' },
    ],
  },
  {
    operatorType: 'Sort',
    userFriendlyName: 'Sort',
    category: 'Analytics',
    description: 'Sort rows by one or more columns',
    inputPorts: 1,
    outputPorts: 1,
    properties: [
      { name: 'sortCriteria', type: 'array', required: true, description: 'Sort specifications' },
    ],
  },
  {
    operatorType: 'HashJoin',
    userFriendlyName: 'Join Tables',
    category: 'Analytics',
    description: 'Join two tables using hash join',
    inputPorts: 2,
    outputPorts: 1,
    properties: [
      { name: 'buildAttributeName', type: 'string', required: true },
      { name: 'probeAttributeName', type: 'string', required: true },
      { name: 'joinType', type: 'string', required: false, defaultValue: 'inner' },
    ],
  },
  {
    operatorType: 'Split',
    userFriendlyName: 'Split Data',
    category: 'Analytics',
    description: 'Split data into training/testing sets',
    inputPorts: 1,
    outputPorts: 2,
    dynamicOutputPorts: true,
    properties: [
      { name: 'k', type: 'number', required: true, description: 'Percentage for first output (0-100)' },
      { name: 'random', type: 'boolean', required: false, defaultValue: true },
      { name: 'seed', type: 'number', required: false, defaultValue: 1 },
    ],
  },

  // ============ PYTHON UDF ============
  {
    operatorType: 'PythonUDF',
    userFriendlyName: 'Python UDF',
    category: 'UDF',
    description: 'Custom Python user-defined function',
    inputPorts: 1,
    outputPorts: 1,
    properties: [
      { name: 'pythonScriptText', type: 'string', required: true, description: 'Python code to execute' },
      { name: 'inputColumns', type: 'array', required: false },
      { name: 'outputColumns', type: 'array', required: false },
    ],
  },
  {
    operatorType: 'PythonLambdaFunction',
    userFriendlyName: 'Python Lambda',
    category: 'UDF',
    description: 'Simple Python lambda expressions',
    inputPorts: 1,
    outputPorts: 1,
    properties: [
      { name: 'lambdaAttributeUnits', type: 'array', required: true },
    ],
  },

  // ============ MACHINE LEARNING ============
  {
    operatorType: 'SklearnPerceptron',
    userFriendlyName: 'Linear Perceptron',
    category: 'Machine Learning',
    description: 'Sklearn Perceptron classifier',
    inputPorts: 2,
    outputPorts: 1,
    properties: [
      { name: 'target', type: 'string', required: true, description: 'Target column name' },
      { name: 'countVectorizer', type: 'boolean', required: false, defaultValue: false },
      { name: 'tfidfTransformer', type: 'boolean', required: false, defaultValue: false },
    ],
  },
  {
    operatorType: 'SklearnDecisionTree',
    userFriendlyName: 'Decision Tree',
    category: 'Machine Learning',
    description: 'Sklearn Decision Tree classifier',
    inputPorts: 2,
    outputPorts: 1,
    properties: [
      { name: 'target', type: 'string', required: true },
      { name: 'countVectorizer', type: 'boolean', required: false, defaultValue: false },
      { name: 'tfidfTransformer', type: 'boolean', required: false, defaultValue: false },
    ],
  },
  {
    operatorType: 'SklearnPrediction',
    userFriendlyName: 'Make Predictions',
    category: 'Machine Learning',
    description: 'Use trained model to make predictions',
    inputPorts: 2,
    outputPorts: 1,
    properties: [
      { name: 'Model Attribute', type: 'string', required: true, defaultValue: 'model' },
      { name: 'Output Attribute Name', type: 'string', required: true, defaultValue: 'prediction' },
      { name: 'Ground Truth Attribute Name to Ignore', type: 'string', required: false },
    ],
  },

  // ============ NLP ============
  {
    operatorType: 'KeywordSearch',
    userFriendlyName: 'Keyword Search',
    category: 'NLP',
    description: 'Search for keywords in text',
    inputPorts: 1,
    outputPorts: 1,
    properties: [
      { name: 'attribute', type: 'string', required: true },
      { name: 'keyword', type: 'string', required: true },
    ],
  },
  {
    operatorType: 'Regex',
    userFriendlyName: 'Regular Expression',
    category: 'NLP',
    description: 'Match text using regular expressions',
    inputPorts: 1,
    outputPorts: 1,
    properties: [
      { name: 'attribute', type: 'string', required: true },
      { name: 'regex', type: 'string', required: true },
    ],
  },

  // ============ VISUALIZATION ============
  {
    operatorType: 'Scatterplot',
    userFriendlyName: 'Scatter Plot',
    category: 'Visualization',
    description: 'Create scatter plot visualization',
    inputPorts: 1,
    outputPorts: 1,
    properties: [
      { name: 'xColumn', type: 'string', required: true },
      { name: 'yColumn', type: 'string', required: true },
      { name: 'colorColumn', type: 'string', required: false },
      { name: 'xLogScale', type: 'boolean', required: false, defaultValue: false },
      { name: 'yLogScale', type: 'boolean', required: false, defaultValue: false },
      { name: 'alpha', type: 'number', required: false, defaultValue: 1 },
    ],
  },
  {
    operatorType: 'BarChart',
    userFriendlyName: 'Bar Chart',
    category: 'Visualization',
    description: 'Create bar chart visualization',
    inputPorts: 1,
    outputPorts: 1,
    properties: [
      { name: 'nameColumn', type: 'string', required: true },
      { name: 'dataColumn', type: 'string', required: true },
    ],
  },
  {
    operatorType: 'LineChart',
    userFriendlyName: 'Line Chart',
    category: 'Visualization',
    description: 'Create line chart visualization',
    inputPorts: 1,
    outputPorts: 1,
    properties: [
      { name: 'xColumn', type: 'string', required: true },
      { name: 'yColumns', type: 'array', required: true },
    ],
  },
  {
    operatorType: 'PieChart',
    userFriendlyName: 'Pie Chart',
    category: 'Visualization',
    description: 'Create pie chart visualization',
    inputPorts: 1,
    outputPorts: 1,
    properties: [
      { name: 'nameColumn', type: 'string', required: true },
      { name: 'dataColumn', type: 'string', required: true },
    ],
  },
  {
    operatorType: 'HeatMap',
    userFriendlyName: 'Heat Map',
    category: 'Visualization',
    description: 'Create heat map visualization',
    inputPorts: 1,
    outputPorts: 1,
    properties: [
      { name: 'xColumn', type: 'string', required: true },
      { name: 'yColumn', type: 'string', required: true },
      { name: 'valueColumn', type: 'string', required: true },
    ],
  },
  {
    operatorType: 'ScatterMatrixChart',
    userFriendlyName: 'Scatter Matrix',
    category: 'Visualization',
    description: 'Create scatter matrix for EDA',
    inputPorts: 1,
    outputPorts: 1,
    properties: [
      { name: 'Selected Attributes', type: 'array', required: true },
      { name: 'Color', type: 'string', required: false },
    ],
  },
  {
    operatorType: 'WordCloud',
    userFriendlyName: 'Word Cloud',
    category: 'Visualization',
    description: 'Create word cloud from text data',
    inputPorts: 1,
    outputPorts: 1,
    properties: [
      { name: 'attribute', type: 'string', required: true },
    ],
  },

  // ============ UTILITIES ============
  {
    operatorType: 'Limit',
    userFriendlyName: 'Limit Rows',
    category: 'Utilities',
    description: 'Limit the number of output rows',
    inputPorts: 1,
    outputPorts: 1,
    properties: [
      { name: 'limit', type: 'number', required: true },
    ],
  },
];

export function getOperatorByType(operatorType: string): OperatorMetadata | undefined {
  return OPERATOR_CATALOG.find(op => op.operatorType === operatorType);
}

export function getOperatorsByCategory(category: string): OperatorMetadata[] {
  return OPERATOR_CATALOG.filter(op => op.category === category);
}

export function getAllOperatorTypes(): string[] {
  return OPERATOR_CATALOG.map(op => op.operatorType);
}
