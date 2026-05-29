# Fase 3 — Admin Panel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `admin.html` — a single-page admin app with login, sidebar navigation, modal-based CRUD over all 7 Supabase tables, and photo upload for molduras.

**Architecture:** Vanilla JS with IIFE modules attaching to `window.veraAdmin.*` (no ES modules, so `file://` testing keeps working). One HTML shell, one CSS file, 7 small JS files in `assets/js/admin/`. A declarative `entity-config.js` powers a generic `entity-crud.js` over the 6 product tables; `config-calculo.js` handles the key/value table separately.

**Tech Stack:** Vanilla JavaScript, Supabase JS SDK v2 (CDN UMD bundle), CSS3.

**Reference spec:** `docs/superpowers/specs/2026-05-29-admin-panel-design.md`

---

## File Structure

| Arquivo | Status | Responsabilidade |
|---|---|---|
| `admin.html` | Criar | Página única: login + shell (topbar + sidebar + área de conteúdo). Inclui SDK + scripts na ordem certa. |
| `assets/css/admin.css` | Criar | Reset, layout (grid sidebar/main), login form, sidebar, tabela, modal, toast, botões |
| `assets/js/admin/ui.js` | Criar | `window.veraAdmin.ui` com `showToast`, `openModal`, `closeModal`, `showConfirm` |
| `assets/js/admin/auth.js` | Criar | `window.veraAdmin.auth` com `signIn`, `signOut`, `getSession`, `isAdmin`, `gate` (bootstrap do gate de auth) |
| `assets/js/admin/entity-config.js` | Criar | `window.veraAdmin.ENTITIES` — metadados das 6 tabelas de produto |
| `assets/js/admin/entity-crud.js` | Criar | `window.veraAdmin.crud.render(entityKey)` — renderiza lista + modais usando config |
| `assets/js/admin/photo-upload.js` | Criar | `window.veraAdmin.photo` com `attachPhotoInput` (controla input file + upload + preview + cleanup) |
| `assets/js/admin/config-calculo.js` | Criar | `window.veraAdmin.configCalculo.render()` — tabela key/value especial |
| `assets/js/admin/index.js` | Criar | Bootstrap: aguarda DOM, chama `auth.gate()`, monta sidebar, dispatcha rota inicial |

**Convenção IIFE:** todo arquivo de admin/ começa com `(function() { window.veraAdmin = window.veraAdmin || {}; ... })();`. Evita poluir o global e roda em qualquer browser via `file://`.

**Ordem de carregamento em `admin.html`:** SDK Supabase → supabase-client.js → ui.js → auth.js → entity-config.js → photo-upload.js → entity-crud.js → config-calculo.js → index.js. `index.js` é o último (bootstrap).

---

## Verificação (sem framework de testes)

Cada task ends with **manual browser verification**: abrir `admin.html` localmente, fazer ações específicas, ver resultado esperado. Não tem unit tests — o projeto é estático e o ROI de montar Jest/Vitest pra ~1k linhas de UI vanilla é ruim. A integração com Supabase já é o "test runner" — se a tabela não carrega, o erro é visível.

**Pré-requisito de teste:** o dono já tem um usuário admin com `role=admin` no `app_metadata` (criado na Fase 2, seção 9 de `docs/supabase-setup.md`).

---

## Task 1: HTML shell + CSS base

**Files:**
- Create: `admin.html`
- Create: `assets/css/admin.css`

- [ ] **Step 1: Criar `admin.html`**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin — Vera Molduras</title>
  <link rel="stylesheet" href="assets/css/admin.css">
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="assets/js/supabase-client.js"></script>
</head>
<body>
  <div id="app">
    <div class="loading">Carregando…</div>
  </div>

  <script src="assets/js/admin/ui.js"></script>
  <script src="assets/js/admin/auth.js"></script>
  <script src="assets/js/admin/entity-config.js"></script>
  <script src="assets/js/admin/photo-upload.js"></script>
  <script src="assets/js/admin/entity-crud.js"></script>
  <script src="assets/js/admin/config-calculo.js"></script>
  <script src="assets/js/admin/index.js"></script>
</body>
</html>
```

- [ ] **Step 2: Criar `assets/css/admin.css`**

```css
/* ============================================================
   Vera Molduras — Admin Panel CSS
   ============================================================ */

:root {
  --admin-bg:        #f6f5f2;
  --admin-surface:   #ffffff;
  --admin-border:    #e3dfd7;
  --admin-text:      #2a2622;
  --admin-muted:     #8a8278;
  --admin-accent:    #8b6f3f;
  --admin-accent-2:  #6e5630;
  --admin-danger:    #b34a3a;
  --admin-success:   #3f7d52;
  --admin-shadow:    0 4px 16px rgba(40, 30, 20, 0.08);
  --admin-radius:    6px;
  --sidebar-width:   220px;
  --topbar-height:   56px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; height: 100%; background: var(--admin-bg); color: var(--admin-text); }
#app { min-height: 100vh; }

.loading { display: flex; align-items: center; justify-content: center; min-height: 100vh; color: var(--admin-muted); }

/* ----- Login screen ----- */
.login-screen {
  display: flex; align-items: center; justify-content: center;
  min-height: 100vh; padding: 1rem;
}
.login-card {
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius);
  box-shadow: var(--admin-shadow);
  padding: 2rem; width: 100%; max-width: 380px;
}
.login-card h1 { margin: 0 0 0.25rem; font-size: 1.5rem; }
.login-card p.subtitle { margin: 0 0 1.5rem; color: var(--admin-muted); font-size: 0.9rem; }
.login-card form { display: flex; flex-direction: column; gap: 0.75rem; }
.login-card label { font-size: 0.85rem; font-weight: 600; }
.login-card input { padding: 0.6rem 0.75rem; border: 1px solid var(--admin-border); border-radius: var(--admin-radius); font-size: 1rem; }
.login-card input:focus { outline: 2px solid var(--admin-accent); outline-offset: -1px; border-color: var(--admin-accent); }

