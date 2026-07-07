# Hostel Mess Meal & Expense Tracker

A React, Vite, TypeScript, Tailwind CSS, and Firebase Firestore app for managing hostel or bachelor mess meals, bazar costs, deposits, shared utilities, and final member balances.

The app is designed for mess systems where one or more managers maintain records and members can log in with their registered email to view their own mess data.

## Features

- Real-time data sync with Firebase Firestore.
- Simple email-based login using the email stored in the member registry.
- Super Admin login for managing multiple mess branches.
- Manager and member roles.
- Multiple mess branches with branch switching for Super Admin.
- Managers can add/edit members, phone numbers, emails, roles, and active status.
- Managers can log meals, bazar costs, deposits, and utility bills.
- Members can view records and update only their own meal entry.
- Breakfast, lunch, and dinner meal logging with different validation rules.
- Automatic meal rate, utility share, total cost, refund, and due calculation.
- Backup export and validated backup restore.
- Demo seed data when Firestore is empty.

## Tech Stack

- React 19
- Vite
- TypeScript
- Tailwind CSS 4
- Firebase Firestore
- Lucide React icons

## Requirements

- Node.js 18 or newer
- npm
- A Firebase account

## Start From GitHub With Your Own Firebase Project

Follow these steps if you clone or fork this project and want to run it with your own Firebase ID/config.

### 1. Clone The Repository

```bash
git clone <your-repository-url>
cd hostel_mess-meal-management-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create A Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project**.
3. Create a project, for example `hostel-mess-tracker`.
4. In the project dashboard, click the web app icon `</>`.
5. Register the app.
6. Copy the Firebase web config values.

### 4. Enable Firestore

1. In Firebase Console, open **Firestore Database**.
2. Click **Create database**.
3. Choose a region.
4. For local/dev testing, you can start in test mode.

### 5. Add Your Firebase Config File

Create this file in the project root:

```text
firebase-applet-config.json
```

Paste your Firebase config in this shape:

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

Use `(default)` for `firestoreDatabaseId` unless you created a custom Firestore database ID.

### 6. Add Firestore Rules For Development

For local testing only, you can publish:

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

Important: these rules are open and are not safe for production. Before real production deployment, replace them with authenticated, role-aware rules.

### 7. Run The App

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

The dev server uses port `3000` with strict port mode.

## First Login

The app uses simple email login:

1. Firestore seeds demo members if the database is empty.
2. Enter one of the registered member emails.
3. The app finds that email in the member registry.
4. The role in that member record decides access:
   - `Manager`: full management access
   - `Member`: member view and own meal entry access

Default demo manager email:

```text
rahim@mess.com
```

Managers can edit member emails from the **Members** screen. After changing an email, that member should log in using the new email.

## Super Admin Login

Super Admin is not stored as a normal member, so members and managers do not see the Super Admin email in the member registry.

Default Super Admin login:

```text
Email: superadmin@mess.com
Password: 123456
```

On the login page, the password field appears only when the email is `superadmin@mess.com`.

Super Admin can:

- Switch between mess branches.
- Add a new mess branch.
- Manage members, meals, bazar, deposits, and utilities for the selected branch.
- Change the Super Admin password from the sidebar.

Note: the Super Admin password is currently stored in browser local storage for simple project/demo use. For production, move this to secure Firebase Authentication or a protected backend.

## Meal Rules

The app supports three meal slots:

```text
Breakfast: 0, 0.5, 1, or guest counts such as 2.5
Lunch:     0, 1, 2, or any whole number for guests
Dinner:    0, 1, 2, or any whole number for guests
```

Breakfast manual input allows `.5`, including guest counts such as `2.5`.

Lunch and dinner manual input do not allow fractional values. For example:

- Valid lunch/dinner: `0`, `1`, `2`, `5`, `10`
- Invalid lunch/dinner: `0.5`, `1.5`, `5.5`

## Important Manager Rules

- A manager can promote another member to manager.
- A manager cannot demote themself if they are the only manager.
- Members with historical meals, deposits, or bazar records cannot be deleted; pause them instead.
- Managers can edit email and phone for each member.

## Project Structure

```text
assets/
firebase-applet-config.json
firestore.rules
index.html
package.json
tsconfig.json
vite.config.ts
src/
  main.tsx
  App.tsx
  index.css
  types.ts
  components/
    Dashboard.tsx
    MealLogger.tsx
    ExpenseTracker.tsx
    DepositManager.tsx
    MemberManager.tsx
  utils/
    backup.ts
    dataStore.ts
    date.ts
    firebase.ts
    meals.ts
```

## Commands

```bash
npm run dev
```

Starts the local development server.

```bash
npm run lint
```

Runs TypeScript checks.

```bash
npm run build
```

Builds the app into `dist/`.

```bash
npm run preview
```

Previews the production build locally.

```bash
npm run build:gh
```

Builds using the GitHub Pages base path.

```bash
npm run deploy
```

Deploys the `dist/` folder to GitHub Pages using `gh-pages`.

## Production Checklist

Before using this app with real mess data:

- Run `npm run lint`.
- Run `npm run build`.
- Test the production build with `npm run preview`.
- Replace open Firestore rules with secure production rules.
- Confirm the Firebase config belongs to your own Firebase project.
- Test login, meal logging, bazar, deposits, utilities, backup export, and backup restore.

## Notes

- The app stores money labels as `Tk` for consistent display across devices.
- Manual meal input supports larger guest counts like `5`, `5.5`, and `10`.
- Backup restore validates records before uploading them to Firestore.

## License

This project is free to adapt, modify, and use for personal or commercial hostel mess tracking.
