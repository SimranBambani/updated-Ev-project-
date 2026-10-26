# VoltFlow - Smart EV Charging Management System

> **Startup-Grade Frontend Architecture** for next-generation Electric Vehicle (EV) charging infrastructure, real-time slot allocation, queue waiting time estimations, and fleet management.

---

## Executive Overview

VoltFlow is a production-quality frontend application built with **React (Vite)** and **Tailwind CSS**. Designed to match the visual standards of Tesla, ChargePoint, EVgo, Stripe Dashboard, and Linear, VoltFlow provides role-tailored management consoles for:

1. **Admin**: Network-wide analytics, customer CRUD, station manager assignments, charging station deployment, and daily/weekly/monthly revenue reports.
2. **Station Manager**: On-site station console, charging slots CRUD, battery inventory management, slot allocation/dispatch, live charging progress monitoring, and overstay alerts.
3. **Customer (EV Owner)**: Spatial station locator map, Haversine distance calculator, queue waiting time estimator, vehicle garage CRUD, slot reservation, active charging progress tracking, notifications, and history statements.

---

## Tech Stack & Design System

- **Core Framework**: React 18 (Vite)
- **Routing**: React Router DOM v6 (JWT-Ready Protected & Role-Based Guard Routes)
- **Styling**: Vanilla Tailwind CSS v3
  - **Primary**: `#2563EB` (Electric Royal Blue)
  - **Background**: `#F8FAFC` (Clean Modern Slate)
  - **Typography**: Plus Jakarta Sans / Inter Google Fonts
- **State Management**: React Context API (`AuthContext`, `AdminContext`, `ManagerContext`, `CustomerContext`, `NotificationContext`, `MapContext`)
- **Form Management**: React Hook Form with strict regex pattern validation
- **HTTP Layer**: Axios instance with request/response authorization interceptors
- **Iconography**: React Icons (`fi` Feather icons)
- **Notifications**: React Toastify & Custom Dropdown Badge
- **Micro-Animations**: Framer Motion & CSS keyframes

---

## Project Structure

```
d:\sem-5\EV_Project\src/
├── assets/                  # Graphics and branding assets
├── components/
│   ├── common/              # Pure reusable UI components
│   │   ├── badge/           # StatusBadge, Badge
│   │   ├── buttons/         # Button (Primary, Outline, Danger, Loading)
│   │   ├── cards/           # Card, StatsCard
│   │   ├── forms/           # Input, Select, Textarea, SearchBar
│   │   ├── layout/          # Navbar, Sidebar, Footer, PageHeader, Breadcrumb
│   │   ├── loading/         # Loader, Skeleton, EmptyState
│   │   ├── modal/           # Modal, ConfirmationModal
│   │   ├── notifications/   # NotificationBell & Dropdown
│   │   └── tables/          # DataTable & Pagination
│   ├── map/                 # Isolated Map Architecture
│   │   ├── MapContainer.jsx
│   │   ├── StationMarker.jsx
│   │   ├── UserLocationMarker.jsx
│   │   ├── RoutePolyline.jsx
│   │   └── MapLegend.jsx
│   └── layouts/             # Role-based shell layouts
│       ├── AdminLayout/
│       ├── AuthLayout/
│       ├── CustomerLayout/
│       └── ManagerLayout/
├── context/                 # State management Context API providers
├── hooks/                   # Custom hooks (useAuth, useNotification, useMap, useCalculations)
├── mock/                    # Parity mock dataset (Users, Stations, Vehicles, Bookings, Sessions)
├── pages/                   # Screen views grouped by role module
│   ├── admin/               # Dashboard, Customers, Managers, Stations, Reports
│   ├── auth/                # Login, Signup, ForgotPassword, ResetPassword
│   ├── customer/            # Dashboard, Vehicles, Bookings, Notifications, History
│   ├── manager/             # Dashboard, Slots, Battery, Allocation, Monitoring, Notifications
│   └── shared/              # Profile, NotFound (404), Unauthorized (401)
├── routes/                  # AppRoutes, ProtectedRoute, RoleBasedRoute
├── services/                # Axios API services (authService, stationService, etc.)
├── styles/                  # index.css design tokens and custom scrollbars
├── utils/                   # Calculations, Distance, Location, Validators, Helpers, Constants
├── App.jsx
└── main.jsx
```

---

## Quick Setup & Execution

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Access the application locally at: `http://localhost:3000`

### 3. Build for Production
```bash
npm run build
```
Creates an optimized production bundle in the `./dist` directory with Rollup chunk splitting.

---

## Backend Test Data

From the `backend` directory, run `npm run db:seed` to replace the database contents with a minimal test setup: one active customer and vehicle, one active station with two available slots, and admin/manager accounts. No bookings are seeded, so the customer can test making a reservation.

**Warning:** Seeding deletes all existing records in the configured database before adding test data. Use only with a disposable/test database; do not run against production or data you need to keep.

The login page (`/login`) includes a role preset switcher. After seeding, the test accounts are:

| Role | Email | Password | Target Route |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@evcharge.com` | `adminpass123` | `/admin` |
| **Station Manager** | `john.manager@evcharge.com` | `managerpass123` | `/manager` |
| **Customer** | `alice@customer.com` | `customerpass123` | `/customer` |

---

## Core Algorithms & Calculations

### 1. EV Charging Time Calculation
$$\text{remainingBattery} = 100 - \text{currentCharge}$$
$$\text{energyNeeded (kWh)} = \frac{\text{batteryCapacity} \times \text{remainingBattery}}{100}$$
$$\text{chargingTime (Hours)} = \frac{\text{energyNeeded}}{\text{chargingSpeed}}$$

*Located in `src/utils/calculations.js`.*

### 2. Queue Waiting Time Estimation
Calculates estimated queue wait based on available slots count, active charging vehicles, waiting queue, and average session duration ($40\text{ mins}$).

### 3. Haversine Spatial Distance Formula
Calculates precise distance in kilometers between user's GPS coordinates and station coordinates ($\text{lat}_1, \text{lng}_1 \rightarrow \text{lat}_2, \text{lng}_2$).

---

## Future Backend & Map Integration Guide

### Backend Connection (Node.js / Express / MongoDB)
1. Create a `.env` file in the root directory:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
2. The Axios instance in `src/services/api.js` automatically attaches JWT tokens from `localStorage` on every request.
3. Replace the mock delay promises in `src/services/*Service.js` with actual Axios calls (e.g. `await api.get('/stations')`).

### Map SDK Connection (Google Maps / Mapbox / Leaflet)
All map components are isolated inside `src/components/map/`.
To integrate Google Maps or Mapbox, simply update `MapContainer.jsx` to render `<GoogleMap>` or `<Map>` using the props passed from `MapContext.jsx`. Page components require zero changes.

---

## License

Developed for Smart EV Charging Infrastructure Project.
