-- =============================================
-- Dao Eterno — Schema PostgreSQL
-- Execute: psql -U postgres -d dao_eterno -f schema.sql
-- =============================================

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(20)  NOT NULL UNIQUE,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT         NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

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
  qi_current        INTEGER     NOT NULL DEFAULT 50,
  qi_max            INTEGER     NOT NULL DEFAULT 50,
  strength          INTEGER     NOT NULL DEFAULT 5,
  agility           INTEGER     NOT NULL DEFAULT 5,
  vitality          INTEGER     NOT NULL DEFAULT 5,
  defense           INTEGER     NOT NULL DEFAULT 3,
  perception        INTEGER     NOT NULL DEFAULT 3,
  affinity          VARCHAR(20) NOT NULL DEFAULT 'Fogo',
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
