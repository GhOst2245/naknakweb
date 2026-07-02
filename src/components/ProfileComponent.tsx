import React, { useState, useEffect } from "react";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { UserProfile, UserRole } from "../types";
import { fetchCitiesFromFirestore } from "../utils/cities";
import {
  User,
  Phone,
  Mail,
  Award,
  Briefcase,
  FileText,
  Save,
  CheckCircle,
  AlertTriangle,
  Plus,
  X,
  Truck,
  MapPin,
  Calendar,
  Layers,
  Star,
  Search,
  Globe
} from "lucide-react";

interface ProfileComponentProps {
  user: UserProfile;
  onUpdate: (updatedProfile: UserProfile) => void;
  onNavigateToTab: (tab: string) => void;
}

export default function ProfileComponent({ user, onUpdate, onNavigateToTab }: ProfileComponentProps) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || "");
  const [email] = useState(user.email); // Read-only

  // Company details (only for MOVING_COMPANY role)
  const [description, setDescription] = useState(user.description || "");
  const [taxNumber, setTaxNumber] = useState(user.taxNumber || "");
  const [taxOffice, setTaxOffice] = useState(user.taxOffice || "");
  const [driversCount, setDriversCount] = useState(user.driversCount || 1);
  const [hasInsurance, setHasInsurance] = useState(user.hasInsurance ?? true);

  // Cities tag manager
  const [workingCities, setWorkingCities] = useState<string[]>(user.workingCities || []);
  const [allTurkishCities, setAllTurkishCities] = useState<string[]>([]);
  const [citySearchQuery, setCitySearchQuery] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showConfirmUpgrade, setShowConfirmUpgrade] = useState(false);

  useEffect(() => {
    const loadCities = async () => {
      const cities = await fetchCitiesFromFirestore();
      setAllTurkishCities(cities);
    };
    loadCities();
  }, []);

  const handleRemoveCity = (cityToRemove: string) => {
    setWorkingCities(workingCities.filter((city) => city !== cityToRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    if (!name.trim()) {
      setError("İsim veya firma ünvanı boş bırakılamaz.");
      setLoading(false);
      return;
    }

    if (!phone.trim()) {
      setError("Telefon numarası boş bırakılamaz.");
      setLoading(false);
      return;
    }

    const updatedProfile: UserProfile = {
      ...user,
      name: name.trim(),
      phone: phone.trim(),
      ...(user.role === "MOVING_COMPANY" && {
        description: description.trim(),
        taxNumber: taxNumber.trim(),
        taxOffice: taxOffice.trim(),
        driversCount: Number(driversCount),
        hasInsurance,
        workingCities
      })
    };

    try {
      await setDoc(doc(db, "users", user.id), updatedProfile, { merge: true });
      onUpdate(updatedProfile);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      console.error("Profil güncelleme hatası:", err);
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.id}`);
      setError("Profil kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("tr-TR", {
        year: "numeric",
        month: "long",
        day: "numeric"
      })
    : "Bilinmiyor";

  return (
    <div id="profile-page-container" className="max-w-4xl mx-auto py-8 px-4 sm:px-6 animate-in fade-in duration-300 space-y-8">
      {/* Page Title & Breadcrumb */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black font-display text-slate-900 tracking-tight">Profil Bilgilerim</h2>
          <p className="text-xs text-slate-500">Kişisel veya kurumsal bilgilerinizi inceleyin ve güncel tutun.</p>
        </div>
        <button
          onClick={() => onNavigateToTab("dashboard")}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
        >
          Panele Geri Dön
        </button>
      </div>

      {/* Success Banner */}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2.5 shadow-sm animate-in slide-in-from-top-2 duration-200">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Profil bilgileriniz başarıyla güncellendi ve kaydedildi.</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-2xl flex items-center gap-2.5 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Summary Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100/80 shadow-sm text-center flex flex-col items-center">
            {/* Avatar / Logo */}
            <div className="w-20 h-20 bg-slate-950 text-white rounded-3xl flex items-center justify-center font-black text-2xl shadow-lg shadow-slate-950/15 mb-4 relative">
              {user.role === "MOVING_COMPANY" ? (
                <Truck className="w-10 h-10" />
              ) : (
                <User className="w-10 h-10" />
              )}
            </div>

            <h3 className="font-bold text-slate-900 text-base line-clamp-2 px-1">{name || user.name}</h3>
            
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold mt-2 ${
              user.role === "ADMIN" 
                ? "bg-rose-50 text-rose-700 border border-rose-100" 
                : user.role === "MOVING_COMPANY" 
                  ? "bg-blue-50 text-blue-700 border border-blue-100" 
                  : "bg-emerald-50 text-emerald-700 border border-emerald-100"
            }`}>
              {user.role === "ADMIN" ? "Yönetici" : user.role === "MOVING_COMPANY" ? "Nakliye Firması" : "Bireysel Üye"}
            </span>

            {/* Approval Badges for Company */}
            {user.role === "MOVING_COMPANY" && (
              <div className="mt-4 w-full pt-4 border-t border-slate-50 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Evrak Onay Durumu:</span>
                  {user.isApproved ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md">Onaylı</span>
                  ) : (
                    <span className="text-amber-600 font-bold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md">Beklemede</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Güven Rozeti:</span>
                  {user.verificationBadge ? (
                    <span className="text-blue-600 font-bold flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-md">Rozetli</span>
                  ) : (
                    <span className="text-slate-500 font-bold bg-slate-50 px-2 py-0.5 rounded-md">Yok</span>
                  )}
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-slate-50 w-full space-y-2.5 text-left">
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{email}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Kayıt: {formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Upgrade Card for Customer Account */}
          {user.role !== "MOVING_COMPANY" && (
            <div className="bg-white p-6 rounded-3xl border border-slate-100/80 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-2">
                <Truck className="w-4 h-4 text-blue-600" /> Taşımacı Olun
              </h4>
              {!showConfirmUpgrade ? (
                <>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Kendi aracı olan bir bağımsız şoför veya evden eve nakliye firması mısınız? Hemen hesabınızı Taşımacı Hesabına yükselterek teklif vermeye ve kazanmaya başlayabilirsiniz!
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowConfirmUpgrade(true)}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Truck className="w-4 h-4" /> Taşımacı Kaydı Aç
                  </button>
                </>
              ) : (
                <div className="space-y-3 p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100/60">
                  <p className="text-xs text-blue-900 font-semibold leading-relaxed">
                    Bireysel hesabınızı Taşımacı / Nakliye Firması hesabına yükseltmek istiyor musunuz? 
                  </p>
                  <p className="text-[11px] text-slate-500">
                    * Yükseltme sonrasında profilinizde araç tipi, çalışma bölgeleri ve evrak bilgilerinizi güncellemeniz gerekecektir.
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={async () => {
                        const updatedProfile: UserProfile = {
                          ...user,
                          role: "MOVING_COMPANY",
                          isOnboarded: false,
                          isAdmin: user.role === "ADMIN" || user.isAdmin || user.email === "alibuyukuyar268@gmail.com" ? true : false
                        };
                        try {
                          await setDoc(doc(db, "users", user.id), updatedProfile, { merge: true });
                          onUpdate(updatedProfile);
                          setShowConfirmUpgrade(false);
                        } catch (err) {
                          console.error("Taşımacı hesabına yükseltme hatası:", err);
                          setError("Yükseltme sırasında bir hata oluştu.");
                        }
                      }}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all text-center cursor-pointer"
                    >
                      Evet, Yükselt
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowConfirmUpgrade(false)}
                      className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition-all text-center cursor-pointer"
                    >
                      Vazgeç
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Stats Box */}
          {user.role === "MOVING_COMPANY" && (
            <div className="bg-white p-6 rounded-3xl border border-slate-100/80 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-2">
                <Layers className="w-4 h-4 text-blue-600" /> Firma Performansı
              </h4>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-slate-50 p-3.5 rounded-2xl">
                  <span className="text-2xl font-black text-slate-900">{user.completedJobs || 0}</span>
                  <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Taşıma</p>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl">
                  <span className="text-2xl font-black text-slate-900 flex items-center justify-center gap-0.5">
                    {user.averageRating?.toFixed(1) || "5.0"}
                    <Star className="w-4.5 h-4.5 text-amber-400 fill-amber-400" />
                  </span>
                  <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Puan ({user.ratingsCount || 0})</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Edit Form */}
        <div className="lg:col-span-8">
          <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100/80 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-50 pb-3">
              <FileText className="w-5 h-5 text-slate-700" /> Profil Detaylarını Düzenle
            </h3>

            {/* General Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  {user.role === "MOVING_COMPANY" ? "Firma Ünvanı / Şirket Adı" : "Adınız Soyadınız"}
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-800 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Telefon Numarası
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-800 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Corporate Fields for Moving Company */}
            {user.role === "MOVING_COMPANY" && (
              <div className="space-y-6 pt-4 border-t border-slate-100/80">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-blue-600" /> Kurumsal ve Lojistik Bilgileri
                </h4>

                {/* Tax details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Vergi Numarası
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="10 Haneli Vergi No"
                      value={taxNumber}
                      onChange={(e) => setTaxNumber(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-800 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Vergi Dairesi
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: Kadıköy V.D."
                      value={taxOffice}
                      onChange={(e) => setTaxOffice(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-800 font-medium"
                    />
                  </div>
                </div>

                {/* Operations details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200/50">
                    <input
                      type="checkbox"
                      id="insurance-checkbox"
                      checked={hasInsurance}
                      onChange={(e) => setHasInsurance(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <label htmlFor="insurance-checkbox" className="text-xs font-bold text-slate-700 cursor-pointer">
                      Tüm Taşımalar Sigortalı Yapılsın
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/50">
                    <span className="text-xs font-bold text-slate-700">Firma Şoför Sayısı:</span>
                    <input
                      type="number"
                      min={1}
                      value={driversCount}
                      onChange={(e) => setDriversCount(Number(e.target.value))}
                      className="w-16 px-2.5 py-1 text-xs border border-slate-200 rounded-lg text-center font-bold text-slate-800 bg-white"
                    />
                  </div>
                </div>

                {/* Working Cities */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Hizmet Verilen Şehirler ({workingCities.length})
                    </label>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setWorkingCities(allTurkishCities)}
                        className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2 py-1 rounded-lg transition-all cursor-pointer"
                      >
                        Tümünü Seç
                      </button>
                      <button
                        type="button"
                        onClick={() => setWorkingCities([])}
                        className="text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold px-2 py-1 rounded-lg transition-all cursor-pointer"
                      >
                        Temizle
                      </button>
                    </div>
                  </div>

                  {/* Search box */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Şehir Ara... (Örn: İstanbul, Ankara)"
                      value={citySearchQuery}
                      onChange={(e) => setCitySearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                    />
                  </div>

                  {/* Scrollable City Checklist Grid */}
                  <div className="max-h-40 overflow-y-auto p-3 bg-slate-50 border border-slate-100 rounded-2xl grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {allTurkishCities
                      .filter((city) => city.toLowerCase().includes(citySearchQuery.toLowerCase()))
                      .map((city) => {
                        const isSelected = workingCities.includes(city);
                        return (
                          <button
                            key={city}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setWorkingCities(workingCities.filter((c) => c !== city));
                              } else {
                                setWorkingCities([...workingCities, city]);
                              }
                            }}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-left text-xs font-semibold transition-all border cursor-pointer ${
                              isSelected
                                ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                                : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/50"
                            }`}
                          >
                            <span className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[10px] ${
                              isSelected ? "bg-white text-blue-600 border-white" : "border-slate-300"
                            }`}>
                              {isSelected && "✓"}
                            </span>
                            <span className="truncate">{city}</span>
                          </button>
                        );
                      })}
                  </div>

                  {/* Selected Cities Tag Container */}
                  {workingCities.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Seçilen İller:</p>
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-2 bg-blue-50/20 rounded-xl border border-blue-100/30">
                        {workingCities.map((city) => (
                          <span
                            key={city}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-800 text-[11px] font-bold rounded-md border border-blue-100"
                          >
                            {city}
                            <button
                              type="button"
                              onClick={() => setWorkingCities(workingCities.filter((c) => c !== city))}
                              className="text-blue-400 hover:text-blue-600 focus:outline-none cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {workingCities.length === 0 && (
                    <p className="text-[11px] text-amber-600 font-semibold italic">Lütfen en az 1 şehir seçin.</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Firma Açıklaması ve Tanıtım Yazısı
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Şirketinizin deneyimleri, araçlarınızın hacmi, asansörlü taşıma imkanı gibi avantajlarınızdan bahsedin..."
                    className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-800 font-medium resize-none leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* Save Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
