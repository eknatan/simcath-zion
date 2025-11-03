# Repository Guidelines

## Project Structure & Module Organization
- `src/app/` hosts App Router entry points, route handlers, and server actions. Keep new routes colocated with their UI, and reuse shared layouts when possible.
- `src/components/` contains reusable client components; group related UI in subfolders and prefer barrel exports for clarity.
- `src/lib/`, `src/contexts/`, and `src/types/` centralize utilities, providers, and shared TypeScript contracts. Extend these instead of redefining helpers.
- `public/` holds static assets. Data seeds, SQL, and storage rules live under `supabase/` and `migrations/`. Shared copy and localization files live in `messages/`.

## Build, Test, and Development Commands
- `npm install` — install or refresh dependencies before any new work.
- `npm run dev` — launch the Next.js dev server with hot reload at `http://localhost:3000`.
- `npm run build` — create an optimized production bundle; run before deployment-critical changes.
- `npm run start` — serve the production build locally to verify server behavior.
- `npm run lint` — execute the Next.js/ESLint ruleset; fix warnings before review.

## Coding Style & Naming Conventions
- TypeScript-first: default to `.tsx` for UI and `.ts` for shared logic. Use 2-space indentation and type imports when available.
- Follow the existing idioms: functional React components, hooks at top-level, Tailwind utility classes for styling, and `clsx`/`tailwind-merge` for dynamic styles.
- Keep component and file names in PascalCase, hooks/utilities in camelCase, and directories in kebab-case. Let ESLint (configured in `eslint.config.mjs`) guide formatting and safe patterns.

## Testing Guidelines
- Automated tests are not yet enforced; when adding coverage, colocate unit tests beside the source as `*.test.ts(x)` and prefer React Testing Library for UI.
- Smoke-test critical flows manually (`npm run dev`) and document gaps in the PR if you cannot automate them.
- Maintain data fixtures under `supabase/` or `migrations/` when backend state is required for tests.

## Commit & Pull Request Guidelines
- Commits in history use concise, sentence-style subjects (e.g., “Remove debug logging...”); continue that pattern and group related changes together.
- One commit per logical change is ideal; larger features may use a short stack of well-scoped commits.
- Pull requests should describe the problem, solution, and testing performed. Link Supabase migrations or scripts touched, and include screenshots for UI updates when practical.
- Ensure the PR is lint-clean and builds locally before requesting review; note any follow-up tasks explicitly.

## Environment & Configuration
- Required secrets belong in `.env.local`; never commit them. Document new keys in the PR description and share via the secure channel the team uses.
- Supabase credentials and migrations must stay synchronized—run pending migrations locally before pushing schema-dependent code.
