# DEMO_WALKTHROUGH

Use this checklist to walk the board through the demo flows. All data is demo-only.

## Pre-demo
- Run `npm run seed` to populate accounts/data (see README for credentials)
- Deploy or `firebase serve --only hosting` so routing works (#/ paths)
- Open the site in a fresh incognito window to avoid cached auth state

## Cookie Consent (demo)
- On first visit, show the cookie banner (Accept Optional / Reject Optional / Preferences).
- Accept, reject, then reopen via footer “Cookie Preferences”; show optional toggle.

## Auth Flow
- Go to `/login.html`
- Email/password: sign in as `attendee1@demo.test` (HoosierDemo1!)
- Password reset: click “Forgot Password” and show prompt workflow
- Google Sign-In: click “Continue with Google” (after enabling provider in console) to demo OAuth
- Note: landing on a protected link redirects to `/login.html?return=...`; after sign-in, it returns to the original page

## Attendee Flow
- `/home`: show profile snapshot, upcoming sessions, announcements, and prayer preview
- `/profile`: update a field (e.g., phone/church) and save; explain age bracket auto-calculated
- `/schedule`: browse list, click into `#/event?id=<id>` to show details + YouTube link
- `/announcements`: note real-time feed from staff
- `/prayer`: submit a request (optionally anonymous), see it in “My Requests” with pending status
- `/feedback`: submit a session or overall entry (optionally anonymous)
- `/giving`: click out to external giving link (no payments inside app)

## Admin/Staff Flow
- Sign out, then log in as Admin `admin@demo.test`
- `/admin`: show role badge and navigation tiles
- `/admin/announcements`: post a new announcement; switch to `/announcements` tab to show real-time update
- `/admin/prayer`: view queue (includes anonymous); change a status to prayedFor
- `/admin/analytics`: show counts by age bracket, gender, and church
- `/admin/feedback`: filter by type, search text, and flag “needs response” on an entry
- Optional: log in as `prayer@demo.test` to show prayerCoordinator-only view (can update prayer statuses, no other admin writes)

## Reset During Demo
- If you need a clean slate, delete collections (users, events, speakers, announcements, prayerRequests, feedback) in Firestore console, then rerun `npm run seed`.
