# Hostel Mess Meal & Expense Tracker

A modern, highly polished, real-time full-stack application built with **React**, **Vite**, **TypeScript**, **Tailwind CSS**, and **Firebase Firestore** to manage hostel mess meals, grocery bazar logs, deposits, shared utilities, and final member balances.

This application simplifies the complex calculations involved in running a hostel or shared-apartment mess (e.g. Bangladesh/India mess system). It automates calculating meal rates, splitting utility charges, tracking individual member deposits, and generating the final ledger.

---

## 🚀 Key Features

*   **Real-time Synchronization**: Powered by Firebase Firestore, ensuring changes made by any member or manager are updated instantly across all devices.
*   **Role-Based Access Control**: Enforces standard roles (`Mess Manager` and `Regular Member`).
    *   *Managers* can log daily meals, record member deposits, adjust active/inactive registries, and write Bazar entries.
    *   *Regular Members* enjoy a clean, secure read-only interface where they can track metrics, view bills, and audit logs.
*   **Aesthetic Typography & Layout**: Built on a modern visual slate layout using high-contrast typography ("Inter" paired with monospace detail headers) and clean borders.
*   **Robust Meal Logging Engine**: 
    *   Log daily lunch/dinner counts with 1-click presets (`0`, `½`, `1`, `1½`, `2`).
    *   **Text-Type Input Facility**: Enter custom fractional or integer meal quantities directly with real-time decimal validation.
*   **Detailed Bazar Grocery Log**: Log dates, precise amounts (৳ / Tk), purchasing member names, and itemized lists of purchased food.
*   **Flexible Shared Utilities**: Log monthly common expenses (Internet, Cook salary, Gas, Electricity, Maid) that get evenly divided among *Active/Active-registered* members.
*   **Advance Deposit Ledger**: Track payments and funds received from members in advance.
*   **Automated Accounting Calculator**:
    *   **Total Bazar Costs & Meal Count**: Sums all market purchases and divides by total active meals to generate a mathematically precise **Meal Rate**.
    *   **Shared Utility Splits**: Evenly splits shared utilities among currently active mess members (paused members are automatically exempted).
    *   **Individual Ledger**: Calculates total meals eaten per person, individual meal expenses, plus their share of utilities, subtracted from their paid deposits to show their exact balance (**Refund** or **Due**).
*   **Database Seeding, Backups, & Resets**: Automatically populates with safe sample demo data if the Firestore database is empty. Includes quick backup/restore and database reset features.

---

## 🛠️ Tech Stack & Architecture

*   **Frontend**: React 19 (Functional Hooks, Context), Vite (Development Bundler)
*   **Language**: TypeScript (Strong typing, clean interfaces)
*   **Styling**: Tailwind CSS 4 (Responsive, rapid utility classes, modern palette)
*   **Icons**: Lucide React
*   **Animations**: Motion (formerly Framer Motion)
*   **Backend / DB**: Firebase Web SDK, Firebase Firestore (Real-time NoSQL cloud store)

---

## 📋 Prerequisites

Before you get started, ensure you have the following installed on your local machine:

1.  **Node.js** (v18.0.0 or higher is recommended)
2.  **npm** (Node Package Manager)
3.  **A Firebase Account** (Free tier is perfectly sufficient)

---

## ⚙️ Local Setup & Setup Guide

Follow these steps to run this project locally on your machine.

### Step 1: Clone the Repository
Clone this repository to your local system and navigate to the project directory:
```bash
git clone <your-repository-url>
cd hostel-mess-meal-tracker
```

### Step 2: Install Dependencies
Install all package dependencies defined in the project:
```bash
npm install
```

### Step 3: Firebase Firestore Setup
This project uses **Firebase Firestore** as its real-time database. You will need to link your own Firebase project.

