/**
 * Shared post-generation result panel used by all three modes
 * (wizard / reproduce-paper / multi-agent).
 *
 * Renders: success header + stats, Why-per-operator panel, NL edit chat,
 * attempts log, JSON preview, download.
 */

import React, { useState } from 'react';
import { CheckCircle, Download, Info, MessageSquare, RefreshCw, Wand2 } from 'lucide-react';
import type { WorkflowContent } from '../types/workflow';
import type { AttemptLog, GeneratedWorkflow } from '../utils/workflowGenerator';
import { modifyWorkflow } from '../utils/workflowGenerator';

interface Props {
  workflow: WorkflowContent;
  whyExplanations: Record<string, string>;
  attempts: AttemptLog[];
  /**
   * Callback fired after a successful NL edit so the parent can replace its
   * stored workflow state. The panel manages the NL textarea + history itself.
   */
  onWorkflowUpdated: (updated: GeneratedWorkflow) => void;
  /** Optional subtitle shown below the success header (e.g. "Reproduced from Smith et al. 2023"). */
  subtitle?: string;
}

export const WorkflowResultPanel: React.FC<Props> = ({
  workflow,
  whyExplanations,
  attempts,
  onWorkflowUpdated,
  subtitle,
}) => {
  const [nlInstruction, setNlInstruction] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editHistory, setEditHistory] = useState<string[]>([]);

  const handleDownload = () => {
    const json = JSON.stringify(workflow, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `texera-workflow-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleNlEdit = async () => {
    const instruction = nlInstruction.trim();
    if (!instruction) return;
    setIsEditing(true);
    setEditError(null);
    try {
      const updated = await modifyWorkflow(workflow, whyExplanations, instruction);
      onWorkflowUpdated(updated);
      setEditHistory(prev => [...prev, instruction]);
      setNlInstruction('');
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Edit failed');
      console.error('Edit error:', err);
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <>
      {attempts.length > 0 && <AttemptsBanner attempts={attempts} />}

      <div className="workflow-result">
        <div className="result-header">
          <CheckCircle size={24} color="#10b981" />
          <h2>Workflow Generated Successfully!</h2>
        </div>
        {subtitle && <p className="result-subtitle">{subtitle}</p>}
        <div className="result-stats">
          <div className="stat">
            <span className="stat-value">{workflow.operators.length}</span>
            <span className="stat-label">Operators</span>
          </div>
          <div className="stat">
            <span className="stat-value">{workflow.links.length}</span>
            <span className="stat-label">Links</span>
          </div>
        </div>
        <button onClick={handleDownload} className="btn btn-primary">
          <Download size={20} />
          Download Workflow JSON
        </button>

        {Object.keys(whyExplanations).length > 0 && (
          <div className="why-panel">
            <h3>Why each step is here</h3>
            <ul className="why-list">
              {workflow.operators.map(op => {
                const why = whyExplanations[op.operatorID];
                if (!why) return null;
                return (
                  <li key={op.operatorID} className="why-item">
                    <div className="why-item-header">
                      <Info size={16} />
                      <strong>{op.customDisplayName || op.operatorType}</strong>
                      <span className="why-item-type">({op.operatorType})</span>
                    </div>
                    <div className="why-item-body">{why}</div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="nl-edit-panel">
          <h3>
            <MessageSquare size={18} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />
            Refine in natural language
          </h3>
          <p className="nl-edit-hint">
            Examples: "Replace the decision tree with XGBoost", "Add 5-fold cross-validation", "Drop rows where hba1c &lt; 5", "Add a heat map of correlations"
          </p>
          <textarea
            className="nl-edit-input"
            value={nlInstruction}
            onChange={e => setNlInstruction(e.target.value)}
            placeholder="Describe the change you want to make..."
            rows={3}
            disabled={isEditing}
          />
          <button onClick={handleNlEdit} className="btn btn-primary" disabled={isEditing || !nlInstruction.trim()}>
            <Wand2 size={18} />
            {isEditing ? 'Applying edit...' : 'Apply edit'}
          </button>
          {editError && (
            <div className="error-message" style={{ marginTop: '0.75rem' }}>
              {editError}
            </div>
          )}
          {editHistory.length > 0 && (
            <div className="nl-edit-history">
              <strong>Edit history:</strong>
              <ol>
                {editHistory.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ol>
            </div>
          )}
        </div>

        <details className="workflow-preview">
          <summary>Preview Workflow JSON</summary>
          <pre>{JSON.stringify(workflow, null, 2)}</pre>
        </details>
      </div>
    </>
  );
};

const AttemptsBanner: React.FC<{ attempts: AttemptLog[] }> = ({ attempts }) => {
  if (attempts.length === 1 && attempts[0].errorCount === 0) return null;
  return (
    <div className="attempts-banner">
      <RefreshCw size={16} />
      <div>
        <strong>Auto-fix log:</strong>
        <ul className="attempts-list">
          {attempts.map(a => (
            <li key={a.attempt}>
              Attempt {a.attempt}:{' '}
              {a.errorCount === 0
                ? 'valid ✓'
                : `${a.errorCount} validation error(s) — retrying with errors fed back to LLM`}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
