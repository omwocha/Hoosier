# Hoosier Camp Meeting Demo

Firebase Hosting demo for the Indiana Conference Hoosier Camp Meeting app. HTML/CSS/JS (no build step) with Firebase Auth + Firestore. Demo-only data; not for production.

Config is embedded in `public/js/firebase-init.js`; no .env required.

## Project Structure
- public/index.html: single-page UI with hash/query routing for attendee/admin screens
- public/login.html: dedicated login/sign-up + Google Sign-In page
- public/css/styles.css: theme styling (navy/slate, clean layout)
- public/js/firebase-init.js: initializes Firebase with the hard-coded config
- public/js/auth.js: shared auth helpers (email/password, Google, password reset, user doc provisioning)
- public/js/router-guards.js: redirects unauthenticated users to login with return URL
- public/js/app.js: Firebase wiring, routing, data rendering
- firebase.json: Hosting config (rewrite all to index.html)
- firestore.rules: Security rules aligned with roles
- scripts/seed.js: Node seed script for demo data

## Cookie Consent (Demo)
- Shows a bottom banner on first visit with Accept Optional / Reject Optional and Preferences.
- Stores decision in localStorage keys: `cookieConsent.v1.choice`, `cookieConsent.v1.optional`, `cookieConsent.v1.timestamp`.
- Optional features only run when optional=true; placeholder logs where analytics would initialize.
- Reopen preferences via the footer link “Cookie Preferences”.
- Reset for testing by clearing those keys in the browser devtools (or clearing site data).

## Auth (Email/Password + Google)
- Login page: `/login.html`
- Email/password login + registration, password reset, Google Sign-In (popup with redirect fallback).
- On first login, a Firestore user doc is created/merged with uid, fullName, email, authProvider, role=attendee, timestamps.
- Protected routes redirect to `/login.html?return=<original>`; on success redirect back (default `/index.html#/home`).

### Enable Google Sign-In
1) Firebase Console → Auth → Sign-in method → Google → Enable.
2) Authorized domains: include your Firebase Hosting domain and `localhost` (plus `127.0.0.1` if used locally).

### Creating initial admins or prayer coordinators
- In Firebase Auth, create the user (email/password or Google).
- In Firestore, set `users/{uid}` `role` to `admin`, `viewer`, or `prayerCoordinator` (other fields optional). Console edit is fine for demo bootstrapping.
- Optional: set custom claim `role` via console/CLI; rules rely on the role field for this demo.

## Prerequisites
- Firebase project with Hosting, Auth, and Firestore enabled (config is already hard-coded for `hoosier-camp`)
- Node 18+ only if you plan to run the seed script (frontend requires no npm install)
- Service account key only if running the seed script (store as serviceAccountKey.json or set GOOGLE_APPLICATION_CREDENTIALS)

## Local Development (no build step)
1) Serve: `firebase serve --only hosting` (frontend works without npm)
2) Optional emulators for data: `firebase emulators:start --only hosting,firestore,auth`

## Deploy to Firebase Hosting
1) Login: `firebase login`
2) Confirm project alias in .firebaserc (`hoosier-camp`) or run `firebase use <projectId>`
3) Deploy hosting + rules: `firebase deploy --only hosting,firestore:rules`

## Seeding Demo Data (optional)
1) Place your service account JSON at `./serviceAccountKey.json` or set `GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json`
2) Install deps for seeding: `npm install`
3) Run `npm run seed`
   - Seeds 20 users (admin/viewer/prayerCoordinator + attendees)
   - 4 speakers, 10 schedule items for June 1-6, 2026, 5 announcements
   - 6 prayer requests, 12 feedback entries
   - Sets custom claims for staff roles and writes role on user docs

### Demo Accounts (after seed)
- Admin: `admin@demo.test` / `HoosierDemo1!`
- Viewer (reports only): `viewer@demo.test` / `HoosierDemo1!`
- Prayer Coordinator: `prayer@demo.test` / `HoosierDemo1!`
- Attendees: `attendee1@demo.test` ... `attendee17@demo.test` (same password)

## Roles and Access
- attendee: default; can manage own profile, submit prayer/feedback, view own prayers
- admin: full control, can post announcements, update prayer statuses, view analytics, review/flag feedback
- viewer: read-only admin reports (announcements feed is public, admin pages limited to reports)
- prayerCoordinator: manage prayer queue (read/update), no other admin writes

## Resetting the Demo
1) Delete collections in Firestore (users, schedule, speakers, announcements, prayerRequests, feedback; legacy events is deprecated). Simple approach: use Firestore console with filters or `firebase firestore:delete` commands.
2) Re-run `npm run seed` to repopulate.
3) If you cleared Auth users, rerun seed to recreate accounts/claims.

## Data Model (Firestore)
- users/{uid}: fullName, email, phone, maritalStatus, gender, dateOfBirth, ageBracket, church, role, timestamps
- schedule/{eventId}: title, description, startTime, endTime, ageGroups, location, speakerId, youtubeUrl
- speakers/{speakerId}: name, bio, photoUrl?, youtubeChannelUrl?
- announcements/{announcementId}: title, message, timestamp, audience
- prayerRequests/{id}: requestText, isAnonymous, userId (nullable), status (pending|prayedFor), timestamp, updatedBy
- feedback/{id}: type (session|overall), eventId?, positives, improvements, questions, isAnonymous, userId?, timestamp, flags.needsResponse

## Security Rules Highlights
- users: attendees read/write only their doc; admin/viewer can read all; only admin can change roles (role writes blocked for self-service)
- schedule/speakers/announcements: public read; admin write
- prayerRequests: signed-in create; user reads own; admin/prayerCoordinator read/update status
- feedback: signed-in create; admin/viewer read; admin update/delete

## Giving Link
External only for demo: redirects to AdventistGiving; no payments handled in app.

## Legal Pages (Demo)
- Terms: `/terms.html`; Privacy: `/privacy.html`
- Login/register links reference these pages; sign-up requires accepting them.
- Cookie banner links to Privacy and stores consent in localStorage.
- Donations link out to AdventistGiving, which has its own terms and privacy policy.

## Routes
- Login: /login.html
- Attendee: / (landing), /home, /profile, /schedule, /event?id=..., /announcements, /prayer, /feedback, /giving
- Admin: /admin, /admin/announcements, /admin/prayer, /admin/analytics, /admin/feedback

## Notes
- Age bracket computed client-side at registration/profile save.
- No capacity enforcement or payments. Notifications are in-app only via announcements.
- Uses Firebase CDN scripts (no build tooling, no Vite).
- Canonical calendar collection is `schedule` (legacy `events` is read-only); run `scripts/seed.js` to populate June 1-6, 2026 demo data.
