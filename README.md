# CICS DocHub [Digital Document Repository System]

A web-based document management system for the College of Information and Computer Studies (CICS) at New Era University, replacing physical document distribution with a centralized digital repository using Google authentication and role-based access control.

---

## [Live Demo]

> https://neu-docs.web.app

---

### [Flow of App]
- Admin or Faculty uploads CICS documents to the repository.
- Students log in using their institutional NEU email.
- Students select their undergraduate program on first login.
- Students browse, search, and download documents from the Digital Library.
- Students may submit a program change request if needed.
- Faculty reviews and approves or rejects program change requests.
- Admin monitors all activity through the audit log and system dashboard.

---

## [Features]

### For Students
- **Google Sign-In** restricted to `@neu.edu.ph` accounts only.
- **Program Selection** — One-time undergraduate program assignment on first login.
- **Digital Library** — Browse and download documents filtered by category or keyword.
- **My Profile** — View account details including role, status, and assigned program.
- **Program Change Request** — Submit a formal request to faculty or admin to update their program.

### For Faculty
- **Document Upload** — Upload documents of any type to the CICS repository.
- **User Management** — View, manage, and update student programs and block/unblock accounts.
- **Program Requests** — Review and approve or reject student program change requests.
- **Digital Library Access** — Full access to all uploaded documents.

### For Admin
- **Centralized Dashboard** — Real-time system monitor with download stats, login counts, and engagement charts.
- **Document Management** — Upload, view, and delete documents from the repository.
- **User Management** — Manage all user accounts including role assignment and blocking.
- **Program Requests** — Review and approve or reject student program change requests.
- **Audit Log** — Full activity trail with filters for action type, user, and date range.
- **Role Preview** — Preview the app as a Student or Faculty role for testing purposes.

### Automatic
- **Domain Locking** — Only `@neu.edu.ph` Google accounts are permitted to access the system.
- **Persistent Admin** — The designated admin email (`jcesperanza@neu.edu.ph`) is automatically granted admin privileges on every login.
- **Download Tracking** — Every document download is logged and reflected in the download counter and audit trail.
- **Login Logging** — All user logins are recorded in the audit log for monitoring.

---

## [Tech Stack]

| Layer | Technology |
|---|---|
| **Frontend** | React (Vite), Tailwind CSS v3, Inline Styles |
| **Auth** | Firebase Authentication (Google OAuth `@neu.edu.ph`) |
| **Database** | Firebase Firestore (NoSQL) |
| **File Storage** | Supabase Storage (Public Bucket) |
| **Hosting** | Firebase Hosting |

---

## [Setup & Deployment]

### 1. Clone the Repository
```bash
git clone https://github.com/prismic7/NEUDOCU
cd NEUDOCU
npm install
```

### 2. Firebase Configuration
Update **`src/firebase.js`** with your Firebase project credentials:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 3. Supabase Configuration
Update **`src/supabase.js`** with your Supabase project credentials:

```js
const SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_ANON_KEY";
```

### 4. Run Locally
```bash
npm run dev
```

### 5. Build & Deploy
```bash
npm run build
firebase deploy --only hosting
```

---

## [Firestore Security Rules]
The app enforces the following access controls at the database level:
- Only authenticated `@neu.edu.ph` users can read or write data.
- Students can only read and create their own records.
- Faculty can manage student data but cannot modify admin accounts.
- Admins have full read and write access.
- Audit logs are append-only — no updates or deletions are permitted.

---

## [Project Structure]

```plaintext
cics-dochub/
├── public/
├── src/
│   ├── firebase.js               ← Firebase initialization
│   ├── supabase.js               ← Supabase initialization
│   ├── App.jsx                   ← Root component & auth routing
│   ├── main.jsx                  ← React entry point
│   ├── index.css                 ← Tailwind CSS imports
│   └── pages/
│       ├── Login.jsx             ← Google sign-in page
│       ├── Setup.jsx             ← First-time program selection
│       ├── StudentLibrary.jsx    ← Student dashboard & library
│       ├── FacultyDashboard.jsx  ← Faculty dashboard
│       └── admin/
│           ├── AdminDashboard.jsx    ← Admin shell & navigation
│           ├── AdminDocuments.jsx    ← Document upload & management
│           ├── AdminStudents.jsx     ← User management & requests
│           ├── AdminStats.jsx        ← System monitor & analytics
│           └── AdminAuditLog.jsx     ← Full activity audit log
├── firebase.json                 ← Firebase hosting config
├── firestore.rules               ← Firestore security rules
├── vite.config.js                ← Vite build config
└── tailwind.config.js            ← Tailwind CSS config
```

---

## [User Roles]

| Role | Permissions |
|---|---|
| **Student** | Browse library, download documents, submit program change requests |
| **Faculty** | All student permissions + upload documents, manage students, approve requests |
| **Admin** | All faculty permissions + delete documents, manage all users, view audit logs, assign roles |

---

## [Author]

**Frinz Hughwie D. Bautista** — Bachelor of Science in Computer Science
New Era University

---

## 📄 License

This project was developed as an academic requirement.
© 2026 New Era University — All rights reserved.
