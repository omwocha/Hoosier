(function() {
  function currentReturnUrl() {
    return window.location.pathname + (window.location.hash || '');
  }

  function redirectToLogin(returnUrl) {
    const encoded = encodeURIComponent(returnUrl || currentReturnUrl());
    window.location.href = `/login.html?return=${encoded}`;
  }

  window.HCMRouterGuards = {
    redirectToLogin,
    currentReturnUrl
  };
})();
