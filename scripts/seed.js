/* eslint-disable no-console */
const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '..', 'serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(require(serviceAccountPath)) });

const db = admin.firestore();
const auth = admin.auth();

function computeAgeBracket(dateStr) {
  if (!dateStr) return '';
  const dob = new Date(dateStr);
  if (Number.isNaN(dob.getTime())) return '';
  const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000));
  if (age <= 3) return '0-3';
  if (age <= 6) return '4-6';
  if (age <= 9) return '7-9';
  if (age <= 12) return '10-12';
  if (age <= 15) return '13-15';
  if (age <= 18) return '16-18';
  if (age <= 35) return '19-35';
  if (age <= 59) return '36-59';
  return '60+';
}

const users = [
  { email: 'admin@demo.test', password: 'HoosierDemo1!', fullName: 'Admin User', role: 'admin', gender: 'Male', church: 'Indianapolis Central', dateOfBirth: '1980-05-05', phone: '317-555-0101' },
  { email: 'viewer@demo.test', password: 'HoosierDemo1!', fullName: 'Viewer Staff', role: 'viewer', gender: 'Female', church: 'Carmel Hope', dateOfBirth: '1988-03-12' },
  { email: 'prayer@demo.test', password: 'HoosierDemo1!', fullName: 'Prayer Coordinator', role: 'prayerCoordinator', gender: 'Female', church: 'Evansville Grace', dateOfBirth: '1975-09-22' },
  { email: 'attendee1@demo.test', password: 'HoosierDemo1!', fullName: 'Samuel Hayes', role: 'attendee', gender: 'Male', church: 'Fort Wayne North', dateOfBirth: '2002-11-01' },
  { email: 'attendee2@demo.test', password: 'HoosierDemo1!', fullName: 'Mariana Alvarez', role: 'attendee', gender: 'Female', church: 'Bloomington South', dateOfBirth: '1995-07-15' },
  { email: 'attendee3@demo.test', password: 'HoosierDemo1!', fullName: 'George Miller', role: 'attendee', gender: 'Male', church: 'South Bend Hope', dateOfBirth: '1964-02-08' },
  { email: 'attendee4@demo.test', password: 'HoosierDemo1!', fullName: 'Aaliyah Turner', role: 'attendee', gender: 'Female', church: 'Westfield Pathway', dateOfBirth: '2010-04-19' },
  { email: 'attendee5@demo.test', password: 'HoosierDemo1!', fullName: 'Noah Patel', role: 'attendee', gender: 'Male', church: 'Greenwood Mission', dateOfBirth: '2015-09-11' },
  { email: 'attendee6@demo.test', password: 'HoosierDemo1!', fullName: 'Evelyn Brooks', role: 'attendee', gender: 'Female', church: 'Muncie North', dateOfBirth: '1983-06-28' },
  { email: 'attendee7@demo.test', password: 'HoosierDemo1!', fullName: 'Isaac Johnson', role: 'attendee', gender: 'Male', church: 'Indianapolis East', dateOfBirth: '1972-12-30' },
  { email: 'attendee8@demo.test', password: 'HoosierDemo1!', fullName: 'Sophia Carter', role: 'attendee', gender: 'Female', church: 'Terre Haute Central', dateOfBirth: '1990-01-05' },
  { email: 'attendee9@demo.test', password: 'HoosierDemo1!', fullName: 'Liam Nguyen', role: 'attendee', gender: 'Male', church: 'Columbus First', dateOfBirth: '2007-10-09' },
  { email: 'attendee10@demo.test', password: 'HoosierDemo1!', fullName: 'Olivia Martin', role: 'attendee', gender: 'Female', church: 'Anderson Life', dateOfBirth: '2012-05-14' },
  { email: 'attendee11@demo.test', password: 'HoosierDemo1!', fullName: 'Jacob Lee', role: 'attendee', gender: 'Male', church: 'Fishers Mercy', dateOfBirth: '1987-08-08' },
  { email: 'attendee12@demo.test', password: 'HoosierDemo1!', fullName: 'Mia Thompson', role: 'attendee', gender: 'Female', church: 'Lafayette West', dateOfBirth: '1999-02-20' },
  { email: 'attendee13@demo.test', password: 'HoosierDemo1!', fullName: 'Logan Harris', role: 'attendee', gender: 'Male', church: 'Elkhart Valley', dateOfBirth: '1959-07-01' },
  { email: 'attendee14@demo.test', password: 'HoosierDemo1!', fullName: 'Emma Wilson', role: 'attendee', gender: 'Female', church: 'Richmond Hope', dateOfBirth: '2004-03-30' },
  { email: 'attendee15@demo.test', password: 'HoosierDemo1!', fullName: 'William Scott', role: 'attendee', gender: 'Male', church: 'Noblesville West', dateOfBirth: '1978-11-18' },
  { email: 'attendee16@demo.test', password: 'HoosierDemo1!', fullName: 'Ava Ramirez', role: 'attendee', gender: 'Female', church: 'Goshen Grace', dateOfBirth: '2018-12-12' },
  { email: 'attendee17@demo.test', password: 'HoosierDemo1!', fullName: 'Henry Baker', role: 'attendee', gender: 'Male', church: 'Plainfield North', dateOfBirth: '2016-09-02' }
];

