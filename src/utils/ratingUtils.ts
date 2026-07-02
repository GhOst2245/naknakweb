import { db } from "../firebase";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";

/**
 * Recalculates and updates the averageRating and ratingsCount of a target user (Customer or Company)
 * by checking all of their reviews in the database.
 * Transparent (under appeal) and deleted reviews are excluded from the calculation.
 */
export async function recalculateUserRating(userId: string) {
  if (!userId) return;
  try {
    const q = query(collection(db, "reviews"), where("targetId", "==", userId));
    const snap = await getDocs(q);
    
    let sum = 0;
    let count = 0;
    
    snap.forEach((d) => {
      const review = d.data();
      // Exclude reviews that are deleted or transparent (under appeal)
      if (!review.isDeleted && !review.isTransparent) {
        sum += (review.rating || 5);
        count++;
      }
    });
    
    const averageRating = count > 0 ? parseFloat((sum / count).toFixed(1)) : 5.0;
    
    await updateDoc(doc(db, "users", userId), {
      averageRating,
      ratingsCount: count
    });
    
    console.log(`Updated rating for ${userId}: Avg: ${averageRating}, Count: ${count}`);
    return { averageRating, ratingsCount: count };
  } catch (err) {
    console.error("Error recalculating rating for user:", userId, err);
    return null;
  }
}
