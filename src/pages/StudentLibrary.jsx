import { useState, useEffect } from "react";
import { auth } from "../firebase";
import { db } from "../firebase";
import { collection, getDocs, addDoc, serverTimestamp, doc, updateDoc, increment, query, where } from "firebase/firestore";
import { signOut } from "firebase/auth";

const categories = ["All", "Curriculum", "Manual", "Forms", "Guide", "Academic"];
const programs = ["BSIT", "BSCS", "BSEMCI", "BSIS"];

export default function StudentLibrary({ user, userData, embedded = false, setUserData, topOffset = 0 }) {
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState("library");
  const [requestedProgram, setRequestedProgram] = useState("BSIT");
  const [requestReason, setRequestReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [existingRequest, setExistingRequest] = useState(null);
  const [requestLoading, setRequestLoading] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      const snap = await getDocs(collection(db, "documents"));
      setDocuments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    fetchDocs();
  }, []);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const q = query(collection(db, "requests"), where("userId", "==", user.uid), where("status", "==", "pending"));
        const snap = await getDocs(q);
        if (!snap.empty) setExistingRequest({ id: snap.docs[0].id, ...snap.docs[0].data() });
      } catch (e) { console.error(e); }
      setRequestLoading(false);
    };
    fetchRequest();
  }, []);

  const handleDownload = async (document) => {
  if (userData?.isBlocked) return alert("Your account is restricted. Contact the administrator.");
  try {
    await addDoc(collection(db, "logs"), {
      userId: user.uid,
      userEmail: user.email,
      documentId: document.id,
      documentTitle: document.title,
      action: "download",
      timestamp: serverTimestamp(),
    });
    await updateDoc(doc(db, "documents", document.id), {
      downloads: increment(1)
    });
  } catch (error) {
    console.error("Logging error:", error);
  }
  window.open(document.fileUrl, "_blank");
};

  const handleSubmitRequest = async () => {
    if (!requestReason.trim()) return alert("Please provide a reason for your request.");
    if (requestedProgram === userData.program) return alert("You are already in this program.");
    setSubmitting(true);
    try {
      const req = {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        currentProgram: userData.program,
        requestedProgram,
        reason: requestReason,
        status: "pending",
        createdAt: serverTimestamp(),
      };
      const ref = await addDoc(collection(db, "requests"), req);
      setExistingRequest({ id: ref.id, ...req });
      setRequestReason("");
      alert("Request submitted successfully! Faculty or admin will review it.");
    } catch (error) {
      console.error(error);
      alert("Failed to submit request.");
    }
    setSubmitting(false);
  };

  const filtered = documents.filter(document => {
    const matchSearch = document.title?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === "All" || document.category === activeCategory;
    return matchSearch && matchCategory;
  });

  const profileContent = (
    <div style={{padding: embedded ? '0' : '32px', width: '100%'}}>
      <h1 style={{color: 'white', fontSize: '24px', fontWeight: 'bold'}}>My Profile</h1>
      <p style={{color: '#64748b', fontSize: '14px', marginBottom: '24px'}}>Your account information</p>
      <div style={{backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', border: '1px solid #334155', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '20px'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
          <div style={{width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '22px'}}>
            {user.displayName?.charAt(0)}
          </div>
          <div>
            <p style={{color: 'white', fontWeight: 'bold', fontSize: '16px'}}>{user.displayName}</p>
            <p style={{color: '#64748b', fontSize: '13px'}}>{user.email}</p>
          </div>
        </div>
        <div style={{borderTop: '1px solid #334155', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <p style={{color: '#64748b', fontSize: '13px'}}>Role</p>
            <span style={{backgroundColor: '#1d3a6e', color: '#2563eb', padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', textTransform: 'capitalize'}}>{userData.role}</span>
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <p style={{color: '#64748b', fontSize: '13px'}}>Status</p>
            <span style={{backgroundColor: userData.isBlocked ? '#450a0a' : '#052e16', color: userData.isBlocked ? '#ef4444' : '#16a34a', padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600'}}>
              {userData.isBlocked ? 'Blocked' : 'Active'}
            </span>
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <p style={{color: '#64748b', fontSize: '13px'}}>Program</p>
            <span style={{color: 'white', fontWeight: '600', fontSize: '13px'}}>{userData.program || '—'}</span>
          </div>
          <div style={{backgroundColor: '#0f172a', borderRadius: '8px', padding: '10px 14px', border: '1px solid #334155'}}>
            <p style={{color: '#64748b', fontSize: '12px'}}>Your program was set during registration and can only be changed by faculty or admin. Use the Program Request tab to submit a change request.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const requestContent = (
    <div style={{padding: embedded ? '0' : '32px', width: '100%'}}>
      <h1 style={{color: 'white', fontSize: '24px', fontWeight: 'bold'}}>Program Change Request</h1>
      <p style={{color: '#64748b', fontSize: '14px', marginBottom: '24px'}}>Submit a request to change your undergraduate program</p>
      {requestLoading ? (
        <p style={{color: '#64748b'}}>Loading...</p>
      ) : existingRequest ? (
        <div style={{backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', border: '1px solid #334155', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '16px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <span style={{fontSize: '24px'}}>⏳</span>
            <div>
              <p style={{color: 'white', fontWeight: '700', fontSize: '15px'}}>Request Pending</p>
              <p style={{color: '#64748b', fontSize: '13px'}}>Your request is being reviewed by faculty or admin.</p>
            </div>
          </div>
          <div style={{borderTop: '1px solid #334155', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
              <p style={{color: '#64748b', fontSize: '13px'}}>Current Program</p>
              <span style={{color: 'white', fontWeight: '600', fontSize: '13px'}}>{existingRequest.currentProgram}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
              <p style={{color: '#64748b', fontSize: '13px'}}>Requested Program</p>
              <span style={{color: 'white', fontWeight: '600', fontSize: '13px'}}>{existingRequest.requestedProgram}</span>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
              <p style={{color: '#64748b', fontSize: '13px'}}>Reason</p>
              <p style={{color: '#94a3b8', fontSize: '13px'}}>{existingRequest.reason}</p>
            </div>
          </div>
        </div>
      ) : (
        <div style={{backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', border: '1px solid #334155', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '16px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155'}}>
            <p style={{color: '#64748b', fontSize: '13px'}}>Current Program</p>
            <span style={{color: 'white', fontWeight: '600', fontSize: '13px'}}>{userData.program}</span>
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            <p style={{color: '#64748b', fontSize: '13px'}}>Request Change To</p>
            <select value={requestedProgram} onChange={e => setRequestedProgram(e.target.value)}
              style={{padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white', fontSize: '14px', outline: 'none'}}>
              {programs.filter(p => p !== userData.program).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            <p style={{color: '#64748b', fontSize: '13px'}}>Reason for Request</p>
            <textarea placeholder="Explain why you need this program change..." value={requestReason} onChange={e => setRequestReason(e.target.value)} rows={4}
              style={{padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white', fontSize: '14px', outline: 'none', resize: 'vertical'}} />
          </div>
          <button onClick={handleSubmitRequest} disabled={submitting}
            style={{backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', opacity: submitting ? 0.7 : 1}}>
            {submitting ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      )}
    </div>
  );

  const libraryContent = (
    <div style={{padding: embedded ? '0' : '32px', width: '100%'}}>
      <h1 style={{color: 'white', fontSize: '24px', fontWeight: 'bold'}}>Digital Library</h1>
      <p style={{color: '#64748b', fontSize: '14px', marginBottom: '24px'}}>Resources for {userData.program} students</p>
      <input type="text" placeholder="Search by title, description or keywords..." value={search} onChange={e => setSearch(e.target.value)}
        style={{width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1e293b', color: 'white', fontSize: '14px', marginBottom: '16px', outline: 'none'}} />
      <div style={{display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap'}}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            style={{padding: '6px 16px', borderRadius: '20px', border: '1px solid #334155', backgroundColor: activeCategory === cat ? '#2563eb' : '#1e293b', color: activeCategory === cat ? 'white' : '#94a3b8', cursor: 'pointer', fontSize: '13px', fontWeight: '500'}}>
            {cat}
          </button>
        ))}
      </div>
      {loading ? (
        <p style={{color: '#64748b'}}>Loading documents...</p>
      ) : filtered.length === 0 ? (
        <p style={{color: '#64748b'}}>No documents found.</p>
      ) : (
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px'}}>
          {filtered.map(document => (
            <div key={document.id} style={{backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '10px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <span style={{backgroundColor: '#0f172a', color: '#2563eb', fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase'}}>{document.category}</span>
                <span style={{color: '#64748b', fontSize: '11px'}}>{document.fileSize}</span>
              </div>
              <h3 style={{color: 'white', fontWeight: '700', fontSize: '15px'}}>{document.title}</h3>
              <p style={{color: '#94a3b8', fontSize: '13px'}}>{document.description}</p>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px'}}>
                <span style={{color: '#64748b', fontSize: '12px'}}>⬇ {document.downloads || 0}</span>
                <button onClick={() => handleDownload(document)}
                  style={{backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600'}}>
                  ⬇ Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (embedded) return libraryContent;

  return (
    <div style={{minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex'}}>
      <div style={{width: '220px', backgroundColor: '#1e293b', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px 16px', position: 'fixed', top: `${topOffset}px`, left: 0, height: `calc(100vh - ${topOffset}px)`}}>
        <div>
          <div style={{marginBottom: '32px'}}>
            <h2 style={{color: '#2563eb', fontWeight: 'bold', fontSize: '16px'}}>CICS DocHub</h2>
            <p style={{color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em'}}>Student</p>
          </div>
          <nav style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
            <div onClick={() => setActivePage("library")} style={{backgroundColor: activePage === "library" ? '#2563eb' : 'transparent', color: activePage === "library" ? 'white' : '#94a3b8', padding: '10px 14px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'}}>
              📄 Library
            </div>
            <div onClick={() => setActivePage("profile")} style={{backgroundColor: activePage === "profile" ? '#2563eb' : 'transparent', color: activePage === "profile" ? 'white' : '#94a3b8', padding: '10px 14px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'}}>
              👤 My Profile
            </div>
            <div onClick={() => setActivePage("request")} style={{backgroundColor: activePage === "request" ? '#2563eb' : 'transparent', color: activePage === "request" ? 'white' : '#94a3b8', padding: '10px 14px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'}}>
              📝 Program Request
              {existingRequest && <span style={{backgroundColor: '#f59e0b', color: '#000', borderRadius: '20px', fontSize: '10px', padding: '1px 6px', fontWeight: '700', marginLeft: 'auto'}}>1</span>}
            </div>
          </nav>
        </div>
        <div>
          <p style={{color: 'white', fontSize: '13px', fontWeight: '600'}}>{user.displayName}</p>
          <p style={{color: '#64748b', fontSize: '11px', marginBottom: '12px'}}>{user.email}</p>
          <button onClick={() => signOut(auth)} style={{color: '#ef4444', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600'}}>
            → Sign Out
          </button>
        </div>
      </div>
      <div style={{marginLeft: '220px', width: '100%'}}>
        {activePage === "library" && libraryContent}
        {activePage === "profile" && profileContent}
        {activePage === "request" && requestContent}
      </div>
    </div>
  );
}