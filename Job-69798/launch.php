<?php
require_once __DIR__ . '/auth.php';

$user = current_user();
if (!$user) {
    redirect('/login.php');
}
