-- ============================================================================
-- Importação de molduras dos pedidos:
--   • ArtMold Molduras (via Cristiano Maboni Repr.) — Pedido #26587, 12/05/2026
--   • Moldare Molduras EIRELI — NFe #000.013.282, 24/04/2026
--
-- IMPORTANTE:
-- O campo preco_metro abaixo é o PREÇO DE CUSTO (compra), não de venda.
-- Por isso todos os registros entram com ativo=false. Ajuste preco_metro
-- pelo admin antes de marcar ativo=true.
--
-- Idempotente: rodável várias vezes (ON CONFLICT no codigo).
-- ============================================================================

INSERT INTO public.molduras (codigo, nome, descricao, preco_metro, estoque_metros, material, ativo)
VALUES
  -- ---------------- ArtMold (Pedido #26587, 12/05/2026) ----------------
  ('050-R 166',  'Moldura 050-R 166',  'Fornecedor: ArtMold (Pedido #26587, 12/05/2026). PREÇO ATUAL = CUSTO — ajustar preço de venda antes de ativar.',  4.29,  21.6, 'madeira', false),
  ('054-R 385',  'Moldura 054-R 385',  'Fornecedor: ArtMold (Pedido #26587, 12/05/2026). PREÇO ATUAL = CUSTO — ajustar preço de venda antes de ativar.',  4.32,  21.6, 'madeira', false),
  ('060-166',    'Moldura 060-166',    'Fornecedor: ArtMold (Pedido #26587, 12/05/2026). PREÇO ATUAL = CUSTO — ajustar preço de venda antes de ativar.',  3.70,  32.4, 'madeira', false),
  ('1014-1030',  'Moldura 1014-1030',  'Fornecedor: ArtMold (Pedido #26587, 12/05/2026). PREÇO ATUAL = CUSTO — ajustar preço de venda antes de ativar.', 11.81,  43.2, 'madeira', false),
  ('165-3059',   'Moldura 165-3059',   'Fornecedor: ArtMold (Pedido #26587, 12/05/2026). PREÇO ATUAL = CUSTO — ajustar preço de venda antes de ativar.',  8.58,  21.6, 'madeira', false),
  ('165-R 385',  'Moldura 165-R 385',  'Fornecedor: ArtMold (Pedido #26587, 12/05/2026). PREÇO ATUAL = CUSTO — ajustar preço de venda antes de ativar.',  7.17,  21.6, 'madeira', false),
  ('245-116',    'Moldura 245-116',    'Fornecedor: ArtMold (Pedido #26587, 12/05/2026). PREÇO ATUAL = CUSTO — ajustar preço de venda antes de ativar.',  4.87,  32.4, 'madeira', false),
  ('360-116',    'Moldura 360-116',    'Fornecedor: ArtMold (Pedido #26587, 12/05/2026). PREÇO ATUAL = CUSTO — ajustar preço de venda antes de ativar.', 10.11,  43.2, 'madeira', false),
  ('360-166',    'Moldura 360-166',    'Fornecedor: ArtMold (Pedido #26587, 12/05/2026). PREÇO ATUAL = CUSTO — ajustar preço de venda antes de ativar.', 10.11,  21.6, 'madeira', false),
  ('375-3059',   'Moldura 375-3059',   'Fornecedor: ArtMold (Pedido #26587, 12/05/2026). PREÇO ATUAL = CUSTO — ajustar preço de venda antes de ativar.', 10.61,  21.6, 'madeira', false),
  ('375-R 315',  'Moldura 375-R 315',  'Fornecedor: ArtMold (Pedido #26587, 12/05/2026). PREÇO ATUAL = CUSTO — ajustar preço de venda antes de ativar.',  7.91,  21.6, 'madeira', false),
  ('375-R 385',  'Moldura 375-R 385',  'Fornecedor: ArtMold (Pedido #26587, 12/05/2026). PREÇO ATUAL = CUSTO — ajustar preço de venda antes de ativar.',  7.91,  32.4, 'madeira', false),
  ('857-166',    'Moldura 857-166',    'Fornecedor: ArtMold (Pedido #26587, 12/05/2026). PREÇO ATUAL = CUSTO — ajustar preço de venda antes de ativar.', 14.60,  21.6, 'madeira', false),
  ('937-1010',   'Moldura 937-1010',   'Fornecedor: ArtMold (Pedido #26587, 12/05/2026). PREÇO ATUAL = CUSTO — ajustar preço de venda antes de ativar.', 20.77,  21.6, 'madeira', false),
  ('938-3059',   'Moldura 938-3059',   'Fornecedor: ArtMold (Pedido #26587, 12/05/2026). PREÇO ATUAL = CUSTO — ajustar preço de venda antes de ativar.', 13.32,  21.6, 'madeira', false),
  ('957-1010',   'Moldura 957-1010',   'Fornecedor: ArtMold (Pedido #26587, 12/05/2026). PREÇO ATUAL = CUSTO — ajustar preço de venda antes de ativar.',  7.24,  21.6, 'madeira', false),
  ('971-2010',   'Moldura 971-2010',   'Fornecedor: ArtMold (Pedido #26587, 12/05/2026). PREÇO ATUAL = CUSTO — ajustar preço de venda antes de ativar.', 15.64,  43.2, 'madeira', false),

  -- ---------------- Moldare (NFe #13282, 24/04/2026) ----------------
  ('701-627',    'Moldura 701-627',    'Fornecedor: Moldare (NFe #000.013.282, 24/04/2026). PREÇO ATUAL = CUSTO — ajustar preço de venda antes de ativar.',  4.98,   21.6, 'madeira', false),
  ('705-870',    'Moldura 705-870',    'Fornecedor: Moldare (NFe #000.013.282, 24/04/2026). PREÇO ATUAL = CUSTO — ajustar preço de venda antes de ativar.',  6.50,   32.4, 'madeira', false),
  ('006-839',    'Moldura 006-839',    'Fornecedor: Moldare (NFe #000.013.282, 24/04/2026). PREÇO ATUAL = CUSTO — ajustar preço de venda antes de ativar.',  6.35,   64.8, 'madeira', false),
  ('005-564',    'Moldura 005-564',    'Fornecedor: Moldare (NFe #000.013.282, 24/04/2026). PREÇO ATUAL = CUSTO — ajustar preço de venda antes de ativar.',  3.40,  108.0, 'madeira', false),
  ('160-004',    'Moldura 160-004',    'Fornecedor: Moldare (NFe #000.013.282, 24/04/2026). PREÇO ATUAL = CUSTO — ajustar preço de venda antes de ativar.',  3.88,   21.6, 'madeira', false)
ON CONFLICT (codigo) DO NOTHING;
