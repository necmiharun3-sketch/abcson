import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import toast from 'react-hot-toast';
import { ArrowRightLeft, Plus, X, Search, AlertTriangle, Check } from 'lucide-react';

export default function TradeOffer() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [targetListing, setTargetListing] = useState<any>(null);
  const [myListings, setMyListings] = useState<any[]>([]);
  const [selectedListings, setSelectedListings] = useState<any[]>([]);
  const [cashOffer, setCashOffer] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [counterOfferId, setCounterOfferId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      toast.error('Takas teklifi vermek için giriş yapmalısınız.');
      navigate('/login');
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const counterId = searchParams.get('counter');
    if (counterId) setCounterOfferId(counterId);

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch target listing
        if (id) {
          const docRef = doc(db, 'products', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (!data.isTradeAllowed) {
              toast.error('Bu ilan takasa kapalı.');
              navigate(`/product/${id}`);
              return;
            }
            if (data.sellerId === user.uid) {
              toast.error('Kendi ilanınıza takas teklifi veremezsiniz.');
              navigate(`/product/${id}`);
              return;
            }
            setTargetListing({ id: docSnap.id, ...data });
          } else {
            toast.error('İlan bulunamadı.');
            navigate('/');
            return;
          }
        }

        // Fetch user's listings
        const q = query(
          collection(db, 'products'),
          where('sellerId', '==', user.uid),
          where('status', '==', 'active')
        );
        const mySnap = await getDocs(q);
        const myItems = mySnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setMyListings(myItems);

        // If counter offer, prefill
        if (counterId) {
          const counterRef = doc(db, 'trade_offers', counterId);
          const counterSnap = await getDoc(counterRef);
          if (counterSnap.exists()) {
            const counterData = counterSnap.data();
            setCashOffer(String(counterData.offeredCashAmount || ''));
            setMessage(`Karşı teklif: ${counterData.message || ''}`);
            
            // Fetch items from original offer to pre-select? 
            // Actually, a counter offer usually means the receiver wants to change the items.
            // But let's pre-select what was offered if they are still active.
            const itemsQ = query(collection(db, 'trade_offer_items'), where('tradeOfferId', '==', counterId));
            const itemsSnap = await getDocs(itemsQ);
            const offeredListingIds = itemsSnap.docs
              .filter(d => !d.data().isTarget)
              .map(d => d.data().listingId);
            
            const toSelect = myItems.filter(item => offeredListingIds.includes(item.id));
            setSelectedListings(toSelect);
          }
        }
      } catch (error) {
        console.error('Error fetching trade data:', error);
        toast.error('Bilgiler yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user, navigate]);

  const handleSelectListing = (listing: any) => {
    if (selectedListings.find(l => l.id === listing.id)) {
      setSelectedListings(selectedListings.filter(l => l.id !== listing.id));
    } else {
      setSelectedListings([...selectedListings, listing]);
    }
  };

  const handleSubmitOffer = async () => {
    if (selectedListings.length === 0 && !cashOffer) {
      toast.error('Lütfen en az bir ürün seçin veya nakit teklif edin.');
      return;
    }

    setSubmitting(true);
    try {
      const createTradeOfferFn = httpsCallable(functions, 'createTradeOffer');
      const result = await createTradeOfferFn({
        targetListingId: targetListing.id,
        offeredListingIds: selectedListings.map(l => l.id),
        cashOffer: Number(cashOffer) || 0,
        message: message.trim(),
        counterOfferId: counterOfferId || null
      });

      const data = result.data as any;
      const offerId = data.offerId;

      toast.success(counterOfferId ? 'Karşı teklifiniz gönderildi!' : 'Takas teklifiniz başarıyla gönderildi!');
      navigate(`/trade/offers/${offerId}`);
    } catch (error: any) {
      console.error('Error submitting trade offer:', error);
      if (error.message === 'daily limit reached') {
        toast.error('Günlük takas teklifi sınırına (10) ulaştınız. Lütfen yarın tekrar deneyin.');
      } else if (error.message === 'active offer exists') {
        toast.error('Bu ilan için zaten aktif bir teklifiniz bulunuyor.');
      } else {
        toast.error('Teklif gönderilirken bir hata oluştu.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-white">Yükleniyor...</div>;
  if (!targetListing) return <div className="text-center py-20 text-white">İlan bulunamadı.</div>;

  const totalOfferedValue = selectedListings.reduce((sum, item) => sum + (Number(item.price) || 0), 0) + (Number(cashOffer) || 0);
  const targetValue = Number(targetListing.estimatedTradeValue) || Number(targetListing.price) || 0;
  const valueDifference = totalOfferedValue - targetValue;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
          <ArrowRightLeft className="w-6 h-6 text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Takas Teklifi Oluştur</h1>
          <p className="text-gray-400 text-sm">Karşı tarafa sunacağınız ürünleri ve nakit farkını belirleyin.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Offer Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Target Listing Summary */}
          <div className="bg-[#1a1b23] rounded-xl border border-white/5 p-4">
            <h2 className="text-sm font-bold text-gray-400 uppercase mb-4">İstediğiniz Ürün</h2>
            <div className="flex gap-4">
              <img src={targetListing.image} alt={targetListing.title} className="w-24 h-24 rounded-lg object-cover" />
              <div>
                <h3 className="text-white font-bold mb-1">{targetListing.title}</h3>
                <p className="text-xs text-emerald-400 mb-2">{targetListing.category}</p>
                <div className="text-lg font-bold text-white">{targetValue.toFixed(2)} ₺ <span className="text-xs text-gray-500 font-normal">(Tahmini Değer)</span></div>
              </div>
            </div>
          </div>

          {/* Select Items */}
          <div className="bg-[#1a1b23] rounded-xl border border-white/5 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Ürünlerinizi Seçin</h2>
              <span className="text-sm text-gray-400">{selectedListings.length} ürün seçildi</span>
            </div>

            {myListings.length === 0 ? (
              <div className="text-center py-8 bg-[#111218] rounded-xl border border-white/5">
                <p className="text-gray-400 mb-4">Takas edebileceğiniz aktif bir ilanınız bulunmuyor.</p>
                <button onClick={() => navigate('/ilan-ekle')} className="text-amber-500 hover:underline text-sm font-medium">
                  Hemen yeni ilan ekle
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {myListings.map(listing => {
                  const isSelected = selectedListings.find(l => l.id === listing.id);
                  return (
                    <div 
                      key={listing.id}
                      onClick={() => handleSelectListing(listing)}
                      className={`flex gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected ? 'border-amber-500 bg-amber-500/10' : 'border-white/5 bg-[#111218] hover:border-white/10'
                      }`}
                    >
                      <img src={listing.image} alt={listing.title} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white truncate mb-1">{listing.title}</h4>
                        <div className="text-xs font-bold text-emerald-400">{Number(listing.price).toFixed(2)} ₺</div>
                      </div>
                      <div className="shrink-0 flex items-center">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected ? 'bg-amber-500 border-amber-500' : 'border-gray-500'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cash Difference & Message */}
          <div className="bg-[#1a1b23] rounded-xl border border-white/5 p-6 space-y-6">
            {targetListing.acceptsCashDifference ? (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nakit Fark Ekle (İsteğe Bağlı)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={cashOffer}
                    onChange={(e) => setCashOffer(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#111218] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">₺</span>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">Bu ilan sahibi takas tekliflerinde nakit fark kabul etmemektedir. Sadece ürün takası yapabilirsiniz.</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Teklif Mesajı
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Karşı tarafa teklifinizle ilgili bir mesaj yazın..."
                className="w-full bg-[#111218] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors resize-none"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Summary */}
        <div className="lg:col-span-1">
          <div className="bg-[#1a1b23] rounded-xl border border-white/5 p-6 sticky top-24">
            <h2 className="text-lg font-bold text-white mb-6">Teklif Özeti</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Seçilen Ürünler ({selectedListings.length})</span>
                <span className="text-white font-medium">{selectedListings.reduce((s, i) => s + (Number(i.price) || 0), 0).toFixed(2)} ₺</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Nakit Fark</span>
                <span className="text-white font-medium">{(Number(cashOffer) || 0).toFixed(2)} ₺</span>
              </div>
              <div className="pt-4 border-t border-white/5 flex justify-between">
                <span className="text-gray-300 font-medium">Toplam Teklif Değeri</span>
                <span className="text-amber-400 font-bold text-lg">{totalOfferedValue.toFixed(2)} ₺</span>
              </div>
            </div>

            <div className="p-4 bg-[#111218] rounded-xl border border-white/5 mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Karşı Tarafın İstediği</span>
                <span className="text-white font-medium">{targetValue.toFixed(2)} ₺</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Değer Farkı</span>
                <span className={`font-bold ${valueDifference >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {valueDifference > 0 ? '+' : ''}{valueDifference.toFixed(2)} ₺
                </span>
              </div>
              {valueDifference < 0 && (
                <p className="text-xs text-red-400 mt-2">Teklifiniz karşı tarafın beklediği değerin altında. Reddedilme ihtimali yüksek olabilir.</p>
              )}
            </div>

            <button
              onClick={handleSubmitOffer}
              disabled={submitting || (selectedListings.length === 0 && !cashOffer)}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? 'Gönderiliyor...' : 'Teklifi Gönder'}
            </button>
            <p className="text-xs text-gray-500 text-center mt-4">
              Teklifiniz kabul edildiğinde ilgili ilanlar geçici olarak kilitlenecektir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