1.  Go to the [Firebase Console](https://console.firebase.google.com/) and click **Add project**. Name your project (e.g., `hostel-mess-tracker`) and create it.
2.  In the Project Overview panel, add a **Web Application**. Register your app and copy the credentials snippet (`firebaseConfig`).
3.  In the Firebase sidebar, go to **Firestore Database** and click **Create database**.
    *   Select your region.
    *   Start in **Test mode** (or configure secure read/write rules. The rule set used for this project is provided below).
4.  In the root directory of your cloned codebase, create a new file named `firebase-applet-config.json` and paste your Firebase credentials into it.

#### `firebase-applet-config.json` Template:
Create the file at the root `/firebase-applet-config.json` with this exact structure:
```json
{
  "projectId": "your-firebase-project-id",
  "appId": "your-app-id",
  "apiKey": "your-api-key",
  "authDomain": "your-project-id.firebaseapp.com",
  "firestoreDatabaseId": "(default)",
  "storageBucket": "your-project-id.firebasestorage.app",
  "messagingSenderId": "your-messaging-sender-id",
  "measurementId": ""
}
```
> **Note**: If your Firestore database has a custom Database ID (other than the standard `(default)` instance), specify it in the `"firestoreDatabaseId"` field.

#### Firestore Security Rules (`firestore.rules`):
To enable development and seamless reading/writing, publish these rules in your Firebase Console's Firestore Rules tab:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Step 4: Environment Variables Setup
1.  Copy the example environment file to create a local `.env` configuration:
    ```bash
    cp .env.example .env
    ```
2.  Open `.env` in your text editor and specify your keys if needed:
    ```env
    GEMINI_API_KEY="your-gemini-api-key"
    APP_URL="http://localhost:3000"
    ```

### Step 5: Start the Local Server
Boot up the development environment using Vite:
```bash
npm run dev
```

Once the dev server starts, it will display the local URL. Open your browser and navigate to:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 📂 Project Structure

```text
├── assets/                    # Asset folders
├── firebase-applet-config.json # Local Firebase SDK connection credentials (git-ignored)
├── firestore.rules            # Firestore security rules definition
├── index.html                 # Entry HTML template
├── package.json               # Dependencies and executable scripts
├── tsconfig.json              # TypeScript compilation rules
├── vite.config.ts             # Vite server and tailwind plugins
├── src/
│   ├── main.tsx               # Main DOM entrypoint
│   ├── App.tsx                # Master dashboard state layout and routing
│   ├── index.css              # Global styles (Tailwind imports & custom typography)
│   ├── types.ts               # Shared TypeScript typings
│   ├── components/            # Reusable UI component modules
│   │   ├── MealLogger.tsx     # Meal logging module with text/button inputs
│   │   ├── ExpenseTracker.tsx # Bazar purchase cost registry
│   │   ├── DepositManager.tsx # Advance payment cash-in ledger
│   │   ├── MemberManager.tsx  # Member enrollment and active statuses
│   │   ├── UtilityCostManager.tsx # Utility setup and distribution
│   │   └── SummaryTable.tsx   # Ledger sheets with automated financial calculations
│   └── utils/
│       ├── firebase.ts        # Firestore synchronization, queries, and mutations
│       └── dataStore.ts       # Fallback demo seeding records
```

---

## 📜 Executable Commands

You can run the following scripts in your terminal:

*   `npm run dev`: Launches the local Vite server at [http://localhost:3000](http://localhost:3000) with hot reloading.
*   `npm run build`: Bundles the React codebase into static files in `dist/` optimized for production deployment.
*   `npm run preview`: Hosts a local test server of the compiled production bundle in `dist/`.
*   `npm run lint`: Triggers the TypeScript compiler checks to ensure type safety.
*   `npm run clean`: Utility command to flush temporary folders and build directories.

---

## 💡 Troubleshooting & Database Seeding

*   **Blank Screen / No Members**: On your first boot, if your Firestore instance is completely empty, the application will **automatically seed itself** with a realistic hostel mess setup (including 5 default active members, sample meal records, demo bazar logs, and utility logs).
*   **Database Reset**: If you've modified or added values and want to return to the clean demo state, click the **Reset Firestore** button in the app's top utility bar to wipe and re-seed all collections.
*   **Port Config**: The development server is bound to port `3000` (`--port=3000`) for consistency and compatibility.

---

## 📄 License

This project is open-source and free to adapt, modify, and distribute for personal or commercial hostel mess tracking.
