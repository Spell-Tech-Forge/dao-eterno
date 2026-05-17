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
  realm             VARCHAR(50) NOT NULL DEFAULT 'Refinamento de Qi',
  realm_stage       VARCHAR(20) NOT NULL DEFAULT 'Inicial',
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
  biome_id        VARCHAR(30)  NOT NULL,
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
  ('item_sprite_size',    '40'),
  ('monster_sprite_size', '56')
ON CONFLICT (key) DO NOTHING;

-- Migrations: colunas adicionadas após criação inicial das tabelas
ALTER TABLE game_items    ADD COLUMN IF NOT EXISTS sprite_url TEXT;
ALTER TABLE game_monsters ADD COLUMN IF NOT EXISTS sprite_url TEXT;
ALTER TABLE characters    ADD COLUMN IF NOT EXISTS luck INTEGER NOT NULL DEFAULT 0;
