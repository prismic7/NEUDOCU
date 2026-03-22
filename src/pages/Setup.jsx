import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useState } from "react";

const programs = ["BSIT", "BSCS", "BSEMCI", "BSIS"];

export default function Setup({ user, setUserData }) {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleSubmit = async () => {
    if (!selected) return alert("Please select a program.");
    if (!confirmed) return alert("Please confirm that you understand your selection is permanent.");
    setLoading(true);
    try {
      const data = {
        email: user.email,
        name: user.displayName,
        role: "student",
        program: selected,
        isBlocked: false,
        createdAt: new Date(),
      };
      await setDoc(doc(db, "users", user.uid), data);
      setUserData(data);
    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{backgroundColor: '#1e293b', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '20px'}}>

        <div style={{textAlign: 'center'}}>
          <h1 style={{fontSize: '22px', fontWeight: 'bold', color: 'white'}}>Welcome to CICS DocHub</h1>
          <p style={{fontSize: '14px', color: '#94a3b8', marginTop: '8px'}}>Before you continue, please select your undergraduate program.</p>
        </div>

        {/* Warning Banner */}
        <div style={{backgroundColor: '#451a03', border: '1px solid #92400e', borderRadius: '8px', padding: '12px 16px', display: 'flex', gap: '10px', alignItems: 'flex-start'}}>
          <span style={{fontSize: '18px', flexShrink: 0}}>⚠️</span>
          <p style={{color: '#fbbf24', fontSize: '13px', lineHeight: '1.6'}}>
            <strong>Important:</strong> Your program selection is <strong>permanent</strong> and cannot be changed by yourself after submission. If you need a correction, you must submit a request to faculty or admin.
          </p>
        </div>

        {/* Program Buttons */}
        <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
          {programs.map((program) => (
            <button
              key={program}
              onClick={() => setSelected(program)}
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: '8px',
                border: selected === program ? '2px solid #2563eb' : '2px solid #334155',
                backgroundColor: selected === program ? '#1d3a6e' : '#0f172a',
                color: selected === program ? 'white' : '#94a3b8',
                fontWeight: '600',
                fontSize: '15px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {selected === program ? '✓ ' : ''}{program}
            </button>
          ))}
        </div>

        {/* Confirmation Checkbox */}
        {selected && (
          <div
            onClick={() => setConfirmed(!confirmed)}
            style={{display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '12px 16px', backgroundColor: '#0f172a', borderRadius: '8px', border: `1px solid ${confirmed ? '#2563eb' : '#334155'}`}}
          >
            <div style={{width: '18px', height: '18px', borderRadius: '4px', border: `2px solid ${confirmed ? '#2563eb' : '#475569'}`, backgroundColor: confirmed ? '#2563eb' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
              {confirmed && <span style={{color: 'white', fontSize: '12px', fontWeight: 'bold'}}>✓</span>}
            </div>
            <p style={{color: '#94a3b8', fontSize: '13px'}}>
              I understand that my selection of <strong style={{color: 'white'}}>{selected}</strong> is permanent and cannot be changed without submitting a request.
            </p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !selected || !confirmed}
          style={{
            width: '100%',
            backgroundColor: (!selected || !confirmed) ? '#1e293b' : '#2563eb',
            color: (!selected || !confirmed) ? '#64748b' : 'white',
            fontWeight: '600',
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            cursor: (!selected || !confirmed) ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? "Saving..." : "Continue"}
        </button>
      </div>
    </div>
  );
}