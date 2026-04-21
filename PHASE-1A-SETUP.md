# Phase 1A Setup Instructions for JobRadar MVP

## ✅ Completed

### 1. Package.json Updated
- Added: `@prisma/client`, `prisma`, `zustand`, `@tanstack/react-query`, `leaflet`, `@types/leaflet`, `clsx`

### 2. Directory Structure Created
```
src/
├── types/               ✅ CREATED
├── features/
│   ├── search/         ✅ CREATED (components, hooks)
│   ├── jobs/           ✅ CREATED
│   └── profile/        ✅ CREATED
└── server/
    ├── api/jobs/       ✅ CREATED
    └── collectors/     ✅ CREATED
prisma/                 ✅ CREATED
.vscode/                ✅ CREATED
```

### 3. Core TypeScript Files Created

- ✅ `src/types/jobs.ts` - Central JobOffer + related types
- ✅ `src/server/db.ts` - Prisma Client singleton
- ✅ `prisma/schema.prisma` - Database schema (JobOffer model)
- ✅ `.env.local` - Environment template

### 4. Stub Pages Created

- ✅ `src/features/search/page.tsx` 
- ✅ `src/features/jobs/[id]/page.tsx`
- ✅ `src/features/profile/page.tsx`

### 5. Configuration Updates

- ✅ `tsconfig.json` - Added path aliases (@/types, @/server, @/features, etc.)
- ✅ `.gitignore` - Added Prisma migrations + .prisma/
- ✅ `.vscode/tasks.json` - Created npm build tasks

---

## ⏳ NEXT STEPS (Manual - Terminal in VS Code)

### Step 1: Install Dependencies
Open VS Code Terminal and run:
```bash
npm install
```

Or use the Task:
- Press `Ctrl+Shift+B` → Select "npm install"

### Step 2: Generate Prisma Client
```bash
npx prisma generate
```

### Step 3: Verify Build
```bash
npm run build
```

Should complete without errors.

### Step 4: Check TypeScript
```bash
npm run lint
```

Should pass with no errors.

---

## 📋 What's Next (Phase 1B: France Travail Enhancements)

Once npm install completes:
1. Enhance France Travail collector (pagination, location codes)
2. Refactor API routes (`/api/jobs`, `/api/jobs/sync`)
3. Create Homepage
4. Build Search page with split list/map

---

## 🚨 Important Notes

- `DATABASE_URL` in `.env.local` is a placeholder. Replace with your PostgreSQL connection string.
- France Travail credentials remain in the existing `.env.example`
- Node modules will be in `node_modules/` after npm install

---

## 📊 Structure Verification

Run this to verify the structure:
```bash
tree src -L 3
```

Expected output:
```
src/
├── app/
├── collectors/
├── components/
├── features/
│   ├── jobs/
│   ├── profile/
│   └── search/
├── lib/
├── server/
│   ├── api/
│   │   └── jobs/
│   ├── collectors/
│   └── db.ts
└── types/
    └── jobs.ts
```