/* ----- Buttons ----- */
.btn {
  cursor: pointer; padding: 0.55rem 1rem; font-size: 0.95rem;
  border-radius: var(--admin-radius); border: 1px solid transparent;
  font-weight: 600; transition: background 0.15s, opacity 0.15s;
}
.btn-primary   { background: var(--admin-accent); color: white; }
.btn-primary:hover:not(:disabled) { background: var(--admin-accent-2); }
.btn-secondary { background: transparent; color: var(--admin-text); border-color: var(--admin-border); }
.btn-secondary:hover:not(:disabled) { background: var(--admin-bg); }
.btn-danger    { background: var(--admin-danger); color: white; }
.btn-icon      { background: transparent; border: none; padding: 0.25rem 0.5rem; cursor: pointer; font-size: 1rem; }
.btn:disabled  { opacity: 0.6; cursor: not-allowed; }

/* ----- App shell ----- */
.shell { display: grid; grid-template-rows: var(--topbar-height) 1fr; min-height: 100vh; }
.topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 1.5rem; background: var(--admin-surface);
  border-bottom: 1px solid var(--admin-border);
}
.topbar h1 { font-size: 1.15rem; margin: 0; }
.topbar .user-info { display: flex; align-items: center; gap: 1rem; color: var(--admin-muted); font-size: 0.9rem; }

.shell-body { display: grid; grid-template-columns: var(--sidebar-width) 1fr; min-height: calc(100vh - var(--topbar-height)); }

.sidebar {
  background: var(--admin-surface); border-right: 1px solid var(--admin-border);
  padding: 1rem 0;
}
.sidebar-item {
  display: block; width: 100%; text-align: left;
  padding: 0.65rem 1.5rem; border: none; background: transparent;
  cursor: pointer; color: var(--admin-text); font-size: 0.95rem;
}
.sidebar-item:hover { background: var(--admin-bg); }
.sidebar-item.active { background: var(--admin-bg); color: var(--admin-accent); font-weight: 600; border-left: 3px solid var(--admin-accent); padding-left: calc(1.5rem - 3px); }

.main { padding: 1.5rem; overflow-x: auto; }
.main-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.main-header h2 { margin: 0; font-size: 1.4rem; }

