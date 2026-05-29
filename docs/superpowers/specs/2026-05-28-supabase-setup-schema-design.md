# Design — Setup Supabase + Schema (Fase 2)

**Data:** 2026-05-28
**Projeto:** Vera Molduras Presentes — site institucional
**Fase:** 2 de 4 (Backend foundation)
**Status:** Aprovado (aguarda revisão do spec)

## Contexto

O site atual (`projeto-loja/`) é estático: HTML + CSS + JS soltos, sem backend. A página `orcamento.html` coleta dados do cliente e envia via WhatsApp, sem calcular preço.

O cliente solicitou:
1. Cálculo automático de orçamento (moldura por perímetro, vidro/chapa/espelho/paspatur por m², chassis por perímetro com trava acima de 1m).
2. Painel admin com login pra gerenciar catálogo, preços e estoque de molduras, vidros, chapas, espelhos, paspaturs e chassis.

Como o pedido envolve vários subsistemas, foi decomposto em quatro fases. Esta spec cobre **somente a Fase 2**: configurar a infraestrutura de dados (Supabase) e o schema do banco. Sem interface nova.

### Fases do projeto (visão geral)

| Fase | Escopo | Status |
|---|---|---|
| 1 | Calculadora com preços hardcoded em JS | Pulada (decidido fazer Fase 2 primeiro) |
| **2** | **Supabase + schema + seeds** | **Esta spec** |
| 3 | Painel admin com login + CRUD | Próxima |
| 4 | Calculadora lendo preços do Supabase | Depois |

## Objetivo desta fase

Ao final desta fase, o banco de dados Supabase está provisionado, com tabelas, políticas de segurança, storage e dados de exemplo. Não há mudança visível pro usuário final do site — a fundação fica pronta pra Fase 3 (admin) consumir.

**Critérios de sucesso:**
- Conta Supabase criada (plano free, região `sa-east-1`).
- 7 tabelas criadas via migration SQL.
- Bucket de storage `produtos` criado com políticas corretas.
- Row Level Security ativo em todas as tabelas com políticas público-leitura / admin-escrita.
- Dados de exemplo inseridos (seeds) permitem testar SELECTs como se a Fase 3 já existisse.
- Documentação em `docs/supabase-setup.md` explica como o dono replica o setup do zero.

## Stack

- **Banco:** Postgres gerenciado (Supabase)
- **Auth:** Supabase Auth (gerencia usuários admin)
- **Storage:** Supabase Storage (fotos das molduras)
- **Região:** `sa-east-1` (São Paulo) — menor latência pra clientes no Brasil
- **Plano:** Free tier (limites: 500 MB banco, 1 GB storage, 50k auth users)

## Schema do banco

### Convenções gerais

Todas as tabelas têm:

| Coluna | Tipo | Default | Descrição |
|---|---|---|---|
| `id` | `uuid` | `gen_random_uuid()` | Chave primária |
| `ativo` | `boolean` | `true` | Se `false`, não aparece pro cliente nem entra no cálculo |
| `created_at` | `timestamptz` | `now()` | Auditoria |
| `updated_at` | `timestamptz` | `now()` | Atualizado via trigger |

Trigger `set_updated_at` atualiza `updated_at` em todo `UPDATE`.

### `molduras`

Catálogo principal. Cobrado por **metro linear** (perímetro do quadro × preço).

| Coluna | Tipo | Notas |
|---|---|---|
| `codigo` | `text UNIQUE NOT NULL` | Código interno, ex.: "MD-001" |
| `nome` | `text NOT NULL` | "Dourada Nobre" |
| `descricao` | `text` | Texto livre pro admin |
| `preco_metro` | `numeric(10,2) NOT NULL` | R$ por metro linear |
| `estoque_metros` | `numeric(10,2) NOT NULL DEFAULT 0` | Metros disponíveis em estoque |
| `cor` | `text` | "dourada", "preta", "natural" |
| `perfil_mm` | `numeric(5,1)` | Largura do perfil em mm |
| `material` | `text` | "madeira", "alumínio", "polímero" |
| `foto_url` | `text` | URL pública (Supabase Storage) |

### `vidros`

Cobrado por **m²** (largura × altura × preço).

| Coluna | Tipo | Notas |
|---|---|---|
| `tipo` | `text NOT NULL` | "incolor", "anti-reflexo", "museum" |
| `preco_m2` | `numeric(10,2) NOT NULL` | R$ por m² |
| `espessura_mm` | `numeric(5,1)` | Ex.: 2, 3, 4 |
| `estoque_m2` | `numeric(10,2) NOT NULL DEFAULT 0` | m² disponíveis |

### `chapas`

Eucatex/MDF de fundo. Cobrado por **m²**.

| Coluna | Tipo | Notas |
|---|---|---|
| `tipo` | `text NOT NULL` | "eucatex 3mm", "MDF 6mm" |
| `preco_m2` | `numeric(10,2) NOT NULL` | R$ por m² |
| `espessura_mm` | `numeric(5,1)` | |
| `estoque_m2` | `numeric(10,2) NOT NULL DEFAULT 0` | |

### `espelhos`

Cobrado por **m²**.

| Coluna | Tipo | Notas |
|---|---|---|
| `tipo` | `text NOT NULL` | "comum", "bisotê", "antiembaçante" |
| `preco_m2` | `numeric(10,2) NOT NULL` | |
| `espessura_mm` | `numeric(5,1)` | |
| `estoque_m2` | `numeric(10,2) NOT NULL DEFAULT 0` | |

### `paspaturs`

Cartolina decorativa entre arte e vidro. Cobrado por **m²**.

