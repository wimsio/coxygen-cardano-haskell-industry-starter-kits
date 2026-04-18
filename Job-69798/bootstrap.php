<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/helpers.php';

if (function_exists('start_secure_session')) {
  start_secure_session();
} else {
  // fallback so admin/customer endpoints still work
  if (session_status() !== PHP_SESSION_ACTIVE) session_start();
}
