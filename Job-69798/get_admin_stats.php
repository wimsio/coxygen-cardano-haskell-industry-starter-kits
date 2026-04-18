<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/admin_auth.php';

require_admin();
header('Content-Type: application/json');

try {
    $pdo = db();

    // Total value locked from deposits minus executed claims.
    $stmt = $pdo->query("
        SELECT
          COALESCE(SUM(CASE WHEN action_type = 'deposit_pool' THEN amount_lovelace ELSE 0 END), 0) AS deposits,
          COALESCE(SUM(CASE WHEN action_type = 'execute_claim' THEN amount_lovelace ELSE 0 END), 0) AS payouts
        FROM insurance_transactions
        WHERE status IN ('submitted', 'confirmed')
    ");
    $totals = $stmt->fetch(PDO::FETCH_ASSOC);

    $depositsAda = ((float)($totals['deposits'] ?? 0)) / 1000000;
    $payoutsAda = ((float)($totals['payouts'] ?? 0)) / 1000000;
    $tvlAda = max(0, $depositsAda - $payoutsAda);

    // Total active risk = total coverage amount of active covers.
    $stmt = $pdo->query("
        SELECT COALESCE(SUM(coverage_amount_ada), 0) AS total_active_risk
        FROM cover_purchases
        WHERE status = 'active'
          AND end_date >= NOW()
          AND protocol_name <> 'Sundaeswap'
    ");
    $riskRow = $stmt->fetch(PDO::FETCH_ASSOC);
    $activeRisk = (float)($riskRow['total_active_risk'] ?? 0);

    // Total members = wallets that minted membership.
    $stmt = $pdo->query("
        SELECT COUNT(DISTINCT actor_wallet_address) AS total_members
        FROM insurance_transactions
        WHERE action_type = 'mint_membership_sbt'
          AND status IN ('submitted', 'confirmed')
    ");
    $memberRow = $stmt->fetch(PDO::FETCH_ASSOC);
    $totalMembers = (int)($memberRow['total_members'] ?? 0);

    // Payout ratio = payouts / deposits
    $payoutRatio = $depositsAda > 0 ? ($payoutsAda / $depositsAda) * 100 : 0;

    echo json_encode([
        'ok' => true,
        'stats' => [
            'total_value_locked_ada' => round($tvlAda, 2),
            'total_active_risk_ada' => round($activeRisk, 2),
            'total_members' => $totalMembers,
            'payout_ratio_percent' => round($payoutRatio, 2),
        ]
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}