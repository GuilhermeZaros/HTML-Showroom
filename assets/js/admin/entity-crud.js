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
