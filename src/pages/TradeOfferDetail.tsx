import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import toast from 'react-hot-toast';
import { ArrowRightLeft, Check, X, MessageSquare, AlertTriangle, Clock, ShieldCheck } from 'lucide-react';
import SEOHead from '../components/SEOHead';

export default function TradeOfferDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [offer, setOffer] = useState<any>(null);
  const [targetItem, setTargetItem] = useState<any>(null);
  const [offeredItems, setOfferedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchOffer = async () => {
      setLoading(true);
      try {
        if (!id) return;
        const offerRef = doc(db, 'trade_offers', id);
        const offerSnap = await getDoc(offerRef);
        
        if (!offerSnap.exists()) {
          toast.error('Teklif bulunamadı.');
          navigate('/');
          return;
        }

        const offerData: any = { id: offerSnap.id, ...offerSnap.data() };
        
        // Check permissions
        if (offerData.senderUserId !== user.uid && offerData.receiverUserId !== user.uid) {
          toast.error('Bu teklifi görüntüleme yetkiniz yok.');
          navigate('/');
          return;
        }

        setOffer(offerData);

        // Fetch items
        const itemsQ = query(collection(db, 'trade_offer_items'), where('tradeOfferId', '==', id));
        const itemsSnap = await getDocs(itemsQ);
        const items: any[] = itemsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const target = items.find(i => i.isTarget);
        const offered = items.filter(i => !i.isTarget);

        if (target) {
          const tDoc = await getDoc(doc(db, 'products', target.listingId));
          if (tDoc.exists()) setTargetItem({ id: tDoc.id, ...tDoc.data() });
        }

        const fetchedOffered = [];
        for (const item of offered) {
          const iDoc = await getDoc(doc(db, 'products', item.listingId));
          if (iDoc.exists()) fetchedOffered.push({ id: iDoc.id, ...iDoc.data() });
        }
        setOfferedItems(fetchedOffered);

        // Mark as viewed if receiver
        if (offerData.receiverUserId === user.uid && offerData.status === 'pending') {
          await updateDoc(offerRef, { status: 'viewed', updatedAt: serverTimestamp() });
          setOffer({ ...offerData, status: 'viewed' });
          
          await addDoc(collection(db, 'trade_status_history'), {
            tradeOfferId: id,
            oldStatus: 'pending',
            newStatus: 'viewed',
            changedBy: user.uid,
            createdAt: serverTimestamp()
          });
        }

      } catch (error) {
        console.error('Error fetching offer:', error);
        toast.error('Teklif yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchOffer();
  }, [id, user, navigate]);

  const handleAction = async (action: 'accepted' | 'rejected' | 'cancelled' | 'completed') => {
    if (!offer || !user) return;
    setActionLoading(true);
    try {
      const offerRef = doc(db, 'trade_offers', offer.id);
      
      if (action === 'completed') {
        const completeTradeOfferFn = httpsCallable(functions, 'completeTradeOffer');
        await completeTradeOfferFn({ offerId: offer.id });

        const iAmSender = user.uid === offer.senderUserId;
        const update: any = iAmSender ? { senderConfirmed: true } : { receiverConfirmed: true };
        const senderConfirmed = iAmSender ? true : !!offer.senderConfirmed;
        const receiverConfirmed = iAmSender ? !!offer.receiverConfirmed : true;

        if (senderConfirmed && receiverConfirmed) {
          toast.success('Takas başarıyla tamamlandı!');
          setOffer({ ...offer, ...update, status: 'completed' });
        } else {
          toast.success('Teslimat onayınız kaydedildi. Karşı tarafın onayı bekleniyor.');
          setOffer({ ...offer, ...update });
        }
        return;
      }

      // If accepted, use Cloud Function
      if (action === 'accepted') {
        const acceptTradeOfferFn = httpsCallable(functions, 'acceptTradeOffer');
        await acceptTradeOfferFn({ offerId: offer.id });
        
        setOffer({ ...offer, status: action });
        toast.success('Teklif kabul edildi.');
        return;
      }

      if (action === 'rejected') {
        const rejectTradeOfferFn = httpsCallable(functions, 'rejectTradeOffer');
        await rejectTradeOfferFn({ offerId: offer.id });
        setOffer({ ...offer, status: action });
        toast.success('Teklif reddedildi.');
        return;
      }

      if (action === 'cancelled') {
        const cancelTradeOfferFn = httpsCallable(functions, 'cancelTradeOffer');
        await cancelTradeOfferFn({ offerId: offer.id });
        setOffer({ ...offer, status: action });
        toast.success('Teklif iptal edildi.');
        return;
      }
    } catch (error) {
      console.error('Action error:', error);
      toast.error('İşlem gerçekleştirilemedi.');
    } finally {
      setActionLoading(false);
    }
  };

  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    if (!id || !user) return;
    const q = query(
      collection(db, 'trade_messages'),
      where('tradeOfferId', '==', id)
    );

    const fetchMessages = async () => {
      const snap = await getDocs(q);
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      setMessages(msgs);
    };

    fetchMessages();
  }, [id, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !id || !user) return;
    setSendingMessage(true);
    try {
      const msgData = {
        tradeOfferId: id,
        senderId: user.uid,
        senderName: user.displayName || 'Kullanıcı',
        text: chatMessage.trim(),
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'trade_messages'), msgData);
      setMessages([...messages, { id: docRef.id, ...msgData, createdAt: { seconds: Date.now() / 1000 } }]);
      setChatMessage('');

      // Notify the other party about the new message
      const notifyTradeMessageFn = httpsCallable(functions, 'notifyTradeMessage');
      await notifyTradeMessageFn({ offerId: id, message: chatMessage.trim() });
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Mesaj gönderilemedi.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handlePayment = async () => {
    if (!offer || !user || !isSender) return;
    setActionLoading(true);
    try {
      const payTradeCashDifferenceFn = httpsCallable(functions, 'payTradeCashDifference');
      await payTradeCashDifferenceFn({ offerId: offer.id });

      setOffer({ ...offer, cashPaid: true });
      toast.success('Nakit fark ödemesi başarıyla yapıldı ve emanete alındı.');
    } catch (error: any) {
      console.error('Payment error:', error);
      if (error.message === 'insufficient-balance') {
        toast.error('Yetersiz bakiye. Lütfen bakiye yükleyin.');
        navigate('/kontrol-merkezi');
      } else {
        toast.error('Ödeme işlemi başarısız.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDispute = async () => {
    if (!offer || !user) return;
    const reason = window.prompt('Anlaşmazlık sebebinizi kısaca açıklayın:');
    if (!reason) return;

    setActionLoading(true);
    try {
      await addDoc(collection(db, 'trade_disputes'), {
        tradeOfferId: offer.id,
        senderUserId: user.uid,
        receiverUserId: user.uid === offer.senderUserId ? offer.receiverUserId : offer.senderUserId,
        reason,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'trade_offers', offer.id), {
        status: 'disputed',
        updatedAt: serverTimestamp()
      });

      setOffer({ ...offer, status: 'disputed' });
      toast.success('Anlaşmazlık kaydı oluşturuldu. Destek ekibimiz inceleyecektir.');

      // Notify the other party about the dispute
      const notifyTradeDisputeFn = httpsCallable(functions, 'notifyTradeDispute');
      await notifyTradeDisputeFn({ offerId: offer.id });
    } catch (error) {
      console.error('Dispute error:', error);
      toast.error('Anlaşmazlık kaydı oluşturulamadı.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-white">Yükleniyor...</div>;
  if (!offer || !targetItem) return <div className="text-center py-20 text-white">Teklif bulunamadı.</div>;

  const isSender = user?.uid === offer.senderUserId;
  const isReceiver = user?.uid === offer.receiverUserId;
  const totalOfferedValue = offeredItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0) + (Number(offer.offeredCashAmount) || 0);
  const targetValue = Number(targetItem.estimatedTradeValue) || Number(targetItem.price) || 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-bold">Bekliyor</span>;
      case 'viewed': return <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold">Görüldü</span>;
      case 'accepted': return <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold">Kabul Edildi</span>;
      case 'rejected': return <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold">Reddedildi</span>;
      case 'cancelled': return <span className="bg-gray-500/20 text-gray-400 px-3 py-1 rounded-full text-xs font-bold">İptal Edildi</span>;
      case 'completed': return <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold">Tamamlandı</span>;
      case 'disputed': return <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold">Anlaşmazlık</span>;
      default: return <span className="bg-gray-500/20 text-gray-400 px-3 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <SEOHead 
        title={`Takas Teklifi #${offer.id.slice(0, 8)} - itemTR`}
        description={`${targetItem.title} için takas teklifi detayı ve sohbeti.`}
      />
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#1a1b23] rounded-xl border border-white/5 flex items-center justify-center">
            <ArrowRightLeft className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Takas Teklifi Detayı</h1>
            <p className="text-gray-400 text-sm">Teklif ID: {offer.id}</p>
          </div>
        </div>
        <div>
          {getStatusBadge(offer.status)}
        </div>
      </div>

      {offer.status === 'accepted' && (
        <div className="mb-8 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <div className="flex items-start gap-4 mb-6">
            <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
            <div>
              <h3 className="text-emerald-400 font-bold text-lg mb-1">Anlaşma Sağlandı!</h3>
              <p className="text-sm text-emerald-400/80">
                Bu takas teklifi kabul edildi ve ilgili ilanlar kilitlendi. Ürünleri teslim ettiğinizde veya teslim aldığınızda lütfen aşağıdan onay verin.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {offer.offeredCashAmount > 0 && !offer.cashPaid && isSender && (
              <div className="md:col-span-2 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-2">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-amber-400 font-bold">Nakit Ödeme Gerekli</h4>
                    <p className="text-xs text-amber-400/70">Teklif ettiğiniz {offer.offeredCashAmount.toFixed(2)} ₺ tutarındaki nakit farkı ödemeniz gerekiyor.</p>
                  </div>
                  <button
                    onClick={handlePayment}
                    disabled={actionLoading}
                    className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg transition-colors"
                  >
                    {offer.offeredCashAmount.toFixed(2)} ₺ Öde
                  </button>
                </div>
              </div>
            )}

            <div className={`p-4 rounded-xl border ${offer.senderConfirmed ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-white/5 border-white/10'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-white">Teklif Sahibi Onayı</span>
                {offer.senderConfirmed ? (
                  <Check className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Clock className="w-5 h-5 text-gray-500" />
                )}
              </div>
              <p className="text-xs text-gray-400 mb-4">Ürünleri gönderdiğini ve karşı taraftan ürünleri aldığını onaylar.</p>
              {isSender && !offer.senderConfirmed && (
                <button
                  onClick={() => handleAction('completed')}
                  disabled={actionLoading}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-lg transition-colors"
                >
                  Teslimatı Onayla
                </button>
              )}
            </div>

            <div className={`p-4 rounded-xl border ${offer.receiverConfirmed ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-white/5 border-white/10'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-white">İlan Sahibi Onayı</span>
                {offer.receiverConfirmed ? (
                  <Check className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Clock className="w-5 h-5 text-gray-500" />
                )}
              </div>
              <p className="text-xs text-gray-400 mb-4">Ürünleri gönderdiğini ve karşı taraftan ürünleri aldığını onaylar.</p>
              {isReceiver && !offer.receiverConfirmed && (
                <button
                  onClick={() => handleAction('completed')}
                  disabled={actionLoading}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-lg transition-colors"
                >
                  Teslimatı Onayla
                </button>
              )}
            </div>
          </div>

          <button 
            onClick={handleOpenDispute}
            className="mt-6 text-xs text-red-400 hover:underline flex items-center gap-1 mx-auto"
          >
            <AlertTriangle className="w-3 h-3" />
            Sorun mu var? Anlaşmazlık Aç
          </button>
        </div>
      )}

      {offer.status === 'completed' && (
        <div className="mb-8 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
            <Check className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-emerald-400 font-bold text-lg">Takas Tamamlandı</h3>
            <p className="text-sm text-emerald-400/80">Bu takas işlemi başarıyla sonuçlandırıldı. Ürünler sahiplerine ulaştı.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Target Item (What the sender wants) */}
        <div className="bg-[#1a1b23] rounded-xl border border-white/5 p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            {isSender ? 'İstediğiniz Ürün' : 'İlanınız'}
          </h2>
          <div className="flex gap-4 p-4 bg-[#111218] rounded-xl border border-white/5">
            <img src={targetItem.image} alt={targetItem.title} className="w-24 h-24 rounded-lg object-cover" />
            <div>
              <h3 className="text-white font-bold mb-1">{targetItem.title}</h3>
              <p className="text-xs text-emerald-400 mb-2">{targetItem.category}</p>
              <div className="text-lg font-bold text-white">{targetValue.toFixed(2)} ₺</div>
            </div>
          </div>
        </div>

        {/* Offered Items (What the sender offers) */}
        <div className="bg-[#1a1b23] rounded-xl border border-white/5 p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            {isSender ? 'Teklif Ettiğiniz Ürünler' : 'Size Teklif Edilenler'}
          </h2>
          <div className="space-y-3">
            {offeredItems.map(item => (
              <div key={item.id} className="flex gap-4 p-3 bg-[#111218] rounded-xl border border-white/5">
                <img src={item.image} alt={item.title} className="w-16 h-16 rounded-lg object-cover" />
                <div>
                  <h3 className="text-sm text-white font-bold mb-1">{item.title}</h3>
                  <div className="text-sm font-bold text-emerald-400">{Number(item.price).toFixed(2)} ₺</div>
                </div>
              </div>
            ))}
            {offeredItems.length === 0 && (
              <p className="text-sm text-gray-400 italic">Ürün teklif edilmedi.</p>
            )}
            
            {Number(offer.offeredCashAmount) > 0 && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex justify-between items-center">
                <span className="text-amber-400 font-medium">Nakit Fark Teklifi</span>
                <span className="text-amber-400 font-bold text-lg">+{Number(offer.offeredCashAmount).toFixed(2)} ₺</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message & Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-1">
          {offer.message && (
            <div className="bg-[#1a1b23] rounded-xl border border-white/5 p-6 h-full">
              <h3 className="text-sm font-bold text-gray-400 uppercase mb-3">Teklif Mesajı</h3>
              <p className="text-white text-sm bg-[#111218] p-4 rounded-xl border border-white/5">{offer.message}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="bg-[#1a1b23] rounded-xl border border-white/5 p-6 flex flex-col h-[400px]">
            <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Takas Sohbeti
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.senderId === user?.uid ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-xl text-sm ${
                    msg.senderId === user?.uid 
                      ? 'bg-amber-500 text-white rounded-tr-none' 
                      : 'bg-[#111218] text-gray-300 border border-white/5 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1">
                    {msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Gönderiliyor...'}
                  </span>
                </div>
              ))}
              {messages.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-gray-500 text-sm italic">
                  Henüz mesaj yok. Takas detaylarını burada konuşabilirsiniz.
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Mesajınızı yazın..."
                className="flex-1 bg-[#111218] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
              <button
                type="submit"
                disabled={sendingMessage || !chatMessage.trim()}
                className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white p-2 rounded-xl transition-colors"
              >
                <Check className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Actions */}
      {(offer.status === 'pending' || offer.status === 'viewed') && (
        <div className="bg-[#1a1b23] rounded-xl border border-white/5 p-6 flex flex-wrap gap-4 justify-end">
          {isReceiver && (
            <>
              <button
                onClick={() => handleAction('rejected')}
                disabled={actionLoading}
                className="px-6 py-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 font-bold rounded-xl transition-colors flex items-center gap-2"
              >
                <X className="w-5 h-5" />
                Reddet
              </button>
              <button
                onClick={() => navigate(`/trade/offer/${targetItem.id}?counter=${offer.id}`)}
                disabled={actionLoading}
                className="px-6 py-3 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 font-bold rounded-xl transition-colors flex items-center gap-2"
              >
                <ArrowRightLeft className="w-5 h-5" />
                Karşı Teklif Ver
              </button>
              <button
                onClick={() => handleAction('accepted')}
                disabled={actionLoading}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
              >
                <Check className="w-5 h-5" />
                Kabul Et
              </button>
            </>
          )}
          {isSender && (
            <button
              onClick={() => handleAction('cancelled')}
              disabled={actionLoading}
              className="px-6 py-3 bg-gray-500/10 text-gray-400 hover:bg-gray-500/20 font-bold rounded-xl transition-colors flex items-center gap-2"
            >
              <X className="w-5 h-5" />
              Teklifi İptal Et
            </button>
          )}
        </div>
      )}
    </div>
  );
}
