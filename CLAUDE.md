# Claude Code Project Instructions

## About This Project

**Simchat Zion (שמחת ציון)** - Charity organization management system for supporting:
1. **Wedding cases** - Financial support for couples getting married
2. **Sick children cases (cleaning)** - Support for families with sick children

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL + Auth)
- **Language**: TypeScript
- **UI**: React 19, TailwindCSS, shadcn/ui
- **i18n**: next-intl (Hebrew RTL)
- **State**: Jotai, React Query
- **Banking**: Masav (Israeli bank transfer system)
- **Calendar**: Hebrew calendar (@hebcal/core)

## Project Structure

```
src/
├── app/[locale]/(app)/     # Main app routes (protected)
│   ├── dashboard/          # Main dashboard
│   ├── cases/              # Case management (weddings, sick children)
│   ├── applicants/         # Applicant management
│   ├── transfers/          # Bank transfers
│   ├── manual-transfers/   # Manual transfer management
│   ├── calendar/           # Hebrew calendar
│   └── settings/           # System settings
├── components/ui/          # shadcn/ui components
├── lib/
│   ├── services/           # Business logic services
│   ├── api/                # API route handlers
│   ├── supabase/           # Supabase client & queries
│   └── hooks/              # Custom React hooks
├── types/                  # TypeScript types
└── messages/               # i18n translations (he.json)
```

## Key Concepts

### Case Types
- `wedding` - Wedding support cases
- `cleaning` - Sick children support cases (historical name)

### Case Flow
1. Applicant submits request (public form)
2. Admin reviews and approves/rejects
3. Approved cases get bank transfers via Masav
4. Case tracked until completion

### Banking Integration
- **Masav**: Israeli automated bank transfer system
- Generates `.masav` files for batch transfers
- Currency conversion for foreign donations

## Version Management

- Update version in `package.json` with every commit
- Version format: `X.Y.Z` (e.g., 1.3.4)
- **Z (patch)**: Increment for small changes (0-9)
- **Y (minor)**: Increment for major changes, OR when Z reaches 10 (reset Z to 0)
- Example: 1.3.9 -> small change -> 1.4.0
- Version displayed in settings page

## Development Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Run ESLint
```

## Important Notes

- All text is in Hebrew (RTL layout)
- Use existing translation keys from `messages/he.json`
- Follow existing code patterns in similar files
- Database types are in `src/types/supabase.ts` (auto-generated)
