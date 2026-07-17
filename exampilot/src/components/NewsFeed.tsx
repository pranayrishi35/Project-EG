"use client";

import { useState } from "react";
import Image from "next/image";
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
  const [isFiltering, setIsFiltering] = useState(false);

  // Filters State
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterScore, setFilterScore] = useState(0);
  const [filterDate, setFilterDate] = useState("All Time");

  const loadMore = async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);

    try {
      const nextPage = page + 1;
      const { data, hasMore: nextHasMore } = await fetchDefenseNews(nextPage, 20, filterCategory, filterScore, filterDate);
      
      setNewsItems((prev) => [...prev, ...data]);
      setPage(nextPage);
      setHasMore(nextHasMore);
    } catch (error) {
      console.error("Failed to load more news:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = async () => {
    setIsFiltering(true);
    setPage(0);
    try {
      const { data, hasMore: nextHasMore } = await fetchDefenseNews(0, 20, filterCategory, filterScore, filterDate);
      setNewsItems(data);
      setHasMore(nextHasMore);
    } catch (error) {
      console.error("Failed to apply filters:", error);
    } finally {
      setIsFiltering(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8">
      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row gap-4 items-end md:items-center justify-between shadow-xl">
        <div className="w-full flex flex-wrap gap-4 items-center">
          <div className="flex flex-col gap-1.5 w-full sm:w-auto flex-1 min-w-[140px]">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Category</label>
            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="All">All Topics</option>
              <option value="Defence">Defence</option>
              <option value="Space">Space</option>
              <option value="Tech">Tech</option>
              <option value="Sports">Sports</option>
              <option value="Geopolitics">Geopolitics</option>
            </select>
          </div>
          
          <div className="flex flex-col gap-1.5 w-full sm:w-auto flex-1 min-w-[140px]">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Timeframe</label>
            <select 
              value={filterDate} 
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="All Time">All Time</option>
              <option value="Last 24 Hours">Last 24 Hours</option>
              <option value="Last 7 Days">Last 7 Days</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5 w-full sm:w-auto flex-1 min-w-[140px]">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Min Relevance Score</label>
            <select 
              value={filterScore} 
              onChange={(e) => setFilterScore(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value={0}>Any Score</option>
              <option value={50}>50+ (Medium)</option>
              <option value={80}>80+ (High)</option>
              <option value={90}>90+ (Critical)</option>
            </select>
          </div>
        </div>

        <button
          onClick={applyFilters}
          disabled={isFiltering}
          className="w-full md:w-auto whitespace-nowrap px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isFiltering ? (
            <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
          )}
          Apply Filters
        </button>
      </div>

      {isFiltering ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        </div>
      ) : newsItems.length === 0 ? (
        <div className="text-center py-20 px-6 bg-slate-900 border border-slate-800 rounded-3xl">
          <p className="text-slate-700 font-medium">No news articles found matching your filters.</p>
        </div>
      ) : (
        <>
          {newsItems.map((item, index) => (
            <article
              key={`${item.id}-${index}`}
              className="w-full flex flex-col md:flex-row relative rounded-3xl overflow-hidden bg-slate-950 shadow-[0_0_15px_rgba(99,102,241,0.1)] group ring-1 ring-indigo-500/20 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both"
              style={{ animationDelay: `${(index % 20) * 100}ms` }}
            >
              {/* Image Section */}
              <div className="w-full md:w-2/5 aspect-video md:aspect-auto md:min-h-[280px] relative overflow-hidden bg-slate-900 flex-shrink-0">
                <Image
                  src={item.imageUrl.replace(/['"]/g, "")}
                  alt={item.title}
                  width={600}
                  height={400}
                  priority={index === 0}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400'%3E%3Crect width='100%25' height='100%25' fill='%231e293b'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='24' fill='%236366f1' text-anchor='middle' dominant-baseline='middle'%3EDefense News%3C/text%3E%3C/svg%3E";
                  }}
                />
                {/* Glassmorphism Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-l from-slate-950 via-slate-950/40 to-transparent opacity-80 md:opacity-100" />
              </div>

              {/* Content Area */}
              <div className="relative z-10 p-6 md:p-8 flex flex-col justify-center flex-1 min-w-0 bg-slate-950/40 backdrop-blur-sm">
                <div className="mb-4 flex items-center gap-3 flex-wrap">
                  <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded text-xs font-bold tracking-wider uppercase inline-block shadow-inner">
                    {item.category}
                  </span>
                  <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-1 rounded text-xs font-bold tracking-wider uppercase inline-flex items-center gap-1.5 shadow-inner">
                    🔥 Score: {item.relevanceScore}/100
                  </span>
                </div>

                <h2 className="tracking-tight leading-snug font-extrabold text-white text-xl md:text-2xl mb-3 drop-shadow-sm group-hover:text-indigo-300 transition-colors duration-300">
                  {item.title}
                </h2>

                <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6 opacity-90 line-clamp-3">
                  {item.summary}
                </p>

                <div className="mt-auto flex items-center justify-between">
                  <p className="text-xs text-slate-700 font-medium flex items-center gap-1.5">
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
        </>
      )}

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
