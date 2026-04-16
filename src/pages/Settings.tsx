import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { db, storage } from '../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updatePassword } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import toast from 'react-hot-toast';
import { User, Shield, Bell, CreditCard, Camera, Plus, Trash2, Smartphone, ShieldCheck } from 'lucide-react';
import { functions } from '../firebase';

export default function Settings() {
  const { user, profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    avatar: ''
  });

  const [securityData, setSecurityData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    campaigns: true
  });

  const [ibans, setIbans] = useState<any[]>([]);
  const [newIban, setNewIban] = useState({ title: '', iban: '' });

  useEffect(() => {
    if (user && profile) {
      const p = profile as any;
      setFormData({
        username: p.username || user.displayName || '',
        email: user.email || '',
        phone: p.phone || '',
        location: p.location || '',
        bio: p.bio || '',
        avatar: p.avatar || user.photoURL || ''
      });
      if (p.notifications) {
        setNotifications(p.notifications);
      }
      if (p.ibans) {
        setIbans(p.ibans);
      }
    }
  }, [user, profile]);

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    setUploadingAvatar(true);
    try {
      const avatarRef = ref(storage, `avatars/${user.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(avatarRef, file);
      const avatarUrl = await getDownloadURL(avatarRef);
      setFormData((prev) => ({ ...prev, avatar: avatarUrl }));
      toast.success('Profil görseli yüklendi.');
    } catch {
      toast.error('Görsel yüklenemedi.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        username: formData.username.trim(),
        phone: formData.phone.trim(),
        location: formData.location.trim(),
        bio: formData.bio.trim(),
        avatar: formData.avatar || '',
      });
      toast.success('Profil güncellendi!');
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Profil güncellenemedi.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (securityData.newPassword !== securityData.confirmPassword) {
      toast.error('Şifreler eşleşmiyor!');
      return;
    }

    if (securityData.newPassword.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır!');
      return;
    }

    setIsSaving(true);
    try {
      await updatePassword(user, securityData.newPassword);
      toast.success('Şifreniz başarıyla güncellendi!');
      setSecurityData({ newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('Password update error:', error);
      if (error.code === 'auth/requires-recent-login') {
        toast.error('Güvenlik nedeniyle lütfen çıkış yapıp tekrar giriş yapın.');
      } else {
        toast.error('Şifre güncellenemedi.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotificationsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        notifications
      });
      toast.success('Bildirim tercihleri güncellendi!');
    } catch (error) {
      console.error('Notifications update error:', error);
      toast.error('Tercihler güncellenemedi.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddIban = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!newIban.title || !newIban.iban) {
      toast.error('Lütfen tüm alanları doldurun.');
      return;
    }

    const updatedIbans = [...ibans, { ...newIban, id: Date.now().toString() }];
    
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ibans: updatedIbans
      });
      setIbans(updatedIbans);
      setNewIban({ title: '', iban: '' });
      toast.success('Banka hesabı eklendi!');
    } catch (error) {
      console.error('IBAN add error:', error);
      toast.error('Banka hesabı eklenemedi.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteIban = async (id: string) => {
    if (!user) return;

    const updatedIbans = ibans.filter(iban => iban.id !== id);
    
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ibans: updatedIbans
      });
      setIbans(updatedIbans);
      toast.success('Banka hesabı silindi!');
    } catch (error) {
      console.error('IBAN delete error:', error);
      toast.error('Banka hesabı silinemedi.');
    }
  };

  const handleVerifySms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!securityData.newPassword || securityData.newPassword.length !== 6) {
      toast.error('Lütfen 6 haneli doğrulama kodunu girin.');
      return;
    }

    setIsSaving(true);
    try {
      const verify = httpsCallable(functions, 'smsVerify');
      await verify({ phone: formData.phone, code: securityData.newPassword });
      toast.success('Telefon numaranız doğrulandı!');
      setSecurityData({ newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('SMS verification error:', error);
      toast.error('Doğrulama kodu hatalı veya süresi dolmuş.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendSms = async () => {
    if (!formData.phone) {
      toast.error('Lütfen önce telefon numaranızı kaydedin.');
      return;
    }
    setIsSaving(true);
    try {
      const send = httpsCallable(functions, 'smsSend');
      const resp = await send({ phone: formData.phone });
      const devCode = (resp.data as any)?.devCode as string | null;
      if (devCode) {
        toast.success(`[DEV MODE] Doğrulama kodu: ${devCode}`);
      } else {
        toast.success('Doğrulama kodu gönderildi.');
      }
    } catch (error) {
      console.error('SMS send error:', error);
      toast.error('Kod gönderilemedi.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKycApply = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        kycStatus: 'pending',
        kycReferenceId: `KYC-${Date.now()}`
      });
      toast.success('KYC başvurunuz alındı. Admin onayı bekleniyor.');
    } catch (error) {
      console.error('KYC apply error:', error);
      toast.error('Başvuru yapılamadı.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-white">Yükleniyor...</div>;
  if (!user) return <Navigate to="/login" />;

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'security', label: 'Güvenlik', icon: Shield },
    { id: 'notifications', label: 'Bildirimler', icon: Bell },
    { id: 'payment', label: 'Ödeme', icon: CreditCard },
  ];

  return (
    <div className="max-w-[1200px] mx-auto py-8 px-4">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
        <Link to="/" className="hover:text-white transition-colors">Ana Sayfa</Link>
        <span>›</span>
        <span className="text-white font-medium">Ayarlar</span>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-[#1a1b23] rounded-2xl border border-white/5 p-3 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="bg-[#1a1b23] rounded-2xl border border-white/5 p-6 md:p-8">
              <h2 className="text-xl font-bold text-white mb-8">Profil Ayarları</h2>
              
              <form onSubmit={handleProfileSubmit} className="space-y-8">
                {/* Avatar Upload */}
                <div className="flex items-center gap-6">
                  <div className="relative group cursor-pointer">
                    {formData.avatar ? (
                      <img src={formData.avatar} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-white/10 group-hover:opacity-50 transition-opacity" />
                    ) : (
                      <div className="w-20 h-20 rounded-full border-2 border-white/10 bg-[#111218] flex items-center justify-center">
                        <User className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-full">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleAvatarUpload(file);
                      }}
                    />
                  </div>
                  <div>
                    <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-block mb-2">
                      Fotoğraf Değiştir
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleAvatarUpload(file);
                        }}
                      />
                    </label>
                    <p className="text-xs text-gray-500">JPG, PNG — Maks 2MB</p>
                    {uploadingAvatar && <p className="text-xs text-blue-400 mt-1">Yükleniyor...</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Kullanıcı Adı</label>
                    <input 
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className="w-full bg-[#111218] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">E-posta</label>
                    <input 
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full bg-[#111218] border border-white/10 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Telefon</label>
                    <input 
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+90 5** *** ** **"
                      className="w-full bg-[#111218] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Konum</label>
                    <input 
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder="İstanbul, Türkiye"
                      className="w-full bg-[#111218] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Hakkımda</label>
                  <textarea 
                    rows={4}
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    placeholder="Kendinizden bahsedin..."
                    className="w-full bg-[#111218] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  ></textarea>
                </div>

                <button 
                  type="submit"
                  disabled={isSaving}
                  className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-medium px-6 py-3 rounded-xl transition-colors"
                >
                  {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-[#1a1b23] rounded-2xl border border-white/5 p-6 md:p-8">
              <h2 className="text-xl font-bold text-white mb-8">Güvenlik Ayarları</h2>
              
              <form onSubmit={handleSecuritySubmit} className="space-y-6 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Yeni Şifre</label>
                  <input 
                    type="password"
                    value={securityData.newPassword}
                    onChange={(e) => setSecurityData({...securityData, newPassword: e.target.value})}
                    className="w-full bg-[#111218] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="En az 6 karakter"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Yeni Şifre (Tekrar)</label>
                  <input 
                    type="password"
                    value={securityData.confirmPassword}
                    onChange={(e) => setSecurityData({...securityData, confirmPassword: e.target.value})}
                    className="w-full bg-[#111218] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Şifrenizi tekrar girin"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isSaving || !securityData.newPassword || !securityData.confirmPassword}
                  className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-medium px-6 py-3 rounded-xl transition-colors"
                >
                  {isSaving ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                </button>
              </form>

              <div className="mt-12 space-y-8">
                {/* SMS Verification Section */}
                <div className="bg-[#111218] rounded-2xl p-6 border border-white/5">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-[#ff6a00]" />
                    Telefon Doğrulama
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                      <div>
                        <p className="text-sm font-medium text-white">Durum</p>
                        <p className={`text-xs ${profile?.smsVerified ? 'text-green-400' : 'text-red-400'}`}>
                          {profile?.smsVerified ? 'Doğrulandı' : 'Doğrulanmadı'}
                        </p>
                      </div>
                      {!profile?.smsVerified && (
                        <button
                          onClick={handleSendSms}
                          disabled={isSaving}
                          className="px-4 py-2 bg-[#ff6a00] text-white text-xs font-bold rounded-lg hover:bg-[#ff8533] transition-colors disabled:opacity-50"
                        >
                          Kod Gönder
                        </button>
                      )}
                    </div>
                    
                    {!profile?.smsVerified && (
                      <form onSubmit={handleVerifySms} className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="6 Haneli Kod"
                          value={securityData.newPassword}
                          onChange={(e) => setSecurityData(prev => ({ ...prev, newPassword: e.target.value.replace(/\D/g, '') }))}
                          className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#ff6a00]"
                        />
                        <button
                          type="submit"
                          disabled={isSaving || securityData.newPassword.length !== 6}
                          className="px-6 py-2 bg-white/10 text-white text-sm font-bold rounded-xl hover:bg-white/20 transition-colors disabled:opacity-50"
                        >
                          Doğrula
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                {/* KYC Verification Section */}
                <div className="bg-[#111218] rounded-2xl p-6 border border-white/5">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#5b68f6]" />
                    Kimlik Doğrulama (KYC)
                  </h3>
                  <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-medium text-white">Durum</p>
                        <p className={`text-xs ${
                          profile?.kycStatus === 'verified' ? 'text-green-400' :
                          profile?.kycStatus === 'pending' ? 'text-yellow-400' :
                          profile?.kycStatus === 'rejected' ? 'text-red-400' : 'text-gray-400'
                        }`}>
                          {profile?.kycStatus === 'verified' ? 'Doğrulandı' :
                           profile?.kycStatus === 'pending' ? 'Beklemede' :
                           profile?.kycStatus === 'rejected' ? 'Reddedildi' : 'Başlatılmadı'}
                        </p>
                      </div>
                      {(!profile?.kycStatus || profile?.kycStatus === 'none' || profile?.kycStatus === 'rejected') && (
                        <button
                          onClick={handleKycApply}
                          disabled={isSaving}
                          className="px-4 py-2 bg-[#5b68f6] text-white text-xs font-bold rounded-lg hover:bg-[#6c79ff] transition-colors disabled:opacity-50"
                        >
                          Doğrulama Başlat
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Hesabınızın güvenliği ve yüksek limitli işlemler için kimlik doğrulaması gereklidir. 
                      Başvurunuz admin ekibimiz tarafından incelenecektir.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-[#1a1b23] rounded-2xl border border-white/5 p-6 md:p-8">
              <h2 className="text-xl font-bold text-white mb-8">Bildirim Tercihleri</h2>
              
              <form onSubmit={handleNotificationsSubmit} className="space-y-6">
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 bg-[#111218] border border-white/5 rounded-xl cursor-pointer hover:border-white/10 transition-colors">
                    <div>
                      <p className="text-white font-medium">E-posta Bildirimleri</p>
                      <p className="text-sm text-gray-400">Sipariş ve mesaj güncellemeleri</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={notifications.email}
                      onChange={(e) => setNotifications({...notifications, email: e.target.checked})}
                      className="w-5 h-5 rounded border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900 bg-gray-700"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between p-4 bg-[#111218] border border-white/5 rounded-xl cursor-pointer hover:border-white/10 transition-colors">
                    <div>
                      <p className="text-white font-medium">SMS Bildirimleri</p>
                      <p className="text-sm text-gray-400">Önemli güvenlik uyarıları</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={notifications.sms}
                      onChange={(e) => setNotifications({...notifications, sms: e.target.checked})}
                      className="w-5 h-5 rounded border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900 bg-gray-700"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-[#111218] border border-white/5 rounded-xl cursor-pointer hover:border-white/10 transition-colors">
                    <div>
                      <p className="text-white font-medium">Kampanya Bildirimleri</p>
                      <p className="text-sm text-gray-400">Özel indirimler ve fırsatlar</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={notifications.campaigns}
                      onChange={(e) => setNotifications({...notifications, campaigns: e.target.checked})}
                      className="w-5 h-5 rounded border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900 bg-gray-700"
                    />
                  </label>
                </div>

                <button 
                  type="submit"
                  disabled={isSaving}
                  className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-medium px-6 py-3 rounded-xl transition-colors"
                >
                  {isSaving ? 'Kaydediliyor...' : 'Tercihleri Kaydet'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'payment' && (
            <div className="bg-[#1a1b23] rounded-2xl border border-white/5 p-6 md:p-8">
              <h2 className="text-xl font-bold text-white mb-8">Ödeme Yöntemleri</h2>
              
              <div className="space-y-8">
                {/* Saved IBANs */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Kayıtlı Banka Hesapları</h3>
                  {ibans.length === 0 ? (
                    <div className="text-center py-8 bg-[#111218] rounded-xl border border-white/5">
                      <CreditCard className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">Henüz kayıtlı banka hesabınız bulunmuyor.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {ibans.map((iban) => (
                        <div key={iban.id} className="flex items-center justify-between p-4 bg-[#111218] border border-white/5 rounded-xl">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                              <CreditCard className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                              <p className="text-white font-medium">{iban.title}</p>
                              <p className="text-sm text-gray-400">{iban.iban}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleDeleteIban(iban.id)}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add New IBAN */}
                <div className="pt-8 border-t border-white/5">
                  <h3 className="text-lg font-medium text-white mb-4">Yeni Banka Hesabı Ekle</h3>
                  <form onSubmit={handleAddIban} className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Hesap Başlığı</label>
                      <input 
                        type="text"
                        value={newIban.title}
                        onChange={(e) => setNewIban({...newIban, title: e.target.value})}
                        className="w-full bg-[#111218] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="Örn: Garanti Maaş Hesabı"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">IBAN</label>
                      <input 
                        type="text"
                        value={newIban.iban}
                        onChange={(e) => setNewIban({...newIban, iban: e.target.value})}
                        className="w-full bg-[#111218] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="TR00 0000 0000 0000 0000 0000 00"
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={isSaving || !newIban.title || !newIban.iban}
                      className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-medium px-6 py-3 rounded-xl transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      Hesap Ekle
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
