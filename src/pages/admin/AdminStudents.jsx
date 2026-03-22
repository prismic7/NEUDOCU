import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, getDocs, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";

export default function AdminStudents() {
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [activeTab, setActiveTab] = useState("users");

  const fetchUsers = async () => {
    const snap = await getDocs(collection(db, "users"));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setUsers(data);
    setLoading(false);
  };

  const fetchRequests = async () => {
    const snap = await getDocs(collection(db, "requests"));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setRequests(data);
    setRequestsLoading(false);
  };

  useEffect(() => { fetchUsers(); fetchRequests(); }, []);

  const handleToggleBlock = async (user) => {
    const newStatus = !user.isBlocked;
    const action = newStatus ? "block" : "unblock";
    if (!confirm(`Are you sure you want to ${action} ${user.name}?`)) return;
    await updateDoc(doc(db, "users", user.id), { isBlocked: newStatus });
    await addDoc(collection(db, "logs"), {
      userId: user.id, userEmail: user.email, action,
      documentTitle: null, documentId: null, timestamp: serverTimestamp(),
    });
    fetchUsers();
  };

  const handleRoleChange = async (user, newRole) => {
    if (!confirm(`Change ${user.name}'s role to ${newRole}?`)) return;
    await updateDoc(doc(db, "users", user.id), { role: newRole });
    fetchUsers();
  };

  const handleProgramChange = async (user, newProgram) => {
    await updateDoc(doc(db, "users", user.id), { program: newProgram });
    fetchUsers();
  };

  const handleRequestAction = async (request, action) => {
    if (!confirm(`Are you sure you want to ${action} this request?`)) return;
    await updateDoc(doc(db, "requests", request.id), {
      status: action === "approve" ? "approved" : "rejected",
      reviewedAt: serverTimestamp(),
    });
    if (action === "approve") {
      await updateDoc(doc(db, "users", request.userId), { program: request.requestedProgram });
      await addDoc(collection(db, "logs"), {
        userId: request.userId, userEmail: request.userEmail,
        action: "program_change",
        documentTitle: `Program changed to ${request.requestedProgram}`,
        timestamp: serverTimestamp(),
      });
    }
    fetchRequests();
    fetchUsers();
  };

  const filtered = users.filter(u => {
    const matchSearch =
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.program?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "All" ||
      (filter === "Blocked" && u.isBlocked) ||
      (filter === "Active" && !u.isBlocked) ||
      (filter === "Admin" && u.role === "admin") ||
      (filter === "Faculty" && u.role === "faculty") ||
      (filter === "Student" && u.role === "student");
    return matchSearch && matchFilter;
  });

  const filters = ["All", "Active", "Blocked", "Student", "Faculty"];
  const pendingRequests = requests.filter(r => r.status === "pending");

  const tabStyle = (tab) => ({
    padding: '8px 20px', borderRadius: '8px', border: 'none',
    backgroundColor: activeTab === tab ? '#2563eb' : '#1e293b',
    color: activeTab === tab ? 'white' : '#94a3b8',
    cursor: 'pointer', fontWeight: '600', fontSize: '14px',
    display: 'flex', alignItems: 'center', gap: '8px',
  });

  const statusColor = (status) => {
    if (status === "pending") return { bg: '#451a03', text: '#f59e0b' };
    if (status === "approved") return { bg: '#052e16', text: '#16a34a' };
    return { bg: '#450a0a', text: '#ef4444' };
  };

  return (
    <div>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
        <div>
          <h1 style={{color: 'white', fontSize: '24px', fontWeight: 'bold'}}>User Management</h1>
          <p style={{color: '#64748b', fontSize: '14px'}}>Manage user accounts and access</p>
        </div>
        <div style={{backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '10px 16px', display: 'flex', gap: '16px'}}>
          <div style={{textAlign: 'center'}}>
            <p style={{color: 'white', fontWeight: 'bold', fontSize: '18px'}}>{users.filter(u => u.role === 'student').length}</p>
            <p style={{color: '#64748b', fontSize: '11px'}}>Students</p>
          </div>
          <div style={{textAlign: 'center'}}>
            <p style={{color: '#9333ea', fontWeight: 'bold', fontSize: '18px'}}>{users.filter(u => u.role === 'faculty').length}</p>
            <p style={{color: '#64748b', fontSize: '11px'}}>Faculty</p>
          </div>
          <div style={{textAlign: 'center'}}>
            <p style={{color: '#ef4444', fontWeight: 'bold', fontSize: '18px'}}>{users.filter(u => u.isBlocked).length}</p>
            <p style={{color: '#64748b', fontSize: '11px'}}>Blocked</p>
          </div>
          <div style={{textAlign: 'center'}}>
            <p style={{color: '#2563eb', fontWeight: 'bold', fontSize: '18px'}}>{users.filter(u => u.role === 'admin').length}</p>
            <p style={{color: '#64748b', fontSize: '11px'}}>Admins</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display: 'flex', gap: '8px', marginBottom: '24px'}}>
        <button style={tabStyle("users")} onClick={() => setActiveTab("users")}>👥 Users</button>
        <button style={tabStyle("requests")} onClick={() => setActiveTab("requests")}>
          📝 Program Requests
          {pendingRequests.length > 0 && (
            <span style={{backgroundColor: '#f59e0b', color: '#000', borderRadius: '20px', fontSize: '11px', padding: '1px 7px', fontWeight: '700'}}>
              {pendingRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === "users" && (
        <>
          <div style={{display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center'}}>
            <input type="text" placeholder="Search by name, email or program..." value={search} onChange={e => setSearch(e.target.value)}
              style={{flex: 1, minWidth: '200px', padding: '8px 14px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1e293b', color: 'white', fontSize: '14px', outline: 'none'}} />
            <div style={{display: 'flex', gap: '8px'}}>
              {filters.map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{padding: '6px 16px', borderRadius: '20px', border: '1px solid #334155', backgroundColor: filter === f ? '#2563eb' : '#1e293b', color: filter === f ? 'white' : '#94a3b8', cursor: 'pointer', fontSize: '13px', fontWeight: '500'}}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <p style={{color: '#64748b', fontSize: '13px', marginBottom: '12px'}}>Showing {filtered.length} of {users.length} users</p>
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
                {loading ? (
                  <tr><td colSpan={6} style={{padding: '24px', textAlign: 'center', color: '#64748b'}}>Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{padding: '24px', textAlign: 'center', color: '#64748b'}}>No users found.</td></tr>
                ) : (
                  filtered.map((u, i) => (
                    <tr key={u.id} style={{borderBottom: '1px solid #334155', backgroundColor: i % 2 === 0 ? '#0f172a' : '#1e293b'}}>
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
                        {u.role === 'admin' ? (
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
                      <td style={{padding: '12px 16px'}}>
                        {u.role === 'admin' ? (
                          <span style={{backgroundColor: '#1d3a6e', color: '#2563eb', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600'}}>Admin</span>
                        ) : (
                          <select value={u.role} onChange={e => handleRoleChange(u, e.target.value)}
                            style={{padding: '4px 8px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white', fontSize: '12px', cursor: 'pointer'}}>
                            <option value="student">Student</option>
                            <option value="faculty">Faculty</option>
                          </select>
                        )}
                      </td>
                      <td style={{padding: '12px 16px'}}>
                        <span style={{backgroundColor: u.isBlocked ? '#450a0a' : '#052e16', color: u.isBlocked ? '#ef4444' : '#16a34a', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600'}}>
                          {u.isBlocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td style={{padding: '12px 16px'}}>
                        <button onClick={() => handleToggleBlock(u)} disabled={u.role === 'admin'}
                          style={{backgroundColor: u.role === 'admin' ? '#1e293b' : u.isBlocked ? '#052e16' : '#450a0a', color: u.role === 'admin' ? '#64748b' : u.isBlocked ? '#16a34a' : '#ef4444', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: u.role === 'admin' ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: '600'}}>
                          {u.role === 'admin' ? 'Protected' : u.isBlocked ? 'Unblock' : 'Block'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Requests Tab */}
      {activeTab === "requests" && (
        <div>
          <p style={{color: '#64748b', fontSize: '13px', marginBottom: '16px'}}>{pendingRequests.length} pending · {requests.length} total</p>
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
      )}
    </div>
  );
}