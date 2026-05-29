-- ============================================================================
-- Vera Molduras — Seed de desenvolvimento (Fase 2)
-- Idempotente: roda múltiplas vezes sem duplicar.
-- Linhas com preço 0 ficam ativo=false (dono completa via admin).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Molduras (preços alinhados ao simulador atual de index.html)
-- ---------------------------------------------------------------------------
INSERT INTO public.molduras (codigo, nome, descricao, preco_metro, estoque_metros, cor, perfil_mm, material, ativo)
VALUES
  ('MD-001', 'Dourada Nobre',  'Moldura clássica dourada com acabamento envelhecido', 95.00, 20, 'dourada', 35, 'madeira', true),
  ('MD-002', 'Madeira Clara',  'Madeira natural lixada com verniz fosco',              80.00, 20, 'natural', 30, 'madeira', true),
  ('MD-003', 'Preta Filete',   'Filete preto moderno minimalista',                     45.00, 30, 'preta',   15, 'madeira', true),
  ('MD-004', 'Branca Caixa',   'Moldura caixa branca laqueada',                        65.00, 15, 'branca',  40, 'madeira', true)
ON CONFLICT (codigo) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Vidros (incolor R$180/m² confirmado; anti-reflexo aguarda preço do dono)
-- ---------------------------------------------------------------------------
INSERT INTO public.vidros (tipo, preco_m2, espessura_mm, estoque_m2, ativo)
VALUES
  ('incolor',      180.00, 2, 10, true),
  ('anti-reflexo',   0.00, 2,  0, false)  -- TODO dono: informar preço/m² antes de ativar
ON CONFLICT (tipo) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Chapas (eucatex 3mm R$90/m² confirmado)
-- ---------------------------------------------------------------------------
INSERT INTO public.chapas (tipo, preco_m2, espessura_mm, estoque_m2, ativo)
VALUES
  ('eucatex 3mm', 90.00, 3, 15, true)
ON CONFLICT (tipo) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Espelhos (placeholders — dono informa preços)
-- ---------------------------------------------------------------------------
INSERT INTO public.espelhos (tipo, preco_m2, espessura_mm, estoque_m2, ativo)
VALUES
  ('comum',  0.00, 4, 0, false),
  ('bisotê', 0.00, 4, 0, false)
ON CONFLICT (tipo) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Paspaturs (placeholder — dono informa preço)
-- ---------------------------------------------------------------------------
INSERT INTO public.paspaturs (cor, preco_m2, estoque_m2, ativo)
VALUES
  ('branco', 0.00, 0, false)
ON CONFLICT (cor) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Chassis (R$18,90/m confirmado)
-- ---------------------------------------------------------------------------
INSERT INTO public.chassis (tipo, preco_metro, estoque_metros, ativo)
VALUES
  ('padrão', 18.90, 30, true)
ON CONFLICT (tipo) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Configurações globais
-- ---------------------------------------------------------------------------
INSERT INTO public.config_calculo (chave, valor, descricao)
VALUES
  ('chassis_trava_lado_cm',     '100', 'Se um lado do quadro exceder N cm, o lado é cobrado 3x (trava do meio do chassis)'),
  ('taxa_servico_percentual',   '0',   'Percentual de mão de obra sobre o subtotal (reservado pra Fase 4)')
ON CONFLICT (chave) DO NOTHING;
