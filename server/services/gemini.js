const ApiError = require('../utils/ApiError');

const MODEL = () => process.env.GEMINI_MODEL || 'gemini-2.5-flash';

function parseJSON(text) {
  const cleaned = text.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.search(/[\[{]/);
    const end = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error('Model did not return valid JSON');
  }
}

async function callGemini(prompt, { temperature = 0.7, json = true } = {}) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new ApiError(503, 'AI service is not configured. Add GEMINI_API_KEY on the server.');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL()}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature, ...(json ? { responseMimeType: 'application/json' } : {}) },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('Gemini error', res.status, body.slice(0, 300));
    if (res.status === 429) throw new ApiError(429, 'AI is busy right now. Please try again in a moment.');
    throw new ApiError(502, 'AI service request failed. Please try again.');
  }
  const data = await res.json();
  const text = (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
  if (!text) throw new ApiError(502, 'AI returned an empty response. Please try again.');
  return text;
}

/** Ask Gemini for JSON; retries once if the output cannot be parsed or fails validation. */
exports.generateJSON = async (prompt, { temperature = 0.7, validate } = {}) => {
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const data = parseJSON(await callGemini(prompt, { temperature }));
      if (validate) validate(data);
      return data;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      lastErr = err;
    }
  }
  console.error('Gemini parse/validation failed:', lastErr?.message);
  throw new ApiError(502, 'AI returned an unexpected format. Please try again.');
};

exports.generateText = (prompt, opts) => callGemini(prompt, { ...opts, json: false });
