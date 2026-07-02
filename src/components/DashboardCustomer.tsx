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
  getDocs,
  deleteDoc
} from "firebase/firestore";
import { MovingRequest, Offer, UserProfile, Review, Notification, Announcement, SiteSettings } from "../types";
import {
  MessageSquare,
  Check,
  X,
  Star,
  Clock,
  Layers,
  MapPin,
  Calendar,
  AlertCircle,
  Truck,
  Heart,
  User,
  Sparkles,
  Search,
  CheckCircle,
  Briefcase,
  HelpCircle,
  Award,
  ArrowLeft,
  ShieldAlert,
  Megaphone
} from "lucide-react";

const getFriendlyHouseType = (type: string) => {
  switch (type) {
    case "single_item": return "Tek Parça / Az Eşya";
    case "1+1": return "1+1 Daire";
    case "2+1": return "2+1 Daire";
    case "3+1": return "3+1 Daire";
    case "4+1": return "4+1 Daire";
    case "Villa": return "Müstakil / Villa";
    case "Ofis": return "Ofis / Büro";
    case "factory": return "Fabrika Tesis";
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

interface DashboardCustomerProps {
  user: UserProfile;
  onOpenChat: (chatId: string, opponentName: string, requestTitle: string) => void;
  favorites: string[];
  toggleFavorite: (companyId: string) => void;
  onNavigateToAdmin?: () => void;
  selectedRequestId?: string | null;
  setSelectedRequestId?: (id: string | null) => void;
  siteSettings?: SiteSettings;
}

export default function DashboardCustomer({
  user,
  onOpenChat,
  favorites,
  toggleFavorite,
  onNavigateToAdmin,
  selectedRequestId: propSelectedRequestId,
  setSelectedRequestId: propSetSelectedRequestId,
  siteSettings
}: DashboardCustomerProps) {
  const [requests, setRequests] = useState<MovingRequest[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [allCompanies, setAllCompanies] = useState<UserProfile[]>([]);
  const [receivedReviews, setReceivedReviews] = useState<Review[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Selected request for viewing offers
  const [localSelectedRequestId, setLocalSelectedRequestId] = useState<string | null>(null);
  const selectedRequestId = propSelectedRequestId !== undefined ? propSelectedRequestId : localSelectedRequestId;
  const setSelectedRequestId = propSetSelectedRequestId !== undefined ? propSetSelectedRequestId : setLocalSelectedRequestId;

  const selectedRequest = requests.find((r) => r.id === selectedRequestId) || null;

  // Review & Appeal state
  const [reviewingJob, setReviewingJob] = useState<MovingRequest | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [appealingReview, setAppealingReview] = useState<Review | null>(null);
  const [appealExplanation, setAppealExplanation] = useState("");

  const [loading, setLoading] = useState(true);

  // Offer Comparison States
  const [selectedOffersForComparison, setSelectedOffersForComparison] = useState<string[]>([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  // Customer Dashboard Tab & AI Planner States
  const [activeDashboardTab, setActiveDashboardTab] = useState<"requests" | "planner">("requests");
  const [plannerTasks, setPlannerTasks] = useState([
    { id: "p1", text: "Yeni adreste elektrik, su ve doğalgaz aboneliklerini başlatın.", category: "Abonelikler", completed: false },
    { id: "p2", text: "Eski adresteki aboneliklerinizi sonlandırmak veya taşımak için başvuruları yapın.", category: "Abonelikler", completed: false },
    { id: "p3", text: "Kırılacak hassas mutfak eşyalarını balonlu naylona sarıp kolilere yerleştirin.", category: "Paketleme", completed: false },
    { id: "p4", text: "Kişisel değerli eşyalarınızı, pasaport, tapu, altın vb. güvenli bir çantada kendiniz taşıyın.", category: "Güvenlik", completed: false },
    { id: "p5", text: "Nakliye firmasıyla taşınma günü, saati ve asansör kurulum detaylarını netleştirin.", category: "Koordinasyon", completed: false },
    { id: "p6", text: "Buzdolabını taşınma gününden en az 12 saat önce boşaltıp fişini çekin ve kurutun.", category: "Hazırlık", completed: false },
    { id: "p7", text: "Taşınma günü yeni adreste eşyaların yerleşeceği odaları belirleyin ve işaretleyin.", category: "Yeni Adres", completed: false }
  ]);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);
  const [loadingAiAnalysis, setLoadingAiAnalysis] = useState(false);
  const [newCustomTaskText, setNewCustomTaskText] = useState("");

  const handleToggleTask = (taskId: string) => {
    setPlannerTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };

  const generateAiMovingPlan = async () => {
    setLoadingAiAnalysis(true);
    setAiAnalysisResult(null);

    // Simulate real intelligent synthesis of tasks using request fields, giving instantly responsive master advice
    setTimeout(() => {
      let advice = "";
      if (requests.length === 0) {
        advice = "### 📍 Aktif Talep Bulunamadı\nSistemde henüz aktif bir taşıma talebiniz bulunmuyor. Yeni bir taşıma talebi oluşturduğunuzda, taşınacağınız şehirler arası mesafe, seçtiğiniz eşya adedi ve paketleme taleplerinize göre size özel akıllı uyarılar burada listelenecektir.";
      } else {
        const latestReq = requests[0];
        const isIntercity = latestReq.distanceKm && latestReq.distanceKm > 100;
        const volume = latestReq.calculatedVolume || 0;
        
        advice = `### 📍 Rota ve Mesafe Analizi\n- **Yolculuk Bilgisi**: **${latestReq.pickupAddress.split(",")[0]}** ile **${latestReq.destinationAddress.split(",")[0]}** arasında taşınıyorsunuz. Mesafe yaklaşık **${latestReq.distanceKm || 'belirtilmemiş'} km**.\n${isIntercity ? "- **Şehirlerarası Taşıma Tavsiyesi**: Uzun mesafeli yolculuklarda sarsıntı ihtimali artacağı için kırılacak cam eşyalarınızı balonlu naylon dışında çift kat gazete kağıdıyla destekleyin ve kolilerin içine yumuşak kıyafetler yerleştirerek boşlukları doldurun." : "- **Şehir İçi Taşıma Tavsiyesi**: Kısa mesafe taşımalarında eşyaların hızlı yüklenip indirilmesi planlanır. Yükleme ve indirme alanlarının (bina önü) nakliye aracı için rezerve edildiğinden emin olun."}\n\n### 🛋️ Eşya Hacmi ve Hazırlıklar\n- **Tahmini Hacim**: Talebinize göre toplam eşya hacmi yaklaşık **${volume || 'belirtilmemiş'} m³**.\n${volume > 20 ? "- **Geniş Hacimli Taşıma**: Eşyalarınız geniş bir kamyon kapasitesi gerektiriyor. Demontajı yapılacak gardırop ve yatak odası mobilyalarının vidalarını ve küçük sabitleme elemanlarını şeffaf bir poşete koyup üzerini etiketleyin." : "- **Hafif / Orta Hacimli Taşıma**: Eşya hacminiz bir kamyonet için son derece uygun. Kolileme işlemini kendiniz yapıyorsanız her koliye oda adını yazmayı unutmayın."}\n\n### 📦 Paketleme ve Özel Ekipmanlar\n${latestReq.packingRequired ? "- **Profesyonel Paketleme**: Paketleme hizmeti talep ettiğiniz için ekipler gelmeden önce sadece size özel kişisel bakım malzemelerinizi, ziynet eşyalarınızı ve kıyafetlerinizi önceden valizleyip yanınıza alın." : "- **Bireysel Paketleme**: Paketlemeyi kendiniz üstlendiğiniz için, mukavemeti yüksek çift oluklu koliler kullanmanızı öneririz. Alt kısımlarını koli bandıyla 'H' şeklinde bantlayın."}\n${latestReq.hasPiano || latestReq.hasSafe ? "- **Özel Eşya Uyarısı**: Talebinizde piyano/kasa gibi ağır veya özel hassasiyet gerektiren bir nesne tespit edildi. Taşıma gününde bu eşya için özel askı kayışları ve paletlerin hazır bulundurulacağını firma yetkilisi ile teyit edin." : ""}\n`;
      }
      setAiAnalysisResult(advice);
      setLoadingAiAnalysis(false);
    }, 1200);
  };

  const handleToggleComparison = (offerId: string) => {
    setSelectedOffersForComparison(prev => {
      if (prev.includes(offerId)) {
        return prev.filter(id => id !== offerId);
      } else {
        if (prev.length >= 3) {
          setAlertModal({
            isOpen: true,
            title: "Karşılaştırma Sınırı",
            message: "Aynı anda en fazla 3 teklifi yan yana karşılaştırabilirsiniz."
          });
          return prev;
        }
        return [...prev, offerId];
      }
    });
  };

  // Custom Confirm/Alert Modal states
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
  } | null>(null);

  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  } | null>(null);

  // Load Customer's Requests & Offers from Firestore
  useEffect(() => {
    setLoading(true);

    const reqQuery = query(collection(db, "moving_requests"), where("customerId", "==", user.id));
    const unsubscribeReqs = onSnapshot(reqQuery, (snapshot) => {
      const list: MovingRequest[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as MovingRequest);
      });
      // Sort by newest
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRequests(list);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "moving_requests");
    });

    // Listen to All Offers
    const unsubscribeOffers = onSnapshot(collection(db, "offers"), (snapshot) => {
      const list: Offer[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Offer);
      });
      setOffers(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "offers");
    });

    // Listen to Reviews Received by Customer
    const qMyReviews = query(collection(db, "reviews"), where("targetId", "==", user.id));
    const unsubscribeMyReviews = onSnapshot(qMyReviews, (snapshot) => {
      const list: Review[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Review);
      });
      setReceivedReviews(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `reviews_customer_${user.id}`);
    });

    // Fetch all companies to show reviews and lists
    const fetchCompanies = async () => {
      const q = query(collection(db, "users"), where("role", "==", "MOVING_COMPANY"));
      const snap = await getDocs(q);
      const list: UserProfile[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as UserProfile);
      });
      setAllCompanies(list);
    };
    fetchCompanies();

    // Listen to announcements
    const unsubscribeAnnouncements = onSnapshot(collection(db, "announcements"), (snapshot) => {
      const list: Announcement[] = [];
      const now = new Date();
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const expiresAt = d.expiresAt ? new Date(d.expiresAt) : null;
        if (!expiresAt || expiresAt > now) {
          if (d.target === "ALL" || d.target === "CUSTOMERS") {
            list.push({ id: docSnap.id, ...d } as Announcement);
          }
        }
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAnnouncements(list);
    }, (error) => {
      console.error("Error listening to announcements:", error);
    });

    return () => {
      unsubscribeReqs();
      unsubscribeOffers();
      unsubscribeMyReviews();
      unsubscribeAnnouncements();
    };
  }, [user.id]);

  // Actions
  const handleAcceptOffer = (offer: Offer, req: MovingRequest) => {
    setConfirmModal({
      isOpen: true,
      title: "Teklifi Kabul Et",
      message: `${offer.companyName} firmasının ₺${offer.price.toLocaleString("tr-TR")} teklifini kabul etmek istediğinize emin misiniz?`,
      confirmText: "Evet, Kabul Et",
      cancelText: "Vazgeç",
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          // 1. Update request status to OFFER_ACCEPTED
          await updateDoc(doc(db, "moving_requests", req.id), {
            status: "OFFER_ACCEPTED",
            acceptedOfferId: offer.id,
            acceptedCompanyId: offer.companyId,
            acceptedCompanyName: offer.companyName
          });

          // 2. Update winning offer to ACCEPTED
          await updateDoc(doc(db, "offers", offer.id), {
            status: "ACCEPTED"
          });

          // 3. Auto reject all other offers for this request
          const otherOffers = offers.filter((o) => o.requestId === req.id && o.id !== offer.id);
          for (const o of otherOffers) {
            await updateDoc(doc(db, "offers", o.id), {
              status: "REJECTED"
            });
          }

          // 4. Send notification to the winning company
          await addDoc(collection(db, "notifications"), {
            userId: offer.companyId,
            title: "Tebrikler, Teklifiniz Kabul Edildi!",
            body: `${user.name} isimli müşteri, ${req.pickupAddress.split(",")[0]} güzergahındaki nakliye talebi için teklifinizi onayladı. Müşteriyle sohbete başlayın.`,
            type: "OFFER_ACCEPTED",
            requestId: req.id,
            read: false,
            createdAt: new Date().toISOString()
          });

          setAlertModal({
            isOpen: true,
            title: "Başarılı!",
            message: "Teklif başarıyla kabul edildi! Nakliye firması ile sohbete başlayarak taşıma gününü planlayabilirsiniz."
          });
        } catch (err) {
          console.error(err);
          setAlertModal({
            isOpen: true,
            title: "Hata",
            message: "Teklif kabul edilirken bir hata oluştu."
          });
        }
      }
    });
  };

  const handleMarkAsCompleted = (req: MovingRequest) => {
    setConfirmModal({
      isOpen: true,
      title: "Taşımayı Tamamla",
      message: "Taşınma işleminin tamamlandığını onaylıyor musunuz?",
      confirmText: "Evet, Tamamlandı",
      cancelText: "İptal",
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await updateDoc(doc(db, "moving_requests", req.id), {
            status: "COMPLETED"
          });
          // Trigger review popup
          setReviewingJob(req);
        } catch (err) {
          console.error(err);
          setAlertModal({
            isOpen: true,
            title: "Hata",
            message: "Taşıma durumu güncellenirken bir hata oluştu."
          });
        }
      }
    });
  };

  const handleSendReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingJob) return;

    try {
      const reviewData: Omit<Review, "id"> = {
        requestId: reviewingJob.id,
        reviewerId: user.id,
        reviewerName: user.name,
        targetId: reviewingJob.acceptedCompanyId || "",
        rating,
        comment,
        reviewerRole: "CUSTOMER",
        createdAt: new Date().toISOString()
      };

      // Add review doc
      await addDoc(collection(db, "reviews"), reviewData);

      // Fetch current completedJobs and update with new recalculated rating
      const compId = reviewingJob.acceptedCompanyId || "";
      const companyRef = doc(db, "users", compId);
      const companySnap = await getDoc(companyRef);

      if (companySnap.exists()) {
        const compData = companySnap.data();
        await updateDoc(companyRef, {
          completedJobs: (compData.completedJobs || 0) + 1
        });
      }

      await recalculateUserRating(compId);

      // Add a system update notification
      await addDoc(collection(db, "notifications"), {
        userId: reviewingJob.acceptedCompanyId || "",
        title: "Yeni Değerlendirme Alındı!",
        body: `${user.name} size ${rating} yıldız verdi: "${comment.slice(0, 40)}..."`,
        type: "REVIEW_REMINDER",
        requestId: reviewingJob.id,
        read: false,
        createdAt: new Date().toISOString()
      });

      setAlertModal({
        isOpen: true,
        title: "Teşekkürler!",
        message: "Yorumunuz başarıyla iletildi. Katkınız için teşekkür ederiz!"
      });
      setReviewingJob(null);
      setComment("");
    } catch (err) {
      console.error(err);
      setAlertModal({
        isOpen: true,
        title: "Hata",
        message: "Yorum gönderilirken hata oluştu."
      });
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

      setAlertModal({
        isOpen: true,
        title: "İtiraz İletildi",
        message: "İtiraz talebi başarıyla iletildi. Değerlendirme inceleme süresince dış gözlemcilere kapatılmıştır."
      });
      setAppealingReview(null);
      setAppealExplanation("");
    } catch (err) {
      console.error("İtiraz gönderilirken hata oluştu:", err);
      setAlertModal({
        isOpen: true,
        title: "Hata",
        message: "İtiraz iletilirken bir hata oluştu."
      });
    }
  };

  const handleCancelRequest = (req: MovingRequest) => {
    setConfirmModal({
      isOpen: true,
      title: "Talebi İptal Et",
      message: "Bu taşıma talebini iptal etmek istediğinize emin misiniz? Alınan tüm teklifler geçersiz sayılacaktır.",
      confirmText: "Evet, İptal Et",
      cancelText: "Vazgeç",
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          // Update status to CANCELLED
          await updateDoc(doc(db, "moving_requests", req.id), {
            status: "CANCELLED"
          });

          // Cancel associated offers
          const associatedOffers = offers.filter((o) => o.requestId === req.id);
          for (const o of associatedOffers) {
            await updateDoc(doc(db, "offers", o.id), {
              status: "CANCELLED"
            });
          }

          setAlertModal({
            isOpen: true,
            title: "Talebiniz İptal Edildi",
            message: "Taşıma talebiniz başarıyla iptal edilmiştir."
          });
        } catch (err) {
          console.error(err);
          setAlertModal({
            isOpen: true,
            title: "Hata",
            message: "Talebiniz iptal edilirken bir hata oluştu."
          });
        }
      }
    });
  };

  const handleDeleteRequest = (req: MovingRequest) => {
    setConfirmModal({
      isOpen: true,
      title: "Talebi Tamamen Sil",
      message: "Bu taşıma talebini sistemden tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz.",
      confirmText: "Evet, Tamamen Sil",
      cancelText: "Vazgeç",
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          // Delete request doc
          await deleteDoc(doc(db, "moving_requests", req.id));

          // Delete associated offers
          const associatedOffers = offers.filter((o) => o.requestId === req.id);
          for (const o of associatedOffers) {
            await deleteDoc(doc(db, "offers", o.id));
          }

          setSelectedRequestId(null);
          setAlertModal({
            isOpen: true,
            title: "Başarılı",
            message: "Taşıma talebiniz ve ilişkili tüm teklifler sistemden tamamen silindi."
          });
        } catch (err) {
          console.error(err);
          setAlertModal({
            isOpen: true,
            title: "Hata",
            message: "Talep silinirken bir hata oluştu."
          });
        }
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {(user.role === "ADMIN" || user.isAdmin || user.email === "alibuyukuyar268@gmail.com") && (
        <div className="p-6 bg-rose-50 border border-rose-100 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-rose-950 flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 bg-rose-600 rounded-full animate-pulse"></span>
              Sistem Yöneticisi Girişi Aktif
            </h3>
            <p className="text-xs text-rose-700 leading-relaxed max-w-2xl">
              Geliştirici ve yönetici e-posta adresiniz (<strong>{user.email}</strong>) ile başarıyla giriş yaptınız. Platformdaki tüm kullanıcıları, şikayetleri, onay bekleyen firmaları, teklifleri ve duyuruları yönetebileceğiniz <strong>Yönetim Paneli</strong>'ne aşağıdaki butona tıklayarak veya sayfanın en üstünde yer alan kırmızı renkli <strong>Admin Paneli</strong> butonuna tıklayarak ulaşabilirsiniz.
            </p>
          </div>
          {onNavigateToAdmin && (
            <button
              onClick={onNavigateToAdmin}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm shadow-rose-600/10 shrink-0"
            >
              Yönetim Paneline Git
            </button>
          )}
        </div>
      )}

      {/* Dynamic Announcements System */}
      {announcements.filter(ann => localStorage.getItem(`dismiss_ann_${ann.id}`) !== "true").length > 0 && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-orange-500 animate-pulse" />
              Önemli Duyurular & Kampanyalar
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
                                setAlertModal({
                                  isOpen: true,
                                  title: ann.title,
                                  message: ann.content
                                });
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900">
            {activeDashboardTab === "requests"
              ? (siteSettings?.customerDashboardWelcomeText || "Taşınma Taleplerim")
              : "Akıllı Taşınma Yol Haritası & Planlayıcı"
            }
          </h2>
          <p className="text-xs text-slate-500">
            {activeDashboardTab === "requests"
              ? (siteSettings?.customerDashboardSub || "Oluşturduğunuz taşıma isteklerini takip edin, gelen teklifleri karşılaştırın.")
              : "Taşınma öncesi ve sonrası yapılması gereken tüm hazırlıklar ve kişiselleştirilmiş AI tavsiyeleri."
            }
          </p>
        </div>

        {/* Tab switch buttons */}
        <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 shrink-0 self-start sm:self-center">
          <button
            onClick={() => setActiveDashboardTab("requests")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeDashboardTab === "requests" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            🚚 Taleplerim & Teklifler
          </button>
          <button
            onClick={() => setActiveDashboardTab("planner")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeDashboardTab === "planner" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            📋 Taşınma Planlayıcı
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="inline-block w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-medium">Talepleriniz yükleniyor...</p>
        </div>
      ) : activeDashboardTab === "planner" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-slate-850">
          
          {/* Left Column: Interactive Checklist */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-950 font-display">Taşınma Kontrol Listesi</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Taşınma sürecinde yapılması gereken adımları işaretleyin ve takip edin.</p>
              </div>
              <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg">
                📋 Adım Adım Hazırlık
              </span>
            </div>

            {/* Visual Progress Bar */}
            {(() => {
              const completed = plannerTasks.filter(t => t.completed).length;
              const total = plannerTasks.length;
              const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
              return (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>Hazırlık İlerlemesi</span>
                    <span>%{pct} ({completed}/{total} Görev)</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })()}

            {/* Checklist Items */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {plannerTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleToggleTask(task.id)}
                  className={`p-3 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer text-left ${
                    task.completed
                      ? "bg-slate-50/50 border-slate-100 text-slate-400 line-through"
                      : "bg-white border-slate-100 text-slate-700 hover:border-slate-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => {}} // handled by parent div onClick
                    className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                  />
                  <div className="flex-1">
                    <p className="text-xs font-bold leading-normal">{task.text}</p>
                    <span className="inline-block mt-1 text-[8px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded uppercase tracking-wider">
                      {task.category}
                    </span>
                  </div>
                  {task.id.startsWith("custom_") && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlannerTasks(prev => prev.filter(t => t.id !== task.id));
                      }}
                      className="p-1 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded transition-all shrink-0 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Custom Task Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newCustomTaskText.trim()) return;
                setPlannerTasks(prev => [
                  ...prev,
                  {
                    id: `custom_${Date.now()}`,
                    text: newCustomTaskText.trim(),
                    category: "Özel Not",
                    completed: false
                  }
                ]);
                setNewCustomTaskText("");
              }}
              className="flex gap-2 pt-2 border-t border-slate-50"
            >
              <input
                type="text"
                placeholder="Kendi özel hazırlık görevinizi yazın... (Örn: Çiçekleri arabaya yerleştir)"
                value={newCustomTaskText}
                onChange={(e) => setNewCustomTaskText(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Görevi Ekle
              </button>
            </form>
          </div>

          {/* Right Column: AI Smart Copilot Advice */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[450px]">
            <div className="space-y-4 text-left">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-950 font-display">Akıllı Yol Haritası Danışmanı</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Mesafe, eşya hacmi ve paketleme kriterlerinize göre size özel rota önerileri.</p>
                </div>
              </div>

              {/* Advice content container */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 min-h-[250px] flex flex-col items-center justify-center text-center">
                {loadingAiAnalysis ? (
                  <div className="space-y-3 py-12">
                    <div className="inline-block w-6 h-6 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs text-slate-500 font-bold">Talebiniz analiz ediliyor...</p>
                    <p className="text-[9px] text-slate-400 max-w-xs">Eşya hacmi, asansör durumları ve rota mesafesine göre en kritik ipuçları derleniyor.</p>
                  </div>
                ) : aiAnalysisResult ? (
                  <div className="text-left text-xs text-slate-750 leading-relaxed space-y-4 w-full">
                    {aiAnalysisResult.split("\n\n").map((block, bIdx) => {
                      if (block.startsWith("###")) {
                        return <h4 key={bIdx} className="text-xs font-extrabold text-slate-900 border-b border-slate-100 pb-1 mt-2">{block.replace("###", "").trim()}</h4>;
                      }
                      return (
                        <div key={bIdx} className="space-y-1.5">
                          {block.split("\n").map((line, lIdx) => {
                            if (line.startsWith("-")) {
                              return <p key={lIdx} className="pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-indigo-500 font-medium">{line.replace("-", "").trim()}</p>;
                            }
                            return <p key={lIdx} className="font-medium">{line}</p>;
                          })}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-3 py-12 text-slate-400">
                    <Truck className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold">Kişiselleştirilmiş AI Raporu Alın</p>
                    <p className="text-[10px] max-w-xs">Aktif taşıma talebinizin kriterlerine dayalı özel risk ve paketleme ipuçlarını hesaplatmak için aşağıdaki butona basın.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-50 mt-4">
              <button
                type="button"
                onClick={generateAiMovingPlan}
                disabled={loadingAiAnalysis}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-4 h-4" /> Özel Taşınma Yol Haritası Üret
              </button>
            </div>
          </div>

        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-100 flex flex-col items-center justify-center gap-4">
          <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl">
            <Truck className="w-10 h-10" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">
              {siteSettings?.customerDashboardNoRequestsText || "Henüz Bir Taşıma Talebiniz Yok"}
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">Hemen yeni bir talep oluşturarak firmalardan dakikalar içinde fiyat teklifleri almaya başlayabilirsiniz.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Requests list */}
          <div className={`lg:col-span-6 space-y-4 ${selectedRequest ? "hidden lg:block" : "block"}`}>
            {requests.map((req) => {
              const reqOffers = offers.filter((o) => o.requestId === req.id);
              const isSelected = selectedRequest?.id === req.id;

              return (
                <div
                  key={req.id}
                  onClick={() => setSelectedRequestId(req.id)}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer ${
                    isSelected ? "bg-white border-slate-900 shadow-md ring-1 ring-slate-900" : "bg-white border-slate-100 hover:border-slate-300 shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-bold text-slate-400 font-mono">ID: #{req.id.slice(0, 6).toUpperCase()}</span>
                    <div>
                      {req.status === "PENDING" && (
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-lg border border-amber-100">
                          {reqOffers.length} Teklif Alındı
                        </span>
                      )}
                      {req.status === "OFFER_ACCEPTED" && (
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-lg border border-indigo-100">
                          Firma Seçildi
                        </span>
                      )}
                      {req.status === "COMPLETED" && (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-100">
                          Taşınma Tamamlandı
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-[10px] font-bold text-blue-700 shrink-0 mt-0.5">A</span>
                      <p className="text-xs font-semibold text-slate-700 truncate">{req.pickupAddress.split(",").slice(0, 2).join(",")}</p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-[10px] font-bold text-emerald-700 shrink-0 mt-0.5">B</span>
                      <p className="text-xs font-semibold text-slate-700 truncate">{req.destinationAddress.split(",").slice(0, 2).join(",")}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-50 text-[10px] text-slate-500 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(req.estimatedDate).toLocaleDateString("tr-TR")}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span>{getFriendlyHouseType(req.houseType)}</span>
                    </div>
                    {req.distanceKm !== undefined && (
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-slate-400" />
                        <span>Mesafe: {req.distanceKm} km</span>
                      </div>
                    )}
                  </div>

                  {req.status === "OFFER_ACCEPTED" && (
                    <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span className="text-[11px] font-bold text-slate-700">{req.acceptedCompanyName}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenChat(`${req.id}_${req.acceptedCompanyId}`, req.acceptedCompanyName || "Firma", req.pickupAddress.split(",")[0]);
                          }}
                          className="px-3 py-1.5 bg-slate-900 text-white font-bold text-[10px] rounded-lg hover:bg-slate-800 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <MessageSquare className="w-3 h-3" /> Mesaj Gönder
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsCompleted(req);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-[10px] rounded-lg hover:bg-emerald-500 transition-all cursor-pointer shadow-sm"
                        >
                          Taşıma Bitti
                        </button>
                      </div>
                    </div>
                  )}

                  {req.status === "PENDING" && (
                    <div className="mt-4 pt-3 border-t border-slate-50 flex gap-2 justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelRequest(req);
                        }}
                        className="px-3 py-1.5 border border-slate-200 text-slate-600 font-bold text-[10px] rounded-lg hover:bg-slate-50 transition-all cursor-pointer"
                      >
                        İptal Et
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRequest(req);
                        }}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] rounded-lg transition-all cursor-pointer"
                      >
                        Talebi Sil
                      </button>
                    </div>
                  )}

                  {req.status === "CANCELLED" && (
                    <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg border border-slate-200">
                        İptal Edildi
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRequest(req);
                        }}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] rounded-lg transition-all cursor-pointer"
                      >
                        Talebi Sil
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Offers list for chosen request */}
          <div className={`lg:col-span-6 space-y-4 ${selectedRequest ? "block" : "hidden lg:block"}`}>
            {selectedRequest && (
              <button
                onClick={() => setSelectedRequestId(null)}
                className="lg:hidden flex items-center gap-1.5 text-slate-600 font-bold text-xs py-2.5 px-4 bg-white rounded-xl border border-slate-200/60 mb-2 cursor-pointer shadow-xs active:scale-95 transition-all"
              >
                <ArrowLeft className="w-4 h-4 text-slate-500" /> Taleplerime Geri Dön
              </button>
            )}
            {selectedRequest ? (
              <div className="space-y-4">
                {/* CANLI TAKİP PANELİ (Eğer Firma Seçilmişse) */}
                {(selectedRequest.status === "OFFER_ACCEPTED" || selectedRequest.status === "COMPLETED") && (
                  <div className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-md space-y-4 text-left relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
                    
                    <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                      <div>
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                          Canlı Taşıma Takibi ⚡
                        </span>
                        <h4 className="text-xs text-slate-400 mt-1">
                          Taşımacı Firma: <span className="font-bold text-slate-700">{selectedRequest.acceptedCompanyName}</span>
                        </h4>
                      </div>
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    </div>

                    {/* Stepper progress representation */}
                    <div className="space-y-4 pt-2">
                      <p className="text-xs font-semibold text-slate-600">Mevcut Durum:</p>
                      
                      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                        {[
                          { value: "PREPARING", title: "Hazırlık ve Paketleme", desc: "Taşımacı firma eşyalarınızı paketliyor, koruyucu malzemelerle hazırlıyor." },
                          { value: "EN_ROUTE", title: "Araç Yolda", desc: "Nakliye aracı yükleme noktasına doğru seyir halindedir." },
                          { value: "LOADING", title: "Yükleme Yapılıyor", desc: "Eşyalarınız dikkatlice nakliye aracına yerleştiriliyor." },
                          { value: "TRANSIT", title: "Seyir Halinde", desc: "Aracımız yeni adresinize doğru yola çıkmıştır." },
                          { value: "UNLOADING", title: "Boşaltılıyor ve Kurulum", desc: "Eşyalarınız yeni evinize taşınıyor, kurulumları yapılıyor." },
                          { value: "COMPLETED", title: "Taşınma Tamamlandı", desc: "Tüm taşıma ve kurulum işlemleri başarıyla bitti." }
                        ].map((step, idx) => {
                          const currentStage = selectedRequest.currentStage || "PREPARING";
                          const isCurrent = currentStage === step.value;
                          const isPast = selectedRequest.status === "COMPLETED" || (
                            step.value === "PREPARING" ||
                            (step.value === "EN_ROUTE" && currentStage !== "PREPARING") ||
                            (step.value === "LOADING" && !["PREPARING", "EN_ROUTE"].includes(currentStage)) ||
                            (step.value === "TRANSIT" && !["PREPARING", "EN_ROUTE", "LOADING"].includes(currentStage)) ||
                            (step.value === "UNLOADING" && !["PREPARING", "EN_ROUTE", "LOADING", "TRANSIT"].includes(currentStage))
                          );

                          return (
                            <div key={step.value} className="relative flex items-start gap-3">
                              <div className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center border text-[9px] font-black z-10 transition-all ${
                                isCurrent 
                                  ? "bg-slate-900 border-slate-900 text-white shadow-sm ring-4 ring-slate-100 scale-110" 
                                  : isPast 
                                  ? "bg-indigo-600 border-indigo-600 text-white" 
                                  : "bg-white border-slate-200 text-slate-400"
                              }`}>
                                {isPast && !isCurrent ? "✓" : idx + 1}
                              </div>
                              <div className="space-y-0.5">
                                <h5 className={`text-xs font-bold leading-tight ${
                                  isCurrent ? "text-slate-900 font-black text-[13px]" : isPast ? "text-indigo-950 font-semibold" : "text-slate-400"
                                }`}>
                                  {step.title}
                                  {isCurrent && <span className="ml-2 text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-black animate-pulse">ŞU ANDA</span>}
                                </h5>
                                <p className={`text-[10px] ${isCurrent ? "text-slate-600 font-medium" : "text-slate-400"}`}>
                                  {step.desc}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-sm">
                  <h3 className="text-sm font-bold font-display">Talebe Ait Gelen Teklifler</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Seçilen Talep: #{selectedRequest.id.slice(0, 6).toUpperCase()} - {selectedRequest.pickupAddress.split(",")[0]}</p>
                </div>

                {offers.filter((o) => o.requestId === selectedRequest.id).length === 0 ? (
                  <div className="bg-white p-12 text-center rounded-3xl border border-slate-100 text-slate-400 text-xs">
                    Bu talep için henüz bir teklif ulaşmadı. Nakliye firmaları değerlendiriyor.
                  </div>
                ) : (
                  offers
                    .filter((o) => o.requestId === selectedRequest.id)
                    .map((offer) => {
                      const isWinning = selectedRequest.acceptedOfferId === offer.id;
                      const isFavorite = favorites.includes(offer.companyId);

                      return (
                        <div key={offer.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4 relative">
                          {isWinning && (
                            <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-extrabold rounded-full border border-emerald-200 uppercase tracking-wider">
                              Anlaşılan Teklif
                            </span>
                          )}

                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <span className="w-10 h-10 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
                                {offer.companyName.slice(0, 2)}
                              </span>
                              <div>
                                <div className="flex items-center gap-1">
                                  <h4 className="text-xs font-bold text-slate-900">{offer.companyName}</h4>
                                  <button
                                    onClick={() => toggleFavorite(offer.companyId)}
                                    className="p-1 rounded-full text-slate-300 hover:text-rose-500 transition-all cursor-pointer"
                                  >
                                    <Heart className={`w-3.5 h-3.5 ${isFavorite ? "fill-rose-500 text-rose-500" : ""}`} />
                                  </button>
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                  <span className="text-[10px] font-bold text-slate-700">{offer.companyRating || 5.0}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 shrink-0">
                              <label className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-150 px-2.5 py-1.5 rounded-xl cursor-pointer select-none transition-all">
                                <input
                                  type="checkbox"
                                  checked={selectedOffersForComparison.includes(offer.id)}
                                  onChange={() => handleToggleComparison(offer.id)}
                                  className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-[10px] font-bold text-slate-600">Karşılaştır</span>
                              </label>
                              <div className="text-right">
                                <span className="text-lg font-black text-slate-950">₺{offer.price.toLocaleString("tr-TR")}</span>
                                <p className="text-[9px] text-slate-400">KDV Dahil</p>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3.5 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-semibold text-slate-600">
                            <div>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Planlanan Tarih</p>
                              <p className="text-slate-800 mt-0.5">{new Date(offer.availableDate).toLocaleDateString("tr-TR")}</p>
                            </div>
                            <div>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Tahmini Süre</p>
                              <p className="text-slate-800 mt-0.5">{offer.estimatedDurationDays} Gün</p>
                            </div>
                            <div>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Atanan Personel</p>
                              <p className="text-slate-800 mt-0.5">{offer.assignedStaffCount} Kişi</p>
                            </div>
                            <div>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Sürücü & Araç Tipi</p>
                              <p className="text-slate-800 mt-0.5 truncate">{offer.vehicleType}</p>
                            </div>
                          </div>

                          {offer.notes && (
                            <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              <span className="font-bold text-slate-700">Firma Notu:</span> {offer.notes}
                            </p>
                          )}

                          <div className="flex gap-2.5">
                            <button
                              onClick={() => onOpenChat(`${selectedRequest.id}_${offer.companyId}`, offer.companyName, selectedRequest.pickupAddress.split(",")[0])}
                              className="flex-1 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-slate-500" /> Soru Sor
                            </button>

                            {selectedRequest.status === "PENDING" && !selectedRequest.acceptedOfferId && offer.status === "PENDING" && (
                              <button
                                onClick={() => handleAcceptOffer(offer, selectedRequest)}
                                className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                              >
                                <Check className="w-3.5 h-3.5" /> Teklifi Kabul Et
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            ) : (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-12 text-center rounded-3xl text-slate-400 text-xs">
                Gelen teklif detaylarını, firma puanlarını ve süreleri görmek için soldaki taleplerinizden birini seçin.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION: GELEN DEĞERLENDİRMELER */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mt-8 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Size Gelen Nakliyeci Değerlendirmeleri</h3>
            <p className="text-xs text-slate-400 mt-0.5">Nakliye firmalarının tamamlanan taşımalar sonrasında sizin için bıraktığı puanlar ve yorumlar.</p>
          </div>

          {receivedReviews.length === 0 ? (
            <p className="text-xs text-slate-400">Henüz bir değerlendirme almadınız.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {receivedReviews.map((rev) => {
                const isAppealPending = rev.appealStatus === "PENDING";
                const isAppealApproved = rev.appealStatus === "APPROVED" || rev.isDeleted;
                const isAppealRejected = rev.appealStatus === "REJECTED";

                return (
                  <div
                    key={rev.id}
                    className={`p-4 rounded-2xl border transition-all space-y-2 ${
                      isAppealApproved
                        ? "border-rose-200 bg-rose-50/25"
                        : isAppealPending
                        ? "border-amber-200 opacity-60 bg-amber-50/5"
                        : "border-slate-100"
                    }`}
                  >
                    <div className="flex items-start justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 bg-slate-100 text-slate-800 font-bold rounded-full flex items-center justify-center">
                          {rev.reviewerName?.slice(0, 2).toUpperCase() || "NK"}
                        </span>
                        <div>
                          <h4 className="font-bold text-slate-900">{rev.reviewerName}</h4>
                          <p className="text-[9px] text-slate-400">{new Date(rev.createdAt || "").toLocaleDateString("tr-TR")}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-3.5 h-3.5 ${rev.rating >= s ? "fill-amber-400" : "text-slate-200"}`} />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed italic">"{rev.comment}"</p>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-50 text-[10px]">
                      <div className="flex gap-2">
                        {isAppealApproved && (
                          <span className="text-rose-800 font-extrabold bg-rose-100 px-1.5 py-0.5 rounded">Değerlendirme Silindi</span>
                        )}
                        {isAppealPending && (
                          <span className="text-amber-800 font-extrabold bg-amber-100 px-1.5 py-0.5 rounded animate-pulse">İnceleme Altında</span>
                        )}
                        {isAppealRejected && (
                          <span className="text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">İtiraz Reddedildi: "{rev.appealAdminNote}"</span>
                        )}
                      </div>

                      {!rev.isAppealed && !isAppealApproved && !isAppealPending && (
                        <button
                          onClick={() => setAppealingReview(rev)}
                          className="text-slate-500 hover:text-rose-600 border border-slate-200 px-2 py-0.5 rounded-lg transition-all font-bold cursor-pointer hover:bg-rose-50"
                        >
                          İtiraz Et
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      {/* Review Dialog modal */}
      {reviewingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold font-display text-slate-900">Taşınma Deneyiminizi Değerlendirin</h3>
            <p className="text-xs text-slate-400">
              {reviewingJob.acceptedCompanyName} firması ile olan taşınma işleminiz tamamlandı. Diğer kullanıcılara referans olması için bir değerlendirme yapın.
            </p>

            <form onSubmit={handleSendReview} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Hizmet Puanı</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 rounded hover:bg-slate-50 transition-all text-amber-400 cursor-pointer"
                    >
                      <Star className={`w-7 h-7 ${rating >= star ? "fill-amber-400" : "text-slate-200"}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Yorumunuz</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Gelen personelin ilgisi, eşya taşıma hassasiyeti ve demontaj kalitesi hakkında detaylar yazın..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewingJob(null)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Sonra Yap
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-all"
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
              Bu değerlendirme ve yorumun gerçek dışı veya haksız yapıldığını düşünüyorsanız, gerekçenizi yazarak yönetici onayına gönderebilirsiniz.
            </p>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs text-slate-600">
              <p className="font-bold">Nakliyeci Yorumu:</p>
              <p className="italic mt-1">"{appealingReview.comment}"</p>
            </div>

            <form onSubmit={handleSendAppeal} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">İtiraz Gerekçeniz</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Yorumun neden haksız olduğunu açıklayın. (Taşınma kurallarına tamamen uydum vb.)"
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

      {/* STICKY BOTTOM COMPARISON BAR */}
      {selectedOffersForComparison.length > 1 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur-md px-6 py-4 rounded-3xl border border-slate-800 shadow-2xl flex items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300 text-white">
          <div className="text-left shrink-0">
            <p className="text-xs font-black">{selectedOffersForComparison.length} Teklif Seçildi</p>
            <p className="text-[10px] text-slate-400">Fiyat ve detayları yan yana karşılaştırın.</p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSelectedOffersForComparison([])}
              className="px-3.5 py-1.5 border border-slate-700 text-slate-300 font-bold text-[10px] rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
            >
              Temizle
            </button>
            <button
              onClick={() => setShowComparisonModal(true)}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[10px] rounded-xl transition-all flex items-center gap-1 cursor-pointer shadow-md"
            >
              <Layers className="w-3.5 h-3.5" /> Teklifleri Karşılaştır
            </button>
          </div>
        </div>
      )}

      {/* OFFER COMPARISON SIDE-BY-SIDE MODAL */}
      {showComparisonModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-150 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-950 font-display flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-600" /> Teklif Karşılaştırma Analizi
                </h3>
                <p className="text-xs text-slate-400">Seçtiğiniz tekliflerin fiyat, puan ve operasyonel detaylarını karşılaştırın.</p>
              </div>
              <button
                onClick={() => setShowComparisonModal(false)}
                className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Table / Columns */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {offers
                  .filter((o) => selectedOffersForComparison.includes(o.id))
                  .map((offer) => {
                    const req = requests.find((r) => r.id === offer.requestId);
                    return (
                      <div key={offer.id} className="border border-slate-100 rounded-2xl p-4 space-y-4 flex flex-col justify-between hover:border-slate-300 transition-all text-left bg-slate-50/50">
                        <div className="space-y-3">
                          {/* Company info */}
                          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                            <span className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                              {offer.companyName.slice(0, 2).toUpperCase()}
                            </span>
                            <div>
                              <h4 className="text-xs font-black text-slate-950">{offer.companyName}</h4>
                              <div className="flex items-center gap-1 mt-0.5">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span className="text-[10px] font-bold text-slate-700">{offer.companyRating || 5.0}</span>
                              </div>
                            </div>
                          </div>

                          {/* Price */}
                          <div className="p-3 bg-white border border-slate-100 rounded-xl text-center">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Teklif Fiyatı</p>
                            <p className="text-xl font-black text-slate-950 mt-0.5">₺{offer.price.toLocaleString("tr-TR")}</p>
                            <p className="text-[9px] text-slate-400">KDV Dahil</p>
                          </div>

                          {/* Technical details list */}
                          <div className="space-y-2 text-[10px] font-semibold text-slate-700">
                            <div className="flex justify-between py-1 border-b border-slate-100">
                              <span className="text-slate-400">Taşınma Tarihi:</span>
                              <span className="text-slate-950">{new Date(offer.availableDate).toLocaleDateString("tr-TR")}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100">
                              <span className="text-slate-400">Süre:</span>
                              <span className="text-slate-950">{offer.estimatedDurationDays} Gün</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100">
                              <span className="text-slate-400">Personel:</span>
                              <span className="text-slate-950">{offer.assignedStaffCount} Personel</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100">
                              <span className="text-slate-400">Araç Sınıfı:</span>
                              <span className="text-slate-950 truncate max-w-[150px]">{offer.vehicleType}</span>
                            </div>
                          </div>

                          {offer.notes && (
                            <div className="text-[10px] leading-relaxed text-slate-500 bg-white p-2.5 rounded-xl border border-slate-100 italic">
                              "{offer.notes}"
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="space-y-1.5 pt-4">
                          <button
                            onClick={() => {
                              setShowComparisonModal(false);
                              if (req) {
                                onOpenChat(`${req.id}_${offer.companyId}`, offer.companyName, req.pickupAddress.split(",")[0]);
                              }
                            }}
                            className="w-full py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-slate-500" /> Soru Sor
                          </button>

                          {req && req.status === "PENDING" && !req.acceptedOfferId && offer.status === "PENDING" && (
                            <button
                              onClick={() => {
                                setShowComparisonModal(false);
                                handleAcceptOffer(offer, req);
                              }}
                              className="w-full py-2 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                            >
                              <Check className="w-3.5 h-3.5" /> Kabul Et
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-50 bg-slate-50/50 flex justify-end shrink-0">
              <button
                onClick={() => setShowComparisonModal(false)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Kapat
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION MODAL */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200 text-slate-800">
            <h3 className="text-base font-bold font-display text-slate-900">{confirmModal.title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{confirmModal.message}</p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
              >
                {confirmModal.cancelText || "Vazgeç"}
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                {confirmModal.confirmText || "Onayla"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM ALERT MODAL */}
      {alertModal && alertModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200 text-slate-800">
            <h3 className="text-base font-bold font-display text-slate-900">{alertModal.title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{alertModal.message}</p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setAlertModal(null)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
