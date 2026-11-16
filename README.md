# ALTIER — Luxury E-Commerce Platform

A modern, full-stack luxury fashion and e-commerce platform built with **Node.js, Express, MongoDB, and React (Vite)**. Features a customer storefront with rich order management, wallet system, and Razorpay payment integration, alongside an admin dashboard with sales analytics, product management, and automated returns/refunds.

---

## Table of Contents

- [Features](#features)
  - [Customer Storefront](#customer-storefront)
  - [Admin Dashboard](#admin-dashboard)
- [Tech Stack](#tech-stack)
- [Project Architecture](#project-architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Clone the Repository](#clone-the-repository)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [Scripts & Commands](#scripts--commands)
- [API Endpoints Overview](#api-endpoints-overview)
- [Branching & Contributing](#branching--contributing)

---

## Features

### Customer Storefront
* **Authentication & Authorization**:
  * Email & password registration with email OTP verification (Nodemailer).
  * Google OAuth 2.0 single sign-on (`@react-oauth/google`).
  * JWT authentication with HTTP-only cookie session handling.
  * Secure password reset with expiring tokens sent via email.
* **Product Catalog & Discovery**:
  * Category-based navigation, search, and multi-parameter filtering (price, category, sort).
  * Dynamic product variant selection (sizes, colors, stock limits).
  * High-resolution image galleries with Cloudinary CDN integration.
* **Cart & Wishlist**:
  * Real-time stock reservation and quantity validation.
  * Wishlist toggle and instant move-to-cart functionality.
* **Checkout & Payments**:
  * Multi-address book (add, edit, delete, set default).
  * Multiple payment options:
    * **Razorpay** (UPI, credit/debit cards, net banking).
    * **Wallet** (instant checkout using stored store credits).
    * **Cash on Delivery (COD)** (with configurable cart value rules).
  * Coupon validation engine with minimum purchase and usage limits.
* **Orders & Invoices**:
  * Real-time order tracking and item status timeline.
  * PDF invoice generation and download for completed orders (powered by PDFKit).
  * Order cancellation and individual item return workflow with automatic wallet refunds upon approval.
* **User Profile & Account Security**:
  * Inline username/display name update with real-time UI propagation.
  * Email change with two-step OTP verification.
  * Password update with validation.
  * Dedicated wallet dashboard displaying balance and credit/debit transaction history.

### Admin Dashboard
* **Analytics & Sales Reports**:
  * Metrics for total revenue, gross sales, net sales, discounts, returns, and refunds.
  * Filter reports by daily, weekly, monthly, or custom date ranges.
  * Export sales reports to **PDF** and **Excel (.xlsx)**.
* **Product & Inventory Management**:
  * Full CRUD for products and variants (size, stock, pricing, SKU).
  * Multi-image upload to Cloudinary with drag-and-drop ordering.
  * Duplicate variant validation.
* **Category & Offer Management**:
  * Category listing, unlisting, and soft deletes.
  * Category-wide and product-specific percentage discount offers.
* **Order & Return Processing**:
  * Order status workflow management (`Pending` -> `Confirmed` -> `Shipped` -> `Delivered` -> `Cancelled`).
  * Review, approve, or reject individual item return requests.
  * Automated refund processing directly credited to customer wallets upon return approval.
* **Coupon Engine**:
  * Create, edit, and deactivate promotional coupons.
  * Configurable expiry dates, discount percentages/amounts, and minimum cart values.
* **Customer Management**:
  * User listing with search and status toggles (active / blocked).

---

## Tech Stack

### Frontend
* **Core**: React 19, Vite 8, React Router v7
* **State & Networking**: React Context API (`AuthContext`), Axios with interceptors
* **Authentication**: `@react-oauth/google`
* **Icons & Styling**: `lucide-react`, `react-icons`, Custom CSS with responsive layouts

### Backend
* **Runtime & Framework**: Node.js, Express 5
* **Database & ODM**: MongoDB, Mongoose 9
* **Authentication**: JSON Web Tokens (`jsonwebtoken`), `bcrypt` password hashing
* **Payment Integration**: Razorpay Node SDK
* **File & Media Storage**: Cloudinary, Multer
* **Email & Notifications**: Nodemailer (Gmail SMTP)
* **Document Generation**: PDFKit (invoices & reports), ExcelJS (sales reports)
* **Validation & Security**: `express-validator`, `cors`, `cookie-parser`, `express-rate-limit`

---

## Project Architecture

```text
ECOMM PROJECT/
├── Backend/
│   ├── src/
│   │   ├── config/         # MongoDB, Cloudinary, Razorpay configurations
│   │   ├── constants/      # Status codes, order states, error constants
│   │   ├── controllers/    # Request handlers (auth, admin, shop, order)
│   │   ├── middlewares/    # Auth guards, role checks, validation, error handler
│   │   ├── models/         # Mongoose schemas (User, Product, Order, Wallet, Coupon)
│   │   ├── routes/         # Express API route declarations
│   │   ├── services/       # Core business logic & database transactions
│   │   ├── utils/          # Helpers (token generation, email sender, pdf generator)
│   │   └── validators/     # Express-validator schema rules
│   ├── .env.example        # Backend environment variables template
│   ├── package.json
│   └── server.js           # Express app bootstrap & port binding
│
├── frontend/
│   ├── src/
│   │   ├── api/            # Axios API wrappers (auth, product, cart, order, admin)
│   │   ├── components/     # Reusable UI components (Navbar, Footer, Modals, Tables)
│   │   ├── context/        # React Context providers (AuthContext)
│   │   ├── pages/          # Storefront and Admin views
│   │   │   ├── admin/      # Admin dashboard, products, orders, sales reports
│   │   │   └── storefront/ # Home, shop, cart, checkout, profile, order history
│   │   ├── styles/         # Scoped component and layout stylesheets
│   │   ├── App.jsx         # App router configuration
│   │   └── main.jsx        # React root mounting
│   ├── .env.example        # Frontend environment variables template
│   ├── package.json
│   └── vite.config.js
│
├── .env.example            # Monorepo unified environment template
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites
Make sure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) (v18.x or v20.x recommended)
* [npm](https://www.npmjs.com/) (v9.x or higher)
* [MongoDB](https://www.mongodb.com/) (running locally or a MongoDB Atlas URI)

---

### Clone the Repository

```bash
git clone https://github.com/AdwAiTh-dev-123/ALTIER-ECOMM.git
cd "ECOMM PROJECT"
```

---

### Backend Setup

1. **Navigate to the Backend directory**:
   ```bash
   cd Backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   Open `Backend/.env` and supply your database connection string, JWT secret, Cloudinary credentials, Razorpay keys, and email configuration.

4. **Start the backend development server**:
   ```bash
   npm run dev
   ```
   The backend server will run on `http://localhost:5000`.

---

### Frontend Setup

1. **Open a new terminal and navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   Update `VITE_GOOGLE_CLIENT_ID` with your Google Cloud Console Client ID.

4. **Start the frontend development server**:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

---

## Environment Variables

### Backend (`Backend/.env`)
| Variable | Description | Example / Default |
|---|---|---|
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Environment mode | `development` / `production` |
| `FRONTEND_URL` | Frontend URL for CORS & password reset links | `http://localhost:5173` |
| `MONGO_URI` | MongoDB connection URI | `mongodb://127.0.0.1:27017/altier_ecomm` |
| `JWT_SECRET` | Secret key for signing JWT auth tokens | `minimum_32_characters_secret` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `*.apps.googleusercontent.com` |
| `EMAIL_USER` | Gmail address for sending OTPs | `youremail@gmail.com` |
| `EMAIL_PASS` | Google 16-character App Password | `xxxx xxxx xxxx xxxx` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account cloud name | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | `your_api_key` |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | `your_api_secret` |
| `RAZORPAY_KEY_ID` | Razorpay Key ID | `rzp_test_xxxxxx` |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret | `your_razorpay_secret` |

### Frontend (`frontend/.env`)
| Variable | Description | Example / Default |
|---|---|---|
| `VITE_API_BASE_URL` | Base endpoint for the backend API | `http://localhost:5000/api` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID | `*.apps.googleusercontent.com` |

---

## Scripts & Commands

### Backend (`/Backend`)
```bash
npm run dev    # Start the server with Nodemon (auto-reload)
npm start      # Start the server in production mode
npm test       # Run test suites with Jest
```

### Frontend (`/frontend`)
```bash
npm run dev      # Start Vite development server
npm run build    # Compile production bundle to /dist
npm run lint     # Run ESLint checks
npm run preview  # Locally preview the production build
```

---

## API Endpoints Overview

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Register a new user | Public |
| `POST` | `/api/v1/auth/login` | Authenticate user & issue JWT | Public |
| `POST` | `/api/v1/auth/google` | Google OAuth authentication | Public |
| `POST` | `/api/v1/auth/logout` | Clear auth cookies | Authenticated |
| `PATCH`| `/api/v1/auth/profile` | Update user username/name | Authenticated |
| `GET`  | `/api/v1/products` | Browse & search product catalog | Public |
| `GET`  | `/api/v1/cart` | Retrieve current user's cart | Authenticated |
| `POST` | `/api/v1/orders` | Place a new order | Authenticated |
| `GET`  | `/api/v1/orders/:id/invoice` | Download order invoice PDF | Authenticated |
| `GET`  | `/api/v1/admin/sales-report` | Generate sales analytics & summary | Admin |
| `GET`  | `/api/v1/admin/sales-report/download` | Export sales report (PDF/Excel) | Admin |

---

## Branching & Contributing

* `main` — Production-ready code.
* `develop` — Main development and integration branch.
* `feat/<feature-name>` — Feature branches created off `develop`.
* `fix/<bug-name>` — Bugfix branches created off `develop`.

---

## License

This project is licensed under the [ISC License](LICENSE).
