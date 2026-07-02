import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { MovingRequest, UserProfile } from "../types";
import MapComponent from "./MapComponent";
import { TURKISH_CITIES } from "../utils/turkeyAddressData";
import {
  FileText,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  Info,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Package,
  Truck,
  HelpCircle,
  Search
} from "lucide-react";

interface CreateRequestFormProps {
  user: UserProfile;
  onSuccess: () => void;
  onCancel: () => void;
  companies?: any[];
}

export default function CreateRequestForm({ user, onSuccess, onCancel, companies = [] }: CreateRequestFormProps) {
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupLatLng, setPickupLatLng] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [destinationAddress, setDestinationAddress] = useState("");
  const [destinationLatLng, setDestinationLatLng] = useState<{ lat: number; lng: number } | undefined>(undefined);

  // Dynamic Address Input States (Pickup)
  const [pickupCity, setPickupCity] = useState("");
  const [pickupDistrict, setPickupDistrict] = useState("");
  const [pickupNeighborhood, setPickupNeighborhood] = useState("");
  const [pickupBuildingNo, setPickupBuildingNo] = useState("");
  const [pickupDesc, setPickupDesc] = useState("");

  // Dynamic Address Input States (Destination)
  const [destinationCity, setDestinationCity] = useState("");
  const [destinationDistrict, setDestinationDistrict] = useState("");
  const [destinationNeighborhood, setDestinationNeighborhood] = useState("");
  const [destinationBuildingNo, setDestinationBuildingNo] = useState("");
  const [destinationDesc, setDestinationDesc] = useState("");

  const [pickupFloor, setPickupFloor] = useState(0);
  const [destinationFloor, setDestinationFloor] = useState(0);
  const [hasElevatorPickup, setHasElevatorPickup] = useState(false);
  const [hasElevatorDestination, setHasElevatorDestination] = useState(false);

  const [estimatedDate, setEstimatedDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("Sabahtan (08:00 - 12:00)");
  const [houseType, setHouseType] = useState("2+1");
  const [roomCount, setRoomCount] = useState("3 Oda");

  const [furnitureList, setFurnitureList] = useState("");
  const [fragileItems, setFragileItems] = useState("Kırılacak cam ve porselen eşyalar yoğunlukta.");
  const [whiteGoods, setWhiteGoods] = useState("Buzdolabı, Çamaşır Makinesi, Bulaşık Makinesi.");
  const [hasPiano, setHasPiano] = useState(false);
  const [hasSafe, setHasSafe] = useState(false);
  const [boxesCount, setBoxesCount] = useState(15);

  const [assemblyRequired, setAssemblyRequired] = useState(true);
  const [disassemblyRequired, setDisassemblyRequired] = useState(true);
  const [packingRequired, setPackingRequired] = useState(true);
  const [storageRequired, setStorageRequired] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState("");

  // Volume / Item Calculator States
  const [calculatorItems, setCalculatorItems] = useState([
    { id: "sofa3", name: "3 Kişilik Kanepe / Koltuk", volume: 1.5, count: 0, category: "Mobilya" },
    { id: "sofa2", name: "2 Kişilik Kanepe / Koltuk", volume: 1.0, count: 0, category: "Mobilya" },
    { id: "armchair", name: "Tekli Koltuk / Berjer", volume: 0.5, count: 0, category: "Mobilya" },
    { id: "dining_table", name: "Yemek Masası", volume: 1.2, count: 0, category: "Mobilya" },
    { id: "chair", name: "Sandalye", volume: 0.15, count: 0, category: "Mobilya" },
    { id: "tv_unit", name: "TV Ünitesi", volume: 0.8, count: 0, category: "Mobilya" },
    { id: "double_bed", name: "Çift Kişilik Yatak & Baza", volume: 2.0, count: 0, category: "Mobilya" },
    { id: "single_bed", name: "Tek Kişilik Yatak & Baza", volume: 1.0, count: 0, category: "Mobilya" },
    { id: "wardrobe_large", name: "Büyük Gardırop (3+ Kapaklı)", volume: 3.0, count: 0, category: "Mobilya" },
    { id: "wardrobe_small", name: "Küçük Gardırop (1-2 Kapaklı)", volume: 1.5, count: 0, category: "Mobilya" },
    { id: "fridge", name: "Buzdolabı", volume: 1.8, count: 0, category: "Beyaz Eşya" },
    { id: "washing_machine", name: "Çamaşır Makinesi", volume: 0.6, count: 0, category: "Beyaz Eşya" },
    { id: "dishwasher", name: "Bulaşık Makinesi", volume: 0.6, count: 0, category: "Beyaz Eşya" },
    { id: "oven", name: "Fırın", volume: 0.4, count: 0, category: "Beyaz Eşya" },
    { id: "box", name: "Standart Karton Koli", volume: 0.12, count: 0, category: "Kutu/Diğer" },
    { id: "suitcase", name: "Büyük Boy Valiz", volume: 0.15, count: 0, category: "Kutu/Diğer" },
  ]);
  const [calculatorCategory, setCalculatorCategory] = useState<"Mobilya" | "Beyaz Eşya" | "Kutu/Diğer">("Mobilya");

  const totalVolumeM3 = Number(calculatorItems.reduce((acc, curr) => acc + (curr.volume * curr.count), 0).toFixed(2));

  const getRecommendedVehicle = (volume: number) => {
    if (volume === 0) return "Henüz eşya seçilmedi";
    if (volume < 5) return "Kamyonet (Küçük Boy - Parça Eşya için)";
    if (volume < 15) return "Kamyonet (Büyük Boy - 1+1 Ev için)";
    if (volume < 30) return "Ortaboy Nakliye Kamyonu (2+1 Ev için)";
    if (volume < 45) return "Büyük Boy Nakliye Kamyonu (3+1 Ev için)";
    return "TIR veya Çift Kamyon (Geniş Ev veya Villa için)";
  };

  const handleAdjustCount = (id: string, amount: number) => {
    setCalculatorItems(prev => prev.map(item => {
      if (item.id === id) {
        const newCount = Math.max(0, item.count + amount);
        return { ...item, count: newCount };
      }
      return item;
    }));
  };

  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");

  // Company list states for private requests
  const [allCompanies, setAllCompanies] = useState<any[]>([]);
  const [workedWithCompanies, setWorkedWithCompanies] = useState<any[]>([]);
  const [selectedPrivateCompanyId, setSelectedPrivateCompanyId] = useState("");
  const [selectedPrivateCompanyName, setSelectedPrivateCompanyName] = useState("");

  // Fetch companies and discover previously worked with ones using real-time listener
  useEffect(() => {
    const qComps = query(collection(db, "users"), where("role", "==", "MOVING_COMPANY"));
    const unsubscribeComps = onSnapshot(qComps, (snapshot) => {
      const comps: any[] = [];
      snapshot.forEach((doc) => {
        comps.push({ id: doc.id, ...doc.data() });
      });
      setAllCompanies(comps);

      // Fetch user's completed or accepted jobs of this customer to find worked-with companies
      if (user?.id) {
        const qReqs = query(collection(db, "moving_requests"), where("customerId", "==", user.id));
        getDocs(qReqs).then((reqsSnap) => {
          const workedCompanyIds = new Set<string>();
          reqsSnap.forEach((doc) => {
            const d = doc.data();
            if (d.acceptedCompanyId) {
              workedCompanyIds.add(d.acceptedCompanyId);
            }
          });
          const workedComps = comps.filter((c) => workedCompanyIds.has(c.id));
          setWorkedWithCompanies(workedComps);
        }).catch((err) => {
          console.error("Error fetching worked with companies in CreateRequestForm:", err);
        });
      }
    }, (error) => {
      console.error("Error listening to companies in CreateRequestForm:", error);
    });

    return () => unsubscribeComps();
  }, [user?.id]);

  // Calculated map metrics
  const [distanceKm, setDistanceKm] = useState<number | undefined>(undefined);
  const [estimatedDurationMins, setEstimatedDurationMins] = useState<number | undefined>(undefined);

  // AI Pricing Estimation State
  const [aiPrice, setAiPrice] = useState<{ min: number; max: number; reasoning: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Address assembly and geocoding effects
  useEffect(() => {
    if (pickupCity && pickupDistrict && pickupNeighborhood) {
      setPickupAddress(`${pickupCity}, ${pickupDistrict}, ${pickupNeighborhood} Mah., Bina No: ${pickupBuildingNo || "-"}, Açıklama: ${pickupDesc || "-"}`);
    } else {
      setPickupAddress("");
    }
  }, [pickupCity, pickupDistrict, pickupNeighborhood, pickupBuildingNo, pickupDesc]);

  useEffect(() => {
    if (destinationCity && destinationDistrict && destinationNeighborhood) {
      setDestinationAddress(`${destinationCity}, ${destinationDistrict}, ${destinationNeighborhood} Mah., Bina No: ${destinationBuildingNo || "-"}, Açıklama: ${destinationDesc || "-"}`);
    } else {
      setDestinationAddress("");
    }
  }, [destinationCity, destinationDistrict, destinationNeighborhood, destinationBuildingNo, destinationDesc]);

  // Helper to geocode with fallback strategies
  const geocodeAddress = async (city: string, district?: string, neighborhood?: string) => {
    if (!city) return null;
    
    const attempts: string[] = [];
    
    // Attempt 1: Fullest details
    if (neighborhood && district) {
      attempts.push([`${neighborhood} Mah.`, district, city, "Türkiye"].join(", "));
      attempts.push([neighborhood, district, city, "Türkiye"].join(", "));
    }
    
    // Attempt 2: District + City
    if (district) {
      attempts.push([district, city, "Türkiye"].join(", "));
    }
    
    // Attempt 3: Just City
    attempts.push([city, "Türkiye"].join(", "));

    for (const queryText of attempts) {
      try {
        const res = await fetch(`/api/google-geocode?address=${encodeURIComponent(queryText)}`);
        const data = await res.json();
        if (data && data.status === "OK" && data.results && data.results.length > 0) {
          const loc = data.results[0].geometry.location;
          return { lat: loc.lat, lng: loc.lng };
        }
      } catch (e) {
        console.error("Geocoding step failed for:", queryText, e);
      }
    }
    return null;
  };

  // Background geocoding when city/district/neighborhood changes (fully Google-powered with progressive fallbacks)
  useEffect(() => {
    if (!pickupCity) return;
    const timer = setTimeout(async () => {
      const coords = await geocodeAddress(pickupCity, pickupDistrict, pickupNeighborhood);
      if (coords) {
        setPickupLatLng(coords);
      }
    }, 600); // debounce
    return () => clearTimeout(timer);
  }, [pickupCity, pickupDistrict, pickupNeighborhood]);

  useEffect(() => {
    if (!destinationCity) return;
    const timer = setTimeout(async () => {
      const coords = await geocodeAddress(destinationCity, destinationDistrict, destinationNeighborhood);
      if (coords) {
        setDestinationLatLng(coords);
      }
    }, 600); // debounce
    return () => clearTimeout(timer);
  }, [destinationCity, destinationDistrict, destinationNeighborhood]);

  const handleMapCalculation = (dist: number, duration: number) => {
    setDistanceKm(dist);
    setEstimatedDurationMins(duration);
  };

  const fetchAIPricing = async () => {
    if (!pickupCity || !pickupDistrict || !destinationCity || !destinationDistrict) {
      setAiError("Lütfen önce 1. Konum & Adres Bilgileri kısmından yükleme ve teslimat İl ve İlçelerini seçiniz/giriniz.");
      setAiPrice(null);
      return;
    }

    setAiError("");
    setAiPrice(null);
    setAiLoading(true);

    try {
      const response = await fetch("/api/ai-estimate-price", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          distanceKm: distanceKm || 15,
          pickupCity,
          pickupDistrict,
          destinationCity,
          destinationDistrict,
          pickupFloor,
          destinationFloor,
          roomCount: houseType,
          hasPiano,
          hasSafe,
          packingRequired,
          assemblyRequired
        })
      });

      if (!response.ok) {
        throw new Error("Sunucu hatası oluştu.");
      }

      const data = await response.json();
      setAiPrice({
        min: data.minPrice,
        max: data.maxPrice,
        reasoning: data.reasoning
      });
    } catch (err: any) {
      console.error(err);
      setAiError("Yapay zeka fiyat tahmini şu an alınamıyor. Klasik hesaplama yapılabilir.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!pickupAddress || !destinationAddress) {
      setFormError("Lütfen harita üzerinden yükleme ve teslimat noktalarını belirleyin.");
      return;
    }

    if (!estimatedDate) {
      setFormError("Lütfen planlanan taşınma tarihini seçin.");
      return;
    }

    if (visibility === "PRIVATE" && !selectedPrivateCompanyId) {
      setFormError("Gizli talebiniz için lütfen teklif almak istediğiniz nakliye firmasını seçin.");
      return;
    }

    setLoading(true);

    try {
      const selectedCalcItems = calculatorItems.filter(item => item.count > 0);
      const calculatedItemsStr = selectedCalcItems.map(item => `${item.count}x ${item.name}`).join(", ");
      
      let finalFurnitureList = furnitureList ? furnitureList.split(",").map((item) => item.trim()).filter(Boolean) : [];
      if (selectedCalcItems.length > 0) {
        finalFurnitureList = [...selectedCalcItems.map(item => `${item.count} adet ${item.name}`), ...finalFurnitureList];
      }

      const requestData: Omit<MovingRequest, "id"> = {
        customerId: user.id,
        customerName: user.name,
        customerPhone: user.phone,
        pickupAddress,
        destinationAddress,
        pickupLocation: pickupLatLng,
        destinationLocation: destinationLatLng,
        pickupFloor: Number(pickupFloor),
        destinationFloor: Number(destinationFloor),
        hasElevatorPickup,
        hasElevatorDestination,
        distanceKm,
        estimatedDurationHours: estimatedDurationMins ? Math.round(estimatedDurationMins / 60) : undefined,
        estimatedDate,
        preferredTime,
        houseType,
        roomCount: houseType,
        furnitureList: finalFurnitureList,
        calculatedVolume: totalVolumeM3,
        calculatedItems: calculatedItemsStr || "",
        fragileItems,
        whiteGoods,
        hasPiano,
        hasSafe,
        boxesCount: Number(boxesCount),
        assemblyRequired,
        disassemblyRequired,
        packingRequired,
        storageRequired,
        additionalNotes,
        visibility,
        ...(visibility === "PRIVATE" ? {
          privateCompanyId: selectedPrivateCompanyId,
          privateCompanyName: selectedPrivateCompanyName
        } : {}),
        status: "PENDING",
        createdAt: new Date().toISOString()
      };

      // Add to Firestore collection
      await addDoc(collection(db, "moving_requests"), requestData);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setFormError("Talep kaydedilirken bir hata oluştu: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-3xl p-8 md:p-12 text-white mb-8 relative overflow-hidden shadow-sm">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-blue-500/20 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 text-white text-xs font-semibold rounded-full mb-4 backdrop-blur-sm border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            Yapay Zeka Destekli Fiyatlandırma
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold font-display leading-tight">
            Yeni Ev Taşıma Talebi Oluştur
          </h1>
          <p className="text-slate-300 text-sm md:text-base mt-2 max-w-xl">
            Taşınma detaylarınızı girin, profesyonel firmalardan rekabetçi teklifler alın ve akıllı fiyat hesaplayıcımızla bütçenizi önceden planlayın.
          </p>
        </div>
      </div>

      {formError && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="text-xs font-semibold">{formError}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Form inputs */}
        <div className="lg:col-span-7 space-y-6">
          {/* Adres ve Harita Seçimi */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" /> 1. Konum & Adres Bilgileri
            </h3>
            <p className="text-xs text-slate-400">
              Yükleme (Nereden) ve Teslimat (Nereye) adres bilgilerinizi seçin. Mesafe ve güzergah haritada otomatik olarak çizilecektir.
            </p>

            {/* Dynamic Dropdown Forms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pickup Address Form */}
              <div className="space-y-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                  <h4 className="text-xs font-bold text-blue-700 flex items-center gap-1.5 uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span> Nereden (Yükleme Noktası)
                  </h4>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">İl Seçin</label>
                    <select
                      required
                      value={pickupCity}
                      onChange={(e) => {
                        setPickupCity(e.target.value);
                      }}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 text-slate-700 font-medium"
                    >
                      <option value="">İl Seçiniz</option>
                      {TURKISH_CITIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">İlçe</label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: Meram, Selçuklu..."
                      value={pickupDistrict}
                      onChange={(e) => setPickupDistrict(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 text-slate-700 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Mahalle / Köy</label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: Karahüyük, Yazır..."
                      value={pickupNeighborhood}
                      onChange={(e) => setPickupNeighborhood(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 text-slate-700 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Bina / Daire No (Manuel)</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: No: 12, Daire: 4"
                    value={pickupBuildingNo}
                    onChange={(e) => setPickupBuildingNo(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Adres Açıklaması (Manuel)</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Sokak, Apartman Adı ve diğer detaylar..."
                    value={pickupDesc}
                    onChange={(e) => setPickupDesc(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 text-slate-700 resize-none"
                  />
                </div>
              </div>

              {/* Destination Address Form */}
              <div className="space-y-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                  <h4 className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span> Nereye (Teslimat Noktası)
                  </h4>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">İl Seçin</label>
                    <select
                      required
                      value={destinationCity}
                      onChange={(e) => {
                        setDestinationCity(e.target.value);
                      }}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-600 text-slate-700 font-medium"
                    >
                      <option value="">İl Seçiniz</option>
                      {TURKISH_CITIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">İlçe</label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: Meram, Selçuklu..."
                      value={destinationDistrict}
                      onChange={(e) => setDestinationDistrict(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-600 text-slate-700 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Mahalle / Köy</label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: Karahüyük, Yazır..."
                      value={destinationNeighborhood}
                      onChange={(e) => setDestinationNeighborhood(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-600 text-slate-700 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Bina / Daire No (Manuel)</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: No: 45, Kat: 2, Daire: 8"
                    value={destinationBuildingNo}
                    onChange={(e) => setDestinationBuildingNo(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-600 text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Adres Açıklaması (Manuel)</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Sokak, Apartman Adı ve diğer detaylar..."
                    value={destinationDesc}
                    onChange={(e) => setDestinationDesc(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-600 text-slate-700 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Visual Map rendering */}
            <div className="h-[300px] sm:h-[400px]">
              <MapComponent
                pickupLatLng={pickupLatLng}
                destinationLatLng={destinationLatLng}
                onCalculated={handleMapCalculation}
                distanceKm={distanceKm}
                estimatedDurationMins={estimatedDurationMins}
              />
            </div>
          </div>

          {/* Bina ve Kat Bilgileri */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" /> 2. Kat ve Bina Bilgileri
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pickup specs */}
              <div className="space-y-3.5 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <h4 className="text-xs font-bold text-slate-800">Yükleme Yapılacak Ev</h4>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Bulunduğu Kat
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={pickupFloor}
                    onChange={(e) => setPickupFloor(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Giriş kat için 0 girin</span>
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 pt-1">
                  <input
                    type="checkbox"
                    checked={hasElevatorPickup}
                    onChange={(e) => setHasElevatorPickup(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Asansör Kullanılabilir
                </label>
              </div>

              {/* Destination specs */}
              <div className="space-y-3.5 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <h4 className="text-xs font-bold text-slate-800">Teslim Edilecek Ev</h4>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Hedef Kat
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={destinationFloor}
                    onChange={(e) => setDestinationFloor(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Giriş kat için 0 girin</span>
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 pt-1">
                  <input
                    type="checkbox"
                    checked={hasElevatorDestination}
                    onChange={(e) => setHasElevatorDestination(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Asansör Kullanılabilir
                </label>
              </div>
            </div>
          </div>

          {/* Tarih ve Zamanlama */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" /> 3. Taşınma Tarihi & Planlama
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Taşınma Tarihi
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split("T")[0]}
                  value={estimatedDate}
                  onChange={(e) => setEstimatedDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-700 font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Tercih Edilen Saat Dilimi
                </label>
                <select
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-700 font-medium"
                >
                  <option>Sabahtan (08:00 - 12:00)</option>
                  <option>Öğleden Sonra (12:00 - 17:00)</option>
                  <option>Akşamüstü (17:00 - 21:00)</option>
                  <option>Esnek / Tüm Gün</option>
                </select>
              </div>
            </div>
          </div>

          {/* Ev Eşya ve Hizmet Detayları */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-600" /> 4. Ev Eşyaları & Hizmet Kapsamı
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Taşıma Türü / Sevkiyat Kapsamı
                </label>
                <select
                  value={houseType}
                  onChange={(e) => setHouseType(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-700 font-medium"
                >
                  <option value="single_item">Tek Parça / Az Eşya (Çamaşır Makinesi, Buzdolabı, Kanepe, Gardırop vb.)</option>
                  <option value="1+1">1+1 (Küçük Daire Taşıma)</option>
                  <option value="2+1">2+1 (Standart Ev Taşıma)</option>
                  <option value="3+1">3+1 (Geniş Ev Taşıma)</option>
                  <option value="4+1">4+1 (Çok Geniş Ev Taşıma)</option>
                  <option value="Villa">Müstakil Ev / Villa / Dubleks Taşıma</option>
                  <option value="Ofis">Ofis / Büro Taşımacılığı</option>
                  <option value="factory">Fabrika / Endüstriyel Tesis Taşımacılığı</option>
                  <option value="warehouse">Depo Sevkiyatı & Taşımacılığı</option>
                  <option value="commercial">Ticari Sevkiyat / Paletli Taşımacılık</option>
                  <option value="furniture_delivery">Mobilya Mağazası Teslimat & Montajı</option>
                  <option value="construction">İnşaat / Yapı Malzemeleri Sevkiyatı</option>
                  <option value="machinery">Ağır Makine ve Sanayi Ekipmanı Taşımacılığı</option>
                  <option value="intercity_part">Şehirler Arası Parça Eşya (Parsiyel)</option>
                  <option value="intracity_light">Şehir İçi Hafif Nakliye (Hızlı Kurye)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Tahmini Koli Sayısı
                </label>
                <input
                  type="number"
                  min={0}
                  value={boxesCount}
                  onChange={(e) => setBoxesCount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-700 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Beyaz Eşya Detayları
              </label>
              <input
                type="text"
                value={whiteGoods}
                onChange={(e) => setWhiteGoods(e.target.value)}
                placeholder="Örn: Buzdolabı, Çamaşır makinesi, Bulaşık makinesi, Kurutma makinesi"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Kırılacak Hassas Eşyalar
              </label>
              <input
                type="text"
                value={fragileItems}
                onChange={(e) => setFragileItems(e.target.value)}
                placeholder="Örn: Mutfak porselenleri, Cam dolaplar, Avizeler"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-800"
              />
            </div>

            {/* İnteraktif Eşya Listesi ve Hacim Hesaplama Cetveli */}
            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Eşya Seçim Cetveli & Hacim Hesaplama</h4>
                  <p className="text-[10px] text-slate-500">Seçtiğiniz eşyalara göre tahmini hacim hesaplanır ve en uygun araç önerilir.</p>
                </div>
                <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" /> Akıllı Cetvel
                </span>
              </div>

              {/* Category tabs */}
              <div className="flex bg-white p-1 rounded-xl border border-slate-100 gap-1">
                {(["Mobilya", "Beyaz Eşya", "Kutu/Diğer"] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCalculatorCategory(cat)}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                      calculatorCategory === cat
                        ? "bg-slate-900 text-white"
                        : "text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {cat === "Mobilya" ? "🛋️ Mobilya" : cat === "Beyaz Eşya" ? "🔌 Beyaz Eşya" : "📦 Kutu & Diğer"}
                  </button>
                ))}
              </div>

              {/* Items grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                {calculatorItems
                  .filter((item) => item.category === calculatorCategory)
                  .map((item) => (
                    <div key={item.id} className="bg-white p-2.5 rounded-xl border border-slate-100 flex items-center justify-between gap-2">
                      <div className="text-left">
                        <p className="text-[11px] font-bold text-slate-800 leading-tight">{item.name}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">Birim Hacim: {item.volume} m³</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAdjustCount(item.id, -1)}
                          className="w-6 h-6 rounded-lg bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100 font-bold text-xs flex items-center justify-center transition-all cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-4 text-center text-xs font-black text-slate-800">{item.count}</span>
                        <button
                          type="button"
                          onClick={() => handleAdjustCount(item.id, 1)}
                          className="w-6 h-6 rounded-lg bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100 font-bold text-xs flex items-center justify-center transition-all cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Summary with recommended vehicle */}
              <div className="bg-white p-3 rounded-2xl border border-slate-150 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tahmini Toplam Hacim</span>
                    {totalVolumeM3 > 0 && (
                      <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 font-extrabold rounded text-[9px]">{totalVolumeM3} m³</span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1">
                    <Truck className="w-4 h-4 text-slate-600" />
                    Önerilen Araç: <span className="text-blue-600 font-extrabold">{getRecommendedVehicle(totalVolumeM3)}</span>
                  </p>
                </div>
                {totalVolumeM3 > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setCalculatorItems(prev => prev.map(i => ({ ...i, count: 0 })));
                    }}
                    className="text-[9px] text-red-500 hover:text-red-700 font-bold cursor-pointer underline shrink-0"
                  >
                    Seçimleri Sıfırla
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Büyük Mobilya Listesi (Opsiyonel)
              </label>
              <textarea
                rows={3}
                value={furnitureList}
                onChange={(e) => setFurnitureList(e.target.value)}
                placeholder="Yukarıdaki cetvelde olmayan diğer gardırop, masa, koltuk gibi büyük mobilyaları buraya virgülle ayırarak yazabilirsiniz."
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-800 resize-none"
              />
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-slate-700">Ekstra Hizmet ve Özel Eşyalar</h4>
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={assemblyRequired}
                    onChange={(e) => setAssemblyRequired(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Montaj (Kurulum) Dahil
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={disassemblyRequired}
                    onChange={(e) => setDisassemblyRequired(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Demontaj (Söküm) Dahil
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={packingRequired}
                    onChange={(e) => setPackingRequired(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Eşya Paketleme & Sarma
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={storageRequired}
                    onChange={(e) => setStorageRequired(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Geçici Depolama İstiyorum
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={hasPiano}
                    onChange={(e) => setHasPiano(e.target.checked)}
                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  />
                  Piyano Taşıma
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={hasSafe}
                    onChange={(e) => setHasSafe(e.target.checked)}
                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  />
                  Çelik Para Kasası Taşıma
                </label>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Nakliyeci İçin Ek Notlar
              </label>
              <textarea
                rows={3}
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Örn: Binaya büyük kamyon girebilir, sokak dar veya ekstra hassas taşınacak değerli biblolarımız var."
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-800 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Right Side: AI Assistant Calculator & Actions */}
        <div className="lg:col-span-5 space-y-6">
          {/* AI Estimate Card */}
          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/10">
                <Sparkles className="w-3.5 h-3.5" />
                Gemini AI Asistanı
              </span>
              <button
                type="button"
                onClick={fetchAIPricing}
                disabled={aiLoading}
                className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-all flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-lg cursor-pointer"
              >
                {aiLoading ? "Hesaplanıyor..." : "Hesapla / Güncelle"}
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-200">Akıllı Fiyat Analizi</h3>
              <p className="text-xs text-slate-400">
                Girdiğiniz katlar, mesafe ve hizmet detaylarına göre tahmini piyasa fiyatını öğrenin.
              </p>
            </div>

            {aiLoading && (
              <div className="py-8 text-center space-y-3">
                <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-400 font-medium">Gemini 2.5 veri analiz ediliyor...</p>
              </div>
            )}

            {aiError && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[11px] text-rose-300">
                {aiError}
              </div>
            )}

            {!aiLoading && !aiPrice && !aiError && (
              <div className="py-6 text-center bg-white/5 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2">
                <HelpCircle className="w-8 h-8 text-slate-500" />
                <p className="text-xs text-slate-300 font-semibold">Fiyat tahmini almak için tıklayın</p>
                <button
                  type="button"
                  onClick={fetchAIPricing}
                  className="mt-1 px-4 py-1.5 bg-blue-600 text-white font-bold text-[10px] rounded-lg hover:bg-blue-500 transition-all cursor-pointer shadow-sm"
                >
                  Yapay Zeka Analizini Başlat
                </button>
              </div>
            )}

            {aiPrice && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col items-center justify-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Öngörülen Piyasa Değeri</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-white">₺{aiPrice.min.toLocaleString("tr-TR")}</span>
                    <span className="text-slate-500 font-bold text-sm">-</span>
                    <span className="text-2xl font-black text-emerald-400">₺{aiPrice.max.toLocaleString("tr-TR")}</span>
                  </div>
                  <p className="text-[9px] text-slate-500 font-medium mt-1">Sektör standartları ve iş hacmi analizi</p>
                </div>

                <div className="text-xs text-slate-300 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5 space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-blue-400" /> Hesaplama Gerekçesi
                  </h4>
                  <p className="text-[11px] text-slate-300">{aiPrice.reasoning}</p>
                </div>
              </div>
            )}
          </div>

          {/* Visibility and Save Actions */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Yayınlama Ayarları</h3>

            <div className="space-y-3.5">
              <label className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  checked={visibility === "PUBLIC"}
                  onChange={() => setVisibility("PUBLIC")}
                  className="mt-0.5 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Herkese Açık Yayınla</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Tüm profesyonel nakliyat firmaları talebi görebilir ve size teklif verebilir.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  checked={visibility === "PRIVATE"}
                  onChange={() => setVisibility("PRIVATE")}
                  className="mt-0.5 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-slate-800">Gizli Yayınla</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Sadece sizin doğrudan teklif istediğiniz veya seçtiğiniz firmalar talebi görür.
                  </p>
                </div>
              </label>

              {visibility === "PRIVATE" && (
                <div className="mt-2.5 p-4 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                    TEKLİF ALMAK İSTEDİĞİNİZ FİRMAYI SEÇİN
                  </label>
                  
                  {workedWithCompanies.length > 0 ? (
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-slate-500 font-bold">Önceki İş Ortaklarınız (Tercih Edilen):</p>
                      <select
                        required
                        value={selectedPrivateCompanyId}
                        onChange={(e) => {
                          const cid = e.target.value;
                          setSelectedPrivateCompanyId(cid);
                          const comp = workedWithCompanies.find((c) => c.id === cid) || allCompanies.find((c) => c.id === cid);
                          setSelectedPrivateCompanyName(comp ? comp.name : "");
                        }}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 text-slate-700 font-medium"
                      >
                        <option value="">İş Yaptığınız Bir Firma Seçin</option>
                        {workedWithCompanies.map((c) => (
                          <option key={`worked-col-${c.id}`} value={c.id}>
                            {c.name} ({c.averageRating ? `${c.averageRating}★` : "5★"})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 font-medium">
                      * Daha önce iş yaptığınız bir firma bulunamadı. Sistemdeki aktif profesyonel firmalardan birini seçebilirsiniz:
                    </p>
                  )}

                  <div className="space-y-1.5">
                    <p className="text-[10px] text-slate-500 font-bold">Sistemdeki Diğer Firmalar:</p>
                    <select
                      required={workedWithCompanies.length === 0}
                      value={selectedPrivateCompanyId}
                      onChange={(e) => {
                        const cid = e.target.value;
                        setSelectedPrivateCompanyId(cid);
                        const comp = allCompanies.find((c) => c.id === cid);
                        setSelectedPrivateCompanyName(comp ? comp.name : "");
                      }}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 text-slate-700 font-medium"
                    >
                      <option value="">Sistemden Bir Firma Seçin</option>
                      {allCompanies.map((c) => (
                        <option key={`other-col-${c.id}`} value={c.id}>
                          {c.name} ({c.averageRating ? `${c.averageRating}★` : "5★"}) - {c.workingCities?.slice(0, 3).join(", ") || "Tüm Türkiye"}
                        </option>
                      ))}
                    </select>
                    {allCompanies.length === 0 && (
                      <p className="text-[10px] text-amber-600 font-medium animate-pulse">
                        Sistemdeki firmalar yükleniyor... lütfen bekleyin.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-3 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
              >
                İptal Et
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-slate-950 text-white font-bold text-xs rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {loading ? "Yayınlanıyor..." : "Talebi Yayınla"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
