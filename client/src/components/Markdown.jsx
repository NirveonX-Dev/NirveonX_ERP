// Tiny, dependency-free markdown renderer — just enough for ticket bodies:
// headings (#, ##, ###), bold (**x**), inline code (`x`), bullet lists (-, *),
// checkbox lines (☐ / ☑ / - [ ] / - [x]), and blank-line paragraph breaks.
// Deliberately not a full markdown engine; keeps the client dep-free.

function renderInline(text) {
  // Split on **bold** and `code`, preserving delimiters.
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (/^\*\*[^*]+\*\*$/.test(p)) return <strong key={i}>{p.slice(2, -2)}</strong>;
    if (/^`[^`]+`$/.test(p)) return <code key={i} className="px-1 py-0.5 rounded bg-slate-100 text-[0.85em] font-mono">{p.slice(1, -1)}</code>;
    return <span key={i}>{p}</span>;
  });
}

export default function Markdown({ text = "" }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let list = null; // accumulating <li> items

  const flushList = () => {
    if (list) { blocks.push({ type: "ul", items: list }); list = null; }
  };

  lines.forEach((raw) => {
    const line = raw.trimEnd();
    if (!line.trim()) { flushList(); return; }

    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) { flushList(); blocks.push({ type: `h${h[1].length}`, text: h[2] }); return; }

    // checkbox: "☐ x", "☑ x", "- [ ] x", "- [x] x"
    const cb = line.match(/^(?:[-*]\s*)?(\[[ xX]\]|[☐☑✓])\s+(.*)$/);
    if (cb) {
      const checked = /[xX☑✓]/.test(cb[1]);
      (list ||= []).push({ checkbox: true, checked, text: cb[2] });
      return;
    }

    const bullet = line.match(/^[-*]\s+(.*)$/);
    if (bullet) { (list ||= []).push({ checkbox: false, text: bullet[1] }); return; }

    flushList();
    blocks.push({ type: "p", text: line });
  });
  flushList();

  return (
    <div className="space-y-2 text-sm text-slate-700 leading-relaxed">
      {blocks.map((b, i) => {
        if (b.type === "h1") return <h2 key={i} className="text-base font-bold text-ink mt-3">{renderInline(b.text)}</h2>;
        if (b.type === "h2") return <h3 key={i} className="text-sm font-bold text-ink uppercase tracking-wide mt-3">{renderInline(b.text)}</h3>;
        if (b.type === "h3") return <h4 key={i} className="text-sm font-semibold text-ink mt-2">{renderInline(b.text)}</h4>;
        if (b.type === "ul") {
          return (
            <ul key={i} className="space-y-1">
              {b.items.map((it, j) => (
                <li key={j} className="flex items-start gap-2">
                  {it.checkbox ? (
                    <span className={`shrink-0 mt-0.5 ${it.checked ? "text-emerald-600" : "text-slate-400"}`}>
                      {it.checked ? "☑" : "☐"}
                    </span>
                  ) : (
                    <span className="shrink-0 mt-1.5 w-1 h-1 rounded-full bg-slate-400" />
                  )}
                  <span className={it.checkbox && it.checked ? "line-through text-slate-400" : ""}>{renderInline(it.text)}</span>
                </li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{renderInline(b.text)}</p>;
      })}
    </div>
  );
}
