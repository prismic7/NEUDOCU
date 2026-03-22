import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { supabase } from "../supabase";
import { collection, getDocs, addDoc, serverTimestamp, doc, updateDoc, increment } from "firebase/firestore";
import { signOut } from "firebase/auth";

const categories = ["All", "Curriculum", "Manual", "Forms", "Guide", "Academic"];

export default function FacultyDashboard({ user, userData, embedded = false, topOffset = 0 }) {
  const [activePage, setActivePage] = useState("library");
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "Manual" });
  const [file, setFile] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState("All");
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);

  const fetchDocs = async () => {
    const snap = await getDocs(collection(db, "documents"));
    setDocuments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  const fetchUsers = async () => {
    const snap = await getDocs(collection(db, "users"));
    setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setUsersLoading(false);
  };

  const fetchRequests = async () => {
    const snap = await getDocs(collection(db, "requests"));
    setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setRequestsLoading(false);
  };

  useEffect(() => { fetchDocs(); fetchUsers(); fetchRequests(); }, []);

  const handleDownload = async (document) => {
    try {
      await addDoc(collection(db, "logs"), {
        userId: user.uid, userEmail: user.email,
        documentId: document.id, documentTitle: document.title,
        action: "download", timestamp: serverTimestamp(),
      });
      await updateDoc(doc(db, "documents", document.id), { downloads: increment(1) });
    } catch (error) {
      console.error("Logging error:", error);
    }
    window.open(document.fileUrl, "_blank");
  };

  const handleUpload = async () => {
    if (!file || !form.title) return alert("Please fill in all fields and select a file.");
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      const fileUrl = urlData.publicUrl;

      await addDoc(collection(db, "documents"), {
        title: form.title,
        description: form.description,
        category: form.category,
        fileUrl,
        fileSize: (file.size / (1024 * 1024)).toFixed(2) + " MB",
        downloads: 0,
        uploadedBy: user.email,
        uploadedAt: serverTimestamp(),
      });

      await addDoc(collection(db, "logs"), {
        userId: user.uid, userEmail: user.email,
        action: "upload", documentTitle: form.title, timestamp: serverTimestamp(),
      });

      setForm({ title: "", description: "", category: "Manual" });
      setFile(null);
      setActivePage("library");
      fetchDocs();
      alert("Document uploaded successfully!");
    } catch (error) {
      console.error(error);
      alert("Upload failed: " + error.message);
    }
    setUploading(false);
  };

  const handleProgramChange = async (u, newProgram) => {
    await updateDoc(doc(db, "users", u.id), { program: newProgram });
    fetchUsers();
  };

  const handleToggleBlock = async (u) => {
    const newStatus = !u.isBlocked;
    const action = newStatus ? "block" : "unblock";
    if (!confirm(`Are you sure you want to ${action} ${u.name}?`)) return;
    await updateDoc(doc(db, "users", u.id), { isBlocked: newStatus });
    await addDoc(collection(db, "logs"), { userId: u.id, userEmail: u.email, action, documentTitle: null, timestamp: serverTimestamp() });
    fetchUsers();
  };

  const handleRequestAction = async (request, action) => {
    if (!confirm(`Are you sure you want to ${action} this request?`)) return;
    await updateDoc(doc(db, "requests", request.id), { status: action === "approve" ? "approved" : "rejected", reviewedAt: serverTimestamp() });
    if (action === "approve") {
      await updateDoc(doc(db, "users", request.userId), { program: request.requestedProgram });
      await addDoc(collection(db, "logs"), { userId: request.userId, userEmail: request.userEmail, action: "program_change", documentTitle: `Program changed to ${request.requestedProgram}`, timestamp: serverTimestamp() });
    }
    fetchRequests();
    fetchUsers();
  };

  const filtered = documents.filter(d => d.title?.toLowerCase().includes(search.toLowerCase()) && (activeCategory === "All" || d.category === activeCategory));
  const filteredUsers = users.filter(u => {
    const matchSearch = u.name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase());
    const matchFilter = userFilter === "All" || (userFilter === "Student" && u.role === "student") || (userFilter === "Blocked" && u.isBlocked) || (userFilter === "Active" && !u.isBlocked);
    return matchSearch && matchFilter;
  });
  const pendingRequests = requests.filter(r => r.status === "pending");

  const navItem = (label, icon, page, badge = 0) => (
    <div onClick={() => setActivePage(page)}
      style={{backgroundColor: activePage === page ? '#2563eb' : 'transparent', color: activePage === page ? 'white' : '#94a3b8', padding: '10px 14px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px'}}>
      <span>{icon}</span> {label}
      {badge > 0 && <span style={{backgroundColor: '#f59e0b', color: '#000', borderRadius: '20px', fontSize: '10px', padding: '1px 6px', fontWeight: '700', marginLeft: 'auto'}}>{badge}</span>}
    </div>
  );

  const statusColor = (status) => {
    if (status === "pending") return { bg: '#451a03', text: '#f59e0b' };
    if (status === "approved") return { bg: '#052e16', text: '#16a34a' };
    return { bg: '#450a0a', text: '#ef4444' };
  };

  const libraryContent = (
    <div>
      <h1 style={{color: 'white', fontSize: '24px', fontWeight: 'bold'}}>Digital Library</h1>
      <p style={{color: '#64748b', fontSize: '14px', marginBottom: '24px'}}>CICS Document Repository</p>
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
      {loading ? <p style={{color: '#64748b'}}>Loading...</p> : filtered.length === 0 ? <p style={{color: '#64748b'}}>No documents found.</p> : (
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

  const uploadContent = (
    <div>
      <h1 style={{color: 'white', fontSize: '24px', fontWeight: 'bold'}}>Upload Document</h1>
      <p style={{color: '#64748b', fontSize: '14px', marginBottom: '24px'}}>Add a new document to the CICS repository</p>
      <div style={{backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', border: '1px solid #334155', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '14px'}}>
        <input type="text" placeholder="Document Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
          style={{padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white', fontSize: '14px', outline: 'none'}} />
        <textarea placeholder="Description (optional)" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3}
          style={{padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white', fontSize: '14px', outline: 'none', resize: 'vertical'}} />
        <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
          style={{padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white', fontSize: '14px', outline: 'none'}}>
          {categories.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input type="file" accept=".pdf,.doc,.docx,.pptx,.ppt,.xlsx,.xls,.png,.jpg,.jpeg,.gif,.mp4,.mov,.avi" onChange={e => setFile(e.target.files[0])}
          style={{color: '#94a3b8', fontSize: '14px'}} />
        <button onClick={handleUpload} disabled={uploading}
          style={{backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '15px', opacity: uploading ? 0.7 : 1}}>
          {uploading ? "Uploading..." : "Upload Document"}
        </button>
      </div>
    </div>
  );

  const usersContent = (
    <div>
      <h1 style={{color: 'white', fontSize: '24px', fontWeight: 'bold'}}>User Management</h1>
      <p style={{color: '#64748b', fontSize: '14px', marginBottom: '24px'}}>Manage student accounts and programs</p>
      <div style={{display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center'}}>
        <input type="text" placeholder="Search by name or email..." value={userSearch} onChange={e => setUserSearch(e.target.value)}
          style={{flex: 1, minWidth: '200px', padding: '8px 14px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1e293b', color: 'white', fontSize: '14px', outline: 'none'}} />
        <div style={{display: 'flex', gap: '8px'}}>
          {["All", "Student", "Active", "Blocked"].map(f => (
            <button key={f} onClick={() => setUserFilter(f)}
              style={{padding: '6px 16px', borderRadius: '20px', border: '1px solid #334155', backgroundColor: userFilter === f ? '#2563eb' : '#1e293b', color: userFilter === f ? 'white' : '#94a3b8', cursor: 'pointer', fontSize: '13px', fontWeight: '500'}}>
              {f}
            </button>
          ))}
        </div>
      </div>
      <div style={{backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden'}}>
        <table style={{width: '100%', borderCollapse: 'collapse'}}>
          <thead>
            <tr style={{borderBottom: '1px solid #334155'}}>
              {["Name", "Email", "Program", "Role", "Status", "Actions"].map(h => (
                <th key={h} style={{padding: '12px 16px', textAlign: 'left', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {usersLoading ? (
              <tr><td colSpan={6} style={{padding: '24px', textAlign: 'center', color: '#64748b'}}>Loading...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan={6} style={{padding: '24px', textAlign: 'center', color: '#64748b'}}>No users found.</td></tr>
            ) : (
              filteredUsers.map((u, i) => (
                <tr key={u.id} style={{borderBottom: '1px solid #334155', backgroundColor: i % 2 === 0 ? '#0f172a' : '#1e293b', verticalAlign: 'middle'}}>
                  <td style={{padding: '12px 16px'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                      <div style={{width: '32px', height: '32px', borderRadius: '50%', backgroundColor: u.role === 'admin' ? '#2563eb' : u.role === 'faculty' ? '#9333ea' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '13px', flexShrink: 0}}>
                        {u.name?.charAt(0) || '?'}
                      </div>
                      <p style={{color: 'white', fontWeight: '600', fontSize: '14px'}}>{u.name || '—'}</p>
                    </div>
                  </td>
                  <td style={{padding: '12px 16px', color: '#94a3b8', fontSize: '13px'}}>{u.email}</td>
                  <td style={{padding: '12px 16px'}}>
                    {u.role === 'admin' || u.role === 'faculty' ? (
                      <span style={{color: '#94a3b8', fontSize: '13px'}}>{u.program || '—'}</span>
                    ) : (
                      <select value={u.program || ''} onChange={e => handleProgramChange(u, e.target.value)}
                        style={{padding: '4px 8px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white', fontSize: '12px', cursor: 'pointer'}}>
                        <option value="">— Select —</option>
                        <option value="BSIT">BSIT</option>
                        <option value="BSCS">BSCS</option>
                        <option value="BSEMCI">BSEMCI</option>
                        <option value="BSIS">BSIS</option>
                      </select>
                    )}
                  </td>
                  <td style={{padding: '12px 16px', verticalAlign: 'middle'}}>
                    {u.role === 'admin' ? (
                      <span style={{backgroundColor: '#1d3a6e', color: '#2563eb', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600'}}>Admin</span>
                    ) : u.role === 'faculty' ? (
                      <span style={{backgroundColor: '#3b0764', color: '#9333ea', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600'}}>Faculty</span>
                    ) : (
                      <span style={{backgroundColor: '#052e16', color: '#16a34a', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600'}}>Student</span>
                    )}
                  </td>
                  <td style={{padding: '12px 16px'}}>
                    <span style={{backgroundColor: u.isBlocked ? '#450a0a' : '#052e16', color: u.isBlocked ? '#ef4444' : '#16a34a', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600'}}>
                      {u.isBlocked ? 'Blocked' : 'Active'}
                    </span>
                  </td>
                  <td style={{padding: '12px 16px'}}>
                    <button onClick={() => handleToggleBlock(u)} disabled={u.role === 'admin' || u.role === 'faculty'}
                      style={{backgroundColor: (u.role === 'admin' || u.role === 'faculty') ? '#1e293b' : u.isBlocked ? '#052e16' : '#450a0a', color: (u.role === 'admin' || u.role === 'faculty') ? '#64748b' : u.isBlocked ? '#16a34a' : '#ef4444', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: (u.role === 'admin' || u.role === 'faculty') ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: '600'}}>
                      {(u.role === 'admin' || u.role === 'faculty') ? 'Protected' : u.isBlocked ? 'Unblock' : 'Block'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const requestsContent = (
    <div>
      <h1 style={{color: 'white', fontSize: '24px', fontWeight: 'bold'}}>Program Change Requests</h1>
      <p style={{color: '#64748b', fontSize: '14px', marginBottom: '24px'}}>{pendingRequests.length} pending · {requests.length} total</p>
      <div style={{backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden'}}>
        <table style={{width: '100%', borderCollapse: 'collapse'}}>
          <thead>
            <tr style={{borderBottom: '1px solid #334155'}}>
              {["Student", "Current Program", "Requested Program", "Reason", "Status", "Actions"].map(h => (
                <th key={h} style={{padding: '12px 16px', textAlign: 'left', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {requestsLoading ? (
              <tr><td colSpan={6} style={{padding: '24px', textAlign: 'center', color: '#64748b'}}>Loading...</td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={6} style={{padding: '24px', textAlign: 'center', color: '#64748b'}}>No requests yet.</td></tr>
            ) : (
              requests.map((r, i) => {
                const colors = statusColor(r.status);
                return (
                  <tr key={r.id} style={{borderBottom: '1px solid #334155', backgroundColor: i % 2 === 0 ? '#0f172a' : '#1e293b'}}>
                    <td style={{padding: '12px 16px'}}>
                      <p style={{color: 'white', fontWeight: '600', fontSize: '14px'}}>{r.userName}</p>
                      <p style={{color: '#64748b', fontSize: '12px'}}>{r.userEmail}</p>
                    </td>
                    <td style={{padding: '12px 16px', color: '#94a3b8', fontSize: '13px'}}>{r.currentProgram}</td>
                    <td style={{padding: '12px 16px', color: '#94a3b8', fontSize: '13px'}}>{r.requestedProgram}</td>
                    <td style={{padding: '12px 16px', color: '#94a3b8', fontSize: '13px', maxWidth: '200px'}}>
                      <p style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{r.reason}</p>
                    </td>
                    <td style={{padding: '12px 16px'}}>
                      <span style={{backgroundColor: colors.bg, color: colors.text, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', textTransform: 'capitalize'}}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{padding: '12px 16px'}}>
                      {r.status === "pending" ? (
                        <div style={{display: 'flex', gap: '6px'}}>
                          <button onClick={() => handleRequestAction(r, "approve")}
                            style={{backgroundColor: '#052e16', color: '#16a34a', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600'}}>
                            Approve
                          </button>
                          <button onClick={() => handleRequestAction(r, "reject")}
                            style={{backgroundColor: '#450a0a', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600'}}>
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{color: '#64748b', fontSize: '12px'}}>Reviewed</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const profileContent = (
    <div>
      <h1 style={{color: 'white', fontSize: '24px', fontWeight: 'bold'}}>My Profile</h1>
      <p style={{color: '#64748b', fontSize: '14px', marginBottom: '24px'}}>Your account information</p>
      <div style={{backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', border: '1px solid #334155', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '16px'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
          <div style={{width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '22px'}}>
            {user.displayName?.charAt(0)}
          </div>
          <div>
            <p style={{color: 'white', fontWeight: 'bold', fontSize: '16px'}}>{user.displayName}</p>
            <p style={{color: '#64748b', fontSize: '13px'}}>{user.email}</p>
          </div>
        </div>
        <div style={{borderTop: '1px solid #334155', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <p style={{color: '#64748b', fontSize: '13px'}}>Role</p>
            <span style={{backgroundColor: '#3b0764', color: '#9333ea', padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600'}}>Faculty</span>
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <p style={{color: '#64748b', fontSize: '13px'}}>Status</p>
            <span style={{backgroundColor: '#052e16', color: '#16a34a', padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600'}}>Active</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (embedded) return libraryContent;

  return (
    <div style={{minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex'}}>
      <div style={{width: '220px', backgroundColor: '#1e293b', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px 16px', position: 'fixed', top: `${topOffset}px`, left: 0, height: `calc(100vh - ${topOffset}px)`}}>
        <div>
          <div style={{marginBottom: '32px'}}>
            <h2 style={{color: '#2563eb', fontWeight: 'bold', fontSize: '16px'}}>CICS DocHub</h2>
            <p style={{color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em'}}>Faculty</p>
          </div>
          <nav>
            {navItem("Library", "📄", "library")}
            {navItem("Upload", "⬆️", "upload")}
            {navItem("Users", "👥", "users")}
            {navItem("Requests", "📝", "requests", pendingRequests.length)}
            {navItem("My Profile", "👤", "profile")}
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
      <div style={{marginLeft: '220px', padding: '32px', width: '100%'}}>
        {activePage === "library" && libraryContent}
        {activePage === "upload" && uploadContent}
        {activePage === "users" && usersContent}
        {activePage === "requests" && requestsContent}
        {activePage === "profile" && profileContent}
      </div>
    </div>
  );
}