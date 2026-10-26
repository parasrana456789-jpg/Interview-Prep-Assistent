const ApiError = require('../utils/ApiError');

const LANGUAGE_IDS = {
  java: 62,
  python: 71,
  cpp: 54,
  javascript: 63
};

const b64 = (s) =>
  Buffer.from(s || '', 'utf8').toString('base64');

const unb64 = (s) =>
  s ? Buffer.from(s, 'base64').toString('utf8') : '';

exports.LANGUAGES = Object.keys(LANGUAGE_IDS);

exports.runCode = async ({ language, code, stdin = '' }) => {
  const id = LANGUAGE_IDS[language];

  if (!id) {
    throw new ApiError(400, 'Unsupported language');
  }

  if (!code || !code.trim()) {
    throw new ApiError(400, 'Write some code first');
  }

  if (code.length > 50000) {
    throw new ApiError(400, 'Code is too long');
  }

  const apiKey = process.env.ONLINECOMPILER_API_KEY;

  if (!apiKey) {
    throw new ApiError(
      503,
      'Code execution is not configured. Add ONLINECOMPILER_API_KEY on the server.'
    );
  }

  const base =
    'https://api.onlinecompiler.io/api/judge0';

  const url =
    `${base}/submissions?base64_encoded=true&wait=true` +
    '&fields=stdout,stderr,compile_output,message,status,time,memory';

  let res;

  try {
    res = await fetch(url, {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': apiKey
      },

      body: JSON.stringify({
        language_id: id,
        source_code: b64(code),
        stdin: b64(stdin),
        cpu_time_limit: 5,
        memory_limit: 256000
      })
    });
  } catch (err) {
    console.error('OnlineCompiler network error:', err.message);

    throw new ApiError(
      502,
      'Could not reach the code execution service'
    );
  }

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');

    console.error(
      'OnlineCompiler error:',
      res.status,
      errorText.slice(0, 500)
    );

    if (res.status === 401 || res.status === 403) {
      throw new ApiError(
        502,
        'OnlineCompiler authentication or access failed. Check the API key.'
      );
    }

    if (res.status === 429) {
      throw new ApiError(
        429,
        'Code runner limit reached. Try again shortly.'
      );
    }

    throw new ApiError(
      502,
      'Code execution failed. Please try again.'
    );
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
    memory: r.memory
  };
};