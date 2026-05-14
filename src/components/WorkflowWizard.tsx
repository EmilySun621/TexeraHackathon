/**
 * 4-Step Workflow Wizard Component.
 * Post-generation UI (Why panel, NL edit, attempts log, download) is in
 * WorkflowResultPanel and shared with the other modes.
 */

import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Wand2, AlertCircle } from 'lucide-react';
import type { WizardState, AnalysisGoal, DataSource, ScientificFramework } from '../types/wizard';
import type { WorkflowContent } from '../types/workflow';
import { DEFAULT_GUARDRAILS } from '../data/guardrails';
import type { AttemptLog, GeneratedWorkflow } from '../utils/workflowGenerator';
import { generateWorkflow } from '../utils/workflowGenerator';
import { DKNET_DATASETS } from '../data/dknetDatasets';
import { WorkflowResultPanel } from './WorkflowResultPanel';
import './WorkflowWizard.css';

const ANALYSIS_GOALS: AnalysisGoal[] = ['EDA', 'Predictive Modeling', 'Data Cleaning', 'NLP'];
const DATA_SOURCES: DataSource[] = ['CSV Upload', 'Database', 'API', 'dkNET Dataset'];
const FRAMEWORKS: ScientificFramework[] = ['CRISP-DM', 'SEMMA', 'KDD'];

