# Design — Painel Admin (Fase 3)

**Data:** 2026-05-29
**Projeto:** Vera Molduras Presentes
**Fase:** 3 de 4 (Painel admin com login + CRUD)
**Status:** Aprovado (aguarda revisão do spec)
**Spec anterior:** [Fase 2 — Supabase setup + schema](2026-05-28-supabase-setup-schema-design.md)

## Contexto

A Fase 2 deixou pronto: Supabase com 7 tabelas (`molduras`, `vidros`, `chapas`, `espelhos`, `paspaturs`, `chassis`, `config_calculo`), RLS público-leitura/admin-escrita, storage bucket `produtos` e cliente JS em `assets/js/supabase-client.js` carregado no `orcamento.html`. Atualmente, o dono só consegue editar dados pelo painel do Supabase (interface técnica).

Esta fase entrega um **painel admin web** onde o dono gerencia o catálogo, preços, estoque e fotos sem precisar conhecer SQL.

## Objetivo

Ao final desta fase, o dono pode:
1. Acessar `admin.html`, fazer login com email+senha.
2. Navegar entre as 7 entidades via sidebar lateral.
3. Listar, criar, editar e soft-deletar produtos em qualquer entidade.
4. Subir/trocar foto de molduras (uploads vão pro bucket `produtos`).
5. Editar valores de `config_calculo`.
6. Sair (logout).

Usuário sem `role=admin` no `app_metadata` vê "Acesso negado" mesmo se logar com sucesso.

## Decisões de design (do brainstorm)

| Decisão | Escolha |
|---|---|
| Escopo | Todas as 7 tabelas editáveis + upload de foto |
| Layout | Sidebar fixa à esquerda + área de conteúdo à direita |
| Edição | Modal centralizado (popup) com formulário |
| Login | Email + senha (sem magic link, sem reset por email) |
| Remoção | Soft delete: marca `ativo = false`. Toggle "Mostrar inativos" mostra os ocultos com botão "Reativar" no lugar do "Remover". |
| Stack | Vanilla JS + Supabase JS SDK. Mesmo padrão do resto do site. |
| CRUD genérico | Config declarativa por entidade + UI genérica (DRY) |

## Arquitetura

### Estrutura de arquivos

```
admin.html                                # Página única (login + shell)
assets/css/admin.css                      # Estilos: sidebar, tabela, modal, toast
assets/js/admin/
  ├── index.js                            # Bootstrap: monta layout, roteia entre abas
  ├── auth.js                             # Login, logout, sessão, gate de admin
  ├── entity-config.js                    # Metadados das 6 entidades de produto
  ├── entity-crud.js                      # CRUD genérico (lê config, renderiza tudo)
  ├── config-calculo.js                   # Aba especial chave/valor
  ├── photo-upload.js                     # Upload pro Supabase Storage + preview
  └── ui.js                               # Helpers: modal, toast, confirm
```

**Por que arquivos separados:** cada um tem responsabilidade única e cabe em ~150 linhas. Facilita futura manutenção e iteração isolada.

### CRUD genérico (decisão central)

As 6 entidades de produto compartilham o mesmo padrão: lista (tabela), modal create/edit, soft-delete, toggle ativo, ordenação básica. Em vez de duplicar 6 vezes, declaramos cada entidade em `entity-config.js`:

```js
export const ENTITIES = {
  molduras: {
    label: 'Molduras',
    tabela: 'molduras',                           // nome da tabela no Supabase
    chaveNatural: 'codigo',                       // identificador humano (mostrado em alertas)
    ordenarPor: 'codigo',
    colunasTabela: ['codigo','nome','preco_metro','estoque_metros','cor','ativo'],
    campos: [
      { nome: 'codigo',          label: 'Código',        tipo: 'text',     obrigatorio: true },
      { nome: 'nome',            label: 'Nome',          tipo: 'text',     obrigatorio: true },
      { nome: 'preco_metro',     label: 'Preço/m (R$)',  tipo: 'numero',   obrigatorio: true, min: 0 },
      { nome: 'estoque_metros',  label: 'Estoque (m)',   tipo: 'numero',   obrigatorio: true, min: 0 },
      { nome: 'cor',             label: 'Cor',           tipo: 'text' },
      { nome: 'perfil_mm',       label: 'Perfil (mm)',   tipo: 'numero' },
      { nome: 'material',        label: 'Material',      tipo: 'text' },
      { nome: 'descricao',       label: 'Descrição',     tipo: 'textarea' },
      { nome: 'foto_url',        label: 'Foto',          tipo: 'foto', bucket: 'produtos', pasta: 'molduras' },
      { nome: 'ativo',           label: 'Ativo',         tipo: 'boolean' }
    ]
  },
  vidros:    { /* tipo, preco_m2, espessura_mm, estoque_m2, ativo */ },
  chapas:    { /* tipo, preco_m2, espessura_mm, estoque_m2, ativo */ },
  espelhos:  { /* tipo, preco_m2, espessura_mm, estoque_m2, ativo */ },
  paspaturs: { /* cor, preco_m2, estoque_m2, ativo */ },
  chassis:   { /* tipo, preco_metro, estoque_metros, ativo */ }
};
```

`entity-crud.js` recebe uma entrada de `ENTITIES` e renderiza:
- Tabela com `colunasTabela`
- Botão "+ Novo" → modal vazio com inputs de cada `campo`
- Botão ✏️ por linha → mesmo modal, populado
- Botão 🗑 por linha → confirm + `UPDATE ativo=false`
- Toggle "Mostrar inativos" → re-roda query sem o filtro `ativo=true`

Cada `tipo` (`text`, `numero`, `textarea`, `boolean`, `foto`) tem um renderer correspondente em `entity-crud.js`. Adicionar tipo novo (ex.: `select`) é uma função pequena.

