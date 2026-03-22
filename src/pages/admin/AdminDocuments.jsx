import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { supabase } from "../../supabase";
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";

const CLOUDINARY_CLOUD_NAME = "dpgkykluq";
const CLOUDINARY_UPLOAD_PRESET = "cics_docs";
const categories = ["Curriculum", "Manual", "Forms", "Guide", "Academic"];

export default function AdminDocuments() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ title: "", description: "", category: "Manual" });
    const [file, setFile] = useState(null);

    const fetchDocs = async () => {
        const snap = await getDocs(collection(db, "documents"));
        setDocuments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
    };

    useEffect(() => { fetchDocs(); }, []);



    const handleUpload = async () => {
        if (!file || !form.title) return alert("Please fill in all fields and select a file.");
        setUploading(true);
        try {
            // Upload to Supabase Storage
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
                uploadedAt: serverTimestamp(),
            });

            setForm({ title: "", description: "", category: "Manual" });
            setFile(null);
            setShowForm(false);
            fetchDocs();
            alert("Document uploaded successfully!");
        } catch (error) {
            console.error(error);
            alert("Upload failed: " + error.message);
        }
        setUploading(false);
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this document?")) return;
        await deleteDoc(doc(db, "documents", id));
        fetchDocs();
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>Documents</h1>
                    <p style={{ color: '#64748b', fontSize: '14px' }}>Upload and manage CICS documents</p>
                </div>
                <button onClick={() => setShowForm(!showForm)}
                    style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
                    {showForm ? "✕ Cancel" : "+ Upload Document"}
                </button>
            </div>

            {showForm && (
                <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', border: '1px solid #334155', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h2 style={{ color: 'white', fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>Upload New Document</h2>
                    <input type="text" placeholder="Document Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                        style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white', fontSize: '14px', outline: 'none' }} />
                    <textarea placeholder="Description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                        style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white', fontSize: '14px', outline: 'none', resize: 'vertical' }} />
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                        style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white', fontSize: '14px', outline: 'none' }}>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input type="file" accept=".pdf,.doc,.docx,.pptx,.ppt,.xlsx,.xls,.png,.jpg,.jpeg,.gif,.mp4,.mov,.avi" onChange={e => setFile(e.target.files[0])}
                        style={{ color: '#94a3b8', fontSize: '14px' }} />
                    <button onClick={handleUpload} disabled={uploading}
                        style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '15px', opacity: uploading ? 0.7 : 1 }}>
                        {uploading ? "Uploading..." : "Upload Document"}
                    </button>
                </div>
            )}

            <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #334155' }}>
                            {["Title", "Category", "Size", "Downloads", "Actions"].map(h => (
                                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Loading...</td></tr>
                        ) : documents.length === 0 ? (
                            <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>No documents uploaded yet.</td></tr>
                        ) : (
                            documents.map((doc, i) => (
                                <tr key={doc.id} style={{ borderBottom: '1px solid #334155', backgroundColor: i % 2 === 0 ? '#0f172a' : '#1e293b' }}>
                                    <td style={{ padding: '12px 16px' }}>
                                        <p style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>{doc.title}</p>
                                        <p style={{ color: '#64748b', fontSize: '12px' }}>{doc.description}</p>
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span style={{ backgroundColor: '#0f172a', color: '#2563eb', fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px' }}>{doc.category}</span>
                                    </td>
                                    <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px' }}>{doc.fileSize}</td>
                                    <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px' }}>⬇ {doc.downloads || 0}</td>
                                    <td style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
                                        <a href={doc.fileUrl} target="_blank" rel="noreferrer"
                                            style={{ backgroundColor: '#1d3a6e', color: '#2563eb', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', textDecoration: 'none' }}>
                                            View
                                        </a>
                                        <button onClick={() => handleDelete(doc.id)}
                                            style={{ backgroundColor: '#450a0a', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                                            Delete
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
}