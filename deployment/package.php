<?php

// Package source and the production web build. Never package live state.
// Run from the repository root: php deployment/package.php
$root = dirname(__DIR__);
if (!class_exists(ZipArchive::class)) { fwrite(STDERR, "PHP ZipArchive is required.\n"); exit(1); }
if (!is_file($root.'/frontend/dist/index.html')) { fwrite(STDERR, "Build the production frontend first.\n"); exit(1); }

$files = [];
$add = function (string $relative) use ($root, &$files): void {
    $file = $root.'/'.$relative;
    if (!is_file($file) || is_link($file)) throw new RuntimeException('Required package file unavailable: '.$relative);
    $files[$relative] = $file;
};
$tree = function (string $relative, callable $accept) use ($root, &$files): void {
    $directory = $root.'/'.$relative;
    if (!is_dir($directory)) throw new RuntimeException('Required package directory unavailable: '.$relative);
    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($directory, FilesystemIterator::SKIP_DOTS));
    foreach ($iterator as $file) {
        if (!$file->isFile() || $file->isLink()) continue;
        $name = str_replace('\\', '/', substr($file->getPathname(), strlen($root) + 1));
        if ($accept($name)) $files[$name] = $file->getPathname();
    }
};

try {
    foreach (['app', 'config', 'database', 'routes'] as $directory) {
        $tree('backend/'.$directory, fn ($name) => str_ends_with($name, '.php'));
    }
    $tree('backend/resources', fn ($name) => (bool) preg_match('/\.(php|css|js)$/', $name));
    $tree('frontend/dist', fn ($name) => !str_ends_with($name, '.map') && !str_contains($name, '/.'));
    foreach (['artisan', 'composer.json', 'composer.lock', '.env.production.example', '.env.example',
        'bootstrap/app.php', 'bootstrap/providers.php', 'public/index.php', 'public/.htaccess'] as $name) $add('backend/'.$name);
    foreach (['nginx.conf.example', 'supervisor.conf.example', 'cron.example', 'php-overrides.ini.example', 'README.md', 'verification.md', 'Build-Mobile.ps1'] as $name) $add('deployment/'.$name);
    ksort($files);

    $output = $root.'/output';
    if (!is_dir($output) && !mkdir($output, 0775, true)) throw new RuntimeException('Cannot create output directory.');
    $archive = $output.'/edupath-production-'.gmdate('Ymd-His').'-'.bin2hex(random_bytes(3)).'.zip';
    $zip = new ZipArchive();
    if ($zip->open($archive, ZipArchive::CREATE | ZipArchive::EXCL) !== true) throw new RuntimeException('Cannot create deployment archive.');
    $manifest = [];
    try {
        foreach ($files as $name => $source) {
            if (!$zip->addFile($source, $name)) throw new RuntimeException('Cannot add package file.');
            $manifest[$name] = hash_file('sha256', $source);
        }
        foreach (['bootstrap/cache', 'storage/app/private', 'storage/app/public', 'storage/framework/cache/data',
            'storage/framework/sessions', 'storage/framework/views', 'storage/logs'] as $directory) {
            $zip->addEmptyDir('backend/'.$directory);
        }
        $zip->addFromString('release-manifest.json', json_encode(['built_at_utc' => gmdate(DATE_ATOM), 'files' => $manifest], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    } finally { $zip->close(); }

    $verify = new ZipArchive();
    if ($verify->open($archive) !== true) throw new RuntimeException('Cannot reopen deployment archive.');
    try {
        foreach ($manifest as $name => $hash) {
            $data = $verify->getFromName($name);
            if ($data === false || !hash_equals($hash, hash('sha256', $data))) throw new RuntimeException('Package checksum verification failed.');
        }
        for ($index = 0; $index < $verify->numFiles; $index++) {
            $name = $verify->getNameIndex($index);
            if (preg_match('#(?:^|/)(?:\.env(?:\.local|\.production)?|firebase-credentials[^/]*\.json|vendor|node_modules)(?:/|$)#', $name)
                || preg_match('/\.(?:sql|bak|log)$/', $name)) throw new RuntimeException('Private or development file found in package.');
        }
    } finally { $verify->close(); }
    echo 'Created and checksum-verified '.count($manifest).' files: '.$archive.PHP_EOL;
    echo 'Archive SHA256: '.hash_file('sha256', $archive).PHP_EOL;
    if (file_put_contents($archive.'.sha256', hash_file('sha256', $archive).'  '.basename($archive).PHP_EOL) === false) {
        throw new RuntimeException('Cannot write archive checksum file.');
    }
    echo "Database records, uploaded files, live environment variables and credentials are excluded. Transfer existing data privately as described in deployment/README.md.\n";
} catch (Throwable $error) {
    fwrite(STDERR, 'Packaging failed: '.$error->getMessage().PHP_EOL);
    exit(1);
}
