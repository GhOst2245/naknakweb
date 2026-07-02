import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Cookie, FileText, Check, X, ChevronRight, Lock } from "lucide-react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { UserProfile } from "../types";

interface CookieConsentBannerProps {
  currentUser: UserProfile | null;
  onConsentSaved?: (updatedProfile: UserProfile) => void;
}

export default function CookieConsentBanner({ currentUser, onConsentSaved }: CookieConsentBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showFullModal, setShowFullModal] = useState(false);
  const [modalTab, setModalTab] = useState<"kvkk" | "cookie">("kvkk");
  
  // Consent options
  const [essentialAccepted, setEssentialAccepted] = useState(true); // Mandatory
  const [analyticsAccepted, setAnalyticsAccepted] = useState(true);
  const [marketingAccepted, setMarketingAccepted] = useState(false);

  useEffect(() => {
    // Check if consent already given in localStorage
    const localConsent = localStorage.getItem("naknak_cookie_consent");
    
    // Check if consent exists in user's profile
    const profileConsent = currentUser?.cookieConsent;

    if (!localConsent && !profileConsent) {
      // Show banner after 1.5 seconds delay for better user experience
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    } else if (currentUser && !currentUser.cookieConsent && localConsent === "accepted") {
      // Sync local storage to firestore if user is logged in but profile doesn't have it yet
      saveConsentToFirestore("accepted", true);
    }
  }, [currentUser]);

  const saveConsentToFirestore = async (consentType: "accepted" | "rejected", kvkk: boolean) => {
    if (!currentUser) return;
    
    const updatedProfile: UserProfile = {
      ...currentUser,
      cookieConsent: consentType,
      kvkkApproved: kvkk,
      consentTimestamp: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, "users", currentUser.id), updatedProfile, { merge: true });
      if (onConsentSaved) {
        onConsentSaved(updatedProfile);
      }
    } catch (err) {
      console.error("Error saving legal consent to Firestore:", err);
    }
  };

  const handleAcceptAll = () => {
    localStorage.setItem("naknak_cookie_consent", "accepted");
    localStorage.setItem("naknak_cookie_analytics", "true");
    localStorage.setItem("naknak_cookie_marketing", "true");
    setIsVisible(false);
    
    if (currentUser) {
      saveConsentToFirestore("accepted", true);
    }
  };

  const handleSavePreferences = () => {
    localStorage.setItem("naknak_cookie_consent", "accepted");
    localStorage.setItem("naknak_cookie_analytics", analyticsAccepted ? "true" : "false");
    localStorage.setItem("naknak_cookie_marketing", marketingAccepted ? "true" : "false");
    setIsVisible(false);
    
    if (currentUser) {
      saveConsentToFirestore("accepted", essentialAccepted);
    }
  };

  const handleRejectAll = () => {
    localStorage.setItem("naknak_cookie_consent", "rejected");
    localStorage.setItem("naknak_cookie_analytics", "false");
    localStorage.setItem("naknak_cookie_marketing", "false");
    setIsVisible(false);

    if (currentUser) {
      saveConsentToFirestore("rejected", false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            id="cookie-consent-banner"
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md bg-white border border-slate-100 rounded-3xl shadow-2xl p-5 sm:p-6 z-50 space-y-4"
          >
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Cookie className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 font-display">
                  Çerezler ve KVKK Rıza Beyanı
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase rounded border border-emerald-100">
                    <Shield className="w-2.5 h-2.5" /> KVKK Uyumlu
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Size daha iyi, hızlı ve güvenli bir nakliye pazaryeri deneyimi sunmak amacıyla 6698 Sayılı KVKK kapsamında çerezler kullanmaktayız.
                </p>
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap gap-2 py-1 border-t border-b border-slate-100">
              <button
                onClick={() => {
                  setModalTab("kvkk");
                  setShowFullModal(true);
                }}
                className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
              >
                <FileText className="w-3 h-3" /> KVKK Aydınlatma Metni
                <ChevronRight className="w-3 h-3" />
              </button>
              <button
                onClick={() => {
                  setModalTab("cookie");
                  setShowFullModal(true);
                }}
                className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
              >
                <Cookie className="w-3 h-3" /> Çerez Politikası
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Selection Toggles */}
            <div className="space-y-2 text-[11px]">
              {/* Mandatory */}
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800">Zorunlu Çerezler ve KVKK</span>
                  <p className="text-[9px] text-slate-400">Taleplerin işlenmesi ve güvenlik için zorunludur.</p>
                </div>
                <div className="flex items-center gap-1 bg-emerald-100/40 text-emerald-700 font-bold px-2 py-1 rounded-lg">
                  <Lock className="w-2.5 h-2.5" /> Zorunlu
                </div>
              </div>

              {/* Analytics */}
              <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-all">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-700">Analitik ve İstatistik Çerezleri</span>
                  <p className="text-[9px] text-slate-400">Site performansını ve arama kalitesini artırır.</p>
                </div>
                <input
                  type="checkbox"
                  checked={analyticsAccepted}
                  onChange={(e) => setAnalyticsAccepted(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1.5">
              <button
                onClick={handleSavePreferences}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-xl transition-all cursor-pointer text-center"
              >
                Seçimleri Kaydet
              </button>
              <button
                onClick={handleAcceptAll}
                className="py-2.5 px-3 bg-slate-950 hover:bg-slate-850 text-white text-[11px] font-bold rounded-xl transition-all cursor-pointer text-center shadow-lg shadow-slate-950/10"
              >
                Hepsini Kabul Et
              </button>
            </div>
            
            <div className="text-center">
              <button
                onClick={handleRejectAll}
                className="text-[9px] text-slate-400 hover:text-slate-600 font-bold underline"
              >
                Yalnızca Zorunlu Çerezlerle Devam Et
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FULL POLICY MODAL */}
      <AnimatePresence>
        {showFullModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-bold text-slate-950 font-display">Yasal Aydınlatma ve Politikalar</h3>
                </div>
                <button
                  onClick={() => setShowFullModal(false)}
                  className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-100">
                <button
                  onClick={() => setModalTab("kvkk")}
                  className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 ${
                    modalTab === "kvkk"
                      ? "border-blue-600 text-blue-600 bg-blue-50/20"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  KVKK Aydınlatma Metni
                </button>
                <button
                  onClick={() => setModalTab("cookie")}
                  className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 ${
                    modalTab === "cookie"
                      ? "border-blue-600 text-blue-600 bg-blue-50/20"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Çerez (Cookie) Politikası
                </button>
              </div>

              {/* Modal Content Scroll Area */}
              <div className="p-6 overflow-y-auto text-xs text-slate-600 space-y-4 leading-relaxed font-medium">
                {modalTab === "kvkk" ? (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-900 border-l-4 border-blue-600 pl-2">
                      6698 SAYILI KİŞİSEL VERİLERİN KORUNMASI KANUNU (KVKK) AYDINLATMA METNİ
                    </h4>
                    <p className="italic text-slate-400 text-[11px]">Son Güncelleme: Haziran 2026</p>
                    
                    <p>
                      Değerli Kullanıcımız, <strong>NakNak - Nakliye Pazaryeri Platformu</strong> olarak kişisel verilerinizin güvenliğine büyük önem veriyoruz. 6698 Sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca, veri sorumlusu sıfatıyla, kişisel verilerinizi aşağıda açıklanan amaçlar doğrultusunda ve yasal sınırlar çerçevesinde işlemekteyiz.
                    </p>

                    <h5 className="font-bold text-slate-800">1. İşlenen Kişisel Verileriniz</h5>
                    <p>
                      Platformumuzu kullanımınız kapsamında; adınız, soyadınız, e-posta adresiniz, telefon numaranız, profil fotoğrafınız (mevcut ise), adres bilgileriniz (il ve ilçe), eğer taşımacı iseniz ek olarak araç markası, modeli, plakası, kasa ölçüleri, vergi levhası ve vergi numarası gibi lojistik ve hukuki verileriniz işlenmektedir.
                    </p>

                    <h5 className="font-bold text-slate-800">2. Kişisel Verilerin İşlenme Amaçları</h5>
                    <ul className="list-disc pl-5 space-y-1.5">
                      <li>Nakliye taleplerinin oluşturulması ve nakliyeciler tarafından teklif verilebilmesi,</li>
                      <li>Müşteriler ve taşımacılar arasında doğrudan iletişim ve sohbet imkanının sağlanması,</li>
                      <li>Platform güvenliğinin sağlanması, suistimallerin ve sahte ilanların önlenmesi,</li>
                      <li>Hizmet kalitemizin artırılması, talep ve şikayetlerin takibi ve çözümlenmesi,</li>
                      <li>Yasal yükümlülüklerin yerine getirilmesi.</li>
                    </ul>

                    <h5 className="font-bold text-slate-800">3. Kişisel Verilerin Aktarılması</h5>
                    <p>
                      Kişisel verileriniz, ancak bir taşıma talebi kesinleştiğinde veya karşılıklı teklif onaylandığında, hizmetin ifası amacıyla ilgili müşteri veya taşımacı ile sınırlı olarak paylaşılır. Bunun dışında, yasal zorunluluklar haricinde hiçbir üçüncü taraf veya kuruma verileriniz aktarılmamakta ve satılmamaktadır.
                    </p>

                    <h5 className="font-bold text-slate-800">4. Veri Sahibinin Hakları (KVKK Madde 11)</h5>
                    <p>
                      Kanun kapsamında her zaman veri sorumlusu olan platformumuza başvurarak; verilerinizin işlenip işlenmediğini öğrenme, işlenme amacına uygun kullanılıp kullanılmadığını sorma, eksik veya yanlış işlenmişse düzeltilmesini talep etme ve verilerinizin silinmesini isteme hakkına sahipsiniz. Başvurularınızı profiliniz üzerinden veya destek birimimiz aracılığıyla iletebilirsiniz.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-900 border-l-4 border-blue-600 pl-2">
                      ÇEREZ (COOKIE) POLİTİKASI VE KULLANIM DETAYLARI
                    </h4>
                    <p className="italic text-slate-400 text-[11px]">Son Güncelleme: Haziran 2026</p>

                    <p>
                      İşbu Çerez Politikası, platformumuzda kullanılan çerezlerin türlerini, kullanım amaçlarını ve bu çerezleri nasıl yönetebileceğinizi açıklamaktadır.
                    </p>

                    <h5 className="font-bold text-slate-800">1. Çerez Nedir?</h5>
                    <p>
                      Çerezler, web sitemizi ziyaret ettiğinizde tarayıcınız aracılığıyla cihazınıza kaydedilen küçük metin dosyalarıdır. Çerezler, web sitesinin daha verimli çalışmasını, tercihlerinize göre özelleştirilmesini ve analiz yapılarak geliştirilmesini sağlar.
                    </p>

                    <h5 className="font-bold text-slate-800">2. Kullanılan Çerez Türleri</h5>
                    <div className="space-y-2">
                      <p><strong>A. Zorunlu Çerezler:</strong> Web sitemizin düzgün çalışması, oturum yönetimi, güvenlik önlemleri ve rıza tercihlerinizin saklanması için kesinlikle gereklidir. Bu çerezler kapatılamaz.</p>
                      <p><strong>B. Performans ve Analitik Çerezleri:</strong> Sitemizi kaç kişinin ziyaret ettiğini, hangi sayfaların daha çok tıklandığını anonim olarak ölçümlemek amacıyla kullanılır. Sitemizi iyileştirmemize yardımcı olur.</p>
                      <p><strong>C. İşlevsel ve Pazarlama Çerezleri:</strong> Dil, konum ve rol tercihlerinizin (müşteri / taşımacı) hatırlanması ile ilgilendiğiniz ilanların size daha verimli gösterilmesi amacıyla kullanılır.</p>
                    </div>

                    <h5 className="font-bold text-slate-800">3. Çerez Tercihlerinizi Nasıl Yönetirsiniz?</h5>
                    <p>
                      Çerez tercihlerinizi bu banner üzerindeki butonlar vasıtasıyla dilediğiniz gibi güncelleyebilir veya tarayıcınızın ayarlarından çerezleri tamamen engelleyebilirsiniz. Ancak zorunlu çerezlerin engellenmesi durumunda, oturum açma, teklif verme gibi platformumuzun ana fonksiyonları çalışmayabilir.
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50">
                <button
                  onClick={() => setShowFullModal(false)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition-all"
                >
                  Kapat
                </button>
                <button
                  onClick={() => {
                    handleAcceptAll();
                    setShowFullModal(false);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/15 transition-all"
                >
                  Okudum, Hepsini Onaylıyorum
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
