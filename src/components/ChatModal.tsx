import React, { useState, useEffect, useRef } from "react";
import { db, handleFirestoreError, OperationType } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  setDoc,
  updateDoc,
  getDoc
} from "firebase/firestore";
import { Message, UserProfile, ChatSession } from "../types";
import { X, Send, Image, MapPin, Check, CheckCheck, Loader } from "lucide-react";

interface ChatModalProps {
  chatId: string; // "requestId_companyId"
  user: UserProfile;
  onClose: () => void;
  requestTitle: string;
  opponentName: string;
}

export default function ChatModal({ chatId, user, onClose, requestTitle, opponentName }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [opponentTyping, setOpponentTyping] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse IDs from chatId: "requestId_companyId"
  const [requestId, companyId] = chatId.split("_");

  // Load Messages from Firestore
  useEffect(() => {
    setLoading(true);

    const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs: Message[] = [];
        snapshot.forEach((doc) => {
          msgs.push({ id: doc.id, ...doc.data() } as Message);
        });
        setMessages(msgs);
        setLoading(false);

        // Scroll to bottom
        setTimeout(() => {
          messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);

        // Update read receipts
        markMessagesAsRead();
      },
      (error) => {
        setLoading(false);
        handleFirestoreError(error, OperationType.GET, `chat_messages_${chatId}`);
      }
    );

    // Listen to typing status from chat metadata
    const metaUnsub = onSnapshot(doc(db, "chats", chatId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (user.role === "CUSTOMER") {
          setOpponentTyping(data.companyTyping || false);
        } else {
          setOpponentTyping(data.customerTyping || false);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `chat_meta_${chatId}`);
    });

    return () => {
      unsubscribe();
      metaUnsub();
    };
  }, [chatId]);

  const markMessagesAsRead = async () => {
    try {
      const chatRef = doc(db, "chats", chatId);
      const snap = await getDoc(chatRef);
      if (snap.exists()) {
        if (user.role === "CUSTOMER") {
          await updateDoc(chatRef, { unreadCountCustomer: 0 });
        } else {
          await updateDoc(chatRef, { unreadCountCompany: 0 });
        }
      }
    } catch (err) {
      console.warn("Could not clear unread messages badge:", err);
    }
  };

  const handleSend = async (e?: React.FormEvent, customFields?: Partial<Message>) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !customFields) return;

    setSending(true);
    const textToSend = inputText;
    setInputText("");

    try {
      const messageData: Omit<Message, "id"> = {
        chatId,
        senderId: user.id,
        senderName: user.name,
        text: textToSend || customFields?.text || "Konum paylaştı",
        read: false,
        createdAt: new Date().toISOString(),
        ...customFields
      };

      // Create message in Firestore
      await addDoc(collection(db, "chats", chatId, "messages"), messageData);

      // Create/Update Chat Session Metadata
      const chatRef = doc(db, "chats", chatId);
      const chatSnap = await getDoc(chatRef);

      const updateData: Partial<ChatSession> & {
        customerTyping?: boolean;
        companyTyping?: boolean;
        unreadCountCustomer?: any;
        unreadCountCompany?: any;
      } = {
        lastMessageText: messageData.text,
        lastMessageTime: messageData.createdAt
      };

      let finalCustomerId = "";
      let finalCustomerName = "Müşteri";

      if (user.role === "CUSTOMER") {
        finalCustomerId = user.id;
        finalCustomerName = user.name;
      } else {
        if (chatSnap.exists()) {
          finalCustomerId = chatSnap.data().customerId || "";
          finalCustomerName = chatSnap.data().customerName || "Müşteri";
        } else {
          try {
            const reqSnap = await getDoc(doc(db, "moving_requests", requestId));
            if (reqSnap.exists()) {
              finalCustomerId = reqSnap.data().customerId || "";
              finalCustomerName = reqSnap.data().customerName || "Müşteri";
            }
          } catch (err) {
            console.error("Error fetching request details for company-initiated chat:", err);
          }
        }
      }

      if (!chatSnap.exists()) {
        // Build metadata
        await setDoc(chatRef, {
          id: chatId,
          requestId,
          requestTitle,
          customerId: finalCustomerId,
          customerName: finalCustomerName,
          companyId: user.role === "MOVING_COMPANY" ? user.id : companyId,
          companyName: user.role === "MOVING_COMPANY" ? user.name : opponentName,
          unreadCountCustomer: user.role === "CUSTOMER" ? 0 : 1,
          unreadCountCompany: user.role === "MOVING_COMPANY" ? 0 : 1,
          customerTyping: false,
          companyTyping: false,
          ...updateData
        });
      } else {
        const currentData = chatSnap.data();
        if (user.role === "CUSTOMER") {
          updateData.unreadCountCompany = (currentData.unreadCountCompany || 0) + 1;
        } else {
          updateData.unreadCountCustomer = (currentData.unreadCountCustomer || 0) + 1;
        }
        await updateDoc(chatRef, updateData);
      }

      // Add notification document
      const targetUserId = user.role === "CUSTOMER" ? companyId : finalCustomerId;
      if (targetUserId) {
        await addDoc(collection(db, "notifications"), {
          userId: targetUserId,
          title: `Yeni Mesaj: ${user.name}`,
          body: messageData.text,
          type: "NEW_MESSAGE",
          requestId,
          chatId,
          read: false,
          createdAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error("Message send error:", err);
    } finally {
      setSending(false);
      handleTyping(false);
    }
  };

  // Typing indicator trigger
  const handleTyping = async (isTyping: boolean) => {
    setTyping(isTyping);
    try {
      const chatRef = doc(db, "chats", chatId);
      if (user.role === "CUSTOMER") {
        await updateDoc(chatRef, { customerTyping: isTyping });
      } else {
        await updateDoc(chatRef, { companyTyping: isTyping });
      }
    } catch (err) {
      // Ignored
    }
  };

  // Custom visual assets or mock shares
  const handleShareImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (limit to ~800KB to stay well under Firestore's 1MB limit for messages)
    if (file.size > 800 * 1024) {
      alert("Seçilen fotoğraf çok büyük. Lütfen 800KB'tan küçük bir fotoğraf seçin.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      handleSend(undefined, {
        text: `Fotoğraf Paylaştı`,
        imageUrl: base64String
      });
    };
    reader.readAsDataURL(file);
    
    // Reset file input value so same file can be selected again
    if (e.target) {
      e.target.value = "";
    }
  };

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      alert("Tarayıcınız konum paylaşımını desteklemiyor.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        try {
          // Reverse geocoding with OpenStreetMap Nominatim for exact address
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
            headers: {
              "Accept-Language": "tr"
            }
          });
          const data = await res.json();
          const address = data.display_name || `Koordinatlar: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          
          handleSend(undefined, {
            text: `Tam Konum Paylaştı: ${address}`,
            location: {
              lat,
              lng,
              address
            }
          });
        } catch (err) {
          console.error("Reverse geocoding error:", err);
          handleSend(undefined, {
            text: `Konum Paylaştı (Koordinat: ${lat.toFixed(4)}, ${lng.toFixed(4)})`,
            location: {
              lat,
              lng,
              address: `Koordinatlar: ${lat}, ${lng}`
            }
          });
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert("Konum izni reddedildi. Lütfen tarayıcı ayarlarınızdan tam konum izni verin.");
            break;
          case error.POSITION_UNAVAILABLE:
            alert("Konum bilgisi alınamadı.");
            break;
          case error.TIMEOUT:
            alert("Konum talebi zaman aşımına uğradı.");
            break;
          default:
            alert("Konum alınırken bir hata oluştu.");
        }
      },
      {
        enableHighAccuracy: true, // "tam konum izni istenecek"
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-md">
      <div className="w-full max-w-xl h-full sm:h-[600px] bg-white rounded-none sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-slate-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold uppercase text-slate-200 border border-slate-700">
              {opponentName.slice(0, 2)}
            </div>
            <div>
              <h3 className="text-sm font-bold font-display text-white">{opponentName}</h3>
              <p className="text-[10px] text-slate-400 font-medium truncate max-w-[280px]">Talep: {requestTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-3.5">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader className="w-6 h-6 animate-spin text-slate-500" />
              <p className="text-xs">Sohbet yükleniyor...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-8 space-y-1">
              <p className="text-xs font-bold text-slate-600">Sohbeti Başlatın</p>
              <p className="text-[10px] text-slate-400">Fiyatlandırma, asansör, ek personel detaylarını görüşün.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === user.id;
              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl p-3.5 text-xs shadow-xs ${
                      isMe ? "bg-slate-900 text-white rounded-tr-none" : "bg-white border border-slate-100 text-slate-800 rounded-tl-none"
                    }`}
                  >
                    {!isMe && <p className="text-[10px] font-bold text-slate-400 mb-1">{msg.senderName}</p>}

                    {/* Shared Image */}
                    {msg.imageUrl && (
                      <img
                        src={msg.imageUrl}
                        alt="Shared"
                        className="rounded-lg max-h-[160px] object-cover mb-2 w-full border border-slate-100"
                        referrerPolicy="no-referrer"
                      />
                    )}

                    {/* Shared Location Map Link */}
                    {msg.location && (
                      <div className="p-3 bg-slate-100 rounded-xl mb-2 text-slate-800 border border-slate-200 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                          <div>
                            <p className="text-[10px] font-bold">Harita Konumu</p>
                            <p className="text-[9px] text-slate-500 line-clamp-1">{msg.location.address}</p>
                          </div>
                        </div>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${msg.location.lat},${msg.location.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[9px] font-bold text-blue-600 hover:underline block text-center"
                        >
                          Google Haritalarda Aç
                        </a>
                      </div>
                    )}

                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                    <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-slate-400">
                      <span>{new Date(msg.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span>
                      {isMe && (
                        msg.read ? (
                          <CheckCheck className="w-3 h-3 text-blue-400" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {opponentTyping && (
            <div className="flex justify-start">
              <div className="bg-slate-200/60 rounded-full py-2 px-4 text-xs text-slate-500 flex items-center gap-1.5 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "0s" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "0.15s" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "0.3s" }} />
                <span className="text-[10px] font-medium ml-1">yazıyor...</span>
              </div>
            </div>
          )}

          <div ref={messageEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={handleShareImage}
            title="Fotoğraf Gönder"
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-all cursor-pointer"
          >
            <Image className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleShareLocation}
            title="Konum Gönder"
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-all cursor-pointer"
          >
            <MapPin className="w-5 h-5" />
          </button>

          <input
            type="text"
            placeholder="Mesajınızı yazın..."
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              if (!typing) handleTyping(true);
              if (e.target.value === "") handleTyping(false);
            }}
            onBlur={() => handleTyping(false)}
            className="flex-1 py-2 px-3.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500/10 focus:border-slate-400 text-slate-800"
          />

          <button
            type="submit"
            disabled={sending || (!inputText.trim())}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl disabled:opacity-30 transition-all cursor-pointer shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
