

# 🌾 AgroCycle — Supply Chain ERP

**An admin dashboard to manage the complete paddy straw supply chain — from farm to buyer.**

Built with Next.js · TypeScript · Tailwind CSS

---

</div>

## 🧐 What is AgroCycle?

Every year, millions of tons of **paddy straw** are burned in fields across India, causing severe air pollution and health hazards. AgroCycle tackles this problem by creating a **digital supply chain** that connects farmers, baler operators, storage hubs, and industrial buyers — turning agricultural waste into a valuable biomass resource.

This admin dashboard is the **control center** for managing that entire operation.

---

## ✨ Key Features

### 📊 Dashboard
A real-time overview with KPI cards, activity feed, and quick actions — giving operators a snapshot of the entire supply chain at a glance.

### 🚜 Pickup Management
Farmers submit pickup requests for their paddy straw. The admin can view, filter, and manage all incoming requests with status tracking (Pending → Assigned → Completed).

### 📦 Baler Fleet
Track baler machines and their operators — availability, maintenance schedules, current assignments, and performance stats.

### 🔗 Assignments
Assign balers to farmer pickup requests, track progress, and mark completions with actual quantity records.

### 🏭 Hub Inventory
Storage hubs receive baled straw and dispatch it to buyers. The dashboard tracks:
- **Inbound** — straw arriving from farms (with quality & moisture checks)
- **Outbound** — dispatches to buyers with truck and delivery tracking
- **Capacity** — real-time stock levels per hub

### 🛒 Buyer Orders
Manage buyer orders end-to-end — from order placement through confirmation, dispatch, and delivery.

### 💳 Payouts
Process payments to farmers and baler operators with detailed breakdowns — base rate, subsidies, baling costs, and logistics.

---

## 🔄 How It Works

```
👨‍🌾 Farmer                    📦 Baler                     🏭 Hub                      🏢 Buyer
   │                            │                            │                            │
   ├── Submits Pickup ─────────►├── Gets Assigned ──────────►├── Receives Straw ─────────►├── Places Order
   │   Request                  │   to Pickup                │   (Quality Check)          │
   │                            │                            │                            │
   │                            ├── Bales & Transports ─────►├── Stores Inventory         ├── Receives Delivery
   │                            │   to Hub                   │                            │
   │                            │                            ├── Dispatches ──────────────►│
   │                            │                            │                            │
   ◄────────────────────────────┤◄───────────────────────────┤                            │
       💰 Payout Processed          💰 Payout Processed                                   
```

---

## 🖥️ Pages

| Page | Description |
|------|-------------|
| **Dashboard** | KPIs, activity feed, and quick action shortcuts |
| **Pickup Requests** | All farmer pickup requests with filters and status |
| **Assignments** | Baler-to-pickup mapping and progress tracking |
| **Hubs** | Hub cards with stock levels, inbound/outbound history |
| **Balers** | Fleet management with maintenance and operator details |
| **Buyer Orders** | Order lifecycle from placement to delivery |
| **Payouts** | Payment processing with detailed cost breakdowns |
| **Farmers** | Farmer directory and management |
| **Users** | User accounts and roles |
| **Settings** | Application configuration |

---

## 🛠️ Built With

- **[Next.js 14](https://nextjs.org/)** — React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** — Type-safe development
- **[Tailwind CSS](https://tailwindcss.com/)** — Utility-first CSS
- **[Lucide Icons](https://lucide.dev/)** — Clean, consistent icon set

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/your-username/agro-cycle-website.git

# Navigate to the project
cd agro-cycle-website

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser — the app redirects to the admin dashboard automatically.

---

## 📁 Project Structure

```
src/
├── app/              # Next.js pages and routing
│   └── admin/        # All admin pages (dashboard, pickups, hubs, etc.)
├── components/
│   ├── admin/        # Feature-specific components (tables, modals, forms)
│   ├── dashboard/    # Dashboard widgets (KPI cards, activity feed)
│   ├── layout/       # Sidebar navigation and page shell
│   └── ui/           # Reusable components (Button, Modal, Badge, etc.)
├── data/             # Mock data for all modules
├── lib/              # Utility functions
└── types/            # TypeScript type definitions
```

---

## 📌 Status

> This project is a **frontend prototype** using mock data. Backend API integration is planned for future development.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).


