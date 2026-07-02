import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { auth, db, handleFirestoreError, OperationType } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, collection, onSnapshot, query, where, addDoc } from "firebase/firestore";
import { UserProfile, ChatSession, SiteSettings, Notification, BlogPost } from "./types";

// Page Views
import { HowItWorksView, DiscoverMoversView, HelpCenterView, PrivacyTermsView } from "./components/PageViews";

// Core Interactive Components
import AuthModal from "./components/AuthModal";
import OnboardingFlow from "./components/OnboardingFlow";
import DuckTruckLogo from "./components/DuckTruckLogo";
import CreateRequestForm from "./components/CreateRequestForm";
import ChatModal from "./components/ChatModal";
import AdminPanelComponent from "./components/AdminPanelComponent";
import DashboardCustomer from "./components/DashboardCustomer";
import DashboardCompany from "./components/DashboardCompany";
import NotificationCenter from "./components/NotificationCenter";
import ProfileComponent from "./components/ProfileComponent";
import CookieConsentBanner from "./components/CookieConsentBanner";

// Icons
import {
  Truck,
  Shield,
  Star,
  Users,
  PlusCircle,
  HelpCircle,
  Phone,
  MessageSquare,
  Sparkles,
  Heart,
  Settings,
  Mail,
  User,
  LogOut,
  ChevronRight,
  BookOpen,
  MapPin,
  Lock,
  Compass,
  ListOrdered,
  Layers,
  AlertOctagon,
  X,
  Home,
  Menu
} from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalIsLogin, setAuthModalIsLogin] = useState(true);
  const [authModalRole, setAuthModalRole] = useState<"CUSTOMER" | "MOVING_COMPANY">("CUSTOMER");
  const [currentTab, setCurrentTab] = useState("home"); // "home", "how_it_works", "discover_movers", "create_request", "dashboard", "chats", "favorites", "help_center", "blog", "privacy", "contact"
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Global Site Customizer Settings
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

    // Defaults for every section visibility & text
    showHeroSloganCard: true,
    heroSloganMain: "Nak Diye",
    heroSloganSub: "Taşının!",
    heroSloganFooterLeft: "TR GENELİ SEVKİYAT",
    heroSloganFooterRight: "KOLAY & GÜVENLİ",
    heroButtonRequestText: "Hemen Talep Oluştur",
    heroSliderInterval: 5,
    heroSliderImage1: "/img/kare1.png",
    heroSliderImage2: "/img/kare2.png",
    heroBackgroundImage: "/img/2.png",
    heroBackgroundImageOpacity: 45,
    heroButtonDiscoverText: "Firmaları Keşfet",

    showStatsRow: false, // Default is false as requested by the user until there is data
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

    // New default styles and texts
    headerBgColor: "#ffffff",
    headerTextColor: "#0F172A",
    footerBgColor: "#0F172A",
    footerTextColor: "#94A3B8",
    buttonBgColor: "#EA580C",
    buttonHoverBgColor: "#C2410C",
    showBlogSection: true,
    showHowItWorksSection: true,
    showFaqsSection: true,
    faq1Question: "Sanal pos veya kredi kartıyla ödeme var mı?",
    faq1Answer: "Hayır. Güvenlik ve komisyonsuz taşıma ilkelerimiz gereği, ödeme müşteri ile nakliye firması arasında doğrudan (taşınma günü elden veya havale ile) gerçekleştirilir.",
    faq2Question: "Eşyalarım sigortalanıyor mu?",
    faq2Answer: "Profilinde 'Sigortalı Taşımacılık' ibaresi olan tüm doğrulanmış firmalarımız taşınma öncesinde eşya sigorta poliçesi hazırlayarak güvence sağlar.",
    faq3Question: "Teklif vermem ücretli mi?",
    faq3Answer: "Hayır, müşterilerin talep açması ve nakliyecilerin teklif göndermesi tamamen ücretsizdir.",
    faq4Question: "Uyuşmazlık durumunda ne yapmalıyım?",
    faq4Answer: "Uyuşmazlık veya şikayet durumunda, yönetim panelimizden veya destek ekibimizden doğrudan şikayet kaydı oluşturabilirsiniz. Admin ekibimiz süreci inceleyecektir.",
    customerDashboardWelcomeText: "Müşteri Taşıma Paneli",
    customerDashboardSub: "Taşıma taleplerinizi ve gelen teklifleri buradan yönetebilirsiniz.",
    customerDashboardNoRequestsText: "Henüz bir nakliye talebi oluşturmadınız.",
    companyDashboardWelcomeText: "Taşıyıcı Firma Yönetim Paneli",
    companyDashboardSub: "Gelen nakliye taleplerini listeleyin, teklif verin ve işlerinizi büyütün.",
    companyDashboardNoJobsText: "Size uygun veya kazandığınız aktif bir nakliye işi bulunmuyor.",
    createRequestPricingEstTitle: "Yapay Zeka Destekli Fiyat Tahmini",
    createRequestPricingEstDesc: "Seçtiğiniz oda sayısı, katlar ve mesafe kriterlerine göre akıllı algoritmamız tahmini bütçe aralığı sunar.",
    chatWelcomeHeader: "Sohbet Odaları",
    chatWelcomeSub: "Fiyat teklifleri aldığınız nakliye firmalarıyla doğrudan mesajlaşın, fotoğraf ve detay paylaşın.",
    loginTitle: "Giriş Yap",
    loginSub: "NakNak Nakliye Platformuna hoş geldiniz. Taşınmaya başlamak için giriş yapın.",
    registerTitle: "Hesap Oluştur",
    registerSub: "Bireysel müşteri veya kurumsal nakliyat firması olarak ücretsiz kaydolun.",
  });

  const [completedRequestsCount, setCompletedRequestsCount] = useState(0);
  const [averageSatisfaction, setAverageSatisfaction] = useState(99.4);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlogPost | null>(null);

  // Active Chats for Chats Tab
  const [activeChats, setActiveChats] = useState<ChatSession[]>([]);
  const [openedChat, setOpenedChat] = useState<{ id: string; name: string; title: string } | null>(null);

  // Favorites
  const [favorites, setFavorites] = useState<string[]>([]);
  const [companies, setCompanies] = useState<UserProfile[]>([]);
  const [dashboardViewMode, setDashboardViewMode] = useState<"customer" | "company">("customer");

  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [companyActiveSubTab, setCompanyActiveSubTab] = useState<string>("browse");

  const [heroImgIndex, setHeroImgIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe) {
      setHeroImgIndex(1);
    } else if (isRightSwipe) {
      setHeroImgIndex(0);
    }
  };

  useEffect(() => {
    const intervalSeconds = siteSettings.heroSliderInterval || 5;
    const timer = setInterval(() => {
      setHeroImgIndex((prev) => (prev === 0 ? 1 : 0));
    }, intervalSeconds * 1000);
    return () => clearInterval(timer);
  }, [siteSettings.heroSliderInterval]);

  // Sync dashboard mode to user role by default
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === "MOVING_COMPANY") {
        setDashboardViewMode("company");
      } else {
        setDashboardViewMode("customer");
      }
    }
  }, [currentUser?.role, currentUser?.id]);

  // Feedback/Complaint Modal State
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [complaintReason, setComplaintReason] = useState("Fiyat Anlaşmazlığı");
  const [complaintDetails, setComplaintDetails] = useState("");
  const [reportedName, setReportedName] = useState("");

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch User Profile from Firestore
        const userDocSnap = await getDoc(doc(db, "users", user.uid));
        if (userDocSnap.exists()) {
          const profile = userDocSnap.data() as UserProfile;
          
          // Elevate alibuyukuyar268@gmail.com to ADMIN automatically
          if (profile.email === "alibuyukuyar268@gmail.com" && profile.role !== "ADMIN") {
            const updated: UserProfile = { ...profile, role: "ADMIN" };
            await setDoc(doc(db, "users", user.uid), updated);
            setCurrentUser(updated);
          } else {
            setCurrentUser(profile);
          }
        } else {
          // Fallback if profile didn't write fast enough (e.g. during first-time sign-in)
          const tempProfile: UserProfile = {
            id: user.uid,
            email: user.email || "",
            name: user.displayName || "Yeni Üye",
            phone: "",
            role: user.email === "alibuyukuyar268@gmail.com" ? "ADMIN" : "CUSTOMER",
            createdAt: new Date().toISOString(),
            isOnboarded: false
          };
          // Do not write to Firestore here to avoid overwriting AuthModal's custom role creation (e.g. MOVING_COMPANY)
          setCurrentUser(tempProfile);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    // Listen to all active moving companies
    const unsubscribeComps = onSnapshot(
      query(collection(db, "users"), where("role", "==", "MOVING_COMPANY")),
      (snapshot) => {
        const compsList: UserProfile[] = [];
        snapshot.forEach((d) => {
          compsList.push({ id: d.id, ...d.data() } as UserProfile);
        });
        setCompanies(compsList);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "users_moving_companies");
      }
    );

    // Listen to global site settings config (entire settings collection to support split image documents and stay under 1MB)
    const unsubscribeSettings = onSnapshot(collection(db, "settings"), (snapshot) => {
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

      setSiteSettings((prev) => ({
        ...prev,
        ...siteConfigData,
        ...imageDocs
      }));
    });

    return () => {
      unsubscribe();
      unsubscribeComps();
      unsubscribeSettings();
    };
  }, []);

  // Listen to completed requests count
  useEffect(() => {
    const q = query(collection(db, "moving_requests"), where("status", "==", "COMPLETED"));
    const unsubscribeCompleted = onSnapshot(q, (snapshot) => {
      setCompletedRequestsCount(snapshot.size);
    }, (err) => console.error("Error listening completed requests:", err));
    return () => unsubscribeCompleted();
  }, []);

  // Listen to blog posts collection
  useEffect(() => {
    const unsubscribeBlogs = onSnapshot(collection(db, "blogs"), (snapshot) => {
      const blogList: BlogPost[] = [];
      snapshot.forEach((docSnap) => {
        blogList.push({ id: docSnap.id, ...docSnap.data() } as BlogPost);
      });
      // Sort by createdAt descending
      blogList.sort((a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime());
      setBlogs(blogList);
    }, (error) => {
      console.error("Error listening blogs:", error);
    });
    return () => unsubscribeBlogs();
  }, []);

  // Calculate real average satisfaction from moving company ratings
  useEffect(() => {
    const ratedComps = companies.filter((c) => c.rating && c.ratingsCount && c.ratingsCount > 0);
    if (ratedComps.length === 0) {
      setAverageSatisfaction(99.4); // Fallback standard
      return;
    }
    const totalRating = ratedComps.reduce((acc, c) => acc + (c.rating || 5), 0);
    const avg = totalRating / ratedComps.length;
    const percent = Math.min(100, Math.max(80, parseFloat(((avg / 5) * 100).toFixed(1))));
    setAverageSatisfaction(percent);
  }, [companies]);

  // Sync heroTitle in firestore if it's the old one or containing 'ördek'
  useEffect(() => {
    const isUserAdmin = currentUser?.role === "ADMIN" || currentUser?.isAdmin || currentUser?.email === "alibuyukuyar268@gmail.com";
    if (isUserAdmin && siteSettings) {
      const lowerTitle = siteSettings.heroTitle.toLowerCase();
      if (lowerTitle.includes("ördek") || siteSettings.heroTitle === "Güvenli, Hızlı ve Stressiz Taşının.") {
        const { heroBackgroundImage, heroSliderImage1, heroSliderImage2, customLogoUrl, ...restSettings } = siteSettings;
        const updated = { ...restSettings, heroTitle: "Tanıdığa gerek yok, herkes burada" };
        setDoc(doc(db, "settings", "site_config"), updated).catch((err) => {
          console.error("Firestore settings auto-update failed:", err);
        });
      }
    }
  }, [currentUser, siteSettings]);

  // Listen to Chats list if user is logged in
  useEffect(() => {
    if (!currentUser) {
      setActiveChats([]);
      return;
    }

    const q = query(collection(db, "chats"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ChatSession[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        const chatId = d.id;
        
        const isParticipant = 
          data.customerId === currentUser.id || 
          data.companyId === currentUser.id ||
          (currentUser.role === "CUSTOMER" && (!data.customerId || data.customerId === "") && chatId.includes(currentUser.id));

        if (isParticipant) {
          list.push({ id: d.id, ...data } as ChatSession);
        }
      });
      list.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
      setActiveChats(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `chats_list_${currentUser.id}`);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setCurrentTab("home");
  };

  const toggleFavorite = (companyId: string) => {
    if (!favorites.includes(companyId)) {
      setFavorites([...favorites, companyId]);
    } else {
      setFavorites(favorites.filter((id) => id !== companyId));
    }
  };

  const handleOpenChat = (chatId: string, opponentName: string, requestTitle: string) => {
    setOpenedChat({ id: chatId, name: opponentName, title: requestTitle });
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.type === "NEW_MESSAGE") {
      // Direct message: Open the chat overlay directly on top of the current screen
      const chatId = notification.chatId || `${notification.requestId}_${currentUser?.id}`;
      const opponentName = notification.title.replace("Yeni Mesaj: ", "") || "Sohbet";
      handleOpenChat(chatId, opponentName, "Sohbet");
    } else {
      setCurrentTab("dashboard");
      if (currentUser?.role === "MOVING_COMPANY") {
        setDashboardViewMode("company");
        setCompanyActiveSubTab("active_jobs");
      } else {
        setDashboardViewMode("customer");
        if (notification.requestId) {
          setSelectedRequestId(notification.requestId);
        }
      }
    }
  };

  const handleSendComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !complaintDetails.trim()) return;

    try {
      await addDoc(collection(db, "complaints"), {
        reporterId: currentUser.id,
        reporterName: currentUser.name,
        reportedId: "Firma ID",
        reportedName: reportedName || "Belirtilmemiş Firma",
        reason: complaintReason,
        details: complaintDetails,
        status: "PENDING",
        createdAt: new Date().toISOString()
      });
      alert("Şikayet kaydınız başarıyla oluşturuldu. Destek ekibimiz en kısa sürede inceleyecektir.");
      setComplaintOpen(false);
      setComplaintDetails("");
      setReportedName("");
    } catch (err) {
      console.error(err);
      alert("Şikayet gönderilemedi.");
    }
  };

  const countUnreadChats = activeChats.reduce((sum, chat) => {
    if (currentUser?.role === "CUSTOMER") {
      return sum + (chat.unreadCountCustomer || 0);
    } else {
      return sum + (chat.unreadCountCompany || 0);
    }
  }, 0);

  if (currentUser && currentUser.isOnboarded !== true && currentUser.role !== "ADMIN") {
    return (
      <OnboardingFlow
        user={currentUser}
        onComplete={(updatedProfile) => {
          setCurrentUser(updatedProfile);
          setCurrentTab("dashboard");
        }}
        onSignOut={() => {
          setCurrentUser(null);
          setCurrentTab("home");
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 font-sans selection:bg-blue-500 selection:text-white overflow-x-hidden">
      {/* Dynamic Theme Styles Customizer override */}
      <style>{`
        body, .min-h-screen, .bg-slate-50 { background-color: ${siteSettings.bodyBgColor || '#f8fafc'} !important; }
        .bg-white { background-color: ${siteSettings.cardBgColor || '#ffffff'} !important; }
        
        /* Font Family overrides */
        body, .font-sans, p, span, button, input, select, textarea { 
          font-family: ${
            siteSettings.fontFamily === "font-mono" ? "'JetBrains Mono', monospace" :
            siteSettings.fontFamily === "font-serif" ? "'Playfair Display', Georgia, serif" :
            siteSettings.fontFamily === "font-display" ? "'Space Grotesk', sans-serif" :
            "'Inter', sans-serif"
          } !important; 
        }

        /* Primary and Accent color overrides */
        .text-blue-600 { color: ${siteSettings.primaryColor} !important; }
        .bg-blue-600 { background-color: ${siteSettings.primaryColor} !important; }
        .hover\\:bg-blue-700:hover { filter: brightness(0.9) !important; }
        .border-blue-600 { border-color: ${siteSettings.primaryColor} !important; }
        .bg-blue-50 { background-color: ${siteSettings.primaryColor}10 !important; }
        .text-blue-700 { color: ${siteSettings.primaryColor} !important; }
        .text-amber-500 { color: ${siteSettings.accentColor} !important; }
        .bg-amber-500 { background-color: ${siteSettings.accentColor} !important; }
        .bg-amber-50 { background-color: ${siteSettings.accentColor}10 !important; }

        /* Navigation Header Custom Theme overrides */
        header { 
          background-color: ${siteSettings.headerBgColor || '#ffffff'} !important; 
          border-color: ${siteSettings.headerBgColor ? 'rgba(0,0,0,0.05)' : '#f1f5f9'} !important;
        }
        header button, header span, header nav button, header a { 
          color: ${siteSettings.headerTextColor || '#0f172a'} !important; 
        }

        /* Footer Custom Theme overrides */
        footer { 
          background-color: ${siteSettings.footerBgColor || '#0f172a'} !important; 
        }
        footer h3, footer p, footer a, footer span, footer div { 
          color: ${siteSettings.footerTextColor || '#94a3b8'} !important; 
        }

        /* Buttons background & hover customizations */
        .bg-slate-950 { 
          background-color: ${siteSettings.buttonBgColor || '#0f172a'} !important; 
          color: ${siteSettings.buttonTextColor || '#ffffff'} !important; 
        }
        .bg-slate-950:hover { 
          background-color: ${siteSettings.buttonHoverBgColor || '#1e293b'} !important; 
        }

        /* Roundedness Customizations */
        ${siteSettings.buttonRoundedness === "rounded-none" ? `
          .rounded-xl, .rounded-2xl, .rounded-3xl, .rounded-lg, .rounded-md, .rounded-full, button, input, select, textarea { border-radius: 0px !important; }
        ` : siteSettings.buttonRoundedness === "rounded-md" ? `
          .rounded-xl, .rounded-2xl, .rounded-3xl, .rounded-lg, .rounded-md, .rounded-full, button, input, select, textarea { border-radius: 6px !important; }
        ` : siteSettings.buttonRoundedness === "rounded-xl" ? `
          .rounded-xl, .rounded-2xl, .rounded-3xl { border-radius: 12px !important; }
          button, input, select, textarea { border-radius: 10px !important; }
        ` : siteSettings.buttonRoundedness === "rounded-3xl" ? `
          .rounded-xl, .rounded-2xl, .rounded-3xl { border-radius: 24px !important; }
          button, input, select, textarea { border-radius: 18px !important; }
        ` : siteSettings.buttonRoundedness === "rounded-full" ? `
          .rounded-xl, .rounded-2xl, .rounded-3xl, .rounded-full, button { border-radius: 9999px !important; }
          input, select, textarea { border-radius: 12px !important; }
        ` : ""}
      `}</style>

      {/* Top Main Navigation Header */}
      <header className="bg-white border-b border-slate-100/80 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => setCurrentTab("home")}
            className="flex items-center gap-2 sm:gap-3 group text-left cursor-pointer shrink-0"
          >
            <div className="w-11 h-11 bg-amber-50 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-md transition-transform group-hover:scale-105 duration-200 shrink-0 border border-amber-100/50">
              <DuckTruckLogo
                className="w-9 h-9"
                logoType={siteSettings.logoType}
                customLogoUrl={siteSettings.customLogoUrl}
              />
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-sm font-black font-display text-slate-900 tracking-tight block">
                {siteSettings.appName}
              </span>
              <span className="text-[10px] text-slate-400 font-extrabold tracking-wide block uppercase">
                {siteSettings.appSlogan}
              </span>
            </div>
            <div className="block sm:hidden text-left">
              <span className="text-sm font-black font-display text-slate-900 tracking-tight">
                {siteSettings.appName}
              </span>
            </div>
          </button>

          {/* Desktop Nav menu */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-bold text-slate-500">
            <button
              onClick={() => setCurrentTab("home")}
              className={`hover:text-slate-950 transition-all cursor-pointer ${currentTab === "home" ? "text-slate-950" : ""}`}
            >
              {siteSettings.menuHomeText}
            </button>
            {siteSettings.showHowItWorksSection !== false && (
              <button
                onClick={() => setCurrentTab("how_it_works")}
                className={`hover:text-slate-950 transition-all cursor-pointer ${currentTab === "how_it_works" ? "text-slate-950" : ""}`}
              >
                {siteSettings.menuHowItWorksText || "Hizmet Nasıl Çalışır"}
              </button>
            )}
            <button
              onClick={() => setCurrentTab("discover_movers")}
              className={`hover:text-slate-950 transition-all cursor-pointer ${currentTab === "discover_movers" ? "text-slate-950" : ""}`}
            >
              {siteSettings.menuDiscoverText}
            </button>
            {siteSettings.showFaqsSection !== false && (
              <button
                onClick={() => setCurrentTab("help_center")}
                className={`hover:text-slate-950 transition-all cursor-pointer ${currentTab === "help_center" ? "text-slate-950" : ""}`}
              >
                {siteSettings.menuFaqsText || "Sık Sorulan Sorular"}
              </button>
            )}
            {siteSettings.showBlogSection !== false && (
              <button
                onClick={() => setCurrentTab("blog")}
                className={`hover:text-slate-950 transition-all cursor-pointer ${currentTab === "blog" ? "text-slate-950" : ""}`}
              >
                {siteSettings.menuBlogText || "Blog"}
              </button>
            )}
          </nav>

          {/* User Auth controls */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {currentUser ? (
              <div className="flex items-center gap-1.5 sm:gap-3">
                {/* Real-time Notifications */}
                <NotificationCenter userId={currentUser.id} onNotificationClick={handleNotificationClick} />

                {/* Dashboard Access Button */}
                <button
                  onClick={() => setCurrentTab("dashboard")}
                  className={`hidden md:flex px-3 py-2 rounded-xl text-xs font-extrabold items-center gap-1.5 transition-all cursor-pointer ${
                    currentTab === "dashboard" ? "bg-slate-950 text-white shadow-md" : "bg-slate-50 hover:bg-slate-100 text-slate-700"
                  }`}
                  title={siteSettings.menuDashboardText}
                >
                  <Compass className="w-4 h-4" />
                  <span className="hidden md:inline">{siteSettings.menuDashboardText}</span>
                </button>

                {/* Profile Access Button */}
                <button
                  onClick={() => setCurrentTab("profile")}
                  className={`hidden md:flex px-3 py-2 rounded-xl text-xs font-extrabold items-center gap-1.5 transition-all cursor-pointer ${
                    currentTab === "profile" ? "bg-slate-950 text-white shadow-md" : "bg-slate-50 hover:bg-slate-100 text-slate-700"
                  }`}
                  title={siteSettings.menuProfileText}
                >
                  <User className="w-4 h-4" />
                  <span className="hidden md:inline">{siteSettings.menuProfileText}</span>
                </button>

                {/* Chats Link */}
                <button
                  onClick={() => setCurrentTab("chats")}
                  className={`hidden md:flex relative p-2 text-slate-600 hover:text-slate-950 rounded-full hover:bg-slate-50 transition-all cursor-pointer ${
                    currentTab === "chats" ? "bg-slate-50 text-slate-950" : ""
                  }`}
                  title="Sohbetler"
                >
                  <MessageSquare className="w-5 h-5" />
                  {countUnreadChats > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-blue-600 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-bounce">
                      {countUnreadChats}
                    </span>
                  )}
                </button>

                {/* Admin Button for alibuyukuyar268@gmail.com */}
                {currentUser && (currentUser.role === "ADMIN" || currentUser.isAdmin || currentUser.email === "alibuyukuyar268@gmail.com") && (
                  <button
                    onClick={() => setCurrentTab("admin")}
                    className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                    title="Yönetim Paneli"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Admin</span>
                  </button>
                )}

                {/* Log Out */}
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all cursor-pointer"
                  title="Güvenli Çıkış"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                <button
                  onClick={() => {
                    setAuthModalIsLogin(true);
                    setAuthModalRole("CUSTOMER");
                    setAuthModalOpen(true);
                  }}
                  className="px-3.5 py-2 sm:px-4 sm:py-2 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm shadow-slate-950/15"
                >
                  Giriş Yap
                </button>
                <button
                  onClick={() => {
                    setAuthModalIsLogin(true);
                    setAuthModalRole("MOVING_COMPANY");
                    setAuthModalOpen(true);
                  }}
                  className="hidden sm:block px-2.5 py-2 sm:px-4 sm:py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-all cursor-pointer border border-blue-100/80 whitespace-nowrap"
                >
                  Firma Girişi / Üye Ol
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 ml-1"
            aria-label="Menü"
          >
            <Menu className="w-5.5 h-5.5" />
          </button>
        </div>
      </header>

      {/* Main Container Content */}
      <main className="flex-1 pb-20 md:pb-0">
        {loading ? (
          <div className="py-32 text-center space-y-4">
            <div className="inline-block w-10 h-10 border-4 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Altyapı yükleniyor...</p>
          </div>
        ) : (
          <>
            {/* 1. HOME TAB (Ana Sayfa) */}
            {currentTab === "home" && (
              <div className="space-y-8 sm:space-y-16 animate-in fade-in duration-300 text-left">
                {/* Hero section with customizable background */}
                <div className="relative overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-xs max-w-7xl mx-auto mt-4 sm:mt-6">
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
                  
                  <div className="relative z-10 px-4 py-8 sm:px-6 sm:py-16 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-12 items-center">
                    <div className="lg:col-span-6 space-y-4 sm:space-y-6">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 text-[10px] sm:text-xs font-extrabold rounded-full border border-amber-100 text-left">
                        <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600 animate-pulse" />
                        {siteSettings.heroBadgeText}
                      </span>
                      <h1 className="text-2xl sm:text-4xl md:text-5xl font-black font-display tracking-tight text-slate-900 leading-tight text-left">
                        {siteSettings.heroTitle}
                      </h1>
                      <p className="text-slate-500 text-xs sm:text-sm md:text-base leading-relaxed max-w-lg text-left">
                        {siteSettings.heroDescription}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2 pt-1 w-full sm:w-auto">
                        <button
                          onClick={() => {
                            if (!currentUser) {
                              setAuthModalIsLogin(true);
                              setAuthModalRole("CUSTOMER");
                              setAuthModalOpen(true);
                            } else {
                              setCurrentTab("create_request");
                            }
                          }}
                          className="w-full sm:w-auto px-4 py-2.5 sm:px-6 sm:py-3 bg-slate-950 hover:bg-slate-800 text-white font-bold text-[11px] sm:text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                        >
                          {siteSettings.heroButtonRequestText || "Hemen Talep Oluştur"} <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setCurrentTab("discover_movers")}
                          className="w-full sm:w-auto px-4 py-2.5 sm:px-6 sm:py-3 bg-white border border-slate-200 text-slate-700 font-bold text-[11px] sm:text-xs rounded-xl hover:bg-slate-50 transition-all cursor-pointer text-center whitespace-nowrap"
                        >
                          {siteSettings.heroButtonDiscoverText || "Firmaları Keşfet"}
                        </button>
                      </div>

                      {siteSettings.showStatsRow && (
                        <div className="grid grid-cols-3 gap-2 sm:gap-6 pt-4 sm:pt-6 border-t border-slate-100">
                          {siteSettings.showFirmsCount !== false && (
                            <div className="text-left">
                              <span className="text-base sm:text-2xl font-black text-slate-950">
                                {siteSettings.statsMode === "real" ? `${companies.length}+` : (siteSettings.customFirmsText || "500+")}
                              </span>
                              <p className="text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 leading-tight">Kayıtlı Firma</p>
                            </div>
                          )}
                          {siteSettings.showTransfersCount !== false && (
                            <div className="text-left">
                              <span className="text-base sm:text-2xl font-black text-slate-950">
                                {siteSettings.statsMode === "real" ? `${completedRequestsCount}+` : (siteSettings.customTransfersText || "12k+")}
                              </span>
                              <p className="text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 leading-tight">Başarılı Taşıma</p>
                            </div>
                          )}
                          {siteSettings.showSatisfactionRate !== false && (
                            <div className="text-left">
                              <span className="text-base sm:text-2xl font-black text-slate-950">
                                {siteSettings.statsMode === "real" ? `%${averageSatisfaction}` : (siteSettings.customSatisfactionText || "99.4%")}
                              </span>
                              <p className="text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 leading-tight">Memnuniyet</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Aesthetic visual illustration */}
                    <div className="lg:col-span-6 relative flex flex-col items-center">
                      {siteSettings.showHeroSloganCard !== false && (
                        <>
                          <div className="relative w-full max-w-md aspect-square p-1.5 bg-gradient-to-br from-slate-100 to-slate-200 rounded-[34px] border border-slate-200 shadow-xl flex items-center justify-center animate-in zoom-in-95 duration-500">
                            <div 
                              className="relative w-full h-full bg-zinc-950 rounded-[28px] overflow-hidden border border-slate-300/30"
                              onTouchStart={handleTouchStart}
                              onTouchMove={handleTouchMove}
                              onTouchEnd={handleTouchEnd}
                            >
                              {/* Slide track */}
                              <div 
                                className="flex w-[200%] h-full transition-transform duration-700 ease-in-out"
                                style={{ transform: `translateX(-${heroImgIndex * 50}%)` }}
                              >
                                {/* Slide 1 */}
                                <div className="w-1/2 h-full relative">
                                  <img 
                                    src={siteSettings.heroSliderImage1 || "/img/kare1.png"} 
                                    alt="Nakliye Görseli 1" 
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                {/* Slide 2 */}
                                <div className="w-1/2 h-full relative">
                                  <img 
                                    src={siteSettings.heroSliderImage2 || "/img/kare2.png"} 
                                    alt="Nakliye Görseli 2" 
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Navigation Dots Below Card */}
                          <div className="flex gap-2.5 mt-4 justify-center bg-slate-100/80 px-4 py-2 rounded-full border border-slate-200/50 shadow-sm w-fit">
                            <button 
                              onClick={() => setHeroImgIndex(0)}
                              className={`w-3 h-3 rounded-full transition-all duration-300 ${heroImgIndex === 0 ? "bg-amber-500 scale-125" : "bg-slate-300 hover:bg-slate-400"}`}
                            />
                            <button 
                              onClick={() => setHeroImgIndex(1)}
                              className={`w-3 h-3 rounded-full transition-all duration-300 ${heroImgIndex === 1 ? "bg-amber-500 scale-125" : "bg-slate-300 hover:bg-slate-400"}`}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Values & Safety Section */}
                {siteSettings.showValuesSection !== false && (
                  <div className="bg-slate-900 text-white py-8 sm:py-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                      <div className="space-y-2">
                        <div className="p-2 sm:p-3 bg-white/5 rounded-xl sm:rounded-2xl text-blue-400 w-fit border border-white/5">
                          <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <h3 className="text-sm sm:text-lg font-bold font-display">{siteSettings.value1Title || "Doğrulanmış Firmalar"}</h3>
                        <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                          {siteSettings.value1Desc || "Tüm teklif veren şirketler vergi levhası, yetki belgesi ve sürücü ehliyetleri yönünden admin ekibimizce kontrol edilir."}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="p-2 sm:p-3 bg-white/5 rounded-xl sm:rounded-2xl text-emerald-400 w-fit border border-white/5">
                          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <h3 className="text-sm sm:text-lg font-bold font-display">{siteSettings.value2Title || "Aracısız & Komisyonsuz"}</h3>
                        <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                          {siteSettings.value2Desc || "Online ödeme zorunluluğu yok! Ödemeyi doğrudan el sıkıştığınız firmaya yapın, gizli komisyonlardan kurtulun."}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="p-2 sm:p-3 bg-white/5 rounded-xl sm:rounded-2xl text-indigo-400 w-fit border border-white/5">
                          <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <h3 className="text-sm sm:text-lg font-bold font-display">{siteSettings.value3Title || "Gerçek Zamanlı Sohbet"}</h3>
                        <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                          {siteSettings.value3Desc || "İletişime geçmek için telefon araması beklemeyin. Harita konumu, eşya fotoğrafları ve detayları sohbet üzerinden paylaşın."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Moving Company CTA section */}
                {siteSettings.showCarrierCTA !== false && (
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
                    <div className="bg-blue-600 rounded-2xl sm:rounded-3xl p-5 sm:p-12 text-white relative overflow-hidden shadow-xl border border-blue-500/30">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent)] pointer-events-none"></div>
                      <div className="relative z-10 max-w-2xl space-y-2.5 sm:space-y-4">
                        <span className="px-2.5 py-1 bg-white/10 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider rounded-full border border-white/10 w-fit">
                          {siteSettings.carrierCTABadge || "Nakliyat Firmaları İçin"}
                        </span>
                        <h2 className="text-lg sm:text-3xl font-black font-display tracking-tight leading-tight">
                          {siteSettings.carrierCTATitle || "Platformumuzda Yer Alarak İşlerinizi Büyütün"}
                        </h2>
                        <p className="text-blue-100 text-[11px] sm:text-sm leading-relaxed">
                          {siteSettings.carrierCTADesc || "Her gün yüzlerce müşteri evden eve nakliye talebi açıyor. Komisyonsuz, doğrudan müşteriye teklif verin, harita üzerinden mesafe görün..."}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2 pt-1">
                          <button
                            onClick={() => {
                              if (currentUser) {
                                if (currentUser.role === "CUSTOMER") {
                                  if (window.confirm("Bireysel müşteri hesabınızı Nakliye Firması hesabına yükseltmek ve hemen firma kaydı açmak istiyor musunuz?")) {
                                    const updatedProfile = {
                                      ...currentUser,
                                      role: "MOVING_COMPANY" as const,
                                      isOnboarded: false,
                                      isAdmin: currentUser.role === "ADMIN" || currentUser.isAdmin || currentUser.email === "alibuyukuyar268@gmail.com" ? true : false
                                    };
                                    setDoc(doc(db, "users", currentUser.id), updatedProfile, { merge: true })
                                      .then(() => {
                                        setCurrentUser(updatedProfile);
                                        setCurrentTab("dashboard");
                                      })
                                      .catch((err) => console.error(err));
                                  }
                                } else {
                                  setCurrentTab("dashboard");
                                }
                              } else {
                                setAuthModalIsLogin(false);
                                setAuthModalRole("MOVING_COMPANY");
                                setAuthModalOpen(true);
                              }
                            }}
                            className="w-full sm:w-auto px-4 py-2.5 sm:px-5 sm:py-3 bg-white text-blue-700 font-extrabold text-[11px] sm:text-xs rounded-xl shadow-lg hover:bg-blue-50 transition-all cursor-pointer text-center"
                          >
                            {siteSettings.carrierCTAPrimaryBtn || "Hemen Ücretsiz Firma Kaydı Aç"}
                          </button>
                          <button
                            onClick={() => {
                              if (currentUser) {
                                if (currentUser.role === "CUSTOMER") {
                                  if (window.confirm("Zaten bir müşteri hesabıyla giriş yapmış durumdasınız. Bu hesabı Nakliye Firması hesabına yükseltmek ve firma girişi yapmak istiyor musunuz?")) {
                                    const updatedProfile = {
                                      ...currentUser,
                                      role: "MOVING_COMPANY" as const,
                                      isOnboarded: false,
                                      isAdmin: currentUser.role === "ADMIN" || currentUser.isAdmin || currentUser.email === "alibuyukuyar268@gmail.com" ? true : false
                                    };
                                    setDoc(doc(db, "users", currentUser.id), updatedProfile, { merge: true })
                                      .then(() => {
                                        setCurrentUser(updatedProfile);
                                        setCurrentTab("dashboard");
                                      })
                                      .catch((err) => console.error(err));
                                  }
                                } else {
                                  setCurrentTab("dashboard");
                                }
                              } else {
                                setAuthModalIsLogin(true);
                                setAuthModalRole("MOVING_COMPANY");
                                setAuthModalOpen(true);
                              }
                            }}
                            className="w-full sm:w-auto px-4 py-2.5 sm:px-5 sm:py-3 bg-blue-700 text-white border border-blue-500 hover:bg-blue-800 font-extrabold text-[11px] sm:text-xs rounded-xl transition-all cursor-pointer text-center"
                          >
                            {siteSettings.carrierCTASecondaryBtn || "Firma Girişi Yap"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. HOW IT WORKS VIEW */}
            {currentTab === "how_it_works" && <HowItWorksView siteSettings={siteSettings} />}

            {/* 3. DISCOVER MOVERS VIEW */}
            {currentTab === "discover_movers" && (
              <DiscoverMoversView
                companies={companies}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
                siteSettings={siteSettings}
              />
            )}

            {/* 4. CREATE REQUEST VIEW */}
            {currentTab === "create_request" && currentUser && (
              <CreateRequestForm
                user={currentUser}
                companies={companies}
                onSuccess={() => {
                  alert("Talebiniz başarıyla oluşturuldu ve yayınlandı! Nakliyat firmaları teklif gönderdiğinde bildirim alacaksınız.");
                  setCurrentTab("dashboard");
                }}
                onCancel={() => setCurrentTab("home")}
              />
            )}

            {/* 5. DASHBOARD VIEW (Customer vs Company) */}
            {currentTab === "dashboard" && currentUser && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
                
                {/* Dual Dashboard Switcher */}
                {currentUser.role !== "ADMIN" && (
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200/60 rounded-3xl mb-2">
                    <div className="space-y-1 text-center md:text-left">
                      <h3 className="text-sm font-black text-slate-900 font-display flex items-center justify-center md:justify-start gap-2">
                        <span>Dual Panel Kontrolü</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-[9px] font-black uppercase rounded-full">
                          AKTİF
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-500 max-w-md leading-relaxed">
                        Aynı hesap üzerinden hem müşteri ilanlarınızı yönetebilir hem de nakliyeci olarak teklif verebilirsiniz.
                      </p>
                    </div>

                    <div className="bg-slate-200/70 p-1 rounded-2xl flex w-full md:w-auto shadow-inner border border-slate-200">
                      <button
                        onClick={() => setDashboardViewMode("customer")}
                        className={`flex-1 md:flex-initial py-2.5 px-6 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          dashboardViewMode === "customer"
                            ? "bg-white text-blue-700 shadow-md ring-1 ring-black/5 font-black"
                            : "text-slate-500 hover:text-slate-800 font-bold"
                        }`}
                      >
                        <User className="w-4 h-4" />
                        Müşteri Paneli
                      </button>
                      <button
                        onClick={() => {
                          if (currentUser.role !== "MOVING_COMPANY") {
                            if (window.confirm("Taşımacı Paneline erişmek için hesabınızı Taşımacı Hesabına yükseltmeniz ve firma kaydınızı tamamlamanız gerekmektedir. Şimdi firma kayıt sayfasına gitmek istiyor musunuz?")) {
                              const updatedProfile = {
                                ...currentUser,
                                role: "MOVING_COMPANY" as const,
                                isOnboarded: false,
                              };
                              setDoc(doc(db, "users", currentUser.id), updatedProfile, { merge: true })
                                .then(() => {
                                  setCurrentUser(updatedProfile);
                                  setDashboardViewMode("company");
                                })
                                .catch((err) => console.error(err));
                            }
                          } else {
                            setDashboardViewMode("company");
                          }
                        }}
                        className={`flex-1 md:flex-initial py-2.5 px-6 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          dashboardViewMode === "company"
                            ? "bg-white text-blue-700 shadow-md ring-1 ring-black/5 font-black"
                            : "text-slate-500 hover:text-slate-800 font-bold"
                        }`}
                      >
                        <Truck className="w-4 h-4" />
                        Taşımacı Paneli
                        {currentUser.role !== "MOVING_COMPANY" && (
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[8px] font-black uppercase rounded ml-1 animate-pulse">Aktif Et</span>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Dashboard View rendering */}
                {dashboardViewMode === "company" && currentUser.role === "MOVING_COMPANY" ? (
                  <DashboardCompany
                    user={currentUser}
                    onOpenChat={handleOpenChat}
                    activeSubTab={companyActiveSubTab}
                    setActiveSubTab={setCompanyActiveSubTab}
                    siteSettings={siteSettings}
                  />
                ) : (
                  <DashboardCustomer
                    user={currentUser}
                    onOpenChat={handleOpenChat}
                    favorites={favorites}
                    toggleFavorite={toggleFavorite}
                    onNavigateToAdmin={() => setCurrentTab("admin")}
                    selectedRequestId={selectedRequestId}
                    setSelectedRequestId={setSelectedRequestId}
                    siteSettings={siteSettings}
                  />
                )}
              </div>
            )}

            {/* 6. CHATS LIST VIEW */}
            {currentTab === "chats" && currentUser && (
              <div className="max-w-5xl mx-auto py-8 px-4 space-y-6 animate-in fade-in duration-300">
                <div>
                  <h2 className="text-xl font-bold font-display text-slate-900">Mesajlarım ve Görüşmelerim</h2>
                  <p className="text-xs text-slate-500">Müşteriler veya nakliye firmalarıyla yaptığınız anlık tüm yazışmalar.</p>
                </div>

                {activeChats.length === 0 ? (
                  <div className="bg-white p-16 text-center rounded-3xl border border-slate-100 text-slate-400 text-xs">
                    Henüz aktif bir sohbetiniz bulunmuyor. Talepler üzerinden soru sorarak sohbete başlayabilirsiniz.
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm divide-y divide-slate-50">
                    {activeChats.map((chat) => {
                      const opponent = currentUser.role === "CUSTOMER" ? chat.companyName : chat.customerName;
                      const unread = currentUser.role === "CUSTOMER" ? chat.unreadCountCustomer : chat.unreadCountCompany;

                      return (
                        <div
                          key={chat.id}
                          onClick={() => handleOpenChat(chat.id, opponent, chat.requestTitle)}
                          className={`p-4 hover:bg-slate-50/50 flex items-center justify-between gap-4 cursor-pointer transition-all ${
                            unread > 0 ? "bg-blue-50/10 font-bold" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-10 h-10 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
                              {opponent.slice(0, 2)}
                            </span>
                            <div>
                              <h4 className="text-xs font-bold text-slate-900">{opponent}</h4>
                              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                                {chat.lastMessageText || "Görüşme başlatıldı"}
                              </p>
                              <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Talep: {chat.requestTitle}</p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-[9px] text-slate-400">
                              {chat.lastMessageTime ? new Date(chat.lastMessageTime).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) : ""}
                            </p>
                            {unread > 0 && (
                              <span className="inline-block mt-1 w-2.5 h-2.5 bg-blue-600 rounded-full" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 7. HELP CENTER / FAQ */}
            {currentTab === "help_center" && <HelpCenterView siteSettings={siteSettings} />}

            {/* 8. PRIVACY AND TERMS */}
            {currentTab === "privacy" && <PrivacyTermsView siteSettings={siteSettings} />}

            {/* 9. BLOG TAB */}
            {currentTab === "blog" && (
              <div className="max-w-6xl mx-auto py-12 px-4 space-y-8 animate-in fade-in duration-300">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-extrabold font-display text-slate-900">{siteSettings.blogTitle || "Ev Taşıma Rehberi & Blog"}</h2>
                  <p className="text-sm text-slate-500 max-w-xl mx-auto">{siteSettings.blogSub || "Doğru paketleme, nakliyeci seçimi ve taşınma tüyoları."}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {(blogs.length > 0 ? blogs : [
                    {
                      id: "fallback-1",
                      tag: siteSettings.blog1Tag || "Tüyolar",
                      title: siteSettings.blog1Title || "Yeni Eve Taşınırken Paketleme Nasıl Yapılmalı?",
                      content: siteSettings.blog1Desc || "Kırılacak cam eşyaların patpat balona sarılması, tabakların dikey istiflenmesi ve kolilerin oda bazlı etiketlenmesi süreci %50 hızlandırır. Paketleme aşamasında mutlaka her kutunun üzerine hangi odaya ait olduğunu kalın bir keçe kalemle yazın. Bu işlem taşıma günü hem nakliyeciler hem de sizin için yerleştirme süresini yarı yarıya indirecektir.",
                      createdAt: "2026-06-15T12:00:00.000Z",
                    },
                    {
                      id: "fallback-2",
                      tag: siteSettings.blog2Tag || "Güvenlik",
                      title: siteSettings.blog2Title || "Doğru Nakliyat Firması Seçerken Nelere Dikkat Edilmeli?",
                      content: siteSettings.blog2Desc || "Yetki belgesi, sigortalı taşımacılık şartları ve diğer müşterilerin doğrulanmış puan yorumları en doğru firma tercihini yapmanızı sağlar. Nakliye sözleşmesi yapmayı unutmayın ve mutlaka eşya sigortasının neleri kapsadığını yazılı olarak isteyin.",
                      createdAt: "2026-06-20T14:30:00.000Z",
                    }
                  ]).map((blog, idx) => {
                    const bgGradients = [
                      "from-blue-500 to-indigo-600",
                      "from-emerald-500 to-teal-600",
                      "from-orange-500 to-amber-600",
                      "from-rose-500 to-pink-600",
                      "from-violet-500 to-purple-600",
                    ];
                    const grad = bgGradients[idx % bgGradients.length];

                    return (
                      <div 
                        key={blog.id || idx} 
                        className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all duration-300 group cursor-pointer"
                        onClick={() => setSelectedBlogPost(blog)}
                      >
                        {blog.imageUrl ? (
                          <div className="h-48 overflow-hidden relative bg-slate-100 shrink-0">
                            <img 
                              src={blog.imageUrl} 
                              alt={blog.title} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ) : (
                          <div className={`h-48 bg-gradient-to-br ${grad} p-6 flex flex-col justify-between relative overflow-hidden shrink-0`}>
                            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                            <span className="text-[10px] font-bold bg-white/20 text-white px-2.5 py-1 rounded-full uppercase tracking-wider w-fit backdrop-blur-sm">
                              {blog.tag}
                            </span>
                            <BookOpen className="w-12 h-12 text-white/30 absolute right-6 top-6" />
                            <h4 className="text-white font-bold text-lg leading-tight line-clamp-2">
                              {blog.title}
                            </h4>
                          </div>
                        )}

                        <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                          <div className="space-y-2">
                            {blog.imageUrl && (
                              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                                {blog.tag}
                              </span>
                            )}
                            <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-2">
                              {blog.title}
                            </h3>
                            <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                              {blog.content}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-slate-50 text-[10px] text-slate-400">
                            <span>
                              {new Date(blog.createdAt).toLocaleDateString("tr-TR", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </span>
                            <span className="text-amber-600 font-bold group-hover:underline flex items-center gap-1">
                              Devamını Oku <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Detailed Blog Modal */}
                {selectedBlogPost && (
                  <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col animate-in zoom-in-95 duration-200 scrollbar-thin">
                      <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
                        <span className="text-xs font-bold text-amber-600 uppercase tracking-wider bg-amber-50 px-2.5 py-1 rounded-full">
                          {selectedBlogPost.tag}
                        </span>
                        <button 
                          onClick={() => setSelectedBlogPost(null)}
                          className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {selectedBlogPost.imageUrl && (
                        <div className="h-64 overflow-hidden relative shrink-0">
                          <img 
                            src={selectedBlogPost.imageUrl} 
                            alt={selectedBlogPost.title} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      <div className="p-6 sm:p-8 space-y-4">
                        <div className="space-y-2">
                          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
                            {selectedBlogPost.title}
                          </h2>
                          <p className="text-[11px] text-slate-400">
                            Yayınlanma Tarihi:{" "}
                            {new Date(selectedBlogPost.createdAt).toLocaleDateString("tr-TR", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>

                        <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line border-t border-slate-100 pt-4">
                          {selectedBlogPost.content}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 10. ADMIN TAB */}
            {currentTab === "admin" && currentUser && (currentUser.role === "ADMIN" || currentUser.isAdmin || currentUser.email === "alibuyukuyar268@gmail.com") && (
              <AdminPanelComponent
                user={currentUser}
                onClose={() => setCurrentTab("home")}
                setParentSiteSettings={setSiteSettings}
              />
            )}

            {/* 11. PROFILE TAB */}
            {currentTab === "profile" && currentUser && (
              <ProfileComponent
                user={currentUser}
                onUpdate={(updatedProfile) => {
                  setCurrentUser(updatedProfile);
                }}
                onNavigateToTab={(tab) => setCurrentTab(tab)}
              />
            )}
          </>
        )}
      </main>

      {/* Footer view */}
      <footer className="bg-slate-900 text-white border-t border-slate-800 py-12 shrink-0 pb-28 md:pb-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center border border-amber-100/30 text-left">
                <DuckTruckLogo
                  className="w-7 h-7"
                  logoType={siteSettings.logoType}
                  customLogoUrl={siteSettings.customLogoUrl}
                />
              </div>
              <h3 className="text-sm font-black font-display tracking-tight text-white text-left">
                {siteSettings.appName}
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed text-left">
              {siteSettings.footerDescription}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold font-display uppercase tracking-widest text-slate-400">Hızlı Linkler</h3>
            <ul className="space-y-2 text-[11px] text-slate-400 font-semibold">
              {siteSettings.showHowItWorksSection !== false && (
                <li><button onClick={() => setCurrentTab("how_it_works")} className="hover:text-white transition-all cursor-pointer">{siteSettings.menuHowItWorksText || "Nasıl Çalışır?"}</button></li>
              )}
              <li><button onClick={() => setCurrentTab("discover_movers")} className="hover:text-white transition-all cursor-pointer">{siteSettings.menuDiscoverText || "Firmaları Keşfet"}</button></li>
              {siteSettings.showFaqsSection !== false && (
                <li><button onClick={() => setCurrentTab("help_center")} className="hover:text-white transition-all cursor-pointer">{siteSettings.menuFaqsText || "Sık Sorulan Sorular"}</button></li>
              )}
              {siteSettings.showBlogSection !== false && (
                <li><button onClick={() => setCurrentTab("blog")} className="hover:text-white transition-all cursor-pointer">{siteSettings.menuBlogText || "Blog"}</button></li>
              )}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold font-display uppercase tracking-widest text-slate-400">Yasal Mevzuat</h3>
            <ul className="space-y-2 text-[11px] text-slate-400 font-semibold">
              <li><button onClick={() => setCurrentTab("privacy")} className="hover:text-white transition-all cursor-pointer">{siteSettings.menuPrivacyText || "Gizlilik Politikası"}</button></li>
              <li><button onClick={() => setCurrentTab("privacy")} className="hover:text-white transition-all cursor-pointer">{siteSettings.privacyTermsTitle || "Kullanım Koşulları"}</button></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold font-display uppercase tracking-widest text-slate-400">Destek & Yardım</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Her türlü uyuşmazlık, soru ve destek talebi için doğrudan e-posta atın veya anlık bildirim oluşturun.
            </p>
            <p className="text-xs font-extrabold text-blue-400 flex items-center gap-1.5 cursor-pointer" onClick={() => setComplaintOpen(true)}>
              <AlertOctagon className="w-4 h-4" /> Uyuşmazlık / Şikayet Bildir
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-8 pt-8 border-t border-slate-800 text-center text-[10px] text-slate-500 font-bold tracking-wide">
          &copy; 2026 NAKLİYE PAZARYERİ PLATFORMU. TÜM HAKLARI SAKLIDIR.
        </div>
      </footer>

      {/* Auth modal overlay */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultRole={authModalRole}
        siteSettings={siteSettings}
        onAuthSuccess={(profile) => {
          setCurrentUser(profile);
          setAuthModalOpen(false);
          // Auto route to appropriate place
          setCurrentTab("dashboard");
        }}
      />

      {/* Cookie & KVKK Consent Banner */}
      <CookieConsentBanner
        currentUser={currentUser}
        onConsentSaved={(updatedProfile) => {
          setCurrentUser(updatedProfile);
        }}
      />

      {/* Complaint / Dispute overlay */}
      {complaintOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-display text-slate-900 flex items-center gap-1.5">
                <AlertOctagon className="w-5 h-5 text-rose-500" /> Şikayet / Uyuşmazlık Kaydı
              </h3>
              <button onClick={() => setComplaintOpen(false)} className="p-1 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Müşteri veya firma ile olan taşıma operasyonunda yaşadığınız uyuşmazlığı bildirin. Destek ekibimiz tarafları arayarak çözüme ulaştıracaktır.
            </p>

            <form onSubmit={handleSendComplaint} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Şikayet Edilen Taraf</label>
                <input
                  type="text"
                  required
                  placeholder="Firma veya Müşteri Adı"
                  value={reportedName}
                  onChange={(e) => setReportedName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Şikayet Nedeni</label>
                <select
                  value={complaintReason}
                  onChange={(e) => setComplaintReason(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option>Fiyat Anlaşmazlığı</option>
                  <option>Eşya Hasarı / Zarar</option>
                  <option>Geç Kalma / Operasyon Aksaklığı</option>
                  <option>İletişim ve Saygısız Davranış</option>
                  <option>Diğer Sorunlar</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Detaylar</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Lütfen yaşanan durumu tarafsız ve tüm detayları ile buraya yazın..."
                  value={complaintDetails}
                  onChange={(e) => setComplaintDetails(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-slate-950 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
              >
                Kayıt Oluştur ve Gönder
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Real-time Chat modal popup */}
      {openedChat && currentUser && (
        <ChatModal
          chatId={openedChat.id}
          user={currentUser}
          requestTitle={openedChat.title}
          opponentName={openedChat.name}
          onClose={() => setOpenedChat(null)}
        />
      )}

      {/* Mobile Bottom Navigation Bar (Mobile App Feel) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-lg border-t border-slate-100/80 px-2 py-2 flex items-center justify-around md:hidden shadow-2xl rounded-t-2xl">
        <button
          onClick={() => setCurrentTab("home")}
          className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
            currentTab === "home" ? "text-blue-600 font-bold" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Home className="w-5 h-5 shrink-0" />
          <span className="text-[9px] font-black tracking-wide">{siteSettings.menuHomeText}</span>
        </button>

        <button
          onClick={() => setCurrentTab("discover_movers")}
          className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
            currentTab === "discover_movers" ? "text-blue-600 font-bold" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Compass className="w-5 h-5 shrink-0" />
          <span className="text-[9px] font-black tracking-wide">{siteSettings.menuDiscoverText}</span>
        </button>

        {currentUser ? (
          <>
            {currentUser.role === "CUSTOMER" ? (
              <button
                onClick={() => setCurrentTab("create_request")}
                className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
                  currentTab === "create_request" ? "text-blue-600 font-bold" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <PlusCircle className="w-5 h-5 shrink-0" />
                <span className="text-[9px] font-black tracking-wide">{siteSettings.menuCreateRequestText}</span>
              </button>
            ) : (
              <button
                onClick={() => setCurrentTab("dashboard")}
                className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
                  currentTab === "dashboard" ? "text-blue-600 font-bold" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <Layers className="w-5 h-5 shrink-0" />
                <span className="text-[9px] font-black tracking-wide">{siteSettings.menuDashboardText}</span>
              </button>
            )}

            <button
              onClick={() => setCurrentTab("chats")}
              className={`relative flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
                currentTab === "chats" ? "text-blue-600 font-bold" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <MessageSquare className="w-5 h-5 shrink-0" />
              {countUnreadChats > 0 && (
                <span className="absolute top-1 right-2.5 w-4 h-4 bg-rose-600 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-white animate-pulse">
                  {countUnreadChats}
                </span>
              )}
              <span className="text-[9px] font-black tracking-wide">{siteSettings.menuChatsText}</span>
            </button>

            <button
              onClick={() => setCurrentTab("profile")}
              className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
                currentTab === "profile" ? "text-blue-600 font-bold" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <User className="w-5 h-5 shrink-0" />
              <span className="text-[9px] font-black tracking-wide">{siteSettings.menuProfileText}</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => {
                setAuthModalIsLogin(true);
                setAuthModalRole("CUSTOMER");
                setAuthModalOpen(true);
              }}
              className="flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
            >
              <User className="w-5 h-5 shrink-0" />
              <span className="text-[9px] font-black tracking-wide">Giriş Yap</span>
            </button>
          </>
        )}
      </div>

      {/* Mobile Drawer Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" 
          />
          
          {/* Drawer content */}
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-sm font-black font-display text-slate-900">
                {siteSettings.appName}
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
              <button
                onClick={() => {
                  setCurrentTab("home");
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentTab === "home" ? "bg-amber-50 text-amber-700" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Home className="w-4 h-4 shrink-0" />
                <span>{siteSettings.menuHomeText}</span>
              </button>

              {siteSettings.showHowItWorksSection !== false && (
                <button
                  onClick={() => {
                    setCurrentTab("how_it_works");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    currentTab === "how_it_works" ? "bg-amber-50 text-amber-700" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <HelpCircle className="w-4 h-4 shrink-0" />
                  <span>{siteSettings.menuHowItWorksText || "Nasıl Çalışır?"}</span>
                </button>
              )}

              <button
                onClick={() => {
                  setCurrentTab("discover_movers");
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentTab === "discover_movers" ? "bg-amber-50 text-amber-700" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Compass className="w-4 h-4 shrink-0" />
                <span>{siteSettings.menuDiscoverText}</span>
              </button>

              {siteSettings.showFaqsSection !== false && (
                <button
                  onClick={() => {
                    setCurrentTab("help_center");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    currentTab === "help_center" ? "bg-amber-50 text-amber-700" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <HelpCircle className="w-4 h-4 shrink-0" />
                  <span>{siteSettings.menuFaqsText || "Sık Sorulan Sorular"}</span>
                </button>
              )}

              {siteSettings.showBlogSection !== false && (
                <button
                  onClick={() => {
                    setCurrentTab("blog");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    currentTab === "blog" ? "bg-amber-50 text-amber-700 font-extrabold" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <BookOpen className="w-4 h-4 shrink-0 text-amber-600" />
                  <span className="font-extrabold">{siteSettings.menuBlogText || "Blog"}</span>
                </button>
              )}

              {/* Account short links on mobile if logged in */}
              {currentUser && (
                <div className="pt-4 mt-4 border-t border-slate-100 space-y-2">
                  <span className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hızlı Erişim</span>
                  
                  <button
                    onClick={() => {
                      setCurrentTab("dashboard");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      currentTab === "dashboard" ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Layers className="w-4 h-4 shrink-0" />
                    <span>{siteSettings.menuDashboardText}</span>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentTab("chats");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      currentTab === "chats" ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 shrink-0" />
                    <span>{siteSettings.menuChatsText}</span>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentTab("profile");
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      currentTab === "profile" ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <User className="w-4 h-4 shrink-0" />
                    <span>{siteSettings.menuProfileText}</span>
                  </button>

                  {/* Admin Panel button */}
                  {currentUser && (currentUser.role === "ADMIN" || currentUser.isAdmin || currentUser.email === "alibuyukuyar268@gmail.com") && (
                    <button
                      onClick={() => {
                        setCurrentTab("admin");
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        currentTab === "admin" ? "bg-rose-50 text-rose-700 font-extrabold" : "text-rose-600 hover:bg-rose-50 font-bold"
                      }`}
                    >
                      <Lock className="w-4 h-4 shrink-0" />
                      <span>Yönetim Paneli</span>
                    </button>
                  )}
                </div>
              )}
            </nav>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-3">
              {currentUser ? (
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Güvenli Çıkış
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setAuthModalIsLogin(true);
                      setAuthModalRole("CUSTOMER");
                      setAuthModalOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="py-2 px-3 bg-slate-950 text-white font-bold text-xs rounded-xl text-center hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    Müşteri Girişi
                  </button>
                  <button
                    onClick={() => {
                      setAuthModalIsLogin(true);
                      setAuthModalRole("MOVING_COMPANY");
                      setAuthModalOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="py-2 px-3 bg-blue-600 text-white font-bold text-xs rounded-xl text-center hover:bg-blue-700 transition-all cursor-pointer"
                  >
                    Firma Girişi
                  </button>
                </div>
              )}
              <div className="text-center text-[9px] text-slate-400 font-bold">
                {siteSettings.appName} &copy; 2026
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
