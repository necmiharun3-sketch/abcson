import { Link } from 'react-router-dom';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../firebase';
import { collection, query, getDocs, limit } from 'firebase/firestore';
import SectionHeader from './SectionHeader';
import { Heart, Clock, ShoppingCart, Rocket } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  mapProductDocToHomeListing,
  sortDocPairsNewestFirst,
  isServerTanitimCategory,
  isVitrinProduct,
  type HomeListing,
} from '../lib/homeListingUtils';

export default function ShowcaseListings() {
  const [listings, setListings] = useState<HomeListing[]>([]);
  const [loadingRemote, setLoadingRemote] = useState(true);

  const mergeRemote = useCallback((pairs: { id: string; data: Record<string, unknown> }[]) => {
    const sorted = sortDocPairsNewestFirst(pairs);
    const vitrinOnly = sorted.filter(
      ({ data }) => isVitrinProduct(data) && !isServerTanitimCategory(data.category)
    );
    setListings(vitrinOnly.map(({ id, data }) => mapProductDocToHomeListing(id, data)).slice(0, 24));
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
            setTimeout(() => reject(new Error('Vitrin ilanları yüklenirken zaman aşımı oluştu. Lütfen internet bağlantınızı kontrol edin veya sayfayı yenileyin.')), 30000)
          ),
        ]);
        if (cancelled) return;
        const pairs = snapshot.docs.map((doc) => ({
          id: doc.id,
          data: doc.data() as Record<string, unknown>,
        }));
        mergeRemote(pairs);
      } catch (e: any) {
        console.error('ShowcaseListings Error:', e);
        if (e?.code === 'permission-denied' || e?.message?.includes('Missing or insufficient permissions')) {
          if (!cancelled) {
             toast.error('Veritabanı kuralları güncel değil. Lütfen Firestore kurallarını güncelleyin.', { id: 'firestore-rules-error' });
             setListings([]);
             setLoadingRemote(false);
          }
          return;
        }
        if (!cancelled && retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying showcase fetch (${retryCount}/${maxRetries})...`);
          setTimeout(run, 2000);
          return;
        }
        if (!cancelled) setListings([]);
      } finally {
        if (!cancelled) setLoadingRemote(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [mergeRemote]);

  const visibleListings = listings;

  return (
    <section
      id="vitrin-ilanlari"
      className="py-0 scroll-mt-28"
      aria-labelledby="showcase-listings-heading"
    >
      <div className="w-full">
        <SectionHeader 
          title="Vitrin İlanları" 
          subtitle="Öne çıkarılmış en popüler ilanlar."
          icon={<Rocket className="w-6 h-6" />}
        />

        <div className="bg-[#1a1b23] rounded-xl p-4 mb-4 flex items-center justify-between border border-white/5">
          <div className="flex items-center gap-4">
            <div className="text-4xl">🚀</div>
            <div>
              <h3 className="text-white font-bold text-lg">
                Öne çıkarılmış vitrin ilanları
              </h3>
              <p className="text-white/60 text-sm">
                Bu alanda yalnızca vitrin / öne çıkarma ile işaretlenen ilanlar listelenir.
              </p>
            </div>
          </div>
          <Link
            to="/ilan-yukari-tasima"
            className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors hidden sm:inline-block text-center"
          >
            Öne çıkarma
          </Link>
        </div>

        {loadingRemote && listings.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="bg-[#1a1b23] rounded-xl aspect-[3/4] animate-pulse border border-white/5"
              />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-[#1a1b23]/80 px-4 py-10 text-center text-sm text-white/60">
            Henüz vitrin ilanı yok. İlanlarınızı öne çıkarmak için{' '}
            <Link to="/ilan-yukari-tasima" className="text-[#a78bfa] underline">
              ilan yükseltme
            </Link>{' '}
            sayfasını kullanın veya yönetim panelinden vitrin işaretleyin.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
            {visibleListings.map((listing, idx) => (
              <div
                key={listing.id}
                className="group bg-[#1a1b23] rounded-xl overflow-hidden border border-white/5 hover:border-white/20 transition-all flex flex-col relative"
              >
                {/* Image Area */}
                <Link to={`/product/${listing.id}`} className="relative aspect-[4/5] overflow-hidden block">
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
                  <Link to={`/product/${listing.id}`} className="text-sm text-white font-bold line-clamp-1 mb-1 hover:text-blue-400 transition-colors">
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
        )}
      </div>
    </section>
  );
}
