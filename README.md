# FamTrack — Shared Family Budget & Financial Management Mobile App

[![React Native](https://img.shields.io/badge/React%20Native-0.86-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2057-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%7C%20Auth-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/NativeWind-Tailwind%20CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://www.nativewind.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

> **SLIIT — Faculty of Computing**  
> **Module Code:** IT3060 — Human Computer Interaction (HCI)  
> **Academic Year / Semester:** Year 3 Semester 2 (2026)  
> **Assessment:** Milestone 03 — Mobile App Implementation & Final Evaluation  
> **Group ID:** `WE_148`  
> **Project Title:** FamTrack: Collaborative Family Financial Management Mobile Application

---

## 📖 1. Executive Summary & Problem Overview

Managing household finances across multiple family members is often fragmented, error-prone, and non-transparent. Traditional budgeting tools are typically single-user focused, failing to support collective decision-making, shared expense splitting, savings goals, or role-based financial permissions between parents and dependents.

**FamTrack** is a cross-platform mobile application engineered to solve these challenges by providing a synchronized, real-time shared financial environment. Designed with a mobile-first Human-Computer Interaction (HCI) approach, FamTrack empowers families to collaboratively set monthly budgets, track daily expenditures, monitor shared saving goals, manage recurring commitments, and control access permissions through an intuitive, accessible user interface.

---

## 🛠️ 2. Technology Stack & HCI Justification

The technology stack was selected to satisfy the functional requirements established in Milestone 01, the high-fidelity UI design from Milestone 02, and the mobile performance, security, and real-time synchronization requirements of Milestone 03.

| Technology Layer              | Chosen Technology                   | HCI & Technical Justification                                                                                                                                                                |
| :---------------------------- | :---------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mobile Frontend**           | **React Native + Expo (SDK 57)**    | Cross-platform code reusability (iOS & Android) with near-native performance, 60fps gesture fluidness, and Continuous Native Generation (CNG).                                               |
| **Navigation & Routing**      | **Expo Router (File-based)**        | Deep linking support, native transition animations, and reliable history stack management that upholds Nielsen's _User Control and Freedom_ (Heuristic #3).                                  |
| **Styling & UI System**       | **NativeWind (Tailwind CSS v3/v4)** | Unified Design System ensuring visual consistency across all components, high contrast ratios, responsive layouts, and zero runtime CSS cascading issues.                                    |
| **Backend & Cloud Database**  | **Firebase Cloud Firestore**        | Real-time WebSocket listeners (`onSnapshot`) providing instantaneous multi-device updates (_Visibility of System Status_ - Heuristic #1), offline persistence, and ACID transaction support. |
| **Authentication**            | **Firebase Authentication**         | Secure Email/Password registration, encrypted session persistence across app restarts, and automatic family linkage via invitation tokens.                                                   |
| **Access Control & Security** | **Firestore Security Rules**        | Declarative server-side validation enforcing strict role boundaries (Admin vs. Member), data integrity, and privacy protection across family partitions.                                     |
| **Type Safety & Quality**     | **TypeScript & ESLint**             | Complete compile-time type safety preventing runtime null/undefined crashes, paired with strict linting standards.                                                                           |

---

## 📱 3. System Architecture & Workload Breakdown

FamTrack is architected using a decoupled **Provider-Service Architecture**:

```
 ┌─────────────────────────────────────────────────────────────┐
 │                 React Native / Expo Views                   │
 │ (Tabs: Home, Budget, Savings, Settings | Screens: Add/Edit) │
 └──────────────────────────────┬──────────────────────────────┘
                                │ React Context Hooks
 ┌──────────────────────────────▼──────────────────────────────┐
 │               Global State & Context Layer                  │
 │  (AuthContext, FamilyContext, BudgetContext, ExpenseContext,│
 │    SavingsContext, BillsContext, IncomeContext)             │
 └──────────────────────────────┬──────────────────────────────┘
                                │ Async / Real-time Service Layer
 ┌──────────────────────────────▼──────────────────────────────┐
 │         Services Layer (Data Sanitization & Business Rules) │
 │  (authService, budgetService, expenseService, billsService) │
 └──────────────────────────────┬──────────────────────────────┘
                                │ Firestore SDK / Security Rules
 ┌──────────────────────────────▼──────────────────────────────┐
 │             Firebase Cloud Firestore & Auth Engine          │
 └─────────────────────────────────────────────────────────────┘
```

### 👥 Individual Workload & CRUD Operations Mapping

Each group member implemented dedicated interfaces ensuring **at least 2 functional CRUD operations per interface**:

```
+---------------------------------------------------------------------------------------------------------+
| Module / Interface               | Operations Implemented                | HCI & Usability Focus        |
+---------------------------------------------------------------------------------------------------------+
| 1. Shared Family Budget          | • Create: Set monthly budget          | • Progress bars              |
|    (`app/(tabs)/budget.tsx`)     | • Read: Real-time spend vs limit      | • Color-coded alert warnings |
|                                  | • Update: Modify category allocations | • Zero-based budgeting logic |
+---------------------------------------------------------------------------------------------------------+
| 2. Expense Management            | • Create: Add expense with receipt    | • Auto-redirection           |
|    (`app/add-expense.tsx`,       | • Read: Chronological history & search| • Receipt image inspection   |
|     `app/expense-history.tsx`)   | • Delete: Confirmation modal deletion | • Payer & split selectors    |
+---------------------------------------------------------------------------------------------------------+
| 3. Saving Goals                  | • Create: New goal with target date   | • Dynamic multiplier bars    |
|    (`app/(tabs)/savings.tsx`,    | • Read: Total family savings tracker  | • Progress percentage badges |
|     `app/create-goal.tsx`)       | • Delete: Goal trash action handler   | • Error-preventive inputs    |
+---------------------------------------------------------------------------------------------------------+
| 4. Recurring Bills               | • Create: Register scheduled bill     | • Auto-pay / Due date badges |
|    (`app/recurring-bills.tsx`,   | • Read: View upcoming commitments     | • Single-tap status toggle   |
|     `app/add-bill.tsx`)          | • Update: Mark bill as Paid           | • Deletion confirmation      |
|                                  | • Delete: Remove recurring obligation |                              |
+---------------------------------------------------------------------------------------------------------+
| 5. Income & Group Management     | • Create: Add income & invite member  | • Granular access toggles    |
|    (`app/manage-group.tsx`,      | • Read: View member roles & income    | • Dynamic QR invite codes    |
|     `app/add-income.tsx`)        | • Update: Toggle expense permissions  | • Instant copy triggers      |
|                                  | • Delete: Cancel invitation / record  |                              |
+---------------------------------------------------------------------------------------------------------+
```

---

## 🎨 4. HCI Principles & Design Deviations

### Alignment with Nielsen’s 10 Usability Heuristics:

1. **Visibility of System Status (Heuristic #1)**: Dynamic progress bars for budget limits and saving goals update in real-time. Adding an expense automatically navigates to Expense History for instant confirmation.
2. **User Control and Freedom (Heuristic #3)**: Destructive actions (deleting expenses, removing goals, cancelling bills) feature single-confirmation dialogs with instant cancellation options.
3. **Consistency and Standards (Heuristic #4)**: Reusable components (`AppBottomNav`, `MemberInitialsAvatar`, `Icon`, and color palettes) establish predictable interaction patterns across the application.
4. **Error Prevention (Heuristic #5)**: Dedicated full-page forms for `Add Expense`, `Create Goal`, and `Add Bill` prevent accidental form dismissals and validate number formatting before cloud commits.
5. **Flexibility and Efficiency of Use (Heuristic #7)**: Multi-parameter search and category filter chips enable rapid lookup within dense financial records.

### Documented Design Deviations (from Milestone 02 Prototype):

- **Full-Page Form Navigation**: Converted complex creation forms (`Create Saving Goal` and `Add Recurring Bill`) from nested inline modals into dedicated full screens (`app/create-goal.tsx`, `app/add-bill.tsx`) to reduce cognitive clutter and prevent input loss on smaller mobile displays.
- **Expense Detail Inspection Modal**: Introduced an explicit transaction detail modal featuring receipt inspection and deletion triggers, fulfilling Milestone 01 CRUD expectations while keeping the history list fast and clean.

---

## 🚀 5. Getting Started & Installation Guide

Follow these instructions to run the application locally on an iOS/Android simulator or physical device via Expo Go.

### 📋 Prerequisites

- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **Package Manager**: `npm` (v10+)
- **Mobile Environment**:
  - [Expo Go App](https://expo.dev/go) installed on your physical smartphone (iOS / Android), **OR**
  - Android Studio Emulator / Xcode iOS Simulator configured on your computer.

---

### 📥 1. Clone the Repository

```bash
git clone https://github.com/dayanwrathnayake/HCI-WE_148-FamTrack.git
cd HCI-WE_148-FamTrack
```

---

### 📦 2. Install Dependencies

Always use `npm install` (or `npx expo install` for Expo native packages):

```bash
npm install
```

---

### ⚙️ 3. Configure Environment Variables

Create a local environment configuration file in the project root:

```bash
cp .env.example .env.local
```

Open `.env.local` and populate it with your Firebase project credentials:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

> **Note:** `.env.local` is ignored by Git to preserve credential security.

---

### 🛡️ 4. Deploy / Publish Firestore Security Rules

Ensure the security rules from [`firestore.rules`](./firestore.rules) are published in your Firebase Console (**Firestore Database > Rules > Publish**) to allow authorized read/write access for authenticated users.

---

### 🏃 5. Run the Mobile App

Start the Expo development server:

```bash
npx expo start -c
```

#### Running on Device / Simulator:

- **Physical Phone (Expo Go)**: Scan the generated QR code in your terminal using your phone camera (iOS) or the Expo Go app (Android).
- **iOS Simulator**: Press `i` in the terminal.
- **Android Emulator**: Press `a` in the terminal.
- **Web Browser**: Press `w` in the terminal.

---

## 🧪 6. Testing, Verification & Code Quality

The codebase enforces strict static analysis and type checking prior to any merge:

```bash
# 1. Typecheck the entire project
npx tsc --noEmit

# 2. Run ESLint code quality suite
npx eslint .

# 3. Run Expo diagnostic check
npx expo-doctor
```

### ✅ Test Suite Results:

- **TypeScript**: `0 errors`
- **ESLint**: `0 warnings / 0 errors`
- **Cross-Platform Compatibility**: Tested and verified on iOS (iPhone 13/14/15 Pro) and Android (Pixel 7 / Samsung Galaxy).

---

## 📂 7. Project Directory Structure

```
HCI-WE_148-FamTrack/
├── app/                        # Expo Router Screen Pages & Navigators
│   ├── (tabs)/                 # Bottom Tab Navigator Group
│   │   ├── _layout.tsx         # Tab Bar Configuration
│   │   ├── home.tsx            # Family Financial Dashboard
│   │   ├── budget.tsx          # Budget Planner & Category Breakdown
│   │   ├── savings.tsx         # Saving Goals Screen
│   │   └── settings.tsx        # App Settings & Navigation Hub
│   ├── _layout.tsx             # Root Stack Layout & Context Providers
│   ├── add-bill.tsx            # Add Recurring Commitment Form
│   ├── add-expense.tsx         # Add Expense with Receipt Picker
│   ├── add-income.tsx          # Add Family Income Form
│   ├── create-goal.tsx         # Create Saving Goal Screen
│   ├── expense-history.tsx     # Monthly History with Filters & Search
│   ├── manage-group.tsx        # Family Group & Role Management
│   ├── my-account.tsx          # User Profile & Account Settings
│   └── recurring-bills.tsx     # Recurring Bills & Commitments Screen
├── components/                 # Reusable UI & Modal Components
│   ├── AppBottomNav.tsx        # Floating Persistent Navigation Bar
│   ├── BillItemRow.tsx         # Recurring Bill Item with Mark-Paid & Delete
│   ├── ExpenseDetailModal.tsx  # Detailed Transaction Modal with Receipt View
│   ├── HistoryItemRow.tsx      # Chronological Expense Row
│   ├── MemberSelector.tsx      # Multi-member Payer & Split Chip Selector
│   ├── ReceiptPicker.tsx       # Image Picker Component for Receipts
│   ├── SavingGoalCard.tsx      # Interactive Goal Progress Card
│   └── ShareInviteModal.tsx    # Family Invite Code & QR Sharing Modal
├── context/                    # React Contexts (Global State Management)
│   ├── AuthContext.tsx         # User Session & Registration State
│   ├── BillsContext.tsx        # Recurring Bills State & Mutations
│   ├── BudgetContext.tsx       # Monthly Budget Data & Allocations
│   ├── ExpenseContext.tsx      # Real-time Expenses & Aggregated Totals
│   ├── FamilyContext.tsx       # Family Membership & Admin Role State
│   ├── IncomeContext.tsx       # Income Records & Source Filtering
│   └── SavingsContext.tsx      # Saving Goals State & Progress Sync
├── services/                   # Firebase Firestore & Business Logic Services
│   ├── billsService.ts         # Firestore Queries for Recurring Bills
│   ├── budgetService.ts        # Firestore Rules & Budget Calculations
│   ├── expenseService.ts       # Real-time Listeners & Expense Mutations
│   └── savingsService.ts       # Saving Goal Document CRUD Handlers
├── utils/                      # Pure Helper Functions & Math Utilities
│   ├── budget.ts               # Budget Calculation & Month Rollovers
│   ├── expenses.ts             # Safe Date Parsers & Spend Totals
│   ├── members.ts              # Initials, Avatars & Palette Generator
│   └── validation.ts           # Form Input Validators
├── constants/                  # System Constants, Colors & Icon Definitions
├── types/                      # TypeScript Interfaces & Data Models
├── firestore.rules             # Declarative Firebase Firestore Security Rules
├── app.json                    # Expo Project & App Metadata
└── package.json                # Project Dependencies & Scripts
```

---

## 👥 Project Contributors (Group WE_148)

| Student Name                 | Student ID   | Module Scope & Implemented Interfaces                                                                                                                                                                                                        |
| :--------------------------- | :----------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Rathnayake W. P. D. D. W** | `IT23413474` | **User Management & Income Management**<br>• Welcome, Login & Registration Flow<br>• User Profile & My Account Management<br>• Income Tracking & Add Income Interface                                                                        |
| **Nadun M. A**               | `IT23192850` | **Expense Management, Saving Goals & Recurring Bills**<br>• Add Expense, Expense Details Modal & Expense History<br>• Saving Goals Overview & Create Saving Goal Interface<br>• Recurring Bills Overview & Add Recurring Bill Interface      |
| **A. A. R. A. M Shakna**     | `IT23540194` | **Shared Expenses & Family Budget**<br>• Shared Expenses Management & Split Contribution Tracking<br>• Family Budget Overview, Category Budgets & Edit Budget Flow<br>• System Architecture & UI Prototype Design Variants                   |
| **Fernando K. K. C**         | `IT22325228` | **Family Group Management & Quality Assurance**<br>• Manage Group Interface & Member Invitation Management<br>• Functional Testing & Comprehensive Test Case Execution<br>• Usability Testing, Evaluation & Requirements Traceability Matrix |

---

## 📜 9. Academic Integrity & License

This project was developed strictly for academic evaluation in the **IT3060 Human Computer Interaction** module at the **Sri Lanka Institute of Information Technology (SLIIT)**.

Licensed under the [MIT License](LICENSE).
