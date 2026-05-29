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
