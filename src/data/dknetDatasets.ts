/**
 * Curated dkNET-style biomedical datasets bundled with the demo.
 */

import type { DknetDataset } from '../types/wizard';

export const DKNET_DATASETS: DknetDataset[] = [
  {
    id: 'diabetes-cohort',
    name: 'Type 2 Diabetes Patient Cohort',
    description: '25-patient cohort with demographics, HbA1c, glucose, BMI, blood pressure, and diabetes diagnosis label. Suitable for EDA, prediction, and cleaning demos.',
    fileName: '/mock-data/dknet-diabetes.csv',
    schema:
      'patient_id (integer), age (integer), sex (M/F), bmi (float), hba1c (float, %), fasting_glucose (integer, mg/dL), systolic_bp (integer), diastolic_bp (integer), years_with_diabetes (integer), insulin_treatment (0/1), diabetes_diagnosis (0/1, target label)',
  },
];
