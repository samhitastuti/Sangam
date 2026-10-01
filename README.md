# Sangam — Collegiate Volunteer & Internship Network 🇮🇳🎓

[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Express.js](https://img.shields.io/badge/Express.js-4.21-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-sql.js-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.4-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

**Sangam** (संगम — *Confluence*) is a full-stack platform designed to bridge collegiate talent with impactful community service drives, NGOs, grassroots initiatives, and social internships across India. 

Equipped with **AI-powered opportunity matching**, **campus-based cohort grouping**, **geofenced check-ins**, and **verifiable digital certificates**, Sangam empowers student chapters to organize, track verified volunteer hours, and drive measurable social change.

---

## 🌟 Key Highlights & Features

### 🎯 1. Opportunity Discovery & Geo-Proximity Matching
- **Smart Filtering:** Browse social initiatives and internships by domain (*Education, Healthcare, Environment & Sustainability, Animal Welfare, Rural Development, Women Empowerment, Disaster Relief*).
- **Proximity & Distance Engine:** Built-in campus presets (e.g., DU Delhi, VIT Vellore, COEP Pune, Jadavpur Kolkata, IISc/RV Bengaluru, Mumbai, Hyderabad) and live GPS coordinates to discover drives happening closest to campus.
- **Interactive Maps:** Visual event locations with `@vis.gl/react-google-maps` integration.

### 🤖 2. Google Gemini AI Assistance
- **AI Opportunity Recommendations:** Matches volunteer profiles and skillsets with optimal drives.
- **Statement of Purpose (SOP) Assistant:** Generates tailored motivations and application cover notes for internships.
- **Smart Impact Summaries:** Automatically synthesizes volunteer contributions into resume-ready bullet points.

### 👥 3. Campus Chapters & Automated Team Grouping
- **College Hubs:** Students are automatically grouped into their respective college networks upon sign-up.
- **Collaborative Squads:** Form teams for large-scale drives (e.g., beach cleanups, teaching drives, blood donation camps).
- **College Leaderboards:** Real-time gamified ranking by total verified hours and Karma points across institutions.

### 📱 4. Geofenced Check-In & Attendance Verification
- **Anti-Fraud QR & GPS Check-in:** Voluntarily check into offline venues only when physically within the drive's designated geo-radius.
- **Real-Time Drive Attendance:** Organizers monitor live check-ins and verify hours on-site.

### 📜 5. Verifiable Digital Certificates
- **Tamper-Proof Certificates:** Issued upon successful drive completion with cryptographic verification hashes.
- **Instant QR Verification:** Public verification portal allows employers, recruiters, and colleges to validate certificates in one click.

### 🏢 6. NGO & Organization Management Portal
- **Drive Lifecycle Management:** Post openings, set volunteer caps, define required skills, and set venue coordinates.
- **Applicant Screening:** Review student portfolios, accept/reject applicants, and assign team roles.

---

## 🏗️ Tech Stack Architecture

| Layer | Technology |
|---|---|
| **Frontend UI** | React 19, React Router v7, Tailwind CSS v4, Motion (Framer Motion), Lucide Icons |
| **Interactive UI** | Canvas Confetti, QRCode.react, `@vis.gl/react-google-maps` |
| **Backend API** | Node.js, Express.js (RESTful APIs) |
| **AI Engine** | Google Gemini API (`@google/genai` SDK) |
| **Database** | SQLite via `sql.js` (In-memory + auto-persisted file, pre-seeded dataset) |
| **Auth & Security** | JWT (`jsonwebtoken`), `bcryptjs` password hashing, CORS |
| **Build & Dev Tooling**| Vite 8, TypeScript / `tsx`, PostCSS |

---

## 📁 Directory Structure

```text
├── public/                 # Static assets & icons
├── server/
│   ├── routes/             # Express API route modules
│   │   ├── ai.js           # Gemini AI assistance endpoints
│   │   ├── auth.js         # User registration & JWT login
│   │   ├── applications.js # Volunteer application processing
│   │   ├── certificates.js # Digital certificate generation & verification
│   │   ├── colleges.js     # Campus directories & rankings
│   │   ├── opportunities.js# Volunteer & internship postings
│   │   ├── organizations.js# NGO profiles & management
│   │   ├── stories.js      # Community impact feed
│   │   ├── teams.js        # Student group & chapter management
│   │   └── users.js        # User profiles & karma scores
│   ├── db.js               # sql.js wrapper & query executor
│   ├── schema.sql          # Relational database schema
│   └── seedExtended.js     # Mock dataset generator (10 Indian cities & NGOs)
├── src/
│   ├── components/         # Reusable UI components (Modals, Nav, Cards, QR)
│   ├── contexts/           # React Contexts (AuthContext, LocationContext)
│   ├── pages/              # Primary view pages
│   │   ├── BrowsePage.jsx
│   │   ├── CertificatePage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── LeaderboardPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── OpportunitiesPage.jsx
│   │   ├── OpportunityPage.jsx
│   │   ├── OrgDashboardPage.jsx
│   │   ├── ProfilePage.jsx
│   │   └── StoriesPage.jsx
│   ├── utils/              # Haversine distance, helpers & validators
│   ├── App.jsx             # App routing & providers
│   └── main.tsx            # React root mount
├── server.ts               # Unified development & production server
├── vite.config.ts          # Vite configuration
└── package.json            # Project dependencies & scripts
```

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (version 18+ or 20+ recommended)
- `npm` or `yarn` or `bun`

### 2. Clone Repository
```bash
git clone https://github.com/samhitastuti/Sangam.git
cd Sangam
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```
Populate the values:
```env
# Google Gemini API Key (Get from https://aistudio.google.com/)
GEMINI_API_KEY=your_gemini_api_key_here

# Application URL
APP_URL=http://localhost:3000

# Optional: Google Maps Platform API key (for map views)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 5. Run the Application
Start the unified full-stack development server:
```bash
npm run dev
```
> The application will start at **`http://localhost:3000`** with live hot module replacement (HMR) and an auto-seeded SQLite database.

---

## 🧪 Available Scripts

- `npm run dev` — Starts the combined backend and Vite dev server (`server.ts`).
- `npm run build` — Compiles and bundles production frontend assets to `/dist`.
- `npm run preview` — Locally previews the production build.
- `npm run lint` — Runs TypeScript type-checking (`tsc --noEmit`).

---

## 🔒 Security & Data Persistence
- **Database:** Uses `sql.js` (WebAssembly SQLite) with automated disk synchronisation to `sangam.sqlite`. When initialized for the first time, it automatically sets up schemas and seeds initial opportunities, colleges, organizations, and verified volunteer stories.
- **Passwords:** Hashed with salted `bcryptjs`.
- **API Security:** Endpoints are protected via JSON Web Tokens (`Bearer` Authorization).

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License
This project is licensed under the **MIT License**.

---

<div align="center">
  <sub>Built with ❤️ for student volunteers across India.</sub>
</div>
