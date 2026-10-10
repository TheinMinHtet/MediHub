<div align="center">
  <div p-4 rounded-xl>
    <img src="public/images/modern_hospital_background.jpg" alt="MediHub Banner" width="100%" style="border-radius: 12px; margin-bottom: 20px" />
  </div>
  <h1>🏥 MediHub</h1>
  <p><strong>A Modern, AI-Powered Hospital & Outpatient Management System</strong></p>
  <p>Built for scale, speed, and seamless clinical workflows.</p>
</div>

---

## 🌟 Overview

**MediHub** is a comprehensive, full-stack healthcare management platform built on **Next.js 16 (App Router)** and **Supabase (PostgreSQL)**. It features a beautiful, strictly typed, and completely mobile-responsive "Sage Garden" UI theme designed for clinical environments.

The system is divided into three highly secure, role-based portals:

### 1. 🧑‍⚕️ Patient Portal
* **AI Clinical Triage:** Unsure who to see? Patients describe their symptoms in plain text, and our AI Concierge analyzes them to recommend the exact medical department and specialist required.
* **Streamlined OPD Booking:** A polished, 3-step booking stepper to choose a doctor, select a dynamic time block, apply insurance co-pays, and secure a reservation.
* **Token Slip Generation:** Instantly generates digital token slips and tracks complete clinical visit history.

### 2. 🩺 Doctor Portal
* **Live Consultation Queue:** Real-time visibility into the day's active patient queue, ordered dynamically by token number and check-in status.
* **Clinical Workspace:** A dedicated consultation screen for active patients to log chief complaints, vitals, diagnosis, and prescription medications.
* **Queue Management:** Built-in workflows to securely "Skip" absent patients or flag them for reception follow-up without breaking the queue order.

### 3. ⚙️ Admin & Reception Operations
* **Attendance & Desk:** Convert online bookings into live active tokens when patients physically arrive (`Check-In` / `No-Show`).
* **Doctor Directory:** Manage medical faculty, licensing credentials, session fees, and active/leave statuses.
* **Finance & Insurance:** Log operational expenses, track corporate insurance coverage schemas, and generate real-time Outpatient Profit & Loss (P&L) statements.

---

## 🛠 Tech Stack

* **Frontend:** Next.js 16 (React, App Router, Turbopack)
* **Styling:** Tailwind CSS + Lucide React Icons
* **Database & Auth:** Supabase (PostgreSQL)
* **Design Pattern:** Mobile-First, Native-App Layouts (`pb-safe`, strict viewports, scrollable tabs)
* **Language:** 100% Strict TypeScript

---

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js and npm installed.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/TheinMinHtet/MediHub.git
   cd MediHub
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```

5. **Access the Portals:**
   Open [http://localhost:3000](http://localhost:3000) in your browser. Use the provided login portal to route securely to `/patient`, `/doctor`, or `/admin` based on your access level.

---

## 📱 Mobile Responsiveness

MediHub is built with a strictly enforced **Mobile-First** architecture.
* 🚫 **No wobbling:** Viewport scaling is locked to prevent accidental zoom on form inputs.
* 👆 **Swipeable UIs:** Horizontal carousels for date pickers and navigation tabs replace cramped grids.
* 📱 **Safe Areas:** Padding perfectly respects iOS/Android bottom gesture bars.

---

## 🔒 Security & Auth Guards

All internal layouts are wrapped in strict, client-side React `AuthGuard` components. 
Attempting to jump directly to a dashboard via URL without the correct active `sessionStorage` token will instantly safely redirect the user back to `/login`.

---

<div align="center">
  <i>Developed for seamless outpatient care.</i>
</div>
