import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { ArrowRightLeft, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import SEOHead from '../components/SEOHead';

export default function TradeOffersList() {
  const { user } = useAuth();
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

  useEffect(() => {
    if (!user) return;

    const fetchOffers = async () => {
      setLoading(true);
      try {
        const field = activeTab === 'received' ? 'receiverUserId' : 'senderUserId';
        const q = query(
          collection(db, 'trade_offers'),
          where(field, '==', user.uid)
          // orderBy('createdAt', 'desc') // Requires composite index
        );
        const snap = await getDocs(q);
        const fetchedOffers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Sort manually since we might not have the index
        fetchedOffers.sort((a: any, b: any) => {
          const timeA = a.createdAt?.toMillis?.() || 0;
          const timeB = b.createdAt?.toMillis?.() || 0;
          return timeB - timeA;
        });

        setOffers(fetchedOffers);
      } catch (error) {
        console.error('Error fetching offers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, [user, activeTab]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="bg-amber-500/20 text-amber-400 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> Bekliyor</span>;
      case 'viewed': return <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> Görüldü</span>;
      case 'accepted': return <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Kabul Edildi</span>;
      case 'rejected': return <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><XCircle className="w-3 h-3" /> Reddedildi</span>;
      case 'cancelled': return <span className="bg-gray-500/20 text-gray-400 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> İptal Edildi</span>;
      case 'disputed': return <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Anlaşmazlık</span>;
      case 'countered': return <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><ArrowRightLeft className="w-3 h-3" /> Karşı Teklif</span>;
      default: return <span className="bg-gray-500/20 text-gray-400 px-2 py-1 rounded text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="max-w-[1320px] mx-auto px-4 py-8">
      <SEOHead title="Takas Tekliflerim" description="Gelen ve giden takas tekliflerinizi yönetin." />
      
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
          <ArrowRightLeft className="w-6 h-6 text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Takas Tekliflerim</h1>
          <p className="text-gray-400 text-sm">Gelen ve giden takas tekliflerinizi buradan yönetebilirsiniz.</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6 border-b border-white/5 pb-4">
        <button
          onClick={() => setActiveTab('received')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'received' ? 'bg-amber-500 text-white' : 'bg-[#1a1b23] text-gray-400 hover:text-white'
          }`}
        >
          Gelen Teklifler
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'sent' ? 'bg-amber-500 text-white' : 'bg-[#1a1b23] text-gray-400 hover:text-white'
          }`}
        >
          Giden Teklifler
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-white">Yükleniyor...</div>
      ) : offers.length === 0 ? (
        <div className="text-center py-20 bg-[#1a1b23] rounded-xl border border-white/5">
          <ArrowRightLeft className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Henüz {activeTab === 'received' ? 'gelen' : 'giden'} takas teklifiniz bulunmuyor.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {offers.map(offer => (
            <Link 
              key={offer.id} 
              to={`/trade/offers/${offer.id}`}
              className="bg-[#1a1b23] rounded-xl border border-white/5 p-4 hover:border-amber-500/50 transition-colors block"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="text-xs text-gray-400">ID: {offer.id.substring(0, 8)}...</div>
                {getStatusBadge(offer.status)}
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Nakit Fark:</span>
                  <span className="text-sm font-bold text-emerald-400">+{Number(offer.offeredCashAmount).toFixed(2)} ₺</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Tarih:</span>
                  <span className="text-sm text-white">
                    {offer.createdAt?.toDate ? offer.createdAt.toDate().toLocaleDateString('tr-TR') : 'Bilinmiyor'}
                  </span>
                </div>
              </div>

              <div className="text-amber-500 text-sm font-medium text-center py-2 bg-amber-500/10 rounded-lg">
                Detayları Görüntüle
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