const speakers = [
  { id: 'alicia-reynolds', name: 'Pastor Alicia Reynolds', bio: 'Family ministries leader passionate about discipleship.', youtubeChannelUrl: 'https://youtube.com/' },
  { id: 'mark-collins', name: 'Pastor Mark Collins', bio: 'Camp meeting host with a focus on prayer.', youtubeChannelUrl: 'https://youtube.com/' },
  { id: 'eunice-kim', name: 'Dr. Eunice Kim', bio: 'Bible teacher and musician.', youtubeChannelUrl: 'https://youtube.com/' },
  { id: 'david-thompson', name: 'Elder David Thompson', bio: 'Conference elder and evangelism coach.', youtubeChannelUrl: 'https://youtube.com/' }
];

// Canonical schedule collection (previously "events") for June 1-6, 2026.
const schedule = [
  { id: 'sunrise-worship', title: 'Sunrise Worship', description: 'Morning devotion with music and prayer.', startTime: '2026-06-01T06:45:00-05:00', endTime: '2026-06-01T07:30:00-05:00', ageGroups: ['All Ages'], location: 'Main Lawn', speakerId: 'mark-collins', youtubeUrl: 'https://youtube.com/watch?v=dQw4w9WgXcQ' },
  { id: 'youth-rally', title: 'Youth Rally', description: 'Interactive worship for youth.', startTime: '2026-06-01T10:00:00-05:00', endTime: '2026-06-01T11:30:00-05:00', ageGroups: ['13-15', '16-18'], location: 'Youth Tent', speakerId: 'alicia-reynolds' },
  { id: 'bible-seminar', title: 'Bible Seminar', description: 'Deep dive into the Gospels.', startTime: '2026-06-01T15:00:00-05:00', endTime: '2026-06-01T16:30:00-05:00', ageGroups: ['19-35', '36-59'], location: 'Chapel', speakerId: 'eunice-kim', youtubeUrl: 'https://youtube.com/watch?v=aqz-KE-bpKQ' },
  { id: 'family-panel', title: 'Family Panel', description: 'Practical tools for families.', startTime: '2026-06-02T09:00:00-05:00', endTime: '2026-06-02T10:30:00-05:00', ageGroups: ['All Ages'], location: 'Main Hall', speakerId: 'alicia-reynolds' },
  { id: 'prayer-walk', title: 'Prayer Walk', description: 'Campus prayer walk led by staff.', startTime: '2026-06-02T12:30:00-05:00', endTime: '2026-06-02T13:30:00-05:00', ageGroups: ['All Ages'], location: 'Camp Grounds', speakerId: 'mark-collins' },
  { id: 'youth-workshop', title: 'Youth Workshop', description: 'Hands-on workshop for youth leaders.', startTime: '2026-06-02T15:30:00-05:00', endTime: '2026-06-02T17:00:00-05:00', ageGroups: ['16-18', '19-35'], location: 'Youth Tent', speakerId: 'david-thompson' },
  { id: 'evening-service', title: 'Evening Service', description: 'Conference-wide worship service.', startTime: '2026-06-02T19:00:00-05:00', endTime: '2026-06-02T20:30:00-05:00', ageGroups: ['All Ages'], location: 'Main Auditorium', speakerId: 'eunice-kim', youtubeUrl: 'https://youtube.com/watch?v=oHg5SJYRHA0' },
  { id: 'kids-story', title: 'Kids Story Hour', description: 'Story time and crafts for kids.', startTime: '2026-06-04T09:30:00-05:00', endTime: '2026-06-04T10:30:00-05:00', ageGroups: ['0-3', '4-6', '7-9', '10-12'], location: 'Kids Tent', speakerId: 'alicia-reynolds' },
  { id: 'music-night', title: 'Music Night', description: 'Concert from regional churches.', startTime: '2026-06-05T18:00:00-05:00', endTime: '2026-06-05T19:30:00-05:00', ageGroups: ['All Ages'], location: 'Main Auditorium', speakerId: 'david-thompson' },
  { id: 'closing-service', title: 'Closing Service', description: 'Celebration and sending.', startTime: '2026-06-06T11:00:00-05:00', endTime: '2026-06-06T12:15:00-05:00', ageGroups: ['All Ages'], location: 'Main Auditorium', speakerId: 'mark-collins', youtubeUrl: 'https://youtube.com/watch?v=5NV6Rdv1a3I' }
];

