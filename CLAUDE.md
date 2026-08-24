# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**Roommate Ledger** is a small two-person expense-tracking web app (built for "Vishal & Shivam"). It's a Vite + React 19 SPA that talks to a Supabase backend for authentication and data. There is no separate server — all data access happens client-side via the Supabase JS SDK.

## Commands

- `npm run dev` — start the Vite dev server (HMR)
- `npm run build` — production build (React Compiler is enabled via Babel, so builds are slower than typical Vite)
- `npm run lint` — run oxlint (config in `.oxlintrc.json`)
- `npm run preview` — preview the built app locally

There are no tests. Deployment is via Vercel (`.vercel/` is configured); the framework preset detects Vite automatically.

## Architecture

### Build stack & config
- **Vite 8 + React 19**, JavaScript (`.jsx`, no TypeScript). Entry is `index.html` → `src/main.jsx` → `src/App.jsx`.
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin and `@import "tailwindcss"` in `src/index.css`. Most styling is done with inline Tailwind utility classes — often hard-coded hex values like `bg-[#fcf8fa]` rather than theme tokens. Inter is loaded from Google Fonts.
- **React Compiler** is enabled (`babel-react-compiler` preset in `vite.config.js`), so follow Rules of Hooks strictly (oxlint enforces `react/rules-of-hooks`).
- **State via Jotai** (tiny atom store in `src/atoms/authAtom.js`), not Redux or React Query.

### Data layer (Supabase)
- Single client in `src/lib/supabase.js`, initialized from `import.meta.env.VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (in `.env`, gitignored; a local copy must exist to run).
- Tables used: `profiles` (all users), `expenses`, `settlements`. **There is no ORM and no server-side logic/SQL beyond what Supabase row-level security provides** — all queries are written inline in components, so bleeding business logic into JSX is common and expected here.
- Money fields are stored as numbers (assumed rupees, shown as `₹`); amounts are formatted with `toLocaleString("en-IN")`.

### Auth flow
- `src/App.jsx` bootstraps auth on mount: gets the current session, loads the matching `profiles` row, and writes `userAtom` / `profileAtom` / `authLoadingAtom` (Jotai). It also subscribes to `supabase.auth.onAuthStateChange` to keep atoms fresh.
- Routing is `react-router-dom`. Two wrapper components gate routes:
  - `ProtectedRoute` (`src/components/auth/ProtectedRoute.jsx`): shows a loading spinner while `authLoadingAtom` is true, else redirects unauthenticated users to `/login`.
  - `PublicRoute` (`src/components/auth/PublicRoute.jsx`): the inverse — redirects already-authenticated users away from `/login` to `/`.
- Login is email/password via `supabase.auth.signInWithPassword` in `LoginForm.jsx`.

### Pages & components
- `src/pages/Dashboard.jsx` — the single main page. Holds all domain logic inline: expense/settlement data loading, approval/denial, the two-person net-balance calculation, and settlement creation. It also defines local presentational components (`TableHeader`, `TableCell`, `StatusBadge`, `SettlementTable`).
- `src/pages/Login.jsx` — thin wrapper around `LoginForm`.
- `src/components/expense/NewEntryModal.jsx` — modal to create an expense. Embeds a **hard-coded two-person assumption**: it finds the first profile whose id ≠ the current user's and assigns them as `owed_by`.

### Expense / settlement lifecycle
- `expenses` rows move through statuses `pending_approval` → `approved` → `cleared` (or `denied`). The owner (`owed_by`) approves or denies a pending expense. A settlement flips approved expenses to `cleared`.
- `settlements` rows use statuses `clearance_pending` → `cleared`. Only the recipient (`paid_to`) can confirm a settlement; confirming marks related approved expenses between the two parties as `cleared`.
- Payments are iterated from approved expenses only (expenses whose status is exactly `APPROVED`).

## Gotchas / notes

- **Two-person hardcoded model.** The whole domain (net balance, counterparty finding, roommate in `NewEntryModal`) assumes exactly two users. Any change to support more roommates means touching Dashboard's balance logic, the counterparty lookup, and `NewEntryModal`.
- `code.html` and `DESIGN.md` at the repo root are design artifacts (a design-system/mock reference and spec). `DESIGN.md` describes the "Safe" design system tokens; the running app approximates it with hard-coded hex classes rather than consuming the tokens directly.
- The design reflects dates/amounts; new UI should match the existing Inter font, white cards with thin `#ccc9cc`-style borders, and the `₹` + `en-IN` formatting.