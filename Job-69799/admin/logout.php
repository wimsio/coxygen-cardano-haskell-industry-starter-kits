<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../helpers.php';

unset($_SESSION['admin_id']);
session_regenerate_id(true);

redirect('/admin/login.php');
