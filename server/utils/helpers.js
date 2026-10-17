const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, Number.isFinite(+n) ? Math.round(+n) : 0));
const avg = (arr) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0);
module.exports = { clamp, avg };
