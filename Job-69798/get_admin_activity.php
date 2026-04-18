<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/admin_auth.php';

require_admin();
header('Content-Type: application/json');

try {
    $limit = (int)($_GET['limit'] ?? 5);
    if ($limit < 1) $limit = 5;
    if ($limit > 5) $limit = 5;

    $pdo = db();

    $stmt = $pdo->prepare("
        SELECT
            action_type,
            actor_wallet_address,
            amount_lovelace,
            reference_id,
            status,
            created_at
        FROM insurance_transactions
        ORDER BY created_at DESC
        LIMIT :lim
    ");
    $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
    $stmt->execute();

    $activity = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $amountAda = ((float)($row['amount_lovelace'] ?? 0)) / 1000000;

        $title = match ($row['action_type']) {
            'mint_membership_sbt' => 'New Membership Minted',
            'deposit_pool' => number_format($amountAda, 2) . ' ADA Deposited to Pool',
            'submit_claim' => 'Claim ' . ($row['reference_id'] ?: '') . ' Submitted',
            'vote_claim' => 'Claim Vote Recorded',
            'execute_claim' => 'Payout Executed',
            'withdraw_shares' => number_format($amountAda, 2) . ' ADA Withdrawn',
            default => ucfirst(str_replace('_', ' ', $row['action_type'])),
        };

        $description = match ($row['action_type']) {
            'mint_membership_sbt' => 'Wallet ' . $row['actor_wallet_address'] . ' minted membership.',
            'deposit_pool' => 'Liquidity was added to the shared capital pool.',
            'submit_claim' => 'A new claim was submitted for review.',
            'vote_claim' => 'Governance vote was recorded.',
            'execute_claim' => 'A claim payout was executed.',
            'withdraw_shares' => 'Liquidity provider withdrew from the pool.',
            default => 'Protocol activity logged.',
        };

        $activity[] = [
            'title' => $title,
            'description' => $description,
            'created_at' => $row['created_at'],
            'status' => $row['status'],
        ];
    }

    echo json_encode([
        'ok' => true,
        'activity' => $activity
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}