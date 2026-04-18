<?php
declare(strict_types=1);

/**
 * log_tx.php (Insurance dApp)
 *
 * Stores tx events from your Lucid frontend.
 * - Requires user login (session)
 * - Accepts JSON body
 * - Supports insurance actions:
 *   deposit_pool, withdraw_shares, submit_claim, vote_claim, execute_claim, mint_membership_sbt
 * - Premium payment is represented by deposit_pool (NO premium_payment action)
 *
 * SECURITY NOTES:
 * - This endpoint does NOT “verify on-chain”. It just logs what the UI reports.
 *   For full production integrity, you can later add a server-side Blockfrost verification job.
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/auth.php';

start_secure_session();
require_login();

header('Content-Type: application/json; charset=utf-8');

function respond(int $code, array $payload): void {
  http_response_code($code);
  echo json_encode($payload);
  exit;
}

$raw = file_get_contents('php://input');
$input = json_decode($raw ?: '', true);

if (!is_array($input)) {
  respond(400, ['ok' => false, 'error' => 'Invalid JSON body.']);
}

$txHash = strtolower(trim((string)($input['tx_hash'] ?? '')));
$actionType = trim((string)($input['action_type'] ?? ''));
$referenceId = isset($input['reference_id']) ? trim((string)$input['reference_id']) : null;

$actorAddr = trim((string)($input['actor_wallet_address'] ?? ''));
$counterAddr = isset($input['counterparty_wallet_address']) ? trim((string)$input['counterparty_wallet_address']) : null;

$amount = $input['amount_lovelace'] ?? null;
$assetUnit = trim((string)($input['asset_unit'] ?? 'lovelace'));

$status = trim((string)($input['status'] ?? 'submitted')); // submitted|confirmed|failed
$metadata = $input['metadata'] ?? null;

$allowedActions = [
  'deposit_pool',
  'withdraw_shares',
  'submit_claim',
  'vote_claim',
  'execute_claim',
  'mint_membership_sbt',
];

// tx_hash validation (Cardano tx hash = 64 hex chars)
if ($txHash === '' || !preg_match('/^[0-9a-f]{64}$/', $txHash)) {
  respond(400, ['ok' => false, 'error' => 'Invalid tx_hash. Expected 64 hex chars.']);
}

if ($actionType === '' || !in_array($actionType, $allowedActions, true)) {
  respond(400, ['ok' => false, 'error' => 'Invalid action_type.']);
}

if ($actorAddr === '') {
  respond(400, ['ok' => false, 'error' => 'actor_wallet_address is required.']);
}

if (!in_array($status, ['submitted', 'confirmed', 'failed'], true)) {
  respond(400, ['ok' => false, 'error' => 'Invalid status.']);
}

// amount_lovelace: allow null; if set must be numeric >= 0
$amountVal = null;
if ($amount !== null && $amount !== '') {
  // allow string or number coming from JS
  if (!is_string($amount) && !is_int($amount) && !is_float($amount)) {
    respond(400, ['ok' => false, 'error' => 'amount_lovelace must be a number or string.']);
  }
  $amountStr = trim((string)$amount);
  if ($amountStr !== '' && (!preg_match('/^\d+$/', $amountStr))) {
    respond(400, ['ok' => false, 'error' => 'amount_lovelace must be an integer >= 0.']);
  }
  $amountVal = $amountStr === '' ? null : $amountStr;
}

// metadata JSON: allow null; if provided ensure it's JSON-serializable
$metadataJson = null;
if ($metadata !== null) {
  $metadataJson = json_encode($metadata, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  if ($metadataJson === false) {
    respond(400, ['ok' => false, 'error' => 'metadata is not JSON-serializable.']);
  }
}

$userId = (int)($_SESSION['user_id'] ?? 0);
if ($userId <= 0) {
  respond(401, ['ok' => false, 'error' => 'Not authenticated.']);
}

try {
  $pdo = db();

  // Ensure tx_hash unique; update on duplicates
  $stmt = $pdo->prepare("
    INSERT INTO insurance_transactions
      (user_id, tx_hash, action_type, reference_id,
       actor_wallet_address, counterparty_wallet_address,
       amount_lovelace, asset_unit, metadata, status, created_at, updated_at)
    VALUES
      (:user_id, :tx_hash, :action_type, :reference_id,
       :actor_wallet_address, :counterparty_wallet_address,
       :amount_lovelace, :asset_unit, :metadata, :status, NOW(), NOW())
    ON DUPLICATE KEY UPDATE
      user_id = VALUES(user_id),
      action_type = VALUES(action_type),
      reference_id = VALUES(reference_id),
      actor_wallet_address = VALUES(actor_wallet_address),
      counterparty_wallet_address = VALUES(counterparty_wallet_address),
      amount_lovelace = VALUES(amount_lovelace),
      asset_unit = VALUES(asset_unit),
      metadata = VALUES(metadata),
      status = VALUES(status),
      updated_at = NOW()
  ");

  $stmt->execute([
    ':user_id' => $userId,
    ':tx_hash' => $txHash,
    ':action_type' => $actionType,
    ':reference_id' => $referenceId,
    ':actor_wallet_address' => $actorAddr,
    ':counterparty_wallet_address' => $counterAddr,
    ':amount_lovelace' => $amountVal,
    ':asset_unit' => ($assetUnit !== '' ? $assetUnit : 'lovelace'),
    ':metadata' => $metadataJson,
    ':status' => $status,
  ]);

  respond(200, ['ok' => true]);
} catch (Throwable $e) {
  error_log('insurance log_tx error: ' . $e->getMessage());
  respond(500, ['ok' => false, 'error' => 'Server error.']);
}