/* ----- Table ----- */
.data-table { width: 100%; border-collapse: collapse; background: var(--admin-surface); border: 1px solid var(--admin-border); border-radius: var(--admin-radius); overflow: hidden; }
.data-table th, .data-table td { padding: 0.65rem 0.85rem; text-align: left; border-bottom: 1px solid var(--admin-border); font-size: 0.92rem; }
.data-table th { background: var(--admin-bg); font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--admin-muted); }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr.inativo td { opacity: 0.55; }
.data-table .actions { white-space: nowrap; text-align: right; }
.badge-ativo { font-size: 0.75rem; padding: 0.15rem 0.5rem; border-radius: 999px; background: #e1efe5; color: var(--admin-success); }
.badge-inativo { font-size: 0.75rem; padding: 0.15rem 0.5rem; border-radius: 999px; background: #f0e0db; color: var(--admin-danger); }

.toolbar { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.75rem; font-size: 0.9rem; color: var(--admin-muted); }

/* ----- Modal ----- */
.modal-overlay { position: fixed; inset: 0; background: rgba(20, 15, 10, 0.45); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1rem; }
.modal { background: var(--admin-surface); border-radius: var(--admin-radius); box-shadow: var(--admin-shadow); width: 100%; max-width: 540px; max-height: 90vh; display: flex; flex-direction: column; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid var(--admin-border); }
.modal-header h3 { margin: 0; font-size: 1.1rem; }
.modal-close { background: transparent; border: none; font-size: 1.6rem; cursor: pointer; color: var(--admin-muted); padding: 0; line-height: 1; }
.modal-body { padding: 1.25rem; overflow-y: auto; }
.modal-footer { display: flex; justify-content: flex-end; gap: 0.5rem; padding: 1rem 1.25rem; border-top: 1px solid var(--admin-border); }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem 1rem; }
.form-field { display: flex; flex-direction: column; gap: 0.25rem; }
.form-field.full { grid-column: 1 / -1; }
.form-field label { font-size: 0.82rem; font-weight: 600; }
.form-field label .req { color: var(--admin-danger); }
.form-field input, .form-field textarea, .form-field select {
  padding: 0.5rem 0.65rem; border: 1px solid var(--admin-border); border-radius: var(--admin-radius);
  font-size: 0.95rem; font-family: inherit;
}
.form-field input:focus, .form-field textarea:focus { outline: 2px solid var(--admin-accent); outline-offset: -1px; }
.form-field textarea { resize: vertical; min-height: 70px; }
.form-field.error input, .form-field.error textarea { border-color: var(--admin-danger); }
.form-field-msg { font-size: 0.78rem; color: var(--admin-danger); }
.form-field-help { font-size: 0.78rem; color: var(--admin-muted); }

.photo-preview { display: flex; align-items: center; gap: 0.75rem; }
.photo-preview img { width: 80px; height: 80px; object-fit: cover; border-radius: var(--admin-radius); border: 1px solid var(--admin-border); }

/* ----- Toast ----- */
#toast-container { position: fixed; top: 1rem; right: 1rem; display: flex; flex-direction: column; gap: 0.5rem; z-index: 200; }
.toast { padding: 0.7rem 1rem; border-radius: var(--admin-radius); color: white; box-shadow: var(--admin-shadow); font-size: 0.9rem; animation: toast-in 0.2s ease; }
.toast-sucesso { background: var(--admin-success); }
.toast-erro    { background: var(--admin-danger); }
@keyframes toast-in { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

/* ----- Denied / no-session screens ----- */
.message-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; gap: 1rem; text-align: center; padding: 1rem; }
.message-screen h2 { margin: 0; }
.message-screen p { color: var(--admin-muted); margin: 0 0 0.5rem; }

/* ----- Responsividade básica ----- */
@media (max-width: 720px) {
  .shell-body { grid-template-columns: 1fr; }
  .sidebar { display: flex; overflow-x: auto; padding: 0.5rem; }
  .sidebar-item { white-space: nowrap; padding: 0.5rem 0.85rem; border-left: none !important; }
  .sidebar-item.active { border-bottom: 2px solid var(--admin-accent); }
  .form-grid { grid-template-columns: 1fr; }
}
```

- [ ] **Step 3: Verificação visual**

Abra `admin.html` no navegador. Esperado: tela com texto "Carregando…" centralizado, fundo bege claro. Não tem erro no Console.

- [ ] **Step 4: Commit**

```powershell
git add admin.html assets/css/admin.css
git commit -m "feat(admin): add HTML shell and base CSS"
```

---

## Task 2: ui.js — helpers (toast, modal, confirm)

**Files:**
- Create: `assets/js/admin/ui.js`

- [ ] **Step 1: Criar `assets/js/admin/ui.js`**

```js
// assets/js/admin/ui.js
// Helpers compartilhados: toast, modal, confirm.
// API: window.veraAdmin.ui.{ showToast, openModal, closeModal, showConfirm }

(function () {
  window.veraAdmin = window.veraAdmin || {};

  const TOAST_DURATION_MS = 3500;

  function showToast(mensagem, tipo) {
    tipo = tipo || 'sucesso';
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
    const t = document.createElement('div');
    t.className = 'toast toast-' + tipo;
    t.textContent = mensagem;
    container.appendChild(t);
    setTimeout(function () { t.remove(); }, TOAST_DURATION_MS);
  }

  function closeModal() {
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) overlay.remove();
  }

  // opts: { titulo, corpoEl (HTMLElement), textoSalvar, onSave (async fn) }
  function openModal(opts) {
    closeModal();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true">' +
        '<div class="modal-header">' +
          '<h3></h3>' +
          '<button class="modal-close" aria-label="Fechar">×</button>' +
        '</div>' +
        '<div class="modal-body"></div>' +
        '<div class="modal-footer">' +
          '<button class="btn btn-secondary modal-cancel">Cancelar</button>' +
          '<button class="btn btn-primary modal-save"></button>' +
        '</div>' +
      '</div>';
    overlay.querySelector('h3').textContent = opts.titulo;
    overlay.querySelector('.modal-body').appendChild(opts.corpoEl);
    const btnSave = overlay.querySelector('.modal-save');
    btnSave.textContent = opts.textoSalvar || 'Salvar';
    overlay.querySelector('.modal-close').onclick = closeModal;
    overlay.querySelector('.modal-cancel').onclick = closeModal;
    btnSave.onclick = async function () {
      if (!opts.onSave) return closeModal();
      btnSave.disabled = true;
      btnSave.textContent = '...';
      try { await opts.onSave(); }
      finally {
        btnSave.disabled = false;
        btnSave.textContent = opts.textoSalvar || 'Salvar';
      }
    };
    // ESC fecha
    overlay.tabIndex = -1;
    overlay.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
    document.body.appendChild(overlay);
    overlay.focus();
  }

  function showConfirm(mensagem) {
    return new Promise(function (resolve) {
      const corpo = document.createElement('p');
      corpo.textContent = mensagem;
      let resolved = false;
      openModal({
        titulo: 'Confirmar',
        corpoEl: corpo,
        textoSalvar: 'Confirmar',
        onSave: function () { resolved = true; resolve(true); closeModal(); }
      });
      // Quando o modal fechar por cancel/X/ESC, resolve(false)
      const obs = new MutationObserver(function () {
        if (!document.querySelector('.modal-overlay') && !resolved) {
          obs.disconnect();
          resolve(false);
        }
      });
      obs.observe(document.body, { childList: true });
    });
  }

  window.veraAdmin.ui = { showToast: showToast, openModal: openModal, closeModal: closeModal, showConfirm: showConfirm };
})();
```

- [ ] **Step 2: Verificação no console**

Abra `admin.html`, abra Console, cole (após `allow pasting` se pedir):

```js
window.veraAdmin.ui.showToast('Funcionou!', 'sucesso');
window.veraAdmin.ui.showToast('Erro de teste', 'erro');
```

Esperado: dois toasts (verde + vermelho) no canto superior direito, somem em ~3.5s.

Depois:

```js
const c = document.createElement('p'); c.textContent = 'Conteúdo de teste';
window.veraAdmin.ui.openModal({ titulo: 'Teste', corpoEl: c, onSave: () => { console.log('saved'); window.veraAdmin.ui.closeModal(); } });
```

Esperado: modal abre. Clicar Cancelar/X/ESC fecha. Clicar Salvar imprime "saved" e fecha.

- [ ] **Step 3: Commit**

```powershell
git add assets/js/admin/ui.js
git commit -m "feat(admin): add ui helpers (toast, modal, confirm)"
```

---

## Task 3: auth.js — login, sessão, gate de admin

**Files:**
- Create: `assets/js/admin/auth.js`

- [ ] **Step 1: Criar `assets/js/admin/auth.js`**

```js
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
```

- [ ] **Step 2: Verificação no console**

Abra `admin.html`. Por enquanto não há gate (index.js ainda nem existe). Cole no Console:

```js
window.veraAdmin.auth.renderLogin(document.getElementById('app'));
```

Esperado: tela de login aparece, dois campos. Tenta clicar Entrar sem preencher → o navegador bloqueia pelo `required`.

- [ ] **Step 3: Commit**

```powershell
git add assets/js/admin/auth.js
git commit -m "feat(admin): add email+password auth with admin gate"
```

---

## Task 4: entity-config.js — metadados das 6 entidades

**Files:**
- Create: `assets/js/admin/entity-config.js`

- [ ] **Step 1: Criar `assets/js/admin/entity-config.js`**

```js
// assets/js/admin/entity-config.js
// Configuração declarativa das 6 entidades de produto.
// Cada entrada vira UI automaticamente via entity-crud.js.
// API: window.veraAdmin.ENTITIES (objeto)

