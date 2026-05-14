# Texera AI Workflow Copilot

An intelligent workflow generator for Apache Texera powered by Claude AI. Generate complete data analysis workflows through a simple 4-step wizard interface.

## Features

- 🧙 **4-Step Wizard Interface**: Intuitive guided workflow creation
- 🎯 **Multiple Analysis Goals**: EDA, Predictive Modeling, Data Cleaning, NLP
- 📊 **Scientific Frameworks**: CRISP-DM, SEMMA, KDD methodologies
- 🛡️ **Built-in Guardrails**: Automatic best practices enforcement
- ✅ **Workflow Validation**: Comprehensive JSON schema and connectivity validation
- 🤖 **Claude AI Integration**: Powered by Claude 3.5 Sonnet for intelligent workflow generation

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Claude API key (get one at https://console.anthropic.com/)

### Installation

```bash
# Install dependencies
npm install

# Configure your Claude API key
cp .env.example .env
# Edit .env and add your VITE_CLAUDE_API_KEY
```

### Running the App

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

## Usage

### Step 1: Select Analysis Goal

Choose what you want to accomplish:
- **EDA**: Exploratory Data Analysis - understand distributions, correlations, patterns
- **Predictive Modeling**: Build and evaluate ML models
- **Data Cleaning**: Clean, transform, and prepare data
- **NLP**: Natural Language Processing on text data

### Step 2: Choose Data Source

Configure your data input:
- **CSV Upload**: Upload a local CSV file
- **Database**: Connect to PostgreSQL database
- **API**: Fetch data from REST API endpoint

### Step 3: Select Framework

Choose a scientific methodology:
- **CRISP-DM**: Business Understanding → Data Understanding → Preparation → Modeling → Evaluation
- **SEMMA**: Sample → Explore → Modify → Model → Assess
- **KDD**: Selection → Preprocessing → Transformation → Mining → Interpretation

### Step 4: Review Guardrails

Automatically enabled best practices:
- Data validation and schema checking
- Error handling operators
- Sample data before expensive operations
- Type safety with proper casting
- Visualization for intermediate results
- Reproducibility with random seeds
- Null value handling
- Performance optimization (early filtering)

### Generate & Download

Click "Generate Workflow" to create your Texera workflow JSON. The generated workflow is:
- ✅ Validated for correct structure
- ✅ Checked for valid operators
- ✅ Verified for proper port connections
- 📥 Downloadable as JSON file

## Operator Catalog

The copilot has access to 40+ Texera operators including:

**Data Sources**: CSVFileScan, PostgreSQL, JSONLines, API fetchers
**Data Cleaning**: Filter, Projection, Distinct, TypeCasting
**Analytics**: Aggregate, Sort, Join, Split
**Python UDF**: Custom Python functions
**Machine Learning**: Sklearn models (Perceptron, Decision Tree, etc.)
**Visualization**: Scatter, Bar, Line, Pie, Heat Map, Word Cloud, etc.
**Utilities**: Limit, sampling, etc.

## Project Structure

```
src/
├── components/
│   ├── WorkflowWizard.tsx    # Main wizard component
│   └── WorkflowWizard.css    # Wizard styles
├── data/
│   ├── operatorCatalog.ts    # 40+ Texera operators
│   ├── frameworks.ts         # CRISP-DM, SEMMA, KDD definitions
│   └── guardrails.ts         # Best practice rules
├── types/
│   ├── workflow.ts           # Texera workflow JSON schema
│   └── wizard.ts             # Wizard state types
└── utils/
    ├── workflowGenerator.ts  # Claude API integration
    └── workflowValidator.ts  # Workflow validation logic
```

## How It Works

1. **User Input**: Wizard collects analysis requirements
2. **Prompt Construction**: Combines operator catalog + framework rules + guardrails
3. **Claude Generation**: Claude 3.5 Sonnet generates workflow JSON
4. **Validation**: Validates structure, operators, and connections
5. **Export**: User downloads valid Texera workflow

## Validation

The validator checks:
- ✅ JSON structure matches Texera WorkflowContent schema
- ✅ All operators exist in the catalog
- ✅ Required operator properties are present
- ✅ Operator IDs are unique
- ✅ Links reference valid operators and ports
- ✅ Workflow has at least one source operator
- ⚠️ Connectivity warnings (disconnected operators)

## Technical Details

- **Frontend**: React 18 + TypeScript + Vite
- **AI**: Claude 3.5 Sonnet via @anthropic-ai/sdk
- **Styling**: CSS with gradient themes
- **Icons**: lucide-react

## Security Note

⚠️ **Important**: This demo uses `dangerouslyAllowBrowser: true` for Claude API calls. In production, you should:
1. Move API calls to a backend proxy
2. Never expose API keys in client-side code
3. Implement rate limiting and authentication

## Contributing

This project was created for the Apache Texera Hackathon. Contributions welcome!

## License

Apache License 2.0

## Author

Created during the Texera Hackathon 2025
