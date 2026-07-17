import { fetchDefenseNews } from "@/app/actions/fetchDefenseNews";
import NewsFeed from "@/components/NewsFeed";

export const metadata = { title: "Defense News | ExamPilot" };
export const revalidate = 3600;

const MOCK_DEFENSE_NEWS = [
  {
    id: "mock-1",
    title: "DRDO Successfully Test-Fires Agni-V Ballistic Missile",
    summary: "India successfully flight-tested the Agni-V surface-to-surface ballistic missile, featuring Multiple Independently Targetable Re-entry Vehicle (MIRV) technology, bolstering strategic deterrence.",
    url: "#",
    imageUrl: "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?q=80&w=800&auto=format&fit=crop",
    publishedAt: new Date().toISOString(),
    category: "Defence",
    relevanceScore: 95,
  },
  {
    id: "mock-2",
    title: "LCA Tejas Mk1A Completes Maiden Flight",
    summary: "The first production aircraft of the LCA Tejas Mk1A variant successfully completed its maiden flight, marking a significant milestone in indigenous aerospace manufacturing.",
    url: "#",
    imageUrl: "https://images.unsplash.com/photo-1574343166827-0402b80a133b?q=80&w=800&auto=format&fit=crop",
    publishedAt: new Date().toISOString(),
    category: "Aerospace",
    relevanceScore: 80,
  },
  {
    id: "mock-3",
    title: "Indian Navy Commissions INS Jatayu in Lakshadweep",
    summary: "Bolstering maritime security in the strategic Indian Ocean Region, the Indian Navy has commissioned INS Jatayu, an upgraded naval base in the Lakshadweep islands.",
    url: "#",
    imageUrl: "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?q=80&w=800&auto=format&fit=crop",
    publishedAt: new Date().toISOString(),
    category: "Defence",
    relevanceScore: 70,
  },
  {
    id: "mock-4",
    title: "ISRO Achieves Major Milestone in Gaganyaan Mission",
    summary: "ISRO has successfully completed the human rating of the CE20 cryogenic engine, a crucial step forward for India's ambitious Gaganyaan human spaceflight program.",
    url: "#",
    imageUrl: "https://images.unsplash.com/photo-1574343166827-0402b80a133b?q=80&w=800&auto=format&fit=crop",
    publishedAt: new Date().toISOString(),
    category: "Space",
    relevanceScore: 85,
  },
  {
    id: "mock-5",
    title: "Joint Military Exercise 'Desert Knight' Concludes",
    summary: "The joint military exercise involving the Indian Air Force and international partners concluded successfully, enhancing interoperability and tactical combat skills.",
    url: "#",
    imageUrl: "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?q=80&w=800&auto=format&fit=crop",
    publishedAt: new Date().toISOString(),
    category: "Defence",
    relevanceScore: 65,
  },
];

export default async function NewsPage() {
  const { data: initialNewsItems, hasMore } = await fetchDefenseNews(0, 20);
  
  const newsItems = !initialNewsItems || initialNewsItems.length === 0 
    ? MOCK_DEFENSE_NEWS 
    : initialNewsItems;

  return (
    <div className="p-4 md:p-6 pb-24 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black tracking-tight">Defense News</h1>
        <p className="text-sm text-slate-700 font-medium mt-1">Live updates and high-yield current affairs.</p>
      </div>

      <NewsFeed initialNews={newsItems} initialHasMore={hasMore} />
    </div>
  );
}
