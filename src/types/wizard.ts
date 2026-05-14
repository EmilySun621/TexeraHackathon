/**
 * Wizard configuration types
 */

export type AnalysisGoal =
  | 'EDA'
  | 'Predictive Modeling'
  | 'Data Cleaning'
  | 'NLP';

export type DataSource =
  | 'CSV Upload'
  | 'Database'
  | 'API'
  | 'dkNET Dataset';

export interface DknetDataset {
  id: string;
  name: string;
  description: string;
  fileName: string;
  schema: string;
}

export type ScientificFramework =
  | 'CRISP-DM'
  | 'SEMMA'
  | 'KDD';

export interface Guardrail {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface WizardState {
  step: number;
  analysisGoal?: AnalysisGoal;
  dataSource?: DataSource;
  framework?: ScientificFramework;
  guardrails: Guardrail[];
  csvFile?: File;
  databaseConfig?: {
    type: 'postgresql' | 'mysql';
    host: string;
    port: number;
    database: string;
    table: string;
  };
  apiConfig?: {
    url: string;
    method: 'GET' | 'POST';
    headers?: Record<string, string>;
  };
  dknetDataset?: DknetDataset;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: string[];
}
