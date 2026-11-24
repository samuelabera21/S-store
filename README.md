# 🌟 S-Store — Next-Generation Visual Discovery & Inspiration Platform

<div align="center">

[![Live Demo](https://img.shields.io/badge/Live_Demo-sstore--nu.vercel.app-E60023?style=for-the-badge&logo=vercel&logoColor=white)](https://sstore-nu.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js_15-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript_5-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma_ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Neon](https://img.shields.io/badge/Neon_Postgres-00E599?style=for-the-badge&logo=postgresql&logoColor=black)](https://neon.tech/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary_CDN-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com/)

**A full-featured visual discovery and curation platform engineered for modern desktop web performance, inspired by the best UX of Pinterest and branded as S-Store.**

[Explore Live Deployment ↗](https://sstore-nu.vercel.app/) · [Report Bug](https://github.com/samuelabera21/S-store/issues) · [Request Feature](https://github.com/samuelabera21/S-store/issues)

</div>

---

## 🚀 Key Features

### 📌 1. High-Performance Visual Feed
* **Responsive Masonry Grid**: Dynamic column layout supporting variable aspect ratio pins (standard, tall, square, wide).
* **Hover Micro-Interactions**: Instant inline "Save to Board" selector, quick link navigation, and share actions without navigating away.
* **Smart Infinite Scrolling**: Cursor-based pagination for fluid, lag-free browsing.

### 🖼️ 2. Comprehensive Pin Experience
* **Rich Pin Types**: Native support for **Images**, **HD Videos** (with inline player and autoplay controls), **Product Pins** (pricing, stock badges), and **Recipe Pins** (ingredients, cook times).
* **Visual Crop & Lens Search**: Interactive bounding-box selector allowing users to crop into any area of an image to find visually similar pins.
* **Community Engagement**:
  * Threaded, multi-level comment discussions.
  * Heart and emoji reactions with instant optimistic UI updates.
  * Community "Tried It" photo recreations and 5-star reviews.
  * Private "Note to Self" memos visible only to the pin saver.

### 📁 3. Boards, Sections & Real-Time Collaboration
* **Nested Board Organization**: Organize boards into custom sub-sections (e.g. `Home Decor ↳ Lighting`).
* **Multi-User Collaboration**: Invite collaborators with granular role-based permissions (`Viewer` vs `Editor`).
* **Secret & Archived Boards**: Toggle board privacy for personal curation or archive completed project boards.
* **Cover Customization**: Select custom hero cover images for each board.

### 💬 4. Messaging & In-App Notifications
* **Direct Messaging**: Chat with other creators and share pins directly inside conversation threads.
* **Activity Notifications**: Instant alerts when someone saves your pin, leaves a comment, follows your profile, or invites you to collaborate.

### 📊 5. Creator Studio & Analytics
* **Performance Metrics**: Track real-time pin impressions, outbound link clicks, and save counts.
* **Profile Customization**: Public showcase of saved pins, created content, follower/following counts, and verified creator badges.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | Next.js 15 (App Router), React 19, Tailwind CSS | Server-rendered and client-hydrated responsive components with Lucide icons. |
| **Backend** | Next.js Route Handlers (Edge & Node.js) | Full RESTful API (`/api/v1/...`) with timing-safe NIST Scrypt password hashing. |
| **Database** | Neon Serverless PostgreSQL | Auto-scaling cloud Postgres with connection pooling. |
| **ORM** | Prisma ORM | Strictly typed database models, automated migrations, and relation querying. |
| **Media Storage** | Cloudinary Global CDN | Auto-compressed WebP/AVIF delivery, high-resolution photo uploads, and video streaming. |
| **Hosting** | Vercel | Global edge CDN, automated GitHub deployments, and sub-50ms API latencies. |

---

## 💻 Local Development Setup

### Prerequisites
* Node.js 18+ or Node.js 20+
* Docker (optional, for local Postgres) or a Neon PostgreSQL connection string

### 1. Clone Repository
```bash
git clone https://github.com/samuelabera21/S-store.git
cd S-store
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
# Database (Neon Serverless PostgreSQL or local Docker)
DATABASE_URL="postgresql://username:password@your-neon-host/neondb?sslmode=require"

# Cloudinary Object Storage
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Application Security
SESSION_SECRET="your_32_character_random_session_secret"
NODE_ENV="development"
PORT=3000
```

### 4. Initialize Database
```bash
# Push Prisma schema to your database
npx prisma db push

# (Optional) Seed initial creators, boards, and pins
npm run prisma:seed
```

### 5. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Integration Testing & Verification

The project includes an end-to-end integration test suite covering 37 critical flows (auth, pin saves, comments, reactions, collaborator permissions, notifications, search, video pins, and analytics):

```bash
node scripts/test-api.mjs
```

---

## 🚢 Production Deployment

The project is pre-configured for **zero-configuration continuous deployment** on [Vercel](https://vercel.com):

1. Push your changes to the `main` branch on GitHub.
2. Link your GitHub repository in your Vercel Dashboard.
3. Configure the 5 environment variables (`DATABASE_URL`, `CLOUDINARY_*`, `SESSION_SECRET`).
4. Vercel automatically runs `prisma generate && next build` and deploys your updates live!

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
