import { useState } from 'react';
import { CreditCard, Wallet, ArrowLeft, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';

export default function BakiyeYukle() {
  const { user, profile } = useAuth();
  const [amount, setAmount] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('credit-card');

  const predefinedAmounts = [50, 100, 250, 500, 1000];
  const [submitting, setSubmitting] = useState(false);

  const handleTopupRequest = async () => {
    const numericAmount = Number(amount);
    if (!user) {
      toast.error('Önce giriş yapın.');
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      toast.error('Geçerli bir tutar girin.');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        type: 'topup',
        amount: numericAmount,
        fee: 0,
        direction: 'credit',
        status: 'pending',
        method: selectedMethod,
        reason: selectedMethod === 'havale'
          ? 'Havale/EFT ile bakiye yükleme talebi'
          : 'Kart ile bakiye yükleme talebi',
        createdAt: serverTimestamp(),
        meta: { source: 'balance_topup_page' }
      });
      toast.success(selectedMethod === 'havale'
        ? 'Bakiye yükleme talebiniz oluşturuldu. Admin onayından sonra bakiyeniz güncellenecek.'
        : 'Ödeme talebiniz oluşturuldu. Ödeme sağlayıcısı bağlanana kadar işlemler admin onayıyla tamamlanır.');
      setAmount('');
    } catch (error) {
      console.error('topup request failed', error);
      toast.error('Ödeme talebi oluşturulamadı.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-[600px] mx-auto text-center py-20">
        <Wallet className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Giriş Yapın</h1>
        <p className="text-gray-400 mb-6">Bakiye yüklemek için giriş yapmanız gerekiyor.</p>
        <Link to="/login" className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-xl font-medium transition-colors">
          Giriş Yap
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to="/kontrol-merkezi" className="w-10 h-10 rounded-xl bg-[#1a1b23] flex items-center justify-center text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Bakiye Yükle</h1>
          <p className="text-gray-400 text-sm">Güvenli ödeme ile bakiye yükleyin</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left - Amount Selection */}
        <div className="space-y-6">
          {/* Current Balance */}
          <div className="bg-gradient-to-r from-[#059669]/10 to-[#10b981]/10 border border-emerald-400/20 rounded-xl p-6">
            <p className="text-sm text-gray-400 mb-1">Mevcut Bakiye</p>
            <p className="text-3xl font-bold price-text">{(profile?.balance || 0).toFixed(2)} ₺</p>
          </div>

          {/* Amount Selection */}
          <div className="bg-[#1a1b23] rounded-xl border border-white/5 p-6">
            <h3 className="font-bold text-white mb-4">Yüklenecek Tutar</h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {predefinedAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAmount(amt.toString())}
                  className={`p-3 rounded-xl font-bold transition-all ${
                    amount === amt.toString()
                      ? 'bg-gradient-to-r from-[#059669] to-[#10b981] text-white'
                      : 'bg-[#111218] text-white hover:bg-white/5'
                  }`}
                >
                  {amt} ₺
                </button>
              ))}
            </div>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Tutar girin"
                className="w-full bg-[#111218] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 transition-colors"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">₺</span>
            </div>
          </div>
        </div>

        {/* Right - Payment Method */}
        <div className="bg-[#1a1b23] rounded-xl border border-white/5 p-6">
          <h3 className="font-bold text-white mb-4">Ödeme Yöntemi</h3>
          <div className="space-y-3">
            <button
              onClick={() => setSelectedMethod('credit-card')}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                selectedMethod === 'credit-card'
                  ? 'border-[#e91e63] bg-[#e91e63]/10'
                  : 'border-white/5 bg-[#111218] hover:border-white/10'
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">Kredi Kartı</p>
                <p className="text-xs text-gray-400">Visa, Mastercard</p>
              </div>
              {selectedMethod === 'credit-card' && (
                <CheckCircle className="w-5 h-5 text-[#e91e63] ml-auto" />
              )}
            </button>

            <button
              onClick={() => setSelectedMethod('havale')}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                selectedMethod === 'havale'
                  ? 'border-[#e91e63] bg-[#e91e63]/10'
                  : 'border-white/5 bg-[#111218] hover:border-white/10'
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">Havale/EFT</p>
                <p className="text-xs text-gray-400">Banka transferi</p>
              </div>
              {selectedMethod === 'havale' && (
                <CheckCircle className="w-5 h-5 text-[#e91e63] ml-auto" />
              )}
            </button>
          </div>

          {/* Pay Button */}
          <button
            onClick={handleTopupRequest}
            disabled={submitting || !amount || parseFloat(amount) <= 0}
            className="w-full mt-6 bg-gradient-to-r from-[#059669] to-[#10b981] hover:from-[#10b981] hover:to-[#34d399] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all"
          >
            {submitting ? 'İşleniyor...' : amount ? `${parseFloat(amount).toFixed(2)} ₺ İçin Talep Oluştur` : 'Tutar Seçin'}
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            Kart ve havale talepleri finans paneline düşer. Admin onayı sonrası bakiye hesabınıza yansıtılır.
          </p>
        </div>
      </div>
    </div>
  );
}
