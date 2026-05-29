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
