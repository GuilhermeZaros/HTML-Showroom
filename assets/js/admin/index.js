// assets/js/admin/index.js
// Bootstrap do admin: gate de auth, sidebar, roteamento entre abas.
// Última script carregada — depende de todas as outras.

(function () {
  const SIDEBAR_ITEMS = [
    { key: 'molduras',  label: 'Molduras' },
    { key: 'vidros',    label: 'Vidros' },
    { key: 'chapas',    label: 'Chapas' },
    { key: 'espelhos',  label: 'Espelhos' },
    { key: 'paspaturs', label: 'Paspaturs' },
    { key: 'chassis',   label: 'Chassis' },
    { key: 'config',    label: 'Config' }
  ];

  function renderShell(appEl, session) {
    appEl.innerHTML =
      '<div class="shell">' +
        '<div class="topbar">' +
          '<h1>Vera Molduras — Admin</h1>' +
          '<div class="user-info"><span></span><button class="btn btn-secondary" id="btn-sair">Sair</button></div>' +
        '</div>' +
        '<div class="shell-body">' +
          '<nav class="sidebar" id="sidebar"></nav>' +
          '<main class="main" id="main"></main>' +
        '</div>' +
      '</div>';

    appEl.querySelector('.user-info span').textContent = window.veraAdmin.auth.getUserEmail(session);
    appEl.querySelector('#btn-sair').onclick = window.veraAdmin.auth.signOut;

    const sidebar = appEl.querySelector('#sidebar');
    const main = appEl.querySelector('#main');

    function navegarPara(key) {
      Array.prototype.forEach.call(sidebar.querySelectorAll('.sidebar-item'), function (b) {
        b.classList.toggle('active', b.dataset.key === key);
      });
      if (key === 'config') {
        window.veraAdmin.configCalculo.render(main);
      } else {
        window.veraAdmin.crud.render(key, main);
      }
    }

    SIDEBAR_ITEMS.forEach(function (item) {
      const b = document.createElement('button');
      b.className = 'sidebar-item';
      b.dataset.key = item.key;
      b.textContent = item.label;
      b.onclick = function () { navegarPara(item.key); };
      sidebar.appendChild(b);
    });

    navegarPara('molduras');
  }

  async function bootstrap() {
    const appEl = document.getElementById('app');
    if (!window.veraDB) {
      appEl.innerHTML = '<div class="message-screen"><h2>Erro</h2><p>SDK do Supabase não carregou. Verifique a conexão.</p></div>';
      return;
    }
    try {
      const session = await window.veraAdmin.auth.getSession();
      if (!session) return window.veraAdmin.auth.renderLogin(appEl);
      if (!window.veraAdmin.auth.isAdmin(session)) return window.veraAdmin.auth.renderAcessoNegado(appEl);
      renderShell(appEl, session);
    } catch (err) {
      console.error(err);
      appEl.innerHTML = '<div class="message-screen"><h2>Erro</h2><p>' + (err.message || err) + '</p></div>';
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap);
  else bootstrap();
})();
