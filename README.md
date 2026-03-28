# IDF Kitchen

Mobile-first kitchen operations app for managing food service workflows across one or more bases.

Suggested repo description:
`Multi-base kitchen management app with role-based access, Firebase sync, and web/mobile support.`

## Overview

`idf-kitchen` is a React + Vite application with Capacitor support for Android and iOS. It is designed for daily kitchen operations and gives different experiences to soldiers, cooks, kitchen managers, and app managers.

The app combines operational tracking, staff coordination, and base-specific data in one place, with Firebase/Firestore sync and local cache fallbacks.

## Main App Areas

- Role-based login flow for soldiers, cooks, kitchen managers, and verified `nagad` users
- Multi-base support with separate kitchen data per base
- Inventory management with category tracking, shortages, and quantity updates
- Salads tracking with refill levels, locations, and freshness monitoring
- Hot food tracking with cooking time, temperatures, allergens, and ingredients
- Morning cook assignment and morning opening task management
- Prep task planning for kitchen preparation work
- Bulletin board and daily task board for operational updates
- Soldier feedback collection for meals
- Staff and base management, including verification flow for `nagad` users
- Global search across inventory, staff, tasks, and bulletins
- Printable status report / PDF export

## Roles

- `soldier`: Views meals and submits meal feedback
- `cook`: Works inside kitchen workflows such as inventory, salads, hot food, morning tasks, and prep
- `admin`: Kitchen management access with elevated editing permissions
- `nagad`: Verified kitchen authority with management permissions and base setup capabilities
- `appManager`: Cross-base management scope for staff and app administration

## Stack

- React 19
- Vite 7
- Capacitor 8 for Android and iOS
- Firebase 12 / Firestore
- React Router 7
- Lucide and Phosphor icons

## Data Model Highlights

- Bases are stored independently and can be created from inside the app
- Kitchen data is scoped by `baseId`
- Staff records include role, base assignment, permissions, and category ownership
- Kitchen records include inventory, salads, hot food, bulletins, feedback, morning tasks, prep tasks, and audit history
- Local cache is used as a fallback when cloud sync is unavailable

## Development

```bash
bun install
bun run dev
```

## Web Build

```bash
bun run build
```

## Mobile Build And Sync

Native projects are already present in:

- `android/`
- `ios/`

Use:

```bash
# Build web assets and sync to both platforms
bun run mobile:sync

# Build + sync + open Android Studio project
bun run mobile:android

# Build + sync + open Xcode project
bun run mobile:ios
```

## Firebase And Security Setup

1. Copy `.env.example` to `.env`
2. Fill in the Firebase environment values
3. For stricter production auth, set:

```bash
VITE_ALLOW_ANON_AUTH=false
VITE_FIREBASE_CUSTOM_TOKEN=<signed-token>
```

4. Deploy Firestore rules:

```bash
firebase deploy --only firestore:rules
```

Expected role document model:

- `roles/{auth.uid}`
- `role`: `appManager | nagad | admin | cook | soldier`
- `baseId`: base scope for non-global users

Common auth issue:

- If you see `auth/configuration-not-found`, enable the matching Firebase Authentication provider or provide a valid custom token

## Testing

```bash
npm run test
```
