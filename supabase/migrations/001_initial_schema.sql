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
