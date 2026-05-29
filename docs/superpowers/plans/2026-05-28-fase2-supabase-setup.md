# Fase 2 — Supabase Setup + Schema — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provision Supabase backend (database + auth + storage) with full schema, RLS policies, and seed data so that Fases 3 (admin) and 4 (calculadora) can consume it.

**Architecture:** Single comprehensive SQL migration creates 7 product tables (`molduras`, `vidros`, `chapas`, `espelhos`, `paspaturs`, `chassis`, `config_calculo`), enables Row Level Security with public-read / admin-write policies, and creates a public `produtos` storage bucket. A separate seed file inserts dev data. A markdown doc walks the dono through applying everything in the Supabase dashboard.

**Tech Stack:** Postgres 15 (Supabase managed), Supabase Auth, Supabase Storage, SQL (pgcrypto extension).

**Reference spec:** `docs/superpowers/specs/2026-05-28-supabase-setup-schema-design.md`

---

## File Structure

| Arquivo | Status | Responsabilidade |
|---|---|---|
| `supabase/migrations/001_initial_schema.sql` | Criar | DDL completo: extensões, funções helper, 7 tabelas, índices, triggers, RLS, storage bucket |
| `supabase/seed.sql` | Criar | Dados de exemplo idempotentes (rodável várias vezes) |
| `.env.example` | Criar | Template das variáveis `SUPABASE_URL` e `SUPABASE_ANON_KEY` |
| `docs/supabase-setup.md` | Criar | Walkthrough passo-a-passo para o dono aplicar o setup |
| `.gitignore` | Modificar (se existir) ou criar | Garantir que `.env` não vá pro git |

**Decisão de granularidade:** Um único arquivo de migration porque (a) é o setup inicial cohesivo, (b) ~250 linhas cabe num review único, (c) Supabase aplica migrations em ordem e splitar agora atrapalha mais que ajuda. Refatorar em múltiplas migrations só se algum bloco exceder 150 linhas no futuro.

---

## Verificação (sem testes unitários)

Como esta fase é DDL + docs (sem código de aplicação), não existem testes unitários tradicionais. A verificação é:

1. **Estática:** revisão visual da SQL antes de commitar (sintaxe Postgres, ordem de DDL correta).
2. **Funcional:** executar a migration num projeto Supabase real (Task 7) e rodar queries de verificação que provam: tabelas existem, RLS bloqueia escrita anônima, bucket existe, seed populou.

---

## Task 1: Schema base — extensões, helpers, tabelas, índices, triggers

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Criar a pasta `supabase/migrations/`**

Execute via PowerShell:
```powershell
New-Item -ItemType Directory -Path "supabase\migrations" -Force | Out-Null
```

Expected: pasta criada sem output (ou já existente).

- [ ] **Step 2: Escrever `001_initial_schema.sql` com extensões, funções helper e as 7 tabelas**

Conteúdo completo (sobrescreve qualquer arquivo existente):

