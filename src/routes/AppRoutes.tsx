import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Home from '../pages/Home';
import Roblox from '../pages/Roblox';
import Product from '../pages/Product';
import IlanPazari from '../pages/IlanPazari';
import AlimIlanlari from '../pages/AlimIlanlari';
import Topluluk from '../pages/Topluluk';
import Magazalar from '../pages/Magazalar';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Profile from '../pages/Profile';
import Messages from '../pages/Messages';
import Dashboard from '../pages/Dashboard';
import Settings from '../pages/Settings';
import Reviews from '../pages/Reviews';
import Notifications from '../pages/Notifications';
import Cart from '../pages/Cart';
import Orders from '../pages/Orders';
import SoldListings from '../pages/SoldListings';
import MyListings from '../pages/MyListings';
import Favorites from '../pages/Favorites';
import OrderDetail from '../pages/OrderDetail';
import Withdraw from '../pages/Withdraw';
import Support from '../pages/Support';
import ForgotPassword from '../pages/ForgotPasswordFixed';
import NotFound from '../pages/NotFound';
import About from '../pages/About';
import Terms from '../pages/Terms';
import Privacy from '../pages/Privacy';
import DistanceSales from '../pages/DistanceSales';
import RefundPolicy from '../pages/RefundPolicy';
import FAQ from '../pages/FAQ';
import Deals from '../pages/Deals';
import Blog from '../pages/Blog';
import BlogPost from '../pages/BlogPost';
import Streamers from '../pages/Streamers';
import StreamerProfile from '../pages/StreamerProfile';
import Giveaways from '../pages/Giveaways';
import CDKey from '../pages/CDKey';
import TopUp from '../pages/TopUp';
import GiftCards from '../pages/GiftCards';
import IlanEkle from '../pages/IlanEkle';
import IlanYukariTasima from '../pages/IlanYukariTasima';
import FavoriSistemi from '../pages/FavoriSistemi';
import AdminPanel from '../pages/AdminPanel';
import TumKategoriler from '../pages/TumKategoriler';
import ServerTanitimi from '../pages/ServerTanitimi';
import ServerTanitimiDetay from '../pages/ServerTanitimiDetay';
import MagazaBasvurusu from '../pages/MagazaBasvurusu';
import BakiyeYukle from '../pages/BakiyeYukle';
import TelitIhlali from '../pages/TelitIhlali';
import ShopierCheckout from '../pages/ShopierCheckout';
import ShopierPaymentResult from '../pages/ShopierPaymentResult';
import TradeOffer from '../pages/TradeOffer';
import TradeOfferDetail from '../pages/TradeOfferDetail';
import TradeOffersList from '../pages/TradeOffersList';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Ana Sayfalar */}
        <Route index element={<Home />} />
        <Route path="roblox" element={<Roblox />} />
        
        {/* İlan ve Ürünler */}
        <Route path="product/:id" element={<Product />} />
        <Route path="ilan-pazari" element={<IlanPazari />} />
        <Route path="alim-ilanlari" element={<AlimIlanlari />} />
        <Route path="tum-kategoriler" element={<TumKategoriler />} />
        <Route path="ilan-ekle" element={<IlanEkle />} />
        <Route path="ilan-duzenle/:id" element={<IlanEkle />} />
        <Route path="ilan-yukari-tasima" element={<IlanYukariTasima />} />
        
        {/* Topluluk ve Mağazalar */}
        <Route path="topluluk" element={<Topluluk />} />
        <Route path="magazalar" element={<Magazalar />} />
        <Route path="magaza-basvurusu" element={<MagazaBasvurusu />} />
        <Route path="server-tanitimi" element={<ServerTanitimi />} />
        <Route path="server-tanitimi/:id" element={<ServerTanitimiDetay />} />
        <Route path="yayincilar" element={<Streamers />} />
        <Route path="destekle/:slug" element={<StreamerProfile />} />
        
        {/* Dijital Ürünler */}
        <Route path="cd-key" element={<CDKey />} />
        <Route path="top-up" element={<TopUp />} />
        <Route path="hediye-kartlari" element={<GiftCards />} />
        
        {/* Takas Sistemi */}
        <Route path="trade/offer/:id" element={<TradeOffer />} />
        <Route path="trade/offers" element={<TradeOffersList />} />
        <Route path="trade/offers/:id" element={<TradeOfferDetail />} />
        
        {/* Kullanıcı İşlemleri */}
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="sifremi-unuttum" element={<ForgotPassword />} />
        <Route path="profile" element={<Profile />} />
        <Route path="profile/:id" element={<Profile />} />
        <Route path="kontrol-merkezi" element={<Dashboard />} />
        <Route path="dashboard" element={<Navigate to="/kontrol-merkezi" replace />} />
        <Route path="ayarlar" element={<Settings />} />
        <Route path="mesajlarim" element={<Messages />} />
        <Route path="bildirimler" element={<Notifications />} />
        <Route path="favorilerim" element={<Favorites />} />
        <Route path="favori-sistemi" element={<FavoriSistemi />} />
        <Route path="degerlendirmelerim" element={<Reviews />} />
        
        {/* Sipariş ve Bakiye */}
        <Route path="sepet" element={<Cart />} />
        <Route path="cart" element={<Navigate to="/sepet" replace />} />
        <Route path="siparislerim" element={<Orders />} />
        <Route path="orders" element={<Navigate to="/siparislerim" replace />} />
        <Route path="siparis/:id" element={<OrderDetail />} />
        <Route path="sattigim-ilanlar" element={<SoldListings />} />
        <Route path="ilanlarim" element={<MyListings />} />
        <Route path="bakiye-yukle" element={<BakiyeYukle />} />
        <Route path="deposit" element={<Navigate to="/bakiye-yukle" replace />} />
        <Route path="para-cek" element={<Withdraw />} />
        <Route path="odeme/shopier" element={<ShopierCheckout />} />
        <Route path="odeme/shopier/sonuc" element={<ShopierPaymentResult />} />
        
        {/* Diğer */}
        <Route path="cekilisler" element={<Giveaways />} />
        <Route path="firsatlar" element={<Deals />} />
        <Route path="blog" element={<Blog />} />
        <Route path="blog/:slug" element={<BlogPost />} />
        <Route path="destek-sistemi" element={<Support />} />
        <Route path="admin" element={<AdminPanel />} />
        <Route path="admin/login" element={<Navigate to="/login?next=/admin" replace />} />
        
        {/* Kurumsal ve Yasal */}
        <Route path="hakkimizda" element={<About />} />
        <Route path="sss" element={<FAQ />} />
        <Route path="kullanici-sozlesmesi" element={<Terms />} />
        <Route path="gizlilik-politikasi" element={<Privacy />} />
        <Route path="mesafeli-satis-sozlesmesi" element={<DistanceSales />} />
        <Route path="iade-politikasi" element={<RefundPolicy />} />
        <Route path="legal/telif-ihlali" element={<TelitIhlali />} />
        <Route path="legal/gizlilik" element={<Navigate to="/gizlilik-politikasi" replace />} />
        <Route path="legal/iade" element={<Navigate to="/iade-politikasi" replace />} />
        <Route path="legal/mesafeli-satis" element={<Navigate to="/mesafeli-satis-sozlesmesi" replace />} />
        <Route path="legal/kullanici-sozlesmesi" element={<Navigate to="/kullanici-sozlesmesi" replace />} />
        
        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
