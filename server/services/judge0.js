const ApiError = require('../utils/ApiError');

const LANGUAGE_IDS = { java: 62, python: 71, cpp: 54, javascript: 63 };
const b64 = (s) => Buffer.from(s || '', 'utf8').toString('base64');
const unb64 = (s) => (s ? Buffer.from(s, 'base64').toString('utf8') : '');

exports.LANGUAGES = Object.keys(LANGUAGE_IDS);

exports.runCode = async ({ language, code, stdin = '' }) => {
  const id = LANGUAGE_IDS[language];
  if (!id) throw new ApiError(400, 'Unsupported language');
  if (!code || !code.trim()) throw new ApiError(400, 'Write some code first');
  if (code.length > 50000) throw new ApiError(400, 'Code is too long');

  const base = (process.env.JUDGE0_URL || 'https://judge0-ce.p.rapidapi.com').replace(/\/$/, '');
  const headers = { 'Content-Type': 'application/json' };
  if (process.env.JUDGE0_KEY) {
    headers['X-RapidAPI-Key'] = process.env.JUDGE0_KEY;
    headers['X-RapidAPI-Host'] = new URL(base).host;
  } else if (base.includes('rapidapi.com')) {
    throw new ApiError(503, 'Code execution is not configured. Add JUDGE0_KEY on the server.');
  }

  let res;
  try {
    res = await fetch(`${base}/submissions?base64_encoded=true&wait=true&fields=stdout,stderr,compile_output,message,status,time,memory`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        language_id: id,
        source_code: b64(code),
        stdin: b64(stdin),
        cpu_time_limit: 5,
        memory_limit: 256000,
      }),
    });
  } catch (err) {
    console.error('Judge0 network error', err.message);
    throw new ApiError(502, 'Could not reach the code execution service');
  }

  if (!res.ok) {
    console.error('Judge0 error', res.status, (await res.text().catch(() => '')).slice(0, 300));
    if (res.status === 429) throw new ApiError(429, 'Code runner limit reached. Try again shortly.');
    throw new ApiError(502, 'Code execution failed. Please try again.');
  }

  const r = await res.json();
  return {
    stdout: unb64(r.stdout),
    stderr: unb64(r.stderr),
    compileOutput: unb64(r.compile_output),
    message: unb64(r.message),
    status: r.status?.description || 'Unknown',
    statusId: r.status?.id,
    time: r.time,
    memory: r.memory,
  };
};
