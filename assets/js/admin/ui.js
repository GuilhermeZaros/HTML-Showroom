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
      // Declarado antes do openModal pra ser referenciável no onSave
      let obs;
      openModal({
        titulo: 'Confirmar',
        corpoEl: corpo,
        textoSalvar: 'Confirmar',
        onSave: function () { resolved = true; if (obs) obs.disconnect(); resolve(true); closeModal(); }
      });
      // Quando o modal fechar por cancel/X/ESC, resolve(false)
      obs = new MutationObserver(function () {
        if (!document.querySelector('.modal-overlay')) {
          obs.disconnect();
          if (!resolved) resolve(false);
        }
      });
      obs.observe(document.body, { childList: true });
    });
  }

  window.veraAdmin.ui = { showToast: showToast, openModal: openModal, closeModal: closeModal, showConfirm: showConfirm };
})();