```sql
-- ============================================================================
-- Vera Molduras — Schema inicial (Fase 2)
-- Aplicar via Supabase SQL Editor (ou supabase CLI: `supabase db reset`)
-- Idempotente NÃO é garantido nesta migration. Rode em projeto vazio.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Extensões
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- 2. Funções helper
-- ---------------------------------------------------------------------------

-- Atualiza updated_at em UPDATE
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Verifica se o usuário JWT tem role=admin no app_metadata
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. Tabelas
-- ---------------------------------------------------------------------------

-- Molduras (cobrado por metro linear, perímetro do quadro)
CREATE TABLE public.molduras (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo          text UNIQUE NOT NULL,
  nome            text NOT NULL,
  descricao       text,
  preco_metro     numeric(10,2) NOT NULL CHECK (preco_metro >= 0),
  estoque_metros  numeric(10,2) NOT NULL DEFAULT 0 CHECK (estoque_metros >= 0),
  cor             text,
  perfil_mm       numeric(5,1),
  material        text,
  foto_url        text,
  ativo           boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_molduras_ativo ON public.molduras (ativo) WHERE ativo = true;
CREATE TRIGGER molduras_set_updated_at
  BEFORE UPDATE ON public.molduras
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Vidros (cobrado por m²)
CREATE TABLE public.vidros (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo          text UNIQUE NOT NULL,
  preco_m2      numeric(10,2) NOT NULL CHECK (preco_m2 >= 0),
  espessura_mm  numeric(5,1),
  estoque_m2    numeric(10,2) NOT NULL DEFAULT 0 CHECK (estoque_m2 >= 0),
  ativo         boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_vidros_ativo ON public.vidros (ativo) WHERE ativo = true;
CREATE TRIGGER vidros_set_updated_at
  BEFORE UPDATE ON public.vidros
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Chapas (cobrado por m²)
CREATE TABLE public.chapas (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo          text UNIQUE NOT NULL,
  preco_m2      numeric(10,2) NOT NULL CHECK (preco_m2 >= 0),
  espessura_mm  numeric(5,1),
  estoque_m2    numeric(10,2) NOT NULL DEFAULT 0 CHECK (estoque_m2 >= 0),
  ativo         boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_chapas_ativo ON public.chapas (ativo) WHERE ativo = true;
CREATE TRIGGER chapas_set_updated_at
  BEFORE UPDATE ON public.chapas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Espelhos (cobrado por m²)
CREATE TABLE public.espelhos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo          text UNIQUE NOT NULL,
  preco_m2      numeric(10,2) NOT NULL CHECK (preco_m2 >= 0),
  espessura_mm  numeric(5,1),
  estoque_m2    numeric(10,2) NOT NULL DEFAULT 0 CHECK (estoque_m2 >= 0),
  ativo         boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_espelhos_ativo ON public.espelhos (ativo) WHERE ativo = true;
CREATE TRIGGER espelhos_set_updated_at
  BEFORE UPDATE ON public.espelhos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Paspaturs (cobrado por m²)
CREATE TABLE public.paspaturs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cor         text UNIQUE NOT NULL,
  preco_m2    numeric(10,2) NOT NULL CHECK (preco_m2 >= 0),
  estoque_m2  numeric(10,2) NOT NULL DEFAULT 0 CHECK (estoque_m2 >= 0),
  ativo       boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_paspaturs_ativo ON public.paspaturs (ativo) WHERE ativo = true;
CREATE TRIGGER paspaturs_set_updated_at
  BEFORE UPDATE ON public.paspaturs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Chassis (cobrado por metro linear; trava acima de N cm via config_calculo)
CREATE TABLE public.chassis (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo            text UNIQUE NOT NULL,
  preco_metro     numeric(10,2) NOT NULL CHECK (preco_metro >= 0),
  estoque_metros  numeric(10,2) NOT NULL DEFAULT 0 CHECK (estoque_metros >= 0),
  ativo           boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_chassis_ativo ON public.chassis (ativo) WHERE ativo = true;
CREATE TRIGGER chassis_set_updated_at
  BEFORE UPDATE ON public.chassis
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Configurações globais de cálculo (chave/valor)
CREATE TABLE public.config_calculo (
  chave       text PRIMARY KEY,
  valor       text NOT NULL,
  descricao   text,
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER config_calculo_set_updated_at
  BEFORE UPDATE ON public.config_calculo
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

- [ ] **Step 3: Revisão visual da SQL**

Critérios de revisão:
1. Todas as 7 tabelas declaradas? (molduras, vidros, chapas, espelhos, paspaturs, chassis, config_calculo)
2. Toda tabela de produto tem: `id`, `ativo`, `created_at`, `updated_at`, trigger de `updated_at`, índice em `ativo`?
3. CHECK constraints garantem preço/estoque ≥ 0?
4. UNIQUE em `codigo` (molduras), `tipo` (vidros/chapas/espelhos/chassis), `cor` (paspaturs) para idempotência do seed?

Se algum item falhar, corrigir antes de seguir.

- [ ] **Step 4: Commit**

```powershell
git add supabase/migrations/001_initial_schema.sql
git commit -m "feat(db): add initial schema with 7 tables and helper functions

Creates molduras, vidros, chapas, espelhos, paspaturs, chassis and
config_calculo tables with UNIQUE constraints on natural keys, CHECK
constraints on price/stock, indexes on ativo, and triggers for
updated_at maintenance.
"
```

---

## Task 2: Row Level Security — habilitar e adicionar políticas

**Files:**
- Modify: `supabase/migrations/001_initial_schema.sql` (append)

- [ ] **Step 1: Acrescentar bloco de RLS ao final do arquivo**

Append:

```sql
-- ---------------------------------------------------------------------------
-- 4. Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE public.molduras       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vidros         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.espelhos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paspaturs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chassis        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_calculo ENABLE ROW LEVEL SECURITY;

