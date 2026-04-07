CREATE TABLE admins (
  id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','reviewer') NOT NULL DEFAULT 'reviewer',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE users (
  id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  email_verified_at DATETIME NULL,
  email_verified TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE user_wallets (
  id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT(11) NOT NULL,
  wallet_address VARCHAR(255) NOT NULL,
  wallet_address_hash CHAR(64) NOT NULL UNIQUE,
  status ENUM('pending','verified','revoked') NOT NULL DEFAULT 'pending',
  verified_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_wallets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE invoices (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  invoice_ref VARCHAR(191) NOT NULL UNIQUE,
  issuer_user_id INT(10) UNSIGNED NOT NULL,
  issuer_wallet_address VARCHAR(255) NOT NULL,
  issuer_wallet_hash CHAR(64) NOT NULL,
  nft_policy_id VARCHAR(128) NOT NULL,
  nft_asset_name VARCHAR(128) NOT NULL,
  nft_unit VARCHAR(191) NOT NULL,
  face_value_lovelace DECIMAL(30,0) NOT NULL,
  repayment_lovelace DECIMAL(30,0) NOT NULL,
  document_path VARCHAR(255) NOT NULL,
  document_url VARCHAR(255) NOT NULL,
  document_mime VARCHAR(100) NOT NULL,
  file_hash_hex VARCHAR(128) NOT NULL,
  mint_tx_hash VARCHAR(128) NULL,
  status ENUM('minted','funded','repaid') NOT NULL DEFAULT 'minted',
  funded_by_wallet_address VARCHAR(255) NULL,
  funded_by_wallet_hash CHAR(64) NULL,
  fund_tx_hash VARCHAR(128) NULL,
  repay_tx_hash VARCHAR(128) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_issuer_user_id (issuer_user_id),
  INDEX idx_issuer_wallet_hash (issuer_wallet_hash),
  INDEX idx_funded_by_wallet_hash (funded_by_wallet_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE invoice_transactions (
  id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  tx_hash VARCHAR(80) NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  invoice_ref VARCHAR(120) NULL,
  actor_wallet_address VARCHAR(255) NOT NULL,
  actor_wallet_hash CHAR(64) NOT NULL,
  counterparty_wallet_address VARCHAR(255) NULL,
  counterparty_wallet_hash CHAR(64) NULL,
  amount_lovelace BIGINT(20) NULL,
  asset_unit VARCHAR(120) DEFAULT 'lovelace',
  status ENUM('submitted','confirmed','failed') NOT NULL DEFAULT 'submitted',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  face_value_lovelace BIGINT(20) NULL,
  repayment_lovelace BIGINT(20) NULL,
  CONSTRAINT uniq_tx_action UNIQUE (tx_hash, action_type),
  INDEX idx_actor (actor_wallet_hash),
  INDEX idx_counterparty (counterparty_wallet_hash),
  INDEX idx_invoice (invoice_ref)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;