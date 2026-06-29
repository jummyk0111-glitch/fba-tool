const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
const multer = require('multer');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FBA Intelligence — Amazon Product Analyzer</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0a0f1e; --surface: #111827; --border: #1e2d45;
    --accent: #f59e0b; --accent2: #10b981; --danger: #ef4444;
    --text: #f1f5f9; --muted: #64748b; --subtle: #94a3b8;
  }
  body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; line-height: 1.6; }
  header { border-bottom: 1px solid var(--border); padding: 20px 40px; display: flex; align-items: center; gap: 12px; background: var(--surface); }
  .logo { font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
  .logo span { color: var(--accent); }
  .badge { font-size: 11px; background: var(--accent); color: #000; padding: 2px 8px; border-radius: 20px; font-weight: 600; }
  .container { max-width: 900px; margin: 0 auto; padding: 48px 24px; }
  .hero { text-align: center; margin-bottom: 48px; }
  .hero h1 { font-size: 36px; font-weight: 700; letter-spacing: -1px; margin-bottom: 12px; line-height: 1.2; }
  .hero h1 span { color: var(--accent); }
  .hero p { color: var(--subtle); font-size: 16px; max-width: 520px; margin: 0 auto; }
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 24px; margin-bottom: 28px; }
  .card label { display: block; font-size: 13px; font-weight: 600; color: var(--subtle); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 10px; }
  .api-row { display: flex; gap: 10px; }
  .api-row input { flex: 1; background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 12px 16px; color: var(--text); font-family: 'JetBrains Mono', monospace; font-size: 13px; outline: none; transition: border-color 0.2s; }
  .api-row input:focus { border-color: var(--accent); }
  .api-row input::placeholder { color: var(--muted); }
  .btn-save { background: var(--accent); color: #000; border: none; border-radius: 8px; padding: 12px 20px; font-weight: 600; font-size: 13px; cursor: pointer; white-space: nowrap; }
  .hint { font-size: 12px; color: var(--muted); margin-top: 8px; }
  .hint a { color: var(--accent); text-decoration: none; }
  .section-title { font-size: 13px; font-weight: 600; color: var(--subtle); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 20px; }
  .file-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px; }
  .file-card { border: 1px dashed var(--border); border-radius: 10px; padding: 16px; cursor: pointer; transition: all 0.2s; position: relative; }
  .file-card:hover { border-color: var(--accent); background: rgba(245,158,11,0.05); }
  .file-card.loaded { border-color: var(--accent2); border-style: solid; background: rgba(16,185,129,0.05); }
  .file-card input[type="file"] { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }
  .file-card-name { font-weight: 600; font-size: 14px; margin-bottom: 4px; }
  .file-card-desc { font-size: 12px; color: var(--muted); }
  .file-card-status { font-size: 11px; margin-top: 8px; font-weight: 500; color: var(--muted); }
  .file-card.loaded .file-card-status { color: var(--accent2); }
  .icon { font-size: 20px; margin-bottom: 8px; }
  .analyze-btn { width: 100%; background: var(--accent); color: #000; border: none; border-radius: 10px; padding: 16px; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
  .analyze-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
  .analyze-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
  .loading { display: none; text-align: center; padding: 48px; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; margin-bottom: 28px; }
  .loading.active { display: block; }
  .spinner { width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-text { color: var(--subtle); font-size: 15px; }
  .loading-step { font-size: 12px; color: var(--muted); margin-top: 8px; font-family: 'JetBrains Mono', monospace; }
  #results { display: none; }
  #results.active { display: block; }
  .results-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
  .results-title { font-size: 22px; font-weight: 700; }
  .btn-reset { background: transparent; border: 1px solid var(--border); color: var(--subtle); border-radius: 8px; padding: 8px 16px; font-size: 13px; cursor: pointer; }
  .btn-reset:hover { border-color: var(--accent); color: var(--accent); }
  .product-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 28px; margin-bottom: 20px; position: relative; overflow: hidden; }
  .product-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, var(--accent), var(--accent2)); }
  .product-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
  .product-name { font-size: 16px; font-weight: 600; flex: 1; line-height: 1.4; }
  .score-badge { display: flex; flex-direction: column; align-items: center; background: var(--bg); border: 1px solid var(--border); border-radius: 10px; padding: 10px 16px; min-width: 80px; flex-shrink: 0; }
  .score-number { font-size: 28px; font-weight: 700; line-height: 1; font-family: 'JetBrains Mono', monospace; }
  .score-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
  .score-high { color: var(--accent2); } .score-med { color: var(--accent); } .score-low { color: var(--danger); }
  .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
  .metric { background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 12px; }
  .metric-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .metric-value { font-size: 16px; font-weight: 700; font-family: 'JetBrains Mono', monospace; }
  .analysis-section { margin-bottom: 16px; }
  .analysis-label { font-size: 12px; font-weight: 600; color: var(--accent); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; }
  .analysis-text { font-size: 14px; color: var(--subtle); line-height: 1.7; }
  .tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
  .tag { font-size: 12px; padding: 4px 10px; border-radius: 20px; font-weight: 500; }
  .tag-green { background: rgba(16,185,129,0.15); color: var(--accent2); }
  .tag-yellow { background: rgba(245,158,11,0.15); color: var(--accent); }
  .verdict { background: var(--bg); border-left: 3px solid var(--accent); padding: 14px 16px; border-radius: 0 8px 8px 0; margin-top: 16px; }
  .verdict-label { font-size: 11px; font-weight: 600; color: var(--accent); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px; }
  .verdict-text { font-size: 14px; color: var(--text); font-weight: 500; }
  .error-box { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 10px; padding: 16px; color: #fca5a5; font-size: 14px; margin-bottom: 20px; display: none; }
  .error-box.active { display: block; }
  .comp-grid { display: grid; grid-template-columns: repeat(1, 1fr); gap: 8px; margin-top: 8px; }
  .comp-card { background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 12px; }
  .comp-name { font-weight: 600; font-size: 13px; margin-bottom: 4px; color: var(--text); }
  .comp-reason { font-size: 12px; color: var(--subtle); margin-bottom: 6px; }
  .comp-badges { display: flex; gap: 6px; }
  .comp-badge { font-size: 11px; padding: 2px 8px; border-radius: 20px; font-weight: 500; }
  .comp-badge-cost { background: rgba(16,185,129,0.15); color: var(--accent2); }
  .comp-badge-impact { background: rgba(245,158,11,0.15); color: var(--accent); }
  .pdf-btn { background: #fff; color: #000; border: none; border-radius: 8px; padding: 10px 20px; font-size: 13px; font-weight: 600; cursor: pointer; margin-left: 10px; }
  .pdf-btn:hover { opacity: 0.85; }
  @media (max-width: 600px) { .file-grid { grid-template-columns: 1fr; } .metrics-grid { grid-template-columns: repeat(2, 1fr); } .hero h1 { font-size: 26px; } }
</style>
</head>
<body>
<header>
  <div class="logo">FBA<span>Intelligence</span></div>
  <div class="badge">Powered by Claude AI</div>
</header>
<div class="container">
  <div class="hero">
    <h1>Amazon Product Research<br><span>Powered by AI</span></h1>
    <p>Upload your Helium10 exports and get an instant AI analysis: opportunity score, margin estimate, competition level, and review gaps.</p>
  </div>

  <div class="card">
    <label>Claude API Key</label>
    <div class="api-row">
      <input type="password" id="apiKey" placeholder="sk-ant-api03-..." />
      <button class="btn-save" onclick="saveKey()">Save Key</button>
    </div>
    <p class="hint">Get your key at <a href="https://console.anthropic.com" target="_blank">console.anthropic.com</a> → API Keys</p>
  </div>

  <div class="card" id="uploadSection">
    <div class="section-title">Upload Helium10 Exports</div>
    <div class="file-grid">
      <div class="file-card" id="card-bbp">
        <input type="file" accept=".csv" onchange="handleFile('bbp', this)">
        <div class="icon">📦</div>
        <div class="file-card-name">Black Box — Products</div>
        <div class="file-card-desc">Product research data with sales, BSR & revenue</div>
        <div class="file-card-status" id="status-bbp">Click to upload CSV</div>
      </div>
      <div class="file-card" id="card-bbk">
        <input type="file" accept=".csv" onchange="handleFile('bbk', this)">
        <div class="icon">🔑</div>
        <div class="file-card-name">Black Box — Keywords</div>
        <div class="file-card-desc">Keyword-level data with search volume & trends</div>
        <div class="file-card-status" id="status-bbk">Click to upload CSV</div>
      </div>
      <div class="file-card" id="card-cerebro">
        <input type="file" accept=".csv" onchange="handleFile('cerebro', this)">
        <div class="icon">🧠</div>
        <div class="file-card-name">Cerebro</div>
        <div class="file-card-desc">Keyword rankings, IQ scores & competitor data</div>
        <div class="file-card-status" id="status-cerebro">Click to upload CSV</div>
      </div>
      <div class="file-card" id="card-xray">
        <input type="file" accept=".csv" onchange="handleFile('xray', this)">
        <div class="icon">🔬</div>
        <div class="file-card-name">XRay</div>
        <div class="file-card-desc">Live competitor product & sales data</div>
        <div class="file-card-status" id="status-xray">Click to upload CSV</div>
      </div>
    </div>
    <div class="error-box" id="errorBox"></div>
    <button class="analyze-btn" id="analyzeBtn" onclick="runAnalysis()" disabled>⚡ Analyze with Claude AI</button>
  </div>

  <div class="loading" id="loading">
    <div class="spinner"></div>
    <div class="loading-text">Claude is analyzing your data...</div>
    <div class="loading-step" id="loadingStep">Reading CSV files...</div>
  </div>

  <div id="results">
    <div class="results-header">
      <div class="results-title">Analysis Results</div>
      <div>
        <button class="btn-reset" onclick="resetTool()">← New Analysis</button>
        <button class="pdf-btn" onclick="downloadPDF()">⬇ Download PDF</button>
      </div>
    </div>
    <div id="resultsContent"></div>
  </div>
</div>

<script>
const filesData = { bbp: null, bbk: null, cerebro: null, xray: null };
let apiKey = localStorage.getItem('fba_claude_key') || '';
if (apiKey) document.getElementById('apiKey').value = apiKey;

function saveKey() {
  const val = document.getElementById('apiKey').value.trim();
  if (!val) return;
  apiKey = val;
  localStorage.setItem('fba_claude_key', val);
  checkReady();
  alert('API key saved!');
}

function handleFile(type, input) {
  const file = input.files[0];
  if (!file) return;
  filesData[type] = file;
  document.getElementById(\`card-\${type}\`).classList.add('loaded');
  document.getElementById(\`status-\${type}\`).textContent = '✓ ' + file.name;
  checkReady();
}

function checkReady() {
  const hasFile = Object.values(filesData).some(f => f !== null);
  document.getElementById('analyzeBtn').disabled = !(hasFile && apiKey);
}

function showError(msg) {
  const box = document.getElementById('errorBox');
  box.textContent = msg;
  box.classList.toggle('active', !!msg);
}

async function runAnalysis() {
  if (!apiKey) { showError('Please save your Claude API key first.'); return; }
  const loaded = Object.entries(filesData).filter(([,v]) => v !== null);
  if (!loaded.length) { showError('Please upload at least one CSV file.'); return; }

  document.getElementById('loading').classList.add('active');
  document.getElementById('results').classList.remove('active');
  document.getElementById('uploadSection').style.display = 'none';
  showError('');

  const steps = ['Reading CSV files...', 'Extracting product data...', 'Running Claude analysis...', 'Calculating scores...', 'Generating insights...'];
  let si = 0;
  const stepEl = document.getElementById('loadingStep');
  const interval = setInterval(() => { if (si < steps.length - 1) stepEl.textContent = steps[++si]; }, 2000);

  try {
    const formData = new FormData();
    loaded.forEach(([key, file]) => formData.append(key, file));

    const response = await fetch('/analyze', {
      method: 'POST',
      headers: { 'x-api-key': apiKey },
      body: formData
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Analysis failed');
    }

    const data = await response.json();
    clearInterval(interval);
    document.getElementById('loading').classList.remove('active');
    renderResults(data);
  } catch (err) {
    clearInterval(interval);
    document.getElementById('loading').classList.remove('active');
    document.getElementById('uploadSection').style.display = 'block';
    showError('Error: ' + err.message);
  }
}

function scoreColor(n) {
  if (n >= 70) return 'score-high';
  if (n >= 40) return 'score-med';
  return 'score-low';
}

function renderResults(data) {
  let html = '';
  if (data.market_summary) {
    html += \`<div class="product-card"><div class="analysis-label">Market Overview</div><div class="analysis-text">\${data.market_summary}</div></div>\`;
  }
  data.products.forEach(p => {
    const sc = p.opportunity_score || 0;
    html += \`<div class="product-card">
      <div class="product-header">
        <div class="product-name">\${p.name}</div>
        <div class="score-badge"><div class="score-number \${scoreColor(sc)}">\${sc}</div><div class="score-label">Score</div></div>
      </div>
      <div class="metrics-grid">
        <div class="metric"><div class="metric-label">Competition</div><div class="metric-value" style="font-size:14px">\${p.competition_level||'—'}</div></div>
        <div class="metric"><div class="metric-label">Est. Margin</div><div class="metric-value" style="font-size:13px">\${p.estimated_margin||'—'}</div></div>
        <div class="metric"><div class="metric-label">Monthly Revenue</div><div class="metric-value" style="font-size:12px">\${p.monthly_revenue_potential||'—'}</div></div>
      </div>
      \${p.review_gaps ? \`<div class="analysis-section"><div class="analysis-label">Review Gaps</div><div class="analysis-text">\${p.review_gaps}</div></div>\` : ''}
      \${p.key_opportunities?.length ? \`<div class="analysis-section"><div class="analysis-label">Key Opportunities</div><div class="tags">\${p.key_opportunities.map(o=>\`<span class="tag tag-green">\${o}</span>\`).join('')}</div></div>\` : ''}
      \${p.barriers_to_entry?.length ? \`<div class="analysis-section"><div class="analysis-label">Barriers to Entry</div><div class="tags">\${p.barriers_to_entry.map(b=>\`<span class="tag tag-yellow">\${b}</span>\`).join('')}</div></div>\` : ''}
      \${p.verdict ? \`<div class="verdict"><div class="verdict-label">Verdict</div><div class="verdict-text">\${p.verdict}</div></div>\` : ''}
    </div>\`;
  });
  document.getElementById('resultsContent').innerHTML = html;
  document.getElementById('results').classList.add('active');
}

function downloadPDF() {
  const results = document.getElementById('resultsContent').innerHTML;
  const win = window.open('', '_blank');
  win.document.write(\`<!DOCTYPE html><html><head><title>FBA Intelligence Report</title><style>
    body{font-family:Arial,sans-serif;padding:30px;background:#fff;color:#111;max-width:900px;margin:0 auto}
    h1{color:#f59e0b;font-size:24px;margin-bottom:20px}
    .product-card{border:1px solid #ddd;border-radius:8px;padding:20px;margin-bottom:20px;page-break-inside:avoid}
    .product-card::before{content:'';display:block;height:3px;background:linear-gradient(90deg,#f59e0b,#10b981);margin-bottom:15px;border-radius:2px}
    .product-name{font-size:16px;font-weight:700;margin-bottom:12px}
    .score-badge{display:inline-block;background:#f59e0b;color:#000;padding:4px 12px;border-radius:20px;font-weight:700;font-size:18px;margin-bottom:12px}
    .metrics-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:15px}
    .metric{background:#f9f9f9;padding:10px;border-radius:6px;border:1px solid #eee}
    .metric-label{font-size:10px;color:#666;text-transform:uppercase;margin-bottom:3px}
    .metric-value{font-size:15px;font-weight:700}
    .analysis-label{font-size:11px;font-weight:700;color:#f59e0b;text-transform:uppercase;margin:12px 0 6px}
    .analysis-text{font-size:13px;color:#444;line-height:1.6}
    .tag{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;margin:2px;background:#e8f5e9;color:#2e7d32}
    .verdict{background:#fffbeb;border-left:3px solid #f59e0b;padding:10px 14px;border-radius:0 6px 6px 0;margin-top:12px}
    .comp-card{background:#f9f9f9;border:1px solid #eee;border-radius:6px;padding:10px;margin:5px 0}
    .comp-name{font-weight:600;font-size:13px}
    .comp-reason{font-size:12px;color:#666;margin:3px 0}
    .market-card{background:#fffbeb;border:1px solid #f59e0b;border-radius:8px;padding:16px;margin-bottom:20px}
    @media print{body{padding:10px}.product-card{page-break-inside:avoid}}
  </style></head><body>
    <h1>FBA Intelligence — Product Research Report</h1>
    <p style="color:#666;margin-bottom:20px;font-size:13px">Generated on \${new Date().toLocaleDateString()}</p>
    \${results}
  </body></html>\`);
  win.document.close();
  setTimeout(() => { win.print(); }, 500);
}

function resetTool() {
  Object.keys(filesData).forEach(k => filesData[k] = null);
  ['bbp','bbk','cerebro','xray'].forEach(t => {
    document.getElementById(\`card-\${t}\`).classList.remove('loaded');
    document.getElementById(\`status-\${t}\`).textContent = 'Click to upload CSV';
  });
  document.querySelectorAll('input[type=file]').forEach(i => i.value = '');
  document.getElementById('results').classList.remove('active');
  document.getElementById('uploadSection').style.display = 'block';
  document.getElementById('analyzeBtn').disabled = true;
  showError('');
}
</script>
</body>
</html>
`;

app.get('/', (req, res) => res.send(HTML));

app.post('/analyze', upload.fields([
  { name: 'bbp' }, { name: 'bbk' }, { name: 'cerebro' }, { name: 'xray' }
]), async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) return res.status(400).json({ error: 'API key required' });

    const client = new Anthropic({ apiKey });

    let dataBlocks = '';
    const files = req.files;

    const preview = (buf, rows = 50) => {
      const lines = buf.toString('utf8').trim().split('\n');
      return lines.slice(0, rows).join('\n');
    };

    if (files.bbp?.[0]) dataBlocks += `\n\n## BLACK BOX PRODUCTS:\n${preview(files.bbp[0].buffer)}`;
    if (files.bbk?.[0]) dataBlocks += `\n\n## BLACK BOX KEYWORDS:\n${preview(files.bbk[0].buffer)}`;
    if (files.cerebro?.[0]) dataBlocks += `\n\n## CEREBRO:\n${preview(files.cerebro[0].buffer)}`;
    if (files.xray?.[0]) dataBlocks += `\n\n## XRAY:\n${preview(files.xray[0].buffer)}`;

    if (!dataBlocks) return res.status(400).json({ error: 'No CSV files provided' });

    const prompt = `You are an expert Amazon FBA product research analyst. Analyze the following Helium10 export data and identify the TOP 3 most promising product opportunities. For each product suggest 5 complementary products that are high-impact and low-cost.

${dataBlocks}

Return ONLY valid JSON, no other text:

{
  "products": [
    {
      "name": "Product name",
      "opportunity_score": 72,
      "competition_level": "Medium",
      "estimated_margin": "28-35%",
      "monthly_revenue_potential": "8,000-15,000",
      "review_gaps": "What customers complain about in existing listings",
      "key_opportunities": ["opportunity 1", "opportunity 2"],
      "barriers_to_entry": ["barrier 1"],
      "verdict": "One sentence recommendation",
      "complementary_products": [
        {"name": "Product name", "reason": "Why it complements the main product", "estimated_cost": "Low", "impact": "High"},
        {"name": "Product name", "reason": "Why it complements the main product", "estimated_cost": "Low", "impact": "High"},
        {"name": "Product name", "reason": "Why it complements the main product", "estimated_cost": "Low", "impact": "High"},
        {"name": "Product name", "reason": "Why it complements the main product", "estimated_cost": "Low", "impact": "High"},
        {"name": "Product name", "reason": "Why it complements the main product", "estimated_cost": "Low", "impact": "High"}
      ]
    }
  ],
  "market_summary": "2-3 sentence market overview"
}

Score: 70+= strong, 40-69= moderate, below 40= weak. Keep all text concise.`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    });

    let raw = message.content[0].text.replace(/```json|```/g, '').trim();
    
    // Try to fix truncated JSON by finding the last complete product object
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch(e) {
      // Find last complete closing brace for products array
      const lastComplete = raw.lastIndexOf('},');
      if (lastComplete > -1) {
        raw = raw.substring(0, lastComplete + 1) + '],"market_summary":"Analysis completed. Some results may be partial due to data size."}';
        try {
          parsed = JSON.parse(raw);
        } catch(e2) {
          // Last resort - extract what we can
          raw = '{"products":[],"market_summary":"Analysis error - please try uploading fewer CSV files at once or a smaller CSV file."}';
          parsed = JSON.parse(raw);
        }
      } else {
        parsed = {products:[], market_summary: "Analysis error - please try uploading one CSV file at a time."};
      }
    }
    res.json(parsed);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Analysis failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`FBA Intelligence running on port ${PORT}`));
