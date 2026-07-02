import { collection, getDocs, doc, writeBatch } from "firebase/firestore";
import { db } from "../firebase";

export const INITIAL_TURKISH_CITIES = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin", "Aydın", "Balıkesir",
  "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli",
  "Diyarbakır", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari",
  "Hatay", "Isparta", "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir",
  "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla", "Muş", "Nevşehir",
  "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat",
  "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman",
  "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye",
  "Düzce"
].sort((a, b) => a.localeCompare(b, "tr"));

export async function fetchCitiesFromFirestore(): Promise<string[]> {
  try {
    const q = collection(db, "cities");
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      // Seed initial cities using batch
      const batch = writeBatch(db);
      INITIAL_TURKISH_CITIES.forEach((cityName) => {
        const cityId = cityName.toLowerCase()
          .replace(/ç/g, "c")
          .replace(/ğ/g, "g")
          .replace(/ı/g, "i")
          .replace(/ö/g, "o")
          .replace(/ş/g, "s")
          .replace(/ü/g, "u")
          .replace(/[^a-z]/g, "");
        const docRef = doc(db, "cities", cityId);
        batch.set(docRef, { name: cityName });
      });
      await batch.commit();
      return INITIAL_TURKISH_CITIES;
    } else {
      const citiesList: string[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.name) {
          citiesList.push(data.name);
        }
      });
      return citiesList.sort((a, b) => a.localeCompare(b, "tr"));
    }
  } catch (error) {
    console.error("Error fetching or seeding cities in Firestore:", error);
    return INITIAL_TURKISH_CITIES;
  }
}
