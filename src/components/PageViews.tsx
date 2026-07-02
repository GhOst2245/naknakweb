import React, { useState, useEffect } from "react";
import { HelpCircle, Mail, Phone, MapPin, BookOpen, Clock, Heart, Star, Award, Shield, User, X, MessageSquare, Truck, Briefcase, Calendar, ShieldCheck } from "lucide-react";
import { UserProfile, SiteSettings, Review } from "../types";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

// 1. How It Works (Hizmet Nasıl Çalışır)
export function HowItWorksView({ siteSettings }: { siteSettings?: SiteSettings }) {
  const title = siteSettings?.howItWorksTitle || "Süreç Nasıl İşler?";
  const sub = siteSettings?.howItWorksSub || "NakNak-Nakliye ile ev taşımak her zamankinden daha pratik, bütçeli ve güvenlidir.";
  const step1Title = siteSettings?.howItWorksStep1Title || "Talep Oluşturun";
  const step1Desc = siteSettings?.howItWorksStep1Desc || "Eşya listesi, bina katı, asansör durumu ve tarih detaylarını girin. Haritadan konumları işaretleyin.";
  const step2Title = siteSettings?.howItWorksStep2Title || "Teklifleri Karşılaştırın";
  const step2Desc = siteSettings?.howItWorksStep2Desc || "Doğrulanmış nakliyat firmalarından dakikalar içinde fiyat, personel sayısı ve araç tipi teklifleri alın.";
  const step3Title = siteSettings?.howItWorksStep3Title || "Güvenle Taşının";
  const step3Desc = siteSettings?.howItWorksStep3Desc || "En uygun teklifi seçip anlaşın. Ödemeyi doğrudan nakliye firmasına elden veya havaleyle yapın.";

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6 sm:py-12 sm:space-y-12 animate-in fade-in duration-300">
      <div className="text-center space-y-2 sm:space-y-3">
        <h2 className="text-xl sm:text-3xl font-extrabold font-display text-slate-900 leading-tight">{title}</h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">{sub}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm text-center space-y-2.5 sm:space-y-4">
          <span className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-50 text-blue-600 font-extrabold text-base sm:text-lg flex items-center justify-center mx-auto shadow-xs">1</span>
          <h3 className="text-sm sm:text-base font-bold text-slate-900">{step1Title}</h3>
          <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">
            {step1Desc}
          </p>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm text-center space-y-2.5 sm:space-y-4">
          <span className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-indigo-50 text-indigo-600 font-extrabold text-base sm:text-lg flex items-center justify-center mx-auto shadow-xs">2</span>
          <h3 className="text-sm sm:text-base font-bold text-slate-900">{step2Title}</h3>
          <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">
            {step2Desc}
          </p>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm text-center space-y-2.5 sm:space-y-4">
          <span className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-600 font-extrabold text-base sm:text-lg flex items-center justify-center mx-auto shadow-xs">3</span>
          <h3 className="text-sm sm:text-base font-bold text-slate-900">{step3Title}</h3>
          <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">
            {step3Desc}
          </p>
        </div>
      </div>
    </div>
  );
}