(function () {
  window.veraAdmin = window.veraAdmin || {};

  window.veraAdmin.ENTITIES = {
    molduras: {
      label: 'Molduras',
      tabela: 'molduras',
      chaveNatural: 'codigo',
      ordenarPor: 'codigo',
      colunasTabela: ['codigo', 'nome', 'preco_metro', 'estoque_metros', 'cor', 'ativo'],
      campos: [
        { nome: 'codigo',         label: 'Código',        tipo: 'text',     obrigatorio: true },
        { nome: 'nome',           label: 'Nome',          tipo: 'text',     obrigatorio: true },
        { nome: 'preco_metro',    label: 'Preço/m (R$)',  tipo: 'numero',   obrigatorio: true, min: 0, step: 0.01 },
        { nome: 'estoque_metros', label: 'Estoque (m)',   tipo: 'numero',   obrigatorio: true, min: 0, step: 0.1 },
        { nome: 'cor',            label: 'Cor',           tipo: 'text' },
        { nome: 'perfil_mm',      label: 'Perfil (mm)',   tipo: 'numero',   step: 0.1 },
        { nome: 'material',       label: 'Material',      tipo: 'text' },
        { nome: 'descricao',      label: 'Descrição',     tipo: 'textarea', full: true },
        { nome: 'foto_url',       label: 'Foto',          tipo: 'foto',     full: true, bucket: 'produtos', pasta: 'molduras' },
        { nome: 'ativo',          label: 'Ativo',         tipo: 'boolean' }
      ]
    },
    vidros: {
      label: 'Vidros',
      tabela: 'vidros',
      chaveNatural: 'tipo',
      ordenarPor: 'tipo',
      colunasTabela: ['tipo', 'preco_m2', 'espessura_mm', 'estoque_m2', 'ativo'],
      campos: [
        { nome: 'tipo',         label: 'Tipo',          tipo: 'text',   obrigatorio: true },
        { nome: 'preco_m2',     label: 'Preço/m² (R$)', tipo: 'numero', obrigatorio: true, min: 0, step: 0.01 },
        { nome: 'espessura_mm', label: 'Espessura (mm)',tipo: 'numero', step: 0.1 },
        { nome: 'estoque_m2',   label: 'Estoque (m²)',  tipo: 'numero', obrigatorio: true, min: 0, step: 0.1 },
        { nome: 'ativo',        label: 'Ativo',         tipo: 'boolean' }
      ]
    },
    chapas: {
      label: 'Chapas',
      tabela: 'chapas',
      chaveNatural: 'tipo',
      ordenarPor: 'tipo',
      colunasTabela: ['tipo', 'preco_m2', 'espessura_mm', 'estoque_m2', 'ativo'],
      campos: [
        { nome: 'tipo',         label: 'Tipo',          tipo: 'text',   obrigatorio: true },
        { nome: 'preco_m2',     label: 'Preço/m² (R$)', tipo: 'numero', obrigatorio: true, min: 0, step: 0.01 },
        { nome: 'espessura_mm', label: 'Espessura (mm)',tipo: 'numero', step: 0.1 },
        { nome: 'estoque_m2',   label: 'Estoque (m²)',  tipo: 'numero', obrigatorio: true, min: 0, step: 0.1 },
        { nome: 'ativo',        label: 'Ativo',         tipo: 'boolean' }
      ]
    },
    espelhos: {
      label: 'Espelhos',
      tabela: 'espelhos',
      chaveNatural: 'tipo',
      ordenarPor: 'tipo',
      colunasTabela: ['tipo', 'preco_m2', 'espessura_mm', 'estoque_m2', 'ativo'],
      campos: [
        { nome: 'tipo',         label: 'Tipo',          tipo: 'text',   obrigatorio: true },
        { nome: 'preco_m2',     label: 'Preço/m² (R$)', tipo: 'numero', obrigatorio: true, min: 0, step: 0.01 },
        { nome: 'espessura_mm', label: 'Espessura (mm)',tipo: 'numero', step: 0.1 },
        { nome: 'estoque_m2',   label: 'Estoque (m²)',  tipo: 'numero', obrigatorio: true, min: 0, step: 0.1 },
        { nome: 'ativo',        label: 'Ativo',         tipo: 'boolean' }
      ]
    },
    paspaturs: {
      label: 'Paspaturs',
      tabela: 'paspaturs',
      chaveNatural: 'cor',
      ordenarPor: 'cor',
      colunasTabela: ['cor', 'preco_m2', 'estoque_m2', 'ativo'],
      campos: [
        { nome: 'cor',        label: 'Cor',           tipo: 'text',   obrigatorio: true },
        { nome: 'preco_m2',   label: 'Preço/m² (R$)', tipo: 'numero', obrigatorio: true, min: 0, step: 0.01 },
        { nome: 'estoque_m2', label: 'Estoque (m²)',  tipo: 'numero', obrigatorio: true, min: 0, step: 0.1 },
        { nome: 'ativo',      label: 'Ativo',         tipo: 'boolean' }
      ]
    },
    chassis: {
      label: 'Chassis',
      tabela: 'chassis',
      chaveNatural: 'tipo',
      ordenarPor: 'tipo',
      colunasTabela: ['tipo', 'preco_metro', 'estoque_metros', 'ativo'],
      campos: [
        { nome: 'tipo',           label: 'Tipo',          tipo: 'text',   obrigatorio: true },
        { nome: 'preco_metro',    label: 'Preço/m (R$)',  tipo: 'numero', obrigatorio: true, min: 0, step: 0.01 },
        { nome: 'estoque_metros', label: 'Estoque (m)',   tipo: 'numero', obrigatorio: true, min: 0, step: 0.1 },
        { nome: 'ativo',          label: 'Ativo',         tipo: 'boolean' }
      ]
    }
  };
})();
```

- [ ] **Step 2: Verificação no console**

Abra `admin.html`, no Console:

```js
Object.keys(window.veraAdmin.ENTITIES);
// Esperado: ["molduras", "vidros", "chapas", "espelhos", "paspaturs", "chassis"]
window.veraAdmin.ENTITIES.molduras.campos.length;
// Esperado: 10
```

- [ ] **Step 3: Commit**

```powershell
git add assets/js/admin/entity-config.js
git commit -m "feat(admin): declarative entity config for 6 product tables"
```

---

## Task 5: photo-upload.js — componente de upload de foto

**Files:**
- Create: `assets/js/admin/photo-upload.js`

- [ ] **Step 1: Criar `assets/js/admin/photo-upload.js`**

```js
// assets/js/admin/photo-upload.js
// Componente de upload de foto pro Supabase Storage.
// API: window.veraAdmin.photo.attachPhotoInput(containerEl, opts)
//      onde opts = { bucket, pasta, chaveNatural, urlAtual, onUrlChange }

