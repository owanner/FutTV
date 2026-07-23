# ⚽ Fut-TV

A modern web application for tracking football matches, standings, broadcasts, lineups, and live match information across multiple competitions.

## 🌍 Overview

Fut-TV provides football fans with a clean, responsive experience for following their favourite competitions in one place. It aggregates match data from multiple sources — CBF, football-data.org, and FIFA — and presents a unified interface for fixtures, scores, standings, lineups, and broadcast information.

**Supported competitions:**

| Competition | Source | Status |
|---|---|---|
| Campeonato Brasileiro Série A 2026 | CBF + football-data.org | Live |
| Copa Libertadores 2026 | football-data.org | Live |
| Copa do Mundo FIFA 2026 | FIFA | Live |

## 🚀 Features

### Multi-Competition Home Page

* Competition selector in the navigation bar
* Featured live match highlight
* Upcoming and recently finished matches across all competitions
* Competition-specific badge colours on match cards

### Match Details

* Live score updates
* Stadium and city information
* Referee information
* Broadcast channels (scraped from CBF website)
* Match timeline and events
* Team lineups with formation display

### Standings

* Group standings with position-based zone colours (Libertadores, Sul-Americana, Rebaixados for Brasileirão)
* Flat overall standings view with toggle for Libertadores
* Zone legend chips per competition
* Clickable team rows linking to team detail pages

### Knockout Stage Bracket

* Visual bracket for knockout rounds (Copa 2026, Libertadores)
* Group-to-bracket progression display

### Broadcast Information

* Where to watch each match
* Broadcast channel icons and names
* Sorted by channel priority

### Responsive Design

* Mobile-first experience
* Tablet and desktop support
* Optimised layouts for all screen sizes

---

## 🛠️ Tech Stack

### Frontend

* React 18
* Vite 8
* Material UI (MUI) 6
* React Router
* TanStack Query
* Day.js
* PWA (Progressive Web App) via vite-plugin-pwa

### Backend

* Node.js + Express
* Prisma ORM
* SQLite (development) / PostgreSQL (production — Supabase)
* Node-cron for scheduled sync jobs

### Data Sources

| Source | Used For |
|---|---|
| CBF API | Brasileirão match data |
| football-data.org | Brasileirão & Libertadores matches + official standings |
| FIFA API | Copa 2026 matches, standings, and bracket data |
| CBF website scraper | Brasileirão broadcast channels |

### Deployment

* **Frontend:** Vercel (auto-deploy from `main`)
* **Backend:** VPS with auto-deploy on git push
* **Database:** Supabase PostgreSQL (production) / SQLite (local)

---

## 📦 Installation

### Prerequisites

* Node.js 18+
* npm

### Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/fut-tv.git
cd fut-tv

# Frontend
cd frontend && npm install

# Backend
cd ../backend && npm install
```

### Environment Variables

Create `backend/.env`:

```env
DATABASE_URL="file:./dev.db"
FOOTBALL_DATA_API_KEY="your_key_here"
```

### Development

```bash
# Frontend (port 5173)
cd frontend && npm run dev

# Backend (port 3001)
cd backend && npm run dev
```

---

## 🏗️ Build for Production

```bash
# Frontend
cd frontend && npx vite build

# Backend — runs as a standalone Node process
cd backend && node src/server.js
```

---

## 🔄 Data Sync

The backend runs scheduled cron jobs to keep data fresh:

| Job | Frequency | Description |
|---|---|---|
| `syncMatches` | Every 5 minutes | Fetches latest matches from all competition APIs |
| `syncStandings` | Every 15 minutes | Syncs standings from official API or computes from match data |
| `syncBroadcasts` | Daily | Scrapes CBF website for Brasileirão broadcast channels |

Manual sync can be triggered via:

```bash
cd backend && node src/cron/syncMatches.js
cd backend && node src/cron/syncStandings.js
```

After any Prisma schema change:

```bash
cd backend && npx prisma db push
```

---

## 📱 Progressive Web App

Fut-TV is a fully functional PWA — it can be installed on mobile devices and desktops for an app-like experience with offline support.

---

## 🎯 Roadmap

* [x] Home page with multi-competition support
* [x] Match details with live scores
* [x] Group and flat standings with zone colours
* [x] Team lineups with formation display
* [x] Broadcast information
* [x] Knockout stage bracket
* [x] Brasileirão support (CBF + football-data.org)
* [x] Libertadores support (football-data.org)
* [x] Copa 2026 support (FIFA)
* [x] PWA support
* [ ] Top scorers
* [ ] Team statistics and form guide
* [ ] Push notifications for live matches
* [ ] Match highlights / video links

---

## 🤝 Contributing

Contributions, suggestions, and feedback are welcome.

Feel free to open an issue or submit a pull request.

---

## 📄 License

This project is intended for educational and portfolio purposes.

Football data and related assets belong to their respective owners.

---

Built with ❤️ for football fans.
