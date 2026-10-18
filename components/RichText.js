// Renders the small amount of Markdown Gemini usually returns (headings, bullets, **bold**)
// as React elements, so no raw HTML is ever injected.
function inline(text, keyPrefix) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>
    ) : (
      part
    )
  );
}

export default function RichText({ text }) {
  const blocks = [];
  let list = [];
  const flush = () => {
    if (list.length) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="rt-list">
          {list}
        </ul>
      );
      list = [];
    }
  };

  String(text || "")
    .split("\n")
    .forEach((raw, i) => {
      const line = raw.trim();
      if (!line || line === "---") return flush();
      const bullet = line.match(/^[*-]\s+(.*)/);
      if (bullet) {
        list.push(<li key={i}>{inline(bullet[1], i)}</li>);
        return;
      }
      flush();
      const heading = line.match(/^#{1,4}\s+(.*)/);
      blocks.push(
        heading ? (
          <p key={i} className="rt-heading">
            {inline(heading[1], i)}
          </p>
        ) : (
          <p key={i} className="rt-p">
            {inline(line, i)}
          </p>
        )
      );
    });
  flush();
  return <>{blocks}</>;
}
