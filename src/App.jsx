import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, setDoc, addDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import Login from "./pages/Login";
import Setup from "./pages/Setup";
import StudentLibrary from "./pages/StudentLibrary";
import AdminDashboard from "./pages/admin/AdminDashboard";
import FacultyDashboard from "./pages/FacultyDashboard";

export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const ref = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();
          // Always ensure jcesperanza is admin
          if (firebaseUser.email === "jcesperanza@neu.edu.ph" && data.role !== "admin") {
            await updateDoc(ref, { role: "admin", isBlocked: false });
            setUserData({ ...data, role: "admin", isBlocked: false });
          } else {
            setUserData(data);
          }
          await addDoc(collection(db, "logs"), {
            userId: firebaseUser.uid,
            userEmail: firebaseUser.email,
            action: "login",
            documentTitle: null,
            documentId: null,
            timestamp: serverTimestamp(),
          });
        } else {
          if (firebaseUser.email === "jcesperanza@neu.edu.ph") {
            await setDoc(ref, {
              email: firebaseUser.email,
              name: firebaseUser.displayName,
              role: "admin",
              isBlocked: false,
              createdAt: new Date(),
            });
            setUserData({ role: "admin" });
          } else {
            setUserData(null);
          }
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'white', fontSize: '18px' }}>Loading...</p>
    </div>
  );

  if (!user) return <Login />;
  if (user && !userData) return <Setup user={user} setUserData={setUserData} />;
  if (userData?.role === "admin") return <AdminDashboard user={user} userData={userData} setUserData={setUserData} />;
  if (userData?.role === "faculty") return <FacultyDashboard user={user} userData={userData} />;
  return <StudentLibrary user={user} userData={userData} setUserData={setUserData} />;
}