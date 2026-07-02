import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, deleteDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCA9s1Qs18oCtK8eHX4ktyNxa3IejzHZ1o",
  authDomain: "handy-attic-gzp7b.firebaseapp.com",
  projectId: "handy-attic-gzp7b",
  storageBucket: "handy-attic-gzp7b.firebasestorage.app",
  messagingSenderId: "561914441097",
  appId: "1:561914441097:web:86f71f061bb1681a83c558"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-nakliyepazaryeri-65b7d6e2-65ae-481a-bddd-10e46147ddf7");

async function clearDatabase() {
  console.log("Starting full database cleanup...");

  // 1. Clear users but make sure to re-create a clean ADMIN profile for the user
  console.log("Cleaning 'users' collection...");
  const usersRef = collection(db, "users");
  const usersSnap = await getDocs(usersRef);
  let deletedUsersCount = 0;

  for (const userDoc of usersSnap.docs) {
    // Delete every user. We will explicitly recreate a clean ADMIN profile
    await deleteDoc(doc(db, "users", userDoc.id));
    deletedUsersCount++;
  }
  console.log(`Deleted ${deletedUsersCount} user(s).`);

  // Explicitly recreate the admin profile for alibuyukuyar268@gmail.com
  const adminUid = "3BJHovCNVFRq1v6S5htAeMDDE4A3";
  const freshAdminProfile = {
    id: adminUid,
    email: "alibuyukuyar268@gmail.com",
    name: "Ali Büyükuyar",
    role: "ADMIN",
    isAdmin: true,
    isOnboarded: true,
    createdAt: new Date().toISOString(),
    phone: "5551234567",
    completedJobs: 0,
    averageRating: 5.0,
    ratingsCount: 0
  };

  await setDoc(doc(db, "users", adminUid), freshAdminProfile);
  console.log(`Successfully initialized fresh admin user profile under UID: ${adminUid}`);

  // 2. Clear all other simple collections
  const simpleCollections = [
    "moving_requests",
    "offers",
    "reviews",
    "complaints",
    "notifications",
    "announcements"
  ];

  for (const collName of simpleCollections) {
    console.log(`Cleaning '${collName}' collection...`);
    const collRef = collection(db, collName);
    const collSnap = await getDocs(collRef);
    let count = 0;
    for (const d of collSnap.docs) {
      await deleteDoc(doc(db, collName, d.id));
      count++;
    }
    console.log(`Deleted ${count} document(s) from '${collName}'.`);
  }

  // 3. Clear Chats & Messages subcollections
  console.log("Cleaning 'chats' collection and their messages...");
  const chatsRef = collection(db, "chats");
  const chatsSnap = await getDocs(chatsRef);
  let deletedChatsCount = 0;
  let deletedMessagesCount = 0;

  for (const chatDoc of chatsSnap.docs) {
    const messagesRef = collection(db, "chats", chatDoc.id, "messages");
    const messagesSnap = await getDocs(messagesRef);
    for (const msgDoc of messagesSnap.docs) {
      await deleteDoc(doc(db, "chats", chatDoc.id, "messages", msgDoc.id));
      deletedMessagesCount++;
    }
    await deleteDoc(doc(db, "chats", chatDoc.id));
    deletedChatsCount++;
  }
  console.log(`Deleted ${deletedChatsCount} chat(s) and ${deletedMessagesCount} message(s).`);

  console.log("Database cleanup and Admin re-initialization completed successfully!");
}

clearDatabase().catch((err) => {
  console.error("Error during database cleanup:", err);
  process.exit(1);
});
