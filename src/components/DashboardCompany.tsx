import React, { useState, useEffect } from "react";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { recalculateUserRating } from "../utils/ratingUtils";
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
  addDoc,
  getDoc,
  deleteDoc,
  getDocs
} from "firebase/firestore";
import { MovingRequest, Offer, UserProfile, CompanyVehicle, Review, Announcement, SiteSettings, QuickBidTemplate } from "../types";
import {
  Briefcase,
  Layers,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  MessageSquare,
  CheckCircle,
  Truck,
  Plus,
  Trash2,
  Sliders,
  Award,
  BookOpen,
  Eye,
  Settings,
  Star,
  Users,
  AlertCircle,
  ShieldAlert,
  Send,
  Megaphone,
  X
} from "lucide-react";

interface DashboardCompanyProps {
  user: UserProfile;
  onOpenChat: (chatId: string, opponentName: string, requestTitle: string) => void;
  activeSubTab?: string;
  setActiveSubTab?: (tab: string) => void;
  siteSettings?: SiteSettings;
}

export default function DashboardCompany({
  user,
  onOpenChat,
  activeSubTab: propActiveSubTab,
  setActiveSubTab: propSetActiveSubTab,
  siteSettings
}: DashboardCompanyProps) {
  const [requests, setRequests] = useState<MovingRequest[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [myWrittenReviews, setMyWrittenReviews] = useState<Review[]>([]);
  const [myJobs, setMyJobs] = useState<MovingRequest[]>([]);

  // Review & Appeal states
  const [reviewingCustomerJob, setReviewingCustomerJob] = useState<MovingRequest | null>(null);
  const [customerRating, setCustomerRating] = useState<number>(5);
  const [customerComment, setCustomerComment] = useState<string>("");
  const [appealingReview, setAppealingReview] = useState<Review | null>(null);
  const [appealExplanation, setAppealExplanation] = useState<string>("");

  // Subtabs: browse, submitted_offers, active_jobs, profile_settings, reports
  const [localActiveSubTab, setLocalActiveSubTab] = useState("browse");
  const activeSubTab = propActiveSubTab !== undefined ? propActiveSubTab : localActiveSubTab;
  const setActiveSubTab = propSetActiveSubTab !== undefined ? propSetActiveSubTab : setLocalActiveSubTab;

  // Filter criteria for browsing requests
  const [cityFilter, setCityFilter] = useState("");
  const [roomFilter, setRoomFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [maxDistanceFilter, setMaxDistanceFilter] = useState<number>(0); // 0 = no limit
  const [elevatorFilter, setElevatorFilter] = useState<"all" | "pickup" | "destination" | "both">("all");
  const [minVolumeFilter, setMinVolumeFilter] = useState<number>(0);

  // Bidding states
  const [biddingRequest, setBiddingRequest] = useState<MovingRequest | null>(null);
  const [price, setPrice] = useState<number>(3500);
  const [estDurationDays, setEstDurationDays] = useState<number>(1);
  const [availableDate, setAvailableDate] = useState("");
  const [notes, setNotes] = useState("");
  const [assignedStaff, setAssignedStaff] = useState<number>(3);
  const [selectedVehicle, setSelectedVehicle] = useState("10 Teker Kapalı Kasa Nakliyat Kamyonu");

  // Predefined Quick Bid Templates States
  const [templates, setTemplates] = useState<QuickBidTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [newTemplateTitle, setNewTemplateTitle] = useState("");
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<QuickBidTemplate | null>(null);

  // States for creating/editing template in the dedicated tab
  const [tabTmplTitle, setTabTmplTitle] = useState("");
  const [tabTmplPrice, setTabTmplPrice] = useState<number>(3500);
  const [tabTmplDuration, setTabTmplDuration] = useState<number>(1);
  const [tabTmplStaff, setTabTmplStaff] = useState<number>(3);
  const [tabTmplVehicle, setTabTmplVehicle] = useState("Kapalı Kasa Evden Eve Nakliyat Kamyonu (Orta Boy)");
  const [tabTmplNotes, setTabTmplNotes] = useState("");

  // Profile Customization state
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [description, setDescription] = useState(user.description || "");
  const [taxNumber, setTaxNumber] = useState(user.taxNumber || "");
  const [taxOffice, setTaxOffice] = useState(user.taxOffice || "");
  const [workingCities, setWorkingCities] = useState(user.workingCities?.join(", ") || "İstanbul");
  const [vehicles, setVehicles] = useState<CompanyVehicle[]>(user.vehicles || []);

  // New vehicle form
  const [vType, setVType] = useState("Kamyonet (Küçük Boy)");
  const [vCapacity, setVCapacity] = useState("3.5 Ton");
  const [vPlate, setVPlate] = useState("34 ABC 123");

  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Load Marketplace Requests & My Offers
  useEffect(() => {
    setLoading(true);

    // 1. Listen to all pending public moving requests
    const qReqs = query(collection(db, "moving_requests"), where("status", "==", "PENDING"));
    const unsubReqs = onSnapshot(qReqs, (snapshot) => {
      const list: MovingRequest[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as MovingRequest);
      });
      // Sort newest
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRequests(list);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "moving_requests_pending");
    });

    // 2. Listen to my submitted offers
    const qOffers = query(collection(db, "offers"), where("companyId", "==", user.id));
    const unsubOffers = onSnapshot(qOffers, (snapshot) => {
      const list: Offer[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Offer);
      });
      setOffers(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `offers_company_${user.id}`);
    });

    // 3. Listen to reviews about me
    const qReviews = query(collection(db, "reviews"), where("targetId", "==", user.id));
    const unsubReviews = onSnapshot(qReviews, (snapshot) => {
      const list: Review[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Review);
      });
      setReviews(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `reviews_company_${user.id}`);
    });

    // 4. Listen to my accepted/completed jobs
    const qMyJobs = query(collection(db, "moving_requests"), where("acceptedCompanyId", "==", user.id));
    const unsubMyJobs = onSnapshot(qMyJobs, (snapshot) => {
      const list: MovingRequest[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as MovingRequest);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMyJobs(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `my_jobs_company_${user.id}`);
    });

    // 5. Listen to reviews written by me to correctly disable Evaluate button
    const qMyWrittenReviews = query(collection(db, "reviews"), where("reviewerId", "==", user.id));
    const unsubMyWrittenReviews = onSnapshot(qMyWrittenReviews, (snapshot) => {
      const list: Review[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Review);
      });
      setMyWrittenReviews(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `my_written_reviews_company_${user.id}`);
    });

    // 6. Listen to Announcements
    const unsubscribeAnnouncements = onSnapshot(collection(db, "announcements"), (snapshot) => {
      const list: Announcement[] = [];
      const now = new Date();
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const expiresAt = d.expiresAt ? new Date(d.expiresAt) : null;
        if (!expiresAt || expiresAt > now) {
          if (d.target === "ALL" || d.target === "COMPANIES") {
            list.push({ id: docSnap.id, ...d } as Announcement);
          }
        }
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAnnouncements(list);
    }, (error) => {
      console.error("Error listening to announcements in company dashboard:", error);
    });

    return () => {
      unsubReqs();
      unsubOffers();
      unsubReviews();
      unsubMyJobs();
      unsubMyWrittenReviews();
      unsubscribeAnnouncements();
    };
  }, [user.id]);

  // Subscription to Quick Bid Templates
  useEffect(() => {
    const qTmpl = query(collection(db, "quick_bid_templates"), where("companyId", "==", user.id));
    const unsubTmpl = onSnapshot(qTmpl, (snapshot) => {
      const list: QuickBidTemplate[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as QuickBidTemplate);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTemplates(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `quick_bid_templates_${user.id}`);
    });
    return () => {
      unsubTmpl();
    };
  }, [user.id]);

  // Create or Update a template
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tabTmplTitle.trim()) {
      alert("Lütfen şablon için bir başlık girin.");
      return;
    }

    try {
      if (editingTemplate) {
        await updateDoc(doc(db, "quick_bid_templates", editingTemplate.id), {
          title: tabTmplTitle.trim(),
          price: Number(tabTmplPrice),
          estDurationDays: Number(tabTmplDuration),
          assignedStaff: Number(tabTmplStaff),
          vehicleType: tabTmplVehicle,
          notes: tabTmplNotes.trim(),
        });
        setEditingTemplate(null);
      } else {
        const newTmpl: Omit<QuickBidTemplate, "id"> = {
          companyId: user.id,
          title: tabTmplTitle.trim(),
          price: Number(tabTmplPrice),
          estDurationDays: Number(tabTmplDuration),
          assignedStaff: Number(tabTmplStaff),
          vehicleType: tabTmplVehicle,
          notes: tabTmplNotes.trim(),
          createdAt: new Date().toISOString(),
        };
        await addDoc(collection(db, "quick_bid_templates"), newTmpl);
      }

      setTabTmplTitle("");
      setTabTmplPrice(3500);
      setTabTmplDuration(1);
      setTabTmplStaff(3);
      setTabTmplVehicle("Kapalı Kasa Evden Eve Nakliyat Kamyonu (Orta Boy)");
      setTabTmplNotes("");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "quick_bid_templates");
    }
  };

  // Delete a template
  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Bu şablonu silmek istediğinize emin misiniz?")) return;
    try {
      await deleteDoc(doc(db, "quick_bid_templates", id));
      if (editingTemplate?.id === id) {
        setEditingTemplate(null);
        setTabTmplTitle("");
        setTabTmplPrice(3500);
        setTabTmplDuration(1);
        setTabTmplStaff(3);
        setTabTmplVehicle("Kapalı Kasa Evden Eve Nakliyat Kamyonu (Orta Boy)");
        setTabTmplNotes("");
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `quick_bid_templates/${id}`);
    }
  };

  // Quick action: Save current bid from modal as a new template
  const handleSaveCurrentAsTemplate = async () => {
    if (!newTemplateTitle.trim()) {
      alert("Lütfen şablon için bir başlık girin.");
      return;
    }

    try {
      const newTmpl: Omit<QuickBidTemplate, "id"> = {
        companyId: user.id,
        title: newTemplateTitle.trim(),
        price: Number(price),
        estDurationDays: Number(estDurationDays),
        assignedStaff: Number(assignedStaff),
        vehicleType: selectedVehicle,
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
      };
      await addDoc(collection(db, "quick_bid_templates"), newTmpl);
      setNewTemplateTitle("");
      setShowSaveTemplateModal(false);
      alert("Mevcut teklifiniz başarıyla yeni şablon olarak kaydedildi!");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "quick_bid_templates");
    }
  };

  const startEditTemplate = (tmpl: QuickBidTemplate) => {
    setEditingTemplate(tmpl);
    setTabTmplTitle(tmpl.title);
    setTabTmplPrice(tmpl.price);
    setTabTmplDuration(tmpl.estDurationDays);
    setTabTmplStaff(tmpl.assignedStaff);
    setTabTmplVehicle(tmpl.vehicleType);
    setTabTmplNotes(tmpl.notes);
  };

  // Actions
  const handleAddVehicle = () => {
    if (!vPlate.trim()) return;
    const newList = [...vehicles, { type: vType, capacity: vCapacity, licensePlate: vPlate }];
    setVehicles(newList);
    setVPlate("");
  };

  const handleRemoveVehicle = (index: number) => {
    const newList = vehicles.filter((_, i) => i !== index);
    setVehicles(newList);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "users", user.id), {
        name,
        phone,
        description,
        taxNumber,
        taxOffice,
        vehicles,
        workingCities: workingCities.split(",").map((c) => c.trim())
      });
      alert("Şirket profil ayarlarınız başarıyla güncellendi.");
    } catch (err) {
      console.error(err);
      alert("Profil kaydedilirken hata oluştu.");
    }
  };

  const handleUpdateStage = async (jobId: string, stage: "PREPARING" | "EN_ROUTE" | "LOADING" | "TRANSIT" | "UNLOADING" | "COMPLETED") => {
    try {
      const foundJob = myJobs.find((j) => j.id === jobId);
      if (foundJob && foundJob.status === "COMPLETED") {
        alert("Bu iş tamamlandığı için durumu değiştirilemez!");
        return;
      }

      const updateData: any = { currentStage: stage };
      if (stage === "COMPLETED") {
        updateData.status = "COMPLETED";
      } else {
        updateData.status = "OFFER_ACCEPTED";
      }
      await updateDoc(doc(db, "moving_requests", jobId), updateData);

      if (foundJob) {
        let stageName = "";
        switch (stage) {
          case "PREPARING": stageName = "Hazırlanıyor / Paketleme"; break;
          case "EN_ROUTE": stageName = "Araç Yolda"; break;
          case "LOADING": stageName = "Yükleme Yapılıyor"; break;
          case "TRANSIT": stageName = "Seyir Halinde"; break;
          case "UNLOADING": stageName = "Boşaltılıyor / Kurulum"; break;
          case "COMPLETED": stageName = "Taşıma Tamamlandı"; break;
        }
        await addDoc(collection(db, "notifications"), {
          userId: foundJob.customerId,
          title: "Taşınma Durumu Güncellendi!",
          body: `Taşınma işleminizin yeni durumu: ${stageName}. Canlı takip panelinizden takip edebilirsiniz.`,
          createdAt: new Date().toISOString(),
          requestId: jobId,
          read: false
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `moving_requests_stage_${jobId}`);
    }
  };

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!biddingRequest) return;

    if (!availableDate) {
      alert("Lütfen taşımayı gerçekleştirebileceğiniz bir tarih seçin.");
      return;
    }

    try {
      const newOffer: Omit<Offer, "id"> = {
        requestId: biddingRequest.id,
        companyId: user.id,
        companyName: user.name,
        companyLogo: user.companyLogo || "",
        companyRating: user.averageRating || 5.0,
        price: Number(price),
        estimatedDurationDays: Number(estDurationDays),
        availableDate,
        notes,
        validityPeriodDays: 3,
        vehicleType: selectedVehicle,
        assignedStaffCount: Number(assignedStaff),
        status: "PENDING",
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, "offers"), newOffer);

      // Notify customer
      await addDoc(collection(db, "notifications"), {
        userId: biddingRequest.customerId,
        title: "Yeni Fiyat Teklifi Alındı!",
        body: `${user.name} firması ${biddingRequest.pickupAddress.split(",")[0]} talebinize ₺${price.toLocaleString("tr-TR")} fiyat teklifi verdi.`,
        type: "OFFER_RECEIVED",
        requestId: biddingRequest.id,
        read: false,
        createdAt: new Date().toISOString()
      });

      alert("Teklifiniz müşteriye başarıyla iletildi. Müşteri onayladığında size haber vereceğiz.");
      setBiddingRequest(null);
      setNotes("");
    } catch (err) {
      console.error(err);
      alert("Teklif iletilirken bir hata oluştu.");
    }
  };

  const handleWithdrawOffer = async (offerId: string) => {
    if (!confirm("Teklifinizi geri çekmek istediğinize emin misiniz?")) return;
    try {
      await deleteDoc(doc(db, "offers", offerId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendCustomerReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingCustomerJob) return;

    try {
      const reviewData: Omit<Review, "id"> = {
        requestId: reviewingCustomerJob.id,
        reviewerId: user.id,
        reviewerName: user.name,
        targetId: reviewingCustomerJob.customerId,
        rating: customerRating,
        comment: customerComment,
        reviewerRole: "MOVING_COMPANY",
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, "reviews"), reviewData);
      await recalculateUserRating(reviewingCustomerJob.customerId);

      // Notify customer
      await addDoc(collection(db, "notifications"), {
        userId: reviewingCustomerJob.customerId,
        title: "Nakliyeci Sizi Değerlendirdi!",
        body: `${user.name} firması size ${customerRating} yıldız verdi: "${customerComment.slice(0, 40)}..."`,
        type: "REVIEW_REMINDER",
        requestId: reviewingCustomerJob.id,
        read: false,
        createdAt: new Date().toISOString()
      });

      alert("Müşteri değerlendirmeniz başarıyla kaydedildi!");
      setReviewingCustomerJob(null);
      setCustomerComment("");
      setCustomerRating(5);
    } catch (err) {
      console.error("Müşteri değerlendirilirken hata oluştu:", err);
      alert("Değerlendirme gönderilirken hata oluştu.");
    }
  };

  const handleSendAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealingReview) return;

    try {
      await updateDoc(doc(db, "reviews", appealingReview.id), {
        isAppealed: true,
        appealExplanation: appealExplanation,
        appealStatus: "PENDING",
        isTransparent: true
      });

      await recalculateUserRating(appealingReview.targetId);

      // Notify Admin
      await addDoc(collection(db, "notifications"), {
        userId: "admin_notifications",
        title: "Yeni Değerlendirme İtirazı!",
        body: `${user.name} isimli kullanıcı bir değerlendirmeye itiraz etti: "${appealExplanation.slice(0, 40)}..."`,
        type: "SYSTEM_UPDATE",
        requestId: appealingReview.requestId,
        read: false,
        createdAt: new Date().toISOString()
      });

      alert("İtiraz talebi başarıyla iletildi. Değerlendirme inceleme süresince dış gözlemcilere kapatılmıştır.");
      setAppealingReview(null);
      setAppealExplanation("");
    } catch (err) {
      console.error("İtiraz gönderilirken hata oluştu:", err);
      alert("İtiraz iletilirken bir hata oluştu.");
    }
  };

  // Smart Matching Recommendation Engine
  const getMatchScore = (req: MovingRequest) => {
    let score = 0;
    let reasons: string[] = [];

    // 1. Service Area Match (30 pts)
    const pickupLower = req.pickupAddress.toLowerCase();
    const destLower = req.destinationAddress.toLowerCase();
    
    // Check user's working cities
    const workingCities = user.workingCities || [];
    const hasCityMatch = workingCities.some(city => 
      pickupLower.includes(city.toLowerCase()) || destLower.includes(city.toLowerCase())
    );

    if (hasCityMatch) {
      score += 30;
      reasons.push("hizmet ilinizde bulunuyor");
    }

    // 2. Distance Match (25 pts)
    // Check if intercity based on request houseType or text containing 'şehirler arası' / difference in cities
    const pickupParts = req.pickupAddress.split(",");
    const destParts = req.destinationAddress.split(",");
    const pickupCity = pickupParts[pickupParts.length - 1]?.trim().toLowerCase() || "";
    const destCity = destParts[destParts.length - 1]?.trim().toLowerCase() || "";
    const isIntercityRequest = pickupCity !== destCity || req.houseType === "intercity_part" || (req.distanceKm && req.distanceKm > 80);
    
    if (isIntercityRequest && user.isIntercity) {
      score += 25;
      reasons.push("şehirler arası sevkiyat tercihinize tam uygun");
    } else if (!isIntercityRequest && user.isIntracity) {
      score += 25;
      reasons.push("şehir içi sevkiyat tercihinize tam uygun");
    } else {
      score += 10; // partial/flexible distance match
    }

    // 3. Capacity & Vehicle Match (25 pts)
    const vehicleType = (user.vehicleType || "").toLowerCase();
    const capacityKg = Number(user.vehicleCapacityKg || 1000);
    const reqType = req.houseType;

    if (reqType === "single_item" || reqType === "intracity_light") {
      // Small requests: best for vans, pickups, station wagons, etc.
      if (["panelvan", "kamyonet", "minibüs", "sedan", "hatchback", "station wagon"].includes(vehicleType)) {
        score += 25;
        reasons.push("hafif yük için ideal araç tipine sahipsiniz");
      } else {
        score += 15;
        reasons.push("büyük aracınız bu yük için kullanılabilir");
      }
    } else if (["3+1", "4+1", "villa", "factory", "warehouse", "machinery"].includes(reqType)) {
      // Large requests: best for heavy trucks or high capacity
      if (capacityKg >= 3000 || ["kamyon", "tır", "kapalı kasa", "açık kasa"].includes(vehicleType)) {
        score += 25;
        reasons.push("yüksek hacimli sevkiyat için aracınız tam uygun");
      } else {
        score += 5;
        reasons.push("yük miktarı aracınız için fazla olabilir");
      }
    } else {
      // Medium requests like 1+1, 2+1, Ofis
      if (["kamyonet", "kamyon", "panelvan", "kapalı kasa"].includes(vehicleType)) {
        score += 25;
        reasons.push("orta büyüklükte ev/ofis nakliyesi için tam uygun");
      } else {
        score += 15;
        reasons.push("araç boyutunuz bu yükle eşleştirildi");
      }
    }

    // 4. Rating Match (20 pts)
    const carrierRating = user.averageRating || 5.0;
    const ratingScore = Math.round(carrierRating * 4); // 5.0 rating = 20 pts
    score += ratingScore;
    if (carrierRating >= 4.5) {
      reasons.push("yüksek memnuniyet puanınız öne çıkıyor");
    }

    return {
      score: Math.min(score, 100),
      reason: reasons.slice(0, 2).join(" ve ")
    };
  };

  const getFriendlyHouseType = (type: string) => {
    switch (type) {
      case "single_item": return "Tek Parça / Az Eşya";
      case "1+1": return "1+1 Küçük Daire";
      case "2+1": return "2+1 Standart Daire";
      case "3+1": return "3+1 Geniş Daire";
      case "4+1": return "4+1 Çok Geniş Daire";
      case "Villa": return "Müstakil / Villa";
      case "Ofis": return "Ofis / Büro Nakliyesi";
      case "factory": return "Fabrika / Endüstriyel Tesis";
      case "warehouse": return "Depo Sevkiyatı";
      case "commercial": return "Ticari / Paletli Yük";
      case "furniture_delivery": return "Mobilya Mağaza Teslimat";
      case "construction": return "İnşaat Malzemesi";
      case "machinery": return "Ağır Makine / Ekipman";
      case "intercity_part": return "Şehirler Arası Parsiyel";
      case "intracity_light": return "Şehir İçi Hafif Nakliye";
      default: return type;
    }
  };

  // Filter & score logic
  const scoredRequests = requests
    .map((req) => {
      const match = getMatchScore(req);
      return { 
        ...req, 
        matchScore: match.score, 
        matchReason: match.reason.charAt(0).toUpperCase() + match.reason.slice(1)
      };
    })
    .filter((req) => {
      // Visibility Privacy Filter for Private Requests
      if (req.visibility === "PRIVATE" && req.privateCompanyId !== user.id) {
        return false;
      }

      // Filter by company's active working cities
      const companyCities = user.workingCities || [];
      if (companyCities.length > 0) {
        const matchesCoverage = companyCities.some((city) => 
          req.pickupAddress.toLowerCase().includes(city.toLowerCase()) ||
          req.destinationAddress.toLowerCase().includes(city.toLowerCase())
        );
        if (!matchesCoverage) return false;
      }

      if (cityFilter && !req.pickupAddress.toLowerCase().includes(cityFilter.toLowerCase())) return false;
      if (roomFilter && req.houseType !== roomFilter) return false;

      // Advanced Filters
      if (searchQuery) {
        const queryLower = searchQuery.toLowerCase();
        const addressMatch = req.pickupAddress.toLowerCase().includes(queryLower) || req.destinationAddress.toLowerCase().includes(queryLower);
        const notesMatch = req.additionalNotes?.toLowerCase().includes(queryLower);
        const goodsMatch = req.whiteGoods?.toLowerCase().includes(queryLower) || req.fragileItems?.toLowerCase().includes(queryLower);
        const furnitureMatch = req.furnitureList?.some(item => item.toLowerCase().includes(queryLower));
        if (!addressMatch && !notesMatch && !goodsMatch && !furnitureMatch) return false;
      }

      if (maxDistanceFilter > 0 && req.distanceKm && req.distanceKm > maxDistanceFilter) return false;

      if (elevatorFilter === "pickup" && !req.hasElevatorPickup) return false;
      if (elevatorFilter === "destination" && !req.hasElevatorDestination) return false;
      if (elevatorFilter === "both" && (!req.hasElevatorPickup || !req.hasElevatorDestination)) return false;

      if (minVolumeFilter > 0 && req.calculatedVolume && req.calculatedVolume < minVolumeFilter) return false;

      return true;
    });

  // Sort by match score in descending order (highest recommended at top)
  const filteredRequests = [...scoredRequests].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

  // Calculate earnings
  const acceptedOffers = offers.filter((o) => o.status === "ACCEPTED");
  const totalEarnings = acceptedOffers.reduce((sum, o) => sum + o.price, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900">
            {siteSettings?.companyDashboardWelcomeText || "Firma Taşıma Portalı"}
          </h2>
          <p className="text-xs text-slate-500">
            {siteSettings?.companyDashboardSub || "Müşteri taşıma taleplerine teklif gönderin, onaylanan taşınmalarınızı takip edin."}
          </p>
        </div>
      </div>

      {/* Header Stat Panel */}
      <div className="bg-slate-900 rounded-3xl p-6 text-white grid grid-cols-1 md:grid-cols-4 gap-6 shadow-sm">
        <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hizmet Puanı</p>
          <div className="flex items-center gap-2 mt-1">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            <span className="text-xl font-black">{user.averageRating || 5.0}</span>
          </div>
          <p className="text-[9px] text-slate-500 mt-1">{user.ratingsCount || 0} Değerlendirme</p>
        </div>

        <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tamamlanan İşler</p>
          <div className="flex items-center gap-2 mt-1">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="text-xl font-black">{user.completedJobs || 0} Taşınma</span>
          </div>
          <p className="text-[9px] text-slate-500 mt-1">Müşteri onaylı operasyonlar</p>
        </div>

        <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Verilen Teklifler</p>
          <div className="flex items-center gap-2 mt-1">
            <Briefcase className="w-5 h-5 text-blue-400" />
            <span className="text-xl font-black">{offers.length} Teklif</span>
          </div>
          <p className="text-[9px] text-slate-500 mt-1">{offers.filter((o) => o.status === "PENDING").length} aktif teklif</p>
        </div>

        <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Toplam Kazanç</p>
          <div className="flex items-center gap-2 mt-1">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <span className="text-xl font-black text-emerald-400">₺{totalEarnings.toLocaleString("tr-TR")}</span>
          </div>
          <p className="text-[9px] text-slate-500 mt-1">KDV dahil brüt tutar</p>
        </div>
      </div>

      {/* Dynamic Announcements System */}
      {announcements.filter(ann => localStorage.getItem(`dismiss_ann_${ann.id}`) !== "true").length > 0 && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-orange-500 animate-pulse" />
              Sistem Duyuruları & Kampanyalar
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {announcements
              .filter(ann => localStorage.getItem(`dismiss_ann_${ann.id}`) !== "true")
              .map((ann) => {
                return (
                  <div
                    key={ann.id}
                    className="p-5 rounded-3xl border border-slate-100/50 relative shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                    style={{
                      backgroundColor: ann.bgColor || "#f8fafc",
                      color: ann.textColor || "#1e293b"
                    }}
                  >
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between gap-2">
                        {ann.badgeText && (
                          <span
                            className="text-[8px] font-extrabold px-2 py-0.5 rounded-md text-white uppercase tracking-wider shadow-sm"
                            style={{ backgroundColor: ann.badgeColor || "#3b82f6" }}
                          >
                            {ann.badgeText}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            localStorage.setItem(`dismiss_ann_${ann.id}`, "true");
                            setAnnouncements((prev) => prev.filter((a) => a.id !== ann.id));
                          }}
                          className="text-[10px] font-bold opacity-60 hover:opacity-100 bg-white/40 hover:bg-white/80 p-1 rounded-full transition-all cursor-pointer"
                          title="Duyuruyu Kapat"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Title */}
                      <h4
                        className={`text-xs font-bold leading-snug ${
                          ann.fontFamily === "serif"
                            ? "font-serif text-sm"
                            : ann.fontFamily === "mono"
                            ? "font-mono"
                            : "font-sans font-display"
                        }`}
                      >
                        {ann.title}
                      </h4>

                      {/* Image */}
                      {ann.imageUrl && (
                        <div className="overflow-hidden rounded-xl border border-black/5 bg-white/40 aspect-[16/9] flex items-center justify-center">
                          <img
                            src={ann.imageUrl}
                            alt={ann.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                          />
                        </div>
                      )}

                      {/* Content */}
                      <p
                        className={`text-[11px] leading-relaxed opacity-90 ${
                          ann.fontFamily === "serif"
                            ? "font-serif"
                            : ann.fontFamily === "mono"
                            ? "font-mono"
                            : "font-sans font-light"
                        }`}
                      >
                        {ann.content.length > 150 ? (
                          <>
                            {ann.content.slice(0, 150)}...
                            <button
                              type="button"
                              onClick={() => {
                                alert(`${ann.title}\n\n${ann.content}`);
                              }}
                              className="text-[10px] font-bold ml-1 hover:underline cursor-pointer block mt-1"
                            >
                              Devamını Oku
                            </button>
                          </>
                        ) : (
                          ann.content
                        )}
                      </p>
                    </div>

                    <div className="pt-2 mt-3 border-t border-current/10 flex justify-between items-center text-[8px] opacity-60">
                      <span>Yayın: {new Date(ann.createdAt).toLocaleDateString("tr-TR")}</span>
                      {ann.expiresAt && (
                        <span>Bitiş: {new Date(ann.expiresAt).toLocaleDateString("tr-TR")}</span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Subtab Control Header */}
      <div className="flex border-b border-slate-100 gap-6 overflow-x-auto whitespace-nowrap">
        <button
          onClick={() => setActiveSubTab("browse")}
          className={`pb-4 text-xs font-bold transition-all relative cursor-pointer ${
            activeSubTab === "browse" ? "text-slate-950" : "text-slate-400 hover:text-slate-700"
          }`}
        >
          {activeSubTab === "browse" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded" />}
          Yeni Talepleri Keşfet
        </button>

        <button
          onClick={() => setActiveSubTab("submitted_offers")}
          className={`pb-4 text-xs font-bold transition-all relative cursor-pointer ${
            activeSubTab === "submitted_offers" ? "text-slate-950" : "text-slate-400 hover:text-slate-700"
          }`}
        >
          {activeSubTab === "submitted_offers" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded" />}
          Tekliflerim ({offers.filter((o) => requests.some((r) => r.id === o.requestId)).length})
        </button>

        <button
          onClick={() => setActiveSubTab("accepted_jobs")}
          className={`pb-4 text-xs font-bold transition-all relative cursor-pointer ${
            activeSubTab === "accepted_jobs" ? "text-slate-950" : "text-slate-400 hover:text-slate-700"
          }`}
        >
          {activeSubTab === "accepted_jobs" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded" />}
          Onaylanan İşlerim ({myJobs.length})
        </button>

        <button
          onClick={() => setActiveSubTab("received_reviews")}
          className={`pb-4 text-xs font-bold transition-all relative cursor-pointer ${
            activeSubTab === "received_reviews" ? "text-slate-950" : "text-slate-400 hover:text-slate-700"
          }`}
        >
          {activeSubTab === "received_reviews" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded" />}
          Gelen Değerlendirmeler ({reviews.length})
        </button>

        <button
          onClick={() => setActiveSubTab("profile_settings")}
          className={`pb-4 text-xs font-bold transition-all relative cursor-pointer ${
            activeSubTab === "profile_settings" ? "text-slate-950" : "text-slate-400 hover:text-slate-700"
          }`}
        >
          {activeSubTab === "profile_settings" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded" />}
          Firma & Araç Profili
        </button>

        <button
          onClick={() => setActiveSubTab("quick_bid_templates")}
          className={`pb-4 text-xs font-bold transition-all relative cursor-pointer ${
            activeSubTab === "quick_bid_templates" ? "text-slate-950" : "text-slate-400 hover:text-slate-700"
          }`}
        >
          {activeSubTab === "quick_bid_templates" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded" />}
          Teklif Şablonlarım ({templates.length})
        </button>
      </div>

      {/* SUBTAB 1: BROWSE REQUESTS */}
      {activeSubTab === "browse" && (
        <div className="space-y-6">
          {/* Advanced Filters Panel */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <span className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                <Sliders className="w-4 h-4 text-blue-600" /> Gelişmiş İlan Filtreleme & Arama
              </span>
              {(cityFilter || roomFilter || searchQuery || maxDistanceFilter > 0 || elevatorFilter !== "all" || minVolumeFilter > 0) && (
                <button
                  onClick={() => {
                    setCityFilter("");
                    setRoomFilter("");
                    setSearchQuery("");
                    setMaxDistanceFilter(0);
                    setElevatorFilter("all");
                    setMinVolumeFilter(0);
                  }}
                  className="text-[10px] text-red-500 hover:text-red-600 font-bold underline cursor-pointer"
                >
                  Filtreleri Temizle
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Keyword Search */}
              <div className="space-y-1 text-left">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Kelime Ara</label>
                <input
                  type="text"
                  placeholder="Eşya, not veya adres..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-700 font-medium"
                />
              </div>

              {/* City Filter */}
              <div className="space-y-1 text-left">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Şehir / İlçe</label>
                <input
                  type="text"
                  placeholder="Örn: İstanbul"
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-700 font-medium"
                />
              </div>

              {/* Room Count / House Type */}
              <div className="space-y-1 text-left">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Konut / Ev Tipi</label>
                <select
                  value={roomFilter}
                  onChange={(e) => setRoomFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-700 font-bold"
                >
                  <option value="">Tüm Tipler</option>
                  <option value="single_item">Tek Parça / Az Eşya</option>
                  <option value="1+1">1+1</option>
                  <option value="2+1">2+1</option>
                  <option value="3+1">3+1</option>
                  <option value="4+1">4+1</option>
                  <option value="Villa">Müstakil / Villa</option>
                  <option value="Ofis">Ofis / Büro</option>
                </select>
              </div>

              {/* Distance Filter */}
              <div className="space-y-1 text-left">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Mesafe Limiti</label>
                <select
                  value={maxDistanceFilter}
                  onChange={(e) => setMaxDistanceFilter(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-700 font-bold"
                >
                  <option value={0}>Tüm Mesafeler</option>
                  <option value={50}>Şehir İçi (&lt; 50 km)</option>
                  <option value={150}>Yarı Bölgesel (&lt; 150 km)</option>
                  <option value={400}>Bölgesel (&lt; 400 km)</option>
                  <option value={1000}>Uzun Yol (&lt; 1000 km)</option>
                </select>
              </div>

              {/* Elevator Filter */}
              <div className="space-y-1 text-left">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Asansör Şartı</label>
                <select
                  value={elevatorFilter}
                  onChange={(e) => setElevatorFilter(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-700 font-bold"
                >
                  <option value="all">Asansör Fark Etmez</option>
                  <option value="pickup">Yüklemede Asansör Olsun</option>
                  <option value="destination">Teslimatta Asansör Olsun</option>
                  <option value="both">Her İki Uçta da Olsun</option>
                </select>
              </div>

              {/* Volume Filter */}
              <div className="space-y-1 text-left">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Minimum Hacim (m³)</label>
                <select
                  value={minVolumeFilter}
                  onChange={(e) => setMinVolumeFilter(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-700 font-bold"
                >
                  <option value={0}>Tüm Hacimler</option>
                  <option value={5}>Parça Eşya Üstü (&gt; 5 m³)</option>
                  <option value={15}>1+1 Ev Üstü (&gt; 15 m³)</option>
                  <option value={30}>2+1 Ev Üstü (&gt; 30 m³)</option>
                  <option value={45}>Büyük Ev Üstü (&gt; 45 m³)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Requests Grid */}
          {filteredRequests.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-slate-100 text-slate-400 text-xs">
              Kriterlerinize uygun yeni taşıma talebi bulunamadı.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredRequests.map((req) => {
                const alreadyBidded = offers.some((o) => o.requestId === req.id);

                return (
                  <div key={req.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-slate-400 font-mono">#{req.id.slice(0, 6).toUpperCase()}</span>
                        {alreadyBidded && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-bold rounded">
                            Teklif Verildi
                          </span>
                        )}
                      </div>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded">
                        {getFriendlyHouseType(req.houseType)}
                      </span>
                    </div>

                    {/* Smart Match Recommendation System */}
                    {req.matchScore !== undefined && (
                      <div className={`p-2.5 rounded-2xl flex items-center gap-2 text-xs border ${
                        req.matchScore >= 80 
                          ? "bg-emerald-50/50 border-emerald-100 text-emerald-800"
                          : req.matchScore >= 50
                            ? "bg-blue-50/50 border-blue-100 text-blue-800"
                            : "bg-slate-50 border-slate-100 text-slate-600"
                      }`}>
                        <span className={`px-1.5 py-0.5 rounded-lg text-[10px] font-black shrink-0 ${
                          req.matchScore >= 80 
                            ? "bg-emerald-500 text-white"
                            : req.matchScore >= 50
                              ? "bg-blue-500 text-white"
                              : "bg-slate-400 text-white"
                        }`}>
                          %{req.matchScore} Öneri Uyumlu
                        </span>
                        <span className="text-[10px] font-bold text-slate-600 leading-tight">
                          {req.matchReason || "Kısmi eşleşme sağlandı"}
                        </span>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-[10px] font-bold text-blue-700 shrink-0 mt-0.5">A</span>
                        <p className="text-xs font-semibold text-slate-700">{req.pickupAddress}</p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-[10px] font-bold text-emerald-700 shrink-0 mt-0.5">B</span>
                        <p className="text-xs font-semibold text-slate-700">{req.destinationAddress}</p>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl grid grid-cols-2 gap-3 text-[10px] font-semibold text-slate-600">
                      <div>
                        <span className="text-[8px] text-slate-400 uppercase tracking-widest block">Taşınma Tarihi</span>
                        <span className="text-slate-800">{new Date(req.estimatedDate).toLocaleDateString("tr-TR")}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 uppercase tracking-widest block">Kat Durumu</span>
                        <span className="text-slate-800">{req.pickupFloor}. Kattan ➜ {req.destinationFloor}. Kat</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 uppercase tracking-widest block">Yükleme Asansör</span>
                        <span className="text-slate-800">{req.hasElevatorPickup ? "Var" : "Yok"}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 uppercase tracking-widest block">Eşya Paketleme</span>
                        <span className="text-slate-800">{req.packingRequired ? "İsteniyor" : "Hayır"}</span>
                      </div>
                    </div>

                    {req.additionalNotes && (
                      <p className="text-[11px] text-slate-500 italic line-clamp-2 bg-slate-50 p-2 rounded-xl">
                        "{req.additionalNotes}"
                      </p>
                    )}

                    <div className="flex gap-2.5 pt-2">
                      <button
                        onClick={() => onOpenChat(`${req.id}_${user.id}`, req.customerName, req.pickupAddress.split(",")[0])}
                        className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4 text-slate-500" /> Soru Sor
                      </button>
                      {!alreadyBidded && (
                        <button
                          onClick={() => setBiddingRequest(req)}
                          className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          Fiyat Teklifi Ver
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: MY SUBMITTED OFFERS */}
      {activeSubTab === "submitted_offers" && (
        <div className="space-y-4">
          {offers.filter((o) => requests.some((r) => r.id === o.requestId)).length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-slate-100 text-slate-400 text-xs">
              Henüz gönderilmiş aktif bir teklifiniz bulunmuyor.
            </div>
          ) : (
            <div className="space-y-4">
              {offers
                .filter((o) => requests.some((r) => r.id === o.requestId))
                .map((offer) => {
                  const associatedRequest = requests.find((r) => r.id === offer.requestId)!;

                  return (
                    <div key={offer.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-slate-400 font-mono">TEKLİF: #{offer.id.slice(0, 6).toUpperCase()}</span>
                        {offer.status === "PENDING" && (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-bold rounded">
                            Onay Bekliyor
                          </span>
                        )}
                        {offer.status === "ACCEPTED" && (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded">
                            Kabul Edildi!
                          </span>
                        )}
                        {offer.status === "REJECTED" && (
                          <span className="px-2 py-0.5 bg-rose-50 text-rose-700 text-[9px] font-bold rounded">
                            Reddedildi
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-800">
                        Güzergah: {associatedRequest ? associatedRequest.pickupAddress.split(",")[0] : "Taşıma Talebi"}
                      </h4>
                      <p className="text-[10px] text-slate-400">Teklif Tarihi: {new Date(offer.createdAt).toLocaleDateString("tr-TR")}</p>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <span className="text-lg font-black text-slate-950">₺{offer.price.toLocaleString("tr-TR")}</span>
                        <p className="text-[9px] text-slate-400">Atanan Personel: {offer.assignedStaff} Kişi</p>
                      </div>

                      <div className="flex gap-2">
                        {associatedRequest && (
                          <button
                            onClick={() => onOpenChat(`${offer.requestId}_${user.id}`, associatedRequest.customerName, associatedRequest.pickupAddress.split(",")[0])}
                            className="p-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center cursor-pointer"
                            title="Sohbet Aç"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        )}
                        {offer.status === "PENDING" && (
                          <button
                            onClick={() => handleWithdrawOffer(offer.id)}
                            className="p-2 border border-rose-100 text-rose-600 rounded-xl hover:bg-rose-50 transition-all flex items-center justify-center cursor-pointer"
                            title="Teklifi Geri Çek"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB: ONAYLANAN İŞLERİM */}
      {activeSubTab === "accepted_jobs" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900">Onaylanan Taşınma İşleriniz</h3>
            <p className="text-xs text-slate-400 mt-0.5">Müşterilerin teklifinizi kabul ettiği ve taşınma aşamasına geçen tüm operasyonların listesi.</p>
          </div>

          {myJobs.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-slate-100 text-slate-400 text-xs">
              Henüz onaylanmış veya tamamlanmış bir işiniz bulunmamaktadır.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {myJobs.map((job) => {
                const isCompleted = job.status === "COMPLETED";
                const hasReviewedCustomer = myWrittenReviews.some(
                  (r) => r.requestId === job.id && r.reviewerId === user.id && r.reviewerRole === "MOVING_COMPANY"
                );

                return (
                  <div key={job.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-50 pb-3">
                      <div>
                        <span className="text-xs font-bold text-slate-400">İş Kimliği: #{job.id.slice(0, 8).toUpperCase()}</span>
                        <h4 className="text-sm font-black text-slate-900 mt-0.5">{job.customerName || "Müşteri"}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        {isCompleted ? (
                          <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Taşıma Tamamlandı
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full flex items-center gap-1 animate-pulse">
                            <Truck className="w-3 h-3" /> {
                              job.currentStage === "PREPARING" ? "Hazırlanıyor / Paketleme" :
                              job.currentStage === "EN_ROUTE" ? "Araç Yolda" :
                              job.currentStage === "LOADING" ? "Yükleme Yapılıyor" :
                              job.currentStage === "TRANSIT" ? "Seyir Halinde" :
                              job.currentStage === "UNLOADING" ? "Boşaltılıyor / Kurulum" :
                              "Teklif Kabul Edildi (Taşıma Bekleniyor)"
                            }
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-2">
                        <p className="text-slate-600">
                          <strong className="text-slate-900 font-bold">Nereden:</strong> {job.pickupAddress}
                        </p>
                        <p className="text-slate-600">
                          <strong className="text-slate-900 font-bold">Nereye:</strong> {job.destinationAddress}
                        </p>
                        <p className="text-slate-600">
                          <strong className="text-slate-900 font-bold">Taşınma Tarihi:</strong> {job.estimatedDate} ({job.preferredTime || "Gün boyu"})
                        </p>
                      </div>

                      <div className="space-y-1 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-slate-500">
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">İş ve İletişim Detayları</p>
                        <p className="text-slate-700 font-medium">Telefon: <span className="font-bold text-slate-900">{job.customerPhone || "Teklif kabulü sonrası görünür"}</span></p>
                        <p className="text-slate-700 font-medium">Hacim / Katlar: {job.houseType} (Yükleme: {job.pickupFloor}. Kat / Teslimat: {job.destinationFloor}. Kat)</p>
                        {job.additionalNotes && (
                          <p className="text-[11px] italic mt-1 text-slate-500">Not: "{job.additionalNotes}"</p>
                        )}
                      </div>
                    </div>

                    {/* Live Tracking Stages / Stepper for Carrier */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CANLI TAŞIMA AŞAMASI (Tek Tıkla Güncelleyin)</span>
                        {isCompleted ? (
                          <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md flex items-center gap-1 border border-blue-100 animate-pulse">
                            🔒 İş Kilitlendi (Değiştirilemez)
                          </span>
                        ) : (
                          <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                            Müşteri canlı olarak görüyor ⚡
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                        {[
                          { value: "PREPARING", label: "Hazırlık / Paket", icon: "📦" },
                          { value: "EN_ROUTE", label: "Araç Yolda", icon: "🚛" },
                          { value: "LOADING", label: "Yükleniyor", icon: "💪" },
                          { value: "TRANSIT", label: "Seyir Halinde", icon: "🛣️" },
                          { value: "UNLOADING", label: "Boşaltma/Kurulum", icon: "🏠" },
                          { value: "COMPLETED", label: "Tamamlandı", icon: "✅" }
                        ].map((st) => {
                          const isCurrent = (job.currentStage || "PREPARING") === st.value;
                          const isCompletedStage = isCompleted || (
                            st.value === "PREPARING" ||
                            (st.value === "EN_ROUTE" && job.currentStage !== "PREPARING") ||
                            (st.value === "LOADING" && !["PREPARING", "EN_ROUTE"].includes(job.currentStage || "")) ||
                            (st.value === "TRANSIT" && !["PREPARING", "EN_ROUTE", "LOADING"].includes(job.currentStage || "")) ||
                            (st.value === "UNLOADING" && !["PREPARING", "EN_ROUTE", "LOADING", "TRANSIT"].includes(job.currentStage || ""))
                          );

                          return (
                            <button
                              key={st.value}
                              type="button"
                              disabled={isCompleted}
                              onClick={() => handleUpdateStage(job.id, st.value as any)}
                              className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                                isCompleted
                                  ? "opacity-75 cursor-not-allowed"
                                  : "cursor-pointer"
                              } ${
                                isCurrent
                                  ? "bg-slate-900 border-slate-950 text-white shadow-sm ring-1 ring-slate-900 font-bold"
                                  : isCompletedStage
                                  ? `bg-blue-50/70 border-blue-100 text-blue-800 font-semibold ${!isCompleted ? 'hover:bg-blue-100' : ''}`
                                  : `bg-white border-slate-200 text-slate-500 ${!isCompleted ? 'hover:border-slate-400 hover:text-slate-700' : ''}`
                              }`}
                            >
                              <span className="text-sm">{st.icon}</span>
                              <span className="text-[9px] leading-tight">{st.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => onOpenChat(`${job.id}_${user.id}`, job.customerName || "Müşteri", job.pickupAddress.split(",")[0])}
                        className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Mesaj Gönder / Sohbet Aç
                      </button>

                      {isCompleted && (
                        hasReviewedCustomer ? (
                          <span className="px-4 py-2 bg-slate-100 text-slate-500 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-slate-200">
                            <CheckCircle className="w-3.5 h-3.5 text-slate-400" /> Müşteriyi Değerlendirdiniz
                          </span>
                        ) : (
                          <button
                            onClick={() => setReviewingCustomerJob(job)}
                            className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-500 transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Star className="w-3.5 h-3.5 fill-white" /> Müşteriyi Değerlendir
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB: GELEN DEĞERLENDİRMELER */}
      {activeSubTab === "received_reviews" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Müşteri Değerlendirmeleriniz</h3>
              <p className="text-xs text-slate-400 mt-0.5">Müşterilerinizin taşınma sonrasında firmanız hakkında yaptığı yorumlar ve verdiği puanlar.</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-bold text-amber-800">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>Ortalama Puan: {user.averageRating || "5.0"} ({reviews.length} Yorum)</span>
            </div>
          </div>

          {reviews.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-slate-100 text-slate-400 text-xs">
              Henüz bir değerlendirme almadınız. İşleri tamamladıkça yorumlar burada listelenecektir.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {reviews.map((rev) => {
                const isAppealPending = rev.appealStatus === "PENDING";
                const isAppealApproved = rev.appealStatus === "APPROVED" || rev.isDeleted;
                const isAppealRejected = rev.appealStatus === "REJECTED";

                return (
                  <div
                    key={rev.id}
                    className={`bg-white p-5 rounded-3xl border shadow-xs space-y-3 transition-all ${
                      isAppealApproved
                        ? "border-rose-200 bg-rose-50/20"
                        : isAppealPending
                        ? "border-amber-200 opacity-60 bg-amber-50/5"
                        : "border-slate-100"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
                          {rev.reviewerName?.slice(0, 2).toUpperCase() || "MU"}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-slate-900">{rev.reviewerName || "Müşteri"}</h4>
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-bold rounded">Müşteri</span>
                          </div>
                          <span className="text-[10px] text-slate-400">{new Date(rev.createdAt || "").toLocaleDateString("tr-TR")}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              rev.rating >= s ? "fill-amber-400 text-amber-400" : "text-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {rev.comment}
                    </p>

                    {/* Appeal Status Badges & Descriptions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-50 text-[10px]">
                      <div className="flex gap-2">
                        {isAppealApproved && (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-extrabold rounded-md uppercase tracking-wider">
                            Değerlendirme Silindi
                          </span>
                        )}
                        {isAppealPending && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-extrabold rounded-md uppercase tracking-wider animate-pulse">
                            İtiraz Edildi - İnceleniyor
                          </span>
                        )}
                        {isAppealRejected && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-md">
                            İtiraz Reddedildi: "{rev.appealAdminNote || "Kurallara uygun bulundu"}"
                          </span>
                        )}
                      </div>

                      {/* Appeal Trigger Button */}
                      {!rev.isAppealed && !isAppealApproved && !isAppealPending && (
                        <button
                          onClick={() => setAppealingReview(rev)}
                          className="px-2.5 py-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-100 rounded-lg transition-all font-bold cursor-pointer"
                        >
                          Değerlendirmeye İtiraz Et (Bildir)
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: PROFILE SETTINGS */}
      {activeSubTab === "profile_settings" && (
        <form onSubmit={handleSaveProfile} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-sm font-bold text-slate-900">Kurumsal Profil & Araç Bilgileri</h3>
            <p className="text-xs text-slate-400">Müşterilere görüntülenecek vergi, tanıtım ve araç kapasitesi alanları.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Şirket Adı</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Telefon</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Hizmet Verilen İller</label>
                <input
                  type="text"
                  required
                  value={workingCities}
                  onChange={(e) => setWorkingCities(e.target.value)}
                  placeholder="İstanbul, Ankara, İzmir"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Vergi No</label>
                  <input
                    type="text"
                    required
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Vergi Dairesi</label>
                  <input
                    type="text"
                    required
                    value={taxOffice}
                    onChange={(e) => setTaxOffice(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Firma Tanıtım Açıklaması</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Araç filonuzdan, paketleme standartlarınızdan ve deneyimlerinizden bahsedin..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none resize-none"
                />
              </div>

              {/* Vehicles customization */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Truck className="w-4 h-4 text-slate-500" /> Araç Filosu Yönetimi
                </h4>

                {vehicles.length === 0 ? (
                  <p className="text-[10px] text-slate-400">Henüz bir araç tanımlanmadı.</p>
                ) : (
                  <div className="space-y-2">
                    {vehicles.map((v, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs bg-white p-2 border border-slate-100 rounded-xl">
                        <div>
                          <p className="font-bold text-slate-800">{v.type}</p>
                          <p className="text-[9px] text-slate-400">Plaka: {v.licensePlate} | Kapasite: {v.capacity}</p>
                        </div>
                        <button type="button" onClick={() => handleRemoveVehicle(idx)} className="text-rose-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add vehicle line */}
                <div className="pt-2 border-t border-slate-200/50 space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Plaka"
                      value={vPlate}
                      onChange={(e) => setVPlate(e.target.value)}
                      className="px-2 py-1.5 text-[10px] bg-white border border-slate-200 rounded"
                    />
                    <select
                      value={vType}
                      onChange={(e) => setVType(e.target.value)}
                      className="px-2 py-1.5 text-[10px] bg-white border border-slate-200 rounded"
                    >
                      <option>Kamyonet (Küçük)</option>
                      <option>10 Teker (Orta)</option>
                      <option>Kırkayak (Büyük)</option>
                      <option>TIR Kapalı Kasa</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Tonaj"
                      value={vCapacity}
                      onChange={(e) => setVCapacity(e.target.value)}
                      className="px-2 py-1.5 text-[10px] bg-white border border-slate-200 rounded"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddVehicle}
                    className="w-full py-1.5 bg-slate-900 text-white font-bold text-[10px] rounded flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Listeye Araç Ekle
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-slate-950 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
          >
            Profil Ayarlarını Kaydet
          </button>
        </form>
      )}

      {/* SUBTAB 4: QUICK BID TEMPLATES */}
      {activeSubTab === "quick_bid_templates" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-slate-800">
          {/* Left: Template Creator Form */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6 self-start">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-sm font-bold text-slate-900">
                {editingTemplate ? "Şablonu Güncelle" : "Yeni Teklif Şablonu Oluştur"}
              </h3>
              <p className="text-xs text-slate-400">
                {editingTemplate
                  ? "Seçili şablonun tüm değerlerini güncelleyin."
                  : "Sık kullandığınız fiyat ve açıklama setini kaydedin."}
              </p>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Şablon Başlığı</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: 2+1 Şehir İçi Paket"
                  value={tabTmplTitle}
                  onChange={(e) => setTabTmplTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-800 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Varsayılan Fiyat (₺)</label>
                  <input
                    type="number"
                    required
                    min={500}
                    value={tabTmplPrice}
                    onChange={(e) => setTabTmplPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Varsayılan Süre (Gün)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={tabTmplDuration}
                    onChange={(e) => setTabTmplDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Atanacak Eleman</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={tabTmplStaff}
                    onChange={(e) => setTabTmplStaff(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Araç Tipi</label>
                  <select
                    value={tabTmplVehicle}
                    onChange={(e) => setTabTmplVehicle(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-bold text-slate-700"
                  >
                    <option>10 Teker Kapalı Kasa Nakliyat Kamyonu</option>
                    <option>Kamyonet Kapalı Kasa (Küçük Eşyalar İçin)</option>
                    <option>Kırkayak Evden Eve Nakliyat Kamyonu (Büyük Boy)</option>
                    <option>TIR Kapalı Kasa (Geniş Dubleks/Villa İçin)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Teklif Açıklaması / Notlar</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Mobilyaların de/montajı ve ambalajlanması dahildir. Taşıma asansörlü gerçekleştirilecektir vb..."
                  value={tabTmplNotes}
                  onChange={(e) => setTabTmplNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none resize-none text-slate-700"
                />
              </div>

              <div className="flex gap-2 pt-2">
                {editingTemplate && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTemplate(null);
                      setTabTmplTitle("");
                      setTabTmplPrice(3500);
                      setTabTmplDuration(1);
                      setTabTmplStaff(3);
                      setTabTmplVehicle("Kapalı Kasa Evden Eve Nakliyat Kamyonu (Orta Boy)");
                      setTabTmplNotes("");
                    }}
                    className="flex-1 py-2 text-xs font-bold border border-slate-200 text-slate-700 rounded-xl cursor-pointer"
                  >
                    Vazgeç
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-all shadow-sm cursor-pointer"
                >
                  {editingTemplate ? "Şablonu Güncelle" : "Şablonu Kaydet"}
                </button>
              </div>
            </form>
          </div>

          {/* Right: Existing Templates List */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Kayıtlı Teklif Şablonlarım</h3>
                <p className="text-xs text-slate-400">Hızlı teklif ekranında tek tıkla seçip uygulayabileceğiniz hazır paketler.</p>
              </div>
              <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg">
                ⚡ Toplam {templates.length} Şablon
              </span>
            </div>

            {templates.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-3">
                <Layers className="w-8 h-8 text-slate-300 mx-auto animate-pulse" />
                <p className="text-xs font-bold text-slate-600">Henüz Tanımlı Şablon Yok</p>
                <p className="text-[10px] max-w-sm mx-auto text-slate-400">
                  Sol taraftaki formu doldurarak veya yeni teklif verirken &quot;Şablon Olarak Kaydet&quot; seçeneğini kullanarak ilk şablonunuzu ekleyebilirsiniz.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
                {templates.map((tmpl) => (
                  <div key={tmpl.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 hover:border-slate-200 transition-all text-left flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-black text-slate-900">{tmpl.title}</h4>
                          <span className="inline-block text-[9px] font-extrabold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                            ₺{tmpl.price.toLocaleString("tr-TR")}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => startEditTemplate(tmpl)}
                            className="p-1 hover:bg-slate-200/60 text-slate-400 hover:text-slate-800 rounded transition-all cursor-pointer"
                            title="Şablonu Düzenle"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(tmpl.id)}
                            className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-all cursor-pointer"
                            title="Şablonu Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 py-2 border-t border-b border-slate-200/40 my-2 text-[10px]">
                        <div>
                          <p className="text-[8px] font-bold text-slate-400 uppercase">Süre</p>
                          <p className="font-semibold text-slate-700">{tmpl.estDurationDays} Gün</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-slate-400 uppercase">Eleman</p>
                          <p className="font-semibold text-slate-700">{tmpl.assignedStaff} Personel</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[8px] font-bold text-slate-400 uppercase">Araç</p>
                          <p className="font-semibold text-slate-700 truncate">{tmpl.vehicleType}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase">Notlar / Açıklama</p>
                      <p className="text-[10px] text-slate-600 bg-white p-2 rounded-xl border border-slate-100 mt-1 line-clamp-3">
                        {tmpl.notes}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* BIDDING DIALOG MODAL */}
      {biddingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold font-display text-slate-900">Teklif Ver: #{biddingRequest.id.slice(0, 6).toUpperCase()}</h3>
            <p className="text-xs text-slate-400">
              Müşteri Güzergahı: {biddingRequest.pickupAddress.split(",")[0]} ➜ {biddingRequest.destinationAddress.split(",")[0]}
            </p>

            {/* Quick Template Selector */}
            {templates.length > 0 && (
              <div className="bg-blue-50/50 p-3.5 rounded-2xl border border-blue-100 flex items-center justify-between gap-3 text-left">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-black text-blue-700 uppercase tracking-wide">Şablonla Hızlı Doldur</p>
                  <p className="text-[9px] text-slate-400">Teklif detaylarını şablondan aktarın.</p>
                </div>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedTemplateId(id);
                    if (id) {
                      const found = templates.find((t) => t.id === id);
                      if (found) {
                        setPrice(found.price);
                        setEstDurationDays(found.estDurationDays);
                        setAssignedStaff(found.assignedStaff);
                        setSelectedVehicle(found.vehicleType);
                        setNotes(found.notes);
                      }
                    }
                  }}
                  className="px-3 py-1.5 text-xs bg-white border border-blue-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-400 font-bold text-blue-800 cursor-pointer"
                >
                  <option value="">Şablon Seçin...</option>
                  {templates.map((tmpl) => (
                    <option key={tmpl.id} value={tmpl.id}>
                      {tmpl.title} (₺{tmpl.price})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <form onSubmit={handleCreateOffer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Teklif Fiyatı (₺)</label>
                  <input
                    type="number"
                    required
                    min={500}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Planlanan Taşıma Tarihi</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    value={availableDate}
                    onChange={(e) => setAvailableDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tahmini Süre (Gün)</label>
                  <input
                    type="number"
                    min={1}
                    value={estDurationDays}
                    onChange={(e) => setEstDurationDays(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Atanacak Eleman Sayısı</label>
                  <input
                    type="number"
                    min={1}
                    value={assignedStaff}
                    onChange={(e) => setAssignedStaff(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kullanılacak Araç Tipi</label>
                <select
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option>Kapalı Kasa Evden Eve Nakliyat Kamyonu (Orta Boy)</option>
                  <option>Kamyonet Kapalı Kasa (Küçük Eşyalar İçin)</option>
                  <option>Kırkayak Evden Eve Nakliyat Kamyonu (Büyük Boy)</option>
                  <option>TIR Kapalı Kasa (Geniş Dubleks/Villa İçin)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Müşteriye Özel Notlar</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Örn: Mobilyaların demontaj ve montajı fiyata dahildir. Eşyalar patpat balonlarla sarılacaktır."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-between text-xs pb-1 px-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[9px] text-slate-500 font-bold">Bu bilgileri yeni bir şablon olarak kaydetmek ister misiniz?</span>
                <button
                  type="button"
                  onClick={() => {
                    setNewTemplateTitle("");
                    setShowSaveTemplateModal(true);
                  }}
                  className="text-[10px] text-blue-600 hover:text-blue-700 font-black underline cursor-pointer"
                >
                  Yeni Şablon Kaydet
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBiddingRequest(null)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  İptal Et
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-all"
                >
                  Teklifi Gönder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TEKLİFİ ŞABLON OLARAK KAYDET */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">Teklifi Şablon Olarak Kaydet</h4>
              <button onClick={() => setShowSaveTemplateModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              Mevcut fiyat (₺{price}), süre ({estDurationDays} gün), eleman ({assignedStaff}) ve notları hızlıca kullanmak için bu şablona açıklayıcı bir isim verin.
            </p>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Şablon Başlığı</label>
              <input
                type="text"
                placeholder="Örn: 2+1 Şehir İçi Hızlı Teklif"
                value={newTemplateTitle}
                onChange={(e) => setNewTemplateTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-400 font-bold text-slate-800"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSaveTemplateModal(false)}
                className="flex-1 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleSaveCurrentAsTemplate}
                className="flex-1 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-500 transition-all cursor-pointer"
              >
                Şablonu Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MÜŞTERİYİ DEĞERLENDİR */}
      {reviewingCustomerJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold font-display text-slate-900">Müşteriyi Değerlendirin</h3>
            <p className="text-xs text-slate-400">
              #{reviewingCustomerJob.id.slice(0, 8).toUpperCase()} taşınma işi tamamlandı. Müşterinin tutumu, hazırlığı ve iletişimi hakkında puan verin.
            </p>

            <form onSubmit={handleSendCustomerReview} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Müşteri Puanı</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setCustomerRating(star)}
                      className="p-1 rounded hover:bg-slate-50 transition-all text-amber-400 cursor-pointer"
                    >
                      <Star className={`w-7 h-7 ${customerRating >= star ? "fill-amber-400" : "text-slate-200"}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Yorumunuz</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Müşterinin eşyaları zamanında paketlemesi, bina kurallarına uyumu ve ödeme kolaylığı hakkında yorumlarınızı yazın..."
                  value={customerComment}
                  onChange={(e) => setCustomerComment(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewingCustomerJob(null)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Sonra Yap
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-500 transition-all"
                >
                  Değerlendirmeyi Gönder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DEĞERLENDİRMEYE İTİRAZ ET */}
      {appealingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold font-display text-slate-900">Değerlendirmeye İtiraz Et</h3>
            <p className="text-xs text-slate-400">
              Bu değerlendirme ve yorumun gerçek dışı olduğunu veya haksız yapıldığını düşünüyorsanız, gerekçenizi yazarak yönetici onayına gönderebilirsiniz.
            </p>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs text-slate-600">
              <p className="font-bold">Müşteri Yorumu:</p>
              <p className="italic mt-1">"{appealingReview.comment}"</p>
            </div>

            <form onSubmit={handleSendAppeal} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">İtiraz Gerekçeniz</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Yorumun neden silinmesi gerektiğini açıklayın. (Eşyalar hasarsız teslim edildi, kanıtlar mevcuttur vb.)"
                  value={appealExplanation}
                  onChange={(e) => setAppealExplanation(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAppealingReview(null)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-500 transition-all flex items-center justify-center gap-1.5"
                >
                  <ShieldAlert className="w-4 h-4" /> İtiraz Talebini Gönder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
