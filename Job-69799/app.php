<?php

declare(strict_types=1);

require_once __DIR__ . '/auth.php';

require_kyc_approved();

readfile(__DIR__ . '/home.html');
