import React, { useState, useEffect } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { UserProfile, UserRole } from "../types";
import { fetchCitiesFromFirestore } from "../utils/cities";
import { 
  User, 
  Truck, 
  Phone, 
  MapPin, 
  Clock, 
  Building2, 
  FileCheck, 
  Upload, 
  ArrowRight, 
  LogOut, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  ShieldAlert,
  Search,
  X
} from "lucide-react";
import { signOut } from "firebase/auth";

interface OnboardingFlowProps {
  user: UserProfile;
  onComplete: (updatedProfile: UserProfile) => void;
  onSignOut: () => void;
}

const TURKISH_CITIES = [
  "İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", "Adana", "Konya", "Gaziantep", 
  "Kocaeli", "Mersin", "Kayseri", "Eskişehir", "Denizli", "Samsun", "Sakarya", 
  "Muğla", "Tekirdağ", "Manisa", "Aydın", "Balıkesir", "Diyarbakır", "Trabzon"
];

const VEHICLE_TYPES = [
  "Sedan", "Hatchback", "Station Wagon", "Panelvan", "Kamyonet", "Kamyon", 
  "Tır", "Açık Kasa", "Kapalı Kasa", "Minibüs", "Diğer"
];

export default function OnboardingFlow({ user, onComplete, onSignOut }: OnboardingFlowProps) {
  const [step, setStep] = useState<"SELECT_ROLE" | "FILL_FORM">(
    user.role === "MOVING_COMPANY" ? "FILL_FORM" : "SELECT_ROLE"
  );
  const [selectedRole, setSelectedRole] = useState<UserRole | "">(user.role || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Common & Customer fields
  const [firstName, setFirstName] = useState(() => {
    if (user.firstName) return user.firstName;
    const parts = (user.name || "").split(" ");
    return parts[0] || "";
  });
  const [lastName, setLastName] = useState(() => {
    if (user.lastName) return user.lastName;
    const parts = (user.name || "").split(" ");
    return parts.slice(1).join(" ") || "";
  });
  const [phone, setPhone] = useState(user.phone || "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || auth.currentUser?.photoURL || "");
  const [city, setCity] = useState(user.city || "İstanbul");
  const [district, setDistrict] = useState(user.district || "");

  // Carrier specific fields - Vehicle
  const [vehicleType, setVehicleType] = useState(user.vehicleType || "Panelvan");
  const [vehicleBrand, setVehicleBrand] = useState(user.vehicleBrand || "");
  const [vehicleModel, setVehicleModel] = useState(user.vehicleModel || "");
  const [vehicleYear, setVehicleYear] = useState<number>(user.vehicleYear || 2020);
  const [vehiclePlate, setVehiclePlate] = useState(user.vehiclePlate || "");
  const [vehicleCapacityKg, setVehicleCapacityKg] = useState<number>(user.vehicleCapacityKg || 1000);
  const [vehicleDimensions, setVehicleDimensions] = useState(user.vehicleDimensions || ""); // e.g., "3.2m x 1.8m x 1.9m"
  const [vehicleMaxHeight, setVehicleMaxHeight] = useState<number>(user.vehicleMaxHeight || 2.0);
  const [vehicleMaxLength, setVehicleMaxLength] = useState<number>(user.vehicleMaxLength || 3.5);
  const [vehicleMaxWidth, setVehicleMaxWidth] = useState<number>(user.vehicleMaxWidth || 1.9);

  // Carrier specific fields - Service
  const [isIntercity, setIsIntercity] = useState(user.isIntercity ?? false);
  const [isIntracity, setIsIntracity] = useState(user.isIntracity ?? true);
  const [workingHours, setWorkingHours] = useState(user.workingHours || "08:00 - 20:00");
  const [workingCities, setWorkingCities] = useState<string[]>(user.workingCities || []);
  const [allTurkishCities, setAllTurkishCities] = useState<string[]>([]);
  const [citySearchQuery, setCitySearchQuery] = useState("");
  const [workingDistrictsInput, setWorkingDistrictsInput] = useState(() => {
    if (user.workingDistricts && Array.isArray(user.workingDistricts)) {
      return user.workingDistricts.join(", ");
    }
    return "";
  });

  useEffect(() => {
    const loadCities = async () => {
      const cities = await fetchCitiesFromFirestore();
      setAllTurkishCities(cities);
    };
    loadCities();
  }, []);

  // Carrier specific fields - Company Checkbox & Details
  const [isCompanyOwner, setIsCompanyOwner] = useState(user.isCompanyOwner ?? false);
  const [companyName, setCompanyName] = useState(user.companyName || "");
  const [taxNumber, setTaxNumber] = useState(user.taxNumber || "");
  const [taxOffice, setTaxOffice] = useState(user.taxOffice || "");
  const [taxPlateUrl, setTaxPlateUrl] = useState(user.taxPlateUrl || "");
  const [tradeRegistryNo, setTradeRegistryNo] = useState(user.tradeRegistryNo || "");
  const [companyAddress, setCompanyAddress] = useState(user.companyAddress || "");
  const [companyPhone, setCompanyPhone] = useState(user.companyPhone || "");

  // Drag and drop / local upload for Avatar
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [taxPlateUploading, setTaxPlateUploading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "avatar" | "taxPlate") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === "avatar") setAvatarUploading(true);
    else setTaxPlateUploading(true);

    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === "avatar") {
        setAvatarUrl(reader.result as string);
        setAvatarUploading(false);
      } else {
        setTaxPlateUrl(reader.result as string);
        setTaxPlateUploading(false);
      }
    };
    reader.onerror = () => {
      setError("Dosya yüklenirken bir hata oluştu.");
      setAvatarUploading(false);
      setTaxPlateUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRoleSelection = () => {
    if (!selectedRole) {
      setError("Lütfen devam etmek için bir hesap türü seçin.");
      return;
    }
    setError("");
    setStep("FILL_FORM");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate common fields
      if (!firstName.trim()) throw new Error("Lütfen adınızı girin.");
      if (!lastName.trim()) throw new Error("Lütfen soyadınızı girin.");
      if (!phone.trim()) throw new Error("Lütfen geçerli bir telefon numarası girin.");

      let profileData: UserProfile = {
        ...user,
        role: selectedRole as UserRole,
        name: `${firstName.trim()} ${lastName.trim()}`,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        avatarUrl,
        isOnboarded: true,
        createdAt: user.createdAt || new Date().toISOString()
      };

      if (selectedRole === "CUSTOMER") {
        if (!city) throw new Error("Lütfen il seçiniz.");
        if (!district.trim()) throw new Error("Lütfen ilçe giriniz.");
        
        profileData.city = city;
        profileData.district = district.trim();
      } else if (selectedRole === "MOVING_COMPANY") {
        // Validate Vehicle fields
        if (!vehicleBrand.trim()) throw new Error("Lütfen araç markasını girin.");
        if (!vehicleModel.trim()) throw new Error("Lütfen araç modelini girin.");
        if (!vehiclePlate.trim()) throw new Error("Lütfen araç plakasını girin.");
        if (!vehicleDimensions.trim()) throw new Error("Lütfen kasa ölçülerini girin (Örn: 4.2 x 2.1 x 2.2 m).");
        if (vehicleYear <= 1950 || vehicleYear > 2027) throw new Error("Lütfen geçerli bir araç yılı girin.");
        if (vehicleCapacityKg <= 0) throw new Error("Lütfen taşıma kapasitesini girin.");
        if (vehicleMaxHeight <= 0) throw new Error("Lütfen maksimum yüksekliği girin.");
        if (vehicleMaxLength <= 0) throw new Error("Lütfen maksimum uzunluğu girin.");
        if (vehicleMaxWidth <= 0) throw new Error("Lütfen maksimum genişliği girin.");

        // Service Validation
        if (workingCities.length === 0) throw new Error("Lütfen hizmet verdiğiniz en az bir ili seçin.");
        if (!workingHours.trim()) throw new Error("Lütfen çalışma saatlerini belirtin.");

        profileData = {
          ...profileData,
          vehicleType,
          vehicleBrand: vehicleBrand.trim(),
          vehicleModel: vehicleModel.trim(),
          vehicleYear,
          vehiclePlate: vehiclePlate.toUpperCase().trim(),
          vehicleCapacityKg,
          vehicleDimensions: vehicleDimensions.trim(),
          vehicleMaxHeight,
          vehicleMaxLength,
          vehicleMaxWidth,
          isIntercity,
          isIntracity,
          workingHours: workingHours.trim(),
          workingCities,
          workingDistricts: workingDistrictsInput.split(",").map(d => d.trim()).filter(Boolean),
          isCompanyOwner,
          
          // Compatibilities / default counters
          averageRating: 5.0,
          ratingsCount: 0,
          completedJobs: 0,
          isApproved: isCompanyOwner ? false : true, // Corporate might need approval, freelancers active by default or pending
        };

        if (isCompanyOwner) {
          if (!companyName.trim()) throw new Error("Lütfen şirket adını girin.");
          if (!taxNumber.trim()) throw new Error("Lütfen vergi numaranızı girin.");
          if (!taxOffice.trim()) throw new Error("Lütfen vergi dairesini girin.");
          if (!taxPlateUrl) throw new Error("Lütfen vergi levhasını yükleyin.");
          if (!companyAddress.trim()) throw new Error("Lütfen şirket adresini girin.");
          if (!companyPhone.trim()) throw new Error("Lütfen şirket telefonunu girin.");

          profileData.companyName = companyName.trim();
          profileData.taxNumber = taxNumber.trim();
          profileData.taxOffice = taxOffice.trim();
          profileData.taxPlateUrl = taxPlateUrl;
          profileData.tradeRegistryNo = tradeRegistryNo.trim();
          profileData.companyAddress = companyAddress.trim();
          profileData.companyPhone = companyPhone.trim();
        }
      }

      // Save to Firebase
      const userRef = doc(db, "users", user.id);
      await setDoc(userRef, profileData);

      // Trigger completion callback
      onComplete(profileData);
    } catch (err: any) {
      console.error("Onboarding saving error:", err);
      setError(err.message || "Profil kaydedilirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutClick = async () => {
    try {
      await signOut(auth);
      onSignOut();
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8">
      {/* Top Banner */}
      <div className="max-w-4xl mx-auto w-full text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" /> Profilinizi Tamamlayarak Platforma Katılın
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          NakNak Pazaryeri Kayıt Portalı
        </h2>
        <p className="mt-2 text-sm text-slate-500 max-w-lg mx-auto">
          Güvenli nakliyat ağımıza hoş geldiniz. Platformu kullanmaya başlamak için lütfen profilinizi eksiksiz tamamlayın.
        </p>
      </div>

      <div className="mt-8 max-w-3xl mx-auto w-full">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-3 text-sm text-rose-800 animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <div className="font-medium">{error}</div>
          </div>
        )}

        <div className="bg-white shadow-xl rounded-3xl border border-slate-100 overflow-hidden">
          
          {/* STEP 1: SELECT ROLE */}
          {step === "SELECT_ROLE" && (
            <div className="p-8 sm:p-10 space-y-8">
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-slate-900">Hesap Türünüzü Seçin</h3>
                <p className="text-xs text-slate-400">
                  İhtiyacınıza uygun hesap modelini seçerek devam edin. Bu seçim sonradan yönetici onayı olmaksızın değiştirilemez.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Account Card */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole("CUSTOMER");
                    setError("");
                  }}
                  className={`relative p-8 rounded-2xl border text-left flex flex-col justify-between h-64 transition-all cursor-pointer ${
                    selectedRole === "CUSTOMER"
                      ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/10"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/30"
                  }`}
                >
                  <div className="space-y-4">
                    <div className={`p-3 rounded-xl inline-block ${
                      selectedRole === "CUSTOMER" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
                    }`}>
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900">Kişisel Hesap</h4>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                        Ev eşyası, tek parça yük, ofis taşıtmak isteyen bireysel müşteriler veya ticari sevkiyat sahipleri için.
                      </p>
                    </div>
                  </div>
                  {selectedRole === "CUSTOMER" && (
                    <div className="absolute right-6 bottom-6 text-blue-600">
                      <CheckCircle2 className="w-6 h-6 fill-blue-50" />
                    </div>
                  )}
                </button>

                {/* Carrier Account Card */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole("MOVING_COMPANY");
                    setError("");
                  }}
                  className={`relative p-8 rounded-2xl border text-left flex flex-col justify-between h-64 transition-all cursor-pointer ${
                    selectedRole === "MOVING_COMPANY"
                      ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/10"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/30"
                  }`}
                >
                  <div className="space-y-4">
                    <div className={`p-3 rounded-xl inline-block ${
                      selectedRole === "MOVING_COMPANY" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
                    }`}>
                      <Truck className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900">Taşımacı Hesabı</h4>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                        Kendi aracı olan bireysel şoförler, serbest nakliyeciler, esnaflar veya kurumsal lojistik ve evden eve taşıma firmaları için.
                      </p>
                    </div>
                  </div>
                  {selectedRole === "MOVING_COMPANY" && (
                    <div className="absolute right-6 bottom-6 text-blue-600">
                      <CheckCircle2 className="w-6 h-6 fill-blue-50" />
                    </div>
                  )}
                </button>
              </div>

              {/* Warnings and Terms */}
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3 text-xs text-amber-800 leading-relaxed">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Kritik Bilgi:</strong> Platformumuz yalnızca profesyonel evden eve taşıma firmalarına değil; aracı olan tüm <strong>bireysel araç sahiplerine, serbest nakliyecilere, küçük esnaflara ve lojistik şirketlerine</strong> açıktır. Taşıma boyutunuz ne olursa olsun uygun bir araçla yük alabilirsiniz!
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleLogoutClick}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> Oturumu Kapat
                </button>
                <button
                  type="button"
                  onClick={handleRoleSelection}
                  className="px-6 py-2.5 bg-slate-950 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  Devam Et <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: FILL FORM */}
          {step === "FILL_FORM" && (
            <form onSubmit={handleSubmit} className="p-8 sm:p-10 space-y-8">
              
              {/* Back to Type Selection */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {selectedRole === "CUSTOMER" ? "Kişisel Hesap Bilgileri" : "Taşımacı Profil Bilgileri"}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Lütfen aşağıdaki zorunlu alanları doldurun. Tüm alanlar doldurulmadan sisteme erişim sağlanamaz.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep("SELECT_ROLE")}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-all cursor-pointer"
                >
                  Hesap Türünü Değiştir
                </button>
              </div>

              {/* 1. PERSONAL INFORMATION SECTION */}
              <div className="space-y-5">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-l-4 border-blue-600 pl-3">
                  Kişisel Bilgiler
                </h4>

                {/* Avatar upload */}
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div className="relative w-24 h-24 rounded-full border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-slate-400" />
                    )}
                    {avatarUploading && (
                      <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center text-[10px] text-white font-bold">
                        Yükleniyor...
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5 text-center sm:text-left">
                    <span className="block text-xs font-bold text-slate-600 uppercase">Profil Fotoğrafı</span>
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 cursor-pointer transition-all">
                      <Upload className="w-3.5 h-3.5" /> Fotoğraf Seç / Yükle
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleFileUpload(e, "avatar")} 
                        className="hidden" 
                      />
                    </label>
                    <p className="text-[10px] text-slate-400">
                      Opsiyoneldir. Boş bırakırsanız Google profil resminiz kullanılacaktır.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Adınız
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: Ahmet"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-slate-800 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Soyadınız
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: Yılmaz"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-slate-800 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Telefon Numarası
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      placeholder="Örn: 0555 123 4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-slate-800 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* 2. CUSTOMER-ONLY SECTION */}
              {selectedRole === "CUSTOMER" && (
                <div className="space-y-5">
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-l-4 border-blue-600 pl-3">
                    Adres Bilgileri
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Yaşadığınız İl
                      </label>
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-slate-800 transition-all"
                      >
                        {TURKISH_CITIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        İlçe
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          placeholder="Örn: Kadıköy"
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-slate-800 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. CARRIER VEHICLE SECTION */}
              {selectedRole === "MOVING_COMPANY" && (
                <div className="space-y-6 pt-4 border-t border-slate-100">
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-l-4 border-blue-600 pl-3">
                    Araç Özellikleri (Zorunlu)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Araç Türü
                      </label>
                      <select
                        value={vehicleType}
                        onChange={(e) => setVehicleType(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-800"
                      >
                        {VEHICLE_TYPES.map(vt => (
                          <option key={vt} value={vt}>{vt}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Araç Markası
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Örn: Ford, Mercedes"
                        value={vehicleBrand}
                        onChange={(e) => setVehicleBrand(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Araç Modeli
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Örn: Transit, Sprinter"
                        value={vehicleModel}
                        onChange={(e) => setVehicleModel(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Model Yılı
                      </label>
                      <input
                        type="number"
                        required
                        min={1950}
                        max={2027}
                        value={vehicleYear}
                        onChange={(e) => setVehicleYear(Number(e.target.value))}
                        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Araç Plakası
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Örn: 34ABC123"
                        value={vehiclePlate}
                        onChange={(e) => setVehiclePlate(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-800 uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Taşıma Kapasitesi (kg)
                      </label>
                      <input
                        type="number"
                        required
                        min={100}
                        value={vehicleCapacityKg}
                        onChange={(e) => setVehicleCapacityKg(Number(e.target.value))}
                        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="sm:col-span-1 md:col-span-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Kasa Ölçüleri
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Örn: 4.3x2.1x2.2"
                        value={vehicleDimensions}
                        onChange={(e) => setVehicleDimensions(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Yükseklik (m)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={vehicleMaxHeight}
                        onChange={(e) => setVehicleMaxHeight(Number(e.target.value))}
                        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Uzunluk (m)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={vehicleMaxLength}
                        onChange={(e) => setVehicleMaxLength(Number(e.target.value))}
                        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Genişlik (m)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={vehicleMaxWidth}
                        onChange={(e) => setVehicleMaxWidth(Number(e.target.value))}
                        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 4. CARRIER SERVICE SETTINGS SECTION */}
              {selectedRole === "MOVING_COMPANY" && (
                <div className="space-y-6 pt-4 border-t border-slate-100">
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-l-4 border-blue-600 pl-3">
                    Hizmet Ayarları
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="col-span-1 sm:col-span-2 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Hizmet Verilen İller ({workingCities.length})
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
                          className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-slate-800"
                        />
                      </div>

                      {/* Scrollable City Checklist Grid */}
                      <div className="max-h-40 overflow-y-auto p-3 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-left text-[11px] font-semibold transition-all border cursor-pointer ${
                                  isSelected
                                    ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                                    : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/50"
                                }`}
                              >
                                <span className={`w-3 h-3 rounded flex items-center justify-center border text-[9px] ${
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

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Hizmet Verilen Bölgeler / İlçeler
                      </label>
                      <input
                        type="text"
                        placeholder="Örn: Anadolu Yakası, Kadıköy, Kartal"
                        value={workingDistrictsInput}
                        onChange={(e) => setWorkingDistrictsInput(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Çalışma Saatleri
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          placeholder="Örn: 08:00 - 20:00"
                          value={workingHours}
                          onChange={(e) => setWorkingHours(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="flex gap-6 items-center pt-6">
                      <label className="flex items-center gap-2.5 font-semibold text-slate-700 text-sm cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isIntracity}
                          onChange={(e) => setIsIntracity(e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4.5 w-4.5"
                        />
                        Şehir İçi Çalışıyorum
                      </label>

                      <label className="flex items-center gap-2.5 font-semibold text-slate-700 text-sm cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isIntercity}
                          onChange={(e) => setIsIntercity(e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4.5 w-4.5"
                        />
                        Şehirler Arası Çalışıyorum
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. CARRIER COMPANY INFORMATION SECTION */}
              {selectedRole === "MOVING_COMPANY" && (
                <div className="space-y-6 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-l-4 border-blue-600 pl-3">
                      Şirket Bilgileri
                    </h4>
                    <label className="flex items-center gap-2 font-bold text-blue-600 text-xs cursor-pointer select-none bg-blue-50 px-3 py-1 rounded-lg">
                      <input
                        type="checkbox"
                        checked={isCompanyOwner}
                        onChange={(e) => setIsCompanyOwner(e.target.checked)}
                        className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                      />
                      Şirket Sahibiyim
                    </label>
                  </div>

                  {isCompanyOwner ? (
                    <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-4 animate-in fade-in duration-200">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            Şirket Adı / Ticari Ünvan
                          </label>
                          <div className="relative">
                            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              type="text"
                              required
                              placeholder="Örn: Jet Nakliyat Ltd. Şti."
                              value={companyName}
                              onChange={(e) => setCompanyName(e.target.value)}
                              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none text-slate-800"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            Şirket Telefonu
                          </label>
                          <div className="relative">
                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              type="tel"
                              required
                              placeholder="Örn: 0212 123 4567"
                              value={companyPhone}
                              onChange={(e) => setCompanyPhone(e.target.value)}
                              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none text-slate-800"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            Vergi Numarası
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={10}
                            placeholder="10 Haneli No"
                            value={taxNumber}
                            onChange={(e) => setTaxNumber(e.target.value)}
                            className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none text-slate-800"
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
                            className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none text-slate-800"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            Ticaret Sicil Bilgileri (Opsiyonel)
                          </label>
                          <input
                            type="text"
                            placeholder="Örn: İstanbul Ticaret Odası - 123456"
                            value={tradeRegistryNo}
                            onChange={(e) => setTradeRegistryNo(e.target.value)}
                            className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            Vergi Levhası Görseli / Dosyası
                          </label>
                          <div className="flex items-center gap-3">
                            <label className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 cursor-pointer transition-all">
                              <Upload className="w-3.5 h-3.5" /> Levha Yükle
                              <input 
                                type="file" 
                                accept="image/*,.pdf" 
                                onChange={(e) => handleFileUpload(e, "taxPlate")} 
                                className="hidden" 
                              />
                            </label>
                            {taxPlateUrl ? (
                              <span className="text-xs text-green-600 flex items-center gap-1 font-bold">
                                <FileCheck className="w-4 h-4" /> Yüklendi!
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">Yükleme zorunludur</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Şirket Adresi
                        </label>
                        <textarea
                          rows={2}
                          required
                          placeholder="Şirketin resmi fatura adresini yazınız..."
                          value={companyAddress}
                          onChange={(e) => setCompanyAddress(e.target.value)}
                          className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none text-slate-800 resize-none"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 leading-relaxed italic">
                      Şirket sahibi olmadığınızı belirttiniz. Platform üzerinde <strong>bireysel bağımsız taşımacı (freelancer)</strong> olarak kayıt edilecek, şahsi aracınızla hemen teklif vermeye başlayabileceksiniz.
                    </p>
                  )}
                </div>
              )}

              {/* Form Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleLogoutClick}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> Vazgeç / Çıkış Yap
                </button>
                <button
                  type="submit"
                  disabled={loading || avatarUploading || taxPlateUploading}
                  className="px-8 py-3.5 bg-slate-950 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-slate-950/10"
                >
                  {loading ? "Kaydediliyor..." : "Kaydet ve Başla"} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

        </div>
      </div>

      {/* Footer support credits */}
      <div className="max-w-4xl mx-auto w-full text-center mt-12 text-xs text-slate-400">
        Sorun yaşıyorsanız destek birimi ile iletişime geçebilirsiniz. NakNak Taşıma Hizmetleri Güvencesi.
      </div>
    </div>
  );
}
