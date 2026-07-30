# 🌊 The Lighthouse | Full-Stack Fine Dining Restaurant App

<div align="center">

A premium **MERN stack** restaurant web application solving a real problem in modern food apps — the **"Black Box Menu" problem**.

Built with MongoDB, Express, React (Vite), and Node.js. Features a live menu availability engine, persistent dietary profiles, a smart reservation wizard with in-booking menu preview, and an admin dashboard — all wrapped in an elegant dark luxury UI.

🏆 Officially part of **GirlScript Summer of Code 2026 (GSSoC'26)**

[![Stars](https://img.shields.io/github/stars/anushkasark08/The-Lighthouse?style=social)](https://github.com/anushkasark08/The-Lighthouse/stargazers)
&nbsp;&nbsp;
[![Forks](https://img.shields.io/github/forks/anushkasark08/The-Lighthouse?style=social)](https://github.com/anushkasark08/The-Lighthouse/network/members)

</div>

---

## 📑 Table of Contents

- [🎯 The Problem We Solve](#-the-problem-we-solve)
- [✨ Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [📐 System Architecture](#-system-architecture)
- [📂 Project Structure](#-project-structure)
- [🚀 Getting Started](#-getting-started)
- [🔑 API Reference](#-api-reference)
- [🎨 Customization](#-customization)
- [🤝 Contributing](#-contributing)
- [📜 License](#-license)
- [💖 Acknowledgements](#-acknowledgements)

---

## 🎯 The Problem We Solve

Most restaurant websites and food apps share the same flaw — the **"Black Box Menu" problem**:

> Guests book a table with **zero context about what's actually available that day**. They see static dish names but have no idea which items are sold out, seasonal, or unavailable — until they arrive.

**This leads to:**
- No-shows when guests find their expected dish unavailable
- Restaurants unable to update menus dynamically without code changes
- Diners with dietary needs having to call ahead with basic questions
- Zero personalization — everyone sees the same menu regardless of context

### 💡 The Lighthouse's Solution

| Problem | Solution |
|---------|----------|
| Static menus | **Live Menu Engine** — `isAvailable` flag per dish, toggled by admin in real-time |
| Dietary filter resets | **Dietary Profile** — saved to user account, auto-applies on every visit |
| No pre-booking menu insight | **Reservation Menu Preview** — Step 3 of the booking wizard shows tonight's available dishes |
| Requires dev to update menu | **Admin Dashboard** — toggle dishes, add items, moderate reviews — no code needed |

---

## ✨ Features

### 🗄️ Live Menu Engine
- All 18+ dishes stored in MongoDB with a live `isAvailable` boolean
- Admins toggle availability from the dashboard — changes reflect instantly for all users
- Public menu only shows available dishes; admins see all with sold-out indicators
- `GET /api/menu/tonight` returns dishes relevant to the current time of day

### 🥗 Persistent Dietary Profiles
- Users set their dietary preference (`Vegetarian` / `Non-Vegetarian` / `All`) on signup
- Allergen alerts stored per user (gluten, dairy, nuts, eggs, soy, shellfish, fish)
- Menu auto-filters on every visit based on the saved profile — no re-selecting needed
- Profile updatable anytime via `PATCH /api/auth/me/dietary`

### 📅 Smart Reservation Wizard (4 steps)
1. **Date & Guests** — pick date, validate against real table availability
2. **Time Slot** — live slots from API showing tables remaining per slot
3. **Tonight's Menu Preview** — see exactly what's available before confirming ← *the differentiator*
4. **Confirm** — special requests, email confirmation

### 🎨 Premium UI & Design
- Elegant dark luxury theme (`#1a1714` bg, `#c9a962` gold accents)
- Fonts: **Cormorant Garamond** (headings) + **Inter** (body)
- Glassmorphism sticky navbar, parallax hero, scroll animations
- Fully responsive — mobile hamburger menu, fluid grid layouts

### 🔐 Authentication & Roles
- JWT-based auth with `protect` and `authorize` middleware
- Three roles: `user`, `staff`, `admin`
- Admin-only routes for menu management and review moderation
- Tokens stored securely with auto-redirect on expiry

### 🛡️ Admin Dashboard
- Live stats — total dishes, available now, sold out, reviews count
- Toggle any dish available/sold-out with a single switch
- Add new menu items with full schema (category, tags, allergens, prep time)
- Moderate guest reviews — view and delete

### ⭐ Persistent Reviews
- Reviews stored in MongoDB (replaces the original localStorage approach)
- Authenticated users only can post reviews
- Displayed on the Home page, fetched live from API

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime |
| **Express.js** | REST API framework |
| **MongoDB** | Database |
| **Mongoose** | ODM — schemas, validation, indexes |
| **JSON Web Token** | Authentication |
| **bcryptjs** | Password hashing |
| **Nodemailer** | Reservation confirmation emails |
| **Helmet + CORS** | Security middleware |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 19** | UI framework |
| **Vite** | Build tool & dev server |
| **React Router v7** | Client-side routing |
| **Axios** | HTTP client with JWT interceptor |
| **React Context** | Auth + Menu global state |
| **Vanilla CSS** | Design system (CSS variables) |

---

## 📐 System Architecture

The Lighthouse is built on a decoupled MERN architecture comprising a React 19 SPA ([/frontend](./frontend)), an Express REST API ([/backend](./backend)), and a legacy static client at the root.

Key architectural features include:
- **Live Menu Availability Engine:** Real-time dish availability toggling and dynamic time-of-day menu filtering.
- **Double-Booking Protection:** Database-level Mongoose partial unique index on `{ table: 1, date: 1, time: 1 }` for confirmed reservations.
- **Security & Validation:** JWT authentication, sliding-window rate limiting, and real-time DNS MX email domain verification.

> 📖 For complete subsystem topology diagrams, sequence flows, database schema constraints, and contributor extension guidelines, see the full [Architecture Documentation](./Architecture.md).

---

## 📂 Project Structure

```
The-Lighthouse/
│
├── backend/                          ← Express + MongoDB API
│   ├── .env.example                  ← Copy to .env and fill in values
│   ├── .gitignore
│   ├── package.json
│   ├── server.js                     ← App entry, routes, CORS
│   └── src/
│       ├── config/
│       │   ├── database.js           ← MongoDB connection
│       │   └── seed.js               ← Seeds 18 menu items, tables, users
│       ├── controllers/
│       │   ├── authController.js     ← Register, login, dietary profile
│       │   ├── menuController.js     ← CRUD + live toggle + tonight's menu
│       │   ├── reservationController.js
│       │   └── reviewController.js
│       ├── middleware/
│       │   ├── auth.js               ← JWT protect + authorize(role)
│       │   └── validation.js
│       ├── models/
│       │   ├── MenuItem.js           ← Live menu (isAvailable flag)
│       │   ├── Reservation.js
│       │   ├── Review.js             ← Persistent reviews
│       │   ├── Table.js
│       │   └── User.js               ← + dietaryPreference, allergenAlerts
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── menuRoutes.js
│       │   ├── reservationRoutes.js
│       │   └── reviewRoutes.js
│       └── services/
│           ├── availabilityService.js
│           └── emailService.js
│
├── frontend/                         ← React + Vite SPA
│   ├── .gitignore
│   ├── index.html
│   ├── vite.config.js                ← Dev proxy → localhost:5000
│   ├── package.json
│   └── src/
│       ├── api/
│       │   ├── client.js             ← Axios + JWT interceptor
│       │   ├── authApi.js
│       │   ├── menuApi.js
│       │   ├── reservationApi.js
│       │   └── reviewApi.js
│       ├── context/
│       │   ├── AuthContext.jsx       ← JWT + user + dietary state
│       │   └── MenuContext.jsx       ← Live menu state
│       ├── components/
│       │   ├── Navbar.jsx            ← Glassmorphism sticky nav
│       │   ├── Navbar.css
│       │   ├── Footer.jsx
│       │   ├── MenuCard.jsx          ← Live availability badge + admin toggle
│       │   └── ProtectedRoute.jsx    ← Role-gated route wrapper
│       ├── pages/
│       │   ├── Home.jsx              ← Hero, problem/solution, live specials
│       │   ├── Menu.jsx              ← Live menu with dietary filter
│       │   ├── Reserve.jsx           ← 4-step wizard with menu preview
│       │   ├── Auth.jsx              ← Login / Signup + dietary setup
│       │   └── AdminDashboard.jsx    ← Stats, toggle, add dish, reviews
│       ├── index.css                 ← Full design system (CSS variables)
│       ├── App.jsx                   ← Router + context providers
│       └── main.jsx
│
├── images/                           ← Shared food/restaurant images
├── .gitignore                        ← Root-level gitignore
├── Readme.md
└── (legacy static files — index.html, script.js, style.css)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **MongoDB** running locally — [Install MongoDB Community](https://www.mongodb.com/try/download/community)
  - Or use a free [MongoDB Atlas](https://www.mongodb.com/atlas) cloud instance

---

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/anushkasark08/The-Lighthouse.git
cd The-Lighthouse
```

---

### 2️⃣ Set Up the Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/lighthouse
JWT_SECRET=your-super-secret-key
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
```

Install dependencies and seed the database:

```bash
npm install
npm run seed     # Seeds 18 menu items, 9 tables, 2 users
npm run dev      # Starts API on http://localhost:5000
```

✅ Verify: `http://localhost:5000/api/health`

---

### 3️⃣ Set Up the Frontend

```bash
# In a new terminal
cd frontend
npm install
npm run dev      # Starts React app on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

### 4️⃣ Default Accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| 🔑 Admin | admin@thelighthouse.com | Admin@123 |
| 👤 User | test@example.com | password123 |

---

### 5️⃣ Key Flows to Try

**Guest**
1. Browse `/menu` → see live availability badges on each dish
2. Go to `/reserve` → complete the 4-step wizard → **see Step 3: Tonight's Menu**

**New User**
1. Sign up at `/auth` → set your **dietary preference** during signup
2. Visit `/menu` → your filter is pre-applied automatically

**Admin**
1. Log in → navigate to `/admin`
2. Toggle any dish to "Sold Out" → switch back to `/menu` → it's gone instantly
3. Add a new menu item from the dashboard form

---

## 🔑 API Reference

### Auth — `/api/auth`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/register` | Public | Register with dietary profile |
| POST | `/login` | Public | Login, returns JWT |
| GET | `/me` | Private | Get current user |
| PATCH | `/me/dietary` | Private | Update dietary preference |

### Menu — `/api/menu`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Public | All available items (`?category=` `?isVeg=` `?tag=`) |
| GET | `/tonight` | Public | Tonight's dishes based on time of day |
| GET | `/:id` | Public | Single item |
| POST | `/` | Admin | Create item |
| PUT | `/:id` | Admin | Update item |
| PATCH | `/:id/toggle` | Admin | **Toggle isAvailable** ← live differentiator |
| DELETE | `/:id` | Admin | Delete item |

### Reservations — `/api/reservations`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/slots` | Public | Available time slots for a date + guest count |
| POST | `/` | Private | Create reservation |
| GET | `/` | Private | Get user's reservations |
| DELETE | `/:id` | Private | Cancel reservation |

### Reviews — `/api/reviews`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Public | All reviews |
| POST | `/` | Private | Submit a review |
| DELETE | `/:id` | Private/Admin | Delete review |

---

## 🎨 Customization

The design system uses **CSS variables** in `frontend/src/index.css`. Change the theme in one place:

```css
:root {
  --color-primary:  #c9a962;   /* Gold accent */
  --color-bg:       #1a1714;   /* Dark background */
  --color-text:     #f5f2ed;   /* Off-white text */
  --font-serif:     'Cormorant Garamond', Georgia, serif;
  --font-sans:      'Inter', system-ui, sans-serif;
}
```

---

## 🌟 Future Improvements

- [ ] Payment gateway integration (Razorpay / Stripe)
- [ ] Online food ordering with cart
- [ ] Real-time slot updates with Socket.io
- [ ] Multi-language support (i18n)
- [ ] Push notifications for reservation reminders
- [ ] PWA support

---

## 🤝 Contributing

Contributions are welcome and appreciated!

### Steps to Contribute

1. Fork the repository

2. Create a feature branch
```bash
git checkout -b feature/your-feature-name
```

3. Commit your changes
```bash
git commit -m "feat: add your feature description"
```

4. Push the branch
```bash
git push origin feature/your-feature-name
```

5. Open a Pull Request

---

## 💖 Contributors

Thanks to all the amazing people who contribute to **The Lighthouse** 🚀

<p align="center">
  <a href="https://github.com/anushkasark08/The-Lighthouse/graphs/contributors">
    <img src="https://contrib.rocks/image?repo=anushkasark08/The-Lighthouse" alt="Contributors"/>
  </a>
</p>

---

## 📜 License

This project is licensed under the **MIT License**.

---

## 💖 Acknowledgements

Developed with passion by **Anushka Sarkar**

Special thanks to:
- GirlScript Summer of Code 2026
- Open-source contributors ❤️

---

## 🔗 Repository

GitHub Repository:
https://github.com/anushkasark08/The-Lighthouse
