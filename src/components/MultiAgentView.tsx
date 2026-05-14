/**
 * P3-B Multi-Agent view.
 *
 * The user types a complex research question. A planner LLM call splits it
 * into 2-4 independent sub-analyses. Worker LLM calls generate one workflow
 * per sub-analysis in parallel. A merger LLM call combines them into one DAG.
 */

import React, { useState } from 'react';
import { Network, Wand2, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { WorkflowContent } from '../types/workflow';
import type { DknetDataset } from '../types/wizard';
import { DKNET_DATASETS } from '../data/dknetDatasets';
import type { AttemptLog, GeneratedWorkflow, MultiAgentResult } from '../utils/workflowGenerator';
import { runMultiAgent } from '../utils/workflowGenerator';
import { WorkflowResultPanel } from './WorkflowResultPanel';

export const MultiAgentView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [dataset, setDataset] = useState<DknetDataset>(DKNET_DATASETS[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [plan, setPlan] = useState<MultiAgentResult | null>(null);
  const [workflow, setWorkflow] = useState<WorkflowContent | null>(null);
  const [why, setWhy] = useState<Record<string, string>>({});
  const [attempts, setAttempts] = useState<AttemptLog[]>([]);

  const datasetDescription = `${dataset.name} (${dataset.fileName}). Schema: ${dataset.schema}`;

  const handleRun = async () => {
    if (!query.trim()) return;
    setIsRunning(true);
    setError(null);
    setPlan(null);
    setWorkflow(null);
    setAttempts([]);
    try {
      const result = await runMultiAgent(query, datasetDescription);
      setPlan(result);
      setWorkflow(result.merged.workflow);
      setWhy(result.merged.whyExplanations);
      setAttempts(result.merged.attempts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Multi-agent run failed');
      console.error('Multi-agent error:', err);
    } finally {
      setIsRunning(false);
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
          <Network size={22} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
          Multi-Agent Query
        </h2>
        <p>Type a complex research question. A planner splits it into independent sub-analyses; worker agents generate each in parallel; a merger combines them into one DAG.</p>

        <label className="reproduce-label">
          Research question
          <textarea
            className="reproduce-textarea"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="e.g. Compare BMI vs HbA1c in male and female patients, and separately predict diabetes diagnosis from age, BMI, and HbA1c."
            rows={6}
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
          onClick={handleRun}
          className="btn btn-success"
          disabled={isRunning || !query.trim()}
          style={{ marginTop: '1.25rem' }}
        >
          <Wand2 size={20} />
          {isRunning ? 'Planning + generating sub-workflows...' : 'Plan & Generate'}
        </button>

        {error && (
          <div className="error-message" style={{ marginTop: '1rem' }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {plan && (
        <div className="multi-agent-plan">
          <h3>Plan</h3>
          <ol className="subtask-list">
            {plan.subtasks.map((t, i) => (
              <li key={i} className="subtask-item">
                <div className="subtask-header">
                  <CheckCircle2 size={16} color="#10b981" />
                  <strong>{t.name}</strong>
                </div>
                <div className="subtask-goal">{t.goal}</div>
                <div className="subtask-meta">
                  Sub-workflow: {plan.subWorkflows[i].workflow.operators.length} operators,{' '}
                  {plan.subWorkflows[i].workflow.links.length} links
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {workflow && (
        <WorkflowResultPanel
          workflow={workflow}
          whyExplanations={why}
          attempts={attempts}
          onWorkflowUpdated={handleWorkflowUpdated}
          subtitle={`Merged from ${plan?.subtasks.length ?? 0} sub-workflows on ${dataset.name}.`}
        />
      )}
    </div>
  );
};
