import { useEffect, useState } from "react";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { collection, onSnapshot, query, where, doc, updateDoc } from "firebase/firestore";
import { Notification } from "../types";
import { Bell, Sparkles, MessageSquare, Check, Mail, Info } from "lucide-react";

interface NotificationCenterProps {
  userId: string;
  onNotificationClick?: (notification: Notification) => void;
}

export default function NotificationCenter({ userId, onNotificationClick }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "notifications"), where("userId", "==", userId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Notification[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Notification);
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `notifications_${userId}`);
    });

    return () => unsubscribe();
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = async () => {
    try {
      const unreadList = notifications.filter((n) => !n.read);
      for (const n of unreadList) {
        await updateDoc(doc(db, "notifications", n.id), { read: true });
      }
    } catch (err) {
      console.warn("Could not mark all notifications as read:", err);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) markAllAsRead();
        }}
        className="relative p-2 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-50 transition-all cursor-pointer"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed sm:absolute top-[74px] sm:top-auto left-4 right-4 sm:left-auto sm:right-0 sm:w-80 mt-0 sm:mt-2.5 bg-white border border-slate-100 rounded-3xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-slate-500" /> Bildirimler
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-all"
            >
              Kapat
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-1.5">
                <Bell className="w-6 h-6 text-slate-300" />
                Henüz bildiriminiz bulunmuyor.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={async () => {
                    if (!n.read) {
                      try {
                        await updateDoc(doc(db, "notifications", n.id), { read: true });
                      } catch (err) {
                        console.warn("Could not mark notification as read:", err);
                      }
                    }
                    if (onNotificationClick) {
                      onNotificationClick(n);
                    }
                    setIsOpen(false);
                  }}
                  className={`p-4 hover:bg-slate-50/100 transition-all cursor-pointer border-l-2 ${
                    !n.read ? "bg-blue-50/30 border-blue-600 font-medium" : "border-transparent"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0 mt-0.5">
                      {n.type === "OFFER_RECEIVED" || n.type === "OFFER_ACCEPTED" ? (
                        <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                      ) : n.type === "NEW_MESSAGE" ? (
                        <MessageSquare className="w-3.5 h-3.5" />
                      ) : (
                        <Info className="w-3.5 h-3.5" />
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-xs text-slate-800 ${!n.read ? "font-extrabold" : "font-semibold"}`}>
                        {n.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed break-words">{n.body}</p>
                      <span className="text-[8px] text-slate-400 font-medium block mt-1">
                        {new Date(n.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
