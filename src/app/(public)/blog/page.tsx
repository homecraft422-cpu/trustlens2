import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3 } from "lucide-react";
import Header from "@/components/Header";
import { BLOG_POSTS } from "@/content/blog";

export const metadata: Metadata = {
  title: "Blog — AI Detection & Digital Verification Guides | TrustLens",
  description:
    "Practical guides on spotting AI-generated images, deepfake video detection, EXIF metadata, and fact-checking online claims — written by the TrustLens research team.",
};

export default function BlogIndexPage() {
  const posts = [...BLOG_POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main>
        <section className="border-b border-slate-200 bg-white px-4 py-14 sm:px-6 sm:py-18 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-600">
              TrustLens Blog
            </p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
              Guides for a verifiable internet
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              Hands-on articles about AI-generated media, deepfakes, metadata,
              and fact-checking — written so you can actually use them today.
            </p>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-brand-700">
                    <CalendarDays className="h-3 w-3" />
                    {new Date(post.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                    <Clock3 className="h-3 w-3" />
                    {post.readingMinutes} min read
                  </span>
                </div>
                <h2 className="mt-4 text-xl font-extrabold leading-snug tracking-tight text-slate-900 group-hover:text-brand-700 sm:text-2xl">
                  {post.title}
                </h2>
                <p className="mt-3 flex-1 text-[15px] leading-relaxed text-slate-600">
                  {post.description}
                </p>
                <div className="mt-5 flex items-center gap-2 text-sm font-bold text-brand-600">
                  Read article
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Related tool CTA */}
        <section className="px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl rounded-3xl bg-gradient-to-r from-brand-600 to-indigo-600 px-8 py-10 text-center">
            <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
              Ready to verify something right now?
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-brand-100">
              Upload an image, video, audio file, or paste a claim — get an
              evidence-based report in minutes.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/analyze"
                className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-brand-700 shadow-lg transition-colors hover:bg-brand-50"
              >
                Analyze a file
              </Link>
              <Link
                href="/tools/fact-check"
                className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/20"
              >
                Fact-check a claim
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

// Static generation for all posts.
export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}
