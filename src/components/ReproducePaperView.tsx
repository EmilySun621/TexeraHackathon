/**
 * P3-A Reproduce-a-Paper view.
 *
 * The user pastes a paper abstract / methods section, picks a target dataset,
 * and the LLM produces a workflow that reproduces the paper's pipeline.
 */

import React, { useState } from 'react';
import { FileText, Wand2, AlertCircle } from 'lucide-react';
import type { WorkflowContent } from '../types/workflow';
import type { DknetDataset } from '../types/wizard';
import { DKNET_DATASETS } from '../data/dknetDatasets';
import type { AttemptLog, GeneratedWorkflow } from '../utils/workflowGenerator';
import { reproduceFromPaper } from '../utils/workflowGenerator';
import { WorkflowResultPanel } from './WorkflowResultPanel';

export const ReproducePaperView: React.FC = () => {
  const [paperText, setPaperText] = useState('');
  const [dataset, setDataset] = useState<DknetDataset>(DKNET_DATASETS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [workflow, setWorkflow] = useState<WorkflowContent | null>(null);
  const [why, setWhy] = useState<Record<string, string>>({});
  const [attempts, setAttempts] = useState<AttemptLog[]>([]);

  const datasetDescription = `${dataset.name} (${dataset.fileName}). Schema: ${dataset.schema}`;

  const handleGenerate = async () => {
    if (!paperText.trim()) return;
    setIsGenerating(true);
    setError(null);
    setAttempts([]);
    try {
      const result = await reproduceFromPaper(paperText, datasetDescription);
      setWorkflow(result.workflow);
      setWhy(result.whyExplanations);
      setAttempts(result.attempts);
    } catch (err) {
      const log = (err as any)?.attempts as AttemptLog[] | undefined;
      if (log) setAttempts(log);
      setError(err instanceof Error ? err.message : 'Failed to reproduce paper');
      console.error('Reproduce error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleWorkflowUpdated = (updated: GeneratedWorkflow) => {
    setWorkflow(updated.workflow);
    setWhy(updated.whyExplanations);
    setAttempts(updated.attempts);
  };

  return (
    <div className="wizard-container">
      <div className="step-container">
        <h2>
          <FileText size={22} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
          Reproduce a Paper
        </h2>
        <p>Paste the paper's methods or abstract; AI will generate a workflow that reproduces the pipeline on the chosen dataset. Each operator will be annotated with the paper section that motivates it.</p>

        <label className="reproduce-label">
          Paper text (abstract or methods section)
          <textarea
            className="reproduce-textarea"
            value={paperText}
            onChange={e => setPaperText(e.target.value)}
            placeholder="Paste a paper's methods section here. For example: 'We trained a logistic regression classifier to predict T2D diagnosis from HbA1c, fasting glucose, age, and BMI. Subjects were split 80/20 (train/test) with a fixed random seed. We report AUROC on the held-out test set...'"
            rows={10}
          />
        </label>

        <div className="reproduce-dataset-picker">
          <h3>Target dataset</h3>
          <div className="options-grid">
            {DKNET_DATASETS.map(ds => (
              <div
                key={ds.id}
                className={`option-card ${dataset.id === ds.id ? 'selected' : ''}`}
                onClick={() => setDataset(ds)}
              >
                <h3>{ds.name}</h3>
                <p>{ds.description}</p>
                <small style={{ color: '#64748b' }}>Schema: {ds.schema}</small>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          className="btn btn-success"
          disabled={isGenerating || !paperText.trim()}
          style={{ marginTop: '1.25rem' }}
        >
          <Wand2 size={20} />
          {isGenerating ? 'Reproducing...' : 'Reproduce on Dataset'}
        </button>

        {error && (
          <div className="error-message" style={{ marginTop: '1rem' }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {workflow && (
        <WorkflowResultPanel
          workflow={workflow}
          whyExplanations={why}
          attempts={attempts}
          onWorkflowUpdated={handleWorkflowUpdated}
          subtitle={`Reproduced from paper on ${dataset.name}.`}
        />
      )}
    </div>
  );
};
