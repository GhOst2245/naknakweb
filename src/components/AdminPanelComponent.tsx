import React, { useState, useEffect, useRef } from "react";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { recalculateUserRating } from "../utils/ratingUtils";
import { INITIAL_TURKISH_CITIES } from "../utils/cities";
import {  collection,
  onSnapshot,
  query,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  getDocs,
  where,
  setDoc
} from "firebase/firestore";
import {
  UserProfile,
  MovingRequest,
  Offer,
  Review,
  Complaint,
  Announcement,
  SiteSettings,
  BlogPost
} from "../types";
import DuckTruckLogo from "./DuckTruckLogo";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Legend
} from "recharts";
import {
  TrendingUp,
  Users,
  Truck,
  FileText,
  MessageSquare,
  AlertOctagon,
  Megaphone,
  Check,
  X,
  Shield,
  Clock,
  Briefcase,
  Layers,
  MapPin,
  Settings,
  Grid,
  BarChart2,
  Lock,
  ChevronRight,
  Filter,
  Search,
  CheckCircle,
  HelpCircle,
  Trash2,
  Mail,
  RefreshCw,
  Eye,
  Palette,
  Smartphone,
  Save,
  Compass,
  PlusCircle,
  User as UserIcon,
  Sparkles,
  Award,
  ShieldAlert,
  BookOpen
} from "lucide-react";

const compressImageToBase64 = (file: File, callback: (base64: string) => void) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = (event) => {
    const img = new Image();
    img.src = event.target?.result as string;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX_WIDTH = 800;
      let width = img.width;
      let height = img.height;

      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);
      callback(compressedDataUrl);
    };
  };
};

interface AdminPanelProps {
  user: UserProfile;
  onClose: () => void;
  setParentSiteSettings?: React.Dispatch<React.SetStateAction<SiteSettings>>;
}

