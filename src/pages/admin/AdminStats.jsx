import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

export default function AdminStats() {
  const [logs, setLogs] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [users, setUsers] = useState([]);
  const [period, setPeriod] = useState("weekly");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const logsSnap = await getDocs(query(collection(db, "logs"), orderBy("timestamp", "desc")));
      const docsSnap = await getDocs(collection(db, "documents"));
      const usersSnap = await getDocs(collection(db, "users"));
      setLogs(logsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setDocuments(docsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    fetchAll();
  }, []);

  const now = new Date();

  const filterByPeriod = (log) => {
    if (!log.timestamp) return false;
    const date = log.timestamp.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
    if (period === "daily") {
      return date.toDateString() === now.toDateString();
    } else if (period === "weekly") {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return date >= weekAgo;
    } else if (period === "monthly") {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    } else {
      return true;
    }
  };

  const filteredLogs = logs.filter(filterByPeriod);
  const totalDownloads = filteredLogs.filter(l => l.action === "download" || !l.action).length;
  const totalLogins = filteredLogs.filter(l => l.action === "login").length;
  const activeStudents = users.filter(u => u.role === "student" && !u.isBlocked).length;
  const blockedStudents = users.filter(u => u.isBlocked).length;

  // Top downloaded documents
  const downloadCounts = {};
  filteredLogs.forEach(log => {
    if (log.documentTitle) {
      downloadCounts[log.documentTitle] = (downloadCounts[log.documentTitle] || 0) + 1;
    }
  });
  const topDocs = Object.entries(downloadCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Downloads by day for chart
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (6 - i));
    return d;
  });

  const downloadsByDay = last7Days.map(day => ({
    label: day.toLocaleDateString('en-US', { weekday: 'short' }),
    count: logs.filter(log => {
      if (!log.timestamp) return false;
      const date = log.timestamp.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
      return date.toDateString() === day.toDateString() && (log.action === "download" || !log.action);
    }).length
  }));

  const maxCount = Math.max(...downloadsByDay.map(d => d.count), 1);

  const statCard = (label, value, color, icon) => (
    <div style={{backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '8px'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <p style={{color: '#64748b', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>{label}</p>
        <span style={{fontSize: '20px'}}>{icon}</span>
      </div>
      <p style={{color: color || 'white', fontSize: '32px', fontWeight: 'bold'}}>{value}</p>
    </div>
  );

  if (loading) return <p style={{color: '#64748b'}}>Loading stats...</p>;

  return (
    <div>
      {/* Header */}
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
        <div>
          <h1 style={{color: 'white', fontSize: '24px', fontWeight: 'bold'}}>System Monitor</h1>
          <p style={{color: '#64748b', fontSize: '14px'}}>Real-time engagement tracking for CICS DocHub</p>
        </div>
        {/* Period Filter */}
        <div style={{display: 'flex', gap: '8px'}}>
          {["daily", "weekly", "monthly", "all"].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{padding: '6px 16px', borderRadius: '20px', border: '1px solid #334155', backgroundColor: period === p ? '#2563eb' : '#1e293b', color: period === p ? 'white' : '#94a3b8', cursor: 'pointer', fontSize: '13px', fontWeight: '500', textTransform: 'capitalize'}}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px'}}>
        {statCard("Total Downloads", totalDownloads, "#2563eb", "⬇️")}
        {statCard("Student Logins", totalLogins, "#16a34a", "👤")}
        {statCard("Active Students", activeStudents, "#9333ea", "✅")}
        {statCard("Blocked Students", blockedStudents, "#ef4444", "🚫")}
        {statCard("Total Documents", documents.length, "#f59e0b", "📄")}
      </div>

      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
        {/* Downloads Chart */}
        <div style={{backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', border: '1px solid #334155'}}>
          <h2 style={{color: 'white', fontWeight: '700', fontSize: '16px', marginBottom: '4px'}}>Downloads — Last 7 Days</h2>
          <p style={{color: '#64748b', fontSize: '13px', marginBottom: '20px'}}>Daily download activity</p>
          <div style={{display: 'flex', alignItems: 'flex-end', gap: '8px', height: '150px'}}>
            {downloadsByDay.map((day, i) => (
              <div key={i} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end', gap: '6px'}}>
                <p style={{color: '#94a3b8', fontSize: '11px'}}>{day.count}</p>
                <div style={{width: '100%', backgroundColor: '#2563eb', borderRadius: '4px 4px 0 0', height: `${(day.count / maxCount) * 100}%`, minHeight: day.count > 0 ? '4px' : '2px', opacity: day.count > 0 ? 1 : 0.2}}></div>
                <p style={{color: '#64748b', fontSize: '11px'}}>{day.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Top Documents */}
        <div style={{backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', border: '1px solid #334155'}}>
          <h2 style={{color: 'white', fontWeight: '700', fontSize: '16px', marginBottom: '4px'}}>Top Downloaded</h2>
          <p style={{color: '#64748b', fontSize: '13px', marginBottom: '20px'}}>Most popular documents</p>
          {topDocs.length === 0 ? (
            <p style={{color: '#64748b', fontSize: '14px'}}>No downloads yet.</p>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
              {topDocs.map(([title, count], i) => (
                <div key={i} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <span style={{color: '#2563eb', fontWeight: 'bold', fontSize: '14px'}}>#{i + 1}</span>
                    <p style={{color: 'white', fontSize: '13px'}}>{title}</p>
                  </div>
                  <span style={{backgroundColor: '#0f172a', color: '#2563eb', fontSize: '12px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px'}}>⬇ {count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div style={{backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', border: '1px solid #334155', gridColumn: '1 / -1'}}>
          <h2 style={{color: 'white', fontWeight: '700', fontSize: '16px', marginBottom: '4px'}}>Recent Activity</h2>
          <p style={{color: '#64748b', fontSize: '13px', marginBottom: '20px'}}>Latest actions in the system</p>
          <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead>
              <tr style={{borderBottom: '1px solid #334155'}}>
                {["Time", "User", "Action", "Document"].map(h => (
                  <th key={h} style={{padding: '10px 12px', textAlign: 'left', color: '#64748b', fontSize: '12px', textTransform: 'uppercase'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLogs.slice(0, 8).map((log, i) => {
                const date = log.timestamp?.toDate ? log.timestamp.toDate() : new Date();
                return (
                  <tr key={log.id} style={{borderBottom: '1px solid #0f172a'}}>
                    <td style={{padding: '10px 12px', color: '#94a3b8', fontSize: '13px'}}>{date.toLocaleString()}</td>
                    <td style={{padding: '10px 12px', color: '#e2e8f0', fontSize: '13px'}}>{log.userEmail || '—'}</td>
                    <td style={{padding: '10px 12px'}}>
                      <span style={{backgroundColor: '#1d3a6e', color: '#2563eb', fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', textTransform: 'capitalize'}}>{log.action || 'download'}</span>
                    </td>
                    <td style={{padding: '10px 12px', color: '#94a3b8', fontSize: '13px'}}>{log.documentTitle || '—'}</td>
                  </tr>
                );
              })}
              {filteredLogs.length === 0 && (
                <tr><td colSpan={4} style={{padding: '24px', textAlign: 'center', color: '#64748b'}}>No activity in this period.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}