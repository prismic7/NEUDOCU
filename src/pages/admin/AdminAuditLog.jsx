import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

export default function AdminAuditLog() {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const logsSnap = await getDocs(query(collection(db, "logs"), orderBy("timestamp", "desc")));
      const usersSnap = await getDocs(collection(db, "users"));
      const data = logsSnap.docs.map(d => {
        const raw = d.data();
        return { id: d.id, ...raw, action: raw.action || "download" };
      });
      setLogs(data);
      setUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    fetchData();
  }, []);

  const filters = ["All", "download", "login", "upload", "block", "unblock", "program_change", "role_change"];

  const filtered = logs.filter(l => {
    const matchFilter = filter === "All" || l.action === filter;
    const matchSearch =
      l.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
      l.documentTitle?.toLowerCase().includes(search.toLowerCase());
    const matchUser = selectedUser === "All" || l.userEmail === selectedUser;

    let matchDate = true;
    if (startDate || endDate) {
      const logDate = l.timestamp?.toDate ? l.timestamp.toDate() : new Date(l.timestamp);
      if (startDate) matchDate = matchDate && logDate >= new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchDate = matchDate && logDate <= end;
      }
    }

    return matchFilter && (search === "" || matchSearch) && matchUser && matchDate;
  });

  const actionColor = (action) => {
    if (action === "download") return "#2563eb";
    if (action === "login") return "#16a34a";
    if (action === "upload") return "#9333ea";
    if (action === "block") return "#ef4444";
    if (action === "unblock") return "#16a34a";
    if (action === "program_change") return "#f59e0b";
    if (action === "role_change") return "#06b6d4";
    return "#64748b";
  };

  const actionLabel = (action) => {
    if (action === "program_change") return "Program Change";
    if (action === "role_change") return "Role Change";
    return action.charAt(0).toUpperCase() + action.slice(1);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "—";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const uniqueEmails = [...new Set(logs.map(l => l.userEmail).filter(Boolean))].sort();

  return (
    <div>
      <h1 style={{color: 'white', fontSize: '24px', fontWeight: 'bold', marginBottom: '4px'}}>Audit Log</h1>
      <p style={{color: '#64748b', fontSize: '14px', marginBottom: '24px'}}>All recorded actions by students, faculty, and admins</p>

      {/* Search + User Filter Row */}
      <div style={{display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center'}}>
        <input
          type="text"
          placeholder="Search by email or document..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{flex: 1, minWidth: '200px', padding: '8px 14px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1e293b', color: 'white', fontSize: '14px', outline: 'none'}}
        />
        <select
          value={selectedUser}
          onChange={e => setSelectedUser(e.target.value)}
          style={{padding: '8px 14px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1e293b', color: selectedUser === "All" ? '#94a3b8' : 'white', fontSize: '14px', outline: 'none', minWidth: '200px'}}
        >
          <option value="All">All Users</option>
          {uniqueEmails.map(email => (
            <option key={email} value={email}>{email}</option>
          ))}
        </select>
      </div>

      {/* Action Filter + Date Row */}
      <div style={{display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center'}}>
        <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 16px',
                borderRadius: '20px',
                border: '1px solid #334155',
                backgroundColor: filter === f ? actionColor(f === "All" ? "x" : f) : '#1e293b',
                color: filter === f ? 'white' : '#94a3b8',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
              }}
            >
              {f === "All" ? "All" : actionLabel(f)}
            </button>
          ))}
        </div>

        <div style={{display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto'}}>
          <p style={{color: '#64748b', fontSize: '13px'}}>From</p>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            style={{padding: '6px 12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1e293b', color: 'white', fontSize: '13px', outline: 'none'}}
          />
          <p style={{color: '#64748b', fontSize: '13px'}}>To</p>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            style={{padding: '6px 12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1e293b', color: 'white', fontSize: '13px', outline: 'none'}}
          />
          {(startDate || endDate) && (
            <button
              onClick={() => { setStartDate(""); setEndDate(""); }}
              style={{padding: '6px 12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#450a0a', color: '#ef4444', cursor: 'pointer', fontSize: '13px', fontWeight: '600'}}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Count + Clear Filters */}
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
        <p style={{color: '#64748b', fontSize: '13px'}}>
          Showing {filtered.length} of {logs.length} records
        </p>
        {(filter !== "All" || selectedUser !== "All" || search || startDate || endDate) && (
          <button
            onClick={() => { setFilter("All"); setSelectedUser("All"); setSearch(""); setStartDate(""); setEndDate(""); }}
            style={{padding: '4px 12px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#94a3b8', cursor: 'pointer', fontSize: '12px'}}
          >
            Clear All Filters
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden'}}>
        <table style={{width: '100%', borderCollapse: 'collapse'}}>
          <thead>
            <tr style={{borderBottom: '1px solid #334155'}}>
              {["Timestamp", "User", "Action", "Details"].map(h => (
                <th key={h} style={{padding: '12px 16px', textAlign: 'left', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{padding: '24px', textAlign: 'center', color: '#64748b'}}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} style={{padding: '24px', textAlign: 'center', color: '#64748b'}}>No logs found.</td></tr>
            ) : (
              filtered.map((log, i) => (
                <tr key={log.id} style={{borderBottom: '1px solid #334155', backgroundColor: i % 2 === 0 ? '#0f172a' : '#1e293b'}}>
                  <td style={{padding: '12px 16px', color: '#94a3b8', fontSize: '13px', whiteSpace: 'nowrap'}}>{formatTime(log.timestamp)}</td>
                  <td style={{padding: '12px 16px'}}>
                    <p style={{color: '#e2e8f0', fontSize: '13px'}}>{log.userEmail || '—'}</p>
                  </td>
                  <td style={{padding: '12px 16px'}}>
                    <span style={{backgroundColor: actionColor(log.action) + '22', color: actionColor(log.action), padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap'}}>
                      {actionLabel(log.action)}
                    </span>
                  </td>
                  <td style={{padding: '12px 16px', color: '#94a3b8', fontSize: '13px'}}>
                    {log.action === "login" ? (
                      <span style={{color: '#64748b', fontStyle: 'italic'}}>Signed in</span>
                    ) : log.action === "download" ? (
                      <span>📄 {log.documentTitle || '—'}</span>
                    ) : log.action === "upload" ? (
                      <span>⬆️ {log.documentTitle || '—'}</span>
                    ) : log.action === "block" ? (
                      <span>🚫 Account blocked</span>
                    ) : log.action === "unblock" ? (
                      <span>✅ Account unblocked</span>
                    ) : log.action === "program_change" ? (
                      <span>🎓 {log.documentTitle || '—'}</span>
                    ) : log.action === "role_change" ? (
                      <span>👤 {log.documentTitle || '—'}</span>
                    ) : (
                      <span>{log.documentTitle || '—'}</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}