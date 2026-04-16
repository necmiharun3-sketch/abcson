import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, ArrowLeft, Send } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import toast from 'react-hot-toast';
import { auth, missingFirebaseEnvKeys } from '../firebase';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error('E-posta adresinizi girin.');
      return;
    }
    if (missingFirebaseEnvKeys.length > 0) {
      toast.error('Firebase ayarları eksik. Sistem yöneticisiyle iletişime geçin.');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, trimmed);
      toast.success('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.');
    } catch (error: unknown) {
      const code = error && typeof error === 'object' && 'code' in error ? String((error as { code: string }).code) : '';
      if (code === 'auth/user-not-found') {
        toast.error('Bu e-posta adresiyle kayıtlı hesap bulunamadı.');
      } else if (code === 'auth/invalid-email') {
        toast.error('Geçerli bir e-posta adresi girin.');
      } else if (code === 'auth/too-many-requests') {
        toast.error('Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.');
      } else if (code === 'auth/network-request-failed') {
        toast.error('Ağ hatası. Bağlantınızı kontrol edip tekrar deneyin.');
      } else {
        toast.error('Şifre sıfırlama e-postası gönderilemedi. Lütfen tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-[#1a1b23] rounded-2xl border border-white/5 p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-[#5b68f6]/10 p-4 rounded-full mb-4">
            <Lock className="w-8 h-8 text-[#5b68f6]" />
          </div>
          <h1 className="text-2xl font-bold text-white">Şifremi Unuttum</h1>
          <p className="text-gray-400 text-center mt-2">
            E-posta adresinizi girin, size şifrenizi sıfırlamanız için bir bağlantı gönderelim.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-400 mb-2">E-posta Adresi</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#5b68f6] transition-colors" />
              <input 
                id="forgot-email"
                type="email" 
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#111218] border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#5b68f6] transition-all"
                placeholder="ornek@mail.com"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-[#5b68f6] hover:bg-[#4a55d6] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(91,104,246,0.3)] flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5" />
                Sıfırlama Bağlantısı Gönder
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <Link to="/login" className="text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2 text-sm">
            <ArrowLeft className="w-4 h-4" />
            Giriş Sayfasına Dön
          </Link>
        </div>
      </div>
    </div>
  );
}
