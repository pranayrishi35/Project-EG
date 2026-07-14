"use client";

import { useState } from "react";
import { fetchDefenseNews, NewsItem } from "@/app/actions/fetchDefenseNews";

interface NewsFeedProps {
  initialNews: NewsItem[];
  initialHasMore: boolean;
}

export default function NewsFeed({ initialNews, initialHasMore }: NewsFeedProps) {
  const [newsItems, setNewsItems] = useState<NewsItem[]>(initialNews);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);

  const loadMore = async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);

    try {
      const nextPage = page + 1;
      const { data, hasMore: nextHasMore } = await fetchDefenseNews(nextPage, 20);
      
      setNewsItems((prev) => [...prev, ...data]);
      setPage(nextPage);
      setHasMore(nextHasMore);
    } catch (error) {
      console.error("Failed to load more news:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8">
      {newsItems.map((item, index) => (
        <article
          key={`${item.id}-${index}`}
          className="w-full flex flex-col md:flex-row relative rounded-3xl overflow-hidden bg-slate-950 shadow-[0_0_15px_rgba(99,102,241,0.1)] group ring-1 ring-indigo-500/20 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both"
          style={{ animationDelay: `${(index % 20) * 100}ms` }}
        >
          {/* Image Section */}
          <div className="w-full md:w-2/5 aspect-video md:aspect-auto md:min-h-[280px] relative overflow-hidden bg-slate-900 flex-shrink-0">
            <div
              className="w-full h-full bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
              style={{ backgroundImage: `url(${item.imageUrl})` }}
            />
            {/* Glassmorphism Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-slate-950 via-slate-950/40 to-transparent opacity-80 md:opacity-100" />
          </div>

          {/* Content Area */}
          <div className="relative z-10 p-6 md:p-8 flex flex-col justify-center flex-1 min-w-0 bg-slate-950/40 backdrop-blur-sm">
            <div className="mb-4">
              <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded text-xs font-bold tracking-wider uppercase inline-block">
                Defense Update
              </span>
            </div>

            <h2 className="tracking-tight leading-snug font-extrabold text-white text-xl md:text-2xl mb-3 drop-shadow-sm group-hover:text-indigo-300 transition-colors duration-300">
              {item.title}
            </h2>

            <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6 opacity-90 line-clamp-3">
              {item.summary}
            </p>

            <div className="mt-auto flex items-center justify-between">
              <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                {new Date(item.publishedAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric"
                })}
              </p>

              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[48px] rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider hover:bg-indigo-600 hover:border-indigo-500 hover:text-white transition-all duration-300 active:scale-95 shadow-lg"
              >
                Read Full Article
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
              </a>
            </div>
          </div>
        </article>
      ))}

      {hasMore && (
        <div className="flex justify-center pt-8">
          <button
            onClick={loadMore}
            disabled={isLoading}
            className="flex items-center gap-2 px-8 py-3 rounded-full bg-slate-900 border border-indigo-500/30 text-indigo-400 font-bold tracking-wide shadow-lg hover:bg-indigo-600 hover:text-white hover:border-indigo-500 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                Loading...
              </>
            ) : (
              "Load More News"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
