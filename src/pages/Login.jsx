import { auth, googleProvider } from "../firebase";
import { signInWithPopup } from "firebase/auth";

export default function Login() {
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user.email;

      if (!email.endsWith("@neu.edu.ph")) {
        await auth.signOut();
        alert("Only @neu.edu.ph emails are allowed.");
        return;
      }

      alert(`Welcome, ${result.user.displayName}!`);
    } catch (error) {
      console.error(error);
      alert("Login failed. Please try again.");
    }
  };

  return (
    <div style={{minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{backgroundColor: '#1e293b', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px'}}>
        
        <div style={{backgroundColor: '#2563eb', color: 'white', borderRadius: '12px', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold'}}>
          C
        </div>

        <div style={{textAlign: 'center'}}>
          <h1 style={{fontSize: '24px', fontWeight: 'bold', color: 'white'}}>CICS DocHub</h1>
          <p style={{fontSize: '14px', color: '#94a3b8', marginTop: '8px'}}>Digital Repository for College Excellence</p>
        </div>

        <div style={{width: '100%', borderTop: '1px solid #334155'}}></div>

        <div style={{width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '12px 16px'}}>
          <p style={{fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px'}}>University Email</p>
          <p style={{fontSize: '14px', color: '#94a3b8'}}>name.surname@neu.edu.ph</p>
        </div>

        <button
          onClick={handleLogin}
          style={{width: '100%', backgroundColor: '#2563eb', color: 'white', fontWeight: '600', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '16px'}}
          onMouseOver={e => e.target.style.backgroundColor = '#3b82f6'}
          onMouseOut={e => e.target.style.backgroundColor = '#2563eb'}
        >
          Sign in with NEU Account
        </button>

        <p style={{fontSize: '12px', color: '#64748b', textAlign: 'center'}}>
          Only authorized university personnel and students can access this system.
        </p>
      </div>
    </div>
  );
}