export const WorkflowWizard: React.FC = () => {
  const [wizardState, setWizardState] = useState<WizardState>({
    step: 1,
    guardrails: DEFAULT_GUARDRAILS,
  });

  const [generatedWorkflow, setGeneratedWorkflow] = useState<WorkflowContent | null>(null);
  const [whyExplanations, setWhyExplanations] = useState<Record<string, string>>({});
  const [attempts, setAttempts] = useState<AttemptLog[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateState = (updates: Partial<WizardState>) => {
    setWizardState(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (wizardState.step < 4) updateState({ step: wizardState.step + 1 });
  };

  const prevStep = () => {
    if (wizardState.step > 1) updateState({ step: wizardState.step - 1 });
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setAttempts([]);

    try {
      const result = await generateWorkflow(wizardState);
      setGeneratedWorkflow(result.workflow);
      setWhyExplanations(result.whyExplanations);
      setAttempts(result.attempts);
    } catch (err) {
      const log = (err as any)?.attempts as AttemptLog[] | undefined;
      if (log) setAttempts(log);
      setError(err instanceof Error ? err.message : 'Failed to generate workflow');
      console.error('Generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleWorkflowUpdated = (updated: GeneratedWorkflow) => {
    setGeneratedWorkflow(updated.workflow);
    setWhyExplanations(updated.whyExplanations);
    setAttempts(updated.attempts);
  };

  return (
    <div className="wizard-container">
      <div className="wizard-progress">
        {[1, 2, 3, 4].map(step => (
          <div key={step} className={`progress-step ${wizardState.step >= step ? 'active' : ''}`}>
            <div className="step-circle">{step}</div>
            <div className="step-label">
              {step === 1 && 'Analysis Goal'}
              {step === 2 && 'Data Source'}
              {step === 3 && 'Framework'}
              {step === 4 && 'Guardrails'}
            </div>
          </div>
        ))}
      </div>

      <div className="wizard-content">
        {wizardState.step === 1 && (
          <Step1AnalysisGoal selected={wizardState.analysisGoal} onSelect={goal => updateState({ analysisGoal: goal })} />
        )}

        {wizardState.step === 2 && (
          <Step2DataSource
            selected={wizardState.dataSource}
            onSelect={source => updateState({ dataSource: source })}
            wizardState={wizardState}
            updateState={updateState}
          />
        )}

        {wizardState.step === 3 && (
          <Step3Framework selected={wizardState.framework} onSelect={framework => updateState({ framework })} />
        )}

        {wizardState.step === 4 && (
          <Step4Guardrails
            guardrails={wizardState.guardrails}
            onToggle={id => {
              const updated = wizardState.guardrails.map(g => (g.id === id ? { ...g, enabled: !g.enabled } : g));
              updateState({ guardrails: updated });
            }}
          />
        )}
      </div>

      <div className="wizard-actions">
        {wizardState.step > 1 && (
          <button onClick={prevStep} className="btn btn-secondary">
            <ChevronLeft size={20} />
            Previous
          </button>
        )}

        {wizardState.step < 4 && (
          <button onClick={nextStep} className="btn btn-primary" disabled={!canProceed(wizardState)}>
            Next
            <ChevronRight size={20} />
          </button>
        )}

        {wizardState.step === 4 && (
          <button
            onClick={handleGenerate}
            className="btn btn-success"
            disabled={isGenerating || !wizardState.analysisGoal || !wizardState.dataSource}
          >
            <Wand2 size={20} />
            {isGenerating ? 'Generating...' : 'Generate Workflow'}
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {generatedWorkflow && (
        <WorkflowResultPanel
          workflow={generatedWorkflow}
          whyExplanations={whyExplanations}
          attempts={attempts}
          onWorkflowUpdated={handleWorkflowUpdated}
        />
      )}
    </div>
  );
};

function canProceed(state: WizardState): boolean {
  if (state.step === 1) return !!state.analysisGoal;
  if (state.step === 2) return !!state.dataSource;
  if (state.step === 3) return !!state.framework;
  return true;
}

// ============ Step Components ============

interface Step1Props {
  selected?: AnalysisGoal;
  onSelect: (goal: AnalysisGoal) => void;
}

const Step1AnalysisGoal: React.FC<Step1Props> = ({ selected, onSelect }) => {
  const descriptions: Record<AnalysisGoal, string> = {
    'EDA': 'Exploratory Data Analysis - Understand data distributions, correlations, and patterns',
    'Predictive Modeling': 'Build and evaluate machine learning models for predictions',
    'Data Cleaning': 'Clean, transform, and prepare data for analysis',
    'NLP': 'Natural Language Processing - Analyze text data',
  };

  return (
    <div className="step-container">
      <h2>Step 1: Select Analysis Goal</h2>
      <p>What do you want to accomplish with your data?</p>
      <div className="options-grid">
        {ANALYSIS_GOALS.map(goal => (
          <div key={goal} className={`option-card ${selected === goal ? 'selected' : ''}`} onClick={() => onSelect(goal)}>
            <h3>{goal}</h3>
            <p>{descriptions[goal]}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

interface Step2Props {
  selected?: DataSource;
  onSelect: (source: DataSource) => void;
  wizardState: WizardState;
  updateState: (updates: Partial<WizardState>) => void;
}

const Step2DataSource: React.FC<Step2Props> = ({ selected, onSelect, wizardState, updateState }) => {
  return (
    <div className="step-container">
      <h2>Step 2: Select Data Source</h2>
      <p>Where is your data located?</p>
      <div className="options-grid">
        {DATA_SOURCES.map(source => (
          <div key={source} className={`option-card ${selected === source ? 'selected' : ''}`} onClick={() => onSelect(source)}>
            <h3>{source}</h3>
          </div>
        ))}
      </div>

      {selected === 'CSV Upload' && (
        <div className="data-source-config">
          <label>
            Upload CSV File:
            <input
              type="file"
              accept=".csv"
              onChange={e => updateState({ csvFile: e.target.files?.[0] })}
            />
          </label>
          {wizardState.csvFile && <div className="file-info">Selected: {wizardState.csvFile.name}</div>}
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f9ff', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
            <strong>Quick Test:</strong> No CSV file? No problem! The generator will create a workflow for a sample employee dataset with columns: id, name, age, department, salary, years_experience, performance_rating
          </div>
        </div>
      )}

      {selected === 'dkNET Dataset' && (
        <div className="data-source-config">
          <p style={{ marginTop: 0, color: '#475569' }}>
            Pick a curated biomedical dataset. The workflow will reference it with CSVFileScan.
          </p>
          <div className="options-grid">
            {DKNET_DATASETS.map(ds => (
              <div
                key={ds.id}
                className={`option-card ${wizardState.dknetDataset?.id === ds.id ? 'selected' : ''}`}
                onClick={() => updateState({ dknetDataset: ds })}
              >
                <h3>{ds.name}</h3>
                <p>{ds.description}</p>
                <small style={{ color: '#64748b' }}>Schema: {ds.schema}</small>
              </div>
            ))}
          </div>
        </div>
      )}

      {selected === 'Database' && (
        <div className="data-source-config">
          <input
            type="text"
            placeholder="Host (e.g., localhost)"
            onChange={e => updateState({
              databaseConfig: { ...wizardState.databaseConfig!, host: e.target.value, type: 'postgresql', port: 5432, database: '', table: '' }
            })}
          />
          <input
            type="number"
            placeholder="Port (default: 5432)"
            defaultValue={5432}
            onChange={e => updateState({
              databaseConfig: { ...wizardState.databaseConfig!, port: parseInt(e.target.value) }
            })}
          />
          <input
            type="text"
            placeholder="Database name"
            onChange={e => updateState({
              databaseConfig: { ...wizardState.databaseConfig!, database: e.target.value }
            })}
          />
          <input
            type="text"
            placeholder="Table name"
            onChange={e => updateState({
              databaseConfig: { ...wizardState.databaseConfig!, table: e.target.value }
            })}
          />
        </div>
      )}
    </div>
  );
};

interface Step3Props {
  selected?: ScientificFramework;
  onSelect: (framework: ScientificFramework) => void;
}

const Step3Framework: React.FC<Step3Props> = ({ selected, onSelect }) => {
  const descriptions: Record<ScientificFramework, string> = {
    'CRISP-DM': 'Cross-Industry Standard Process - Business Understanding → Data Understanding → Preparation → Modeling → Evaluation',
    'SEMMA': 'SAS Methodology - Sample → Explore → Modify → Model → Assess',
    'KDD': 'Knowledge Discovery in Databases - Selection → Preprocessing → Transformation → Mining → Interpretation',
  };

  return (
    <div className="step-container">
      <h2>Step 3: Select Scientific Framework</h2>
      <p>Choose a methodology to structure your workflow</p>
      <div className="options-grid">
        {FRAMEWORKS.map(framework => (
          <div key={framework} className={`option-card ${selected === framework ? 'selected' : ''}`} onClick={() => onSelect(framework)}>
            <h3>{framework}</h3>
            <p>{descriptions[framework]}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

interface Step4Props {
  guardrails: WizardState['guardrails'];
  onToggle: (id: string) => void;
}

const Step4Guardrails: React.FC<Step4Props> = ({ guardrails, onToggle }) => {
  return (
    <div className="step-container">
      <h2>Step 4: Guardrails</h2>
      <p>These best practices will be automatically applied to your workflow</p>
      <div className="guardrails-list">
        {guardrails.map(guardrail => (
          <div key={guardrail.id} className="guardrail-item">
            <label>
              <input type="checkbox" checked={guardrail.enabled} onChange={() => onToggle(guardrail.id)} />
              <div>
                <strong>{guardrail.name}</strong>
                <p>{guardrail.description}</p>
              </div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};
