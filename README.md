# DropshipHub - Dropshipping Dashboard

A full-stack application for managing your dropshipping business via CJDropShipping. Import products, manage orders, and monitor market trends - all from one dashboard.

## Features

- ✅ **Secure Authentication** - JWT-based login system
- ✅ **CJDropShipping Integration** - Import products directly from CJ catalog
- ✅ **Product Management** - Apply markup, manage inventory, edit products
- ✅ **Order Management** - Create orders, track status, sync with CJ
- ✅ **Market Trends** - Monitor trending products from Google, Shopee, Lazada
- ✅ **Responsive Web App** - Full-featured dashboard
- ✅ **Mobile App** - React Native app for on-the-go management

## Tech Stack

| Component | Technology |
|-----------|------------|
| Database | PostgreSQL (Neon.tech) |
| Backend | Node.js + Express |
| Auth | JWT + bcrypt |
| Web App | React + Vite |
| Mobile | React Native (Expo) |
| API | CJDropShipping API |

---

## Quick Start Guide

### Prerequisites

- Node.js 18+
- Git
- GitHub account
- Neon.tech account (free PostgreSQL)
- Railway.app account (free backend hosting)
- Vercel account (free frontend hosting)
- CJDropShipping account with API key

---

## Step 1: Database Setup (Neon)

1. Go to [neon.tech](https://neon.tech)
2. Sign up with GitHub
3. Create project:
   - Name: `dropship-dashboard`
   - Region: `Asia (Singapore)`
4. Copy connection string (format: `postgres://user:pass@host.neon.tech/db?sslmode=require`)

---

## Step 2: Backend Setup

### Option A: Deploy to Railway (Recommended)

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Create new project → Empty Project
4. Name: `dropship-backend`
5. Go to **Variables** tab
6. Add these variables:
   - `DATABASE_URL` = your Neon connection string
   - `JWT_SECRET` = generate a random string (run: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)
   - `FRONTEND_URL` = your Vercel URL (later)
7. Connect your GitHub repo and deploy

### Option B: Run Locally

```bash
cd backend
cp .env.example .env
# Edit .env with your values

npm install
npm run dev
```

---

## Step 3: Frontend Setup

### Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Import your GitHub repository
4. Add environment variable:
   - `VITE_API_URL` = your Railway backend URL (e.g., `https://dropship-backend.up.railway.app/api`)
5. Deploy

### Run Locally

```bash
cd web
npm install
npm run dev
```

---

## Step 4: Mobile App

### Setup

```bash
cd mobile
npm install
npx expo start
```

### Build for iOS/Android

```bash
npx expo build:ios
npx expo build:android
```

---

## Environment Variables

### Backend (.env)

```env
DATABASE_URL=postgres://user:pass@host.neon.tech/db?sslmode=require
JWT_SECRET=your-random-secret-key
FRONTEND_URL=http://localhost:5173
PORT=3000
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000/api
```

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### CJDropShipping
- `POST /api/cj/connect` - Connect CJ account
- `GET /api/cj/products` - List CJ products
- `POST /api/cj/import` - Import product
- `GET /api/cj/balance` - Get CJ balance

### Products
- `GET /api/products` - List products
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/products/apply-markup` - Apply markup to all

### Orders
- `GET /api/orders` - List orders
- `POST /api/orders/create` - Create order
- `POST /api/orders/sync` - Sync orders from CJ

### Trends
- `GET /api/trends/google` - Google Trends
- `GET /api/trends/shopee` - Shopee trends
- `GET /api/trends/lazada` - Lazada trends
- `GET /api/trends/all` - All trends

---

## Connecting CJDropShipping

1. Log in to [cjdropshipping.com](https://cjdropshipping.com)
2. Go to **Developer** → **API**
3. Click **Generate API Key**
4. Copy the API key
5. Go to **Settings** in your dashboard
6. Paste the API key and click Connect

---

## Project Structure

```
dropship-dashboard/
├── backend/              # Node.js API
│   ├── src/
│   │   ├── config/      # Database config
│   │   ├── middleware/  # Auth middleware
│   │   ├── routes/      # API routes
│   │   ├── services/    # CJ API integration
│   │   └── index.js     # Server entry
│   └── package.json
│
├── web/                 # React web app
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── context/     # Auth context
│   │   └── services/    # API service
│   └── package.json
│
└── mobile/              # React Native app
    ├── src/
    │   ├── screens/     # App screens
    │   └── services/    # API service
    └── package.json
```

---

## License

MIT
