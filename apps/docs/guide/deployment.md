# Deployment

Blazing CMS ships a static admin SPA to **Firebase Hosting**. Because the
backend is entirely client-side (Firebase Auth, Firestore, Storage), there are no
servers to run.

## Prerequisites

- A Firebase project created at [Firebase console](https://console.firebase.google.com)
- Firebase CLI installed: `npm install -g firebase-tools`
- Logged in: `firebase login`

## 1. Configure

Make sure your project uses Firebase mode, not the mock backend:

```bash
# .env
VITE_BACKEND_MODE=firebase
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=my-cms
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_APP_ID=...
```

## 2. Init Firebase Hosting

Run once to create `firebase.json` and `.firebaserc`:

```bash
firebase init hosting
```

Select your project and use the build output directory (the default admin build
output — the CLI prints the path after `blaze build`).

## 3. Build

```bash
blaze build
```

This runs code generation and a production Vite build of the admin panel.

## 4. Deploy Rules and Indexes

The generated Firestore security rules and composite indexes must be deployed:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

## 5. Deploy Hosting

```bash
blaze deploy                  # current project
blaze deploy --project my-cms # specific project
```

`blaze deploy` runs `npx firebase deploy --only hosting` for the target project.

## Continuous Deployment

A typical GitHub Actions workflow:

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: pnpm/action-setup@v4
  - run: pnpm install --frozen-lockfile
  - run: pnpm build
  - run: npx firebase deploy --only hosting,firestore:rules,firestore:indexes
    env:
      FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

## Emulator / Local Mode

For local development without a Firebase project, set `VITE_BACKEND_MODE=mock`
or use `blaze dev --emulator` with the Firebase Emulator Suite. See
[Getting Started](/guide/getting-started).

## Troubleshooting

| Symptom                        | Fix                                                                                                             |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `firebase.json not found`      | Run `firebase init hosting` first.                                                                              |
| `Invalid project id` on deploy | Pass `--project <id>` and confirm `.firebaserc` matches.                                                        |
| Reads fail in the deployed app | Deploy `firestore.rules` (`firebase deploy --only firestore:rules`) and verify `.env` uses the live project id. |
| Auth domain mismatch           | Update `VITE_FIREBASE_AUTH_DOMAIN` to your `*.firebaseapp.com` domain.                                          |