-- SELECT público (somente linhas ativas) para todas as tabelas de produto
CREATE POLICY "select_publico_ativos" ON public.molduras       FOR SELECT USING (ativo = true);
CREATE POLICY "select_publico_ativos" ON public.vidros         FOR SELECT USING (ativo = true);
CREATE POLICY "select_publico_ativos" ON public.chapas         FOR SELECT USING (ativo = true);
CREATE POLICY "select_publico_ativos" ON public.espelhos       FOR SELECT USING (ativo = true);
CREATE POLICY "select_publico_ativos" ON public.paspaturs      FOR SELECT USING (ativo = true);
CREATE POLICY "select_publico_ativos" ON public.chassis        FOR SELECT USING (ativo = true);

-- config_calculo é totalmente pública (cliente precisa ler regras inativas também não)
CREATE POLICY "select_publico" ON public.config_calculo FOR SELECT USING (true);

-- Escrita (INSERT/UPDATE/DELETE) restrita a admins autenticados
CREATE POLICY "admin_all" ON public.molduras
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_all" ON public.vidros
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_all" ON public.chapas
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_all" ON public.espelhos
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_all" ON public.paspaturs
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_all" ON public.chassis
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_all" ON public.config_calculo
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
```

- [ ] **Step 2: Revisar**

1. RLS habilitado em todas as 7 tabelas?
2. Toda tabela de produto tem 2 políticas (`select_publico_ativos` + `admin_all`)?
3. `config_calculo` tem `select_publico` (sem filtro `ativo`)?
4. Políticas de escrita usam `public.is_admin()` em USING **e** WITH CHECK?

- [ ] **Step 3: Commit**

```powershell
git add supabase/migrations/001_initial_schema.sql
git commit -m "feat(db): enable RLS with public-read and admin-write policies

All tables enforce row level security. Anonymous reads return only
ativo=true rows (config_calculo allows all reads). Writes require the
authenticated user to have role=admin in app_metadata, checked via
public.is_admin().
"
```

---

## Task 3: Storage bucket + políticas de upload

**Files:**
- Modify: `supabase/migrations/001_initial_schema.sql` (append)

- [ ] **Step 1: Acrescentar bloco de Storage ao final do arquivo**

Append:

```sql
-- ---------------------------------------------------------------------------
-- 5. Storage bucket
-- ---------------------------------------------------------------------------

-- Bucket público para fotos dos produtos
INSERT INTO storage.buckets (id, name, public)
VALUES ('produtos', 'produtos', true)
ON CONFLICT (id) DO NOTHING;

-- SELECT público (qualquer um lê)
CREATE POLICY "produtos_public_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'produtos');

-- INSERT/UPDATE/DELETE só pra admin
CREATE POLICY "produtos_admin_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'produtos' AND public.is_admin());

CREATE POLICY "produtos_admin_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'produtos' AND public.is_admin())
  WITH CHECK (bucket_id = 'produtos' AND public.is_admin());

CREATE POLICY "produtos_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'produtos' AND public.is_admin());
```

- [ ] **Step 2: Revisar**

1. Bucket `produtos` criado como `public = true`?
2. INSERT, UPDATE e DELETE todos checam `public.is_admin()`?
3. Não tem política RESTRICT/DENY genérica que conflite?

- [ ] **Step 3: Commit**

```powershell
git add supabase/migrations/001_initial_schema.sql
git commit -m "feat(db): add produtos storage bucket with admin-only write policy"
```

---

## Task 4: Seed file com dados de exemplo

**Files:**
- Create: `supabase/seed.sql`

- [ ] **Step 1: Criar `supabase/seed.sql`**

Conteúdo completo:

```sql
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
```

- [ ] **Step 2: Revisar**

1. Cada `INSERT` tem `ON CONFLICT ... DO NOTHING` no campo único correspondente?
2. Linhas com `preco = 0` estão marcadas `ativo = false`?
3. Valores dos preços conhecidos (180, 90, 18.90, 95/80/45/65) batem com a spec?

- [ ] **Step 3: Commit**

```powershell
git add supabase/seed.sql
git commit -m "feat(db): add idempotent dev seed data