(function () {
  window.veraAdmin = window.veraAdmin || {};

  const TAMANHO_MAX_MB = 5;

  // Extrai o path interno do bucket a partir da URL pública.
  // Ex.: https://...supabase.co/storage/v1/object/public/produtos/molduras/MD-001.jpg → molduras/MD-001.jpg
  function extrairPath(urlPublica, bucket) {
    if (!urlPublica) return null;
    const marker = '/storage/v1/object/public/' + bucket + '/';
    const i = urlPublica.indexOf(marker);
    if (i === -1) return null;
    return urlPublica.substring(i + marker.length);
  }

  function attachPhotoInput(container, opts) {
    container.innerHTML = '';
    container.className = 'photo-preview';

    const img = document.createElement('img');
    img.alt = 'Foto';
    if (opts.urlAtual) img.src = opts.urlAtual;
    else img.style.display = 'none';
    container.appendChild(img);

    const wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.flexDirection = 'column';
    wrap.style.gap = '0.25rem';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-secondary';
    btn.textContent = opts.urlAtual ? 'Trocar foto' : 'Escolher foto';
    wrap.appendChild(btn);

    const status = document.createElement('span');
    status.className = 'form-field-help';
    wrap.appendChild(status);

    container.appendChild(wrap);

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    container.appendChild(input);

    let urlAtual = opts.urlAtual || null;

    btn.onclick = function () { input.click(); };

    input.onchange = async function () {
      const file = input.files && input.files[0];
      if (!file) return;
      if (file.size > TAMANHO_MAX_MB * 1024 * 1024) {
        window.veraAdmin.ui.showToast('Foto maior que ' + TAMANHO_MAX_MB + 'MB.', 'erro');
        input.value = '';
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      img.src = previewUrl;
      img.style.display = '';
      btn.disabled = true; btn.textContent = 'Enviando…'; status.textContent = '';

      try {
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
        const safeKey = String(opts.chaveNatural || 'item').replace(/[^a-z0-9_-]/gi, '_');
        const path = opts.pasta + '/' + safeKey + '-' + Date.now() + '.' + ext;
        const up = await window.veraDB.storage.from(opts.bucket).upload(path, file, { upsert: true, contentType: file.type });
        if (up.error) throw up.error;
        const pub = window.veraDB.storage.from(opts.bucket).getPublicUrl(path);
        const novaUrl = pub.data.publicUrl;

        // Deleta antiga se houver
        const pathAntigo = extrairPath(urlAtual, opts.bucket);
        if (pathAntigo && pathAntigo !== path) {
          await window.veraDB.storage.from(opts.bucket).remove([pathAntigo]);
        }

        urlAtual = novaUrl;
        img.src = novaUrl;
        if (opts.onUrlChange) opts.onUrlChange(novaUrl);
        btn.disabled = false; btn.textContent = 'Trocar foto'; status.textContent = 'Foto enviada.';
      } catch (err) {
        console.error('[photo-upload] erro', err);
        img.src = opts.urlAtual || '';
        img.style.display = opts.urlAtual ? '' : 'none';
        btn.disabled = false; btn.textContent = opts.urlAtual ? 'Trocar foto' : 'Escolher foto';
        window.veraAdmin.ui.showToast('Falha ao enviar foto.', 'erro');
      } finally {
        input.value = '';
      }
    };
  }

  window.veraAdmin.photo = { attachPhotoInput: attachPhotoInput };
})();
```

- [ ] **Step 2: Verificação no console (após login)**

(Pulamos teste isolado — fica integrado e testado na Task 6.)

- [ ] **Step 3: Commit**

```powershell
git add assets/js/admin/photo-upload.js
git commit -m "feat(admin): photo upload component with old-file cleanup"
```

---

## Task 6: entity-crud.js — lista, criar, editar, soft-delete

**Files:**
- Create: `assets/js/admin/entity-crud.js`

- [ ] **Step 1: Criar `assets/js/admin/entity-crud.js`**

```js
// assets/js/admin/entity-crud.js
// CRUD genérico pra qualquer entidade declarada em entity-config.js.
// API: window.veraAdmin.crud.render(entityKey, mainEl)

(function () {
  window.veraAdmin = window.veraAdmin || {};

  function fmtValor(valor, tipo) {
    if (valor === null || valor === undefined) return '';
    if (tipo === 'numero') return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    if (tipo === 'boolean') return valor ? '<span class="badge-ativo">Ativo</span>' : '<span class="badge-inativo">Inativo</span>';
    return String(valor);
  }

  async function fetchRows(config, mostrarInativos) {
    let q = window.veraDB.from(config.tabela).select('*').order(config.ordenarPor);
    if (!mostrarInativos) q = q.eq('ativo', true);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  }

  function renderTabela(rows, config, callbacks) {
    const tbl = document.createElement('table');
    tbl.className = 'data-table';
    const tipoPorNome = {};
    config.campos.forEach(function (c) { tipoPorNome[c.nome] = c; });

    const thead = document.createElement('thead');
    const trh = document.createElement('tr');
    config.colunasTabela.forEach(function (col) {
      const th = document.createElement('th');
      th.textContent = (tipoPorNome[col] && tipoPorNome[col].label) || col;
      trh.appendChild(th);
    });
    const thA = document.createElement('th');
    thA.className = 'actions';
    thA.textContent = 'Ações';
    trh.appendChild(thA);
    thead.appendChild(trh);
    tbl.appendChild(thead);

    const tbody = document.createElement('tbody');
    if (rows.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = config.colunasTabela.length + 1;
      td.style.textAlign = 'center';
      td.style.color = 'var(--admin-muted)';
      td.style.padding = '2rem';
      td.textContent = 'Nenhum item.';
      tr.appendChild(td);
      tbody.appendChild(tr);
    }
    rows.forEach(function (r) {
      const tr = document.createElement('tr');
      if (!r.ativo) tr.className = 'inativo';
      config.colunasTabela.forEach(function (col) {
        const td = document.createElement('td');
        const campo = tipoPorNome[col];
        td.innerHTML = fmtValor(r[col], campo && campo.tipo);
        tr.appendChild(td);
      });
      const tdA = document.createElement('td');
      tdA.className = 'actions';
      const btnEdit = document.createElement('button');
      btnEdit.className = 'btn-icon';
      btnEdit.title = 'Editar';
      btnEdit.textContent = '✏️';
      btnEdit.onclick = function () { callbacks.editar(r); };
      tdA.appendChild(btnEdit);

      if (r.ativo) {
        const btnDel = document.createElement('button');
        btnDel.className = 'btn-icon';
        btnDel.title = 'Remover';
        btnDel.textContent = '🗑';
        btnDel.onclick = function () { callbacks.remover(r); };
        tdA.appendChild(btnDel);
      } else {
        const btnRe = document.createElement('button');
        btnRe.className = 'btn-icon';
        btnRe.title = 'Reativar';
        btnRe.textContent = '↩️';
        btnRe.onclick = function () { callbacks.reativar(r); };
        tdA.appendChild(btnRe);
      }
      tr.appendChild(tdA);
      tbody.appendChild(tr);
    });
    tbl.appendChild(tbody);
    return tbl;
  }

  function buildFormBody(config, valores) {
    valores = valores || {};
    const grid = document.createElement('div');
    grid.className = 'form-grid';
    const refs = {};
    config.campos.forEach(function (campo) {
      const wrap = document.createElement('div');
      wrap.className = 'form-field' + (campo.full ? ' full' : '');

      const label = document.createElement('label');
      label.textContent = campo.label;
      if (campo.obrigatorio) {
        const req = document.createElement('span'); req.className = 'req'; req.textContent = ' *';
        label.appendChild(req);
      }
      wrap.appendChild(label);

      let input;
      if (campo.tipo === 'textarea') {
        input = document.createElement('textarea');
        input.value = valores[campo.nome] == null ? '' : valores[campo.nome];
      } else if (campo.tipo === 'boolean') {
        input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = valores[campo.nome] !== false;
      } else if (campo.tipo === 'foto') {
        // Container especial — preenchido por photo-upload
        input = document.createElement('div');
        input._fotoUrl = valores[campo.nome] || null;
        window.veraAdmin.photo.attachPhotoInput(input, {
          bucket: campo.bucket,
          pasta: campo.pasta,
          chaveNatural: valores[config.chaveNatural] || 'novo',
          urlAtual: valores[campo.nome] || null,
          onUrlChange: function (url) { input._fotoUrl = url; }
        });
      } else {
        input = document.createElement('input');
        input.type = campo.tipo === 'numero' ? 'number' : 'text';
        if (campo.min !== undefined) input.min = campo.min;
        if (campo.step !== undefined) input.step = campo.step;
        if (valores[campo.nome] !== undefined && valores[campo.nome] !== null) input.value = valores[campo.nome];
      }
      if (campo.obrigatorio) input.required = true;
      wrap.appendChild(input);

      const msg = document.createElement('span');
      msg.className = 'form-field-msg';
      wrap.appendChild(msg);

      grid.appendChild(wrap);
      refs[campo.nome] = { input: input, wrap: wrap, msg: msg, campo: campo };
    });
    return { el: grid, refs: refs };
  }

  function lerForm(refs, config) {
    const valores = {};
    let valido = true;
    config.campos.forEach(function (campo) {
      const ref = refs[campo.nome];
      ref.wrap.classList.remove('error');
      ref.msg.textContent = '';
      let v;
      if (campo.tipo === 'boolean') v = ref.input.checked;
      else if (campo.tipo === 'foto') v = ref.input._fotoUrl;
      else v = ref.input.value;
      if (campo.tipo === 'numero') v = v === '' || v === null ? null : Number(v);
      if (typeof v === 'string') v = v.trim();
      if (campo.obrigatorio && (v === '' || v === null || v === undefined)) {
        valido = false;
        ref.wrap.classList.add('error');
        ref.msg.textContent = 'Campo obrigatório.';
      }
      if (campo.tipo === 'numero' && v !== null && campo.min !== undefined && v < campo.min) {
        valido = false;
        ref.wrap.classList.add('error');
        ref.msg.textContent = 'Mínimo: ' + campo.min;
      }
      valores[campo.nome] = v;
    });
    return { valido: valido, valores: valores };
  }

  async function render(entityKey, mainEl) {
    const config = window.veraAdmin.ENTITIES[entityKey];
    if (!config) { mainEl.innerHTML = '<p>Entidade desconhecida.</p>'; return; }

    let mostrarInativos = false;

    async function recarregar() {
      mainEl.innerHTML = '';
      const header = document.createElement('div'); header.className = 'main-header';
      const h2 = document.createElement('h2'); h2.textContent = config.label; header.appendChild(h2);
      const btnNovo = document.createElement('button'); btnNovo.className = 'btn btn-primary'; btnNovo.textContent = '+ Novo';
      btnNovo.onclick = function () { abrirModalCriar(); };
      header.appendChild(btnNovo);
      mainEl.appendChild(header);

      const toolbar = document.createElement('div'); toolbar.className = 'toolbar';
      const tg = document.createElement('label'); tg.style.display = 'flex'; tg.style.alignItems = 'center'; tg.style.gap = '0.4rem';
      const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = mostrarInativos;
      cb.onchange = function () { mostrarInativos = cb.checked; recarregar(); };
      tg.appendChild(cb);
      tg.appendChild(document.createTextNode('Mostrar inativos'));
      toolbar.appendChild(tg);
      mainEl.appendChild(toolbar);

      let rows;
      try { rows = await fetchRows(config, mostrarInativos); }
      catch (err) {
        console.error(err);
        window.veraAdmin.ui.showToast('Erro ao carregar: ' + (err.message || err), 'erro');
        rows = [];
      }
      const tabela = renderTabela(rows, config, {
        editar: abrirModalEditar,
        remover: confirmarSoftDelete,
        reativar: reativar
      });
      mainEl.appendChild(tabela);
    }

    function abrirModalCriar() { abrirModal({}, null); }
    function abrirModalEditar(row) { abrirModal(row, row.id); }

    function abrirModal(valoresIniciais, id) {
      const form = buildFormBody(config, valoresIniciais);
      window.veraAdmin.ui.openModal({
        titulo: (id ? 'Editar ' : 'Novo ') + config.label.replace(/s$/, '').toLowerCase(),
        corpoEl: form.el,
        onSave: async function () {
          const { valido, valores } = lerForm(form.refs, config);
          if (!valido) { window.veraAdmin.ui.showToast('Verifique os campos.', 'erro'); throw new Error('invalido'); }
          try {
            if (id) {
              const { error } = await window.veraDB.from(config.tabela).update(valores).eq('id', id);
              if (error) throw error;
            } else {
              const { error } = await window.veraDB.from(config.tabela).insert(valores);
              if (error) throw error;
            }
            window.veraAdmin.ui.showToast('Salvo.', 'sucesso');
            window.veraAdmin.ui.closeModal();
            recarregar();
          } catch (err) {
            console.error(err);
            window.veraAdmin.ui.showToast('Erro: ' + (err.message || err), 'erro');
            throw err;
          }
        }
      });
    }

    async function confirmarSoftDelete(row) {
      const idLegivel = row[config.chaveNatural] || row.id;
      const ok = await window.veraAdmin.ui.showConfirm('Remover "' + idLegivel + '"? (Vai marcar como inativo; pode reativar depois)');
      if (!ok) return;
      try {
        const { error } = await window.veraDB.from(config.tabela).update({ ativo: false }).eq('id', row.id);
        if (error) throw error;
        window.veraAdmin.ui.showToast('Removido.', 'sucesso');
        recarregar();
      } catch (err) {
        window.veraAdmin.ui.showToast('Erro: ' + (err.message || err), 'erro');
      }
    }

    async function reativar(row) {
      try {
        const { error } = await window.veraDB.from(config.tabela).update({ ativo: true }).eq('id', row.id);
        if (error) throw error;
        window.veraAdmin.ui.showToast('Reativado.', 'sucesso');
        recarregar();
      } catch (err) {
        window.veraAdmin.ui.showToast('Erro: ' + (err.message || err), 'erro');
      }
    }

    await recarregar();
  }

  window.veraAdmin.crud = { render: render };
})();
```

- [ ] **Step 2: Verificação parcial**

Não dá pra testar sem `index.js` e auth. Verificação fica diferida pra Task 8.

- [ ] **Step 3: Commit**

```powershell
git add assets/js/admin/entity-crud.js
git commit -m "feat(admin): generic CRUD with soft-delete and reactivate"
```

---

## Task 7: config-calculo.js — editor key/value

**Files:**
- Create: `assets/js/admin/config-calculo.js`

- [ ] **Step 1: Criar `assets/js/admin/config-calculo.js`**

```js
// assets/js/admin/config-calculo.js
// Editor especial da tabela config_calculo: lista chave/valor, só permite editar.
// API: window.veraAdmin.configCalculo.render(mainEl)

(function () {
  window.veraAdmin = window.veraAdmin || {};

  async function fetchRows() {
    const { data, error } = await window.veraDB.from('config_calculo').select('*').order('chave');
    if (error) throw error;
    return data || [];
  }

  function abrirModalEditar(row, onSaved) {
    const wrap = document.createElement('div');
    wrap.className = 'form-grid';

    const f1 = document.createElement('div'); f1.className = 'form-field full';
    f1.innerHTML = '<label>Chave</label>';
    const k = document.createElement('input'); k.type = 'text'; k.value = row.chave; k.disabled = true;
    f1.appendChild(k);
    wrap.appendChild(f1);

    const f2 = document.createElement('div'); f2.className = 'form-field full';
    f2.innerHTML = '<label>Valor <span class="req">*</span></label>';
    const v = document.createElement('input'); v.type = 'text'; v.value = row.valor; v.required = true;
    f2.appendChild(v);
    wrap.appendChild(f2);

    const f3 = document.createElement('div'); f3.className = 'form-field full';
    f3.innerHTML = '<label>Descrição</label>';
    const d = document.createElement('textarea'); d.value = row.descricao || '';
    f3.appendChild(d);
    wrap.appendChild(f3);

    window.veraAdmin.ui.openModal({
      titulo: 'Editar config',
      corpoEl: wrap,
      onSave: async function () {
        const valor = v.value.trim();
        if (!valor) { window.veraAdmin.ui.showToast('Valor é obrigatório.', 'erro'); throw new Error('invalido'); }
        try {
          const { error } = await window.veraDB.from('config_calculo')
            .update({ valor: valor, descricao: d.value.trim() || null })
            .eq('chave', row.chave);
          if (error) throw error;
          window.veraAdmin.ui.showToast('Salvo.', 'sucesso');
          window.veraAdmin.ui.closeModal();
          onSaved();
        } catch (err) {
          window.veraAdmin.ui.showToast('Erro: ' + (err.message || err), 'erro');
          throw err;
        }
      }
    });
  }

  async function render(mainEl) {
    mainEl.innerHTML = '';
    const header = document.createElement('div'); header.className = 'main-header';
    const h2 = document.createElement('h2'); h2.textContent = 'Configurações de cálculo'; header.appendChild(h2);
    mainEl.appendChild(header);

    const obs = document.createElement('p');
    obs.style.color = 'var(--admin-muted)'; obs.style.fontSize = '0.9rem';
    obs.textContent = 'Estas chaves controlam o cálculo do orçamento. Apenas o valor pode ser editado.';
    mainEl.appendChild(obs);

    let rows;
    try { rows = await fetchRows(); }
    catch (err) {
      window.veraAdmin.ui.showToast('Erro: ' + (err.message || err), 'erro');
      return;
    }

    const tbl = document.createElement('table');
    tbl.className = 'data-table';
    tbl.innerHTML = '<thead><tr><th>Chave</th><th>Valor</th><th>Descrição</th><th class="actions">Ações</th></tr></thead>';
    const tbody = document.createElement('tbody');
    rows.forEach(function (r) {
      const tr = document.createElement('tr');
      tr.innerHTML =
        '<td><code>' + r.chave + '</code></td>' +
        '<td><strong>' + r.valor + '</strong></td>' +
        '<td>' + (r.descricao || '') + '</td>';
      const tdA = document.createElement('td'); tdA.className = 'actions';
      const btn = document.createElement('button'); btn.className = 'btn-icon'; btn.textContent = '✏️'; btn.title = 'Editar';
      btn.onclick = function () { abrirModalEditar(r, function () { render(mainEl); }); };
      tdA.appendChild(btn); tr.appendChild(tdA); tbody.appendChild(tr);
    });
    tbl.appendChild(tbody);
    mainEl.appendChild(tbl);
  }

  window.veraAdmin.configCalculo = { render: render };
})();
```

- [ ] **Step 2: Verificação**

Diferida pra Task 8.

- [ ] **Step 3: Commit**

```powershell
git add assets/js/admin/config-calculo.js
git commit -m "feat(admin): config_calculo key/value editor"
```

---

## Task 8: index.js — bootstrap + sidebar + roteamento

**Files:**
- Create: `assets/js/admin/index.js`

- [ ] **Step 1: Criar `assets/js/admin/index.js`**

```js
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
```

- [ ] **Step 2: Verificação manual end-to-end**

Abra `admin.html` no navegador. Esperado:

1. Aparece tela de login.
2. Digite email e senha do usuário admin. Clica Entrar.
3. Carrega o shell: topbar com "Vera Molduras — Admin", email à direita, botão "Sair". Sidebar à esquerda com 7 itens. Aba "Molduras" ativa, área principal mostra tabela com as 4 molduras seed.
4. Clica em "Vidros" → vê tabela de vidros (1 ativo: incolor; toggle inativos → mostra anti-reflexo).
5. Clica "+ Novo" em qualquer aba → modal abre com campos.
6. Preenche, clica Salvar → toast verde "Salvo.", linha aparece na tabela.
7. Clica ✏️ numa linha → modal aberto preenchido. Muda algo, salva → linha atualiza.
8. Clica 🗑 → confirm aparece. Confirma → toast "Removido.", linha some.
9. Marca "Mostrar inativos" → linha reaparece esmaecida com botão ↩️. Clica → linha reativa.
10. Clica "Config" → tabela `config_calculo` com 2 chaves. Clica ✏️ em `chassis_trava_lado_cm`, muda valor pra 120, salva → atualiza.
11. Clica "Sair" → volta pra tela de login.

Se algum passo falhar, abra Console (F12) e me passa a mensagem de erro.

- [ ] **Step 3: Commit**

```powershell
git add assets/js/admin/index.js
git commit -m "feat(admin): bootstrap, sidebar navigation, and routing"
```

---

## Task 9: Verificação de upload de foto

Feita junto da Task 8 mas vale ser explícito.

- [ ] **Step 1: Testar upload**

Na aba Molduras, clica ✏️ na "Dourada Nobre". No modal, vai até o campo Foto:

1. Clica "Escolher foto", seleciona uma imagem qualquer (< 5 MB).
2. Esperado: preview aparece imediatamente. Botão vira "Enviando…".
3. Aguarde 1-3 segundos: botão vira "Trocar foto", texto abaixo "Foto enviada."
4. Salva o modal.
5. Recarrega a página (F5) → reabre a moldura → a foto carrega da URL do Supabase.
6. Trocar foto: repetir. A foto antiga deve ser deletada do storage (verifica no painel Supabase > Storage > produtos > molduras/ — só uma foto ativa por moldura).

- [ ] **Step 2: Commit (se algo precisar ser corrigido)**

Se tudo OK, sem commit adicional (já está em Tasks 5 e 6).

---

## Task 10: Smoke test final + atualizar setup doc

**Files:**
- Modify: `docs/supabase-setup.md`

- [ ] **Step 1: Adicionar referência ao admin no doc**

No final de `docs/supabase-setup.md`, na seção "Próximos passos", substituir o texto sobre Fase 3 por:

```markdown
## 10. Próximos passos

Fase 2 concluída. Fase 3 entregue: você já pode usar o painel admin.

### Como acessar o admin

1. Abra `admin.html` no navegador (mesmo método que você usa pro restante do site).
2. Faça login com o email/senha que você cadastrou no passo 9.
3. Use a sidebar pra navegar entre Molduras, Vidros, Chapas, Espelhos, Paspaturs, Chassis e Config.

### Próxima fase

**Fase 4 — Calculadora:** página de orçamento (`orcamento.html`) vai ler preços do banco e calcular o orçamento ao vivo conforme o cliente digita. Pré-requisitos: ter preços preenchidos no admin pra todos os tipos de vidro, paspatur e espelho que você oferece.
```

- [ ] **Step 2: Commit**

```powershell
git add docs/supabase-setup.md
git commit -m "docs: update setup doc with admin access instructions"
```

---

## Self-Review

**Spec coverage:**
- ✓ HTML shell + CSS (Task 1)
- ✓ Modal/toast/confirm (Task 2)
- ✓ Auth com email+senha + gate de admin (Task 3)
- ✓ Entity-config declarativa (Task 4)
- ✓ Upload de foto + cleanup (Task 5)
- ✓ CRUD genérico (lista, criar, editar, soft-delete, reativar, toggle inativos) (Task 6)
- ✓ Config_calculo especial (Task 7)
- ✓ Bootstrap + sidebar + roteamento (Task 8)
- ✓ Verificação end-to-end (Tasks 8 e 9)
- ✓ Doc atualizado (Task 10)

**Placeholder scan:** Nenhum "TBD" / "TODO" no plano. Todo código mostrado é completo.

**Type consistency:**
- `window.veraAdmin.ui.{showToast,openModal,closeModal,showConfirm}` — declarado em Task 2, usado em Tasks 5, 6, 7.
- `window.veraAdmin.auth.{getSession,isAdmin,signIn,signOut,renderLogin,renderAcessoNegado,getUserEmail}` — Task 3, usado em Task 8.
- `window.veraAdmin.ENTITIES` — Task 4, usado em Task 6.
- `window.veraAdmin.photo.attachPhotoInput(container, opts)` — Task 5, usado em Task 6 (chamado de `buildFormBody`).
- `window.veraAdmin.crud.render(entityKey, mainEl)` — Task 6, usado em Task 8.
- `window.veraAdmin.configCalculo.render(mainEl)` — Task 7, usado em Task 8.
- `window.veraDB` — definido em Fase 2 (`assets/js/supabase-client.js`), usado por todos.

Todas as assinaturas batem entre tasks.

**Ordem de scripts em `admin.html` (Task 1):** Supabase SDK → supabase-client.js → ui → auth → entity-config → photo-upload → entity-crud → config-calculo → index. Garante que cada arquivo encontra suas dependências carregadas. ✓