export default function AdminPanelComponent({ user, onClose, setParentSiteSettings }: AdminPanelProps) {
  // Tabs: dashboard, customers, companies, requests, offers, complaints, announcements, chats, settings, site_customizer
  const [activeTab, setActiveTab] = useState("dashboard");

  // Data state
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [companies, setCompanies] = useState<UserProfile[]>([]);
  const [requests, setRequests] = useState<MovingRequest[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  const isIncomingSnapshot = useRef(false);
  const prevSettingsRef = useRef<SiteSettings | null>(null);

  // Site customizer state
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    appName: "NakNak-Nakliye",
    appSlogan: "Güvenli ve Kolay Taşın! 🚚",
    heroTitle: "Tanıdığa gerek yok, herkes burada",
    heroDescription: "NakNak ile nakliyat talebinizi saniyeler içinde oluşturun. Türkiye'nin doğrulanmış en iyi nakliyat firmalarından rekabetçi teklifler alıp komisyonsuz, sigortalı ve güvenle taşının.",
    heroBadgeText: "Komisyonsuz NakNak Nakliyat Platformu 🚚",
    footerDescription: "Türkiye'nin öncü teklif usulü komisyonsuz evden eve nakliyat platformu. NakNak ile hızlı, stressiz ve sigortalı taşının! 🚚",
    logoType: "duck",
    customLogoUrl: "",
    primaryColor: "#EA580C",
    accentColor: "#0F172A",
    menuHomeText: "Ana Sayfa",
    menuDiscoverText: "Keşfet",
    menuCreateRequestText: "Talep Aç",
    menuDashboardText: "Panelim",
    menuChatsText: "Sohbet",
    menuProfileText: "Profilim",
    menuHowItWorksText: "Hizmet Nasıl Çalışır",
    menuFaqsText: "Sık Sorulan Sorular",
    menuBlogText: "Blog",
    menuPrivacyText: "Gizlilik & Koşullar",

    // Section visibility & texts
    showHeroSloganCard: true,
    heroSloganMain: "Nak Diye",
    heroSloganSub: "Taşının!",
    heroSloganFooterLeft: "TR GENELİ SEVKİYAT",
    heroSloganFooterRight: "KOLAY & GÜVENLİ",
    heroButtonRequestText: "Hemen Talep Oluştur",
    heroButtonDiscoverText: "Firmaları Keşfet",

    showStatsRow: false,
    statsMode: "real",
    showFirmsCount: true,
    customFirmsText: "500+",
    showTransfersCount: true,
    customTransfersText: "12k+",
    showSatisfactionRate: true,
    customSatisfactionText: "99.4%",

    showValuesSection: true,
    value1Title: "Doğrulanmış Firmalar",
    value1Desc: "Tüm teklif veren şirketler vergi levhası, yetki belgesi ve sürücü ehliyetleri yönünden admin ekibimizce kontrol edilir.",
    value2Title: "Aracısız & Komisyonsuz",
    value2Desc: "Online ödeme zorunluluğu yok! Ödemeyi doğrudan el sıkıştığınız firmaya yapın, gizli komisyonlardan kurtulun.",
    value3Title: "Gerçek Zamanlı Sohbet",
    value3Desc: "İletişime geçmek için telefon araması beklemeyin. Harita konumu, eşya fotoğrafları ve detayları sohbet üzerinden paylaşın.",

    showCarrierCTA: true,
    carrierCTABadge: "Nakliyat Firmaları İçin",
    carrierCTATitle: "Platformumuzda Yer Alarak İşlerinizi Büyütün",
    carrierCTADesc: "Her gün yüzlerce müşteri evden eve nakliye talebi açıyor. Komisyonsuz, doğrudan müşteriye teklif verin, harita üzerinden mesafe görün ve anında sohbet başlatın.",
    carrierCTAPrimaryBtn: "Hemen Ücretsiz Firma Kaydı Aç",
    carrierCTASecondaryBtn: "Firma Girişi Yap",

    // Page-specific default content
    howItWorksTitle: "Süreç Nasıl İşler?",
    howItWorksSub: "NakNak-Nakliye ile ev taşımak her zamankinden daha pratik, bütçeli ve güvenlidir.",
    howItWorksStep1Title: "Talep Oluşturun",
    howItWorksStep1Desc: "Eşya listesi, bina katı, asansör durumu ve tarih detaylarını girin. Haritadan konumları işaretleyin.",
    howItWorksStep2Title: "Teklifleri Karşılaştırın",
    howItWorksStep2Desc: "Doğrulanmış nakliyat firmalarından dakikalar içinde fiyat, personel sayısı ve araç tipi teklifleri alın.",
    howItWorksStep3Title: "Güvenle Taşının",
    howItWorksStep3Desc: "En uygun teklifi seçip anlaşın. Ödemeyi doğrudan nakliye firmasına elden veya havaleyle yapın.",

    discoverMoversTitle: "Profesyonel Nakliye Firmaları",
    discoverMoversSub: "Doğrulanmış, vergi mükellefi ve sigortalı evden eve taşımacılık uzmanları.",

    helpCenterTitle: "Yardım ve Destek Merkezi",
    helpCenterSub: "Sık sorulan soruları inceleyin veya destek ekibimizle iletişime geçin.",
    helpCenterContactTitle: "Bize Ulaşın",
    helpCenterContactDesc: "7/24 uyuşmazlık, şikayet ve destek işlemleri için mail veya telefon hattımızdan bize ulaşabilirsiniz.",
    helpCenterPhone: "0850 123 45 67",
    helpCenterEmail: "destek@nakliyepazaryeri.com",
    helpCenterAboutTitle: "Hakkımızda",
    helpCenterAboutDesc: "Türkiye'nin öncü evden eve taşıma platformu olarak, müşterilerimiz ile en prestijli, vergi levhalı nakliye firmalarını bir araya getirerek taşınma stresini ortadan kaldırıyoruz. Sektör kalitesini akıllı bütçe çözümleri ile destekliyoruz.",

    privacyTermsTitle: "Gizlilik Politikası ve Kullanım Koşulları",
    privacyTermsLastUpdated: "Son güncelleme: Haziran 2026",
    privacyTermsSection1: "1. Hizmet Kapsamı: NakNak-Nakliye, müşterilerin evden eve taşınma talepleri oluşturmasına ve bağımsız nakliyat şirketlerinin bu taleplere teklif vermesine olanak sağlayan bir aracı pazaryeri platformudur.",
    privacyTermsSection2: "2. Ödeme Koşulları: Platformumuz üzerinden kredi kartı veya sanal pos ile doğrudan online tahsilat yapılmamaktadır. Taraflar anlaşma sonrasında anlaştıkları fiyatı elden veya banka transferiyle doğrudan birbirlerine öder.",
    privacyTermsSection3: "3. Veri Güvenliği: Kullanıcıların iletişim bilgileri (telefon, e-posta vb.) sadece teklif kabul edildikten sonra veya karşılıklı sohbet esnasında güvenli rıza ile paylaşılır. Passwords and sensitive logs are fully encrypted using standard secure protocols.",

    blogTitle: "Ev Taşıma Rehberi & Blog",
    blogSub: "Doğru paketleme, nakliyeci seçimi ve taşınma tüyoları.",
    blog1Tag: "Tüyolar",
    blog1Title: "Yeni Eve Taşınırken Paketleme Nasıl Yapılmalı?",
    blog1Desc: "Kırılacak cam eşyaların patpat balona sarılması, tabakların dikey istiflenmesi ve kolilerin oda bazlı etiketlenmesi süreci %50 hızlandırır.",
    blog2Tag: "Güvenlik",
    blog2Title: "Doğru Nakliyat Firması Seçerken Nelere Dikkat Edilmeli?",
    blog2Desc: "Yetki belgesi, sigortalı taşımacılık şartları ve diğer müşterilerin doğrulanmış puan yorumları en doğru firma tercihini yapmanızı sağlar.",

    // General Button & Layout Styles
    bodyBgColor: "#f8fafc",
    cardBgColor: "#ffffff",
    buttonTextColor: "#ffffff",
    buttonRoundedness: "rounded-xl",
    fontFamily: "font-sans",

    // Create Request Page Customized Texts
    createRequestTitle: "Yeni Nakliyat Talebi Oluştur",
    createRequestSub: "Eşya ayrıntılarını belirtin, Türkiye'nin en iyi firmalarından ücretsiz teklif toplayın.",
    createRequestSubmitBtnText: "Talebi Yayınla & Teklifleri Topla 🚚",
    createRequestFormPickupLabel: "Nereden (Yükleme Konumu)",
    createRequestFormDestinationLabel: "Nereye (Teslimat Konumu)",
    createRequestFormRoomsLabel: "Oda Sayısı / Ev Tipi",
    createRequestFormFloorLabel: "Bina Katı",

    // Dashboards Customizable Buttons & Text
    dashboardCreateRequestBtnText: "Yeni Nakliyat Talebi Aç 🚚",
    dashboardViewOffersBtnText: "Gelen Teklifleri İncele",
    dashboardGiveOfferBtnText: "Müşteriye Teklif Ver",
    requestCancelBtnText: "Talebi İptal Et / Geri Çek"
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Image Edit / Crop states
  const [cropperModalOpen, setCropperModalOpen] = useState(false);
  const [cropperImageSrc, setCropperImageSrc] = useState<string>("");
  const [cropperZoom, setCropperZoom] = useState<number>(1);
  const [cropperRotation, setCropperRotation] = useState<number>(0);
  const [cropperOffsetX, setCropperOffsetX] = useState<number>(0);
  const [cropperOffsetY, setCropperOffsetY] = useState<number>(0);
  const [isDraggingCropper, setIsDraggingCropper] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropTarget, setCropTarget] = useState<"heroBackgroundImage" | "heroSliderImage1" | "heroSliderImage2" | null>(null);

  const handleFileSelectForCropping = (file: File, target: "heroBackgroundImage" | "heroSliderImage1" | "heroSliderImage2") => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setCropperImageSrc(e.target.result as string);
        setCropTarget(target);
        setCropperZoom(1);
        setCropperRotation(0);
        setCropperOffsetX(0);
        setCropperOffsetY(0);
        setCropperModalOpen(true);
      }
    };
    reader.readAsDataURL(file);
  };

  // Propagate site settings changes back to the parent instantly
  useEffect(() => {
    if (setParentSiteSettings) {
      setParentSiteSettings(siteSettings);
    }
  }, [siteSettings, setParentSiteSettings]);

  const [previewActiveTab, setPreviewActiveTab] = useState<"home" | "request_form" | "chats" | "dashboard" | "auth">("home");

  const [simHeroImgIndex, setSimHeroImgIndex] = useState(0);

  useEffect(() => {
    const intervalSeconds = siteSettings.heroSliderInterval || 5;
    const timer = setInterval(() => {
      setSimHeroImgIndex((prev) => (prev === 0 ? 1 : 0));
    }, intervalSeconds * 1000);
    return () => clearInterval(timer);
  }, [siteSettings.heroSliderInterval]);

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // New Announcement form
  const [newAnnTitle, setNewAnnTitle] = useState("");
  const [newAnnContent, setNewAnnContent] = useState("");
  const [newAnnTarget, setNewAnnTarget] = useState<"ALL" | "CUSTOMERS" | "COMPANIES">("ALL");
  const [newAnnImage, setNewAnnImage] = useState<string>("");
  const [newAnnDurationHours, setNewAnnDurationHours] = useState<number>(24);
  const [newAnnTextColor, setNewAnnTextColor] = useState<string>("#1e293b"); // slate-800
  const [newAnnBgColor, setNewAnnBgColor] = useState<string>("#f8fafc"); // slate-50
  const [newAnnFontFamily, setNewAnnFontFamily] = useState<string>("sans");
  const [newAnnBadgeText, setNewAnnBadgeText] = useState<string>("DUYURU");
  const [newAnnBadgeColor, setNewAnnBadgeColor] = useState<string>("#3b82f6"); // blue-500

  // Blog posts management states
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [blogFormTag, setBlogFormTag] = useState("Tüyolar");
  const [blogFormTitle, setBlogFormTitle] = useState("");
  const [blogFormContent, setBlogFormContent] = useState("");
  const [blogFormImageUrl, setBlogFormImageUrl] = useState("");
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);

  // Appeal moderation states
  const [rejectingAppealId, setRejectingAppealId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [approvingReview, setApprovingReview] = useState<Review | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleResetDatabase = async () => {
    setIsResetting(true);
    try {
      // 1. Clear users (except admin)
      const usersSnap = await getDocs(collection(db, "users"));
      for (const d of usersSnap.docs) {
        const data = d.data();
        if (data.email === "alibuyukuyar268@gmail.com") {
          // Ensure it keeps the ADMIN role
          if (data.role !== "ADMIN" || !data.isAdmin) {
            await setDoc(doc(db, "users", d.id), {
              ...data,
              role: "ADMIN",
              isAdmin: true
            }, { merge: true });
          }
        } else {
          await deleteDoc(doc(db, "users", d.id));
        }
      }

      // 2. Clear simple collections
      const simpleColls = [
        "moving_requests",
        "offers",
        "reviews",
        "complaints",
        "notifications",
        "announcements"
      ];
      for (const collName of simpleColls) {
        const snap = await getDocs(collection(db, collName));
        for (const d of snap.docs) {
          await deleteDoc(doc(db, collName, d.id));
        }
      }

      // 3. Clear chats and messages
      const chatsSnap = await getDocs(collection(db, "chats"));
      for (const chatDoc of chatsSnap.docs) {
        const msgsSnap = await getDocs(collection(db, "chats", chatDoc.id, "messages"));
        for (const msgDoc of msgsSnap.docs) {
          await deleteDoc(doc(db, "chats", chatDoc.id, "messages", msgDoc.id));
        }
        await deleteDoc(doc(db, "chats", chatDoc.id));
      }

      showToast("Sistem ve tüm veritabanı başarıyla sıfırlandı! Sayfa yenileniyor...", "success");
      setShowResetConfirm(false);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Database reset failed:", error);
      showToast("Sıfırlama işlemi başarısız oldu: " + (error instanceof Error ? error.message : String(error)), "error");
    } finally {
      setIsResetting(false);
    }
  };

  // Load Admin Data from Firestore
  useEffect(() => {
    setLoading(true);

    // Listen to Users
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const custs: UserProfile[] = [];
      const comps: UserProfile[] = [];
      snapshot.forEach((docSnap) => {
        const u = { id: docSnap.id, ...docSnap.data() } as UserProfile;
        if (u.role === "CUSTOMER") custs.push(u);
        if (u.role === "MOVING_COMPANY") comps.push(u);
      });
      setCustomers(custs);
      setCompanies(comps);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "users");
    });

    // Listen to Requests
    const unsubRequests = onSnapshot(collection(db, "moving_requests"), (snapshot) => {
      const reqs: MovingRequest[] = [];
      snapshot.forEach((docSnap) => {
        reqs.push({ id: docSnap.id, ...docSnap.data() } as MovingRequest);
      });
      setRequests(reqs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "moving_requests");
    });

    // Listen to Offers
    const unsubOffers = onSnapshot(collection(db, "offers"), (snapshot) => {
      const offs: Offer[] = [];
      snapshot.forEach((docSnap) => {
        offs.push({ id: docSnap.id, ...docSnap.data() } as Offer);
      });
      setOffers(offs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "offers");
    });

    // Listen to Reviews
    const unsubReviews = onSnapshot(collection(db, "reviews"), (snapshot) => {
      const revs: Review[] = [];
      snapshot.forEach((docSnap) => {
        revs.push({ id: docSnap.id, ...docSnap.data() } as Review);
      });
      setReviews(revs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "reviews");
    });

    // Listen to Complaints
    const unsubComplaints = onSnapshot(collection(db, "complaints"), (snapshot) => {
      const compsList: Complaint[] = [];
      snapshot.forEach((docSnap) => {
        compsList.push({ id: docSnap.id, ...docSnap.data() } as Complaint);
      });
      setComplaints(compsList);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "complaints");
    });

    // Listen to Announcements
    const unsubAnnouncements = onSnapshot(collection(db, "announcements"), (snapshot) => {
      const anns: Announcement[] = [];
      snapshot.forEach((docSnap) => {
        anns.push({ id: docSnap.id, ...docSnap.data() } as Announcement);
      });
      setAnnouncements(anns);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "announcements");
    });

    // Listen to Blogs
    const unsubBlogs = onSnapshot(collection(db, "blogs"), (snapshot) => {
      const blogList: BlogPost[] = [];
      snapshot.forEach((docSnap) => {
        blogList.push({ id: docSnap.id, ...docSnap.data() } as BlogPost);
      });
      // Sort in-memory by createdAt descending
      blogList.sort((a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime());
      setBlogs(blogList);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "blogs");
    });

    // Listen to Site Settings (entire settings collection to support split image documents and stay under 1MB)
    const unsubSettings = onSnapshot(collection(db, "settings"), (snapshot) => {
      let siteConfigData: any = {};
      const imageDocs: any = {};

      snapshot.forEach((docSnap) => {
        if (docSnap.id.startsWith("image_")) {
          const fieldName = docSnap.id.replace("image_", "");
          imageDocs[fieldName] = docSnap.data().value;
        } else if (docSnap.id === "site_config") {
          siteConfigData = docSnap.data();
        }
      });

      // Explicitly delete legacy image paths from site_config so they never overwrite separate image documents
      delete siteConfigData.heroBackgroundImage;
      delete siteConfigData.heroSliderImage1;
      delete siteConfigData.heroSliderImage2;
      delete siteConfigData.customLogoUrl;

      isIncomingSnapshot.current = true;
      setSiteSettings((prev) => {
        const merged = { ...prev, ...siteConfigData, ...imageDocs };
        prevSettingsRef.current = merged;
        return merged;
      });
      setSettingsLoaded(true);
    }, (error) => {
      console.error("Site settings listen failed:", error);
    });

    // Seed Activity logs
    setActivityLogs([
      { id: "1", user: "Ahmet Yılmaz", action: "Talep Yayınladı", ip: "176.234.12.98", date: new Date().toISOString() },
      { id: "2", user: "Güven Taşımacılık", action: "Teklif Verdi (₺4,500)", ip: "85.105.42.112", date: new Date().toISOString() },
      { id: "3", user: "alibuyukuyar268@gmail.com", action: "Admin Paneli Girişi", ip: "94.54.123.10", date: new Date().toISOString() }
    ]);

    return () => {
      unsubUsers();
      unsubRequests();
      unsubOffers();
      unsubReviews();
      unsubComplaints();
      unsubAnnouncements();
      unsubBlogs();
      unsubSettings();
    };
  }, []);

  const saveSiteSettings = async () => {
    setSavingSettings(true);
    try {
      // Separate large image properties to keep site_config doc small (<1MB)
      const { heroBackgroundImage, heroSliderImage1, heroSliderImage2, customLogoUrl, ...restSettings } = siteSettings;
      
      await setDoc(doc(db, "settings", "site_config"), restSettings);
      
      if (heroBackgroundImage !== undefined) {
        await setDoc(doc(db, "settings", "image_heroBackgroundImage"), { value: heroBackgroundImage });
      }
      if (heroSliderImage1 !== undefined) {
        await setDoc(doc(db, "settings", "image_heroSliderImage1"), { value: heroSliderImage1 });
      }
      if (heroSliderImage2 !== undefined) {
        await setDoc(doc(db, "settings", "image_heroSliderImage2"), { value: heroSliderImage2 });
      }
      if (customLogoUrl !== undefined) {
        await setDoc(doc(db, "settings", "image_customLogoUrl"), { value: customLogoUrl });
      }

      showToast("Site ayarları başarıyla kaydedildi ve tüm kullanıcılarda güncellendi!");
    } catch (err) {
      console.error("Site ayarları kaydedilirken hata:", err);
      showToast("Ayarlar kaydedilirken bir hata oluştu.", "error");
    } finally {
      setSavingSettings(false);
    }
  };

  // Debounced real-time auto-saving of Site Settings to Firestore
  useEffect(() => {
    if (!siteSettings || !settingsLoaded) return;

    // Check if there is an actual change
    if (prevSettingsRef.current && JSON.stringify(prevSettingsRef.current) === JSON.stringify(siteSettings)) {
      if (isIncomingSnapshot.current) {
        isIncomingSnapshot.current = false;
      }
      return;
    }

    // If change was triggered by an incoming snapshot, clear flag and skip auto-saving
    if (isIncomingSnapshot.current) {
      isIncomingSnapshot.current = false;
      prevSettingsRef.current = siteSettings;
      return;
    }

    // Auto-save with 500ms debounce for high responsiveness
    const timer = setTimeout(async () => {
      setSavingSettings(true);
      try {
        // Separate large image properties to keep site_config doc small (<1MB)
        const { heroBackgroundImage, heroSliderImage1, heroSliderImage2, customLogoUrl, ...restSettings } = siteSettings;
        
        await setDoc(doc(db, "settings", "site_config"), restSettings);
        
        if (heroBackgroundImage !== undefined) {
          await setDoc(doc(db, "settings", "image_heroBackgroundImage"), { value: heroBackgroundImage });
        }
        if (heroSliderImage1 !== undefined) {
          await setDoc(doc(db, "settings", "image_heroSliderImage1"), { value: heroSliderImage1 });
        }
        if (heroSliderImage2 !== undefined) {
          await setDoc(doc(db, "settings", "image_heroSliderImage2"), { value: heroSliderImage2 });
        }
        if (customLogoUrl !== undefined) {
          await setDoc(doc(db, "settings", "image_customLogoUrl"), { value: customLogoUrl });
        }

        prevSettingsRef.current = siteSettings;
      } catch (err) {
        console.error("Site settings auto-save failed:", err);
      } finally {
        setSavingSettings(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [siteSettings, settingsLoaded]);

  // Propagate site settings changes back to the parent instantly for real-time live preview
  useEffect(() => {
    if (setParentSiteSettings && siteSettings) {
      setParentSiteSettings(siteSettings);
    }
  }, [siteSettings, setParentSiteSettings]);

  // Actions
  const approveCompany = async (companyId: string) => {
    try {
      await updateDoc(doc(db, "users", companyId), {
        isApproved: true,
        verificationBadge: true
      });
      showToast("Firma evrakları onaylandı ve profil doğrulandı.");
    } catch (err) {
      console.error(err);
    }
  };

  const toggleVerificationBadge = async (companyId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "users", companyId), {
        verificationBadge: !currentStatus
      });
    } catch (err) {
      console.error(err);
    }
  };

  const resolveComplaint = async (complaintId: string) => {
    try {
      await updateDoc(doc(db, "complaints", complaintId), {
        status: "RESOLVED"
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveAppeal = async (review: Review) => {
    try {
      // Approve appeal: set status APPROVED, isDeleted true, isTransparent true
      await updateDoc(doc(db, "reviews", review.id), {
        appealStatus: "APPROVED",
        isDeleted: true,
        isTransparent: true
      });

      // Recalculate rating
      await recalculateUserRating(review.targetId);

      // Notify the user who appealed
      await addDoc(collection(db, "notifications"), {
        userId: review.targetId,
        title: "Değerlendirme İtirazınız Kabul Edildi!",
        body: "Değerlendirme itirazınız incelenmiş ve kabul edilmiştir. Söz konusu yorum silinmiştir.",
        type: "SYSTEM_UPDATE",
        requestId: review.requestId || "",
        read: false,
        createdAt: new Date().toISOString()
      });

      showToast("İtiraz onaylandı ve yorum silindi!");
      setApprovingReview(null);
    } catch (err) {
      console.error(err);
      showToast("Hata oluştu.", "error");
    }
  };

  const handleRejectAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingAppealId || !rejectReason.trim()) return;

    try {
      const reviewDoc = reviews.find(r => r.id === rejectingAppealId);
      if (!reviewDoc) return;

      // Reject appeal: set status REJECTED, isDeleted false, isTransparent false, appealAdminNote
      await updateDoc(doc(db, "reviews", rejectingAppealId), {
        appealStatus: "REJECTED",
        isDeleted: false,
        isTransparent: false,
        appealAdminNote: rejectReason
      });

      // Recalculate rating
      await recalculateUserRating(reviewDoc.targetId);

      // Notify the user who appealed
      await addDoc(collection(db, "notifications"), {
        userId: reviewDoc.targetId,
        title: "Değerlendirme İtirazınız Reddedildi",
        body: `Değerlendirme itirazınız reddedilmiştir. Gerekçe: "${rejectReason}"`,
        type: "SYSTEM_UPDATE",
        requestId: reviewDoc.requestId || "",
        read: false,
        createdAt: new Date().toISOString()
      });

      showToast("İtiraz reddedildi ve gerekçesi kullanıcıya iletildi!");
      setRejectingAppealId(null);
      setRejectReason("");
    } catch (err) {
      console.error(err);
      showToast("Hata oluştu.", "error");
    }
  };

  const createAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle || !newAnnContent) return;

    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + newAnnDurationHours * 60 * 60 * 1000).toISOString();

      await addDoc(collection(db, "announcements"), {
        title: newAnnTitle,
        content: newAnnContent,
        target: newAnnTarget,
        imageUrl: newAnnImage || null,
        durationHours: newAnnDurationHours,
        expiresAt,
        textColor: newAnnTextColor,
        bgColor: newAnnBgColor,
        fontFamily: newAnnFontFamily,
        badgeText: newAnnBadgeText,
        badgeColor: newAnnBadgeColor,
        createdAt: now.toISOString()
      });
      
      setNewAnnTitle("");
      setNewAnnContent("");
      setNewAnnImage("");
      setNewAnnDurationHours(24);
      setNewAnnTextColor("#1e293b");
      setNewAnnBgColor("#f8fafc");
      setNewAnnFontFamily("sans");
      setNewAnnBadgeText("DUYURU");
      setNewAnnBadgeColor("#3b82f6");
      
      showToast("Duyuru başarıyla yayınlandı.");
    } catch (err) {
      console.error(err);
      showToast("Duyuru yayınlanırken hata oluştu.", "error");
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      await deleteDoc(doc(db, "announcements", id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateOrUpdateBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogFormTitle || !blogFormContent) {
      showToast("Lütfen başlık ve içerik alanlarını doldurun.", "error");
      return;
    }

    try {
      const blogData = {
        tag: blogFormTag || "Genel",
        title: blogFormTitle,
        content: blogFormContent,
        imageUrl: blogFormImageUrl || null,
        createdAt: new Date().toISOString()
      };

      if (editingBlogId) {
        // Update existing blog
        await setDoc(doc(db, "blogs", editingBlogId), blogData, { merge: true });
        showToast("Blog yazısı başarıyla güncellendi.");
      } else {
        // Create new blog
        await addDoc(collection(db, "blogs"), blogData);
        showToast("Blog yazısı başarıyla yayınlandı.");
      }

      // Reset form
      setBlogFormTag("Tüyolar");
      setBlogFormTitle("");
      setBlogFormContent("");
      setBlogFormImageUrl("");
      setEditingBlogId(null);
    } catch (err) {
      console.error(err);
      showToast("İşlem sırasında bir hata oluştu.", "error");
    }
  };

  const handleEditBlog = (blog: BlogPost) => {
    if (!blog.id) return;
    setEditingBlogId(blog.id);
    setBlogFormTag(blog.tag || "Tüyolar");
    setBlogFormTitle(blog.title || "");
    setBlogFormContent(blog.content || "");
    setBlogFormImageUrl(blog.imageUrl || "");
  };

  const handleDeleteBlog = async (id: string) => {
    if (!window.confirm("Bu blog yazısını silmek istediğinize emin misiniz?")) return;
    try {
      await deleteDoc(doc(db, "blogs", id));
      showToast("Blog yazısı silindi.");
    } catch (err) {
      console.error(err);
      showToast("Silme işlemi başarısız.", "error");
    }
  };

  // Dynamic Charts & Stats Calculations
  const getCityFromAddress = (address: string): string => {
    if (!address) return "Diğer";
    const normalizedAddr = address.toLowerCase();
    for (const city of INITIAL_TURKISH_CITIES) {
      const normalizedCity = city.toLowerCase();
      if (normalizedAddr.includes(normalizedCity)) {
        return city;
      }
    }
    return "Diğer";
  };

  const getMonthlyData = () => {
    const monthNames = [
      "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
      "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
    ];
    
    const now = new Date();
    const list = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthNames[d.getMonth()];
      const monthIndex = d.getMonth();
      const year = d.getFullYear();
      
      const reqsInMonth = requests.filter(r => {
        if (!r.createdAt) return false;
        const rDate = new Date(r.createdAt);
        return rDate.getMonth() === monthIndex && rDate.getFullYear() === year;
      });
      
      let monthRevenue = 0;
      reqsInMonth.forEach(r => {
        if (r.status === "OFFER_ACCEPTED" || r.status === "COMPLETED") {
          const acceptedOffer = offers.find(o => o.id === r.acceptedOfferId);
          if (acceptedOffer) {
            monthRevenue += acceptedOffer.price;
          }
        }
      });
      
      list.push({
        name: monthName,
        Talepler: reqsInMonth.length,
        Gelir: monthRevenue
      });
    }
    return list;
  };

  const getCityDistribution = () => {
    if (requests.length === 0) return [];
    
    const counts: { [key: string]: number } = {};
    requests.forEach(r => {
      const city = getCityFromAddress(r.pickupAddress);
      counts[city] = (counts[city] || 0) + 1;
    });
    
    const total = requests.length;
    const rawData = Object.entries(counts).map(([name, count]) => ({
      name,
      value: Math.round((count / total) * 100)
    }));
    
    rawData.sort((a, b) => b.value - a.value);
    if (rawData.length <= 5) {
      return rawData;
    } else {
      const top4 = rawData.slice(0, 4);
      const restSum = rawData.slice(4).reduce((sum, item) => sum + item.value, 0);
      if (restSum > 0) {
        top4.push({ name: "Diğer", value: restSum });
      }
      return top4;
    }
  };

  const getCityVolumeAndDistributionData = () => {
    if (requests.length === 0) return [];
    
    const cityDataMap: { [city: string]: { jobCount: number; volume: number } } = {};
    
    requests.forEach(r => {
      const city = getCityFromAddress(r.pickupAddress);
      if (!cityDataMap[city]) {
        cityDataMap[city] = { jobCount: 0, volume: 0 };
      }
      cityDataMap[city].jobCount += 1;
      
      if (r.status === "OFFER_ACCEPTED" || r.status === "COMPLETED") {
        const acceptedOffer = offers.find(o => o.id === r.acceptedOfferId);
        if (acceptedOffer) {
          cityDataMap[city].volume += acceptedOffer.price;
        }
      }
    });
    
    const rawData = Object.entries(cityDataMap).map(([name, data]) => ({
      name,
      "Talepler": data.jobCount,
      "Hacim": data.volume
    }));
    
    rawData.sort((a, b) => b.Hacim - a.Hacim);
    return rawData;
  };

  const totalVolume = offers.filter(o => o.status === "ACCEPTED").reduce((acc, curr) => acc + curr.price, 0);
  const monthlyVolumeData = getMonthlyData();
  const cityDistribution = getCityDistribution();
  const cityVolumeAndDistributionData = getCityVolumeAndDistributionData();

  const COLORS = ["#1e293b", "#3b82f6", "#10b981", "#f59e0b", "#ec4899"];

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col font-sans">
      {/* Top Banner Control Panel */}
      <div className="bg-slate-950 text-white px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-blue-600 rounded-xl shrink-0">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xs sm:text-base font-black font-display tracking-wide uppercase leading-tight truncate">Nakliye Marketplace ERP</h1>
              <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 text-[8px] sm:text-[9px] font-bold rounded-full whitespace-nowrap">Sistem Yöneticisi</span>
            </div>
            <p className="text-[9px] sm:text-[11px] text-slate-400 truncate">Google Workspace: {user.email}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-800 hover:bg-slate-700 text-[10px] sm:text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <span className="hidden sm:inline">Paneli Kapat</span> <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main ERP Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 bg-slate-900 text-slate-300 p-3 md:p-5 flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible md:overflow-y-auto shrink-0 border-b md:border-b-0 md:border-r border-slate-800 scrollbar-none">
          <p className="hidden md:block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Sistem Modülleri</p>

          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:px-4 md:py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
              activeTab === "dashboard" ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" : "hover:bg-white/5 text-slate-400 hover:text-white"
            }`}
          >
            <BarChart2 className="w-4 h-4" /> <span>Dashboard Analitik</span>
          </button>

          <button
            onClick={() => setActiveTab("customers")}
            className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:px-4 md:py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
              activeTab === "customers" ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" : "hover:bg-white/5 text-slate-400 hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" /> <span>Müşteri Yönetimi</span>
          </button>

          <button
            onClick={() => setActiveTab("companies")}
            className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:px-4 md:py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
              activeTab === "companies" ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" : "hover:bg-white/5 text-slate-400 hover:text-white"
            }`}
          >
            <Truck className="w-4 h-4" /> <span>Nakliye Firmaları</span>
          </button>

          <button
            onClick={() => setActiveTab("requests")}
            className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:px-4 md:py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
              activeTab === "requests" ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" : "hover:bg-white/5 text-slate-400 hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4" /> <span>Talep Takibi</span>
          </button>

          <button
            onClick={() => setActiveTab("complaints")}
            className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:px-4 md:py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
              activeTab === "complaints" ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" : "hover:bg-white/5 text-slate-400 hover:text-white"
            }`}
          >
            <AlertOctagon className="w-4 h-4" /> <span>Şikayet ve Destek</span>
          </button>

          <button
            onClick={() => setActiveTab("appeals")}
            className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:px-4 md:py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
              activeTab === "appeals" ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" : "hover:bg-white/5 text-slate-400 hover:text-white"
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" /> <span>Değerlendirme İtirazları</span>
          </button>

          <button
            onClick={() => setActiveTab("announcements")}
            className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:px-4 md:py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
              activeTab === "announcements" ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" : "hover:bg-white/5 text-slate-400 hover:text-white"
            }`}
          >
            <Megaphone className="w-4 h-4" /> <span>Duyuru Sistemi</span>
          </button>

          <button
            onClick={() => setActiveTab("blogs")}
            className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:px-4 md:py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
              activeTab === "blogs" ? "bg-amber-600 text-white shadow-md shadow-amber-500/10" : "hover:bg-white/5 text-slate-400 hover:text-white"
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-400" /> <span>Blog Yönetimi</span>
          </button>

          <button
            onClick={() => setActiveTab("site_customizer")}
            className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:px-4 md:py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
              activeTab === "site_customizer" ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/10" : "hover:bg-white/5 text-slate-400 hover:text-white"
            }`}
          >
            <Palette className="w-4 h-4 text-emerald-400" /> <span>Site Canlı Özelleştirici</span>
          </button>

          <div className="hidden md:block mt-auto pt-6 border-t border-slate-800 text-[11px] text-slate-500 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span>Sistem API: Aktif</span>
            </div>
            <p>Sürüm: 1.0.4 Enterprise</p>
          </div>
        </div>

        {/* Dynamic Content Panel */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50">
          {/* DASHBOARD TAB */}
          {activeTab === "dashboard" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold font-display text-slate-900">Gerçek Zamanlı Analitik</h2>
                  <p className="text-xs text-slate-500">Pazaryerindeki anlık işlemler, hacim ve finansal dağılım raporu.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Sistemi Sıfırla
                  </button>
                  <span className="px-3.5 py-1.5 bg-white border border-slate-200 text-[11px] font-bold text-slate-600 rounded-xl flex items-center gap-1.5 shadow-xs">
                    <Clock className="w-3.5 h-3.5 text-blue-600" /> Son Güncelleme: Anlık
                  </span>
                </div>
              </div>

              {/* Stat Boxes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Toplam Müşteri</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{customers.length}</p>
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 mt-1">
                    <TrendingUp className="w-3 h-3" /> +14% geçen ay
                  </span>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aktif Nakliyeci</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{companies.length}</p>
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 mt-1">
                    <TrendingUp className="w-3 h-3" /> +8% geçen ay
                  </span>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Yayınlanan Talepler</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{requests.length}</p>
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 mt-1">
                    <TrendingUp className="w-3 h-3" /> +22% geçen ay
                  </span>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Öngörülen İş Hacmi</p>
                  <p className="text-2xl font-black text-emerald-600 mt-1">₺{totalVolume.toLocaleString("tr-TR")}</p>
                  <span className="text-[10px] font-bold text-blue-600 flex items-center gap-0.5 mt-1">
                    Teklif usulü gerçekleşen hacim
                  </span>
                </div>
              </div>

              {/* Performance Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Chart 1 */}
                <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Hacim ve Tahmini Finansal Gelir Gelişimi</h3>
                  <div className="h-72 flex flex-col items-center justify-center">
                    {requests.length === 0 ? (
                      <div className="text-center text-slate-400 text-xs px-4 py-8">
                        <p className="font-semibold text-sm text-slate-500">Veri Bulunmuyor</p>
                        <p className="mt-1">Henüz aktif veya tamamlanmış bir nakliye işlemi bulunmadığından hacim gelişimi gösterilemiyor.</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyVolumeData}>
                          <defs>
                            <linearGradient id="colorGelir" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" />
                          <YAxis fontSize={11} stroke="#94a3b8" />
                          <Tooltip />
                          <Area type="monotone" dataKey="Gelir" stroke="#3b82f6" fillOpacity={1} fill="url(#colorGelir)" strokeWidth={2.5} />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Chart 2 */}
                <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">İl Dağılım Dağılımı (%)</h3>
                  <div className="h-72 flex flex-col items-center justify-center">
                    {requests.length === 0 ? (
                      <div className="text-center text-slate-400 text-xs px-4 py-8">
                        <p className="font-semibold text-sm text-slate-500">Veri Bulunmuyor</p>
                        <p className="mt-1">Henüz yayınlanmış bir nakliye talebi bulunmadığından il dağılımı gösterilemiyor.</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={cityDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {cityDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>

              {/* Interactive City Job Volume and Province Distribution Chart */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-50 pb-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">İş Hacmi ve İl Dağılımı (Türkiye Geneli)</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Şehir bazlı toplam nakliye talebi adeti (bar) ve toplam taşıma cirosu (çizgi) ilişkisi.</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 px-3 py-1.5 rounded-2xl text-[10px] font-bold text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <span>Aktif İl Sayısı: {cityVolumeAndDistributionData.length}</span>
                  </div>
                </div>

                <div className="h-80 flex flex-col items-center justify-center">
                  {cityVolumeAndDistributionData.length === 0 ? (
                    <div className="text-center text-slate-400 text-xs px-4 py-8">
                      <p className="font-semibold text-sm text-slate-500">Veri Bulunmuyor</p>
                      <p className="mt-1">Henüz il bazında talepler veya finansal ciro verisi bulunmuyor.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={cityVolumeAndDistributionData}
                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" />
                        <YAxis yAxisId="left" label={{ value: 'Talep Sayısı (Adet)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#475569', offset: -10 }} fontSize={11} stroke="#475569" />
                        <YAxis yAxisId="right" orientation="right" label={{ value: 'İş Hacmi (₺)', angle: 90, position: 'insideRight', fontSize: 10, fill: '#10b981', offset: -10 }} fontSize={11} stroke="#10b981" />
                        <Tooltip 
                          formatter={(value: any, name: string) => {
                            if (name === "Hacim") return [`₺${value.toLocaleString("tr-TR")}`, "İş Hacmi"];
                            return [value, "Talep Adeti"];
                          }}
                          contentStyle={{ backgroundColor: "#1e293b", borderRadius: "16px", border: "none", color: "#f8fafc" }}
                          itemStyle={{ color: "#f8fafc" }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        <Bar yAxisId="left" dataKey="Talepler" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={28} />
                        <Line yAxisId="right" type="monotone" dataKey="Hacim" stroke="#10b981" strokeWidth={3} activeDot={{ r: 6 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* System Audit Logs */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Sistem Audit Logları (Son İşlemler)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-500">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400">
                      <tr>
                        <th className="p-3">Kullanıcı</th>
                        <th className="p-3">İşlem Detayı</th>
                        <th className="p-3">IP Adresi</th>
                        <th className="p-3">Zaman</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activityLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-800">{log.user}</td>
                          <td className="p-3">{log.action}</td>
                          <td className="p-3 font-mono">{log.ip}</td>
                          <td className="p-3">{new Date(log.date).toLocaleTimeString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* CUSTOMERS TAB */}
          {activeTab === "customers" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h2 className="text-lg font-bold font-display text-slate-900">Müşteri Yönetimi</h2>
                <p className="text-xs text-slate-500">Sisteme kayıtlı müşterilerin listesi ve işlem yetkileri.</p>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-500">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400">
                      <tr>
                        <th className="p-4">Ad Soyad</th>
                        <th className="p-4">E-posta</th>
                        <th className="p-4">Telefon</th>
                        <th className="p-4">Kayıt Tarihi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customers.map((cust) => (
                        <tr key={cust.id} className="hover:bg-slate-50/50">
                          <td className="p-4 font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                              {cust.name.slice(0, 2)}
                            </span>
                            {cust.name}
                          </td>
                          <td className="p-4">{cust.email}</td>
                          <td className="p-4 font-medium">{cust.phone || "Belirtilmemiş"}</td>
                          <td className="p-4">{new Date(cust.createdAt).toLocaleDateString("tr-TR")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* COMPANIES TAB */}
          {activeTab === "companies" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h2 className="text-lg font-bold font-display text-slate-900">Nakliye Firmaları Kontrol Paneli</h2>
                <p className="text-xs text-slate-500">Firma yetkilendirmesi, evrak kontrolleri ve doğrulama rozeti yönetimi.</p>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-500">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400">
                      <tr>
                        <th className="p-4">Firma Adı</th>
                        <th className="p-4">Vergi No / Daire</th>
                        <th className="p-4">Hizmet İlleri</th>
                        <th className="p-4">Onay Durumu</th>
                        <th className="p-4">Doğrulama Rozeti</th>
                        <th className="p-4 text-center">Aksiyon</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {companies.map((comp) => (
                        <tr key={comp.id} className="hover:bg-slate-50/50">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <span className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                                {comp.name.slice(0, 2)}
                              </span>
                              <div>
                                <p className="font-bold text-slate-800">{comp.name}</p>
                                <p className="text-[10px] text-slate-400">Tel: {comp.phone}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-mono">
                            {comp.taxNumber || "1234567890"} / {comp.taxOffice || "Kadıköy VD"}
                          </td>
                          <td className="p-4 max-w-[150px] truncate">{comp.workingCities?.join(", ") || "İstanbul"}</td>
                          <td className="p-4">
                            {comp.isApproved ? (
                              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-100">
                                Evrak Onaylı
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-lg border border-amber-100">
                                Bekliyor
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => toggleVerificationBadge(comp.id, comp.verificationBadge || false)}
                              className={`px-2 py-1 text-[10px] font-bold rounded-md border ${
                                comp.verificationBadge
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-slate-50 text-slate-500 border-slate-200"
                              }`}
                            >
                              {comp.verificationBadge ? "Doğrulanmış" : "Standart"}
                            </button>
                          </td>
                          <td className="p-4 text-center">
                            {!comp.isApproved && (
                              <button
                                onClick={() => approveCompany(comp.id)}
                                className="px-3 py-1.5 bg-slate-900 text-white font-bold text-[10px] rounded-lg hover:bg-slate-800 cursor-pointer"
                              >
                                Belgeleri Onayla
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* REQUESTS TAB */}
          {activeTab === "requests" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h2 className="text-lg font-bold font-display text-slate-900">Talep Takibi ve Denetleme</h2>
                <p className="text-xs text-slate-500">Müşteriler tarafından açılan tüm nakliye isteklerinin akışı ve durumları.</p>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-500">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400">
                      <tr>
                        <th className="p-4">Müşteri</th>
                        <th className="p-4">Güzergah</th>
                        <th className="p-4">Ev Tipi</th>
                        <th className="p-4">Tarih</th>
                        <th className="p-4">Durum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {requests.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-50/50">
                          <td className="p-4 font-bold text-slate-800">{req.customerName}</td>
                          <td className="p-4">
                            <p className="text-slate-800 font-semibold truncate max-w-[200px]">{req.pickupAddress.split(",")[0]}</p>
                            <p className="text-[10px] text-slate-400">➜ {req.destinationAddress.split(",")[0]}</p>
                          </td>
                          <td className="p-4 font-semibold">{req.houseType}</td>
                          <td className="p-4 font-medium">{new Date(req.estimatedDate).toLocaleDateString("tr-TR")}</td>
                          <td className="p-4">
                            {req.status === "PENDING" && (
                              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded border border-amber-100">
                                Teklif Bekliyor
                              </span>
                            )}
                            {req.status === "OFFER_ACCEPTED" && (
                              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded border border-indigo-100">
                                Anlaşma Sağlandı
                              </span>
                            )}
                            {req.status === "COMPLETED" && (
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded border border-emerald-100">
                                Tamamlandı
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* COMPLAINTS TAB */}
          {activeTab === "complaints" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h2 className="text-lg font-bold font-display text-slate-900">Şikayet ve Destek Talepleri</h2>
                <p className="text-xs text-slate-500">Müşteri veya nakliye firmalarının ilettiği uyuşmazlıklar ve çözüm arayüzü.</p>
              </div>

              {complaints.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-3xl border border-slate-100 flex flex-col items-center justify-center gap-2">
                  <CheckCircle className="w-10 h-10 text-emerald-500 animate-bounce" />
                  <h4 className="text-sm font-bold text-slate-800">Şu An Bekleyen Şikayet Yok</h4>
                  <p className="text-xs text-slate-400">Tüm uyuşmazlıklar çözüldü veya sisteme şikayet kaydı düşmedi.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {complaints.map((comp) => (
                    <div key={comp.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded-full">
                          {comp.reason}
                        </span>
                        {comp.status === "PENDING" ? (
                          <span className="text-xs font-bold text-amber-500">İncelemede</span>
                        ) : (
                          <span className="text-xs font-bold text-emerald-600">Çözüldü</span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-slate-500">
                          <span className="font-bold text-slate-800">Bildiren:</span> {comp.reporterName}
                        </p>
                        <p className="text-xs text-slate-500">
                          <span className="font-bold text-slate-800">Şikayet Edilen:</span> {comp.reportedName}
                        </p>
                      </div>

                      <div className="p-3.5 bg-slate-50 rounded-2xl text-xs text-slate-700 leading-relaxed font-medium">
                        {comp.details}
                      </div>

                      {comp.status === "PENDING" && (
                        <button
                          onClick={() => resolveComplaint(comp.id)}
                          className="w-full py-2.5 bg-slate-950 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
                        >
                          Uyuşmazlığı Çözüldü Olarak İşaretle
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* APPEALS TAB */}
          {activeTab === "appeals" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h2 className="text-lg font-bold font-display text-slate-900">Değerlendirme ve Puan İtirazları</h2>
                <p className="text-xs text-slate-500">Kullanıcıların haksız olduğunu beyan ettiği yorumların kontrol, yayından kaldırma ve onay merkezidir.</p>
              </div>

              {reviews.filter(r => r.isAppealed).length === 0 ? (
                <div className="bg-white p-12 text-center rounded-3xl border border-slate-100 flex flex-col items-center justify-center gap-2">
                  <CheckCircle className="w-10 h-10 text-emerald-500 animate-bounce" />
                  <h4 className="text-sm font-bold text-slate-800">Aktif İtiraz Bulunmamaktadır</h4>
                  <p className="text-xs text-slate-400">Tüm değerlendirmeler yayında veya çözümlenmiş durumda.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {reviews.filter(r => r.isAppealed).map((rev) => {
                    const isPending = rev.appealStatus === "PENDING" || !rev.appealStatus;
                    const isApproved = rev.appealStatus === "APPROVED";
                    const isRejected = rev.appealStatus === "REJECTED";

                    return (
                      <div key={rev.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-50">
                          <div className="text-xs">
                            <span className="font-bold text-slate-400">İş Kimliği: #{rev.requestId?.slice(0, 8).toUpperCase() || "BİLİNMİYOR"}</span>
                            <div className="flex items-center mt-1 text-slate-600 gap-1 font-bold">
                              <span>Gönderen: {rev.reviewerName}</span>
                              <span className="mx-1">➔</span>
                              <span>Hedef: {rev.targetId.slice(0, 8).toUpperCase()}</span>
                            </div>
                          </div>
                          <div>
                            {isPending && <span className="px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full animate-pulse">İnceleme Bekliyor</span>}
                            {isApproved && <span className="px-3 py-1 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-full">Kabul Edildi (Yorum Gizli/Silindi)</span>}
                            {isRejected && <span className="px-3 py-1 bg-slate-50 text-slate-700 text-[10px] font-bold rounded-full">Reddedildi (Yorum Aktif)</span>}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">İtiraz Edilen Değerlendirme</p>
                            <p className="text-slate-800 font-medium">Yıldız: <span className="text-amber-500 font-bold">★ {rev.rating}</span></p>
                            <p className="text-slate-600 italic">"{rev.comment}"</p>
                          </div>

                          <div className="space-y-1.5 p-3.5 bg-rose-50/30 rounded-2xl border border-rose-100/40">
                            <p className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">Kullanıcının İtiraz Açıklaması</p>
                            <p className="text-slate-700 font-medium italic">"{rev.appealExplanation || "Açıklama belirtilmedi."}"</p>
                          </div>
                        </div>

                        {isPending && (
                          <div className="flex gap-3 text-xs font-bold">
                            <button
                              onClick={() => setApprovingReview(rev)}
                              className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl cursor-pointer"
                            >
                              Yorumu Sil ve İtirazı Kabul Et
                            </button>
                            <button
                              onClick={() => setRejectingAppealId(rev.id)}
                              className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl cursor-pointer"
                            >
                              İtirazı Reddet ve Yorumu Yayında Tut
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ANNOUNCEMENTS TAB */}
          {activeTab === "announcements" && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl font-bold font-display text-slate-900">Gelişmiş Duyuru ve Kampanya Yönetimi</h2>
                <p className="text-xs text-slate-500">Müşterilerinize veya nakliyat firmalarınıza özel tasarımlı, süreli ve görsel içeren sistem genelinde duyurular yayınlayın.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Form */}
                <form onSubmit={createAnnouncement} className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Yeni Duyuru Tasarla</h3>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">Gelişmiş Tasarım</span>
                  </div>

                  {/* Title & Target */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Duyuru Başlığı</label>
                      <input
                        type="text"
                        required
                        value={newAnnTitle}
                        onChange={(e) => setNewAnnTitle(e.target.value)}
                        placeholder="Örn: %20 Hafta Sonu İndirimi!"
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Hedef Kitle</label>
                      <select
                        value={newAnnTarget}
                        onChange={(e: any) => setNewAnnTarget(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                      >
                        <option value="ALL">Herkes (Müşteri & Nakliyeci)</option>
                        <option value="CUSTOMERS">Sadece Müşteriler</option>
                        <option value="COMPANIES">Sadece Nakliye Firmaları</option>
                      </select>
                    </div>
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Duyuru Detayı / Açıklama</label>
                    <textarea
                      rows={3}
                      required
                      value={newAnnContent}
                      onChange={(e) => setNewAnnContent(e.target.value)}
                      placeholder="Duyuru metnini ve kampanya detaylarını buraya girin..."
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none resize-none focus:ring-2 focus:ring-blue-500/10"
                    />
                  </div>

                  {/* Duration & Badge */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Yayın Süresi (Ne kadar görünecek?)</label>
                      <select
                        value={newAnnDurationHours}
                        onChange={(e) => setNewAnnDurationHours(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 font-medium text-slate-700"
                      >
                        <option value={1}>1 Saat Görünsün</option>
                        <option value={3}>3 Saat Görünsün</option>
                        <option value={12}>12 Saat Görünsün</option>
                        <option value={24}>1 Gün Görünsün</option>
                        <option value={72}>3 Gün Görünsün</option>
                        <option value={168}>7 Gün Görünsün</option>
                        <option value={720}>30 Gün Görünsün</option>
                        <option value={87600}>Kalıcı / Süresiz</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Duyuru Rozeti (Badge)</label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={newAnnBadgeText}
                          onChange={(e) => setNewAnnBadgeText(e.target.value)}
                          placeholder="DUYURU, ACİL, KAMPANYA"
                          className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                        />
                        <input
                          type="color"
                          value={newAnnBadgeColor}
                          onChange={(e) => setNewAnnBadgeColor(e.target.value)}
                          className="w-10 h-9 p-1 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
                          title="Rozet Rengi"
                        />
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {["DUYURU", "KAMPANYA", "ACİL", "GÜNCELLEME", "İNDİRİM"].map((b) => (
                          <button
                            key={b}
                            type="button"
                            onClick={() => {
                              setNewAnnBadgeText(b);
                              if (b === "ACİL") setNewAnnBadgeColor("#ef4444");
                              else if (b === "KAMPANYA" || b === "İNDİRİM") setNewAnnBadgeColor("#f59e0b");
                              else if (b === "GÜNCELLEME") setNewAnnBadgeColor("#10b981");
                              else setNewAnnBadgeColor("#3b82f6");
                            }}
                            className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded"
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Fonts & Visual Presets */}
                  <div className="space-y-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Görsel Stil Özelleştirici</span>
                      <select
                        value={newAnnFontFamily}
                        onChange={(e) => setNewAnnFontFamily(e.target.value)}
                        className="text-[10px] font-bold bg-white border border-slate-200 px-2 py-1 rounded"
                      >
                        <option value="sans">Yazı Tipi: Inter (Modern)</option>
                        <option value="serif">Yazı Tipi: Playfair (Zarif)</option>
                        <option value="mono">Yazı Tipi: JetBrains (Sistem)</option>
                      </select>
                    </div>

                    {/* Presets */}
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-bold text-slate-400">Şablon Renk Paletleri:</p>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                        {[
                          { name: "Standart", bg: "#f8fafc", text: "#1e293b" },
                          { name: "Mavi", bg: "#eff6ff", text: "#1e40af" },
                          { name: "Yeşil", bg: "#ecfdf5", text: "#065f46" },
                          { name: "Sarı", bg: "#fef3c7", text: "#92400e" },
                          { name: "Kırmızı", bg: "#fef2f2", text: "#991b1b" },
                          { name: "Koyu", bg: "#1e293b", text: "#ffffff" }
                        ].map((p, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setNewAnnBgColor(p.bg);
                              setNewAnnTextColor(p.text);
                            }}
                            className="text-[9px] font-medium py-1 px-1.5 rounded border border-slate-200 flex flex-col items-center justify-center gap-0.5 cursor-pointer hover:scale-105 transition-all"
                            style={{ backgroundColor: p.bg, color: p.text }}
                          >
                            <span className="font-bold">{p.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Exact Color pickers */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-0.5">Arkaplan Rengi</label>
                        <div className="flex gap-1">
                          <input
                            type="color"
                            value={newAnnBgColor}
                            onChange={(e) => setNewAnnBgColor(e.target.value)}
                            className="w-8 h-8 p-0.5 bg-white border border-slate-200 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={newAnnBgColor}
                            onChange={(e) => setNewAnnBgColor(e.target.value)}
                            className="flex-1 text-[10px] bg-white border border-slate-200 rounded px-1.5 text-center font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-0.5">Yazı Rengi</label>
                        <div className="flex gap-1">
                          <input
                            type="color"
                            value={newAnnTextColor}
                            onChange={(e) => setNewAnnTextColor(e.target.value)}
                            className="w-8 h-8 p-0.5 bg-white border border-slate-200 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={newAnnTextColor}
                            onChange={(e) => setNewAnnTextColor(e.target.value)}
                            className="flex-1 text-[10px] bg-white border border-slate-200 rounded px-1.5 text-center font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Image Upload Option */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Duyuru Görseli (Dosyalardan Yükleyin)</label>
                    <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-4 text-center transition-all bg-slate-50/50">
                      {newAnnImage ? (
                        <div className="space-y-2">
                          <img
                            src={newAnnImage}
                            alt="Announcement Preview"
                            referrerPolicy="no-referrer"
                            className="max-h-32 mx-auto rounded-xl object-contain border border-slate-100 bg-white"
                          />
                          <div className="flex justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setNewAnnImage("")}
                              className="text-[10px] font-bold bg-rose-50 text-rose-600 px-3 py-1 rounded-lg hover:bg-rose-100 transition-all cursor-pointer"
                            >
                              Görseli Kaldır
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="file"
                            id="ann-image-upload"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                compressImageToBase64(file, (base64) => {
                                  setNewAnnImage(base64);
                                });
                              }
                            }}
                            className="hidden"
                          />
                          <label
                            htmlFor="ann-image-upload"
                            className="cursor-pointer block space-y-1 py-2"
                          >
                            <span className="text-xs font-bold text-blue-600 hover:text-blue-700 block">Dosya Seçin veya Sürükleyin</span>
                            <span className="text-[9px] text-slate-400 block">PNG, JPG, JPEG (Maks. 5MB) - Otomatik optimize edilir</span>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action */}
                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-all cursor-pointer shadow-sm shadow-blue-500/10 flex items-center justify-center gap-1.5"
                  >
                    <Megaphone className="w-4 h-4" /> Duyuruyu Yayınla ve Aktifleştir
                  </button>
                </form>

                {/* Published List */}
                <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Yayındaki Duyurular ({announcements.length})</h3>
                    <span className="text-[10px] text-slate-400 font-medium">Anlık Güncelleme</span>
                  </div>

                  {announcements.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 space-y-2">
                      <Megaphone className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs font-medium">Sistemde aktif duyuru bulunmuyor.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                      {announcements.map((ann) => {
                        const isExpired = ann.expiresAt && new Date(ann.expiresAt) < new Date();
                        return (
                          <div
                            key={ann.id}
                            className="p-4 rounded-2xl border border-slate-100 space-y-3 relative transition-all shadow-sm hover:shadow-md"
                            style={{
                              backgroundColor: ann.bgColor || "#f8fafc",
                              color: ann.textColor || "#1e293b"
                            }}
                          >
                            {/* Header */}
                            <div className="flex justify-between items-start gap-3">
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {ann.badgeText && (
                                    <span
                                      className="text-[8px] font-bold px-1.5 py-0.5 rounded text-white"
                                      style={{ backgroundColor: ann.badgeColor || "#3b82f6" }}
                                    >
                                      {ann.badgeText}
                                    </span>
                                  )}
                                  <span className="text-[8px] font-bold px-1.5 py-0.5 bg-white/40 border border-current/10 rounded">
                                    {ann.target === "ALL" ? "Herkes" : ann.target === "CUSTOMERS" ? "Müşteri" : "Firma"}
                                  </span>
                                  {isExpired && (
                                    <span className="text-[8px] font-bold px-1.5 py-0.5 bg-rose-500 text-white rounded">
                                      Süresi Doldu
                                    </span>
                                  )}
                                </div>
                                <h4
                                  className={`text-xs font-bold leading-snug ${
                                    ann.fontFamily === "serif"
                                      ? "font-serif"
                                      : ann.fontFamily === "mono"
                                      ? "font-mono"
                                      : "font-sans"
                                  }`}
                                >
                                  {ann.title}
                                </h4>
                              </div>

                              <button
                                type="button"
                                onClick={() => deleteAnnouncement(ann.id)}
                                className="text-rose-500 hover:text-rose-700 bg-white/85 p-1.5 rounded-full shadow-sm hover:scale-110 transition-all cursor-pointer"
                                title="Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Image if exists */}
                            {ann.imageUrl && (
                              <img
                                src={ann.imageUrl}
                                alt={ann.title}
                                referrerPolicy="no-referrer"
                                className="w-full max-h-36 object-cover rounded-xl border border-black/5 bg-white"
                              />
                            )}

                            {/* Content text */}
                            <p
                              className={`text-[10px] leading-relaxed opacity-90 ${
                                ann.fontFamily === "serif"
                                  ? "font-serif"
                                  : ann.fontFamily === "mono"
                                  ? "font-mono"
                                  : "font-sans"
                              }`}
                            >
                              {ann.content}
                            </p>

                            {/* Duration / Footer info */}
                            <div className="flex justify-between items-center text-[8px] font-medium opacity-75 pt-1.5 border-t border-current/10">
                              <span>Yayın: {new Date(ann.createdAt).toLocaleDateString("tr-TR")}</span>
                              <span>Bitiş: {ann.expiresAt ? new Date(ann.expiresAt).toLocaleString("tr-TR") : "Kalıcı"}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* BLOGS TAB */}
          {activeTab === "blogs" && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl font-bold font-display text-slate-900">Blog ve İçerik Yönetimi</h2>
                <p className="text-xs text-slate-500">Kullanıcılarınız için bilgilendirici makaleler, tüyolar ve rehberler yayınlayın. Bu yazılar ana sayfadaki blog bölümünde listelenir.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Blog Yazısı Ekle / Düzenle Formu */}
                <form onSubmit={handleCreateOrUpdateBlog} className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">
                      {editingBlogId ? "Blog Yazısını Düzenle" : "Yeni Blog Yazısı Oluştur"}
                    </h3>
                    {editingBlogId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingBlogId(null);
                          setBlogFormTag("Tüyolar");
                          setBlogFormTitle("");
                          setBlogFormContent("");
                          setBlogFormImageUrl("");
                        }}
                        className="text-[10px] text-rose-500 hover:underline cursor-pointer font-bold"
                      >
                        İptal Et
                      </button>
                    )}
                  </div>

                  {/* Kategori ve Başlık */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kategori / Etiket</label>
                      <select
                        value={blogFormTag}
                        onChange={(e) => setBlogFormTag(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                      >
                        <option value="Tüyolar">Tüyolar</option>
                        <option value="Güvenlik">Güvenlik</option>
                        <option value="Paketleme">Paketleme</option>
                        <option value="Rehber">Rehber</option>
                        <option value="Genel">Genel</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Makale Başlığı</label>
                      <input
                        type="text"
                        required
                        value={blogFormTitle}
                        onChange={(e) => setBlogFormTitle(e.target.value)}
                        placeholder="Örn: Ev Taşırken Kırılacak Eşyalar Nasıl Paketlenir?"
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kapak Görseli</label>
                      <div className="flex gap-3 items-start">
                        {blogFormImageUrl && (
                          <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group flex items-center justify-center">
                            <img 
                              src={blogFormImageUrl} 
                              alt="Blog Kapak Görseli" 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer" 
                            />
                            <button
                              type="button"
                              onClick={() => setBlogFormImageUrl("")}
                              className="absolute inset-0 bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-bold"
                            >
                              Sil
                            </button>
                          </div>
                        )}
                        <div className="flex-1 space-y-2">
                          <input
                            type="file"
                            id="blog-image-file-upload"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                compressImageToBase64(file, (base64) => {
                                  setBlogFormImageUrl(base64);
                                });
                              }
                            }}
                            className="hidden"
                          />
                          <label
                            htmlFor="blog-image-file-upload"
                            className="cursor-pointer block text-center py-2 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-xl text-[10px] font-bold text-blue-600 transition-colors"
                          >
                            Cihazdan Görsel Dosyası Seçin
                          </label>
                          
                          <input
                            type="text"
                            value={blogFormImageUrl}
                            onChange={(e) => setBlogFormImageUrl(e.target.value)}
                            placeholder="Veya görsel URL'sini buraya yapıştırın"
                            className="w-full px-3 py-2 text-[10px] bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Makale İçeriği</label>
                      <textarea
                        required
                        rows={10}
                        value={blogFormContent}
                        onChange={(e) => setBlogFormContent(e.target.value)}
                        placeholder="Makalenizin tüm detaylarını buraya yazın. Satır başları ve paragraflar aynen korunacaktır..."
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 resize-none font-sans"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-amber-600 text-white font-bold text-xs rounded-xl hover:bg-amber-700 transition-all cursor-pointer shadow-sm shadow-amber-500/10 flex items-center justify-center gap-1.5"
                  >
                    <BookOpen className="w-4 h-4" /> {editingBlogId ? "Blog Yazısını Güncelle" : "Blog Yazısını Yayınla"}
                  </button>
                </form>

                {/* Yayınlanmış Makaleler Listesi */}
                <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Kayıtlı Makaleler ({blogs.length})</h3>
                    <span className="text-[10px] text-slate-400 font-medium">Anlık Güncelleme</span>
                  </div>

                  {blogs.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 space-y-2">
                      <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs font-medium">Sistemde henüz yayınlanmış blog yazısı bulunmuyor.</p>
                      <p className="text-[10px] text-slate-400">Soldaki formu doldurarak ilk içeriğinizi yayınlayabilirsiniz.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
                      {blogs.map((blog) => (
                        <div
                          key={blog.id}
                          className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex gap-4 hover:border-slate-200 hover:shadow-sm transition-all"
                        >
                          {blog.imageUrl ? (
                            <img
                              src={blog.imageUrl}
                              alt={blog.title}
                              className="w-20 h-20 object-cover rounded-xl border border-slate-200 shrink-0 bg-white"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0 text-white font-bold text-xs">
                              {blog.tag}
                            </div>
                          )}

                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  {blog.tag}
                                </span>
                                <span className="text-[9px] text-slate-400">
                                  {blog.createdAt ? new Date(blog.createdAt).toLocaleDateString("tr-TR") : ""}
                                </span>
                              </div>
                              <h4 className="text-xs font-bold text-slate-900 truncate">
                                {blog.title}
                              </h4>
                              <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                                {blog.content}
                              </p>
                            </div>

                            <div className="flex gap-2 justify-end pt-2">
                              <button
                                type="button"
                                onClick={() => handleEditBlog(blog)}
                                className="px-2.5 py-1 text-[10px] font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                              >
                                Düzenle
                              </button>
                              <button
                                type="button"
                                onClick={() => blog.id && handleDeleteBlog(blog.id)}
                                className="px-2.5 py-1 text-[10px] font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                              >
                                Sil
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SITE CUSTOMIZER TAB */}
          {activeTab === "site_customizer" && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold font-display text-slate-900">Site Canlı Özelleştirici ve Yönetici Paneli</h2>
                  <p className="text-xs text-slate-500">Logodan metinlere, menülerden renklere kadar tüm platformu özelleştirin. Sağdaki simülatörden anlık izleyin!</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-slate-700 text-xs font-semibold">
                  {savingSettings ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      <span>Anlık Değişiklikler Kaydediliyor...</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Tüm değişiklikler anlık kaydedildi & yayında!</span>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                {/* Customizer controls */}
                <div className="xl:col-span-7 space-y-6">
                  {/* LOGO VE MARKA */}
                  <div 
                    className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4"
                    onFocusCapture={() => setPreviewActiveTab("home")}
                  >
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600"><Settings className="w-4 h-4" /></div>
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Logo ve Genel Marka</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Logo Tipi</label>
                        <select
                          value={siteSettings.logoType}
                          onChange={(e: any) => setSiteSettings({ ...siteSettings, logoType: e.target.value })}
                          className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
                        >
                          <option value="duck">NakNak Özgün Logosu (SVG)</option>
                          <option value="custom_url">Özel Logo (Cihazdan Yükle veya URL)</option>
                        </select>
                      </div>

                      {siteSettings.logoType === "custom_url" && (
                        <div className="space-y-3">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Logo Görsel Ayarları</label>
                          <div className="flex gap-3 items-center">
                            {siteSettings.customLogoUrl && (
                              <div className="relative w-12 h-12 shrink-0 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group flex items-center justify-center">
                                <img 
                                  src={siteSettings.customLogoUrl} 
                                  alt="Özel Logo" 
                                  className="w-full h-full object-contain p-1" 
                                  referrerPolicy="no-referrer" 
                                />
                                <button
                                  type="button"
                                  onClick={() => setSiteSettings({ ...siteSettings, customLogoUrl: "" })}
                                  className="absolute inset-0 bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-bold"
                                >
                                  Sil
                                </button>
                              </div>
                            )}
                            <div className="flex-1 space-y-2">
                              <input
                                type="file"
                                id="logo-file-upload"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    compressImageToBase64(file, (base64) => {
                                      setSiteSettings({ ...siteSettings, customLogoUrl: base64 });
                                    });
                                  }
                                }}
                                className="hidden"
                              />
                              <label
                                htmlFor="logo-file-upload"
                                className="cursor-pointer block text-center py-2 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-xl text-[10px] font-bold text-blue-600 transition-colors"
                              >
                                Cihazdan Logo Dosyası Seçin
                              </label>
                              
                              <input
                                type="text"
                                value={siteSettings.customLogoUrl || ""}
                                onChange={(e) => setSiteSettings({ ...siteSettings, customLogoUrl: e.target.value })}
                                placeholder="Veya logo görsel URL'sini buraya girin"
                                className="w-full px-3 py-2 text-[10px] bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Uygulama / Site Adı</label>
                        <input
                          type="text"
                          value={siteSettings.appName}
                          onChange={(e) => setSiteSettings({ ...siteSettings, appName: e.target.value })}
                          placeholder="NakNak-Nakliye"
                          className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Slogan / Alt Başlık</label>
                        <input
                          type="text"
                          value={siteSettings.appSlogan}
                          onChange={(e) => setSiteSettings({ ...siteSettings, appSlogan: e.target.value })}
                          placeholder="Güvenli ve Kolay Taşın! 🚚"
                          className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                    {/* TEMA RENKLERİ */}
                    <div 
                      className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6"
                      onFocusCapture={() => setPreviewActiveTab("home")}
                    >
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                        <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600"><Palette className="w-4 h-4" /></div>
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Renk ve Kurumsal Kimlik</h3>
                      </div>

                      {/* Hazır Kombinasyonlar */}
                      <div className="space-y-2.5">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Önerilen Hazır Renk Kombinasyonları</span>
                          <span className="text-[9px] text-slate-400">Tek tıkla uyumlu kurumsal renk şemalarını uygulayabilirsiniz.</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { name: "Varsayılan (Turuncu & Slate)", primary: "#EA580C", accent: "#1E293B" },
                            { name: "Kurumsal Güven (Mavi & Turuncu)", primary: "#2563EB", accent: "#F97316" },
                            { name: "Teknoloji & Vizyon (Mor & Pembe)", primary: "#8B5CF6", accent: "#EC4899" },
                            { name: "Ekolojik Doğa (Yeşil & Kehribar)", primary: "#059669", accent: "#D97706" },
                            { name: "Lüks & Premium (Gece & Altın)", primary: "#0F172A", accent: "#EAB308" },
                            { name: "Serin Okyanus (Teal & Camgöbeği)", primary: "#0D9488", accent: "#0EA5E9" },
                            { name: "Zarif Bordo & Çelik Gri", primary: "#881337", accent: "#64748B" },
                            { name: "Siber Punk (Siyah & Neon Yeşil)", primary: "#090D16", accent: "#22C55E" },
                          ].map((p, idx) => {
                            const isSelected = siteSettings.primaryColor.toUpperCase() === p.primary.toUpperCase() && siteSettings.accentColor.toUpperCase() === p.accent.toUpperCase();
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setSiteSettings({ ...siteSettings, primaryColor: p.primary, accentColor: p.accent })}
                                className={`p-2 rounded-2xl border text-left flex flex-col gap-1.5 cursor-pointer transition-all hover:bg-slate-50 ${
                                  isSelected ? "border-slate-900 bg-slate-50/50 ring-2 ring-slate-900/10" : "border-slate-100 bg-white"
                                }`}
                              >
                                <span className="text-[9px] font-bold text-slate-700 truncate block">{p.name}</span>
                                <div className="flex items-center gap-1">
                                  <div className="w-5 h-5 rounded-lg border border-white shadow-sm" style={{ backgroundColor: p.primary }} />
                                  <div className="w-5 h-5 rounded-lg border border-white shadow-sm" style={{ backgroundColor: p.accent }} />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
                        {/* Birincil Renk */}
                        <div className="space-y-3">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Birincil Renk (Primary)</label>
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={siteSettings.primaryColor}
                              onChange={(e) => setSiteSettings({ ...siteSettings, primaryColor: e.target.value })}
                              className="w-10 h-10 border-0 rounded-lg overflow-hidden cursor-pointer"
                            />
                            <input
                              type="text"
                              value={siteSettings.primaryColor}
                              onChange={(e) => setSiteSettings({ ...siteSettings, primaryColor: e.target.value })}
                              className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wide">Renk Paleti Seçenekleri</span>
                            <div className="grid grid-cols-7 gap-1.5 pt-1">
                              {[
                                "#EA580C", "#2563EB", "#3B82F6", "#1D4ED8", "#1E40AF", "#10B981", "#059669",
                                "#0D9488", "#14B8A6", "#8B5CF6", "#7C3AED", "#6D28D9", "#D946EF", "#EC4899",
                                "#EF4444", "#DC2626", "#B91C1C", "#F59E0B", "#F97316", "#475569", "#0F172A"
                              ].map((c) => {
                                const isCurrent = siteSettings.primaryColor.toUpperCase() === c.toUpperCase();
                                return (
                                  <button
                                    key={c}
                                    type="button"
                                    onClick={() => setSiteSettings({ ...siteSettings, primaryColor: c })}
                                    className={`w-6 h-6 rounded-full cursor-pointer transition-all hover:scale-115 relative flex items-center justify-center ${
                                      isCurrent ? "ring-2 ring-offset-2 ring-slate-800 scale-110 z-10" : "border border-slate-200"
                                    }`}
                                    style={{ backgroundColor: c }}
                                    title={c}
                                  >
                                    {isCurrent && (
                                      <div className="w-1.5 h-1.5 bg-white rounded-full shadow-sm" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Vurgu Rengi */}
                        <div className="space-y-3">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Vurgu Rengi (Accent)</label>
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={siteSettings.accentColor}
                              onChange={(e) => setSiteSettings({ ...siteSettings, accentColor: e.target.value })}
                              className="w-10 h-10 border-0 rounded-lg overflow-hidden cursor-pointer"
                            />
                            <input
                              type="text"
                              value={siteSettings.accentColor}
                              onChange={(e) => setSiteSettings({ ...siteSettings, accentColor: e.target.value })}
                              className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wide">Renk Paleti Seçenekleri</span>
                            <div className="grid grid-cols-7 gap-1.5 pt-1">
                              {[
                                "#F59E0B", "#FBBF24", "#D97706", "#F97316", "#EA580C", "#0EA5E9", "#3B82F6",
                                "#10B981", "#84CC16", "#A3E635", "#EC4899", "#D946EF", "#8B5CF6", "#E11D48",
                                "#EF4444", "#06B6D4", "#14B8A6", "#64748B", "#334155", "#1E293B", "#0F172A"
                              ].map((c) => {
                                const isCurrent = siteSettings.accentColor.toUpperCase() === c.toUpperCase();
                                return (
                                  <button
                                    key={c}
                                    type="button"
                                    onClick={() => setSiteSettings({ ...siteSettings, accentColor: c })}
                                    className={`w-6 h-6 rounded-full cursor-pointer transition-all hover:scale-115 relative flex items-center justify-center ${
                                      isCurrent ? "ring-2 ring-offset-2 ring-slate-800 scale-110 z-10" : "border border-slate-200"
                                    }`}
                                    style={{ backgroundColor: c }}
                                    title={c}
                                  >
                                    {isCurrent && (
                                      <div className="w-1.5 h-1.5 bg-white rounded-full shadow-sm" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                  {/* METİN İÇERİKLERİ */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600"><FileText className="w-4 h-4" /></div>
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Ana Sayfa Kahraman (Hero) & Footer</h3>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kahraman Rozeti (Hero Badge)</label>
                      <input
                        type="text"
                        value={siteSettings.heroBadgeText}
                        onChange={(e) => setSiteSettings({ ...siteSettings, heroBadgeText: e.target.value })}
                        placeholder="Komisyonsuz NakNak-Nakliye Platformu 🦆"
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kahraman Başlığı (Hero Title)</label>
                      <input
                        type="text"
                        value={siteSettings.heroTitle}
                        onChange={(e) => setSiteSettings({ ...siteSettings, heroTitle: e.target.value })}
                        placeholder="Güvenli, Hızlı ve Stressiz Taşının."
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kahraman Açıklaması (Hero Description)</label>
                      <textarea
                        rows={3}
                        value={siteSettings.heroDescription}
                        onChange={(e) => setSiteSettings({ ...siteSettings, heroDescription: e.target.value })}
                        placeholder="Talebinizi saniyeler içinde oluşturun..."
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all resize-none font-sans"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Alt Bilgi Açıklaması (Footer Description)</label>
                      <textarea
                        rows={3}
                        value={siteSettings.footerDescription}
                        onChange={(e) => setSiteSettings({ ...siteSettings, footerDescription: e.target.value })}
                        placeholder="Türkiye'nin öncü teklif usulü komisyonsuz..."
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all resize-none font-sans"
                      />
                    </div>
                  </div>

                  {/* MENÜ BAŞLIKLARI */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <div className="p-1.5 bg-purple-50 rounded-lg text-purple-600"><Grid className="w-4 h-4" /></div>
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Navigasyon ve Menü Başlıkları</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Ana Sayfa</label>
                        <input
                          type="text"
                          value={siteSettings.menuHomeText}
                          onChange={(e) => setSiteSettings({ ...siteSettings, menuHomeText: e.target.value })}
                          placeholder="Ana Sayfa"
                          className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Keşfet</label>
                        <input
                          type="text"
                          value={siteSettings.menuDiscoverText}
                          onChange={(e) => setSiteSettings({ ...siteSettings, menuDiscoverText: e.target.value })}
                          placeholder="Keşfet"
                          className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Talep Aç</label>
                        <input
                          type="text"
                          value={siteSettings.menuCreateRequestText}
                          onChange={(e) => setSiteSettings({ ...siteSettings, menuCreateRequestText: e.target.value })}
                          placeholder="Talep Aç"
                          className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Yönetici/Panel</label>
                        <input
                          type="text"
                          value={siteSettings.menuDashboardText}
                          onChange={(e) => setSiteSettings({ ...siteSettings, menuDashboardText: e.target.value })}
                          placeholder="Panelim"
                          className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sohbetler</label>
                        <input
                          type="text"
                          value={siteSettings.menuChatsText}
                          onChange={(e) => setSiteSettings({ ...siteSettings, menuChatsText: e.target.value })}
                          placeholder="Sohbet"
                          className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Profil</label>
                        <input
                          type="text"
                          value={siteSettings.menuProfileText}
                          onChange={(e) => setSiteSettings({ ...siteSettings, menuProfileText: e.target.value })}
                          placeholder="Profilim"
                          className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* HERO SLOGAN KARTI VE BUTONLAR */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600"><Sparkles className="w-4 h-4" /></div>
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Slogan Kartı & Hero Butonları</h3>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={siteSettings.showHeroSloganCard !== false}
                          onChange={(e) => setSiteSettings({ ...siteSettings, showHeroSloganCard: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="relative w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                        <span className="ml-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kartı Göster</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Buton: Talep Oluştur</label>
                        <input
                          type="text"
                          value={siteSettings.heroButtonRequestText || ""}
                          onChange={(e) => setSiteSettings({ ...siteSettings, heroButtonRequestText: e.target.value })}
                          placeholder="Hemen Talep Oluştur"
                          className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Buton: Firmaları Keşfet</label>
                        <input
                          type="text"
                          value={siteSettings.heroButtonDiscoverText || ""}
                          onChange={(e) => setSiteSettings({ ...siteSettings, heroButtonDiscoverText: e.target.value })}
                          placeholder="Firmaları Keşfet"
                          className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>

                    {(siteSettings.showHeroSloganCard !== false) && (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 animate-in fade-in duration-200">
                        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Görsel Kaydıraç (Slider) Ayarları</span>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                          {/* SÜRE AYARI */}
                          <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Geçiş Süresi (Saniye)</label>
                            <input
                              type="number"
                              min={1}
                              max={60}
                              value={siteSettings.heroSliderInterval || 5}
                              onChange={(e) => setSiteSettings({ ...siteSettings, heroSliderInterval: parseInt(e.target.value) || 5 })}
                              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                            />
                            <p className="text-[9px] text-slate-400">Görsellerin otomatik geçiş süresidir (varsayılan: 5 sn).</p>
                          </div>

                          {/* GÖRSEL 1 AYARI */}
                          <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-3">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">1. Görsel (Slide 1)</label>
                            
                            {siteSettings.heroSliderImage1 && siteSettings.heroSliderImage1.startsWith("data:") ? (
                              <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 group">
                                <img src={siteSettings.heroSliderImage1} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                <button
                                  type="button"
                                  onClick={() => setSiteSettings({ ...siteSettings, heroSliderImage1: "/img/kare1.png" })}
                                  className="absolute inset-0 bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold"
                                >
                                  Sıfırla
                                </button>
                              </div>
                            ) : null}

                            <div className="space-y-1">
                              <input
                                type="text"
                                value={siteSettings.heroSliderImage1 || ""}
                                onChange={(e) => setSiteSettings({ ...siteSettings, heroSliderImage1: e.target.value })}
                                placeholder="/img/kare1.png"
                                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-mono"
                              />
                              <p className="text-[9px] text-slate-400">Yol girin veya bilgisayardan seçin:</p>
                            </div>

                            <div>
                              <input
                                type="file"
                                id="slider-img-1-upload"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleFileSelectForCropping(file, "heroSliderImage1");
                                  }
                                }}
                                className="hidden"
                              />
                              <label
                                htmlFor="slider-img-1-upload"
                                className="cursor-pointer block text-center py-2 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-[10px] font-bold text-blue-600 hover:bg-blue-50/50 transition-colors"
                              >
                                Dosya Yükle
                              </label>
                            </div>
                          </div>

                          {/* GÖRSEL 2 AYARI */}
                          <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-3">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">2. Görsel (Slide 2)</label>
                            
                            {siteSettings.heroSliderImage2 && siteSettings.heroSliderImage2.startsWith("data:") ? (
                              <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 group">
                                <img src={siteSettings.heroSliderImage2} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                <button
                                  type="button"
                                  onClick={() => setSiteSettings({ ...siteSettings, heroSliderImage2: "/img/kare2.png" })}
                                  className="absolute inset-0 bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold"
                                >
                                  Sıfırla
                                </button>
                              </div>
                            ) : null}

                            <div className="space-y-1">
                              <input
                                type="text"
                                value={siteSettings.heroSliderImage2 || ""}
                                onChange={(e) => setSiteSettings({ ...siteSettings, heroSliderImage2: e.target.value })}
                                placeholder="/img/kare2.png"
                                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-mono"
                              />
                              <p className="text-[9px] text-slate-400">Yol girin veya bilgisayardan seçin:</p>
                            </div>

                            <div>
                              <input
                                type="file"
                                id="slider-img-2-upload"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleFileSelectForCropping(file, "heroSliderImage2");
                                  }
                                }}
                                className="hidden"
                              />
                              <label
                                htmlFor="slider-img-2-upload"
                                className="cursor-pointer block text-center py-2 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-[10px] font-bold text-blue-600 hover:bg-blue-50/50 transition-colors"
                              >
                                Dosya Yükle
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ANA SAYFA ARKA PLAN GÖRSELİ */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600"><Settings className="w-4 h-4" /></div>
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Ana Sayfa Arka Plan Görseli</h3>
                    </div>

                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        <div className="relative w-20 h-20 shrink-0 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 group flex items-center justify-center">
                          <img 
                            src={siteSettings.heroBackgroundImage || "/img/2.png"} 
                            alt="Arka Plan Önizleme" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer" 
                          />
                          {(siteSettings.heroBackgroundImage && siteSettings.heroBackgroundImage !== "/img/2.png") && (
                            <button
                              type="button"
                              onClick={() => setSiteSettings({ ...siteSettings, heroBackgroundImage: "/img/2.png" })}
                              className="absolute inset-0 bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold cursor-pointer"
                            >
                              Sıfırla
                            </button>
                          )}
                        </div>

                        <div className="flex-1 w-full space-y-2">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cihazdan Yeni Arka Plan Resmi Seçin</label>
                          <input
                            type="file"
                            id="hero-bg-file-upload"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileSelectForCropping(file, "heroBackgroundImage");
                              }
                            }}
                            className="hidden"
                          />
                          <label
                            htmlFor="hero-bg-file-upload"
                            className="cursor-pointer block text-center py-2 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-xl text-[10px] font-bold text-blue-600 transition-colors"
                          >
                            Dosya Yükle (Resim Seç)
                          </label>
                          
                          <input
                            type="text"
                            value={siteSettings.heroBackgroundImage || ""}
                            onChange={(e) => setSiteSettings({ ...siteSettings, heroBackgroundImage: e.target.value })}
                            placeholder="Veya resim URL'si girin (Örn: /img/2.png)"
                            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all font-mono"
                          />
                        </div>
                      </div>

                      {/* Arka Plan Şeffaflığı (Opacity) */}
                      <div className="space-y-1.5 pt-4 border-t border-slate-100">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Arka Plan Görseli Şeffaflığı (% Opacity)</span>
                          <span className="font-mono text-slate-600 font-semibold bg-slate-100 px-2 py-0.5 rounded text-xs">%{siteSettings.heroBackgroundImageOpacity ?? 45}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={siteSettings.heroBackgroundImageOpacity ?? 45}
                            onChange={(e) => setSiteSettings({ ...siteSettings, heroBackgroundImageOpacity: parseInt(e.target.value) })}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
                          />
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-400">
                        Ana sayfadaki ana bölümün (hero kısmı) arka planında hafif saydam olarak duracak resmi belirler. Varsayılan resim <strong>/img/2.png</strong> dosyasıdır.
                      </p>
                    </div>
                  </div>

                  {/* SAYFA SAYAÇLARI (İSTATİSTİKLER) */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-sky-50 rounded-lg text-sky-600"><Smartphone className="w-4 h-4" /></div>
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Sayfa Sayaçları (İstatistikler)</h3>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={siteSettings.showStatsRow}
                          onChange={(e) => setSiteSettings({ ...siteSettings, showStatsRow: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="relative w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        <span className="ml-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aktif/Pasif</span>
                      </label>
                    </div>

                    {siteSettings.showStatsRow && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">İstatistik Modu</label>
                          <select
                            value={siteSettings.statsMode || "real"}
                            onChange={(e) => setSiteSettings({ ...siteSettings, statsMode: e.target.value as "real" | "custom" })}
                            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                          >
                            <option value="real">Canlı Veri Modu (Veritabanındaki gerçek firma ve başarılı talepler)</option>
                            <option value="custom">Sabit El İle Girilen Mod (Kendi girdiğiniz metinler görünür)</option>
                          </select>
                        </div>

                        <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          {/* 1. Kayıtlı Firma */}
                          <div className="flex items-center justify-between">
                            <label className="flex items-center cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={siteSettings.showFirmsCount !== false}
                                onChange={(e) => setSiteSettings({ ...siteSettings, showFirmsCount: e.target.checked })}
                                className="mr-2"
                              />
                              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Kayıtlı Firma Sayacı Göster</span>
                            </label>
                            {siteSettings.statsMode === "custom" && siteSettings.showFirmsCount !== false && (
                              <input
                                type="text"
                                value={siteSettings.customFirmsText || ""}
                                onChange={(e) => setSiteSettings({ ...siteSettings, customFirmsText: e.target.value })}
                                placeholder="500+"
                                className="w-24 px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
                              />
                            )}
                          </div>

                          {/* 2. Başarılı Taşıma */}
                          <div className="flex items-center justify-between border-t border-slate-200/55 pt-2">
                            <label className="flex items-center cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={siteSettings.showTransfersCount !== false}
                                onChange={(e) => setSiteSettings({ ...siteSettings, showTransfersCount: e.target.checked })}
                                className="mr-2"
                              />
                              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Başarılı Taşıma Sayacı Göster</span>
                            </label>
                            {siteSettings.statsMode === "custom" && siteSettings.showTransfersCount !== false && (
                              <input
                                type="text"
                                value={siteSettings.customTransfersText || ""}
                                onChange={(e) => setSiteSettings({ ...siteSettings, customTransfersText: e.target.value })}
                                placeholder="12k+"
                                className="w-24 px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
                              />
                            )}
                          </div>

                          {/* 3. Memnuniyet Oranı */}
                          <div className="flex items-center justify-between border-t border-slate-200/55 pt-2">
                            <label className="flex items-center cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={siteSettings.showSatisfactionRate !== false}
                                onChange={(e) => setSiteSettings({ ...siteSettings, showSatisfactionRate: e.target.checked })}
                                className="mr-2"
                              />
                              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Memnuniyet Oranı Göster</span>
                            </label>
                            {siteSettings.statsMode === "custom" && siteSettings.showSatisfactionRate !== false && (
                              <input
                                type="text"
                                value={siteSettings.customSatisfactionText || ""}
                                onChange={(e) => setSiteSettings({ ...siteSettings, customSatisfactionText: e.target.value })}
                                placeholder="99.4%"
                                className="w-24 px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* NEDEN BİZ / AVANTAJLAR BÖLÜMÜ */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600"><Shield className="w-4 h-4" /></div>
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Neden Biz? (Avantajlar Bölümü)</h3>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={siteSettings.showValuesSection !== false}
                          onChange={(e) => setSiteSettings({ ...siteSettings, showValuesSection: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="relative w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                        <span className="ml-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bölümü Göster</span>
                      </label>
                    </div>

                    {siteSettings.showValuesSection !== false && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        {/* Column 1 */}
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Sütun 1</span>
                          <input
                            type="text"
                            value={siteSettings.value1Title || ""}
                            onChange={(e) => setSiteSettings({ ...siteSettings, value1Title: e.target.value })}
                            placeholder="Doğrulanmış Firmalar"
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none font-bold"
                          />
                          <textarea
                            rows={2}
                            value={siteSettings.value1Desc || ""}
                            onChange={(e) => setSiteSettings({ ...siteSettings, value1Desc: e.target.value })}
                            placeholder="Tüm teklif veren şirketler..."
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none resize-none"
                          />
                        </div>

                        {/* Column 2 */}
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Sütun 2</span>
                          <input
                            type="text"
                            value={siteSettings.value2Title || ""}
                            onChange={(e) => setSiteSettings({ ...siteSettings, value2Title: e.target.value })}
                            placeholder="Aracısız & Komisyonsuz"
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none font-bold"
                          />
                          <textarea
                            rows={2}
                            value={siteSettings.value2Desc || ""}
                            onChange={(e) => setSiteSettings({ ...siteSettings, value2Desc: e.target.value })}
                            placeholder="Online ödeme zorunluluğu yok..."
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none resize-none"
                          />
                        </div>

                        {/* Column 3 */}
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Sütun 3</span>
                          <input
                            type="text"
                            value={siteSettings.value3Title || ""}
                            onChange={(e) => setSiteSettings({ ...siteSettings, value3Title: e.target.value })}
                            placeholder="Gerçek Zamanlı Sohbet"
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none font-bold"
                          />
                          <textarea
                            rows={2}
                            value={siteSettings.value3Desc || ""}
                            onChange={(e) => setSiteSettings({ ...siteSettings, value3Desc: e.target.value })}
                            placeholder="İletişime geçmek için telefon..."
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none resize-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* NAKLİYAT FİRMASI KAYIT ALANI CTA BANNER */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600"><Users className="w-4 h-4" /></div>
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Firma Kayıt Alanı (CTA Banner)</h3>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={siteSettings.showCarrierCTA !== false}
                          onChange={(e) => setSiteSettings({ ...siteSettings, showCarrierCTA: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="relative w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                        <span className="ml-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bölümü Göster</span>
                      </label>
                    </div>

                    {siteSettings.showCarrierCTA !== false && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Küçük Rozet Metni</label>
                          <input
                            type="text"
                            value={siteSettings.carrierCTABadge || ""}
                            onChange={(e) => setSiteSettings({ ...siteSettings, carrierCTABadge: e.target.value })}
                            placeholder="Nakliyat Firmaları İçin"
                            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Başlık</label>
                          <input
                            type="text"
                            value={siteSettings.carrierCTATitle || ""}
                            onChange={(e) => setSiteSettings({ ...siteSettings, carrierCTATitle: e.target.value })}
                            placeholder="Platformumuzda Yer Alarak İşlerinizi Büyütün"
                            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Açıklama Metni</label>
                          <textarea
                            rows={3}
                            value={siteSettings.carrierCTADesc || ""}
                            onChange={(e) => setSiteSettings({ ...siteSettings, carrierCTADesc: e.target.value })}
                            placeholder="Her gün yüzlerce müşteri evden eve nakliye..."
                            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all resize-none font-sans"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Birincil Buton Metni (Beyaz)</label>
                            <input
                              type="text"
                              value={siteSettings.carrierCTAPrimaryBtn || ""}
                              onChange={(e) => setSiteSettings({ ...siteSettings, carrierCTAPrimaryBtn: e.target.value })}
                              placeholder="Hemen Ücretsiz Firma Kaydı Aç"
                              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">İkincil Buton Metni (Mavi)</label>
                            <input
                              type="text"
                              value={siteSettings.carrierCTASecondaryBtn || ""}
                              onChange={(e) => setSiteSettings({ ...siteSettings, carrierCTASecondaryBtn: e.target.value })}
                              placeholder="Firma Girişi Yap"
                              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* DETAYLI GÖRSEL TASARIM & STİLLER */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <div className="p-1.5 bg-rose-50 rounded-lg text-rose-600"><Palette className="w-4 h-4" /></div>
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Gelişmiş Buton & Kart Görsel Tasarımları</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sayfa Arka Plan Rengi</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={siteSettings.bodyBgColor || "#f8fafc"}
                            onChange={(e) => setSiteSettings({ ...siteSettings, bodyBgColor: e.target.value })}
                            className="w-8 h-8 border-0 rounded-lg overflow-hidden cursor-pointer shrink-0"
                          />
                          <input
                            type="text"
                            value={siteSettings.bodyBgColor || "#f8fafc"}
                            onChange={(e) => setSiteSettings({ ...siteSettings, bodyBgColor: e.target.value })}
                            className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kart Arka Plan Rengi</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={siteSettings.cardBgColor || "#ffffff"}
                            onChange={(e) => setSiteSettings({ ...siteSettings, cardBgColor: e.target.value })}
                            className="w-8 h-8 border-0 rounded-lg overflow-hidden cursor-pointer shrink-0"
                          />
                          <input
                            type="text"
                            value={siteSettings.cardBgColor || "#ffffff"}
                            onChange={(e) => setSiteSettings({ ...siteSettings, cardBgColor: e.target.value })}
                            className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Buton Yazı Rengi</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={siteSettings.buttonTextColor || "#ffffff"}
                            onChange={(e) => setSiteSettings({ ...siteSettings, buttonTextColor: e.target.value })}
                            className="w-8 h-8 border-0 rounded-lg overflow-hidden cursor-pointer shrink-0"
                          />
                          <input
                            type="text"
                            value={siteSettings.buttonTextColor || "#ffffff"}
                            onChange={(e) => setSiteSettings({ ...siteSettings, buttonTextColor: e.target.value })}
                            className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Buton Oval Yapısı (Roundedness)</label>
                        <select
                          value={siteSettings.buttonRoundedness || "rounded-xl"}
                          onChange={(e: any) => setSiteSettings({ ...siteSettings, buttonRoundedness: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                        >
                          <option value="rounded-none">Köşeli (Hiç Oval Değil)</option>
                          <option value="rounded-md">Hafif Oval (Medium)</option>
                          <option value="rounded-xl">Standart Oval (XLarge)</option>
                          <option value="rounded-3xl">Çok Oval (3XLarge)</option>
                          <option value="rounded-full">Tam Oval (Pill)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Yazı Tipi (Font Family)</label>
                        <select
                          value={siteSettings.fontFamily || "font-sans"}
                          onChange={(e: any) => setSiteSettings({ ...siteSettings, fontFamily: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                        >
                          <option value="font-sans">Inter Sans (Modern & Temiz)</option>
                          <option value="font-mono">JetBrains Mono (Kod & Teknik)</option>
                          <option value="font-serif">Playfair Serif (Zarif & Editöryal)</option>
                          <option value="font-display">Space Grotesk (Display / Teknolojik)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* TALEP OLUŞTURMA SAYFASI ÖZELLEŞTİRME */}
                  <div 
                    className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4"
                    onFocusCapture={() => setPreviewActiveTab("request_form")}
                  >
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600"><FileText className="w-4 h-4" /></div>
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Talep Oluşturma Sayfası Düzenlemesi</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sayfa Ana Başlığı</label>
                        <input
                          type="text"
                          value={siteSettings.createRequestTitle || ""}
                          onChange={(e) => setSiteSettings({ ...siteSettings, createRequestTitle: e.target.value })}
                          placeholder="Yeni Nakliyat Talebi Oluştur"
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sayfa Alt Açıklaması</label>
                        <input
                          type="text"
                          value={siteSettings.createRequestSub || ""}
                          onChange={(e) => setSiteSettings({ ...siteSettings, createRequestSub: e.target.value })}
                          placeholder="Eşya detaylarınızı girin, firmalardan teklif toplayın."
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Yükleme Konumu Giriş Etiketi</label>
                        <input
                          type="text"
                          value={siteSettings.createRequestFormPickupLabel || ""}
                          onChange={(e) => setSiteSettings({ ...siteSettings, createRequestFormPickupLabel: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Teslimat Konumu Giriş Etiketi</label>
                        <input
                          type="text"
                          value={siteSettings.createRequestFormDestinationLabel || ""}
                          onChange={(e) => setSiteSettings({ ...siteSettings, createRequestFormDestinationLabel: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Yayınlama Buton Metni (Gönder Butonu)</label>
                        <input
                          type="text"
                          value={siteSettings.createRequestSubmitBtnText || ""}
                          onChange={(e) => setSiteSettings({ ...siteSettings, createRequestSubmitBtnText: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Oda Sayısı Giriş Etiketi</label>
                        <input
                          type="text"
                          value={siteSettings.createRequestFormRoomsLabel || ""}
                          onChange={(e) => setSiteSettings({ ...siteSettings, createRequestFormRoomsLabel: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>

                  {/* KULLANICI PANELLERİ BUTONLARI VE ETİKETLERİ */}
                  <div 
                    className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4"
                    onFocusCapture={() => setPreviewActiveTab("dashboard")}
                  >
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600"><Grid className="w-4 h-4" /></div>
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Kullanıcı Paneli & Dashboard Butonları</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Müşteri: Talep Açma Buton Metni</label>
                        <input
                          type="text"
                          value={siteSettings.dashboardCreateRequestBtnText || ""}
                          onChange={(e) => setSiteSettings({ ...siteSettings, dashboardCreateRequestBtnText: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Müşteri: Teklifleri İncele Butonu</label>
                        <input
                          type="text"
                          value={siteSettings.dashboardViewOffersBtnText || ""}
                          onChange={(e) => setSiteSettings({ ...siteSettings, dashboardViewOffersBtnText: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Firma: Teklif Verme Buton Metni</label>
                        <input
                          type="text"
                          value={siteSettings.dashboardGiveOfferBtnText || ""}
                          onChange={(e) => setSiteSettings({ ...siteSettings, dashboardGiveOfferBtnText: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Müşteri/Firma: İptal Et Buton Metni</label>
                        <input
                          type="text"
                          value={siteSettings.requestCancelBtnText || ""}
                          onChange={(e) => setSiteSettings({ ...siteSettings, requestCancelBtnText: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>

                  {/* GELİŞMİŞ GLOBAL RENKLER */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <div className="p-1.5 bg-rose-50 rounded-lg text-rose-600"><Palette className="w-4 h-4" /></div>
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Header, Footer ve Buton Gelişmiş Renkleri</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Header Arka Plan Rengi</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={siteSettings.headerBgColor || "#ffffff"}
                            onChange={(e) => setSiteSettings({ ...siteSettings, headerBgColor: e.target.value })}
                            className="w-8 h-8 border-0 rounded-lg overflow-hidden cursor-pointer shrink-0"
                          />
                          <input
                            type="text"
                            value={siteSettings.headerBgColor || "#ffffff"}
                            onChange={(e) => setSiteSettings({ ...siteSettings, headerBgColor: e.target.value })}
                            className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Header Yazı Rengi</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={siteSettings.headerTextColor || "#0f172a"}
                            onChange={(e) => setSiteSettings({ ...siteSettings, headerTextColor: e.target.value })}
                            className="w-8 h-8 border-0 rounded-lg overflow-hidden cursor-pointer shrink-0"
                          />
                          <input
                            type="text"
                            value={siteSettings.headerTextColor || "#0f172a"}
                            onChange={(e) => setSiteSettings({ ...siteSettings, headerTextColor: e.target.value })}
                            className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Footer Arka Plan Rengi</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={siteSettings.footerBgColor || "#0f172a"}
                            onChange={(e) => setSiteSettings({ ...siteSettings, footerBgColor: e.target.value })}
                            className="w-8 h-8 border-0 rounded-lg overflow-hidden cursor-pointer shrink-0"
                          />
                          <input
                            type="text"
                            value={siteSettings.footerBgColor || "#0f172a"}
                            onChange={(e) => setSiteSettings({ ...siteSettings, footerBgColor: e.target.value })}
                            className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Footer Yazı Rengi</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={siteSettings.footerTextColor || "#94a3b8"}
                            onChange={(e) => setSiteSettings({ ...siteSettings, footerTextColor: e.target.value })}
                            className="w-8 h-8 border-0 rounded-lg overflow-hidden cursor-pointer shrink-0"
                          />
                          <input
                            type="text"
                            value={siteSettings.footerTextColor || "#94a3b8"}
                            onChange={(e) => setSiteSettings({ ...siteSettings, footerTextColor: e.target.value })}
                            className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Birincil Buton Rengi (CTA Button Bg)</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={siteSettings.buttonBgColor || "#EA580C"}
                            onChange={(e) => setSiteSettings({ ...siteSettings, buttonBgColor: e.target.value })}
                            className="w-8 h-8 border-0 rounded-lg overflow-hidden cursor-pointer shrink-0"
                          />
                          <input
                            type="text"
                            value={siteSettings.buttonBgColor || "#EA580C"}
                            onChange={(e) => setSiteSettings({ ...siteSettings, buttonBgColor: e.target.value })}
                            className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Birincil Buton Hover Rengi</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={siteSettings.buttonHoverBgColor || "#C2410C"}
                            onChange={(e) => setSiteSettings({ ...siteSettings, buttonHoverBgColor: e.target.value })}
                            className="w-8 h-8 border-0 rounded-lg overflow-hidden cursor-pointer shrink-0"
                          />
                          <input
                            type="text"
                            value={siteSettings.buttonHoverBgColor || "#C2410C"}
                            onChange={(e) => setSiteSettings({ ...siteSettings, buttonHoverBgColor: e.target.value })}
                            className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SSS VE BÖLÜM AKTİFLİKLERİ */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600"><CheckCircle className="w-4 h-4" /></div>
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Sayfa Bölümleri ve SSS Soru-Cevapları</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={siteSettings.showHowItWorksSection !== false}
                          onChange={(e) => setSiteSettings({ ...siteSettings, showHowItWorksSection: e.target.checked })}
                          className="rounded text-blue-600"
                        />
                        <span className="text-xs font-bold text-slate-700">Nasıl Çalışır Aktif</span>
                      </label>

                      <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={siteSettings.showFaqsSection !== false}
                          onChange={(e) => setSiteSettings({ ...siteSettings, showFaqsSection: e.target.checked })}
                          className="rounded text-blue-600"
                        />
                        <span className="text-xs font-bold text-slate-700">SSS Aktif</span>
                      </label>

                      <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={siteSettings.showBlogSection !== false}
                          onChange={(e) => setSiteSettings({ ...siteSettings, showBlogSection: e.target.checked })}
                          className="rounded text-blue-600"
                        />
                        <span className="text-xs font-bold text-slate-700">Blog Aktif</span>
                      </label>
                    </div>

                    {siteSettings.showFaqsSection !== false && (
                      <div className="space-y-4 pt-2">
                        <div className="p-4 bg-blue-50/40 rounded-2xl border border-blue-50 space-y-3">
                          <h4 className="text-xs font-black text-blue-800 uppercase tracking-wider">Sık Sorulan Soruları Özelleştir</h4>
                          
                          <div className="space-y-3.5">
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 uppercase">Soru 1</label>
                              <input
                                type="text"
                                value={siteSettings.faq1Question || ""}
                                onChange={(e) => setSiteSettings({ ...siteSettings, faq1Question: e.target.value })}
                                placeholder="Soru yazın..."
                                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl mt-1"
                              />
                              <label className="block text-[9px] font-bold text-slate-500 uppercase mt-2">Cevap 1</label>
                              <textarea
                                rows={2}
                                value={siteSettings.faq1Answer || ""}
                                onChange={(e) => setSiteSettings({ ...siteSettings, faq1Answer: e.target.value })}
                                placeholder="Cevap yazın..."
                                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl mt-1 font-sans"
                              />
                            </div>

                            <div className="border-t border-slate-100 pt-3">
                              <label className="block text-[9px] font-bold text-slate-500 uppercase">Soru 2</label>
                              <input
                                type="text"
                                value={siteSettings.faq2Question || ""}
                                onChange={(e) => setSiteSettings({ ...siteSettings, faq2Question: e.target.value })}
                                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl mt-1"
                              />
                              <label className="block text-[9px] font-bold text-slate-500 uppercase mt-2">Cevap 2</label>
                              <textarea
                                rows={2}
                                value={siteSettings.faq2Answer || ""}
                                onChange={(e) => setSiteSettings({ ...siteSettings, faq2Answer: e.target.value })}
                                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl mt-1 font-sans"
                              />
                            </div>

                            <div className="border-t border-slate-100 pt-3">
                              <label className="block text-[9px] font-bold text-slate-500 uppercase">Soru 3</label>
                              <input
                                type="text"
                                value={siteSettings.faq3Question || ""}
                                onChange={(e) => setSiteSettings({ ...siteSettings, faq3Question: e.target.value })}
                                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl mt-1"
                              />
                              <label className="block text-[9px] font-bold text-slate-500 uppercase mt-2">Cevap 3</label>
                              <textarea
                                rows={2}
                                value={siteSettings.faq3Answer || ""}
                                onChange={(e) => setSiteSettings({ ...siteSettings, faq3Answer: e.target.value })}
                                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl mt-1 font-sans"
                              />
                            </div>

                            <div className="border-t border-slate-100 pt-3">
                              <label className="block text-[9px] font-bold text-slate-500 uppercase">Soru 4 (Yeni)</label>
                              <input
                                type="text"
                                value={siteSettings.faq4Question || ""}
                                onChange={(e) => setSiteSettings({ ...siteSettings, faq4Question: e.target.value })}
                                placeholder="Ekstra soru sormak ister misiniz? Boş bırakırsanız gizlenir."
                                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl mt-1"
                              />
                              <label className="block text-[9px] font-bold text-slate-500 uppercase mt-2">Cevap 4</label>
                              <textarea
                                rows={2}
                                value={siteSettings.faq4Answer || ""}
                                onChange={(e) => setSiteSettings({ ...siteSettings, faq4Answer: e.target.value })}
                                placeholder="Ekstra cevap..."
                                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl mt-1 font-sans"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* KULLANICI PANELLERİ HOŞGELDİNİZ METİNLERİ */}
                  <div 
                    className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4"
                    onFocusCapture={() => setPreviewActiveTab("dashboard")}
                  >
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600"><Layers className="w-4 h-4" /></div>
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Kullanıcı Panelleri Karşılama Metinleri</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Müşteri Paneli Hoş Geldiniz Metni</label>
                        <input
                          type="text"
                          value={siteSettings.customerDashboardWelcomeText || ""}
                          onChange={(e) => setSiteSettings({ ...siteSettings, customerDashboardWelcomeText: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Müşteri Paneli Açıklaması</label>
                        <input
                          type="text"
                          value={siteSettings.customerDashboardSub || ""}
                          onChange={(e) => setSiteSettings({ ...siteSettings, customerDashboardSub: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Henüz Talebi Yok Boş State Metni</label>
                        <input
                          type="text"
                          value={siteSettings.customerDashboardNoRequestsText || ""}
                          onChange={(e) => setSiteSettings({ ...siteSettings, customerDashboardNoRequestsText: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Firma Paneli Hoş Geldiniz Metni</label>
                        <input
                          type="text"
                          value={siteSettings.companyDashboardWelcomeText || ""}
                          onChange={(e) => setSiteSettings({ ...siteSettings, companyDashboardWelcomeText: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Firma Paneli Açıklaması</label>
                        <input
                          type="text"
                          value={siteSettings.companyDashboardSub || ""}
                          onChange={(e) => setSiteSettings({ ...siteSettings, companyDashboardSub: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>

                  {/* GİRİŞ / KAYIT SAYFASI ÖZELLEŞTİRMELERİ */}
                  <div 
                    className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4"
                    onFocusCapture={() => setPreviewActiveTab("auth")}
                  >
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600"><Lock className="w-4 h-4" /></div>
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Giriş / Kayıt Ekranları Düzenlemesi</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Giriş Ekranı Başlığı</label>
                        <input
                          type="text"
                          value={siteSettings.loginTitle || ""}
                          onChange={(e) => setSiteSettings({ ...siteSettings, loginTitle: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Giriş Ekranı Açıklaması</label>
                        <input
                          type="text"
                          value={siteSettings.loginSub || ""}
                          onChange={(e) => setSiteSettings({ ...siteSettings, loginSub: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Hesap Oluşturma Başlığı</label>
                        <input
                          type="text"
                          value={siteSettings.registerTitle || ""}
                          onChange={(e) => setSiteSettings({ ...siteSettings, registerTitle: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Hesap Oluşturma Açıklaması</label>
                        <input
                          type="text"
                          value={siteSettings.registerSub || ""}
                          onChange={(e) => setSiteSettings({ ...siteSettings, registerSub: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Smartphone Live Preview */}
                <div className="hidden lg:flex xl:col-span-5 flex-col items-center justify-start xl:sticky xl:top-4 bg-slate-100 py-6 px-4 rounded-4xl border border-slate-200/60 shadow-inner">
                  <div className="flex flex-col items-center gap-1.5 mb-3 w-full">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-slate-500 animate-pulse" /> Canlı Mobil Önizleme
                    </span>
                    {/* Tiny visual control indicator row */}
                    <div className="flex flex-wrap gap-1 justify-center max-w-[340px]">
                      <button 
                        onClick={() => setPreviewActiveTab("home")}
                        className={`px-2 py-1 rounded-full text-[8px] font-extrabold transition-all cursor-pointer ${previewActiveTab === "home" ? "bg-slate-900 text-white" : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200/50"}`}
                      >
                        Ana Sayfa
                      </button>
                      <button 
                        onClick={() => setPreviewActiveTab("request_form")}
                        className={`px-2 py-1 rounded-full text-[8px] font-extrabold transition-all cursor-pointer ${previewActiveTab === "request_form" ? "bg-slate-900 text-white" : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200/50"}`}
                      >
                        Talep Formu
                      </button>
                      <button 
                        onClick={() => setPreviewActiveTab("chats")}
                        className={`px-2 py-1 rounded-full text-[8px] font-extrabold transition-all cursor-pointer ${previewActiveTab === "chats" ? "bg-slate-900 text-white" : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200/50"}`}
                      >
                        Sohbetler
                      </button>
                      <button 
                        onClick={() => setPreviewActiveTab("dashboard")}
                        className={`px-2 py-1 rounded-full text-[8px] font-extrabold transition-all cursor-pointer ${previewActiveTab === "dashboard" ? "bg-slate-900 text-white" : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200/50"}`}
                      >
                        Panel
                      </button>
                      <button 
                        onClick={() => setPreviewActiveTab("auth")}
                        className={`px-2 py-1 rounded-full text-[8px] font-extrabold transition-all cursor-pointer ${previewActiveTab === "auth" ? "bg-slate-900 text-white" : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200/50"}`}
                      >
                        Giriş Ekranı
                      </button>
                    </div>
                  </div>

                  {/* Device shell */}
                  <div className="w-[340px] h-[680px] scale-[0.8] sm:scale-[0.85] md:scale-95 lg:scale-100 origin-top bg-slate-950 rounded-[48px] p-3 shadow-2xl border-4 border-slate-800 relative flex flex-col select-none overflow-hidden ring-12 ring-slate-900/10">
                    {/* Speaker/Camera notch */}
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-slate-950 rounded-full z-30 flex items-center justify-center gap-1">
                      <div className="w-12 h-1 bg-slate-800 rounded-full" />
                      <div className="w-2.5 h-2.5 bg-slate-900 rounded-full border border-slate-800" />
                    </div>

                    {/* App content simulator */}
                    <div className="flex-1 bg-white rounded-[38px] overflow-hidden flex flex-col relative pt-8 pb-14 text-slate-800">
                      {/* Live Top Header */}
                      <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                        <div className="flex items-center gap-2">
                          <div className="p-0.5 bg-amber-50 rounded-lg border border-amber-100">
                            <DuckTruckLogo
                              className="w-6 h-6"
                              logoType={siteSettings.logoType}
                              customLogoUrl={siteSettings.customLogoUrl}
                            />
                          </div>
                          <div className="text-left">
                            <span className="text-xs font-black tracking-tight block text-slate-900 leading-tight">
                              {siteSettings.appName}
                            </span>
                            <span className="text-[7px] text-slate-400 font-bold block leading-none">
                              {siteSettings.appSlogan}
                            </span>
                          </div>
                        </div>
                        <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${siteSettings.primaryColor}15`, color: siteSettings.primaryColor }}>
                          Online
                        </span>
                      </div>

                      {/* Screen Content Scrollable area */}
                      <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 space-y-4 text-left">
                        {previewActiveTab === "home" && (
                          <div className="relative overflow-hidden rounded-2xl border border-slate-100/60 bg-white p-3 space-y-4 animate-in fade-in duration-300">
                            {/* Background image overlay */}
                            {(siteSettings.heroBackgroundImage || "/img/2.png") && (
                              <div className="absolute inset-0 z-0 pointer-events-none select-none">
                                <img 
                                  src={siteSettings.heroBackgroundImage || "/img/2.png"} 
                                  alt="Arka Plan" 
                                  className="w-full h-full object-cover"
                                  style={{ opacity: (siteSettings.heroBackgroundImageOpacity ?? 45) / 100 }}
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-white/65 via-white/20 to-transparent"></div>
                              </div>
                            )}

                            <div className="relative z-10 space-y-4 text-left">
                              {/* Dynamic Badge */}
                              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold border" style={{ backgroundColor: `${siteSettings.primaryColor}08`, borderColor: `${siteSettings.primaryColor}20`, color: siteSettings.primaryColor }}>
                                <Sparkles className="w-2.5 h-2.5" />
                                {siteSettings.heroBadgeText}
                              </div>

                              {/* Title & Slogan */}
                              <h1 className="text-lg font-black tracking-tight text-slate-900 leading-tight">
                                {siteSettings.heroTitle}
                              </h1>

                            <p className="text-[10px] text-slate-500 leading-relaxed">
                              {siteSettings.heroDescription}
                            </p>

                            {/* Live Primary Button */}
                            <div className="pt-2 flex gap-2">
                              <button 
                                onClick={() => setPreviewActiveTab("request_form")}
                                className="flex-1 py-2 rounded-xl text-[10px] font-bold text-white shadow-xs transition-transform active:scale-95 cursor-pointer" 
                                style={{ backgroundColor: siteSettings.primaryColor }}
                              >
                                {siteSettings.menuCreateRequestText}
                              </button>
                              <button 
                                onClick={() => setPreviewActiveTab("dashboard")}
                                className="flex-1 py-2 rounded-xl text-[10px] font-bold bg-white border border-slate-200 text-slate-700 font-display cursor-pointer"
                              >
                                {siteSettings.menuDiscoverText}
                              </button>
                            </div>

                            {/* Interactive miniature image slider */}
                            {siteSettings.showHeroSloganCard !== false && (
                              <div className="space-y-1.5 py-1">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Canlı Slider Görünümü</span>
                                <div className="relative w-full aspect-square p-1 bg-slate-100 rounded-2xl border border-slate-200/60 flex items-center justify-center shadow-xs">
                                  <div className="relative w-full h-full bg-zinc-950 rounded-xl overflow-hidden">
                                    <div 
                                      className="flex w-[200%] h-full transition-transform duration-500 ease-in-out"
                                      style={{ transform: `translateX(-${simHeroImgIndex * 50}%)` }}
                                    >
                                      <div className="w-1/2 h-full relative">
                                        <img 
                                          src={siteSettings.heroSliderImage1 || "/img/kare1.png"} 
                                          alt="Slide 1" 
                                          className="w-full h-full object-cover"
                                          referrerPolicy="no-referrer"
                                        />
                                      </div>
                                      <div className="w-1/2 h-full relative">
                                        <img 
                                          src={siteSettings.heroSliderImage2 || "/img/kare2.png"} 
                                          alt="Slide 2" 
                                          className="w-full h-full object-cover"
                                          referrerPolicy="no-referrer"
                                        />
                                      </div>
                                    </div>
                                    <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1 bg-black/40 px-1.5 py-0.5 rounded-full backdrop-blur-xs">
                                      <div className={`w-1 h-1 rounded-full transition-all ${simHeroImgIndex === 0 ? "bg-amber-500 scale-125" : "bg-white/50"}`} />
                                      <div className={`w-1 h-1 rounded-full transition-all ${simHeroImgIndex === 1 ? "bg-amber-500 scale-125" : "bg-white/50"}`} />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Advantage List (Neden Biz) */}
                            <div className="space-y-2 border-t border-slate-100 pt-3">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Neden Biz?</span>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs space-y-1">
                                  <span className="text-[9px] font-bold text-slate-800 block truncate">{siteSettings.value1Title || "Komisyonsuz Teklif"}</span>
                                  <span className="text-[7.5px] text-slate-400 block leading-tight">{siteSettings.value1Description || "Direkt firma ile anlaşıp komisyondan kurtulun."}</span>
                                </div>
                                <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs space-y-1">
                                  <span className="text-[9px] font-bold text-slate-800 block truncate">{siteSettings.value2Title || "Doğrulanmış Firmalar"}</span>
                                  <span className="text-[7.5px] text-slate-400 block leading-tight">{siteSettings.value2Description || "Sadece yetki belgesi onaylı firmalar teklif verir."}</span>
                                </div>
                              </div>
                            </div>

                            {/* Feature Banner Card */}
                            <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs space-y-1.5">
                              <div className="flex items-center gap-1.5">
                                <Award className="w-3.5 h-3.5" style={{ color: siteSettings.primaryColor }} />
                                <span className="text-[9px] font-bold text-slate-800 font-display">Doğrulanmış Lojistik</span>
                              </div>
                              <p className="text-[8px] text-slate-400 leading-normal">
                                %100 sigortalı lojistik hizmeti ve kurumsal nakliyeciler.
                              </p>
                            </div>
                          </div>
                          </div>
                        )}

                        {previewActiveTab === "request_form" && (
                          <div className="space-y-4 animate-in fade-in duration-300">
                            <div className="border-b border-slate-100 pb-2">
                              <span className="text-[10px] font-extrabold text-slate-900 block font-display">
                                {siteSettings.createRequestTitle || "Yeni Nakliyat Talebi Oluştur"}
                              </span>
                              <span className="text-[8px] text-slate-400 block mt-0.5 leading-normal">
                                {siteSettings.createRequestSub || "Eşya detaylarınızı girin, firmalardan teklif toplayın."}
                              </span>
                            </div>

                            <div className="space-y-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-xs">
                              <div>
                                <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">
                                  {siteSettings.createRequestFormPickupLabel || "Nereden (Yükleme Konumu)"}
                                </label>
                                <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-400 flex items-center gap-1.5">
                                  <Compass className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Şehir veya İlçe Seçin...</span>
                                </div>
                              </div>

                              <div>
                                <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">
                                  {siteSettings.createRequestFormDestinationLabel || "Nereye (Teslimat Konumu)"}
                                </label>
                                <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-400 flex items-center gap-1.5">
                                  <Compass className="w-3.5 h-3.5 text-slate-400 rotate-90" />
                                  <span>Şehir veya İlçe Seçin...</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">
                                    {siteSettings.createRequestFormRoomsLabel || "Eşya Hacmi (Oda Sayısı)"}
                                  </label>
                                  <div className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[9px] text-slate-700 font-bold">
                                    3+1 Standart
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Taşıma Tipi</label>
                                  <div className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[9px] text-slate-700 font-bold">
                                    Evden Eve Nakliyat
                                  </div>
                                </div>
                              </div>

                              <button 
                                className="w-full py-2.5 rounded-xl text-[10px] font-bold text-white shadow-md shadow-blue-500/10 cursor-pointer block text-center"
                                style={{ backgroundColor: siteSettings.primaryColor }}
                              >
                                {siteSettings.createRequestSubmitBtnText || "Talebi Yayınla ve Teklif Topla"}
                              </button>
                            </div>
                          </div>
                        )}

                        {previewActiveTab === "chats" && (
                          <div className="space-y-3 animate-in fade-in duration-300 flex flex-col h-full justify-between pb-2">
                            <div className="bg-slate-100/80 p-2 rounded-xl border border-slate-200/50 flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                <span className="text-[9px] font-bold text-slate-800 font-display">Özgen Lojistik (A-Onaylı)</span>
                              </div>
                              <span className="text-[8px] text-slate-400">Çevrimiçi</span>
                            </div>

                            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                              <div className="bg-slate-105 p-2 rounded-2xl rounded-tl-none max-w-[85%] text-[9px] text-slate-700 bg-slate-100 leading-normal">
                                Merhaba, evden eve nakliye talebiniz için <span className="font-bold text-slate-900">12.500 TL</span> sigortalı teklif sunuyoruz. Asansörlü araç getirebiliriz.
                              </div>
                              <div className="p-2 rounded-2xl rounded-tr-none max-w-[85%] text-[9px] text-white self-end ml-auto text-right leading-normal" style={{ backgroundColor: siteSettings.primaryColor }}>
                                Harika! Eşyalar kırılma garantili mi taşınacak? Asansör fiyata dahil mi?
                              </div>
                              <div className="bg-slate-105 p-2 rounded-2xl rounded-tl-none max-w-[85%] text-[9px] text-slate-700 bg-slate-100 leading-normal">
                                Evet, tüm süreci nakliyat sigortası kapsamında yürütüyoruz. Asansör kurulumu fiyata dahildir.
                              </div>
                            </div>

                            <div className="mt-auto pt-2 border-t border-slate-100 flex gap-1.5">
                              <input 
                                type="text" 
                                placeholder="Mesajınızı buraya yazın..." 
                                disabled
                                className="flex-1 px-3 py-1.5 text-[9px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                              />
                              <button className="px-3 py-1 text-white rounded-lg text-[9px] font-bold" style={{ backgroundColor: siteSettings.primaryColor }}>
                                Gönder
                              </button>
                            </div>
                          </div>
                        )}

                        {previewActiveTab === "dashboard" && (
                          <div className="space-y-4 animate-in fade-in duration-300">
                            <div className="p-4 rounded-2xl text-white space-y-1 shadow-md" style={{ background: `linear-gradient(135deg, ${siteSettings.accentColor || "#0F172A"} 0%, #1E293B 100%)` }}>
                              <span className="text-[11px] font-black block font-display">
                                {siteSettings.customerDashboardWelcomeText || "Merhaba, NakNak'a Hoş Geldiniz!"}
                              </span>
                              <span className="text-[8px] text-slate-300/95 block leading-normal">
                                {siteSettings.customerDashboardSub || "Bekleyen nakliye taleplerinizi ve gelen teklifleri buradan yönetebilirsiniz."}
                              </span>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Aktif Taşıma Talepleriniz</span>
                                <span className="text-[8px] font-bold text-amber-500 animate-pulse bg-amber-500/10 px-1.5 py-0.5 rounded-full">3 Yeni Teklif</span>
                              </div>

                              <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-2xs space-y-2.5 text-left">
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-black text-slate-900">Ankara → İzmir (Ev Eşyası)</span>
                                  <span className="text-[8px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full font-bold">Teklif Topluyor</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[8px] text-slate-400">
                                  <div>Hacim: <strong className="text-slate-700">3+1 Eşya</strong></div>
                                  <div>Tarih: <strong className="text-slate-700">12 Temmuz 2026</strong></div>
                                </div>
                                
                                <div className="flex gap-2 pt-1">
                                  <button className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-[8px] font-bold text-slate-700 transition-all">
                                    {siteSettings.requestCancelBtnText || "Talebi İptal Et / Geri Çek"}
                                  </button>
                                  <button className="flex-1 py-1.5 text-white rounded-lg text-[8px] font-bold transition-all" style={{ backgroundColor: siteSettings.primaryColor }}>
                                    {siteSettings.dashboardViewOffersBtnText || "Gelen Teklifleri İncele"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {previewActiveTab === "auth" && (
                          <div className="space-y-4 animate-in fade-in duration-300 py-3">
                            <div className="text-center space-y-1">
                              <span className="text-[11px] font-black text-slate-900 block font-display">
                                {siteSettings.loginTitle || "Hesabınıza Giriş Yapın"}
                              </span>
                              <span className="text-[8px] text-slate-400 block max-w-xs mx-auto">
                                {siteSettings.loginSub || "Hemen giriş yapıp teklifleri değerlendirin veya talep açın."}
                              </span>
                            </div>

                            <div className="space-y-3 bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs">
                              <div className="space-y-1">
                                <label className="block text-[8px] font-black text-slate-400 uppercase">E-Posta Adresi</label>
                                <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[9px] text-slate-400">
                                  ornek@naknak.com
                                </div>
                              </div>

                              <div className="space-y-1">
                                <label className="block text-[8px] font-black text-slate-400 uppercase">Parola</label>
                                <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[9px] text-slate-400">
                                  •••••••••••••
                                </div>
                              </div>

                              <button 
                                className="w-full py-2 text-white rounded-xl text-[9px] font-bold cursor-pointer transition-transform active:scale-95"
                                style={{ backgroundColor: siteSettings.primaryColor }}
                              >
                                Giriş Yap
                              </button>

                              <div className="border-t border-slate-100 pt-2.5 text-center">
                                <span className="text-[8px] text-slate-400 block leading-tight">
                                  {siteSettings.registerSub || "Taşıma talebi açıp komisyonsuz teklifler toplayın."}
                                </span>
                                <span className="text-[8px] font-black mt-1 block" style={{ color: siteSettings.primaryColor }}>
                                  Yeni Hesap Oluşturun
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Simulated Sticky Mobile Bottom Navigation Menu */}
                      <div className="absolute bottom-0 left-0 right-0 h-14 bg-white border-t border-slate-100 flex items-center justify-around px-2 z-10">
                        <div 
                          onClick={() => setPreviewActiveTab("home")}
                          className="flex flex-col items-center cursor-pointer flex-1"
                        >
                          <Compass className="w-4 h-4 transition-colors" style={{ color: previewActiveTab === "home" ? siteSettings.primaryColor : "#94a3b8" }} />
                          <span className="text-[8px] font-extrabold mt-0.5 transition-colors" style={{ color: previewActiveTab === "home" ? siteSettings.primaryColor : "#94a3b8" }}>
                            {siteSettings.menuHomeText}
                          </span>
                        </div>

                        <div 
                          onClick={() => setPreviewActiveTab("request_form")}
                          className="flex flex-col items-center cursor-pointer flex-1"
                        >
                          <PlusCircle className="w-4 h-4 transition-colors" style={{ color: previewActiveTab === "request_form" ? siteSettings.primaryColor : "#94a3b8" }} />
                          <span className="text-[8px] font-bold mt-0.5 transition-colors" style={{ color: previewActiveTab === "request_form" ? siteSettings.primaryColor : "#94a3b8" }}>
                            {siteSettings.menuCreateRequestText}
                          </span>
                        </div>

                        <div 
                          onClick={() => setPreviewActiveTab("chats")}
                          className="flex flex-col items-center cursor-pointer flex-1"
                        >
                          <MessageSquare className="w-4 h-4 transition-colors" style={{ color: previewActiveTab === "chats" ? siteSettings.primaryColor : "#94a3b8" }} />
                          <span className="text-[8px] font-bold mt-0.5 transition-colors" style={{ color: previewActiveTab === "chats" ? siteSettings.primaryColor : "#94a3b8" }}>
                            {siteSettings.menuChatsText}
                          </span>
                        </div>

                        <div 
                          onClick={() => setPreviewActiveTab("dashboard")}
                          className="flex flex-col items-center cursor-pointer flex-1"
                        >
                          <UserIcon className="w-4 h-4 transition-colors" style={{ color: previewActiveTab === "dashboard" ? siteSettings.primaryColor : "#94a3b8" }} />
                          <span className="text-[8px] font-bold mt-0.5 transition-colors" style={{ color: previewActiveTab === "dashboard" ? siteSettings.primaryColor : "#94a3b8" }}>
                            {siteSettings.menuProfileText}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* MODAL: REJECT APPEAL EXPLANATION */}
          {rejectingAppealId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
              <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200 text-slate-800">
                <h3 className="text-base font-bold font-display text-slate-900">İtirazı Reddet</h3>
                <p className="text-xs text-slate-400">
                  Bu itirazı reddetme gerekçenizi yazın. Gerekçe kullanıcıya bildirim olarak iletilecek ve yorum tekrar yayına alınacaktır.
                </p>

                <form onSubmit={handleRejectAppeal} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Gerekçeniz</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Örn: Yorum hakaret içermemektedir, kullanıcının kişisel deneyimidir..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none resize-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRejectingAppealId(null);
                        setRejectReason("");
                      }}
                      className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                    >
                      Vazgeç
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-slate-950 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-all"
                    >
                      Reddet ve Gönder
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

           {/* IMAGE CROPPER & EDITOR MODAL */}
          {cropperModalOpen && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
              <div className="w-full max-w-lg bg-white rounded-[32px] p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200 text-slate-800">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-display">Görseli Kes & Düzenle</h3>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {cropTarget === "heroBackgroundImage" ? "Ana Sayfa Arka Planı (Önerilen: Geniş Ekran 16:9)" : "Kaydırıcı Görsel (Kare 1:1)"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCropperModalOpen(false)}
                    className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full transition-all cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-2xl leading-relaxed">
                  💡 Görseli çerçeve içinde konumlandırmak için <strong>üzerine basılı tutarak sürükleyebilirsiniz (pan)</strong>. Zoom ve döndürme çubuklarını kullanarak tam sığdırın.
                </p>

                {/* Cropping Area */}
                <div 
                  className="relative overflow-hidden bg-slate-950 rounded-2xl flex items-center justify-center border border-slate-800"
                  style={{ width: "100%", height: "280px" }}
                >
                  {/* Aspect Ratio Box Mask Overlay */}
                  <div 
                    className="absolute border-2 border-dashed border-white/80 z-10 pointer-events-none rounded-lg shadow-[0_0_0_9999px_rgba(15,23,42,0.65)]"
                    style={{
                      width: cropTarget === "heroBackgroundImage" ? "min(100% - 32px, 400px)" : "200px",
                      height: cropTarget === "heroBackgroundImage" ? "min((100% - 32px) * 9 / 16, 225px)" : "200px",
                    }}
                  />

                  {/* Guide text */}
                  <div className="absolute top-3 left-3 bg-black/50 text-white/80 text-[9px] px-2 py-1 rounded-full z-10 pointer-events-none uppercase font-mono tracking-wider">
                    Önizleme Alanı
                  </div>
                  
                  {/* Draggable and Transformable Image */}
                  <img
                    src={cropperImageSrc}
                    alt="Cropping content"
                    className="absolute max-w-none origin-center cursor-move select-none"
                    style={{
                      transform: `translate(${cropperOffsetX}px, ${cropperOffsetY}px) scale(${cropperZoom}) rotate(${cropperRotation}deg)`,
                      maxHeight: "100%",
                      maxWidth: "100%",
                    }}
                    onMouseDown={(e) => {
                      setIsDraggingCropper(true);
                      setDragStart({ x: e.clientX - cropperOffsetX, y: e.clientY - cropperOffsetY });
                    }}
                    onMouseMove={(e) => {
                      if (!isDraggingCropper) return;
                      setCropperOffsetX(e.clientX - dragStart.x);
                      setCropperOffsetY(e.clientY - dragStart.y);
                    }}
                    onMouseUp={() => setIsDraggingCropper(false)}
                    onMouseLeave={() => setIsDraggingCropper(false)}
                    onTouchStart={(e) => {
                      if (e.touches.length === 1) {
                        setIsDraggingCropper(true);
                        setDragStart({ 
                          x: e.touches[0].clientX - cropperOffsetX, 
                          y: e.touches[0].clientY - cropperOffsetY 
                        });
                      }
                    }}
                    onTouchMove={(e) => {
                      if (!isDraggingCropper || e.touches.length !== 1) return;
                      setCropperOffsetX(e.touches[0].clientX - dragStart.x);
                      setCropperOffsetY(e.touches[0].clientY - dragStart.y);
                    }}
                    onTouchEnd={() => setIsDraggingCropper(false)}
                    draggable={false}
                  />
                </div>

                {/* Editor Sliders & Controls */}
                <div className="space-y-4">
                  {/* Zoom (Scale) Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>YAKINLAŞTIRMA (ZOOM)</span>
                      <span className="font-mono text-slate-600">x{cropperZoom.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="4"
                      step="0.05"
                      value={cropperZoom}
                      onChange={(e) => setCropperZoom(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
                    />
                  </div>

                  {/* Rotation Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>DÖNDÜRME (ROTATE)</span>
                      <span className="font-mono text-slate-600">{cropperRotation}°</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      step="5"
                      value={cropperRotation}
                      onChange={(e) => setCropperRotation(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
                    />
                  </div>

                  {/* Quick Control Presets */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCropperRotation((prev) => (prev + 90) % 360)}
                      className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[10px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18" />
                      </svg>
                      90° Döndür
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCropperZoom(1);
                        setCropperRotation(0);
                        setCropperOffsetX(0);
                        setCropperOffsetY(0);
                      }}
                      className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[10px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      Sıfırla
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCropperModalOpen(false)}
                    className="flex-1 py-3 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const img = new Image();
                      img.onload = () => {
                        const canvas = document.createElement("canvas");
                        const isBg = cropTarget === "heroBackgroundImage";
                        const targetW = isBg ? 1600 : 800;
                        const targetH = isBg ? 900 : 800;
                        
                        canvas.width = targetW;
                        canvas.height = targetH;
                        
                        const ctx = canvas.getContext("2d");
                        if (!ctx) return;
                        
                        // Fill white background for safety
                        ctx.fillStyle = "#ffffff";
                        ctx.fillRect(0, 0, targetW, targetH);
                        
                        // Crop box sizes on screen
                        const cropBoxW = isBg ? 400 : 200;
                        const cropBoxH = isBg ? 225 : 200;
                        const ratio = targetW / cropBoxW;

                        // Center in canvas
                        ctx.translate(targetW / 2 + cropperOffsetX * ratio, targetH / 2 + cropperOffsetY * ratio);
                        ctx.rotate((cropperRotation * Math.PI) / 180);
                        
                        // Calculate display scale inside the 280px container
                        const maxContainerW = 400;
                        const maxContainerH = 280;
                        const scaleX = maxContainerW / img.width;
                        const scaleY = maxContainerH / img.height;
                        const containerFitScale = Math.min(1, scaleX, scaleY);
                        
                        const scaleFactor = cropperZoom * containerFitScale * ratio;
                        ctx.scale(scaleFactor, scaleFactor);
                        
                        ctx.drawImage(img, -img.width / 2, -img.height / 2);
                        
                        const base64 = canvas.toDataURL("image/jpeg", 0.85);
                        if (cropTarget) {
                          setSiteSettings((prev) => ({ ...prev, [cropTarget]: base64 }));
                        }
                        setCropperModalOpen(false);
                      };
                      img.src = cropperImageSrc;
                    }}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Görseli Kes ve Uygula
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TOAST NOTIFICATION */}
          {toastMessage && (
            <div className="fixed bottom-5 right-5 z-[100] animate-in fade-in slide-in-from-bottom-5 duration-300">
              <div className={`px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-2 border text-xs font-bold ${
                toastMessage.type === "success" 
                  ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                  : "bg-rose-50 border-rose-100 text-rose-800"
              }`}>
                <span>{toastMessage.text}</span>
              </div>
            </div>
          )}

          {/* MODAL: APPROVE APPEAL CONFIRMATION */}
          {approvingReview && (
            <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
              <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200 text-slate-800">
                <h3 className="text-base font-bold font-display text-slate-900">İtirazı Kabul Et ve Yorumu Sil</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Bu değerlendirme itirazını kabul etmek istediğinize emin misiniz? Bu işlem sonucunda <strong className="text-slate-900">"{approvingReview.reviewerName}"</strong> tarafından yapılan yorum kalıcı olarak silinecektir.
                </p>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 italic">
                  "{approvingReview.comment}"
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setApprovingReview(null)}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApproveAppeal(approvingReview)}
                    className="flex-1 py-2.5 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-500 transition-all cursor-pointer"
                  >
                    Evet, Sil ve Kabul Et
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL: RESET DATABASE CONFIRMATION */}
          {showResetConfirm && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
              <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-rose-100 space-y-4 animate-in fade-in zoom-in-95 duration-200 text-slate-800 text-center">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold font-display text-slate-900">Sistemi Sıfırla ve Tüm Verileri Sil</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Bu işlem, <strong className="text-slate-900">alibuyukuyar268@gmail.com</strong> (Yönetici) hesabı hariç tüm kullanıcıları, taşıma taleplerini, teklifleri, yorumları, şikayetleri, sohbetleri ve bildirimleri kalıcı olarak silecektir.
                </p>
                <p className="text-[10px] font-bold text-rose-600 uppercase bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                  ⚠️ Bu işlem geri alınamaz! Herkes yeniden sıfırdan kayıt olmak zorunda kalacaktır.
                </p>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    disabled={isResetting}
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="button"
                    disabled={isResetting}
                    onClick={handleResetDatabase}
                    className="flex-1 py-2.5 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-500 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isResetting ? "Sıfırlanıyor..." : "Evet, Her Şeyi Temizle"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