### `config_calculo` (aba especial)

Não usa `entity-crud.js` porque:
- Chaves são fixas (definidas pelo código de cálculo) → sem create/delete.
- Só permite editar o `valor` (string) e opcionalmente a `descricao`.

`config-calculo.js` renderiza lista simples `chave | valor | descrição | [Editar]`, com modal de 2 campos.

### Fluxo de auth

```
GET admin.html
  └─ index.js carrega
       └─ auth.checkSession()
            ├─ Sem sessão  → render login form
            │                  └─ submit → supabase.auth.signInWithPassword
            │                              ├─ erro → toast vermelho
            │                              └─ ok   → reload
            └─ Com sessão → auth.checkAdmin()
                              ├─ não admin → render "Acesso negado" + botão Sair
                              └─ admin    → render shell (sidebar + área de conteúdo)
                                            (default tab: Molduras)
```

`auth.checkAdmin()` lê `session.user.app_metadata.role === 'admin'`. Esse claim é setado manualmente no Supabase (já documentado em `docs/supabase-setup.md` seção 9).

### Upload de foto

Aplica-se apenas a `molduras.foto_url` na Fase 3 (outras entidades não têm campo de foto no schema).

Fluxo:
1. Usuário clica "Trocar foto" no modal → abre `<input type="file" accept="image/*">`.
2. Preview imediato via `URL.createObjectURL(file)`.
3. Upload: `supabase.storage.from('produtos').upload('molduras/{codigo}-{timestamp}.{ext}', file, { upsert: true })`.
4. Recupera URL pública via `getPublicUrl(path)`.
5. Salva URL no campo `foto_url` do registro.
6. Se já existia uma `foto_url` antiga, extrai o path e chama `remove([oldPath])` no bucket — evita acumular lixo no free tier (1 GB).
7. Falha de upload → reverte preview e mostra toast vermelho.

**Restrições:** tamanho máximo 5 MB no client (limite arbitrário, evita uploads gigantes); tipo MIME validado por `accept="image/*"`. Sem redimensionamento/compressão automática nesta fase (YAGNI; nada impede o dono de subir fotos otimizadas).

### Tratamento de erros

| Caso | UI |
|---|---|
| Rede caiu / 5xx Supabase | Toast vermelho "Sem conexão. Tente de novo." |
| RLS negou escrita | Toast vermelho "Você não tem permissão. Faça login novamente." + força logout |
| CHECK do banco violado (preço negativo) | Toast vermelho com mensagem específica do banco |
| Email/senha inválidos | Toast vermelho na tela de login: "Email ou senha incorretos." |
| Upload deu erro | Toast vermelho, preview revertido |
| Sucesso (salvar, deletar, upload) | Toast verde no canto superior direito, some sozinho em 3s |
| Loading | Botões viram disabled + spinner pequeno |

### Estilo visual

Reutiliza tokens do `style.css` existente (cores, fontes serif). `admin.css` adiciona componentes admin-específicos (sidebar, tabela densa, modal). Layout responsivo básico: em telas <800px, sidebar vira menu hamburguer.

## Critérios de sucesso

1. Login com email+senha do usuário admin (criado na Fase 2).
2. Vê as 7 abas na sidebar; clicar troca o conteúdo da área principal.
3. Em cada aba de produto: lista carrega via Supabase, "+ Novo" abre modal vazio, "Editar" abre populado, "Salvar" persiste, "Remover" marca `ativo=false`, toggle "Mostrar inativos" re-busca.
4. Em "Molduras": upload de foto roda, preview aparece, URL fica no banco, foto antiga é apagada do storage.
5. Em "Config": valor é editável (chave não), salvar persiste.
6. Logado com usuário sem `role=admin` → tela "Acesso negado". Sair → volta pra login.

## Fora de escopo (Fase 3)

- Mudanças no `index.html` e `orcamento.html` (lado cliente) — Fase 4.
- Dashboard de estatísticas, alertas de baixo estoque — futuro.
- Histórico de alterações / audit log — YAGNI.
- Múltiplos usuários admin com permissões diferentes — YAGNI (único dono).
- Recuperação de senha por email — usuário decidiu pular; reset manual via painel Supabase se necessário.
- Compressão/redimensionamento automático de imagens no upload — YAGNI.
- Busca/filtro na tabela (além do toggle inativos) — pode entrar quando o catálogo crescer; YAGNI por enquanto.

## Riscos & decisões em aberto

- **Sem token de admin no banco no momento do dev:** o desenvolvedor (ou agente) precisa criar o usuário admin no Supabase antes de testar escrita. Mitigação: documentado em `docs/supabase-setup.md` seção 9.
- **Foto sem compressão:** se o dono subir foto de 4 MB direto da câmera, o 1 GB do free tier acaba em ~250 molduras. Aceitável agora (catálogo inicial pequeno); revisitar se aproximar do limite.
- **CRUD genérico vs específico:** se uma entidade futura precisar de UI muito diferente (ex.: campos relacionados, dropdown de outra tabela), o `entity-crud.js` vai precisar absorver isso ou virar específico. Aceito esse risco em favor da simplicidade atual.

## Entregáveis

1. `admin.html` — página única.
2. `assets/css/admin.css` — estilos.
3. `assets/js/admin/index.js`, `auth.js`, `entity-config.js`, `entity-crud.js`, `config-calculo.js`, `photo-upload.js`, `ui.js`.
4. Atualização em `docs/supabase-setup.md` (seção 9) se a flow de criar admin precisar de retoque.
5. Smoke test manual: passos pra dono validar tudo end-to-end (criar moldura, editar, soft-delete, upload de foto, editar config).
