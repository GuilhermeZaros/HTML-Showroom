// assets/js/admin/auth.js
// Autenticação: login email+senha, sessão, gate de admin.
// API: window.veraAdmin.auth.{ getSession, isAdmin, signIn, signOut, renderLogin, renderAcessoNegado, getUserEmail }

(function () {
  window.veraAdmin = window.veraAdmin || {};

  async function getSession() {
    const { data } = await window.veraDB.auth.getSession();
    return data.session;
  }

  function isAdmin(session) {
    if (!session) return false;
    const meta = session.user && session.user.app_metadata;
    return meta && meta.role === 'admin';
  }

  function getUserEmail(session) {
    return session && session.user && session.user.email ? session.user.email : '';
  }

  async function signIn(email, senha) {
    const { error } = await window.veraDB.auth.signInWithPassword({ email: email, password: senha });
    if (error) throw error;
  }

  async function signOut() {
    await window.veraDB.auth.signOut();
    location.reload();
  }

  function renderLogin(appEl) {
    appEl.innerHTML =
      '<div class="login-screen">' +
        '<div class="login-card">' +
          '<h1>Admin</h1>' +
          '<p class="subtitle">Vera Molduras Presentes</p>' +
          '<form id="login-form">' +
            '<div class="form-field"><label for="login-email">Email</label><input id="login-email" type="email" required autocomplete="email"></div>' +
            '<div class="form-field"><label for="login-senha">Senha</label><input id="login-senha" type="password" required autocomplete="current-password"></div>' +
            '<button type="submit" class="btn btn-primary" id="login-submit">Entrar</button>' +
          '</form>' +
        '</div>' +
      '</div>';
    const form = appEl.querySelector('#login-form');
    const btn = appEl.querySelector('#login-submit');
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      btn.disabled = true; btn.textContent = 'Entrando…';
      try {
        const email = appEl.querySelector('#login-email').value.trim();
        const senha = appEl.querySelector('#login-senha').value;
        await signIn(email, senha);
        location.reload();
      } catch (err) {
        window.veraAdmin.ui.showToast('Email ou senha incorretos.', 'erro');
        btn.disabled = false; btn.textContent = 'Entrar';
      }
    });
  }

  function renderAcessoNegado(appEl) {
    appEl.innerHTML =
      '<div class="message-screen">' +
        '<h2>Acesso negado</h2>' +
        '<p>Esta conta não tem permissão de admin.</p>' +
        '<button class="btn btn-secondary" id="btn-sair">Sair</button>' +
      '</div>';
    appEl.querySelector('#btn-sair').onclick = signOut;
  }

  window.veraAdmin.auth = {
    getSession: getSession,
    isAdmin: isAdmin,
    signIn: signIn,
    signOut: signOut,
    renderLogin: renderLogin,
    renderAcessoNegado: renderAcessoNegado,
    getUserEmail: getUserEmail
  };
})();
