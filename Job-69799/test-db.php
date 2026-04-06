<?php
require __DIR__ . '/db.php';

try {
    db();
    echo "DB CONNECTED ✅";
} catch (Throwable $e) {
    echo "DB ERROR ❌: " . $e->getMessage();
}
