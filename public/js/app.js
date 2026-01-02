(function() {
  const state = {
    user: null,
    profile: null,
    events: [],
    eventsMap: new Map(),
    announcements: [],
    myPrayers: [],
    adminPrayers: [],
    feedback: [],
    users: []
  };

  const routeConfig = {
    '/': { requiresAuth: false },
    '/home': { requiresAuth: true },
    '/profile': { requiresAuth: true },
    '/schedule': { requiresAuth: false },
    '/event': { requiresAuth: false },
    '/announcements': { requiresAuth: false },
    '/prayer': { requiresAuth: true },
    '/feedback': { requiresAuth: true },
    '/giving': { requiresAuth: false },
    '/admin': { requiresRole: ['admin', 'viewer', 'prayerCoordinator'] },
    '/admin/announcements': { requiresRole: ['admin'] },
    '/admin/prayer': { requiresRole: ['admin', 'prayerCoordinator'] },
    '/admin/analytics': { requiresRole: ['admin', 'viewer'] },
    '/admin/feedback': { requiresRole: ['admin', 'viewer'] }
  };

  let auth, db;
  let unsubAnnouncements = null;
  let unsubMyPrayers = null;
  let unsubAdminPrayers = null;
  let unsubFeedback = null;
  let usersLoadedForAnalytics = false;

  function init() {
    if (!firebase.apps.length) {
      console.warn('Firebase not initialized');
      return;
    }
    auth = firebase.auth();
    db = firebase.firestore();

    bindForms();
    window.addEventListener('hashchange', handleRouteChange);

    auth.onAuthStateChanged(async (user) => {
      state.user = user;
      if (user) {
        const provider = user.providerData?.[0]?.providerId || 'password';
        if (window.HCMAuth?.ensureUserDocument) {
          await HCMAuth.ensureUserDocument(user, provider);
        }
        await loadProfile();
        subscribeCoreData();
        setText('#authStatus', `Signed in as ${user.email}`);
      } else {
        cleanupSubscriptions();
        resetState();
        setText('#authStatus', 'Not signed in');
      }
      updateNav();
      handleRouteChange();
    });

    loadEvents();
    handleRouteChange();
  }

  function cleanupSubscriptions() {
    if (unsubAnnouncements) unsubAnnouncements();
    if (unsubMyPrayers) unsubMyPrayers();
    if (unsubAdminPrayers) unsubAdminPrayers();
    if (unsubFeedback) unsubFeedback();
    unsubAnnouncements = unsubMyPrayers = unsubAdminPrayers = unsubFeedback = null;
    usersLoadedForAnalytics = false;
  }

  function resetState() {
    state.profile = null;
    state.myPrayers = [];
    state.adminPrayers = [];
    state.feedback = [];
    state.users = [];
  }

  function subscribeCoreData() {
    subscribeAnnouncements();
    subscribeMyPrayers();
    subscribeAdminPrayers();
    subscribeFeedback();
    if (hasRole(['admin', 'viewer'])) loadUsersForAnalytics();
  }

  function hasRole(roles) {
    const role = state.profile?.role || 'attendee';
    return roles.includes(role);
  }

  function setText(selector, text) {
    const el = document.querySelector(selector);
    if (el) el.textContent = text;
  }

  function handleRouteChange() {
    const { key, params } = parseRoute(location.hash);
    const guard = routeConfig[key] || { requiresAuth: false };

    if (guard.requiresAuth && !state.user) {
      if (window.HCMRouterGuards?.redirectToLogin) {
        HCMRouterGuards.redirectToLogin(location.pathname + (location.hash || ''));
      } else {
        location.href = '/login.html';
      }
      return;
    }
    if (guard.requiresRole && !hasRole(guard.requiresRole)) {
      if (!state.user) {
        if (window.HCMRouterGuards?.redirectToLogin) {
          HCMRouterGuards.redirectToLogin(location.pathname + (location.hash || ''));
        } else {
          location.href = '/login.html';
        }
      } else {
        location.hash = '#/home';
      }
      return;
    }

    showSection(key);
    renderForRoute(key, params);
    highlightNav(key);
  }

  function parseRoute(hash) {
    const clean = (hash || '').replace('#', '') || '/';
    if (clean.startsWith('/event')) {
      if (clean.includes('?id=')) {
        const id = clean.split('?id=')[1];
        return { key: '/event', params: { id } };
      }
      if (clean.startsWith('/event/')) {
        const id = clean.split('/')[2];
        return { key: '/event', params: { id } };
      }
    }
    return { key: clean, params: {} };
  }

  function showSection(routeKey) {
    document.querySelectorAll('[data-route]').forEach((sec) => {
      const active = sec.getAttribute('data-route') === routeKey;
      sec.classList.toggle('active', active);
    });
  }

  function highlightNav(routeKey) {
    document.querySelectorAll('.nav-link').forEach((link) => {
      const navKey = link.getAttribute('href').replace('#', '');
      link.classList.toggle('active', navKey === routeKey || (routeKey === '/event/:id' && navKey === '/schedule'));
    });
  }

  function updateNav() {
    const loggedIn = !!state.user;
    document.querySelectorAll('.nav-link-auth').forEach((n) => n.style.display = loggedIn ? 'inline-block' : 'none');
    document.querySelectorAll('.nav-link-admin').forEach((n) => n.style.display = hasRole(['admin','viewer','prayerCoordinator']) ? 'inline-block' : 'none');
    document.getElementById('logoutBtn').style.display = loggedIn ? 'inline-block' : 'none';
    document.getElementById('loginCta').style.display = loggedIn ? 'none' : 'inline-block';
    setText('#userRoleBadge', state.profile ? (state.profile.role || 'attendee') : 'Guest');
    setText('#adminRoleBadge', state.profile ? (state.profile.role || '-') : '-');
  }

  async function loadProfile() {
    if (!state.user) return;
    const snap = await db.collection('users').doc(state.user.uid).get();
    state.profile = snap.data();
  }

  async function loadEvents() {
    // Use canonical schedule collection (legacy "events" is deprecated).
    const snap = await db.collection('schedule').orderBy('startTime').get();
    state.events = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    state.eventsMap = new Map(state.events.map((e) => [e.id, e]));
    renderSchedule();
    renderHome();
    populateFeedbackEventOptions();
    handleRouteChange();
  }

  function subscribeAnnouncements() {
    if (unsubAnnouncements) unsubAnnouncements();
    unsubAnnouncements = db.collection('announcements').orderBy('timestamp', 'desc').limit(25).onSnapshot((snap) => {
      state.announcements = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      renderAnnouncements();
      renderHome();
    });
  }

  function subscribeMyPrayers() {
    if (unsubMyPrayers) unsubMyPrayers();
    if (!state.user) return;
    unsubMyPrayers = db.collection('prayerRequests')
      .where('userId', '==', state.user.uid)
      .orderBy('timestamp', 'desc')
      .onSnapshot((snap) => {
        state.myPrayers = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        renderMyPrayers();
        renderHome();
      });
  }

  function subscribeAdminPrayers() {
    if (unsubAdminPrayers) unsubAdminPrayers();
    if (!hasRole(['admin','prayerCoordinator'])) return;
    unsubAdminPrayers = db.collection('prayerRequests').orderBy('timestamp', 'desc').limit(50).onSnapshot((snap) => {
      state.adminPrayers = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      renderAdminPrayers();
    });
  }

  function subscribeFeedback() {
    if (unsubFeedback) unsubFeedback();
    if (!hasRole(['admin','viewer'])) return;
    unsubFeedback = db.collection('feedback').orderBy('timestamp', 'desc').limit(100).onSnapshot((snap) => {
      state.feedback = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      renderFeedbackList();
    });
  }

  async function loadUsersForAnalytics() {
    if (!hasRole(['admin','viewer']) || usersLoadedForAnalytics) return;
    const snap = await db.collection('users').get();
    state.users = snap.docs.map((d) => d.data());
    usersLoadedForAnalytics = true;
    renderAnalytics();
  }

  function bindForms() {
    document.getElementById('logoutBtn').addEventListener('click', () => auth.signOut());

    const loginForm = document.getElementById('loginForm');
    loginForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = new FormData(loginForm);
      try {
        await auth.signInWithEmailAndPassword(data.get('email'), data.get('password'));
        location.hash = '#/home';
      } catch (err) {
        alert(err.message);
      }
    });

    const registerForm = document.getElementById('registerForm');
    registerForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = new FormData(registerForm);
      try {
        const cred = await auth.createUserWithEmailAndPassword(data.get('email'), data.get('password'));
        const profile = {
          fullName: data.get('fullName'),
          email: data.get('email'),
          church: data.get('church') || '',
          dateOfBirth: data.get('dateOfBirth') || null,
          ageBracket: computeAgeBracket(data.get('dateOfBirth')),
          role: 'attendee',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        await db.collection('users').doc(cred.user.uid).set(profile, { merge: true });
        location.hash = '#/profile';
      } catch (err) {
        alert(err.message);
      }
    });

    const profileForm = document.getElementById('profileForm');
    profileForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!state.user) return;
      const data = new FormData(profileForm);
      const dob = data.get('dateOfBirth') || null;
      const profile = {
        fullName: data.get('fullName'),
        phone: data.get('phone'),
        church: data.get('church'),
        maritalStatus: data.get('maritalStatus'),
        gender: data.get('gender'),
        dateOfBirth: dob,
        ageBracket: computeAgeBracket(dob),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      try {
        await db.collection('users').doc(state.user.uid).set(profile, { merge: true });
        await loadProfile();
        renderHome();
        alert('Profile saved.');
      } catch (err) {
        alert(err.message);
      }
    });

    const prayerForm = document.getElementById('prayerForm');
    prayerForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!state.user) { alert('Login required'); return; }
      const data = new FormData(prayerForm);
      try {
        await db.collection('prayerRequests').add({
          requestText: data.get('requestText'),
          isAnonymous: data.get('isAnonymous') === 'on',
          userId: data.get('isAnonymous') === 'on' ? null : state.user.uid,
          status: 'pending',
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          updatedBy: null
        });
        prayerForm.reset();
      } catch (err) { alert(err.message); }
    });

    const feedbackForm = document.getElementById('feedbackForm');
    feedbackForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!state.user) { alert('Login required'); return; }
      const data = new FormData(feedbackForm);
      try {
        await db.collection('feedback').add({
          type: data.get('type'),
          eventId: data.get('eventId') || null,
          positives: data.get('positives'),
          improvements: data.get('improvements'),
          questions: data.get('questions'),
          isAnonymous: data.get('isAnonymous') === 'on',
          userId: data.get('isAnonymous') === 'on' ? null : state.user.uid,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          flags: { needsResponse: false }
        });
        feedbackForm.reset();
        alert('Feedback submitted.');
      } catch (err) { alert(err.message); }
    });

    const adminAnnouncementForm = document.getElementById('adminAnnouncementForm');
    adminAnnouncementForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!hasRole(['admin'])) { alert('Admin only'); return; }
      const data = new FormData(adminAnnouncementForm);
      await db.collection('announcements').add({
        title: data.get('title'),
        message: data.get('message'),
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        audience: 'all'
      });
      adminAnnouncementForm.reset();
    });

    const adminPrayerList = document.getElementById('adminPrayerList');
    adminPrayerList?.addEventListener('change', async (e) => {
      const target = e.target;
      if (target.dataset.id && target.name === 'statusSelect') {
        await db.collection('prayerRequests').doc(target.dataset.id).set({
          status: target.value,
          updatedBy: state.user?.uid || null,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }
    });

    const feedbackList = document.getElementById('feedbackList');
    feedbackList?.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-flag-id]');
      if (!btn) return;
      const id = btn.dataset.flagId;
      const current = btn.dataset.flagStatus === 'true';
      await db.collection('feedback').doc(id).set({ flags: { needsResponse: !current } }, { merge: true });
    });

    document.getElementById('feedbackFilterType')?.addEventListener('change', renderFeedbackList);
    document.getElementById('feedbackSearch')?.addEventListener('input', renderFeedbackList);
  }

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

  function renderForRoute(routeKey, params) {
    switch (routeKey) {
      case '/home':
        renderHome();
        break;
      case '/schedule':
        renderSchedule();
        break;
      case '/event/:id':
        renderEventDetail(params.id);
        break;
      case '/announcements':
        renderAnnouncements();
        break;
      case '/prayer':
        renderMyPrayers();
        break;
      case '/admin/announcements':
        renderAdminAnnouncements();
        break;
      case '/admin/prayer':
        renderAdminPrayers();
        break;
      case '/admin/analytics':
        renderAnalytics();
        break;
      case '/admin/feedback':
        renderFeedbackList();
        break;
      default:
        break;
    }
  }

  function renderHome() {
    const summary = document.getElementById('profileSummary');
    if (summary) {
      if (!state.profile) {
        summary.innerHTML = '<p class="muted">Login to see your profile.</p>';
      } else {
        summary.innerHTML = `
          <div><strong>${state.profile.fullName || 'Attendee'}</strong></div>
          <div class="muted small">${state.profile.email || ''}</div>
          <div class="muted small">${state.profile.church || 'Church not set'}</div>
          <div class="muted small">Age Bracket: ${state.profile.ageBracket || '—'}</div>
        `;
      }
    }

    const upcoming = document.getElementById('upcomingList');
    if (upcoming) {
      const items = state.events.slice(0, 3).map(renderEventRow).join('');
      upcoming.innerHTML = items || '<p class="muted">Schedule will appear once seeded.</p>';
    }

    const annPrev = document.getElementById('announcementPreview');
    if (annPrev) {
      annPrev.innerHTML = state.announcements.slice(0, 3).map(renderAnnouncementCard).join('') || '<p class="muted">No announcements yet.</p>';
    }

    const prayerPrev = document.getElementById('prayerPreview');
    if (prayerPrev) {
      prayerPrev.innerHTML = state.myPrayers.slice(0, 3).map(renderPrayerRow).join('') || '<p class="muted">Submit a prayer request to track status.</p>';
    }
  }

  function renderSchedule() {
    const container = document.getElementById('scheduleList');
    if (!container) return;
    container.innerHTML = state.events.map((ev) => `
      <div class="card row">
        <div>
          <div><strong>${ev.title}</strong></div>
          <div class="meta">${formatDate(ev.startTime)} • ${ev.location || 'TBD'}</div>
          <div class="muted small">${ev.ageGroups ? ev.ageGroups.join(', ') : ''}</div>
        </div>
        <a class="button secondary" href="#/event/${ev.id}">Details</a>
      </div>
    `).join('') || '<p class="muted">No events found.</p>';
  }

  function renderEventDetail(id) {
    const ev = state.eventsMap.get(id);
    const detail = document.getElementById('eventDetail');
    if (!ev || !detail) {
      if (detail) detail.innerHTML = '<p class="muted">Event not found.</p>';
      return;
    }
    setText('#eventTitle', ev.title);
    setText('#eventMeta', `${formatDate(ev.startTime)} • ${ev.location || 'TBD'}`);
    detail.innerHTML = `
      <p>${ev.description || 'No description provided.'}</p>
      <p class="muted small">Speaker: ${ev.speakerName || ev.speakerId || 'TBD'}</p>
      ${ev.youtubeUrl ? `<a class="button primary" href="${ev.youtubeUrl}" target="_blank" rel="noreferrer">Watch on YouTube</a>` : ''}
    `;
  }

  function renderAnnouncements() {
    const list = document.getElementById('announcementList');
    if (list) list.innerHTML = state.announcements.map(renderAnnouncementCard).join('') || '<p class="muted">No announcements yet.</p>';
  }

  function renderAnnouncementCard(a) {
    const date = a.timestamp?.toDate ? a.timestamp.toDate() : null;
    return `
      <div class="card">
        <div class="card-header"><strong>${a.title}</strong><span class="muted small">${date ? date.toLocaleString() : ''}</span></div>
        <p>${a.message}</p>
      </div>
    `;
  }

  function renderMyPrayers() {
    const list = document.getElementById('myPrayerList');
    if (!list) return;
    list.innerHTML = state.myPrayers.map(renderPrayerRow).join('') || '<p class="muted">No requests yet.</p>';
  }

  function renderPrayerRow(p) {
    const date = p.timestamp?.toDate ? p.timestamp.toDate() : null;
    const statusClass = p.status === 'prayedFor' ? 'success' : 'warning';
    return `
      <div class="card row">
        <div>
          <div>${p.requestText}</div>
          <div class="muted small">${date ? date.toLocaleString() : ''}</div>
        </div>
        <span class="status-chip ${statusClass}">${p.status}</span>
      </div>
    `;
  }

  function renderAdminAnnouncements() {
    const list = document.getElementById('adminAnnouncementList');
    if (!list) return;
    list.innerHTML = state.announcements.map(renderAnnouncementCard).join('') || '<p class="muted">No announcements yet.</p>';
  }

  function renderAdminPrayers() {
    const list = document.getElementById('adminPrayerList');
    if (!list) return;
    list.innerHTML = state.adminPrayers.map((p) => {
      const date = p.timestamp?.toDate ? p.timestamp.toDate() : null;
      return `
        <div class="card">
          <div class="card-header">
            <strong>${p.isAnonymous ? 'Anonymous' : (p.userId || 'Attendee')}</strong>
            <span class="muted small">${date ? date.toLocaleString() : ''}</span>
          </div>
          <p>${p.requestText}</p>
          <label>Status
            <select name="statusSelect" data-id="${p.id}">
              <option value="pending" ${p.status === 'pending' ? 'selected' : ''}>pending</option>
              <option value="prayedFor" ${p.status === 'prayedFor' ? 'selected' : ''}>prayedFor</option>
            </select>
          </label>
        </div>
      `;
    }).join('') || '<p class="muted">No requests yet.</p>';
  }

  function renderAnalytics() {
    if (!hasRole(['admin','viewer'])) return;
    const summary = document.getElementById('analyticsSummary');
    const details = document.getElementById('analyticsDetails');
    if (!summary || !details) return;

    const ageCounts = countBy(state.users, (u) => u.ageBracket || 'Unknown');
    const genderCounts = countBy(state.users, (u) => u.gender || 'Unknown');
    const churchCounts = countBy(state.users, (u) => u.church || 'Unknown');

    summary.innerHTML = [renderCountCard('By Age Bracket', ageCounts), renderCountCard('By Gender', genderCounts), renderCountCard('By Church', churchCounts)].join('');
    details.innerHTML = Object.entries(churchCounts).map(([k,v]) => `<div class="card row"><div>${k}</div><strong>${v}</strong></div>`).join('');
  }

  function renderCountCard(title, counts) {
    const rows = Object.entries(counts).map(([k,v]) => `<div class="row" style="display:flex; justify-content:space-between;"><span>${k}</span><strong>${v}</strong></div>`).join('');
    return `<div class="card"><h3>${title}</h3>${rows}</div>`;
  }

  function renderFeedbackList() {
    if (!hasRole(['admin','viewer'])) return;
    const list = document.getElementById('feedbackList');
    if (!list) return;
    const filterType = document.getElementById('feedbackFilterType')?.value || '';
    const search = (document.getElementById('feedbackSearch')?.value || '').toLowerCase();

    const filtered = state.feedback.filter((f) => {
      const matchesType = filterType ? f.type === filterType : true;
      const text = `${f.positives || ''} ${f.improvements || ''} ${f.questions || ''}`.toLowerCase();
      const matchesSearch = search ? text.includes(search) : true;
      return matchesType && matchesSearch;
    });

    list.innerHTML = filtered.map((f) => {
      const date = f.timestamp?.toDate ? f.timestamp.toDate() : null;
      return `
        <div class="card">
          <div class="card-header">
            <strong>${f.type} feedback</strong>
            <span class="muted small">${date ? date.toLocaleString() : ''}</span>
          </div>
          <div class="muted small">Event: ${f.eventId || 'N/A'}</div>
          <p><strong>Positives:</strong> ${f.positives || ''}</p>
          <p><strong>Improvements:</strong> ${f.improvements || ''}</p>
          ${f.questions ? `<p><strong>Questions:</strong> ${f.questions}</p>` : ''}
          <button class="button secondary" data-flag-id="${f.id}" data-flag-status="${f.flags?.needsResponse ? 'true' : 'false'}">
            ${f.flags?.needsResponse ? 'Unflag' : 'Flag'} for response
          </button>
        </div>
      `;
    }).join('') || '<p class="muted">No feedback yet.</p>';
  }

  function populateFeedbackEventOptions() {
    const select = document.querySelector('#feedbackForm select[name="eventId"]');
    if (!select) return;
    select.innerHTML = '<option value="">Select a session</option>' + state.events.map((e) => `<option value="${e.id}">${e.title}</option>`).join('');
  }

  function renderEventRow(ev) {
    return `
      <div class="card row">
        <div>
          <div><strong>${ev.title}</strong></div>
          <div class="muted small">${formatDate(ev.startTime)} • ${ev.location || 'TBD'}</div>
        </div>
        <a class="link" href="#/event?id=${ev.id}">Details</a>
      </div>
    `;
  }

  function countBy(arr, fn) {
    return arr.reduce((acc, item) => {
      const key = fn(item);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  function formatDate(val) {
    if (!val) return '';
    if (val.toDate) val = val.toDate();
    return new Date(val).toLocaleString();
  }

  window.addEventListener('load', init);
})();