const announcements = [
  { title: 'Welcome to Camp Meeting', message: 'Check-in opens at 6:30 AM at the main gate.' },
  { title: 'Meal Times', message: 'Breakfast 7 AM, Lunch 12 PM, Dinner 6 PM at the dining hall.' },
  { title: 'Prayer Room Open', message: 'Quiet prayer room available in the chapel all day.' },
  { title: 'Youth Sports', message: 'Basketball tournament signups close at noon.' },
  { title: 'Livestream', message: 'Main services livestreamed on YouTube for remote viewers.' }
];

async function upsertUser(u) {
  let uid;
  try {
    const existing = await auth.getUserByEmail(u.email);
    uid = existing.uid;
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      const created = await auth.createUser({ email: u.email, password: u.password, displayName: u.fullName });
      uid = created.uid;
    } else {
      throw err;
    }
  }
  await auth.setCustomUserClaims(uid, { role: u.role });
  const profile = {
    fullName: u.fullName,
    email: u.email,
    phone: u.phone || '',
    maritalStatus: u.maritalStatus || '',
    gender: u.gender || '',
    dateOfBirth: u.dateOfBirth || '',
    ageBracket: computeAgeBracket(u.dateOfBirth),
    church: u.church || '',
    role: u.role,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
  await db.collection('users').doc(uid).set(profile, { merge: true });
  return uid;
}

async function seedSpeakers() {
  const batch = db.batch();
  speakers.forEach((s) => {
    const ref = db.collection('speakers').doc(s.id);
    batch.set(ref, s);
  });
  await batch.commit();
}

async function seedSchedule() {
  const batch = db.batch();
  schedule.forEach((ev) => {
    const ref = db.collection('schedule').doc(ev.id);
    const startTime = admin.firestore.Timestamp.fromDate(new Date(ev.startTime));
    const endTime = admin.firestore.Timestamp.fromDate(new Date(ev.endTime));
    const speaker = speakers.find((s) => s.id === ev.speakerId);
    batch.set(ref, { ...ev, startTime, endTime, speakerName: speaker ? speaker.name : ev.speakerId });
  });
  await batch.commit();
}

async function seedAnnouncements() {
  const batch = db.batch();
  announcements.forEach((a) => {
    const ref = db.collection('announcements').doc();
    batch.set(ref, { ...a, timestamp: admin.firestore.FieldValue.serverTimestamp(), audience: 'all' });
  });
  await batch.commit();
}

