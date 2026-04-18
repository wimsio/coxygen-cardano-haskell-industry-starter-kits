<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

header('Content-Type: application/json');

try {
    $limit = (int)($_GET['limit'] ?? 3);
    if ($limit < 1) $limit = 3;
    if ($limit > 20) $limit = 3;

    $pdo = db();

    $stmt = $pdo->prepare("
        SELECT
            t.reference_id AS asset_unit,
            t.amount_lovelace,
            t.created_at,
            d.description,
            cd.original_name
        FROM insurance_transactions t
        LEFT JOIN claim_descriptions d
            ON d.asset_unit = t.reference_id
        LEFT JOIN claim_documents cd
            ON cd.asset_unit = t.reference_id
        WHERE t.action_type = 'submit_claim'
        ORDER BY t.created_at DESC
        LIMIT :lim
    ");

    $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
    $stmt->execute();

    $claims = [];

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $amountAda = ((float)($row['amount_lovelace'] ?? 0)) / 1000000;

        $claims[] = [
            'title' => $row['original_name'] ?: 'Claim Submission',
            'description' => $row['description'] ?: 'No description provided.',
            'claim_amount_ada' => $amountAda,
            'created_at' => $row['created_at'],
        ];
    }

    echo json_encode([
        'ok' => true,
        'claims' => $claims
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => $e->getMessage()
    ]);
}