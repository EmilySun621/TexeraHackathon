# Example Workflow Test Cases

## Test Case 1: EDA on Iris Dataset (Recommended First Test)

### Wizard Configuration:
1. **Step 1 - Analysis Goal**: Select **"EDA"**
2. **Step 2 - Data Source**: Select **"CSV Upload"**
   - You can use any CSV file, or just proceed without uploading
   - The prompt will mention a generic CSV file
3. **Step 3 - Framework**: Select **"CRISP-DM"**
4. **Step 4 - Guardrails**: Keep all enabled (default)

### Click "Generate Workflow"

### Expected Output:
The generated workflow should contain operators like:
- **CSVFileScan** (or ParallelCSVScan) - Read the data
- **Limit** - Sample data first (guardrail: sample-first)
- **ScatterMatrixChart** - Visualize distributions and correlations
- **Aggregate** - Summary statistics (count, mean, std, etc.)
- **BarChart** or **PieChart** - Category distributions
- **Filter** - Remove null values (guardrail: null-handling)

### How to Verify:
1. Check the download contains valid JSON
2. Look for 5-8 operators in the workflow
3. Verify there's at least one source operator (CSVFileScan)
4. Verify there are visualization operators
5. Check that operators are connected via links

---

## Test Case 2: Predictive Modeling on Customer Data

### Wizard Configuration:
1. **Step 1 - Analysis Goal**: Select **"Predictive Modeling"**
2. **Step 2 - Data Source**: Select **"Database"**
   - Host: `localhost`
   - Port: `5432`
   - Database: `sales_db`
   - Table: `customers`
3. **Step 3 - Framework**: Select **"SEMMA"**
4. **Step 4 - Guardrails**: Keep all enabled

### Expected Output:
- **PostgreSQLSource** - Load data from database
- **Limit** - Sample data (SEMMA: Sample)
- **ScatterMatrixChart** or **BarChart** - Explore data (SEMMA: Explore)
- **Filter** - Remove nulls/outliers (SEMMA: Modify)
- **TypeCasting** - Ensure correct data types (SEMMA: Modify)
- **Split** - Train/test split with seed=1 (guardrail: reproducibility)
- **SklearnDecisionTree** or **SklearnPerceptron** - Model training (SEMMA: Model)
- **SklearnPrediction** - Make predictions
- **Scatterplot** - Evaluate results (SEMMA: Assess)

---

## Test Case 3: Data Cleaning Pipeline

### Wizard Configuration:
1. **Step 1 - Analysis Goal**: Select **"Data Cleaning"**
2. **Step 2 - Data Source**: Select **"CSV Upload"**
3. **Step 3 - Framework**: Select **"KDD"**
4. **Step 4 - Guardrails**: Keep all enabled

### Expected Output:
- **CSVFileScan** - Data source (KDD: Selection)
- **Filter** - Remove invalid rows (KDD: Preprocessing)
- **Distinct** - Remove duplicates (KDD: Preprocessing)
- **TypeCasting** - Fix data types (KDD: Transformation)
- **Projection** - Select relevant columns (KDD: Transformation)
- **Aggregate** - Data quality metrics (KDD: Interpretation)
- **BarChart** - Visualize cleaning results (KDD: Interpretation)

---

## Test Case 4: NLP Text Analysis

### Wizard Configuration:
1. **Step 1 - Analysis Goal**: Select **"NLP"**
2. **Step 2 - Data Source**: Select **"CSV Upload"**
3. **Step 3 - Framework**: Select **"CRISP-DM"**
4. **Step 4 - Guardrails**: Keep all enabled

### Expected Output:
- **CSVFileScan** - Load text data
- **Filter** - Remove empty text fields
- **KeywordSearch** or **Regex** - Extract patterns
- **PythonUDF** - Text preprocessing/tokenization
- **WordCloud** - Visualize word frequencies
- **Aggregate** - Text statistics (word count, etc.)
- **BarChart** - Top keywords

---

## Validation Checklist

For each generated workflow, verify:

### ✅ Structure
- [ ] Valid JSON format
- [ ] Contains `operators` array
- [ ] Contains `operatorPositions` object
- [ ] Contains `links` array
- [ ] Contains `commentBoxes` array (can be empty)
- [ ] Contains `settings` object with `dataTransferBatchSize`

### ✅ Operators
- [ ] At least one source operator (0 input ports)
- [ ] All operator types exist in the catalog
- [ ] Each operator has unique ID (format: `{type}-operator-{uuid}`)
- [ ] Each operator has `operatorID`, `operatorType`, `operatorVersion`
- [ ] Required properties are present

### ✅ Positions
- [ ] Every operator has a position entry
- [ ] Positions have numeric x and y coordinates
- [ ] Operators are laid out left-to-right (x increases)

### ✅ Links
- [ ] Each link has unique ID (format: `link-{uuid}`)
- [ ] Source and target operators exist
- [ ] Source and target ports exist
- [ ] No self-loops (operator linking to itself)

### ✅ Guardrails Applied
- [ ] Sample operator (Limit) before expensive operations
- [ ] Visualization operators included
- [ ] Filter for null handling
- [ ] Random seeds set for Split operator
- [ ] TypeCasting for type safety

---

## Import to Texera

After downloading the workflow JSON:

1. Open Texera web UI: http://localhost:8080 (or your Texera instance)
2. Click **"Workflows"** in the navigation
3. Click **"Import"** or **"Upload Workflow"**
4. Select the downloaded JSON file
5. The workflow should appear on the canvas
6. Click **"Run"** to execute

If import fails, check the browser console for errors and verify the JSON structure.

---

## Debugging Tips

### If generation fails:
- Check browser console for errors
- Verify `.env` file has correct API key
- Try refreshing the page
- Try with simpler configuration first (EDA + CSV + CRISP-DM)

### If validation fails:
- Look at the error message - it shows which field is invalid
- Common issue: Claude may hallucinate operator types not in catalog
- Try regenerating - Claude's output varies

### If workflow looks wrong:
- Check if operators make sense for the analysis goal
- Verify links connect operators in logical order
- Look for source → transformation → sink flow

---

## Success Criteria

A successful test should:
1. ✅ Generate workflow in < 10 seconds
2. ✅ Pass all validation checks (0 errors)
3. ✅ Have 5-12 operators
4. ✅ Include at least 1 visualization
5. ✅ Follow the selected framework methodology
6. ✅ Apply enabled guardrails
7. ✅ Be importable to Texera without errors

Good luck with your hackathon demo! 🚀
