# UI Bug Report

This report is based on the README promises, source inspection, and a partial UI smoke test. Severity is ordered from Critical to Normal.

## Critical

### UI-001: Project does not pass TypeScript checks, blocking reliable UI release

- **Evidence:** `npm run lint` fails with TypeScript errors in `src/components/MealLogger.tsx` at the lunch and dinner preset selection checks.
- **Location:** `src/components/MealLogger.tsx:245`, `src/components/MealLogger.tsx:288`
- **Problem:** `counts.lunch` and `counts.dinner` are treated as `string | number`, but `parseFloat()` expects a string.
- **User impact:** Even if the dev server can render, the project is not clean for production/CI and future UI changes are risky.
- **Suggested fix:** Keep fallback meal values as strings, for example `{ lunch: '1', dinner: '1' }`, or normalize with `String(counts.lunch)` and `String(counts.dinner)` before parsing.

## High

### UI-002: README and source contain broken character encoding text

- **Evidence:** README and source contain mojibake in places where emoji, half-meal symbols, the taka sign, bullets, and copyright text should appear.
- **Locations:** `README.md`, `src/App.tsx`, `src/components/MealLogger.tsx`, `src/components/ExpenseTracker.tsx`, `src/components/DepositManager.tsx`, `src/components/Dashboard.tsx`
- **Problem:** The README promises polished typography and Bangladeshi Tk display, but several files show corrupted characters instead of emoji, half symbols, bullet symbols, copyright symbols, or the taka symbol.
- **User impact:** Some UI text can look unprofessional or confusing, especially meal presets and money labels.
- **Suggested fix:** Re-save files as UTF-8 and replace corrupted sequences with proper symbols, or use plain ASCII alternatives like `Tk`, `1/2`, `1 1/2`, `-`, and `(c)`.

### UI-003: Mobile navigation can become crowded and hard to use

- **Evidence:** The sidebar becomes a horizontal tab row on small screens, while labels like `BAZAR & BILLS`, `MEAL LOGS`, and `REGISTRY` remain full text.
- **Location:** `src/App.tsx`
- **Problem:** On narrow screens, the navigation relies on horizontal scrolling and dense text buttons.
- **User impact:** Mobile users may miss tabs or struggle to switch sections quickly.
- **Suggested fix:** Use icon-first mobile tabs with short labels, visible scroll affordance, or a compact bottom navigation.

### UI-004: Icon-only backup/reset actions are discoverable only by title tooltip

- **Evidence:** Export, import, and reset controls use icons only with `title` attributes.
- **Location:** `src/App.tsx`
- **Problem:** Tooltips are not reliable on touch devices and are weak for accessibility.
- **User impact:** Users may not understand critical backup/restore/reset controls.
- **Suggested fix:** Add accessible labels (`aria-label`) and consider short visible labels on mobile or inside a menu.

## Medium

### UI-005: README references UI modules that do not exist

- **Evidence:** README project structure lists `UtilityCostManager.tsx` and `SummaryTable.tsx`.
- **Location:** `README.md`
- **Actual files:** Utilities are inside `ExpenseTracker.tsx`; ledger summary is inside `Dashboard.tsx`.
- **User impact:** Developers looking for UI files will waste time or assume files were accidentally deleted.
- **Suggested fix:** Update README project structure to match the current component list.

### UI-006: Unused icon imports increase noise and maintenance cost

- **Evidence:** Several components import icons that are not rendered.
- **Locations:** `src/App.tsx`, `src/components/MealLogger.tsx`, `src/components/ExpenseTracker.tsx`, `src/components/DepositManager.tsx`, `src/components/Dashboard.tsx`
- **Examples:** `HelpCircle`, `Sparkles`, `Calendar`, `Edit`, `FileText`, `ShieldCheck` in some files.
- **User impact:** No direct runtime issue, but it makes UI code harder to maintain and can trigger stricter lint failures later.
- **Suggested fix:** Remove unused imports or add an ESLint rule to catch them early.

## Normal

### UI-007: README dev URL can confuse users

- **Evidence:** README says to open `http://localhost:3000`, which matches `vite.config.ts`, but Vite may choose another port if `3000` is busy unless strict port is enabled.
- **Locations:** `README.md`, `vite.config.ts`
- **User impact:** New users may open the wrong URL if Vite starts on another port.
- **Suggested fix:** Add `strictPort: true` in Vite config or update README to say "open the URL printed by Vite".

### UI-008: Some UI copy has grammar issues

- **Evidence:** Example: "Paused/inactive members temporary skipped" in the member manager note.
- **Location:** `src/components/MemberManager.tsx`
- **User impact:** Low functional impact, but it weakens the polished product feel promised in the README.
- **Suggested fix:** Revise copy, for example: "Paused/inactive members are temporarily skipped and will not split shared utility charges for the cycle."
