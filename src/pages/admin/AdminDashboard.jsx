import { useState } from "react";
import { auth } from "../../firebase";
import { signOut } from "firebase/auth";
import AdminDocuments from "./AdminDocuments";
import AdminStudents from "./AdminStudents";
import AdminStats from "./AdminStats";
import AdminAuditLog from "./AdminAuditLog";
import StudentLibrary from "../StudentLibrary";
import FacultyDashboard from "../FacultyDashboard";

export default function AdminDashboard({ user, userData, setUserData }) {
    const [activePage, setActivePage] = useState("stats");
    const [previewRole, setPreviewRole] = useState("student");
    const [showPreview, setShowPreview] = useState(false);

    const navItem = (label, icon, page) => (
        <div
            onClick={() => setActivePage(page)}
            style={{
                backgroundColor: activePage === page ? '#2563eb' : 'transparent',
                color: activePage === page ? 'white' : '#94a3b8',
                padding: '10px 14px',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
            }}
        >
            <span>{icon}</span> {label}
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex' }}>

            {/* Sidebar */}
            <div style={{ width: '220px', backgroundColor: '#1e293b', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px 16px', position: 'fixed', top: 0, left: 0, height: '100vh' }}>
                <div>
                    <div style={{ marginBottom: '32px' }}>
                        <h2 style={{ color: '#2563eb', fontWeight: 'bold', fontSize: '16px' }}>CICS DocHub</h2>
                        <p style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Admin</p>
                    </div>
                    <nav>
                        {navItem("Dashboard", "📊", "stats")}
                        {navItem("Documents", "📄", "documents")}
                        {navItem("Users", "👥", "students")}
                        {navItem("Audit Log", "🗒️", "audit")}
                        {navItem("Role Preview", "👁️", "studentview")}
                    </nav>
                </div>
                <div>
                    <p style={{ color: 'white', fontSize: '13px', fontWeight: '600' }}>{user.displayName}</p>
                    <p style={{ color: '#64748b', fontSize: '11px', marginBottom: '12px' }}>{user.email}</p>
                    <button
                        onClick={() => signOut(auth)}
                        style={{ color: '#ef4444', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                    >
                        → Sign Out
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ marginLeft: '220px', padding: '32px', width: '100%' }}>
                {activePage === "stats" && <AdminStats />}
                {activePage === "documents" && <AdminDocuments />}
                {activePage === "students" && <AdminStudents />}
                {activePage === "audit" && <AdminAuditLog />}
                {activePage === "studentview" && (
                    <div>
                        <div style={{ marginBottom: '32px' }}>
                            <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>Role Preview</h1>
                            <p style={{ color: '#64748b', fontSize: '14px' }}>Preview how the app looks for each role</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '600px' }}>
                            {/* Student Card */}
                            <div
                                onClick={() => { setPreviewRole("student"); setShowPreview(true); }}
                                style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px' }}
                                onMouseOver={e => e.currentTarget.style.borderColor = '#2563eb'}
                                onMouseOut={e => e.currentTarget.style.borderColor = '#334155'}
                            >
                                <div style={{ width: '48px', height: '48px', backgroundColor: '#1d3a6e', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                                    👤
                                </div>
                                <div>
                                    <p style={{ color: 'white', fontWeight: '700', fontSize: '16px' }}>Student View</p>
                                    <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>Library, search, download documents</p>
                                </div>
                                <div style={{ color: '#2563eb', fontSize: '13px', fontWeight: '600' }}>Launch Preview →</div>
                            </div>

                            {/* Faculty Card */}
                            <div
                                onClick={() => { setPreviewRole("faculty"); setShowPreview(true); }}
                                style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px' }}
                                onMouseOver={e => e.currentTarget.style.borderColor = '#9333ea'}
                                onMouseOut={e => e.currentTarget.style.borderColor = '#334155'}
                            >
                                <div style={{ width: '48px', height: '48px', backgroundColor: '#3b0764', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                                    🎓
                                </div>
                                <div>
                                    <p style={{ color: 'white', fontWeight: '700', fontSize: '16px' }}>Faculty View</p>
                                    <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>Library, upload documents, profile</p>
                                </div>
                                <div style={{ color: '#9333ea', fontSize: '13px', fontWeight: '600' }}>Launch Preview →</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Full Screen Preview Modal */}
            {showPreview && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1000, backgroundColor: '#0f172a' }}>

                    {/* Exit Bar */}
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1001, backgroundColor: '#1e293b', borderBottom: '1px solid #334155', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '48px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ color: '#64748b', fontSize: '13px' }}>Previewing as:</span>
                            <span style={{ backgroundColor: previewRole === "student" ? '#2563eb' : '#9333ea', color: 'white', padding: '2px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                                {previewRole === "student" ? "👤 Student" : "🎓 Faculty"}
                            </span>
                        </div>
                        <button
                            onClick={() => setShowPreview(false)}
                            style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}
                        >
                            ✕ Exit Preview
                        </button>
                    </div>

                    {/* Preview Content */}
                    <div style={{ marginTop: '48px', height: 'calc(100vh - 48px)', overflowY: 'auto', position: 'relative' }}>
                        {previewRole === "student" && <StudentLibrary user={user} userData={{ ...userData, program: "BSCS", role: "student", isBlocked: false }} topOffset={48} />}
                        {previewRole === "faculty" && <FacultyDashboard user={user} userData={{ ...userData, role: "faculty" }} topOffset={48} />}
                    </div>
                </div>
            )}
        </div>
    );
}