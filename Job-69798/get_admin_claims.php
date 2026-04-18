<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/admin_security.php';

//require_admin();
header('Content-Type: application/json');

try {
    $limit = (int)($_GET['limit'] ?? 100);
    if ($limit < 1) $limit = 100;
    if ($limit > 500) $limit = 500;

    $pdo = db();

    $stmt = $pdo->prepare("
        SELECT
            cd.asset_unit,
            cd.document_url,
            cd.original_name,
            cd.actor_wallet_address,
            cd.created_at,
            COALESCE(d.description, '') AS description,
            COALESCE(t.amount_lovelace, 0) AS amount_lovelace,
            COALESCE(r.status, 'pending') AS review_status,
            r.reason,
            r.tx_hash
        FROM claim_documents cd
        LEFT JOIN claim_descriptions d
          ON d.asset_unit COLLATE utf8mb4_general_ci = cd.asset_unit COLLATE utf8mb4_general_ci
        LEFT JOIN insurance_transactions t
          ON t.reference_id COLLATE utf8mb4_general_ci = cd.asset_unit COLLATE utf8mb4_general_ci
         AND t.action_type = 'submit_claim'
        LEFT JOIN admin_claim_reviews r
          ON r.asset_unit COLLATE utf8mb4_general_ci = cd.asset_unit COLLATE utf8mb4_general_ci
        ORDER BY cd.created_at DESC
        LIMIT :lim
    ");
    $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
    $stmt->execute();

    $claims = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $claims[] = [
            'asset_unit' => $row['asset_unit'],
            'wallet_address' => $row['actor_wallet_address'],
            'document_url' => $row['document_url'],
            'document_name' => $row['original_name'],
            'description' => $row['description'] ?: 'No description provided.',
            'amount_ada' => round(((float)$row['amount_lovelace']) / 1000000, 2),
            'status' => $row['review_status'],
            'reason' => $row['reason'],
            'tx_hash' => $row['tx_hash'],
            'created_at' => $row['created_at'],
        ];
    }

    echo json_encode(['ok' => true, 'claims' => $claims]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}