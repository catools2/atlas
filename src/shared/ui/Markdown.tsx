import { Fragment, type ReactNode } from "react";

/**
 * A deliberately small markdown subset, rendered to React elements.
 *
 * <p>Grafana text panels carry markdown, and 29 panels in the corpus are text. The obvious move
 * is `react-markdown` plus `dompurify` — two dependencies and, more to the point, an HTML
 * sanitising problem on a page that renders content other people authored.
 *
 * <p>This renders to React elements and **never** uses `dangerouslySetInnerHTML`, so there is no
 * HTML parser and nothing to sanitise: a `<script>` in a dashboard's text panel is text, because
 * text is the only thing this can produce. The cost is that exotic markdown degrades to plain
 * text, which is the right way for it to fail.
 *
 * <p>Links are restricted to http(s) — `javascript:` is the other half of the same problem.
 */
export function Markdown({ source }: { source: string }) {
  if (!source.trim()) return null;

  const blocks: ReactNode[] = [];
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  let list: string[] = [];
  let fence: string[] | null = null;

  const flushList = () => {
    if (list.length === 0) return;
    blocks.push(
      <ul key={blocks.length} className="ml-4 list-disc space-y-0.5">
        {list.map((item, i) => <li key={i}>{inline(item)}</li>)}
      </ul>,
    );
    list = [];
  };

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      if (fence) {
        blocks.push(
          <pre key={blocks.length} className="overflow-auto rounded bg-black/30 p-2 text-xs">
            <code>{fence.join("\n")}</code>
          </pre>,
        );
        fence = null;
      } else {
        flushList();
        fence = [];
      }
      continue;
    }
    if (fence) { fence.push(line); continue; }

    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      flushList();
      const level = heading[1].length;
      const size = ["text-lg", "text-base", "text-sm", "text-sm"][level - 1];
      blocks.push(
        <p key={blocks.length} className={`${size} font-semibold`}>{inline(heading[2])}</p>,
      );
      continue;
    }

    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    if (bullet) { list.push(bullet[1]); continue; }

    if (!line.trim()) { flushList(); continue; }
    flushList();
    blocks.push(<p key={blocks.length}>{inline(line)}</p>);
  }
  flushList();
  if (fence) blocks.push(<pre key={blocks.length}><code>{fence.join("\n")}</code></pre>);

  return <div className="space-y-2 text-sm leading-relaxed">{blocks}</div>;
}

/** Bold, italic, code and links — as elements, never as markup. */
function inline(text: string): ReactNode {
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(pattern).filter((p) => p !== "");

  return (
    <>
      {parts.map((part, i) => {
        if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={i}>{part.slice(2, -2)}</strong>;
        if (/^\*[^*]+\*$/.test(part)) return <em key={i}>{part.slice(1, -1)}</em>;
        if (/^`[^`]+`$/.test(part)) {
          return <code key={i} className="rounded bg-black/30 px-1 text-xs">{part.slice(1, -1)}</code>;
        }
        const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
        if (link) {
          const href = link[2].trim();
          // Anything but http(s) is dropped to text. `javascript:` is the reason.
          if (!/^https?:\/\//i.test(href)) return <Fragment key={i}>{link[1]}</Fragment>;
          return (
            <a key={i} href={href} target="_blank" rel="noreferrer noopener" className="underline">
              {link[1]}
            </a>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
