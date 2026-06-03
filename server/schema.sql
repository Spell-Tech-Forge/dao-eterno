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
ALTER TABLE characters    ADD COLUMN IF NOT EXISTS total_playtime_seconds BIGINT NOT NULL DEFAULT 0;
ALTER TABLE legends       ADD COLUMN IF NOT EXISTS character_snapshot JSONB;
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

-- game_breakthroughs usa inglês (qi_refining/initial) — garante que personagens
-- que possam ter ficado com valores em português (migração anterior incorreta)
-- sejam revertidos para inglês, formato canônico.
UPDATE characters SET realm = 'qi_refining'          WHERE realm = 'Refinamento de Qi';
UPDATE characters SET realm = 'foundation'           WHERE realm = 'Fundação Espiritual';
UPDATE characters SET realm = 'golden_core'          WHERE realm = 'Núcleo Dourado';
UPDATE characters SET realm = 'nascent_soul'         WHERE realm = 'Alma Nascente';
UPDATE characters SET realm = 'spirit_transformation' WHERE realm = 'Transformação Espiritual';
UPDATE characters SET realm = 'unification'          WHERE realm = 'Unificação';
UPDATE characters SET realm = 'ascension'            WHERE realm = 'Ascensão';
UPDATE characters SET realm = 'immortal'             WHERE realm = 'Imortal';
UPDATE characters SET realm_stage = 'initial'        WHERE realm_stage = 'Inicial';
UPDATE characters SET realm_stage = 'middle'         WHERE realm_stage = 'Médio';
UPDATE characters SET realm_stage = 'advanced'       WHERE realm_stage = 'Avançado';
UPDATE characters SET realm_stage = 'peak'           WHERE realm_stage = 'Pico';
-- Garante DEFAULT em inglês (formato canônico)
ALTER TABLE characters ALTER COLUMN realm       SET DEFAULT 'qi_refining';
ALTER TABLE characters ALTER COLUMN realm_stage SET DEFAULT 'initial';

-- ── v0.32.1: Phase 2 — Life Destruction + Sistema de Leis ──────────────────

