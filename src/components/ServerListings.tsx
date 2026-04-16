import { Link } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, query, getDocs, limit } from 'firebase/firestore';
import SectionHeader from './SectionHeader';
import { Heart, Clock, ShoppingCart, Server } from 'lucide-react';
import {
  mapProductDocToHomeListing,
  sortDocPairsNewestFirst,
  isServerTanitimCategory,
  type HomeListing,
} from '../lib/homeListingUtils';

export default function ServerListings() {
  const [listings, setListings] = useState<HomeListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(16);

  const applyPairs = useCallback((pairs: { id: string; data: Record<string, unknown> }[]) => {
    const sorted = sortDocPairsNewestFirst(pairs);
    const serverOnly = sorted.filter(({ data }) => isServerTanitimCategory(data.category));
    setListings(serverOnly.map(({ id, data }) => mapProductDocToHomeListing(id, data)).slice(0, 32));
  }, []);

  useEffect(() => {
    let cancelled = false;
    let retryCount = 0;
    const maxRetries = 2;

    const run = async () => {
      try {
        const q = query(collection(db, 'products'), limit(80));
        const snapshot = await Promise.race([
          getDocs(q),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Server tanıtımları yüklenirken zaman aşımı oluştu.')), 30000)
          ),
        ]);
        if (cancelled) return;
        const pairs = snapshot.docs.map((doc) => ({
          id: doc.id,
          data: doc.data() as Record<string, unknown>,
        }));
        applyPairs(pairs);
      } catch (e: any) {
        console.error('ServerListings Error:', e);
        if (e?.code === 'permission-denied' || e?.message?.includes('Missing or insufficient permissions')) {
          if (!cancelled) {
             setListings([]);
             setLoading(false);
          }
          return;
        }
        if (!cancelled && retryCount < maxRetries) {
          retryCount++;
          setTimeout(run, 2000);
          return;
        }
        if (!cancelled) setListings([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [applyPairs]);

  const visibleListings = listings.slice(0, visibleCount);

  return (
    <section className="py-0">
      <div className="w-full">
        <SectionHeader 
          title="Server Tanıtımı" 
          subtitle="Yalnızca server tanıtımı kategorisindeki ilanlar."
          icon={<Server className="w-6 h-6" />}
        />

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="bg-[#1a1b23] rounded-xl aspect-[3/4] animate-pulse border border-white/5"
              />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-[#1a1b23] rounded-xl p-8 text-center border border-white/5">
            <p className="text-white/50">Henüz server tanıtımı bulunmuyor.</p>
            <Link
              to="/server-tanitimi"
              className="inline-block mt-4 text-[#a78bfa] text-sm font-medium hover:underline"
            >
              Server tanıtımı sayfasına git
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {visibleListings.map((listing, idx) => (
                <div
                  key={`${listing.id}-${idx}`}
                  className="group bg-[#1a1b23] rounded-xl overflow-hidden border border-white/5 hover:border-white/20 transition-all flex flex-col relative"
                >
                  {/* Image Area */}
                  <Link to={`/server-tanitimi/${listing.id}`} className="relative aspect-[4/5] overflow-hidden block">
                    <img
                      src={listing.image}
                      alt={listing.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Online Dot */}
                    <div className="absolute top-3 left-3 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1a1b23]"></div>
                    {/* Heart Icon */}
                    <button className="absolute top-3 right-3 text-white/50 hover:text-red-500 transition-colors z-10" onClick={(e) => e.preventDefault()}>
                      <Heart className="w-5 h-5" />
                    </button>
                    
                    {/* Time Left Strip */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm p-2 flex items-center justify-center gap-1.5 text-[10px] font-bold text-white/90">
                      <Clock className="w-3 h-3 text-green-400" />
                      <span>29 <span className="text-white/50 font-normal">GÜN</span></span>
                      <span>23 <span className="text-white/50 font-normal">SAAT</span></span>
                      <span>47 <span className="text-white/50 font-normal">DK</span></span>
                    </div>
                  </Link>

                  {/* Content Area */}
                  <div className="p-3 flex-1 flex flex-col">
                    <Link to={`/server-tanitimi/${listing.id}`} className="text-sm text-white font-bold line-clamp-1 mb-1 hover:text-blue-400 transition-colors">
                      {listing.title}
                    </Link>
                    <div className="text-[11px] text-emerald-400 mb-3 truncate">
                      {listing.category}
                    </div>
                    
                    <div className="flex items-center justify-between mt-auto">
                      <div className="text-lg font-bold text-white">
                        {listing.price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
                      </div>
                      <button className="w-8 h-8 rounded bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white transition-colors">
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {listings.length > visibleCount && (
              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 16)}
                  className="px-8 py-2.5 rounded-full text-sm font-medium bg-[#8b5cf6] text-white hover:bg-[#7c3aed] transition-colors"
                >
                  + Daha fazla server tanıtımı göster
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
