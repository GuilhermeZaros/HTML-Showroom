// Cliente Supabase da Vera Molduras.
// A publishable key é pública por design — seguro commitar.
// Requer que o SDK UMD seja incluído ANTES deste arquivo:
//   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
//   <script src="assets/js/supabase-client.js"></script>
// O cliente fica em `window.veraDB` pra ser consumido pelas demais páginas.

(function () {
  const SUPABASE_URL = 'https://mkpygtxryxqqkezjgqmg.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_wrAmEWOz8p9Tvhrmi-L5dQ_qEp_FH-t';

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error('[veraDB] SDK do Supabase não encontrado. Inclua o script do CDN antes de supabase-client.js.');
    return;
  }

  window.veraDB = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
})();
