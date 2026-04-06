<?php
declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

/**
 * Escape output safely
 */
function e(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/**
 * Redirect helper
 */
function redirect(string $path): void
{
    if (!headers_sent()) {
        header('Location: ' . $path);
    }
    exit;
}

/**
 * Build app base URL safely (works on InfinityFree subdomains too)
 */
function app_url(): string
{
    if (defined('APP_URL') && APP_URL) {
        return rtrim((string) APP_URL, '/');
    }

    $https  = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
    $scheme = $https ? 'https' : 'http';
    $host   = $_SERVER['HTTP_HOST'] ?? 'localhost';

    return $scheme . '://' . $host;
}

/**
 * Start secure session (REQUIRED for login, admin, CSRF)
 */
function start_secure_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');

    session_name('invoice_finance_session');

    session_set_cookie_params([
        'lifetime' => 7200,
        'path'     => '/',
        'domain'   => '',
        'secure'   => $secure,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);

    ini_set('session.use_strict_mode', '1');
    ini_set('session.cookie_httponly', '1');

    session_start();
}

/**
 * Send email verification link using Brevo SMTP (PHPMailer)
 */
/**
 * Send OTP email (Brevo API) - nice card with big OTP
 * NOTE: $token param now means OTP (e.g. "123456")
 */
function send_verification_email(string $toEmail, string $token): void
{
    $otp = trim($token);

    // Basic OTP validation (6 digits)
    if (!preg_match('/^\d{6}$/', $otp)) {
        error_log('OTP email not sent: invalid OTP format');
        return;
    }

    if (!defined('BREVO_API_KEY') || !BREVO_API_KEY) {
        error_log('Brevo API key not set');
        return;
    }

    $senderEmail = defined('BREVO_SENDER_EMAIL')
        ? (string) BREVO_SENDER_EMAIL
        : (defined('MAIL_FROM_EMAIL') ? (string) MAIL_FROM_EMAIL : ('no-reply@' . ($_SERVER['HTTP_HOST'] ?? 'localhost')));

    $senderName  = defined('BREVO_SENDER_NAME')
        ? (string) BREVO_SENDER_NAME
        : (defined('MAIL_FROM_NAME') ? (string) MAIL_FROM_NAME : 'InsuFinance');

    // Optional: app name / support line
    $appName = defined('MAIL_FROM_NAME') ? (string) MAIL_FROM_NAME : 'InsuFinance';

    $html = "
    <div style='background:#f6f7fb;padding:24px 0;font-family:Inter,Arial,sans-serif;'>
      <div style='max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;'>
        <div style='background:linear-gradient(135deg,#dc2626,#059669);padding:18px 22px;'>
          <div style='color:#ffffff;font-size:18px;font-weight:800;letter-spacing:0.2px;'>$appName</div>
          <div style='color:#ffffff;opacity:0.9;font-size:13px;margin-top:4px;'>Email verification OTP</div>
        </div>

        <div style='padding:22px;'>
          <h2 style='margin:0 0 10px 0;font-size:18px;color:#111827;'>Verify your email</h2>
          <p style='margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#374151;'>
            Use the OTP below to verify your account. This code expires in <strong>10 minutes</strong>.
          </p>

          <div style='text-align:center;margin:18px 0 10px 0;'>
            <div style='display:inline-block;background:#111827;color:#ffffff;padding:14px 18px;border-radius:12px;
                        font-size:28px;font-weight:900;letter-spacing:8px;'>
              {$otp}
            </div>
          </div>

          <p style='margin:14px 0 0 0;font-size:12px;line-height:1.6;color:#6b7280;'>
            If you didn’t create an account, you can ignore this email.
          </p>
        </div>

        <div style='padding:14px 22px;border-top:1px solid #e5e7eb;background:#fafafa;color:#6b7280;font-size:12px;'>
          Sent by {$senderName}
        </div>
      </div>
    </div>";

    $payload = [
        'sender' => [
            'name'  => $senderName,
            'email' => $senderEmail,
        ],
        'to' => [
            ['email' => $toEmail],
        ],
        'subject' => 'Your InsuFinance OTP Code',
        'htmlContent' => $html,
        'textContent' => "Your OTP code is: {$otp}\nThis code expires in 10 minutes.",
    ];

    $ch = curl_init('https://api.brevo.com/v3/smtp/email');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'accept: application/json',
            'content-type: application/json',
            'api-key: ' . BREVO_API_KEY,
        ],
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_TIMEOUT => 20,
    ]);

    $resp = curl_exec($ch);
    $err  = curl_error($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($resp === false) {
        error_log('Brevo curl error: ' . $err);
        return;
    }

    if ($code < 200 || $code >= 300) {
        error_log("Brevo API failed ({$code}): " . $resp);
        return;
    }
}


