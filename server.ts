import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser
  app.use(express.json());

  // Initialize Gemini client lazily to prevent crashing on boot if key is missing
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is required");
      }
      aiClient = new GoogleGenAI({ apiKey });
    }
    return aiClient;
  }

  // API Route: AI Price Estimation
  app.post("/api/ai-estimate-price", async (req, res) => {
    try {
      const {
        distanceKm,
        pickupCity,
        pickupDistrict,
        destinationCity,
        destinationDistrict,
        pickupFloor,
        destinationFloor,
        roomCount,
        hasPiano,
        hasSafe,
        packingRequired,
        assemblyRequired
      } = req.body;

      // Safe defaults
      const dist = Number(distanceKm) || 10;
      const pCity = String(pickupCity || "");
      const pDistr = String(pickupDistrict || "");
      const dCity = String(destinationCity || "");
      const dDistr = String(destinationDistrict || "");
      const pFloor = Number(pickupFloor) || 0;
      const dFloor = Number(destinationFloor) || 0;
      const rooms = String(roomCount) || "2+1";
      const piano = Boolean(hasPiano);
      const safe = Boolean(hasSafe);
      const pack = Boolean(packingRequired);
      const assembly = Boolean(assemblyRequired);

      let aiResponseText = "";
      let minPrice = 3000;
      let maxPrice = 5000;
      let reasoning = "";

      try {
        const client = getGeminiClient();
        const prompt = `
          Sen profesyonel bir nakliyat fiyatlandırma uzmanı yapay zekasın. 
          Aşağıdaki bilgilere göre Türkiye'deki evden eve nakliyat 2026 yılı güncel piyasa koşullarını gözeterek (TL bazında) gerçekçi bir fiyat tahmini yap.
          2026 yılı güncel Türkiye evden eve nakliye piyasa fiyatlandırma kuralları:
          - Kısa mesafe (şehir içi, <30 km) baz taşıma ücretleri:
            - 1+1 daire: 7.000 TL - 10.000 TL
            - 2+1 daire: 9.500 TL - 13.500 TL
            - 3+1 daire: 13.000 TL - 18.000 TL
            - 4+1 veya Villa: 19.000 TL - 29.000 TL
          - Şehirler arası veya uzun mesafe taşımalarda, baz fiyata ek olarak km başına 45-60 TL yakıt/yıpranma bedeli eklenir.
          - Yükleme ve teslimat kat durumları (asansörsüz ise her kat için +1.000 TL ek taşıma zorluğu eklenir).
          - Paketleme/ambalajlama hizmeti isteniyorsa +2.500 TL - 4.500 TL eklenir.
          - Demontaj ve montaj (mobilya söküm/kurulum) hizmeti isteniyorsa +2.000 TL - 3.500 TL eklenir.
          - Piyano gibi ağır/hassas eşya varsa +3.500 TL eklenir.
          - Çelik kasa varsa +1.800 TL eklenir.

          Talep Bilgileri:
          - Yükleme Noktası: ${pCity} ${pDistr ? `(${pDistr})` : ""}
          - Teslimat Noktası: ${dCity} ${dDistr ? `(${dDistr})` : ""}
          - Mesafe: ${dist} km
          - Yükleme Katı: ${pFloor}
          - Teslimat Katı: ${dFloor}
          - Ev Tipi / Oda Sayısı: ${rooms}
          - Piyano Var mı: ${piano ? "Evet" : "Hayır"}
          - Para Kasası Var mı: ${safe ? "Evet" : "Hayır"}
          - Paketleme Hizmeti İstiyor mu: ${pack ? "Evet" : "Hayır"}
          - Demontaj ve Montaj Hizmeti İstiyor mu: ${assembly ? "Evet" : "Hayır"}

          Lütfen fiyatlandırma gerekçesi (reasoning) alanında mutlaka nereden nereye (Örn: "${pCity} ${pDistr}" ile "${dCity} ${dDistr}" arası) taşıma yapıldığını, mesafeyi ve diğer zorlukları da göz önüne alarak Türkçe ve son derece profesyonel, güven veren bir dille açıklama yap.

          Lütfen tam olarak aşağıdaki JSON formatında yanıt ver. Başka hiçbir metin, markdown bloğu (\`\`\`json vb.) veya açıklama ekleme:
          {
            "minPrice": <Tahmini minimum fiyat sayısı>,
            "maxPrice": <Tahmini maksimum fiyat sayısı>,
            "reasoning": "<Fiyatlandırmanın nedenlerini, kat durumunu, mesafeyi ve ek istekleri Türkçe olarak açıklayan kısa profesyonel bir özet>"
          }
        `;

        const response = await client.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json"
          }
        });

        const text = response.text || "";
        const parsed = JSON.parse(text);
        minPrice = Number(parsed.minPrice) || minPrice;
        maxPrice = Number(parsed.maxPrice) || maxPrice;
        reasoning = String(parsed.reasoning) || "";
      } catch (geminiError) {
        console.error("Gemini API Error, falling back to 2026 rule-based algorithm:", geminiError);
        // Fallback rule-based pricing calculator representing 2026 market rates
        let base = 8500;
        if (rooms === "1+1") base = 7500;
        else if (rooms === "2+1") base = 10500;
        else if (rooms === "3+1") base = 14500;
        else if (rooms === "4+1" || rooms === "Villa") base = 22000;

        if (dist > 30) {
          base += dist * 50; // 50 TL per km intercity
        } else {
          base += dist * 25; // 25 TL per km intracity
        }
        
        base += pFloor * 400; // Kat başına 400 TL taşıma zorluğu
        base += dFloor * 400;
        if (piano) base += 3500;
        if (safe) base += 1800;
        if (pack) base += 3000;
        if (assembly) base += 2500;

        minPrice = Math.round(base * 0.9);
        maxPrice = Math.round(base * 1.15);
        reasoning = `AI Servisine şu an ulaşılamıyor, ancak güncel 2026 kural tabanlı sistemimiz ${pCity} (${pDistr}) -> ${dCity} (${dDistr}) güzergahı, ${rooms} ev tipi için ${dist} km mesafe, ${pFloor}. kattan ${dFloor}. kata taşıma, ${pack ? "paketleme dahil" : "paketleme hariç"} ve ${assembly ? "montaj dahil" : "montaj hariç"} kriterlerinizi değerlendirerek bu tahmini oluşturdu.`;
      }

      res.json({ minPrice, maxPrice, reasoning });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Fiyat hesaplama başarısız oldu" });
    }
  });

  // API Route: Google Maps Geocode proxy with OSM Nominatim fallback
  app.get("/api/google-geocode", async (req, res) => {
    try {
      const { address } = req.query;
      const apiKey = process.env.GOOGLE_MAPS_PLATFORM_KEY;
      
      if (!apiKey) {
        // Fallback to OSM Nominatim if Google Maps Key is not yet set
        const osmRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            String(address)
          )}&limit=1&countrycodes=tr`,
          {
            headers: {
              "User-Agent": "NakliyePazaryeriApp/1.0 (contact: alibuyukuyar268@gmail.com)"
            }
          }
        );
        const osmData = await osmRes.json();
        if (osmData && osmData.length > 0) {
          return res.json({
            status: "OK",
            results: [
              {
                geometry: {
                  location: {
                    lat: parseFloat(osmData[0].lat),
                    lng: parseFloat(osmData[0].lon)
                  }
                },
                formatted_address: osmData[0].display_name
              }
            ]
          });
        }
        return res.json({ status: "ZERO_RESULTS", results: [] });
      }
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          String(address)
        )}&key=${apiKey}&language=tr`
      );
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API Route: Google Places Autocomplete proxy with OSM Nominatim fallback
  app.get("/api/places-autocomplete", async (req, res) => {
    try {
      const { input } = req.query;
      if (!input) {
        return res.json({ predictions: [] });
      }
      const apiKey = process.env.GOOGLE_MAPS_PLATFORM_KEY;
      if (!apiKey) {
        // Fallback to OSM Nominatim for search
        const osmRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            String(input)
          )}&countrycodes=tr&addressdetails=1&limit=5`,
          {
            headers: {
              "User-Agent": "NakliyePazaryeriApp/1.0 (contact: alibuyukuyar268@gmail.com)"
            }
          }
        );
        const osmData = await osmRes.json();
        const predictions = osmData.map((item: any) => ({
          description: item.display_name,
          place_id: `osm_${item.place_id}`,
          structured_formatting: {
            main_text: item.name || item.type,
            secondary_text: item.display_name
          },
          lat: item.lat,
          lon: item.lon
        }));
        return res.json({ predictions });
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          String(input)
        )}&components=country:tr&language=tr&key=${apiKey}`
      );
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API Route: Google Place Details proxy to get lat/lng and address components
  app.get("/api/place-details", async (req, res) => {
    try {
      const { placeId } = req.query;
      if (!placeId) {
        return res.status(400).json({ error: "Missing placeId" });
      }
      const apiKey = process.env.GOOGLE_MAPS_PLATFORM_KEY;
      
      if (!apiKey || String(placeId).startsWith("osm_")) {
        // Simple mock or return empty if not Google (all info is usually in OSM autocomplete item)
        return res.json({ status: "OK", result: {} });
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=address_components,geometry,formatted_address&language=tr&key=${apiKey}`
      );
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Serve static assets or mount Vite dev server
  app.use("/img", express.static(path.join(process.cwd(), "img")));

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
