<?php

// Used only by Start-FreeDemo.ps1, bound to loopback behind cloudflared.
require_once __DIR__.'/DemoRouter.php';
$root = dirname(__DIR__);
$result = \EduPath\Demo\DemoRouter::resolve(
    $_SERVER['REQUEST_URI'] ?? '/',
    getenv('EDUPATH_DEMO_FRONTEND_DIR') ?: $root.'/output/demo-frontend',
    $root.'/backend/storage/app/public',
);
header('X-Content-Type-Options: nosniff');
if (($result['type'] ?? '') === 'laravel') {
    $_SERVER['SCRIPT_NAME'] = '/index.php';
    $_SERVER['PHP_SELF'] = '/index.php';
    $_SERVER['SCRIPT_FILENAME'] = $root.'/backend/public/index.php';
    require $root.'/backend/public/index.php';
    return true;
}
header('Cache-Control: no-store');
if (isset($result['status'])) {
    http_response_code($result['status']);
    header('Content-Type: text/plain; charset=UTF-8');
    echo 'This resource is unavailable. Use the EduPath application to access protected files.';
    return true;
}
if (!in_array($_SERVER['REQUEST_METHOD'] ?? 'GET', ['GET', 'HEAD'], true)) {
    http_response_code(405);
    header('Allow: GET, HEAD');
    return true;
}
header('Content-Type: '.$result['mime']);
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'HEAD') readfile($result['file']);
return true;
