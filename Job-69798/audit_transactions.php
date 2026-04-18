<?php
declare(strict_types=1);

/**
 * audit_transactions.php
 * 
 * Fetches all transactions with optional wallet address filtering.
 * Uses the actor_wallet_address field from insurance_transactions table.
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

// Get parameters
$walletAddress = isset($_GET['wallet']) ? trim($_GET['wallet']) : null;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 500;
$offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

try {
    $pdo = db();
    
    // Base query
    $baseQuery = "FROM insurance_transactions WHERE 1=1";
    $params = [];
    
    // Add wallet filter if provided (search by actor_wallet_address)
    if (!empty($walletAddress)) {
        $baseQuery .= " AND actor_wallet_address LIKE :wallet";
        $params[':wallet'] = '%' . $walletAddress . '%';
    }
    
    // Get total count
    $countStmt = $pdo->prepare("SELECT COUNT(*) as total " . $baseQuery);
    foreach ($params as $key => $value) {
        $countStmt->bindValue($key, $value);
    }
    $countStmt->execute();
    $totalCount = (int)$countStmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Get paginated results
    $query = "
        SELECT 
            id,
            tx_hash,
            action_type,
            reference_id,
            actor_wallet_address,
            counterparty_wallet_address,
            amount_lovelace,
            asset_unit,
            status,
            created_at,
            updated_at,
            metadata
        " . $baseQuery . "
        ORDER BY id DESC
        LIMIT :limit OFFSET :offset
    ";
    
    $stmt = $pdo->prepare($query);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format amount from lovelace to ADA
    foreach ($rows as &$row) {
        if ($row['amount_lovelace'] !== null && $row['amount_lovelace'] !== '') {
            $lovelace = (int)$row['amount_lovelace'];
            $row['amount_ada'] = $lovelace / 1_000_000;
            $row['amount_display'] = number_format($row['amount_ada'], 2);
            
            // Add + sign for deposits if needed
            if ($row['action_type'] === 'deposit_pool') {
                $row['amount_display'] = '+' . $row['amount_display'];
            }
        } else {
            $row['amount_display'] = '—';
            $row['amount_ada'] = null;
        }
        
        // Format action for display
        $actionMap = [
            'deposit_pool' => 'Vault Deposit',
            'withdraw_shares' => 'Withdraw Shares',
            'submit_claim' => 'Claim Created',
            'vote_claim' => 'Community Vote',
            'execute_claim' => 'Executed Payout',
            'mint_membership_sbt' => 'Mint Membership',
        ];
        $row['action_display'] = $actionMap[$row['action_type']] ?? ucfirst(str_replace('_', ' ', $row['action_type']));
        
        // Format date
        $row['date_display'] = date('M d, Y H:i:s T', strtotime($row['created_at']));
        
        // Shorten wallet address for display
        $row['wallet_short'] = strlen($row['actor_wallet_address']) > 20 
            ? substr($row['actor_wallet_address'], 0, 12) . '...' . substr($row['actor_wallet_address'], -6)
            : $row['actor_wallet_address'];
        
        // Status badge class
        $statusClass = 'status-pending';
        if ($row['status'] === 'confirmed' || $row['status'] === 'executed') {
            $statusClass = 'status-executed';
        } elseif ($row['status'] === 'success') {
            $statusClass = 'status-success';
        }
        $row['status_class'] = $statusClass;
        $row['status_display'] = ucfirst($row['status']);
    }
    
    echo json_encode([
        'ok' => true,
        'total' => $totalCount,
        'limit' => $limit,
        'offset' => $offset,
        'has_more' => ($offset + $limit) < $totalCount,
        'transactions' => $rows,
        'filter_wallet' => $walletAddress
    ], JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    
} catch (Throwable $e) {
    error_log('audit_transactions error: ' . $e->getMessage());
    echo json_encode([
        'ok' => false,
        'error' => 'Failed to fetch transactions: ' . $e->getMessage()
    ]);
    exit;
}
?>