async function seedPrayerRequests(userLookup) {
  const sample = [
    { email: 'attendee1@demo.test', requestText: 'Pray for my family traveling to camp.', status: 'pending', isAnonymous: false },
    { email: 'attendee2@demo.test', requestText: 'Guidance for college decisions.', status: 'pending', isAnonymous: false },
    { email: 'attendee3@demo.test', requestText: 'Health recovery for a friend.', status: 'prayedFor', isAnonymous: false },
    { email: 'attendee4@demo.test', requestText: 'Encouragement for our youth.', status: 'pending', isAnonymous: true },
    { email: 'attendee5@demo.test', requestText: 'Thankful for safe arrival.', status: 'prayedFor', isAnonymous: false },
    { email: 'attendee6@demo.test', requestText: 'Pray for church outreach next month.', status: 'pending', isAnonymous: false }
  ];
  const batch = db.batch();
  sample.forEach((p) => {
    const ref = db.collection('prayerRequests').doc();
    const userId = p.isAnonymous ? null : userLookup[p.email];
    batch.set(ref, {
      requestText: p.requestText,
      isAnonymous: p.isAnonymous,
      userId,
      status: p.status,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: null
    });
  });
  await batch.commit();
}

async function seedFeedback(userLookup) {
  const eventIds = schedule.slice(0, 4).map((e) => e.id);
  const sample = [
    { email: 'attendee7@demo.test', type: 'overall', positives: 'Loved the community feel.', improvements: 'More signage would help.', questions: 'Will slides be shared?', isAnonymous: false },
    { email: 'attendee8@demo.test', type: 'session', eventId: eventIds[0], positives: 'Powerful worship.', improvements: 'Need more shade.', questions: '', isAnonymous: false },
    { email: 'attendee9@demo.test', type: 'session', eventId: eventIds[1], positives: 'Great youth energy.', improvements: 'Shorter intro.', questions: '', isAnonymous: false },
    { email: 'attendee10@demo.test', type: 'overall', positives: 'Check-in smooth.', improvements: 'More vegetarian options.', questions: '', isAnonymous: true },
    { email: 'attendee11@demo.test', type: 'session', eventId: eventIds[2], positives: 'Clear teaching.', improvements: 'Provide handouts.', questions: 'Will there be Q&A?', isAnonymous: false },
    { email: 'attendee12@demo.test', type: 'session', eventId: eventIds[3], positives: 'Loved the testimonies.', improvements: 'Better audio mix.', questions: '', isAnonymous: false },
    { email: 'attendee13@demo.test', type: 'overall', positives: 'Campgrounds clean.', improvements: 'More water stations.', questions: '', isAnonymous: false },
    { email: 'attendee14@demo.test', type: 'session', eventId: eventIds[0], positives: 'Music was uplifting.', improvements: 'Seats were limited.', questions: '', isAnonymous: false },
    { email: 'attendee15@demo.test', type: 'overall', positives: 'Strong sense of prayer.', improvements: 'Need clearer map.', questions: '', isAnonymous: true },
    { email: 'attendee16@demo.test', type: 'session', eventId: eventIds[2], positives: 'Kids loved it.', improvements: 'More crafts.', questions: '', isAnonymous: false },
    { email: 'attendee17@demo.test', type: 'overall', positives: 'Great hospitality.', improvements: 'Parking lot signage.', questions: '', isAnonymous: false },
    { email: 'attendee1@demo.test', type: 'session', eventId: eventIds[1], positives: 'Youth engaged.', improvements: 'Add discussion groups.', questions: '', isAnonymous: false }
  ];
  const batch = db.batch();
  sample.forEach((f) => {
    const ref = db.collection('feedback').doc();
    batch.set(ref, {
      type: f.type,
      eventId: f.eventId || null,
      positives: f.positives,
      improvements: f.improvements,
      questions: f.questions,
      isAnonymous: f.isAnonymous,
      userId: f.isAnonymous ? null : userLookup[f.email],
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      flags: { needsResponse: false }
    });
  });
  await batch.commit();
}

async function main() {
  console.log('Seeding Hoosier Camp Meeting demo...');
  const userLookup = {};
  for (const u of users) {
    const uid = await upsertUser(u);
    userLookup[u.email] = uid;
    console.log('User ready:', u.email);
  }

  await seedSpeakers();
  await seedSchedule();
  await seedAnnouncements();
  await seedPrayerRequests(userLookup);
  await seedFeedback(userLookup);

  console.log('Seed complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

