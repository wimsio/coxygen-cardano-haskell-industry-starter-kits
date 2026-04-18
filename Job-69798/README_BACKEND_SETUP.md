# Insurance Finance Backend Setup (PHP + MySQL + Sessions + CSRF + SMTP)

## 1) Windows + XAMPP + phpMyAdmin Checklist

1. Install XAMPP (PHP 8.1+ recommended) and start **Apache** + **MySQL**.
2. Copy this repo into `C:\xampp\htdocs\Defi-Insurance`.
3. Open phpMyAdmin (`http://localhost/phpmyadmin`), create DB: `insurance_finance`.
4. Import SQL schema (section below) into `insurance_finance`.
5. In repo root run Composer:
   - `composer require phpmailer/phpmailer`
6. Update `config.php`:
   - `app.url`
   - DB credentials
   - SMTP credentials
   - admin email allowlist
   - `dev_bypass_email_verification` for local dev only
7. Ensure upload directory exists and is writable:
   - `storage/kyc_uploads`
8. Open app:
   - Landing: `http://localhost/Defi-Insurance/index.html`
   - Launch routing: `http://localhost/Defi-Insurance/launch.php`

## 2) SQL Schema

```sql
CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  email_verified_at DATETIME NULL,
  wallet_address VARCHAR(255) NULL,
  wallet_address_hash CHAR(64) NULL,
  wallet_verified_at DATETIME NULL,
  role ENUM('user','admin') NOT NULL DEFAULT 'user',
  created_at DATETIME NOT NULL,
  INDEX idx_users_wallet_hash (wallet_address_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE email_verifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL,
  CONSTRAINT fk_email_verifications_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_email_verifications_user (user_id),
  INDEX idx_email_verifications_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE kyc_submissions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  full_name VARCHAR(190) NOT NULL,
  phone_number VARCHAR(60) NOT NULL,
  country VARCHAR(120) NOT NULL,
  business_name VARCHAR(190) NULL,
  id_document_path VARCHAR(255) NOT NULL,
  id_document_mime VARCHAR(120) NOT NULL,
  id_document_size BIGINT UNSIGNED NOT NULL,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  admin_notes TEXT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_kyc_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_kyc_user (user_id),
  INDEX idx_kyc_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE insurance_transactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tx_hash VARCHAR(120) NULL,
  action_type ENUM('deposit_pool','withdraw_shares','submit_claim','vote_claim','execute_claim','mint_membership_sbt','premium_payment') NOT NULL,
  reference_id VARCHAR(255) NULL,
  actor_wallet_address VARCHAR(255) NULL,
  counterparty_wallet_address VARCHAR(255) NULL,
  amount_lovelace BIGINT NULL,
  asset_unit VARCHAR(255) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'submitted',
  created_at DATETIME NOT NULL,
  INDEX idx_transactions_action (action_type),
  INDEX idx_transactions_actor (actor_wallet_address),
  INDEX idx_transactions_counterparty (counterparty_wallet_address),
  INDEX idx_transactions_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

> Admin approach used: allowlist emails in `config.php` (`security.admin_email_allowlist`) and/or set `users.role='admin'`.

## 3) Route Flow Implemented

- `index.html` Launch buttons route to `launch.php`.
- `launch.php` gates by:
  - not logged in -> `/login.php`
  - unverified -> `/verify_notice.php` (unless dev bypass)
  - KYC not approved -> `/kyc_status.php`
  - verified + approved -> `/main.html`

## 4) Frontend Wiring Notes

Already wired in code:
- `main.html` stats placeholders + recent transactions table + wallet lookup section.
- `app.js`:
  - `ensureRegisteredWalletOrFail(address)` via `wallet_status.php`
  - `bindWalletToAccount()` via `wallet_challenge.php` + `wallet_bind.php`
  - logs all tx actions to `log_tx.php`
  - loads `stats.php` and `recent_transactions.php`
  - wallet lookup via `tx_history.php`
- `mint.js` logs `mint_membership_sbt`

## 5) Security Measures Implemented

- PDO prepared statements everywhere
- `password_hash`/`password_verify`
- `session_regenerate_id(true)` on login/verify
- CSRF on all POST forms
- verification token stored as sha256 hash
- upload validation MIME + max 5MB + random filename
- no raw stack traces to client; errors logged via `error_log`

## 6) End-to-End Test Plan

1. Register new user (`/register.php`).
2. Verify received email link (`/verify.php?token=...`) or dev bypass in config.
3. Submit KYC (`/kyc.php`) with PDF/JPG/PNG.
4. Login as admin (`/admin/login.php`), approve in dashboard.
5. User reaches `main.html`.
6. Connect wallet; first connect signs bind challenge and stores wallet.
7. Try different wallet for same account -> blocked by wallet status enforcement.
8. Run dApp actions: mint membership, deposit, withdraw, submit claim, vote, execute.
9. Confirm `stats.php` values update and recent tx table updates.
10. Test wallet history lookup with `tx_history.php?address=...`.
