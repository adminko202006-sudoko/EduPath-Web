<?php

// Create current-source archives for a hosted deployment session.
// This never stages, commits, pushes, or reads the live environment files.
$webRoot = dirname(__DIR__);
$mobileRoot = 'C:/Users/oseas/StudioProjects/edupath_mobile';
$output = $webRoot.'/output';
if (!class_exists(ZipArchive::class)) { fwrite(STDERR, "PHP ZipArchive is required.\n"); exit(1); }

function collectTree(string $root, string $directory, callable $accept, array &$files): void
{
    $path = $root.'/'.$directory;
    if (!is_dir($path)) throw new RuntimeException('Required source directory missing: '.$directory);
    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($path, FilesystemIterator::SKIP_DOTS));
    foreach ($iterator as $file) {
        if (!$file->isFile() || $file->isLink()) continue;
        $relative = str_replace('\\', '/', substr($file->getPathname(), strlen($root) + 1));
        if ($accept($relative)) $files[$relative] = $file->getPathname();
    }
}

function addSource(string $root, string $relative, array &$files): void
{
    if (!is_file($root.'/'.$relative) || is_link($root.'/'.$relative)) throw new RuntimeException('Required source missing: '.$relative);
    $files[$relative] = $root.'/'.$relative;
}

function archiveSources(string $output, string $name, array $files, string $note): string
{
    ksort($files);
    $archive = $output.'/'.$name;
    $zip = new ZipArchive();
    if ($zip->open($archive, ZipArchive::CREATE | ZipArchive::EXCL) !== true) throw new RuntimeException('Cannot create new source archive.');
    $manifest = [];
    try {
        foreach ($files as $relative => $file) {
            // Fail closed if an allowlist accidentally admits a private artifact.
            if (preg_match('#(?:^|/)(?:\.git|\.env(?:\.[^/]*)?|node_modules|vendor|build|\.dart_tool|\.gradle|\.kotlin|audit_backups|src/src)(?:/|$)#i', $relative)
                && !in_array($relative, ['backend/.env.example', 'backend/.env.production.example'], true)) {
                throw new RuntimeException('Disallowed handoff path: '.$relative);
            }
            if (preg_match('#(?:firebase-credentials[^/]*\.json|google-services\.json|GoogleService-Info\.plist|key\.properties|local\.properties)$#i', $relative)
                || preg_match('/\.(sql|bak|log|jks|keystore|pem|p12|pfx)$/i', $relative)) throw new RuntimeException('Private handoff file rejected: '.$relative);
            $content = file_get_contents($file);
            if ($content === false) throw new RuntimeException('Source read failed.');
            if (preg_match('/-----BEGIN (?:RSA |EC )?PRIVATE KEY-----\s+[A-Za-z0-9+\/=\r\n]{64,}-----END (?:RSA |EC )?PRIVATE KEY-----/', $content)
                || preg_match('/"type"\s*:\s*"service_account"/', $content)) throw new RuntimeException('Private key material rejected: '.$relative);
            if (!$zip->addFile($file, $relative)) throw new RuntimeException('Source could not be archived.');
            $manifest[$relative] = hash('sha256', $content);
        }
        $zip->addFromString('SOURCE-HANDOFF.md', $note);
        $zip->addFromString('source-manifest.json', json_encode(['created_at_utc' => gmdate(DATE_ATOM), 'files' => $manifest], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    } finally { $zip->close(); }

    $verify = new ZipArchive();
    if ($verify->open($archive) !== true) throw new RuntimeException('Source archive cannot be reopened.');
    try {
        foreach ($manifest as $relative => $hash) {
            $content = $verify->getFromName($relative);
            if ($content === false || !hash_equals($hash, hash('sha256', $content))) throw new RuntimeException('Source archive checksum mismatch.');
        }
    } finally { $verify->close(); }
    file_put_contents($archive.'.sha256', hash_file('sha256', $archive).'  '.$name.PHP_EOL);
    echo 'Verified '.count($manifest).' source files: '.$archive.PHP_EOL;
    return $archive;
}

try {
    if (!is_dir($output) && !mkdir($output, 0775, true)) throw new RuntimeException('Output directory unavailable.');
    $web = [];
    foreach (['app', 'config', 'database', 'routes', 'resources', 'tests'] as $directory) {
        collectTree($webRoot, 'backend/'.$directory, fn ($name) => (bool) preg_match('/\.(php|css|js)$/', $name), $web);
    }
    foreach (['artisan', 'composer.json', 'composer.lock', '.env.example', '.env.production.example',
        'bootstrap/app.php', 'bootstrap/providers.php', 'public/index.php', 'public/.htaccess', 'phpunit.xml'] as $name) addSource($webRoot, 'backend/'.$name, $web);
    collectTree($webRoot, 'frontend/src', fn ($name) => !str_contains($name, 'frontend/src/src/') && (bool) preg_match('/\.(jsx?|css|svg|png|jpe?g|webp|gif)$/i', $name), $web);
    collectTree($webRoot, 'frontend/public', fn ($name) => (bool) preg_match('/\.(svg|png|jpe?g|webp|gif|ico)$/i', $name), $web);
    collectTree($webRoot, 'frontend/tests', fn ($name) => str_ends_with($name, '.mjs'), $web);
    foreach (['package.json', 'package-lock.json', 'vite.config.js', 'eslint.config.js', 'index.html', '.gitignore'] as $name) addSource($webRoot, 'frontend/'.$name, $web);
    collectTree($webRoot, 'deployment', fn ($name) => (bool) preg_match('/\.(md|example|ps1|php)$/i', $name), $web);
    foreach (['AGENTS.md', '.gitignore'] as $name) addSource($webRoot, $name, $web);

    $mobile = [];
    foreach (['lib', 'test'] as $directory) collectTree($mobileRoot, $directory, fn ($name) => str_ends_with($name, '.dart'), $mobile);
    collectTree($mobileRoot, 'assets', fn ($name) => (bool) preg_match('/\.(svg|png|jpe?g|webp|gif|ico|json|ttf|otf)$/i', $name), $mobile);
    collectTree($mobileRoot, 'android', fn ($name) => !preg_match('#/(?:\.gradle|\.kotlin|build)/#', $name)
        && !preg_match('#/(?:google-services\.json|local\.properties|key\.properties)$#', $name)
        && ((bool) preg_match('/\.(kt|kts|xml|properties|png|webp)$/', $name) || in_array($name, ['android/gradlew', 'android/gradlew.bat', 'android/gradle/wrapper/gradle-wrapper.jar', 'android/.gitignore'], true)), $mobile);
    foreach (['pubspec.yaml', 'pubspec.lock', 'analysis_options.yaml', '.gitignore', '.metadata', 'README.md', 'ONLINE_EXAM_API_CONTRACT.md'] as $name) addSource($mobileRoot, $name, $mobile);

    $stamp = gmdate('Ymd-His').'-'.bin2hex(random_bytes(3));
    archiveSources($output, 'edupath-web-source-'.$stamp.'.zip', $web,
        "# EduPath current web source\n\nGit remote: https://github.com/adminko202006-sudoko/EduPath-Web\n\nThis archive contains the current local source, including uncommitted changes. It is not a Git push. It excludes installed dependencies, live data, credentials, uploads, and stale duplicate frontend trees. See deployment/README.md and verification.md.\n\nThe server must supply private configuration, persistent MySQL/storage, PHP dependencies, workers and scheduler. The existing generic Nginx configuration must be adapted to the selected Railway runtime; no Railway deployment configuration is claimed here. Do not overwrite the unrelated Public HTML Page service. Review the user's actual hosting plan and spending limit before provisioning paid resources.\n");
    archiveSources($output, 'edupath-mobile-source-'.$stamp.'.zip', $mobile,
        "# EduPath current Flutter Android source\n\nGit remote: https://github.com/adminko202006-sudoko/EduPath-Mobile\n\nThis archive contains current Flutter source, tests, assets, and Android build configuration, including uncommitted changes. It excludes local SDK paths, dependencies, caches, secret environment files, Firebase platform configuration, and signing keys. It is not an APK or a Git push.\n\nRestore the appropriate Android Firebase client configuration through a private authorized transfer before compiling elsewhere. The existing release build uses debug signing; configure institutional signing before public distribution. The local project retains its existing Firebase configuration and can build the APK locally once the deployed HTTPS API is verified.\n");
} catch (Throwable $error) {
    fwrite(STDERR, 'Source handoff failed: '.$error->getMessage().PHP_EOL);
    exit(1);
}
