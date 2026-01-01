(function() {
  const auth = firebase.auth();
  const db = firebase.firestore();

  async function ensureUserDocument(user, providerId) {
    if (!user) return null;
    const ref = db.collection('users').doc(user.uid);
    const snap = await ref.get();
    if (!snap.exists) {
      const doc = {
        uid: user.uid,
        fullName: user.displayName || '',
        email: user.email || '',
        authProvider: providerId === 'google.com' ? 'google' : 'password',
        role: 'attendee',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      await ref.set(doc, { merge: true });
    } else {
      const existing = snap.data() || {};
      const patch = {
        fullName: existing.fullName || user.displayName || '',
        email: existing.email || user.email || '',
        authProvider: existing.authProvider || (providerId === 'google.com' ? 'google' : 'password'),
        role: existing.role || 'attendee',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      await ref.set(patch, { merge: true });
    }
    return ref;
  }

  function getReturnUrl() {
    const params = new URLSearchParams(window.location.search || '');
    return params.get('return');
  }

  function redirectAfterLogin(returnUrl) {
    const target = returnUrl || '/index.html';
    window.location.href = target;
  }

  async function signInWithGoogle(returnUrl) {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      const result = await auth.signInWithPopup(provider);
      await ensureUserDocument(result.user, 'google.com');
      redirectAfterLogin(returnUrl || getReturnUrl());
    } catch (err) {
      if (err && err.code === 'auth/popup-blocked') {
        await auth.signInWithRedirect(provider);
      } else {
        throw err;
      }
    }
  }

  async function signInWithEmail(email, password, returnUrl) {
    const cred = await auth.signInWithEmailAndPassword(email, password);
    await ensureUserDocument(cred.user, 'password');
    redirectAfterLogin(returnUrl || getReturnUrl());
  }

  async function registerWithEmail(email, password, fullName, returnUrl) {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    if (fullName) {
      await cred.user.updateProfile({ displayName: fullName }).catch(() => {});
    }
    await ensureUserDocument({ ...cred.user, displayName: fullName || cred.user.displayName }, 'password');
    redirectAfterLogin(returnUrl || getReturnUrl());
  }

  async function sendPasswordReset(email) {
    await auth.sendPasswordResetEmail(email);
  }

  function redirectToLoginWithReturn(returnUrl) {
    const encoded = encodeURIComponent(returnUrl || window.location.href);
    window.location.href = `/login.html?return=${encoded}`;
  }

  window.HCMAuth = {
    ensureUserDocument,
    signInWithGoogle,
    signInWithEmail,
    registerWithEmail,
    sendPasswordReset,
    getReturnUrl,
    redirectAfterLogin,
    redirectToLoginWithReturn
  };
})();
