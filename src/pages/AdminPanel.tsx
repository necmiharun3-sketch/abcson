import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { addDoc, collection, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import toast from 'react-hot-toast';

type TabKey = 'withdrawals' | 'support' | 'moderation' | 'kyc' | 'users' | 'disputes' | 'trades' | 'trade_disputes' | 'finance' | 'logs' | 'settings';

export default function AdminPanel() {
  const { user, profile, loading } = useAuth();
  const [tab, setTab] = useState<TabKey>('withdrawals');
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [kycQueue, setKycQueue] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [tradeDisputes, setTradeDisputes] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchUser, setSearchUser] = useState('');
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [siteSettings, setSiteSettings] = useState<any>({
    maintenanceMode: false,
    maintenanceMessage: '',
    topBarMessage: '',
    floatingChatEnabled: true,
    banners: [
      { label: 'PUBG MOBILE', text: 'RP A18 Şimdi Oyunda!', accent: 'amber', active: true },
      { label: 'Valorant', text: 'Karaçalı Koleksiyonu Şimdi Oyunda', accent: 'red', active: true },
      { label: 'FC26 Kategorisine Özel', text: 'BIZIMCOCUKLAR koduyla 50₺ üzeri alışverişlerinde %5 indirim!', accent: 'emerald', active: true },
    ],
    heroSlides: [
      {
        imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=2200&q=80',
        eyebrow: 'FPS',
        title: 'Valorant VP ve hesap ilanları',
        query: 'Valorant',
        active: true,
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1546443046-ed1ce6ffd1f0?auto=format&fit=crop&w=2200&q=80',
        eyebrow: 'MOBA',
        title: 'League of Legends RP ve hesap ilanları',
        query: 'League of Legends',
        active: true,
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=2200&q=80',
        eyebrow: 'BATTLE ROYALE',
        title: 'PUBG UC ve hesap ilanları',
        query: 'PUBG',
        active: true,
      },
    ],
  });

  const isStaff = profile?.role === 'admin' || profile?.role === 'moderator';
  const isAdmin = profile?.role === 'admin';

  const loadAll = async () => {
    if (!user || !isStaff) return;
    setLoadingData(true);
    try {
      const [
        wdSnap,
        ticketSnap,
        productSnap,
        kycSnap,
        userSnap,
        disputeSnap,
        tradeSnap,
        tradeDisputeSnap,
        txSnap,
        logSnap,
      ] = await Promise.all([
        getDocs(query(collection(db, 'withdrawals'), orderBy('createdAt', 'desc'), limit(100))),
        getDocs(query(collection(db, 'supportTickets'), orderBy('createdAt', 'desc'), limit(100))),
        getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(100))),
        getDocs(query(collection(db, 'kycRequests'), orderBy('createdAt', 'desc'), limit(100))),
        getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(100))),
        getDocs(query(collection(db, 'disputes'), orderBy('createdAt', 'desc'), limit(100))),
        getDocs(query(collection(db, 'trade_offers'), orderBy('createdAt', 'desc'), limit(100))),
        getDocs(query(collection(db, 'trade_disputes'), orderBy('createdAt', 'desc'), limit(100))),
        getDocs(query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), limit(200))),
        getDocs(query(collection(db, 'adminLogs'), orderBy('createdAt', 'desc'), limit(200))),
      ]);

      setWithdrawals(wdSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setTickets(ticketSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setProducts(productSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setKycQueue(kycSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setUsers(userSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setDisputes(disputeSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setTrades(tradeSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setTradeDisputes(tradeDisputeSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setTransactions(txSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setAdminLogs(logSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
      toast.error('Admin verileri yüklenemedi.');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [user, profile?.role]);

  const loadSettings = async () => {
    if (!user || !isStaff) return;
    try {
      const ref = doc(db, 'siteSettings', 'global');
      const snap = await getDoc(ref);
      if (snap.exists()) setSiteSettings((prev: any) => ({ ...prev, ...(snap.data() as any) }));
    } catch {
      // no-op
    }
  };

  useEffect(() => {
    loadSettings();
  }, [user, profile?.role]);

  const saveSettings = async () => {
    if (!isStaff) return;
    try {
      await setDoc(doc(db, 'siteSettings', 'global'), { ...siteSettings, updatedAt: serverTimestamp(), updatedBy: user?.uid || '' }, { merge: true });
      await logAction('siteSettings.update', 'siteSettings', 'global', siteSettings);
      toast.success('Site ayarları kaydedildi.');
    } catch {
      toast.error('Site ayarları kaydedilemedi.');
    }
  };

  const logAction = async (action: string, entity: string, entityId: string, details?: any) => {
    if (!user) return;
    await addDoc(collection(db, 'adminLogs'), {
      actorId: user.uid,
      actorRole: profile?.role || 'unknown',
      action,
      entity,
      entityId,
      details: details || {},
      createdAt: serverTimestamp(),
    });
  };

  const updateWithdrawalStatus = async (row: any, status: 'Onaylandı' | 'Reddedildi') => {
    if (!isStaff) return;
    const rejectionReason = status === 'Reddedildi' ? window.prompt('Red nedeni girin:') || '' : '';
    try {
      await updateDoc(doc(db, 'withdrawals', row.id), {
        status,
        rejectionReason,
        processedBy: user?.uid || '',
        processedAt: serverTimestamp(),
      });
      await logAction('withdrawal.updateStatus', 'withdrawals', row.id, { status, rejectionReason });
      toast.success('Çekim durumu güncellendi.');
      loadAll();
    } catch {
      toast.error('Çekim işlemi güncellenemedi.');
    }
  };

  const updateTicket = async (ticket: any, status: string) => {
    if (!isStaff) return;
    try {
      await updateDoc(doc(db, 'supportTickets', ticket.id), {
        status,
        assignedTo: user?.uid || '',
        updatedAt: serverTimestamp(),
      });
      await logAction('ticket.update', 'supportTickets', ticket.id, { status });
      toast.success('Destek talebi güncellendi.');
      loadAll();
    } catch {
      toast.error('Destek talebi güncellenemedi.');
    }
  };

  const addTicketReply = async (ticket: any) => {
    const message = (replyText[ticket.id] || '').trim();
    if (!message) return;
    try {
      await addDoc(collection(db, 'supportTicketReplies'), {
        ticketId: ticket.id,
        actorId: user?.uid || '',
        actorRole: profile?.role || 'moderator',
        message,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'supportTickets', ticket.id), {
        status: 'pending_user',
        updatedAt: serverTimestamp(),
        lastReplyAt: serverTimestamp(),
        lastReplyBy: user?.uid || '',
        reply: message,
        replies: [
          ...((ticket.replies || []) as any[]),
          { actorId: user?.uid || '', actorRole: profile?.role || 'moderator', message, createdAt: new Date().toISOString() }
        ]
      });
      await logAction('ticket.reply', 'supportTickets', ticket.id, { message });
      setReplyText((prev) => ({ ...prev, [ticket.id]: '' }));
      toast.success('Ticket cevabı kaydedildi.');
    } catch {
      toast.error('Cevap kaydedilemedi.');
    }
  };

  const moderateProduct = async (item: any, moderationStatus: string) => {
    if (!isStaff) return;
    const reason = window.prompt('Moderasyon notu / sebep girin:') || '';
    try {
      await updateDoc(doc(db, 'products', item.id), {
        moderationStatus,
        moderationReason: reason,
        status: moderationStatus === 'approved' ? 'active' : moderationStatus === 'suspended' ? 'inactive' : item.status || 'inactive',
        isVitrin: moderationStatus === 'removed_from_showcase' ? false : item.isVitrin || false,
        updatedAt: serverTimestamp(),
      });
      await logAction('product.moderation', 'products', item.id, { moderationStatus, reason });
      toast.success('İlan moderasyonu güncellendi.');
      loadAll();
    } catch {
      toast.error('İlan moderasyonu başarısız.');
    }
  };

  const reviewKyc = async (request: any, status: 'verified' | 'rejected' | 'needs_more_documents') => {
    if (!isStaff) return;
    const note = status !== 'verified' ? window.prompt('İnceleme notu girin:') || '' : '';
    try {
      await updateDoc(doc(db, 'kycRequests', request.id), {
        status,
        reviewedBy: user?.uid || '',
        reviewNote: note,
        reviewedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'users', request.userId), {
        kycStatus: status === 'needs_more_documents' ? 'pending' : status,
        isVerifiedSeller: status === 'verified',
        storeLevel: status === 'verified' ? 'corporate' : 'standard',
      });
      await logAction('kyc.review', 'kycRequests', request.id, { status, note, userId: request.userId });
      toast.success('KYC başvurusu güncellendi.');
      loadAll();
    } catch {
      toast.error('KYC güncellemesi başarısız.');
    }
  };

  const updateUser = async (u: any, patch: any, action: string) => {
    if (!isStaff) return;
    try {
      await updateDoc(doc(db, 'users', u.id), { ...patch, updatedAt: serverTimestamp() });
      await logAction(action, 'users', u.id, patch);
      toast.success('Kullanıcı kaydı güncellendi.');
      loadAll();
    } catch {
      toast.error('Kullanıcı güncellemesi başarısız.');
    }
  };

  const resolveDispute = async (d: any, decision: 'refund_buyer' | 'release_seller') => {
    if (!isStaff) return;
    const note = window.prompt('Karar notu girin:') || '';
    try {
      await updateDoc(doc(db, 'disputes', d.id), {
        status: 'resolved',
        decision,
        note,
        resolvedBy: user?.uid || '',
        resolvedAt: serverTimestamp(),
      });
      await logAction('dispute.resolve', 'disputes', d.id, { decision, note });
      toast.success('Uyuşmazlık kararı kaydedildi.');
      loadAll();
    } catch {
      toast.error('Uyuşmazlık çözümlenemedi.');
    }
  };

  const resolveTradeDispute = async (d: any, decision: 'cancel_trade' | 'complete_trade') => {
    if (!isStaff) return;
    const note = window.prompt('Karar notu girin:') || '';
    try {
      await updateDoc(doc(db, 'trade_disputes', d.id), {
        status: 'resolved',
        decision,
        note,
        resolvedBy: user?.uid || '',
        resolvedAt: serverTimestamp(),
      });

      if (decision === 'cancel_trade') {
        // Update trade offer status
        await updateDoc(doc(db, 'trade_offers', d.tradeOfferId), {
          status: 'cancelled',
          updatedAt: serverTimestamp()
        });

        // Unlock items
        const itemsQ = query(collection(db, 'trade_offer_items'), where('tradeOfferId', '==', d.tradeOfferId));
        const itemsSnap = await getDocs(itemsQ);
        for (const itemDoc of itemsSnap.docs) {
          const itemData = itemDoc.data();
          await updateDoc(doc(db, 'products', itemData.listingId), {
            status: 'active',
            lockedByTradeId: null
          });
        }
      } else {
        await updateDoc(doc(db, 'trade_offers', d.tradeOfferId), {
          status: 'completed',
          updatedAt: serverTimestamp()
        });

        // Mark items as sold
        const itemsQ = query(collection(db, 'trade_offer_items'), where('tradeOfferId', '==', d.tradeOfferId));
        const itemsSnap = await getDocs(itemsQ);
        for (const itemDoc of itemsSnap.docs) {
          const itemData = itemDoc.data();
          await updateDoc(doc(db, 'products', itemData.listingId), {
            status: 'sold',
            lockedByTradeId: d.tradeOfferId
          });
        }
      }

      await logAction('tradeDispute.resolve', 'trade_disputes', d.id, { decision, note });
      toast.success('Takas uyuşmazlığı çözümlendi.');

      // Notify both parties
      const parties = [d.senderUserId, d.receiverUserId];
      for (const userId of parties) {
        await addDoc(collection(db, 'notifications'), {
          userId,
          type: 'info',
          title: 'Takas Uyuşmazlığı Çözüldü',
          message: `Uyuşmazlık kararı: ${decision === 'cancel_trade' ? 'Takas iptal edildi' : 'Takas tamamlandı'}. Not: ${note}`,
          isRead: false,
          link: `/trade/offers/${d.tradeOfferId}`,
          createdAt: serverTimestamp()
        });
      }

      loadAll();
    } catch (error) {
      console.error('Trade dispute resolution error:', error);
      toast.error('Takas uyuşmazlığı çözümlenemedi.');
    }
  };

  const addManualAdjustment = async () => {
    const userId = window.prompt('Kullanıcı ID:') || '';
    const amount = Number(window.prompt('Tutar (+/-):') || 0);
    const reason = window.prompt('Açıklama:') || 'Manual adjustment';
    if (!userId || Number.isNaN(amount) || amount === 0) return;
    try {
      await addDoc(collection(db, 'transactions'), {
        userId,
        type: 'manual_adjustment',
        amount,
        fee: 0,
        status: 'completed',
        relatedId: user?.uid || '',
        reason,
        createdAt: serverTimestamp(),
      });
      await logAction('finance.manualAdjustment', 'transactions', userId, { amount, reason });
      toast.success('Manuel finans hareketi kaydedildi.');
      loadAll();
    } catch {
      toast.error('Manuel işlem kaydedilemedi.');
    }
  };

  const filteredUsers = useMemo(
    () => users.filter((u) => (u.username || '').toLowerCase().includes(searchUser.toLowerCase()) || u.id.includes(searchUser)),
    [users, searchUser]
  );

  if (loading) return <div className="text-center py-20 text-white">Yükleniyor...</div>;
  if (!user) return <Navigate to="/admin/login" />;
  if (!isStaff) {
    return (
      <div className="max-w-2xl mx-auto bg-[#1a1b23] border border-white/10 rounded-2xl p-8 text-center">
        <div className="text-2xl font-bold text-white mb-2">Yetkisiz Erisim</div>
        <p className="text-gray-400 mb-5">Admin paneline sadece moderator veya admin hesaplar erisebilir.</p>
        <Link to="/kontrol-merkezi" className="btn-buy inline-flex px-5 py-2.5 rounded-xl text-white font-bold">
          Kontrol Merkezine Don
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1500px] mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
      <div className="flex flex-wrap gap-2">
        {[
          ['withdrawals', 'Çekimler'],
          ['support', 'Destek'],
          ['moderation', 'İlan Moderasyon'],
          ['kyc', 'KYC'],
          ['users', 'Kullanıcılar'],
          ['disputes', 'Uyuşmazlıklar'],
          ['trades', 'Takaslar'],
          ['trade_disputes', 'Takas Uyuşmazlıkları'],
          ['finance', 'Finans'],
          ['logs', 'Audit Log'],
          ['settings', 'Site Ayarları'],
        ].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k as TabKey)} className={`px-3 py-2 rounded text-sm ${tab === k ? 'bg-[#5b68f6] text-white' : 'bg-[#1a1b23] text-gray-300'}`}>
            {label}
          </button>
        ))}
      </div>

      {loadingData ? (
        <div className="text-gray-300">Yönetim verileri yükleniyor...</div>
      ) : (
        <div className="space-y-3">
          {tab === 'withdrawals' && withdrawals.map((w) => (
            <div key={w.id} className="bg-[#1a1b23] p-4 rounded border border-white/5 flex items-center justify-between gap-3">
              <div className="text-sm text-gray-300">{w.userId} - {(Number(w.amount) || 0).toFixed(2)} ₺ - {w.status}</div>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-emerald-600 rounded text-xs" onClick={() => updateWithdrawalStatus(w, 'Onaylandı')}>Onayla</button>
                <button className="px-3 py-1 bg-red-600 rounded text-xs" onClick={() => updateWithdrawalStatus(w, 'Reddedildi')}>Reddet</button>
              </div>
            </div>
          ))}

          {tab === 'support' && tickets.map((t) => (
            <div key={t.id} className="bg-[#1a1b23] p-4 rounded border border-white/5 space-y-3">
              <div className="text-sm text-gray-300">{t.subject} - {t.status} - {t.userId}</div>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-blue-600 rounded text-xs" onClick={() => updateTicket(t, 'queue')}>Kuyruğa Al</button>
                <button className="px-3 py-1 bg-amber-600 rounded text-xs" onClick={() => updateTicket(t, 'pending')}>Beklet</button>
                <button className="px-3 py-1 bg-emerald-600 rounded text-xs" onClick={() => updateTicket(t, 'closed')}>Çözüldü</button>
              </div>
              <div className="flex gap-2">
                <input
                  value={replyText[t.id] || ''}
                  onChange={(e) => setReplyText((prev) => ({ ...prev, [t.id]: e.target.value }))}
                  className="flex-1 bg-[#111218] border border-white/10 rounded px-3 py-2 text-sm text-white"
                  placeholder="Cevap yaz..."
                />
                <button className="px-3 py-1 bg-[#5b68f6] rounded text-xs" onClick={() => addTicketReply(t)}>Yanıtla</button>
              </div>
            </div>
          ))}

          {tab === 'moderation' && products.map((p) => (
            <div key={p.id} className="bg-[#1a1b23] p-4 rounded border border-white/5 flex items-center justify-between gap-3">
              <div className="text-sm text-gray-300">{p.title} - {p.status} - {p.moderationStatus || 'pending'}</div>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-emerald-600 rounded text-xs" onClick={() => moderateProduct(p, 'approved')}>Onayla</button>
                <button className="px-3 py-1 bg-amber-600 rounded text-xs" onClick={() => moderateProduct(p, 'suspended')}>Askıya Al</button>
                <button className="px-3 py-1 bg-red-600 rounded text-xs" onClick={() => moderateProduct(p, 'rejected')}>Reddet</button>
                <button className="px-3 py-1 bg-gray-600 rounded text-xs" onClick={() => moderateProduct(p, 'removed_from_showcase')}>Vitrinden Kaldır</button>
              </div>
            </div>
          ))}

          {tab === 'kyc' && kycQueue.map((k) => (
            <div key={k.id} className="bg-[#1a1b23] p-4 rounded border border-white/5 flex items-center justify-between gap-3">
              <div className="text-sm text-gray-300">{k.userId} - {k.fullName} - {k.status}</div>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-emerald-600 rounded text-xs" onClick={() => reviewKyc(k, 'verified')}>Onayla</button>
                <button className="px-3 py-1 bg-red-600 rounded text-xs" onClick={() => reviewKyc(k, 'rejected')}>Reddet</button>
                <button className="px-3 py-1 bg-amber-600 rounded text-xs" onClick={() => reviewKyc(k, 'needs_more_documents')}>Belge İste</button>
              </div>
            </div>
          ))}

          {tab === 'users' && (
            <div className="space-y-3">
              <input value={searchUser} onChange={(e) => setSearchUser(e.target.value)} className="w-full max-w-md bg-[#111218] border border-white/10 rounded px-3 py-2 text-sm text-white" placeholder="Kullanıcı ara (id veya ad)" />
              {filteredUsers.map((u) => (
                <div key={u.id} className="bg-[#1a1b23] p-4 rounded border border-white/5 space-y-2">
                  <div className="text-sm text-gray-300">
                    {u.username} - {u.id} - rol: {u.role} - hesap: {u.accountStatus || 'active'} - KYC: {u.kycStatus || 'none'} - SMS: {u.smsVerified ? 'verified' : 'none'}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button disabled={!isAdmin} className="px-3 py-1 bg-blue-600 rounded text-xs disabled:opacity-40" onClick={() => updateUser(u, { role: 'moderator' }, 'user.roleToModerator')}>Moderator</button>
                    <button disabled={!isAdmin} className="px-3 py-1 bg-indigo-600 rounded text-xs disabled:opacity-40" onClick={() => updateUser(u, { role: 'admin' }, 'user.roleToAdmin')}>Admin</button>
                    <button disabled={!isAdmin} className="px-3 py-1 bg-gray-600 rounded text-xs disabled:opacity-40" onClick={() => updateUser(u, { role: 'user' }, 'user.roleToUser')}>User</button>
                    <button className="px-3 py-1 bg-amber-600 rounded text-xs" onClick={() => updateUser(u, { accountStatus: 'frozen' }, 'user.freeze')}>Dondur</button>
                    <button className="px-3 py-1 bg-red-600 rounded text-xs" onClick={() => updateUser(u, { accountStatus: 'banned' }, 'user.ban')}>Banla</button>
                    <button className="px-3 py-1 bg-emerald-600 rounded text-xs" onClick={() => updateUser(u, { accountStatus: 'active' }, 'user.unfreeze')}>Aktif Et</button>
                    <button className="px-3 py-1 bg-purple-600 rounded text-xs" onClick={() => updateUser(u, { salesEnabled: !(u.salesEnabled ?? true) }, 'user.toggleSales')}>Satış Yetkisi</button>
                    <button className="px-3 py-1 bg-[#0ea5e9] rounded text-xs" onClick={() => updateUser(u, { smsVerified: !(u.smsVerified ?? false), withdrawEnabled: !(u.smsVerified ?? false) }, 'user.toggleSmsVerified')}>SMS Doğrulama</button>
                    <button className="px-3 py-1 bg-[#5b68f6] rounded text-xs" onClick={() => updateUser(u, { riskNote: window.prompt('Risk notu:') || '' }, 'user.riskNote')}>Risk Notu</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'disputes' && disputes.map((d) => (
            <div key={d.id} className="bg-[#1a1b23] p-4 rounded border border-white/5 flex items-center justify-between gap-3">
              <div className="text-sm text-gray-300">Order: {d.orderId} - {d.status} - {d.reason}</div>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-red-600 rounded text-xs" onClick={() => resolveDispute(d, 'refund_buyer')}>İade Et</button>
                <button className="px-3 py-1 bg-emerald-600 rounded text-xs" onClick={() => resolveDispute(d, 'release_seller')}>Satıcıya Bırak</button>
              </div>
            </div>
          ))}

          {tab === 'trades' && trades.map((t) => (
            <div key={t.id} className="bg-[#1a1b23] p-4 rounded border border-white/5 flex items-center justify-between gap-3">
              <div className="text-sm text-gray-300">Trade: {t.id} - {t.status} - Sender: {t.senderUserId} - Receiver: {t.receiverUserId}</div>
              <div className="flex gap-2">
                <Link to={`/trade/offers/${t.id}`} className="px-3 py-1 bg-blue-600 rounded text-xs">Detay</Link>
              </div>
            </div>
          ))}

          {tab === 'trade_disputes' && tradeDisputes.map((d) => (
            <div key={d.id} className="bg-[#1a1b23] p-4 rounded border border-white/5 flex items-center justify-between gap-3">
              <div className="text-sm text-gray-300">Trade: {d.tradeOfferId} - {d.status} - {d.reason}</div>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-red-600 rounded text-xs" onClick={() => resolveTradeDispute(d, 'cancel_trade')}>Takası İptal Et</button>
                <button className="px-3 py-1 bg-emerald-600 rounded text-xs" onClick={() => resolveTradeDispute(d, 'complete_trade')}>Takası Tamamla</button>
              </div>
            </div>
          ))}

          {tab === 'finance' && (
            <div className="space-y-3">
              <button className="px-3 py-2 bg-[#5b68f6] rounded text-sm" onClick={addManualAdjustment}>Manuel Düzeltme Ekle</button>
              {transactions.slice(0, 80).map((t) => (
                <div key={t.id} className="bg-[#1a1b23] p-3 rounded border border-white/5 text-sm text-gray-300">
                  {t.userId} - {t.type} - {(Number(t.amount) || 0).toFixed(2)} ₺ - {t.status}
                </div>
              ))}
            </div>
          )}

          {tab === 'logs' && adminLogs.map((l) => (
            <div key={l.id} className="bg-[#1a1b23] p-3 rounded border border-white/5 text-sm text-gray-300">
              {l.actorId} - {l.action} - {l.entity}/{l.entityId}
            </div>
          ))}

          {tab === 'settings' && (
            <div className="bg-[#1a1b23] p-5 rounded border border-white/5 space-y-5">
              <div className="flex items-center justify-between">
                <div className="text-white font-bold">Site Ayarları</div>
                <button onClick={saveSettings} className="px-4 py-2 bg-[#5b68f6] rounded text-sm font-bold">
                  Kaydet
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[#111218] border border-white/10 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-white font-semibold">Bakım Modu</div>
                    <button
                      onClick={() => setSiteSettings((p: any) => ({ ...p, maintenanceMode: !p.maintenanceMode }))}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${siteSettings.maintenanceMode ? 'bg-[#5b68f6]' : 'bg-gray-600'}`}
                    >
                      <span className={`${siteSettings.maintenanceMode ? 'translate-x-5' : 'translate-x-0'} inline-block h-5 w-5 transform rounded-full bg-white transition`} />
                    </button>
                  </div>
                  <textarea
                    value={siteSettings.maintenanceMessage || ''}
                    onChange={(e) => setSiteSettings((p: any) => ({ ...p, maintenanceMessage: e.target.value }))}
                    placeholder="Bakım mesajı"
                    className="w-full bg-[#1a1b23] border border-white/10 rounded-lg px-3 py-2 text-sm text-white min-h-[90px]"
                  />
                  <div className="text-xs text-gray-500">Bakım modunda staff olmayanlar sayfaları göremez.</div>
                </div>

                <div className="p-4 bg-[#111218] border border-white/10 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-white font-semibold">Canlı Destek Balonu</div>
                    <button
                      onClick={() => setSiteSettings((p: any) => ({ ...p, floatingChatEnabled: !p.floatingChatEnabled }))}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${siteSettings.floatingChatEnabled ? 'bg-[#5b68f6]' : 'bg-gray-600'}`}
                    >
                      <span className={`${siteSettings.floatingChatEnabled ? 'translate-x-5' : 'translate-x-0'} inline-block h-5 w-5 transform rounded-full bg-white transition`} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs text-gray-400">TopBar Mesajı</div>
                    <input
                      value={siteSettings.topBarMessage || ''}
                      onChange={(e) => setSiteSettings((p: any) => ({ ...p, topBarMessage: e.target.value }))}
                      className="w-full bg-[#1a1b23] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#111218] border border-white/10 rounded-xl space-y-3">
                <div className="text-sm text-white font-semibold">Üst Bannerlar</div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  {(siteSettings.banners || []).slice(0, 3).map((b: any, idx: number) => (
                    <div key={idx} className="bg-[#1a1b23] border border-white/10 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-400">Banner {idx + 1}</div>
                        <button
                          onClick={() => {
                            const next = [...(siteSettings.banners || [])];
                            next[idx] = { ...next[idx], active: !(next[idx]?.active ?? true) };
                            setSiteSettings((p: any) => ({ ...p, banners: next }));
                          }}
                          className={`px-2 py-1 rounded text-xs ${b.active === false ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'}`}
                        >
                          {b.active === false ? 'Kapalı' : 'Açık'}
                        </button>
                      </div>
                      <input
                        value={b.label || ''}
                        onChange={(e) => {
                          const next = [...(siteSettings.banners || [])];
                          next[idx] = { ...next[idx], label: e.target.value };
                          setSiteSettings((p: any) => ({ ...p, banners: next }));
                        }}
                        placeholder="Label"
                        className="w-full bg-[#111218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                      />
                      <input
                        value={b.text || ''}
                        onChange={(e) => {
                          const next = [...(siteSettings.banners || [])];
                          next[idx] = { ...next[idx], text: e.target.value };
                          setSiteSettings((p: any) => ({ ...p, banners: next }));
                        }}
                        placeholder="Metin"
                        className="w-full bg-[#111218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                      />
                      <select
                        value={b.accent || 'gray'}
                        onChange={(e) => {
                          const next = [...(siteSettings.banners || [])];
                          next[idx] = { ...next[idx], accent: e.target.value };
                          setSiteSettings((p: any) => ({ ...p, banners: next }));
                        }}
                        className="w-full bg-[#111218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                      >
                        <option value="amber">amber</option>
                        <option value="red">red</option>
                        <option value="emerald">emerald</option>
                        <option value="blue">blue</option>
                        <option value="purple">purple</option>
                        <option value="gray">gray</option>
                      </select>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-500">Kaydettikten sonra site genelinde anında uygulanır.</div>
              </div>

              <div className="p-4 bg-[#111218] border border-white/10 rounded-xl space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-white font-semibold">Hero Slider (Anasayfa)</div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...(siteSettings.heroSlides || [])];
                      if (next.length >= 12) return;
                      next.push({
                        imageUrl: '',
                        eyebrow: '',
                        title: '',
                        query: '',
                        active: true,
                      });
                      setSiteSettings((p: any) => ({ ...p, heroSlides: next }));
                    }}
                    className="px-3 py-2 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/15 border border-white/10 text-white"
                  >
                    + Slide Ekle
                  </button>
                </div>

                <div className="space-y-3">
                  {(siteSettings.heroSlides || []).slice(0, 12).map((sl: any, idx: number) => (
                    <div key={idx} className="bg-[#1a1b23] border border-white/10 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-400">Slide {idx + 1}</div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const next = [...(siteSettings.heroSlides || [])];
                              next[idx] = { ...(next[idx] || {}), active: !(next[idx]?.active ?? true) };
                              setSiteSettings((p: any) => ({ ...p, heroSlides: next }));
                            }}
                            className={`px-2 py-1 rounded text-xs ${sl.active === false ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'}`}
                          >
                            {sl.active === false ? 'Kapalı' : 'Açık'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const next = [...(siteSettings.heroSlides || [])];
                              next.splice(idx, 1);
                              setSiteSettings((p: any) => ({ ...p, heroSlides: next }));
                            }}
                            className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-300"
                          >
                            Sil
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                        <input
                          value={sl.imageUrl || ''}
                          onChange={(e) => {
                            const next = [...(siteSettings.heroSlides || [])];
                            next[idx] = { ...next[idx], imageUrl: e.target.value };
                            setSiteSettings((p: any) => ({ ...p, heroSlides: next }));
                          }}
                          placeholder="Görsel URL (imageUrl)"
                          className="w-full bg-[#111218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                        />
                        <input
                          value={sl.query || ''}
                          onChange={(e) => {
                            const next = [...(siteSettings.heroSlides || [])];
                            next[idx] = { ...next[idx], query: e.target.value };
                            setSiteSettings((p: any) => ({ ...p, heroSlides: next }));
                          }}
                          placeholder="Arama (query) ör: Valorant"
                          className="w-full bg-[#111218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                        />
                        <input
                          value={sl.eyebrow || ''}
                          onChange={(e) => {
                            const next = [...(siteSettings.heroSlides || [])];
                            next[idx] = { ...next[idx], eyebrow: e.target.value };
                            setSiteSettings((p: any) => ({ ...p, heroSlides: next }));
                          }}
                          placeholder="Üst etiket (eyebrow) ör: MOBA"
                          className="w-full bg-[#111218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                        />
                        <input
                          value={sl.title || ''}
                          onChange={(e) => {
                            const next = [...(siteSettings.heroSlides || [])];
                            next[idx] = { ...next[idx], title: e.target.value };
                            setSiteSettings((p: any) => ({ ...p, heroSlides: next }));
                          }}
                          placeholder="Başlık (title)"
                          className="w-full bg-[#111218] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                        />
                      </div>

                      {!!sl.imageUrl && (
                        <div className="mt-2 rounded-xl overflow-hidden border border-white/10 bg-black/30">
                          <img src={sl.imageUrl} alt="" className="w-full h-40 object-cover opacity-90" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-500">
                  Kaydettiğinde anasayfa slider’ı bu görselleri kullanır. Boş URL olan slide’lar otomatik görünmez.
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