// 2. Discover Movers (Nakliyecileri Keşfet)
export function DiscoverMoversView({
  companies,
  favorites,
  toggleFavorite,
  siteSettings
}: {
  companies: UserProfile[];
  favorites: string[];
  toggleFavorite: (id: string) => void;
  siteSettings?: SiteSettings;
}) {
  const title = siteSettings?.discoverMoversTitle || "Profesyonel Nakliye Firmaları";
  const sub = siteSettings?.discoverMoversSub || "Doğrulanmış, vergi mükellefi ve sigortalı evden eve taşımacılık uzmanları.";
  const [selectedCompany, setSelectedCompany] = useState<UserProfile | null>(null);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-bold font-display text-slate-900">{title}</h2>
        <p className="text-xs text-slate-500">{sub}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {companies.map((comp) => {
          const isFav = favorites.includes(comp.id);
          return (
            <div key={comp.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 text-left">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-base font-bold text-slate-700">
                    {comp.name.slice(0, 2)}
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-slate-950">{comp.name}</h3>
                      {comp.verificationBadge && (
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-extrabold rounded">Doğrulanmış</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-[11px] font-bold text-slate-700">{comp.averageRating || 5.0}</span>
                      <span className="text-[10px] text-slate-400">({comp.ratingsCount || 0} yorum)</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => toggleFavorite(comp.id)}
                  className="p-1.5 text-slate-300 hover:text-rose-500 transition-all cursor-pointer"
                >
                  <Heart className={`w-4 h-4 ${isFav ? "fill-rose-500 text-rose-500" : ""}`} />
                </button>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed min-h-[40px] line-clamp-2">
                {comp.description || "Yılların deneyimi ve profesyonel paketleme ekibimiz ile Türkiye genelinde sigortalı nakliye hizmeti sunuyoruz."}
              </p>

              <div className="pt-3 border-t border-slate-50 flex items-center justify-between gap-4 text-[10px] text-slate-400 font-medium">
                <div className="flex flex-col gap-0.5 text-left">
                  <span>Hizmet Alanı: {comp.workingCities?.slice(0, 3).join(", ") || "İstanbul"}</span>
                  <span className="text-slate-600 font-bold">{comp.completedJobs || 0} Başarılı Taşıma</span>
                </div>
                <button
                  onClick={() => setSelectedCompany(comp)}
                  className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-xl font-bold text-[9px] cursor-pointer transition-all shrink-0"
                >
                  Profili İncele ➔
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedCompany && (
        <CompanyProfileModal
          company={selectedCompany}
          onClose={() => setSelectedCompany(null)}
        />
      )}
    </div>
  );
}

// 3. Help Center (Yardım Merkezi / FAQ / İletişim / Hakkımızda)
export function HelpCenterView({ siteSettings }: { siteSettings?: SiteSettings }) {
  const title = siteSettings?.helpCenterTitle || "Yardım ve Destek Merkezi";
  const sub = siteSettings?.helpCenterSub || "Sık sorulan soruları inceleyin veya destek ekibimizle iletişime geçin.";
  const contactTitle = siteSettings?.helpCenterContactTitle || "Bize Ulaşın";
  const contactDesc = siteSettings?.helpCenterContactDesc || "7/24 uyuşmazlık, şikayet ve destek işlemleri için mail veya telefon hattımızdan bize ulaşabilirsiniz.";
  const phone = siteSettings?.helpCenterPhone || "0850 123 45 67";
  const email = siteSettings?.helpCenterEmail || "destek@nakliyepazaryeri.com";
  const aboutTitle = siteSettings?.helpCenterAboutTitle || "Hakkımızda";
  const aboutDesc = siteSettings?.helpCenterAboutDesc || "Türkiye'nin öncü evden eve taşıma platformu olarak, müşterilerimiz ile en prestijli, vergi levhalı nakliye firmalarını bir araya getirerek taşınma stresini ortadan kaldırıyoruz. Sektör kalitesini akıllı bütçe çözümleri ile destekliyoruz.";

  const faqs = [];
  if (siteSettings?.faq1Question) {
    faqs.push({ q: siteSettings.faq1Question, a: siteSettings.faq1Answer || "" });
  } else {
    faqs.push({ q: "Sanal pos veya kredi kartıyla ödeme var mı?", a: "Hayır. Güvenlik ve komisyonsuz taşıma ilkelerimiz gereği, ödeme müşteri ile nakliye firması arasında doğrudan (taşınma günü elden veya havale ile) gerçekleştirilir." });
  }
  if (siteSettings?.faq2Question) {
    faqs.push({ q: siteSettings.faq2Question, a: siteSettings.faq2Answer || "" });
  } else {
    faqs.push({ q: "Eşyalarım sigortalanıyor mu?", a: "Profilinde 'Sigortalı Taşımacılık' ibaresi olan tüm doğrulanmış firmalarımız taşınma öncesinde eşya sigorta poliçesi hazırlayarak güvence sağlar." });
  }
  if (siteSettings?.faq3Question) {
    faqs.push({ q: siteSettings.faq3Question, a: siteSettings.faq3Answer || "" });
  } else {
    faqs.push({ q: "Teklif vermem ücretli mi?", a: "Hayır, müşterilerin talep açması ve nakliyecilerin teklif göndermesi tamamen ücretsizdir." });
  }
  if (siteSettings?.faq4Question) {
    faqs.push({ q: siteSettings.faq4Question, a: siteSettings.faq4Answer || "" });
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6 sm:py-12 sm:space-y-12 animate-in fade-in duration-300">
      <div className="text-center space-y-2 sm:space-y-3">
        <h2 className="text-xl sm:text-3xl font-extrabold font-display text-slate-900 leading-tight">{title}</h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">{sub}</p>
      </div>

      {/* SSS */}
      <div className="space-y-3">
        <h3 className="text-[10px] sm:text-xs font-bold text-slate-800 uppercase tracking-widest">Sık Sorulan Sorular</h3>
        <div className="space-y-2.5">
          {faqs.map((f, i) => (
            <div key={i} className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm space-y-1.5">
              <h4 className="text-xs font-bold text-slate-800 flex items-start gap-2">
                <HelpCircle className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" /> {f.q}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed pl-5.5">{f.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* İletişim ve Hakkımızda */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm space-y-3.5">
          <h3 className="text-[10px] sm:text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-blue-600" /> {contactTitle}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">{contactDesc}</p>
          <div className="space-y-2 text-xs font-semibold text-slate-700 pt-1.5">
            <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" /> {phone}</p>
            <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400" /> {email}</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm space-y-3.5">
          <h3 className="text-[10px] sm:text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-indigo-600" /> {aboutTitle}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {aboutDesc}
          </p>
        </div>
      </div>
    </div>
  );
}

// 4. Privacy & Terms (Gizlilik Politikası ve Kullanım Koşulları)
export function PrivacyTermsView({ siteSettings }: { siteSettings?: SiteSettings }) {
  const title = siteSettings?.privacyTermsTitle || "Gizlilik Politikası ve Kullanım Koşulları";
  const lastUpdated = siteSettings?.privacyTermsLastUpdated || "Son güncelleme: Haziran 2026";
  const sec1 = siteSettings?.privacyTermsSection1 || "1. Hizmet Kapsamı: NakNak-Nakliye, müşterilerin evden eve taşınma talepleri oluşturmasına ve bağımsız nakliyat şirketlerinin bu taleplere teklif vermesine olanak sağlayan bir aracı pazaryeri platformudur.";
  const sec2 = siteSettings?.privacyTermsSection2 || "2. Ödeme Koşulları: Platformumuz üzerinden kredi kartı veya sanal pos ile doğrudan online tahsilat yapılmamaktadır. Taraflar anlaşma sonrasında anlaştıkları fiyatı elden veya banka transferiyle doğrudan birbirlerine öder.";
  const sec3 = siteSettings?.privacyTermsSection3 || "3. Veri Güvenliği: Kullanıcıların iletişim bilgileri (telefon, e-posta vb.) sadece teklif kabul edildikten sonra veya karşılıklı sohbet esnasında güvenli rıza ile paylaşılır. Passwords and sensitive logs are fully encrypted using standard secure protocols.";

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-4 sm:py-12 sm:space-y-8 animate-in fade-in duration-300">
      <div className="space-y-3 bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm">
        <h2 className="text-base sm:text-xl font-bold font-display text-slate-900">{title}</h2>
        <p className="text-[10px] text-slate-400">{lastUpdated}</p>
        <div className="text-xs text-slate-600 leading-relaxed space-y-3 font-medium">
          <p>{sec1}</p>
          <p>{sec2}</p>
          <p>{sec3}</p>
        </div>
      </div>
    </div>
  );
}

// 5. CompanyProfileModal Component for Detailed Viewing of Transporters
export function CompanyProfileModal({
  company,
  onClose
}: {
  company: UserProfile;
  onClose: () => void;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"info" | "reviews">("info");

  useEffect(() => {
    async function fetchReviews() {
      setLoading(true);
      try {
        const q = query(collection(db, "reviews"), where("targetId", "==", company.id));
        const snap = await getDocs(q);
        const list: Review[] = [];
        snap.forEach((d) => {
          const r = d.data();
          if (!r.isDeleted && !r.isTransparent) {
            list.push({ id: d.id, ...r } as Review);
          }
        });
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setReviews(list);
      } catch (err) {
        console.error("Error fetching company reviews:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, [company.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-50 flex items-start justify-between shrink-0">
          <div className="flex items-center gap-4">
            <span className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-lg font-black text-slate-700">
              {company.name.slice(0, 2).toUpperCase()}
            </span>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-950 font-display">{company.name}</h3>
                {company.verificationBadge && (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded-full flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3" /> Doğrulanmış Firma
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-xs font-black text-slate-700">{company.averageRating || 5.0}</span>
                <span className="text-[10px] text-slate-400">({company.ratingsCount || 0} Değerlendirme)</span>
                <span className="mx-1 text-slate-300">•</span>
                <span className="text-[10px] text-emerald-600 font-bold">{company.completedJobs || 0} Başarılı Taşıma</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-50 px-6 gap-6 shrink-0">
          <button
            onClick={() => setActiveTab("info")}
            className={`py-3 text-xs font-bold relative transition-all cursor-pointer ${
              activeTab === "info" ? "text-slate-950" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {activeTab === "info" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-950 rounded-full" />}
            Hizmet Detayları & İletişim
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`py-3 text-xs font-bold relative transition-all cursor-pointer ${
              activeTab === "reviews" ? "text-slate-950" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {activeTab === "reviews" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-950 rounded-full" />}
            Değerlendirmeler ({reviews.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "info" ? (
            <div className="space-y-6 text-xs text-slate-800 text-left">
              
              {/* Description */}
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hakkında</h4>
                <p className="leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  {company.description || "Yılların deneyimi ve profesyonel paketleme ekibimiz ile Türkiye genelinde sigortalı nakliye hizmeti sunuyoruz. Güvenli ve sorunsuz evden eve taşımacılık çözümleri."}
                </p>
              </div>

              {/* Working info & details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-100 space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" /> Hizmet Bölgeleri
                  </h4>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800">Hizmet Verilen Şehirler:</p>
                    <p className="text-slate-600 font-medium">{company.workingCities?.join(", ") || "Belirtilmemiş"}</p>
                  </div>
                  {company.workingDistricts && company.workingDistricts.length > 0 && (
                    <div className="space-y-1">
                      <p className="font-bold text-slate-800">Hizmet Verilen İlçeler:</p>
                      <p className="text-slate-600 font-medium">{company.workingDistricts.join(", ")}</p>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-2xl border border-slate-100 space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" /> Çalışma Detayları
                  </h4>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800">Çalışma Saatleri:</p>
                    <p className="text-slate-600 font-medium">{company.workingHours || "08:00 - 20:00"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800">Şehirlerarası Taşıma:</p>
                    <p className="text-slate-600 font-medium">{company.isIntracity ? "Sadece Şehiriçi" : "Şehiriçi ve Şehirlerarası"}</p>
                  </div>
                </div>
              </div>

              {/* Vehicles */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-emerald-500" /> Araç Filosu
                </h4>
                {company.vehicles && company.vehicles.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {company.vehicles.map((v, idx) => (
                      <div key={v.licensePlate || idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3 text-left">
                        <div className="p-2 rounded-lg bg-white border border-slate-100">
                          <Truck className="w-4 h-4 text-slate-600" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{v.type}</p>
                          <p className="text-[10px] text-slate-500">Kapasite: {v.capacity} • Plaka: {v.licensePlate}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 italic bg-slate-50 p-3 rounded-xl border border-slate-100">Firma henüz sistem üzerinde araç bilgisi beyan etmemiştir.</p>
                )}
              </div>

              {/* Contact info & tax registration */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-rose-500" /> Firma Bilgileri & İletişim
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-slate-400 text-[10px] uppercase">Telefon Numarası</p>
                    <p className="font-bold text-slate-800">{company.companyPhone || company.phone || "Gizli (Talep onayından sonra gösterilir)"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-400 text-[10px] uppercase">Firma Adresi</p>
                    <p className="font-bold text-slate-800">{company.companyAddress || "Belirtilmemiş"}</p>
                  </div>
                  {company.isCompanyOwner && (
                    <>
                      <div className="space-y-1">
                        <p className="text-slate-400 text-[10px] uppercase">Vergi Dairesi / No</p>
                        <p className="font-bold text-slate-800">{company.taxOffice || "Belirtilmemiş"} / {company.taxNumber || "Belirtilmemiş"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-400 text-[10px] uppercase">Ticaret Sicil No</p>
                        <p className="font-bold text-slate-800">{company.tradeRegistryNo || "Belirtilmemiş"}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="space-y-4">
              {loading ? (
                <div className="py-12 text-center text-slate-400 text-xs">Yorumlar yükleniyor...</div>
              ) : reviews.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs space-y-1">
                  <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-bold">Henüz Değerlendirme Yok</p>
                  <p className="text-[10px]">Bu nakliye firması henüz bir müşteri değerlendirmesi almamıştır.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2 text-left">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-900">{rev.reviewerName}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono">
                          {new Date(rev.createdAt).toLocaleDateString("tr-TR")}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed italic font-medium">"{rev.comment}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
