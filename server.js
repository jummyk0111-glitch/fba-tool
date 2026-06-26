const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
const multer = require('multer');
const path = require('path');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Analyze endpoint
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

    const prompt = `You are an expert Amazon FBA product research analyst. Analyze the following Helium10 export data and identify the TOP 3-5 most promising product opportunities.

${dataBlocks}

Return ONLY valid JSON, no other text:

{
  "products": [
    {
      "name": "Product name or keyword/niche",
      "opportunity_score": 72,
      "competition_level": "Medium",
      "estimated_margin": "28-35%",
      "monthly_revenue_potential": "€8,000-15,000",
      "review_gaps": "What customers complain about in existing listings",
      "key_opportunities": ["opportunity 1", "opportunity 2", "opportunity 3"],
      "barriers_to_entry": ["barrier 1", "barrier 2"],
      "verdict": "One sentence recommendation on whether to pursue this product"
    }
  ],
  "market_summary": "2-3 sentence overview of the overall market from the data"
}

Base scores strictly on the data. Score 70+ = strong opportunity, 40-69 = moderate, below 40 = weak.`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    });

    const raw = message.content[0].text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(raw);
    res.json(parsed);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Analysis failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`FBA Intelligence running on port ${PORT}`));
