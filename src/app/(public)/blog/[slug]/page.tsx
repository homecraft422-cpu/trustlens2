import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock3, UserRound } from "lucide-react";
import Header from "@/components/Header";
import BlogContentRenderer from "@/components/blog/BlogContentRenderer";
import { BLOG_POSTS, getBlogPost } from "@/content/blog";
import { getSiteUrl } from "@/lib/seo";

interface BlogArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: BlogArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: "Article not found | TrustLens" };

  const siteUrl = getSiteUrl();
  return {
    title: `${post.title} | TrustLens Blog`,
    description: post.description,
    alternates: { canonical: `${siteUrl}/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url: `${siteUrl}/blog/${post.slug}`,
      publishedTime: post.date,
      modifiedTime: post.updatedAt,
      authors: [post.author],
      tags: post.tags,
      siteName: "TrustLens",
    },
    twitter: {
      card: "summary",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogArticlePage({ params }: BlogArticlePageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const siteUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updatedAt || post.date,
    author: { "@type": "Organization", name: post.author },
    publisher: { "@type": "Organization", name: "TrustLens" },
    mainEntityOfPage: `${siteUrl}/blog/${post.slug}`,
  };

  const related = BLOG_POSTS.filter((p) => p.slug !== slug).slice(0, 2);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" />
          All articles
        </Link>

        <header className="mt-6">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-brand-700">
              <CalendarDays className="h-3 w-3" />
              {new Date(post.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
              <Clock3 className="h-3 w-3" />
              {post.readingMinutes} min read
            </span>
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-500"
              >
                {tag}
              </span>
            ))}
          </div>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-4xl">
            {post.title}
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-slate-600">
            {post.description}
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
            <UserRound className="h-4 w-4 text-brand-500" />
            {post.author} · {post.authorRole}
          </div>
        </header>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <BlogContentRenderer blocks={post.content} />
        </div>

        {/* Related articles */}
        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-extrabold text-slate-900">Keep reading</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  href={`/blog/${item.slug}`}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
                >
                  <h3 className="text-sm font-bold leading-snug text-slate-900 group-hover:text-brand-700">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-xs text-slate-500">
                    {item.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="mt-10 rounded-3xl bg-gradient-to-r from-brand-600 to-indigo-600 p-8 text-center">
          <h2 className="text-xl font-extrabold text-white">Put it into practice</h2>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-brand-100">
            Analyze your own files or fact-check a claim right now — free, no
            sign-up needed for a quick check.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href="/analyze"
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-brand-700 transition-colors hover:bg-brand-50"
            >
              Analyze a file
            </Link>
            <Link
              href="/tools/fact-check"
              className="rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/20"
            >
              Fact-check a claim
            </Link>
          </div>
        </section>
      </main>

      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
