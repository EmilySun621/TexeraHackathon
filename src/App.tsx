import { useState } from 'react';
import { Wand2, FileText, Network } from 'lucide-react';
import { WorkflowWizard } from './components/WorkflowWizard';
import { ReproducePaperView } from './components/ReproducePaperView';
import { MultiAgentView } from './components/MultiAgentView';
import './App.css';

type Mode = 'wizard' | 'reproduce' | 'multi';

const MODES: { id: Mode; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'wizard', label: 'Wizard', icon: <Wand2 size={16} />, description: 'Guided 4-step builder' },
  { id: 'reproduce', label: 'Reproduce a paper', icon: <FileText size={16} />, description: 'Paste methods, get a workflow' },
  { id: 'multi', label: 'Multi-agent query', icon: <Network size={16} />, description: 'Complex question → parallel DAG' },
];

function App() {
  const [mode, setMode] = useState<Mode>('wizard');

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-title">
          <span className="app-title-mark">·</span>
          <h1>Texera AI Workflow Copilot</h1>
        </div>
        <p className="app-tagline">Generate data analysis workflows for biomedical research with AI assistance.</p>
      </header>

      <nav className="mode-tabs" aria-label="Mode">
        {MODES.map(m => (
          <button
            key={m.id}
            className={`mode-tab ${mode === m.id ? 'active' : ''}`}
            onClick={() => setMode(m.id)}
            type="button"
          >
            <span className="mode-tab-icon">{m.icon}</span>
            <span className="mode-tab-label">
              <strong>{m.label}</strong>
              <small>{m.description}</small>
            </span>
          </button>
        ))}
      </nav>

      <main className="app-main">
        {mode === 'wizard' && <WorkflowWizard />}
        {mode === 'reproduce' && <ReproducePaperView />}
        {mode === 'multi' && <MultiAgentView />}
      </main>
    </div>
  );
}

export default App;
