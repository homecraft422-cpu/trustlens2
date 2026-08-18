import type { ReactNode } from "react";

/**
 * Renders structured blog content blocks (paragraphs, headings, lists,
 * quotes) without a markdown dependency. Static output = fast + SEO-safe.
 */
export default function BlogContentRenderer({
  blocks,
}: {
  blocks: Array<{ type: string; text?: string; items?: string[] }>;
}) {
  return (
    <div className="prose-trustlens space-y-5">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "h2":
            return (
              <h2 key={i} className="pt-4 text-2xl font-extrabold tracking-tight text-slate-900">
                {block.text}
              </h2>
            );
          case "h3":
            return (
              <h3 key={i} className="pt-2 text-lg font-bold text-slate-900">
                {block.text}
              </h3>
            );
          case "ul":
            return (
              <ul key={i} className="list-disc space-y-2 pl-6 text-slate-700">
                {block.items?.map((item, j) => (
                  <li key={j} className="leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i} className="list-decimal space-y-2 pl-6 text-slate-700">
                {block.items?.map((item, j) => (
                  <li key={j} className="leading-relaxed">
                    {item}
                  </li>
                ))}
              </ol>
            );
          case "quote":
            return (
              <blockquote
                key={i}
                className="rounded-2xl border-l-4 border-brand-500 bg-brand-50/70 px-5 py-4 text-[15px] font-medium leading-relaxed text-brand-900"
              >
                {block.text}
              </blockquote>
            );
          default:
            return (
              <p key={i} className="leading-[1.85] text-slate-700">
                {block.text}
              </p>
            );
        }
      })}
    </div>
  );
}

export function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      {children}
    </article>
  );
}