-- Tabela de leis do universo
CREATE TABLE IF NOT EXISTS game_laws (
  id          VARCHAR(40) PRIMARY KEY,
  name        TEXT        NOT NULL,
  description TEXT        NOT NULL DEFAULT '',
  emoji       VARCHAR(20) NOT NULL DEFAULT '✨',
  affinity    VARCHAR(20),
  -- Bônus por nível de compreensão (JSONB: {atk_pct, def_pct, hp_pct, crit_pct, speed_pct, qi_rate_pct})
  bonus_fragment JSONB NOT NULL DEFAULT '{}',
  bonus_initial  JSONB NOT NULL DEFAULT '{}',
  bonus_middle   JSONB NOT NULL DEFAULT '{}',
  bonus_advanced JSONB NOT NULL DEFAULT '{}',
  bonus_complete JSONB NOT NULL DEFAULT '{}',
  -- Requisito mínimo de realm para cada nível
  min_realm_initial  VARCHAR(50) NOT NULL DEFAULT 'houtian',
  min_realm_middle   VARCHAR(50) NOT NULL DEFAULT 'xiantian',
  min_realm_advanced VARCHAR(50) NOT NULL DEFAULT 'revolving_core',
  min_realm_complete VARCHAR(50) NOT NULL DEFAULT 'divine_sea',
  -- Fragmentos necessários para avançar cada nível
  fragments_to_initial  INTEGER NOT NULL DEFAULT 5,
  fragments_to_middle   INTEGER NOT NULL DEFAULT 20,
  fragments_to_advanced INTEGER NOT NULL DEFAULT 50,
  fragments_to_complete INTEGER NOT NULL DEFAULT 100,
  -- ID do item fragmento correspondente
  fragment_item_id VARCHAR(60),
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  active      BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Compreensão de leis do personagem (JSONB: { "law_fire": "initial", ... })
ALTER TABLE characters ADD COLUMN IF NOT EXISTS laws JSONB NOT NULL DEFAULT '{}';

-- Probabilidades de falha da Destruição da Vida (configurável via game_settings)
INSERT INTO game_settings (key, value) VALUES
  ('life_destruction_config', '{"fail_chance_7": 25, "fail_chance_8": 40, "fail_chance_9": 60}')
ON CONFLICT (key) DO NOTHING;

-- ── v0.32: Redesign do Sistema de Cultivo (Martial World) ───────────────────

-- required_kills em breakthroughs: [{biomeId, count}]
ALTER TABLE game_breakthroughs ADD COLUMN IF NOT EXISTS required_kills JSONB NOT NULL DEFAULT '[]';

-- Deleta personagens que ainda usam o sistema de cultivo antigo (migração v0.32)
-- Só apaga se existirem personagens com realms do sistema antigo
DELETE FROM characters WHERE realm IN (
  'qi_refining','foundation','golden_core','nascent_soul',
  'spirit_transformation','unification','ascension','immortal',
  'Refinamento de Qi','Fundação Espiritual','Núcleo Dourado','Alma Nascente',
  'Transformação Espiritual','Unificação','Ascensão','Imortal'
);

-- Normaliza realms antigos → novos em qualquer personagem remanescente
UPDATE characters SET realm = 'body_tempering'       WHERE realm IN ('qi_refining', 'Refinamento de Qi');
UPDATE characters SET realm = 'houtian'              WHERE realm IN ('foundation', 'Fundação Espiritual');
UPDATE characters SET realm = 'xiantian'             WHERE realm IN ('golden_core', 'Núcleo Dourado');
UPDATE characters SET realm = 'revolving_core'       WHERE realm IN ('nascent_soul', 'Alma Nascente');
UPDATE characters SET realm = 'divine_sea'           WHERE realm IN ('spirit_transformation', 'Transformação Espiritual');
UPDATE characters SET realm = 'divine_transformation'WHERE realm IN ('unification', 'Unificação');
UPDATE characters SET realm = 'divine_lord'          WHERE realm IN ('ascension', 'Ascensão');
UPDATE characters SET realm = 'holy_lord'            WHERE realm IN ('immortal', 'Imortal');
UPDATE characters SET realm_stage = 'strength'       WHERE realm = 'body_tempering' AND realm_stage IN ('initial','Inicial');
UPDATE characters SET realm_stage = 'initial'        WHERE realm_stage IN ('Inicial') AND realm != 'body_tempering';
UPDATE characters SET realm_stage = 'middle'         WHERE realm_stage = 'Médio';
UPDATE characters SET realm_stage = 'advanced'       WHERE realm_stage = 'Avançado';
UPDATE characters SET realm_stage = 'peak'           WHERE realm_stage = 'Pico';
ALTER TABLE characters ALTER COLUMN realm       SET DEFAULT 'body_tempering';
ALTER TABLE characters ALTER COLUMN realm_stage SET DEFAULT 'strength';

-- ── v0.31: Sistema de Classes e Talentos ────────────────────────────────────

-- Tabela de classes de personagem
CREATE TABLE IF NOT EXISTS game_classes (
  id                      VARCHAR(40) PRIMARY KEY,
  name                    TEXT        NOT NULL,
  emoji                   VARCHAR(20) NOT NULL DEFAULT '⚔️',
  description             TEXT        NOT NULL DEFAULT '',
  allowed_weapon_type     VARCHAR(30) NOT NULL,
  allowed_armor_type      VARCHAR(30) NOT NULL,
  allowed_accessory_type  VARCHAR(30) NOT NULL,
  color                   VARCHAR(30) NOT NULL DEFAULT '#4a9e7f',
  sort_order              INTEGER     NOT NULL DEFAULT 0,
  active                  BOOLEAN     NOT NULL DEFAULT true,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Nós da árvore de talentos por classe
CREATE TABLE IF NOT EXISTS game_talent_nodes (
  id               VARCHAR(80)    PRIMARY KEY,
  class_id         VARCHAR(40)    NOT NULL REFERENCES game_classes(id) ON DELETE CASCADE,
  name             TEXT           NOT NULL,
  description      TEXT           NOT NULL DEFAULT '',
  effect_type      VARCHAR(40)    NOT NULL,
  effect_value     DECIMAL(10,2)  NOT NULL DEFAULT 0,
  required_realm   VARCHAR(50)    NOT NULL DEFAULT 'qi_refining',
  required_stage   VARCHAR(20)    NOT NULL DEFAULT 'initial',
  point_cost       INTEGER        NOT NULL DEFAULT 1,
  position_row     INTEGER        NOT NULL DEFAULT 0,
  position_col     INTEGER        NOT NULL DEFAULT 0,
  required_node_id VARCHAR(80)    REFERENCES game_talent_nodes(id),
  active           BOOLEAN        NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_talent_nodes_class ON game_talent_nodes(class_id);
ALTER TABLE game_talent_nodes ADD COLUMN IF NOT EXISTS max_level INTEGER NOT NULL DEFAULT 1;
ALTER TABLE game_classes ADD COLUMN IF NOT EXISTS sprite_url TEXT;

-- Colunas de classe e talentos no personagem
ALTER TABLE characters ADD COLUMN IF NOT EXISTS class_id         VARCHAR(40);
ALTER TABLE characters ADD COLUMN IF NOT EXISTS talent_points    INTEGER NOT NULL DEFAULT 0;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS unlocked_talents JSONB   NOT NULL DEFAULT '[]';
ALTER TABLE characters ADD COLUMN IF NOT EXISTS attribute_points INTEGER NOT NULL DEFAULT 0;

-- Subtype de item (necessário para lock de equipamento por classe)
ALTER TABLE game_items ADD COLUMN IF NOT EXISTS subtype VARCHAR(30);

-- Preenche subtype para itens existentes
UPDATE game_items SET subtype = 'faixas'    WHERE id LIKE 'faixas_%'    AND type = 'weapon';
UPDATE game_items SET subtype = 'espada'    WHERE id LIKE 'espada_%'    AND type = 'weapon';
UPDATE game_items SET subtype = 'sabre'     WHERE id LIKE 'sabre_%'     AND type = 'weapon';
UPDATE game_items SET subtype = 'lanca'     WHERE id LIKE 'lanca_%'     AND type = 'weapon';
UPDATE game_items SET subtype = 'leque'     WHERE id LIKE 'leque_%'     AND type = 'weapon';
UPDATE game_items SET subtype = 'manto'     WHERE id LIKE 'manto_%'     AND type = 'armor';
UPDATE game_items SET subtype = 'couro'     WHERE id LIKE 'coura_%'     AND type = 'armor';
UPDATE game_items SET subtype = 'armadura'  WHERE id LIKE 'armadura_%'  AND type = 'armor';
UPDATE game_items SET subtype = 'standard'  WHERE type = 'accessory'    AND subtype IS NULL;

-- Remove personagens sem class_id (reset para sistema de classes v0.31)
-- Só apaga personagens que ainda não têm classe definida
DELETE FROM characters WHERE class_id IS NULL;

-- Adiciona pontos de talento por breakthrough no stat_config default
UPDATE game_settings SET value = jsonb_set(
  value::jsonb,
  '{talentPointsPerBreakthrough}',
  '1'
)::text WHERE key = 'stat_config' AND (value::jsonb -> 'talentPointsPerBreakthrough') IS NULL;

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

-- ── v0.35: Sistema de Localizações (Mapa do Mundo) ──────────────────────────

CREATE TABLE IF NOT EXISTS game_locations (
  id               VARCHAR(60) PRIMARY KEY,
  name             TEXT        NOT NULL,
  description      TEXT        NOT NULL DEFAULT '',
  emoji            VARCHAR(20) NOT NULL DEFAULT '🗺️',
  type             VARCHAR(20) NOT NULL DEFAULT 'village', -- village | city
  required_realm   VARCHAR(50) NOT NULL DEFAULT 'body_tempering',
  required_stage   VARCHAR(20) NOT NULL DEFAULT 'strength',
  required_boss_id VARCHAR(60),          -- ID do boss que deve estar morto para viajar aqui
  map_x            DECIMAL(8,2) NOT NULL DEFAULT 0,
  map_y            DECIMAL(8,2) NOT NULL DEFAULT 0,
  connected_to     JSONB       NOT NULL DEFAULT '[]',   -- IDs de locais conectados
  services         JSONB       NOT NULL DEFAULT '[]',   -- serviços disponíveis
  sort_order       INTEGER     NOT NULL DEFAULT 0,
  active           BOOLEAN     NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Biomas pertencem a uma localização
ALTER TABLE game_biomes ADD COLUMN IF NOT EXISTS location_id VARCHAR(60);

-- Personagem tem localização atual
ALTER TABLE game_biomes ADD COLUMN IF NOT EXISTS map_x DECIMAL(8,2) NOT NULL DEFAULT 0;
ALTER TABLE game_biomes ADD COLUMN IF NOT EXISTS map_y DECIMAL(8,2) NOT NULL DEFAULT 0;
ALTER TABLE game_locations ADD COLUMN IF NOT EXISTS background_url TEXT;
ALTER TABLE game_locations ADD COLUMN IF NOT EXISTS background_position VARCHAR(30) DEFAULT 'center';
ALTER TABLE characters ADD COLUMN IF NOT EXISTS current_location_id VARCHAR(60) NOT NULL DEFAULT 'vila_despertar';
UPDATE characters SET current_location_id = 'vila_despertar' WHERE current_location_id IS NULL OR current_location_id = '';
