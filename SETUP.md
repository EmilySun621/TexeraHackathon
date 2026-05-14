# Setup Guide

## Quick Setup (5 minutes)

### 1. Configure Claude API Key

```bash
# Copy the example env file
cp .env.example .env

# Edit .env and add your Claude API key
# Get your key from: https://console.anthropic.com/
nano .env
```

In `.env`, replace `your_api_key_here` with your actual Claude API key:
```
VITE_CLAUDE_API_KEY=sk-ant-api03-...
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the App

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

## Project Structure

```
texera-ai-copilot/
├── src/
│   ├── components/
│   │   ├── WorkflowWizard.tsx    # Main 4-step wizard UI
│   │   └── WorkflowWizard.css    # Wizard styles
│   ├── data/
│   │   ├── operatorCatalog.ts    # 40+ Texera operators with metadata
│   │   ├── frameworks.ts         # CRISP-DM, SEMMA, KDD definitions
│   │   └── guardrails.ts         # Best practice rules
│   ├── types/
│   │   ├── workflow.ts           # Texera WorkflowContent JSON schema
│   │   └── wizard.ts             # Wizard state and validation types
│   ├── utils/
│   │   ├── workflowGenerator.ts  # Claude API prompt + generation
│   │   └── workflowValidator.ts  # JSON validation logic
│   ├── App.tsx                   # Main app component
│   └── App.css                   # Global styles
├── .env.example                  # API key template
├── README.md                     # Full documentation
└── package.json                  # Dependencies
```

## Testing the Workflow Generation

### Example 1: EDA on CSV Data

1. **Step 1**: Select "EDA" (Exploratory Data Analysis)
2. **Step 2**: Select "CSV Upload", upload a sample CSV
3. **Step 3**: Select "CRISP-DM" framework
4. **Step 4**: Keep all guardrails enabled
5. Click "Generate Workflow"

Expected output: A workflow with CSV reader → visualizations (scatter matrix, bar charts) → summary statistics

### Example 2: Predictive Modeling

1. **Step 1**: Select "Predictive Modeling"
2. **Step 2**: Select "Database", configure PostgreSQL connection
3. **Step 3**: Select "SEMMA" framework
4. **Step 4**: Enable all guardrails
5. Click "Generate Workflow"

Expected output: A workflow with data source → sampling → EDA → data preparation → model training → prediction → evaluation

## Troubleshooting

### Build Errors

If you see TypeScript errors about imports:
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Claude API Errors

- **"API key not configured"**: Check that `.env` file exists and contains `VITE_CLAUDE_API_KEY`
- **"Invalid API key"**: Verify your key at https://console.anthropic.com/
- **"Rate limit exceeded"**: Wait a few seconds and try again

### Validation Errors

If the generated workflow fails validation:
- The error message will show which field is invalid
- Common issues: missing operators, invalid port connections
- Try regenerating with different settings or simpler requirements

## Development

### Running in Dev Mode

```bash
npm run dev
```

Hot module replacement (HMR) is enabled - changes appear instantly.

### Building for Production

```bash
npm run build
npm run preview  # Preview production build
```

### Code Quality

```bash
npm run lint     # Check code style
```

## Next Steps

Once you have a generated workflow JSON:

1. **Import to Texera**:
   - Open Texera web UI
   - Click "Import Workflow"
   - Upload the downloaded JSON file

2. **Customize**:
   - Edit operator properties in Texera
   - Adjust connections
   - Add more operators

3. **Execute**:
   - Click "Run" in Texera
   - View results in visualization operators
   - Export data as needed

## Security Warning

⚠️ **For Hackathon/Demo Only**

This app uses `dangerouslyAllowBrowser: true` to call Claude API directly from the browser. This is **NOT production-safe**.

For production deployment:
- Create a backend API proxy
- Move API key to server environment
- Add authentication and rate limiting
- Remove `dangerouslyAllowBrowser` flag

## Support

- Questions? Check the main [README.md](README.md)
- Texera docs: https://texera.readthedocs.io/
- Claude API docs: https://docs.anthropic.com/

Happy hacking! 🚀
