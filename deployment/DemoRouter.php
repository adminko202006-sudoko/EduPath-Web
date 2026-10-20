<?php

namespace EduPath\Demo;

/** Resolve demo requests without allowing PHP's static server to bypass checks. */
final class DemoRouter
{
    public static function resolve(string $uri, string $frontend, string $storage): array
    {
        $path = parse_url($uri, PHP_URL_PATH);
        if (!is_string($path)) return ['status' => 400];
        for ($i = 0; $i < 8; $i++) {
            $decoded = rawurldecode($path);
            if ($decoded === $path) break;
            $path = $decoded;
        }
        if (preg_match('/[%\\x00-\\x1f\\x7f\\\\]/', $path)) return ['status' => 403];
        foreach (explode('/', $path) as $segment) {
            if (str_starts_with($segment, '.') || str_contains($segment, ':')) return ['status' => 403];
        }
        if (preg_match('#^/storage/documents(?:/|$)#i', $path)) return ['status' => 403];
        if ($path === '/api' || str_starts_with($path, '/api/') || $path === '/up') {
            return ['type' => 'laravel'];
        }
        $publicStorage = str_starts_with($path, '/storage/');
        $root = realpath($publicStorage ? $storage : $frontend);
        $relative = $publicStorage ? substr($path, 9) : ltrim($path, '/');
        $file = $root ? realpath($root.DIRECTORY_SEPARATOR.$relative) : false;
        $types = $publicStorage ? [
            'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png',
            'gif' => 'image/gif', 'webp' => 'image/webp', 'pdf' => 'application/pdf',
        ] : [
            'js' => 'text/javascript', 'css' => 'text/css', 'html' => 'text/html',
            'png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg',
            'svg' => 'image/svg+xml', 'ico' => 'image/x-icon', 'webp' => 'image/webp',
            'gif' => 'image/gif', 'woff' => 'font/woff', 'woff2' => 'font/woff2',
            'ttf' => 'font/ttf', 'txt' => 'text/plain',
        ];
        if ($file && is_file($file) && $root && self::inside($file, $root)) {
            // A symlink must not make private documents available as another filename.
            if ($publicStorage && self::inside($file, $root.DIRECTORY_SEPARATOR.'documents')) return ['status' => 403];
            $extension = strtolower(pathinfo($file, PATHINFO_EXTENSION));
            return isset($types[$extension])
                ? ['type' => 'file', 'file' => $file, 'mime' => $types[$extension]]
                : ['status' => 403];
        }
        if ($publicStorage || str_starts_with($path, '/assets/') || pathinfo($path, PATHINFO_EXTENSION)) {
            return ['status' => 404];
        }
        $index = $root ? realpath($root.'/index.html') : false;
        return $index && self::inside($index, $root)
            ? ['type' => 'file', 'file' => $index, 'mime' => 'text/html']
            : ['status' => 503];
    }

    private static function inside(string $file, string $root): bool
    {
        return str_starts_with(strtolower(str_replace('\\', '/', $file)), rtrim(strtolower(str_replace('\\', '/', $root)), '/').'/');
    }
}
