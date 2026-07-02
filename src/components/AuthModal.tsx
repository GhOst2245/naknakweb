import React, { useState } from "react";
import { auth, db, googleProvider } from "../firebase";
import { signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { UserProfile, SiteSettings } from "../types";
import { X, ShieldCheck } from "lucide-react";
import DuckTruckLogo from "./DuckTruckLogo";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (profile: UserProfile) => void;
  defaultRole?: "CUSTOMER" | "MOVING_COMPANY";
  siteSettings?: SiteSettings;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess, defaultRole, siteSettings }: AuthModalProps) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const uid = result.user.uid;

      // Check if user profile already exists
      const userDocRef = doc(db, "users", uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const existingProfile = userDocSnap.data() as UserProfile;
        onAuthSuccess(existingProfile);
      } else {
        // Create new Profile using Google details (un-onboarded state)
        const profileData: UserProfile = {
          id: uid,
          email: result.user.email || "",
          name: result.user.displayName || "Yeni Kullanıcı",
          phone: result.user.phoneNumber || "",
          role: defaultRole || "CUSTOMER", // Use requested role, or default to CUSTOMER
          createdAt: new Date().toISOString(),
          avatarUrl: result.user.photoURL || "",
          isOnboarded: false // Must complete profile before accessing any pages
        };

        await setDoc(userDocRef, profileData);
        onAuthSuccess(profileData);
      }
      onClose();
    } catch (err: any) {
      console.error("Google authentication failed:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setError("Giriş penceresi kapatıldı. Devam etmek için lütfen Google penceresini kapatmayın.");
      } else if (err.code === "auth/cancelled-popup-request") {
        setError("Giriş isteği iptal edildi.");
      } else {
        setError(err.message || "Google ile giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100/50 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Visual Duck Truck Logo */}
        <div className="p-8 pb-4 text-center">
          <div className="inline-flex p-1 bg-amber-50 rounded-2xl mb-3">
            <DuckTruckLogo className="w-16 h-16" />
          </div>
          <h3 className="text-2xl font-bold font-display text-slate-900">
            {siteSettings?.loginTitle || "NakNak Pazaryeri"}
          </h3>
          <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
            {siteSettings?.loginSub || "Hızlı, güvenli ve esnek nakliye çözümlerine tek tıkla ulaşın."}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 px-4 py-3.5 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800 font-medium">
            {error}
          </div>
        )}

        {/* Google SSO Login */}
        <div className="p-8 pt-4 space-y-5">
          <div className="space-y-4 py-2 text-center">
            <p className="text-xs text-slate-500 leading-relaxed">
              Platformumuza güvenli ve hızlı erişim sağlamak için Google hesabınızla giriş yapabilirsiniz.
            </p>
            
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-4 bg-slate-950 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-slate-950/10"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.48 15.01 1 12 1 7.24 1 3.19 3.73 1.24 7.72l3.86 3c.9-2.69 3.42-4.68 6.9-4.68z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.82-.07-1.6-.2-2.36H12v4.47h6.45c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.74-4.88 3.74-8.5z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.1 14.28a7.12 7.12 0 0 1 0-4.56l-3.86-3a11.96 11.96 0 0 0 0 10.56l3.86-3z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.1.74-2.51 1.18-4.3 1.18-3.48 0-6-1.99-6.9-4.68l-3.86 3C3.19 20.27 7.24 23 12 23z"
                />
              </svg>
              {loading ? "Giriş yapılıyor..." : "Google ile Giriş Yap / Kayıt Ol"}
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Kişisel verileriniz Google güvencesiyle korunur.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