Populates 4 molduras matching the index.html simulator, the confirmed
vidro incolor / chapa eucatex / chassis prices, and placeholders
(ativo=false) for items whose prices the dono still needs to provide.
Includes the two initial config_calculo rules.
"
```

---

## Task 5: `.env.example` e ajuste do `.gitignore`

**Files:**
- Create: `.env.example`
- Modify or create: `.gitignore`

- [ ] **Step 1: Verificar se existe `.gitignore`**

```powershell
Test-Path .gitignore
```

Expected: `True` ou `False`.

- [ ] **Step 2: Criar `.env.example`**

Conteúdo:

```bash
# Credenciais Supabase — copie este arquivo para .env e preencha.
# Encontre os valores em: app.supabase.com > Project > Settings > API.
# NUNCA commitar o .env real.

SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
SUPABASE_ANON_KEY=YOUR-ANON-KEY-HERE
```

- [ ] **Step 3: Garantir que `.env` está no `.gitignore`**

Se o arquivo já existir, edite-o pra incluir `.env`. Se não existir, crie com este conteúdo mínimo:

```
# Env vars
.env
.env.local

# OS
Thumbs.db
.DS_Store
```

Se já existir e já contiver `.env`, pular este passo.

- [ ] **Step 4: Commit**

```powershell
git add .env.example .gitignore
git commit -m "chore: add .env.example template and ignore real .env"
```

---

## Task 6: Documentação — `docs/supabase-setup.md`

**Files:**
- Create: `docs/supabase-setup.md`

- [ ] **Step 1: Escrever o walkthrough**

Conteúdo completo:

````markdown
# Setup Supabase — Passo a Passo

Este documento é pra você, dono da Vera Molduras, configurar o banco de dados do site do zero. Tempo estimado: **15 minutos**.

## 1. Criar a conta Supabase

1. Acesse https://supabase.com e clique em **Start your project**.
2. Faça login com sua conta Google (recomendado) ou crie uma nova conta com e-mail.
3. Confirme o e-mail.

## 2. Criar o projeto

1. No painel, clique em **New project**.
2. Preencha:
   - **Name:** `vera-molduras`
   - **Database Password:** gere uma senha forte e **guarde em local seguro** (você vai precisar pra restaurar backups, mas o site não usa).
   - **Region:** `South America (São Paulo)` — `sa-east-1`
   - **Pricing Plan:** Free
3. Clique em **Create new project** e aguarde 2-3 minutos provisionar.

## 3. Anotar credenciais

Quando o projeto subir:

1. No menu lateral, clique em **Project Settings** (ícone de engrenagem).
2. Vá em **API**.
3. Anote dois valores (vão pro `.env` quando construirmos o front em Fases 3/4):
   - **Project URL** — algo como `https://abcdefghij.supabase.co`
   - **anon public** key — chave longa começando com `eyJ...`

## 4. Aplicar o schema

1. No menu lateral, clique em **SQL Editor**.
2. Clique em **+ New query**.
3. Abra `supabase/migrations/001_initial_schema.sql` na sua pasta do projeto.
4. Copie **todo** o conteúdo e cole no editor.
5. Clique em **Run** (ou Ctrl+Enter).

**Esperado:** mensagem "Success. No rows returned" na parte inferior.

Se der erro, leia a mensagem e me avise — o erro mais comum é tentar rodar 2x sem limpar o banco. Pra recomeçar, use a aba **Database > Tables** pra deletar tudo manualmente, ou crie um novo projeto.

## 5. Aplicar os seeds

1. Ainda no **SQL Editor**, **+ New query**.
2. Copie o conteúdo de `supabase/seed.sql` e cole.
3. **Run**.

**Esperado:** "Success. No rows returned" (os INSERTs não retornam linhas).

## 6. Verificar que funcionou

No SQL Editor, rode esta query:

```sql
SELECT 'molduras' AS tabela, count(*) AS linhas FROM public.molduras
UNION ALL SELECT 'vidros',         count(*) FROM public.vidros
UNION ALL SELECT 'chapas',         count(*) FROM public.chapas
UNION ALL SELECT 'espelhos',       count(*) FROM public.espelhos
UNION ALL SELECT 'paspaturs',      count(*) FROM public.paspaturs
UNION ALL SELECT 'chassis',        count(*) FROM public.chassis
UNION ALL SELECT 'config_calculo', count(*) FROM public.config_calculo;
```

**Esperado:**

| tabela | linhas |
|---|---|
| molduras | 4 |
| vidros | 2 |
| chapas | 1 |
| espelhos | 2 |
| paspaturs | 1 |
| chassis | 1 |
| config_calculo | 2 |

## 7. Verificar Row Level Security

