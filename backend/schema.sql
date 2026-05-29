-- =============================================================================
-- Education Credentials - MySQL Schema
-- =============================================================================
-- Privacy design:
--   ON-CHAIN  → credential_hash (Blake2b-224), issuer wallet address, PolicyId
--   OFF-CHAIN → all PII: student name, email, DOB, grade, institution details
-- =============================================================================

CREATE DATABASE IF NOT EXISTS edu_credentials CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE edu_credentials;

-- ---------------------------------------------------------------------------
-- institutions (issuers)
-- ---------------------------------------------------------------------------
CREATE TABLE institutions (
  id              CHAR(36)      PRIMARY KEY DEFAULT (UUID()),
  name            VARCHAR(255)  NOT NULL,
  slug            VARCHAR(100)  NOT NULL UNIQUE,
  logo_url        VARCHAR(500),
  website         VARCHAR(500),
  wallet_address  VARCHAR(120)  NOT NULL UNIQUE,   -- Cardano bech32 addr
  policy_id       CHAR(56),                         -- Plutus PolicyId hex
  is_active       TINYINT(1)    NOT NULL DEFAULT 1,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_wallet (wallet_address),
  INDEX idx_policy (policy_id)
);

-- ---------------------------------------------------------------------------
-- admin_users
-- ---------------------------------------------------------------------------
CREATE TABLE admin_users (
  id              CHAR(36)      PRIMARY KEY DEFAULT (UUID()),
  email           VARCHAR(255)  NOT NULL UNIQUE,
  password_hash   VARCHAR(255)  NOT NULL,           -- bcrypt
  role            ENUM('super_admin','institution_admin') NOT NULL DEFAULT 'institution_admin',
  institution_id  CHAR(36),
  is_active       TINYINT(1)    NOT NULL DEFAULT 1,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE SET NULL,
  INDEX idx_email (email)
);

-- ---------------------------------------------------------------------------
-- credentials  (core table — off-chain private data)
-- ---------------------------------------------------------------------------
CREATE TABLE credentials (
  id                CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
  credential_type   ENUM('diploma','certificate','micro_credential') NOT NULL,
  title             VARCHAR(255) NOT NULL,                -- e.g. "Bachelor of Science"
  description       TEXT,
  institution_id    CHAR(36)     NOT NULL,

  -- Holder (student) — PII stored here only, never on-chain
  holder_name       VARCHAR(255) NOT NULL,
  holder_email      VARCHAR(255) NOT NULL,
  holder_wallet     VARCHAR(120),                          -- optional bech32

  -- Credential details
  issue_date        DATE         NOT NULL,
  expiry_date       DATE,
  grade             VARCHAR(50),
  metadata_json     JSON,                                  -- extra fields

  -- On-chain references (no PII)
  credential_hash   CHAR(56)     NOT NULL UNIQUE,          -- Blake2b-224 hex
  tx_hash           CHAR(64),                              -- Cardano tx hash
  tx_index          SMALLINT     UNSIGNED,
  block_height      BIGINT       UNSIGNED,
  policy_id         CHAR(56),                              -- minting policy

  -- Lifecycle
  status            ENUM('draft','issued','revoked') NOT NULL DEFAULT 'draft',
  claim_token       CHAR(64)     UNIQUE,                   -- one-time claim link
  claim_expires_at  DATETIME,
  claimed_at        DATETIME,
  revoked_at        DATETIME,
  revocation_reason VARCHAR(500),
  revoke_tx_hash    CHAR(64),

  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (institution_id) REFERENCES institutions(id),
  INDEX idx_hash   (credential_hash),
  INDEX idx_holder (holder_email),
  INDEX idx_status (status),
  INDEX idx_wallet (holder_wallet)
);

-- ---------------------------------------------------------------------------
-- verification_logs  (audit trail — no PII logged)
-- ---------------------------------------------------------------------------
CREATE TABLE verification_logs (
  id              CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
  credential_id   CHAR(36),
  credential_hash CHAR(56)     NOT NULL,
  verifier_ip     VARCHAR(45),
  verifier_agent  VARCHAR(500),
  result          ENUM('valid','invalid','revoked','not_found') NOT NULL,
  chain_confirmed TINYINT(1)   NOT NULL DEFAULT 0,
  verified_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_cred  (credential_id),
  INDEX idx_hash  (credential_hash)
);

-- ---------------------------------------------------------------------------
-- api_keys  (for institution programmatic access)
-- ---------------------------------------------------------------------------
CREATE TABLE api_keys (
  id              CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
  institution_id  CHAR(36)     NOT NULL,
  key_hash        CHAR(64)     NOT NULL UNIQUE,   -- SHA-256 of raw key
  label           VARCHAR(100),
  last_used_at    DATETIME,
  expires_at      DATETIME,
  is_active       TINYINT(1)   NOT NULL DEFAULT 1,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  INDEX idx_key   (key_hash)
);

-- ---------------------------------------------------------------------------
-- Seed: demo institution (update wallet_address before deploying)
-- ---------------------------------------------------------------------------
INSERT INTO institutions (id, name, slug, wallet_address)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'Demo University',
  'demo-university',
  'addr_test1qz000000000000000000000000000000000000000000000000000000'
);

INSERT INTO admin_users (email, password_hash, role, institution_id) VALUES
(
  'admin@demo.edu',
  '$2b$12$PLACEHOLDER_HASH_REPLACE_ON_FIRST_RUN',  -- set via POST /api/auth/setup
  'institution_admin',
  'aaaaaaaa-0000-0000-0000-000000000001'
);