| Coluna | Tipo | Notas |
|---|---|---|
| `cor` | `text NOT NULL` | "branco", "creme", "preto" |
| `preco_m2` | `numeric(10,2) NOT NULL` | |
| `estoque_m2` | `numeric(10,2) NOT NULL DEFAULT 0` | |

### `chassis`

Estrutura de madeira pra tela/canvas. Cobrado por **metro linear**, com regra especial: se algum lado do quadro passar de 100 cm, esse lado conta 3× (trava do meio). A regra do "100 cm" vai em `config_calculo`, não aqui.

| Coluna | Tipo | Notas |
|---|---|---|
| `tipo` | `text NOT NULL` | "padrão", "reforçado" |
| `preco_metro` | `numeric(10,2) NOT NULL` | R$ 18,90 inicialmente |
| `estoque_metros` | `numeric(10,2) NOT NULL DEFAULT 0` | |

### `config_calculo`

Regras globais editáveis sem precisar mexer em código.

| Coluna | Tipo | Notas |
|---|---|---|
| `chave` | `text PRIMARY KEY` | Slug snake_case |
| `valor` | `text NOT NULL` | Sempre string; código parseia conforme tipo |
| `descricao` | `text` | Explicação humana do que controla |

Chaves iniciais:

| Chave | Valor | Descrição |
|---|---|---|
| `chassis_trava_lado_cm` | `100` | Se um lado do quadro > N cm, o lado é cobrado 3× (trava do meio do chassis) |
| `taxa_servico_percentual` | `0` | Reservado pra Fase 4: % de mão de obra sobre o subtotal |

## Storage

Um bucket chamado `produtos` com subpastas por tipo: `molduras/`, `vidros/`, etc. (Apenas molduras precisam de foto na Fase 3; demais subpastas ficam disponíveis pra uso futuro.)

**Políticas do bucket:**
- `SELECT` (download): público (qualquer um pode visualizar URLs)
- `INSERT / UPDATE / DELETE`: só usuário autenticado

Coluna `foto_url` em `molduras` guarda a URL pública completa do objeto no bucket, não só o caminho.

## Segurança (Row Level Security)

RLS ativo em **todas** as 7 tabelas. Duas políticas por tabela:

1. **`select_publico`** — permite `SELECT` pra qualquer role (`anon` ou `authenticated`), filtrando `ativo = true`. Exceção: `config_calculo` é totalmente pública (todas as linhas).
2. **`admin_write`** — permite `INSERT / UPDATE / DELETE` apenas quando o usuário autenticado tem o claim `role = 'admin'`.

O claim `role = 'admin'` é atribuído manualmente pelo dono no painel Supabase Auth (Fase 3 documentará o procedimento; nesta fase só registramos a política).

## Dados de exemplo (seeds)

Inseridos via `supabase/seed.sql`. Servem pra desenvolvimento, não representam o catálogo real:

**Molduras (4):**

| Código | Nome | Cor | Preço/m | Estoque (m) |
|---|---|---|---|---|
| MD-001 | Dourada Nobre | dourada | 95,00 | 20 |
| MD-002 | Madeira Clara | natural | 80,00 | 20 |
| MD-003 | Preta Filete | preta | 45,00 | 30 |
| MD-004 | Branca Caixa | branca | 65,00 | 15 |

**Vidros (2):** Incolor 2mm a R$ 180/m² (estoque 10); Anti-reflexo 2mm com `preco_m2 = 0` e comentário `-- TODO: dono informar` (não aparece pro cliente até ter preço).

**Chapa (1):** Eucatex 3mm a R$ 90/m², estoque 15 m².

**Paspatur (1):** Branco, `preco_m2 = 0` (placeholder, dono informa depois).

**Espelhos (2):** Comum 4mm e Bisotê 4mm, ambos com `preco_m2 = 0` (placeholders).

**Chassis (1):** Padrão a R$ 18,90/m, estoque 30 m.

**Config:** as 2 chaves listadas acima.

Linhas com preço `0` ficam `ativo = false` por padrão pra não aparecerem no cálculo antes de serem preenchidas.

## Entregáveis

1. **`supabase/migrations/001_initial_schema.sql`** — DDL completo (extensões, tabelas, índices, trigger de `updated_at`, políticas RLS).
2. **`supabase/seed.sql`** — dados de exemplo, idempotente (`ON CONFLICT DO NOTHING`).
3. **`docs/supabase-setup.md`** — instruções passo-a-passo pro dono:
   - Como criar conta Supabase
   - Como criar o projeto (região `sa-east-1`)
   - Como rodar a migration via SQL Editor do painel
   - Como rodar o seed
   - Como criar o bucket `produtos`
   - Como atribuir role `admin` a um usuário (será relevante na Fase 3)
4. **`.env.example`** no projeto com `SUPABASE_URL` e `SUPABASE_ANON_KEY` em branco (pra ser editado quando o front conectar, Fase 3/4).

## Fora de escopo (Fase 2)

- Painel admin (HTML/JS) — Fase 3.
- Página de cálculo lendo do Supabase — Fase 4.
- Integração JS do site atual com Supabase — Fase 4.
- Hospedagem do site estático — decisão posterior.
- Migração do cálculo da home (`#simulador` com preço hardcoded "R$ 245,00") — Fase 4.

## Riscos & decisões em aberto

- **Preços faltantes**: anti-reflexo, espelhos, paspaturs entram como 0/inativo. Risco: dono pode esquecer de preencher antes de ativar a calculadora na Fase 4. Mitigação: validar no admin (Fase 3) que `preco_m2 > 0` quando marcar `ativo`.
- **Atribuição de role admin**: na Fase 2 a política existe, mas nenhum usuário tem o claim. Será exercitada na Fase 3.
- **Backup**: plano free do Supabase tem retenção de backup limitada. Pra catálogo real (Fase 3+), considerar export periódico ou upgrade.
