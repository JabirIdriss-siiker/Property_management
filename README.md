# Apios Property Manager

Apios Property Manager is a comprehensive concierge and laundry management solution designed for short-term rental properties. It automates the synchronization of reservations via iCal feeds, handles cleaning mission scheduling, and manages inventory through a robust laundry bag system.

## 🚀 Key Features

- **Automated iCal Sync**: Synchronize reservations from platforms like Airbnb and Booking.com.
- **Auto-Mission Creation**: Cleaning missions are automatically scheduled based on reservation check-out dates.
- **Laundry Bag Management**: Each apartment is linked to a specific bag for linen and consumables, ensuring accurate tracking of preparation and usage.
- **Stock Inventory**: Real-time management of consumable items (nespresso pods, soap, etc.) and linens, including alert thresholds for restocking.
- **Role-Based Access Control (RBAC)**:
  - **Admins**: Full control over dashboards, property data, inventory, and agent assignments.
  - **Agents**: Access to a simplified "Agent View" showing only their assigned missions and planning.
- **Daily Dashboard**: Quick overview of missions today, bags to prepare, and inventory alerts.

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Lucide React (Icons)
- **State Management**: Custom React Hooks & Context API
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **iCal Processing**: Custom parser logic optimized for Deno (Edge Functions)

## 📁 Project Structure

```text
conciergerie/
├── src/
│   ├── components/       # Reusable UI, Layout, and Feature components
│   ├── contexts/         # Authentication and Global state
│   ├── docs/             # Database schema and documentation
│   ├── hooks/            # useAppState (core logic) and others
│   ├── lib/              # Utility functions and Supabase client
│   ├── pages/            # Main application pages (Dashboard, Stock, etc.)
│   ├── services/         # API abstraction layer for Supabase
│   └── types/            # TypeScript interfaces and DB definitions
├── supabase/
│   └── functions/        # Edge Functions (e.g., sync-ical)
└── README.md
```

## 🏗️ Getting Started

### Prerequisites

- Node.js (v18+)
- A Supabase project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## 🗄️ Database Schema

The database is built on PostgreSQL via Supabase. Key tables include:

- `apartments`: Stores property details and iCal links.
- `bags`: Managed via a 1:1 relationship with apartments to track laundry status.
- `missions`: Automated cleaning schedules linked to reservations.
- `stock_items`: Inventory management for linens and consumables.
- `profiles`: User management with role definitions (`admin` vs `agent`).

> [!NOTE]
> The full database schema can be found in `src/docs/database-schema.sql`.

## ⚡ Edge Functions

The `sync-ical` Edge Function is the heart of the automation. It:
1. Fetches active iCal links.
2. Parses reservations.
3. Performs bulk upserts to the `reservations` table.
4. Automatically generates cleaning missions for each new checkout.

To deploy the function:
```bash
supabase functions deploy sync-ical
```

---
*Created by the Apios Team.*
