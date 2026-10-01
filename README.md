# Sangam (संगम) — Collegiate Volunteer & Internship Network 🇮🇳

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?style=flat-square&logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-sql.js-003B57?style=flat-square&logo=sqlite&logoColor=white)
![Gemini](https://img.shields.io/badge/Google_Gemini-API-4285F4?style=flat-square&logo=google&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

**Sangam** (*Confluence*) connects college students with NGOs, community drives, and social internships across India. Students find opportunities near campus, volunteer in campus squads, check in at the venue, and earn certificates anyone can verify online.

<!-- TODO: add a demo link and 2–3 screenshots/GIF here. This is the single biggest upgrade to this README. -->
<!-- **Live demo:** https://... -->
<!-- ![Browse page](docs/browse.png) -->

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Scripts](#scripts)
- [Security & Data](#security--data)
- [Known Limitations](#known-limitations)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### 🎯 Opportunity discovery
- Filter by domain: Education, Healthcare, Environment, Animal Welfare, Rural Development, Women Empowerment, Disaster Relief.
- Sort by distance using campus presets (DU Delhi, VIT Vellore, COEP Pune, Jadavpur Kolkata, IISc/RV Bengaluru, Mumbai, Hyderabad) or live GPS (Haversine distance).
- Event locations on an interactive map (`@vis.gl/react-google-maps`).

### 🤖 Gemini-powered assistance
- **Recommendations:** match a volunteer's profile and skills to suitable drives.
- **SOP assistant:** draft a tailored motivation note for internship applications.
- **Impact summaries:** turn logged contributions into resume-ready bullet points.

### 👥 Campus chapters & squads
- Students are grouped into their college hub at sign-up.
- Form squads for larger drives (beach cleanups, teaching drives, blood donation camps).
- College leaderboard ranked by verified hours and Karma points.

### 📱 Geofenced check-in
- Check in via QR + GPS, allowed only within the drive's geo-radius.
- Organizers see live attendance and verify hours on-site.

### 📜 Verifiable certificates
- Issued on drive completion with a verification hash.
- Public verification page (QR-linked) for employers, recruiters, and colleges.

### 🏢 NGO portal
- Post drives with volunteer caps, required skills, and venue coordinates.
- Review applicants, accept/reject, and assign roles.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router v7, Tailwind CSS v4, Motion, Lucide Icons |
| UI extras | Canvas Confetti, QRCode.react, `@vis.gl/react-google-maps` |
| Backend | Node.js, Express (REST) |
| AI | Google Gemini via `@google/genai` |
| Database | SQLite via `sql.js` (in-memory, persisted to `sangam.sqlite`, auto-seeded) |
| Auth | JWT (`jsonwebtoken`), `bcryptjs`, CORS |
| Tooling | Vite, TypeScript / `tsx`, PostCSS |

---

## Getting Started

**Prerequisites:** Node.js 18+ and npm.

```bash
git clone https://github.com/samhitastuti/Sangam.git
cd Sangam
npm install
cp .env.example .env
```

Fill in `.env`:

```env
# Required for AI features — https://aistudio.google.com/
GEMINI_API_KEY=your_gemini_api_key

APP_URL=http://localhost:3000

# Optional — enables map views
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

> `GEMINI_API_KEY` is used server-side only. Never prefix it with `VITE_`, or it will be exposed in the browser bundle.

Run:

```bash
npm run dev
```

Open **http://localhost:3000**. On first run the database is created and seeded with sample colleges, NGOs, opportunities, and stories.

<!-- TODO: list seeded demo accounts (e.g. student / organizer logins) so reviewers can try both roles immediately. -->

---

## Project Structure

```text
├── public/                 # Static assets
├── server/
│   ├── routes/
│   │   ├── ai.js           # Gemini endpoints
│   │   ├── auth.js         # Register / login (JWT)
│   │   ├── applications.js # Volunteer applications
│   │   ├── certificates.js # Issue & verify certificates
│   │   ├── colleges.js     # Campus directory & rankings
│   │   ├── opportunities.js# Drives & internships
│   │   ├── organizations.js# NGO profiles
│   │   ├── stories.js      # Impact feed
│   │   ├── teams.js        # Squads & chapters
│   │   └── users.js        # Profiles & Karma
│   ├── db.js               # sql.js wrapper
│   ├── schema.sql          # Database schema
│   └── seedExtended.js     # Seed data (10 Indian cities, NGOs)
├── src/
│   ├── components/         # Modals, nav, cards, QR
│   ├── contexts/           # AuthContext, LocationContext
│   ├── pages/              # Browse, Opportunities, Dashboard, OrgDashboard,
│   │                       # Certificate, Leaderboard, Profile, Stories, Login
│   ├── utils/              # Haversine distance, helpers, validators
│   ├── App.jsx             # Routing & providers
│   └── main.tsx            # Entry point
├── server.ts               # Combined dev/prod server
├── vite.config.ts
└── package.json
```

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Starts the backend and Vite dev server together |
| `npm run build` | Builds the frontend to `/dist` |
| `npm run preview` | Previews the production build |
| `npm run lint` | Type-checks with `tsc --noEmit` |

---

## Security & Data

- Passwords are hashed with salted `bcryptjs`.
- API routes are protected with JWT `Bearer` tokens.
- Data lives in `sql.js` (WebAssembly SQLite) and is synced to `sangam.sqlite` on disk.

---

## Known Limitations

Sangam is a prototype. Before real-world use:

- **Storage:** `sql.js` holds the database in memory and writes snapshots to a file. It isn't suited to concurrent writes or multi-instance deployment; move to PostgreSQL or native SQLite for production.
- **Geofencing:** GPS coordinates come from the client and can be spoofed. Treat check-ins as a deterrent, not proof; organizer verification is the real safeguard.
- **Certificates:** the verification hash confirms a certificate matches a record in Sangam's database. It isn't an independent or blockchain-style proof.

---

## Contributing

Issues and PRs are welcome.

1. Fork the repo and create a branch: `git checkout -b feature/your-feature`
2. Commit your changes and push the branch
3. Open a Pull Request

---

## License

MIT

<div align="center">
  <sub>Built with ❤️ for student volunteers across India.</sub>
</div>
