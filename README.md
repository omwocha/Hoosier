# Hoosier Camp Meeting Demo

Firebase Hosting demo for the Indiana Conference Hoosier Camp Meeting app. HTML/CSS/JS (no build step) with Firebase Auth + Firestore. Demo-only data; not for production.

Config is embedded in `public/index.html` and `public/js/app.js`; no .env required.

## Project Structure
- public/index.html: single-page UI with hash/query routing for attendee/admin screens
- public/css/styles.css: theme styling (navy/slate, clean layout)
- public/js/app.js: Firebase wiring, routing, data rendering (firebaseConfig is hard-coded)
- firebase.json: Hosting config (rewrite all to index.html)
- firestore.rules: Security rules aligned with roles
- scripts/seed.js: Node seed script for demo data

## Prerequisites
- Firebase project with Hosting, Auth, and Firestore enabled (config is already hard-coded in the UI for project `hoosier-camp`)
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
   - 4 speakers, 10 events, 5 announcements
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

### Creating initial admins or prayer coordinators
- In Firebase Auth, create the user (email/password).
- In Firestore, set `users/{uid}` `role` to `admin`, `viewer`, or `prayerCoordinator` (other fields optional). This bypass is allowed via console for the initial seed/admin bootstrapping.
- Optional: also set custom claim `role` via Firebase console/CLI, but rules rely on the role field in the user doc for this demo.

## Resetting the Demo
1) Delete collections in Firestore (users, events, speakers, announcements, prayerRequests, feedback). Simple approach: use Firestore console with filters or `firebase firestore:delete` commands.
2) Re-run `npm run seed` to repopulate.
3) If you cleared Auth users, rerun seed to recreate accounts/claims.

## Data Model (Firestore)
- users/{uid}: fullName, email, phone, maritalStatus, gender, dateOfBirth, ageBracket, church, role, timestamps
- events/{eventId}: title, description, startTime, endTime, ageGroups, location, speakerId, youtubeUrl
- speakers/{speakerId}: name, bio, photoUrl?, youtubeChannelUrl?
- announcements/{announcementId}: title, message, timestamp, audience
- prayerRequests/{id}: requestText, isAnonymous, userId (nullable), status (pending|prayedFor), timestamp, updatedBy
- feedback/{id}: type (session|overall), eventId?, positives, improvements, questions, isAnonymous, userId?, timestamp, flags.needsResponse

## Security Rules Highlights
- users: attendees read/write only their doc; admin/viewer can read all; only admin can change roles
- events/speakers/announcements: public read; admin write
- prayerRequests: signed-in create; user reads own; admin/prayerCoordinator read/update status
- feedback: signed-in create; admin/viewer read; admin update/delete

## Giving Link
External only for demo: redirects to AdventistGiving; no payments handled in app.

## Hash Routes
Attendee: /, /login, /profile, /home, /schedule, /event/:id, /announcements, /prayer, /feedback, /giving
Admin: /admin, /admin/announcements, /admin/prayer, /admin/analytics, /admin/feedback

## Notes
- Age bracket computed client-side at registration/profile save.
- No capacity enforcement or payments. Notifications are in-app only via announcements.
- Uses Firebase CDN scripts (no build tooling, no Vite).
