-- =============================================
-- Dao Eterno — Schema PostgreSQL
-- Execute: psql -U postgres -d dao_eterno -f schema.sql
-- =============================================

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(20)  NOT NULL UNIQUE,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT         NOT NULL,
  is_admin      BOOLEAN      NOT NULL DEFAULT false,
  pending_gold  BIGINT       NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Migration: add pending_gold if upgrading from older schema
ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_gold BIGINT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS characters (
  id                SERIAL PRIMARY KEY,
  user_id           INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name              VARCHAR(24) NOT NULL,
  realm             VARCHAR(50) NOT NULL DEFAULT 'qi_refining',
  realm_stage       VARCHAR(20) NOT NULL DEFAULT 'initial',
  realm_level       INTEGER     NOT NULL DEFAULT 1,
  cultivation_power BIGINT      NOT NULL DEFAULT 0,
  experience        BIGINT      NOT NULL DEFAULT 0,
  hp_current        INTEGER     NOT NULL DEFAULT 100,
  hp_max            INTEGER     NOT NULL DEFAULT 100,
  qi_current        INTEGER     NOT NULL DEFAULT 0,
  qi_max            INTEGER     NOT NULL DEFAULT 400,
  strength          INTEGER     NOT NULL DEFAULT 5,
  agility           INTEGER     NOT NULL DEFAULT 5,
  vitality          INTEGER     NOT NULL DEFAULT 5,
  defense           INTEGER     NOT NULL DEFAULT 3,
  perception        INTEGER     NOT NULL DEFAULT 3,
  affinity          VARCHAR(20) NOT NULL DEFAULT 'Fogo',
  gender            VARCHAR(10) NOT NULL DEFAULT 'masculino',
  inventory         JSONB,
  skills            JSONB,
  bestiary          JSONB,
  spirit_gold       BIGINT      NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_played_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS legends (
  id                    SERIAL PRIMARY KEY,
  user_id               INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_character_id INTEGER,
  name                  VARCHAR(24) NOT NULL,
  realm                 VARCHAR(50) NOT NULL,
  realm_stage           VARCHAR(20) NOT NULL,
  realm_level           INTEGER     NOT NULL DEFAULT 1,
  cultivation_power     BIGINT      NOT NULL DEFAULT 0,
  cause_of_death        TEXT        NOT NULL DEFAULT 'Causas desconhecidas',
  born_at               TIMESTAMPTZ NOT NULL,
  died_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_characters_user    ON characters(user_id);
CREATE INDEX IF NOT EXISTS idx_characters_power   ON characters(cultivation_power DESC);
CREATE INDEX IF NOT EXISTS idx_legends_user       ON legends(user_id);
CREATE INDEX IF NOT EXISTS idx_legends_power      ON legends(cultivation_power DESC);

CREATE TABLE IF NOT EXISTS game_items (
  id          VARCHAR(60) PRIMARY KEY,
  name        TEXT        NOT NULL,
  emoji       VARCHAR(20) NOT NULL DEFAULT '📦',
  type        VARCHAR(20) NOT NULL,
  rarity      VARCHAR(20) NOT NULL DEFAULT 'common',
  description TEXT        NOT NULL DEFAULT '',
  stats       JSONB       NOT NULL DEFAULT '{}',
  stackable   BOOLEAN     NOT NULL DEFAULT false,
  active      BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_monsters (
  id              VARCHAR(60)  PRIMARY KEY,
  name            TEXT         NOT NULL,
  emoji           VARCHAR(20)  NOT NULL DEFAULT '👾',
  level_min       INTEGER      NOT NULL DEFAULT 1,
  level_max       INTEGER      NOT NULL DEFAULT 5,
  rarity          VARCHAR(20)  NOT NULL DEFAULT 'common',
  biome_id        VARCHAR(60)  NOT NULL,
  is_boss         BOOLEAN      NOT NULL DEFAULT false,
  base_hp         INTEGER      NOT NULL DEFAULT 50,
  base_atk        INTEGER      NOT NULL DEFAULT 5,
  base_def        INTEGER      NOT NULL DEFAULT 1,
  speed           DECIMAL(5,2) NOT NULL DEFAULT 1.5,
  qi_reward       INTEGER      NOT NULL DEFAULT 10,
  gold_reward_min INTEGER      NOT NULL DEFAULT 1,
  gold_reward_max INTEGER      NOT NULL DEFAULT 5,
  drop_table      JSONB        NOT NULL DEFAULT '[]',
  active          BOOLEAN      NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_recipes (
  id              VARCHAR(60) PRIMARY KEY,
  name            TEXT        NOT NULL,
  category        VARCHAR(20) NOT NULL DEFAULT 'forja',
  output_item_id  VARCHAR(60) NOT NULL,
  output_quantity INTEGER     NOT NULL DEFAULT 1,
  required_tier   INTEGER     NOT NULL DEFAULT 1,
  ingredients     JSONB       NOT NULL DEFAULT '[]',
  active          BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_listings (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id   INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  char_id     INTEGER     NOT NULL,
  seller_name TEXT        NOT NULL,
  item_def_id VARCHAR(60) NOT NULL,
  item_data   JSONB       NOT NULL DEFAULT '{}',
  quantity    INTEGER     NOT NULL,
  price       INTEGER     NOT NULL,
  active      BOOLEAN     NOT NULL DEFAULT true,
  listed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sold_at     TIMESTAMPTZ,
  buyer_id    INTEGER REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_market_active   ON market_listings(active, listed_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_seller   ON market_listings(seller_id, active);

CREATE TABLE IF NOT EXISTS game_settings (
  key   VARCHAR(60) PRIMARY KEY,
  value TEXT NOT NULL
);
INSERT INTO game_settings (key, value) VALUES
  ('item_sprite_size',     '40'),
  ('monster_sprite_size',  '56'),
  ('material_sprite_size', '32')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS game_biomes (
  id                VARCHAR(60)  PRIMARY KEY,
  name              TEXT         NOT NULL,
  description       TEXT         NOT NULL DEFAULT '',
  required_realm    VARCHAR(50)  NOT NULL DEFAULT 'qi_refining',
  required_stage    VARCHAR(20)  NOT NULL DEFAULT 'initial',
  difficulty        INTEGER      NOT NULL DEFAULT 1,
  biome_type        VARCHAR(20)  NOT NULL DEFAULT 'fixed',
  active_days       JSONB        NOT NULL DEFAULT '[0,1,2,3,4,5,6]',
  active_start_time VARCHAR(5),
  active_end_time   VARCHAR(5),
  active_until      TIMESTAMPTZ,
  enemy_pool        JSONB        NOT NULL DEFAULT '[]',
  boss_id           VARCHAR(60),
  min_kills_boss    INTEGER      NOT NULL DEFAULT 10,
  boss_spawn_chance DECIMAL(5,2) NOT NULL DEFAULT 0.20,
  rarity_weights    JSONB        NOT NULL DEFAULT '{}',
  boss_rarity       VARCHAR(20)  NOT NULL DEFAULT 'rare',
  gradient          TEXT         NOT NULL DEFAULT 'linear-gradient(135deg, #0d1a18 0%, #1a2d28 100%)',
  accent_color      VARCHAR(30)  NOT NULL DEFAULT '#4a9e7f',
  sort_order        INTEGER      NOT NULL DEFAULT 0,
  active            BOOLEAN      NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_breakthroughs (
  id             VARCHAR(80) PRIMARY KEY,
  realm          VARCHAR(50) NOT NULL,
  stage          VARCHAR(20) NOT NULL,
  next_realm     VARCHAR(50) NOT NULL,
  next_stage     VARCHAR(20) NOT NULL,
  new_max_qi     BIGINT      NOT NULL DEFAULT 400,
  required_items JSONB       NOT NULL DEFAULT '[]',
  active         BOOLEAN     NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migrations: colunas adicionadas após criação inicial das tabelas
ALTER TABLE game_items    ADD COLUMN IF NOT EXISTS sprite_url TEXT;
ALTER TABLE game_monsters ADD COLUMN IF NOT EXISTS sprite_url TEXT;
ALTER TABLE characters    ADD COLUMN IF NOT EXISTS luck INTEGER NOT NULL DEFAULT 0;
ALTER TABLE game_biomes   ADD COLUMN IF NOT EXISTS background_url TEXT;
ALTER TABLE game_biomes   ADD COLUMN IF NOT EXISTS background_position TEXT;
ALTER TABLE game_monsters ALTER COLUMN biome_id TYPE VARCHAR(60);
ALTER TABLE market_listings ADD COLUMN IF NOT EXISTS buyer_name TEXT;
ALTER TABLE game_items    ADD COLUMN IF NOT EXISTS max_stack INTEGER;
ALTER TABLE characters    ADD COLUMN IF NOT EXISTS total_kills INTEGER NOT NULL DEFAULT 0;
ALTER TABLE legends       ADD COLUMN IF NOT EXISTS total_kills INTEGER NOT NULL DEFAULT 0;
ALTER TABLE legends       ADD COLUMN IF NOT EXISTS equipped_snapshot JSONB;
ALTER TABLE game_monsters ADD COLUMN IF NOT EXISTS is_elite BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE game_biomes   ADD COLUMN IF NOT EXISTS elite_id VARCHAR(60);
ALTER TABLE game_biomes   ADD COLUMN IF NOT EXISTS min_kills_elite INTEGER NOT NULL DEFAULT 15;
ALTER TABLE characters    ADD COLUMN IF NOT EXISTS pending_items JSONB NOT NULL DEFAULT '[]';
ALTER TABLE game_biomes   ADD COLUMN IF NOT EXISTS stat_modifiers JSONB NOT NULL DEFAULT '{"common":{"hp":100,"atk":100,"def":100},"elite":{"hp":100,"atk":100,"def":100},"boss":{"hp":100,"atk":100,"def":100}}'::jsonb;

-- Inicializa inventário nulo com anel espacial básico
UPDATE characters
SET inventory = '{"items":[{"instanceId":"ring-initial","definitionId":"ring_leather","quantity":1,"obtainedAt":0}],"equipped":{"weapon":null,"armor":null,"accessory":null,"ring":{"instanceId":"ring-initial","definitionId":"ring_leather","quantity":1,"obtainedAt":0}},"maxSlots":30}'::jsonb
WHERE inventory IS NULL;

-- Normaliza realm/stage: personagens criados com DEFAULT inglês ('qi_refining'/'initial')
-- são convertidos para português para compatibilidade com game_breakthroughs.
UPDATE characters SET realm = 'Refinamento de Qi'        WHERE realm = 'qi_refining';
UPDATE characters SET realm = 'Fundação Espiritual'      WHERE realm = 'foundation';
UPDATE characters SET realm = 'Núcleo Dourado'           WHERE realm = 'golden_core';
UPDATE characters SET realm = 'Alma Nascente'            WHERE realm = 'nascent_soul';
UPDATE characters SET realm = 'Transformação Espiritual' WHERE realm = 'spirit_transformation';
UPDATE characters SET realm = 'Unificação'               WHERE realm = 'unification';
UPDATE characters SET realm = 'Ascensão'                 WHERE realm = 'ascension';
UPDATE characters SET realm = 'Imortal'                  WHERE realm = 'immortal';
UPDATE characters SET realm_stage = 'Inicial'            WHERE realm_stage = 'initial';
UPDATE characters SET realm_stage = 'Médio'              WHERE realm_stage = 'middle';
UPDATE characters SET realm_stage = 'Avançado'           WHERE realm_stage = 'advanced';
UPDATE characters SET realm_stage = 'Pico'               WHERE realm_stage = 'peak';
-- Corrige o DEFAULT das colunas para que novos personagens nasçam em português
ALTER TABLE characters ALTER COLUMN realm       SET DEFAULT 'Refinamento de Qi';
ALTER TABLE characters ALTER COLUMN realm_stage SET DEFAULT 'Inicial';

-- Injeta anel espacial básico em inventários existentes que não o possuem
UPDATE characters
SET inventory = jsonb_set(
    jsonb_set(
      inventory,
      '{items}',
      COALESCE(inventory->'items', '[]'::jsonb)
        || '[{"instanceId":"ring-initial","definitionId":"ring_leather","quantity":1,"obtainedAt":0}]'::jsonb
    ),
    '{equipped,ring}',
    '{"instanceId":"ring-initial","definitionId":"ring_leather","quantity":1,"obtainedAt":0}'::jsonb,
    true
  )
WHERE inventory IS NOT NULL
  AND NOT (
    COALESCE(inventory->'items', '[]'::jsonb)
    @> '[{"definitionId":"ring_leather"}]'::jsonb
  );