No SQL Editor, rode:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Esperado:** as 7 tabelas com `rowsecurity = true`.

## 8. Verificar Storage

1. No menu lateral, clique em **Storage**.
2. Esperado: bucket `produtos` listado, com selo "Public".

## 9. Criar o usuário admin (importante pra Fase 3)

Esta etapa só será exercitada na Fase 3 (quando o painel admin existir), mas vale deixar o usuário criado já:

1. No menu lateral, **Authentication > Users**.
2. Clique em **Add user > Create new user**.
3. Preencha um e-mail e senha que você vai usar pra logar no admin. **Marque "Auto Confirm User"**.
4. Crie.
5. Agora atribua o role `admin`. No **SQL Editor**, rode (substitua o e-mail):

```sql
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'::jsonb
WHERE email = 'SEU-EMAIL-AQUI@exemplo.com';
```

**Esperado:** "Success. 1 row affected".

## 10. Próximos passos

Fase 2 concluída. As próximas fases vão consumir esse banco:

- **Fase 3 — Painel admin:** página `admin.html` com login, formulários pra editar produtos e estoque, upload de fotos.
- **Fase 4 — Calculadora:** página de orçamento lê preços do banco e calcula o orçamento ao vivo conforme o cliente digita.

Me avise quando tiver tudo verde aqui — vamos pra próxima fase.
````

- [ ] **Step 2: Revisar**

1. Cada passo tem o que o dono precisa clicar/colar?
2. As queries de verificação dão resultados esperados explícitos?
3. Tempo total estimado realista (15min)?

- [ ] **Step 3: Commit**

```powershell
git add docs/supabase-setup.md
git commit -m "docs: add step-by-step Supabase setup walkthrough for owner"
```

---

## Task 7: Verificação manual (executada pelo dono no painel Supabase)

Esta tarefa **não** é executada pelo agente. É um protocolo pro dono seguir após os arquivos estarem commitados. Documentar aqui pra registro.

- [ ] **Step 1: Dono cria conta + projeto Supabase**

Seguir Seções 1-3 de `docs/supabase-setup.md`.

**Sinal de sucesso:** projeto Supabase aparece como ativo no painel; URL e anon key anotadas.

- [ ] **Step 2: Dono aplica `001_initial_schema.sql`**

Seguir Seção 4.

**Sinal de sucesso:** "Success. No rows returned".

- [ ] **Step 3: Dono aplica `seed.sql`**

Seguir Seção 5.

**Sinal de sucesso:** "Success. No rows returned".

- [ ] **Step 4: Dono roda queries de verificação**

Seguir Seções 6, 7, 8.

**Sinal de sucesso:** contagens batem (4, 2, 1, 2, 1, 1, 2); RLS=true em todas; bucket público listado.

- [ ] **Step 5: Dono cria usuário admin e atribui role**

Seguir Seção 9.

**Sinal de sucesso:** "1 row affected" no UPDATE.

- [ ] **Step 6: Dono confirma conclusão**

Dono reporta sucesso. Atualizar `MEMORY.md` com pointer pro projeto Supabase (project ref) se útil pra próximas conversas — sem chaves sensíveis. Marcar Fase 2 como concluída.

---

## Self-Review

**Spec coverage:**
- ✓ 7 tabelas (Task 1)
- ✓ RLS público-leitura / admin-escrita (Task 2)
- ✓ Storage bucket `produtos` (Task 3)
- ✓ Seeds com preços conhecidos + placeholders (Task 4)
- ✓ `.env.example` (Task 5)
- ✓ `docs/supabase-setup.md` (Task 6)
- ✓ Verificação funcional (Task 7)

**Placeholder scan:** Nenhum "TBD", "TODO" no plano (os "TODO dono" no seed são marcadores intencionais de dado faltante, não etapas pendentes do plano). Todo código mostrado é completo e copy-paste-ready.

**Type consistency:** Nomes de tabela/coluna consistentes entre Task 1, 2, 3, 4 e doc (Task 6). `is_admin()` definido em Task 1 e usado em Tasks 2 e 3. `set_updated_at()` definido em Task 1 e usado em todos os triggers das 7 tabelas.

**Refinamento vs spec:** O plano adiciona constraints `UNIQUE` em `tipo` (vidros/chapas/espelhos/chassis) e `cor` (paspaturs) que a spec não listou explicitamente. Justificativa: necessário pra idempotência do seed. Não altera o modelo conceitual.
