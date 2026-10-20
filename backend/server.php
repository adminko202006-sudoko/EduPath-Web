<?php

// Laravel uses this router for `php artisan serve`. Apache uses public/.htaccess.
// Deny private legacy documents before PHP's built-in server serves static files.
$publicPath = __DIR__.'/public';
$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
for ($i = 0; $i < 4; $i++) {
    $decoded = rawurldecode($uri);
    if ($decoded === $uri) break;
    $uri = $decoded;
}
$uri = str_replace('\\', '/', $uri);
$segments = [];
foreach (explode('/', $uri) as $segment) {
    if ($segment === '' || $segment === '.') continue;
    if ($segment === '..') array_pop($segments);
    else $segments[] = $segment;
}
$normalized = '/'.implode('/', $segments);
$blocked = str_contains($uri, "\0") || preg_match('#^/storage/documents(?:/|$)#i', $normalized);
if (!$blocked && is_file($publicPath.$normalized)) {
    $file = realpath($publicPath.$normalized);
    $documents = realpath(__DIR__.'/storage/app/public/documents');
    if ($documents && $file) {
        $blocked = str_starts_with(strtolower(str_replace('\\', '/', $file)), strtolower(str_replace('\\', '/', $documents)).'/');
    }
}
if ($blocked) {
    http_response_code(403);
    header('Content-Type: text/plain; charset=UTF-8');
    header('Cache-Control: no-store');
    echo 'Access to application documents requires authentication.';
    return true;
}
if ($uri !== '/' && is_file($publicPath.$uri)) return false;
require_once $publicPath.'/index.php';
