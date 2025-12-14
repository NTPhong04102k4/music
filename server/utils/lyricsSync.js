function parseLrc(lrcText) {
  const input = String(lrcText || "");
  const lines = input.split(/\r?\n/);
  const out = [];

  // Support multiple timestamps per line: [00:10.00][00:12.00]text
  const timeTagRe = /\[(\d{1,2}):(\d{1,2}(?:\.\d{1,3})?)\]/g;

  for (const rawLine of lines) {
    if (!rawLine.trim()) continue;
    let match;
    const times = [];
    while ((match = timeTagRe.exec(rawLine)) !== null) {
      const mm = Number(match[1]);
      const ss = Number(match[2]);
      if (!Number.isFinite(mm) || !Number.isFinite(ss)) continue;
      const timeSec = mm * 60 + ss;
      times.push(timeSec);
    }
    const text = rawLine.replace(timeTagRe, "").trim();
    if (!times.length) continue;
    for (const t of times) out.push({ timeSec: t, text });
  }

  out.sort((a, b) => a.timeSec - b.timeSec);
  return out;
}

function lrcToPlain(lrcText) {
  const parsed = parseLrc(lrcText);
  // De-duplicate consecutive lines with same text (common in multi-tag LRC)
  const plainLines = [];
  let last = null;
  for (const l of parsed) {
    if (!l.text) continue;
    if (l.text === last) continue;
    plainLines.push(l.text);
    last = l.text;
  }
  return plainLines.join("\n").trim();
}

module.exports = { parseLrc, lrcToPlain };


