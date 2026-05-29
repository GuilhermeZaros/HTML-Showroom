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
