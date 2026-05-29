// assets/js/admin/entity-config.js
// Configuração declarativa das 6 entidades de produto.
// Cada entrada vira UI automaticamente via entity-crud.js.
// API: window.veraAdmin.ENTITIES (objeto)

(function () {
  window.veraAdmin = window.veraAdmin || {};

  window.veraAdmin.ENTITIES = {
    molduras: {
      label: 'Molduras',
      tabela: 'molduras',
      chaveNatural: 'codigo',
      ordenarPor: 'codigo',
      colunasTabela: ['codigo', 'nome', 'preco_metro', 'estoque_metros', 'cor', 'ativo'],
      campos: [
        { nome: 'codigo',         label: 'Código',        tipo: 'text',     obrigatorio: true },
        { nome: 'nome',           label: 'Nome',          tipo: 'text',     obrigatorio: true },
        { nome: 'preco_metro',    label: 'Preço/m (R$)',  tipo: 'numero',   obrigatorio: true, min: 0, step: 0.01 },
        { nome: 'estoque_metros', label: 'Estoque (m)',   tipo: 'numero',   obrigatorio: true, min: 0, step: 0.1 },
        { nome: 'cor',            label: 'Cor',           tipo: 'text' },
        { nome: 'perfil_mm',      label: 'Perfil (mm)',   tipo: 'numero',   step: 0.1 },
        { nome: 'material',       label: 'Material',      tipo: 'text' },
        { nome: 'descricao',      label: 'Descrição',     tipo: 'textarea', full: true },
        { nome: 'foto_url',       label: 'Foto',          tipo: 'foto',     full: true, bucket: 'produtos', pasta: 'molduras' },
        { nome: 'ativo',          label: 'Ativo',         tipo: 'boolean' }
      ]
    },
    vidros: {
      label: 'Vidros',
      tabela: 'vidros',
      chaveNatural: 'tipo',
      ordenarPor: 'tipo',
      colunasTabela: ['tipo', 'preco_m2', 'espessura_mm', 'estoque_m2', 'ativo'],
      campos: [
        { nome: 'tipo',         label: 'Tipo',          tipo: 'text',   obrigatorio: true },
        { nome: 'preco_m2',     label: 'Preço/m² (R$)', tipo: 'numero', obrigatorio: true, min: 0, step: 0.01 },
        { nome: 'espessura_mm', label: 'Espessura (mm)',tipo: 'numero', step: 0.1 },
        { nome: 'estoque_m2',   label: 'Estoque (m²)',  tipo: 'numero', obrigatorio: true, min: 0, step: 0.1 },
        { nome: 'ativo',        label: 'Ativo',         tipo: 'boolean' }
      ]
    },
    chapas: {
      label: 'Chapas',
      tabela: 'chapas',
      chaveNatural: 'tipo',
      ordenarPor: 'tipo',
      colunasTabela: ['tipo', 'preco_m2', 'espessura_mm', 'estoque_m2', 'ativo'],
      campos: [
        { nome: 'tipo',         label: 'Tipo',          tipo: 'text',   obrigatorio: true },
        { nome: 'preco_m2',     label: 'Preço/m² (R$)', tipo: 'numero', obrigatorio: true, min: 0, step: 0.01 },
        { nome: 'espessura_mm', label: 'Espessura (mm)',tipo: 'numero', step: 0.1 },
        { nome: 'estoque_m2',   label: 'Estoque (m²)',  tipo: 'numero', obrigatorio: true, min: 0, step: 0.1 },
        { nome: 'ativo',        label: 'Ativo',         tipo: 'boolean' }
      ]
    },
    espelhos: {
      label: 'Espelhos',
      tabela: 'espelhos',
      chaveNatural: 'tipo',
      ordenarPor: 'tipo',
      colunasTabela: ['tipo', 'preco_m2', 'espessura_mm', 'estoque_m2', 'ativo'],
      campos: [
        { nome: 'tipo',         label: 'Tipo',          tipo: 'text',   obrigatorio: true },
        { nome: 'preco_m2',     label: 'Preço/m² (R$)', tipo: 'numero', obrigatorio: true, min: 0, step: 0.01 },
        { nome: 'espessura_mm', label: 'Espessura (mm)',tipo: 'numero', step: 0.1 },
        { nome: 'estoque_m2',   label: 'Estoque (m²)',  tipo: 'numero', obrigatorio: true, min: 0, step: 0.1 },
        { nome: 'ativo',        label: 'Ativo',         tipo: 'boolean' }
      ]
    },
    paspaturs: {
      label: 'Paspaturs',
      tabela: 'paspaturs',
      chaveNatural: 'cor',
      ordenarPor: 'cor',
      colunasTabela: ['cor', 'preco_m2', 'estoque_m2', 'ativo'],
      campos: [
        { nome: 'cor',        label: 'Cor',           tipo: 'text',   obrigatorio: true },
        { nome: 'preco_m2',   label: 'Preço/m² (R$)', tipo: 'numero', obrigatorio: true, min: 0, step: 0.01 },
        { nome: 'estoque_m2', label: 'Estoque (m²)',  tipo: 'numero', obrigatorio: true, min: 0, step: 0.1 },
        { nome: 'ativo',      label: 'Ativo',         tipo: 'boolean' }
      ]
    },
    chassis: {
      label: 'Chassis',
      tabela: 'chassis',
      chaveNatural: 'tipo',
      ordenarPor: 'tipo',
      colunasTabela: ['tipo', 'preco_metro', 'estoque_metros', 'ativo'],
      campos: [
        { nome: 'tipo',           label: 'Tipo',          tipo: 'text',   obrigatorio: true },
        { nome: 'preco_metro',    label: 'Preço/m (R$)',  tipo: 'numero', obrigatorio: true, min: 0, step: 0.01 },
        { nome: 'estoque_metros', label: 'Estoque (m)',   tipo: 'numero', obrigatorio: true, min: 0, step: 0.1 },
        { nome: 'ativo',          label: 'Ativo',         tipo: 'boolean' }
      ]
    }
  };
})();
