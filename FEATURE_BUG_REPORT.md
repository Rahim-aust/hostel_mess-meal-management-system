# Feature Bug Report

This report is based on the README promises, source inspection, and a partial validation run. Severity is ordered from Critical to Normal.

## Critical

### FEAT-001: Role-based access is only a client-side identity switch

- **README promise:** The app enforces `Mess Manager` and `Regular Member` roles.
- **Evidence:** The active user is selected from a local dropdown in `src/App.tsx`, and Firestore rules allow public read/write.
- **Locations:** `src/App.tsx`, `firestore.rules`
- **Problem:** Any browser user can switch identity to the manager from the dropdown, and the database rules allow all reads and writes.
- **User impact:** This is a security-critical issue. Regular members can become manager, edit data, reset data, import backups, or delete records.
- **Suggested fix:** Add Firebase Authentication, store user-role mapping securely, enforce permissions in Firestore rules, and remove the unrestricted identity dropdown from production builds.

### FEAT-002: Firestore rules allow unrestricted database access

- **Evidence:** `firestore.rules` contains `allow read, write: if true;`.
- **Location:** `firestore.rules`
- **Problem:** Anyone with project access details can read or write all app data.
- **User impact:** Meal logs, member phone/email data, deposits, expenses, and balances are exposed and editable.
- **Suggested fix:** Replace open rules with authenticated, role-aware rules. Managers should write operational collections; members should only read relevant data or write permitted own meal records.

## High

### FEAT-003: Monthly date bounds use day `31` for every month

- **Evidence:** Date inputs use `max={`${selectedMonth}-31`}`.
- **Locations:** `src/components/MealLogger.tsx`, `src/components/ExpenseTracker.tsx`, `src/components/DepositManager.tsx`
- **Problem:** February, April, June, September, and November get invalid max dates.
- **User impact:** Users can see invalid date limits or browser-specific date behavior. This can lead to invalid or confusing monthly records.
- **Suggested fix:** Calculate the last day of the selected month and use that as the `max` value.

### FEAT-004: Meal quantity validation allows unrealistic custom values

- **README promise:** Text input has real-time decimal validation for meal quantities.
- **Evidence:** Meal input only strips non-numeric/non-dot characters and accepts anything parseable by `parseFloat`.
- **Location:** `src/components/MealLogger.tsx`
- **Problem:** Values like `7`, `999`, `1..5`, or `0.333` are not properly constrained.
- **User impact:** A bad entry can distort total meals, meal rate, and every member balance.
- **Suggested fix:** Validate against allowed range/step rules, for example `0 <= value <= 2` and increments of `0.5`, or define a clear custom decimal policy.

### FEAT-005: Regular members can still trigger meal save action

- **README promise:** Regular members get a secure read-only interface except limited own meal editing.
- **Evidence:** `MealLogger` disables other members' inputs for non-managers, but the Save button remains available for all users and `handleSave` submits all `dailyMeals`.
- **Location:** `src/components/MealLogger.tsx`
- **Problem:** The UI intends to lock other members, but the save path still sends the full daily meal payload.
- **User impact:** Combined with weak backend rules, a regular member can potentially overwrite the full date's meal records.
- **Suggested fix:** For member mode, submit only the current member's meal record, and enforce the same restriction in Firestore rules.

## Medium

### FEAT-006: Deleting a member leaves orphaned financial and meal records

- **Evidence:** The delete confirmation says historical records will remain orphaned.
- **Location:** `src/components/MemberManager.tsx`
- **Problem:** Meal, bazar, and deposit records can reference member IDs that no longer exist.
- **User impact:** Dashboard/history views show `UNKNOWN` member data and reports become harder to audit.
- **Suggested fix:** Prefer soft delete/inactive status for members with history, or add an archive flow that preserves display name snapshots.

### FEAT-007: New member role can create multiple manager transitions without confirmation

- **Evidence:** New member form allows selecting `Manager`; update flow demotes other managers, but add flow does not explicitly demote existing managers.
- **Locations:** `src/components/MemberManager.tsx`, `src/App.tsx`
- **Problem:** Adding a new manager may leave multiple managers depending on the save path and current data.
- **User impact:** Role ownership can become unclear, weakening manager-only workflows.
- **Suggested fix:** Reuse the same single-manager enforcement in `handleAddMember`, or require confirmation before transferring manager role.

### FEAT-008: Imported backups are only shape-checked, not value-validated

- **Evidence:** Backup restore only checks that top-level arrays exist.
- **Location:** `src/App.tsx`
- **Problem:** Invalid amounts, dates, roles, member references, duplicate IDs, or malformed records can be uploaded.
- **User impact:** Bad backups can corrupt accounting and UI state.
- **Suggested fix:** Add schema validation for every collection before upload, with a preview of record counts and validation errors.

## Normal

### FEAT-009: README claims 5 default active members, code seeds 8

- **README claim:** Troubleshooting section says demo seeding includes 5 default active members.
- **Evidence:** `DEFAULT_MEMBERS` contains 8 members.
- **Locations:** `README.md`, `src/utils/dataStore.ts`
- **User impact:** Low functional impact, but documentation does not match actual seed data.
- **Suggested fix:** Update README to say 8 demo members or adjust seed data to match the README.

### FEAT-010: README includes setup files/scripts that do not fully match current project behavior

- **Evidence:** README references `cp .env.example .env` and `APP_URL=http://localhost:3000`, but the running frontend reads Firebase config from `firebase-applet-config.json`; `GEMINI_API_KEY` is not used in inspected source.
- **Locations:** `README.md`, `.env.example`, `src/utils/firebase.ts`
- **User impact:** New developers may spend time configuring unused variables.
- **Suggested fix:** Clarify which environment variables are required today and remove unused setup instructions.

### FEAT-011: Production bundle analysis opens automatically during build

- **Evidence:** Vite visualizer is configured with `open: true`.
- **Location:** `vite.config.ts`
- **Problem:** Every production build attempts to open `stats.html`.
- **User impact:** CI/deployment builds can be noisy or fail in headless environments.
- **Suggested fix:** Enable visualizer only behind an environment flag, or set `open: false` by default.
