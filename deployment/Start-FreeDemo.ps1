param(
    [ValidateRange(1024,65535)][int]$Port = 8088,
    [switch]$LocalOnly,
    [switch]$SkipBuild,
    [switch]$SkipBackgroundJobs,
    [ValidateRange(0,86400)][int]$RunSeconds = 0
)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$backend = Join-Path $root 'backend'
$frontend = Join-Path $root 'frontend'
$runtime = Join-Path $root 'storage/free-demo'
$build = Join-Path $root 'output/demo-frontend'
if (![IO.Path]::GetFullPath($build).StartsWith([IO.Path]::GetFullPath($root).TrimEnd('\') + '\', [StringComparison]::OrdinalIgnoreCase)) {
    throw 'Demo build directory must be inside the EduPath workspace.'
}
$php = (Get-Command php -ErrorAction Stop).Source
$children = [Collections.Generic.List[System.Diagnostics.Process]]::new()
$overrides = @('APP_ENV','APP_DEBUG','APP_URL','FRONTEND_URL','CORS_ALLOWED_ORIGINS','SESSION_SECURE_COOKIE','EDUPATH_DEMO_MODE','EDUPATH_DEMO_FRONTEND_DIR','VITE_API_BASE_URL')
$previous = @{}
foreach ($name in $overrides) { $previous[$name] = [Environment]::GetEnvironmentVariable($name, 'Process') }
function Start-DemoProcess([string]$Executable, [string[]]$Arguments, [string]$Name) {
    $process = Start-Process -FilePath $Executable -ArgumentList $Arguments -WorkingDirectory $backend -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtime "$Name.out.log") -RedirectStandardError (Join-Path $runtime "$Name.err.log")
    $children.Add($process)
    return $process
}
function Assert-DemoChildren {
    foreach ($child in $children) {
        if ($child.HasExited) { throw "A demo process stopped (PID $($child.Id)). Review storage/free-demo logs." }
    }
}
try {
    if (Test-Path -LiteralPath (Join-Path $backend 'bootstrap/cache/config.php')) {
        throw 'Laravel configuration is cached. Run php artisan config:clear in backend before starting the demo so its temporary HTTPS settings can take effect.'
    }
    if (!(Test-Path -LiteralPath (Join-Path $backend 'vendor/autoload.php')) -or !(Test-Path -LiteralPath (Join-Path $backend '.env'))) {
        throw 'Use your configured local backend with its existing .env and installed dependencies.'
    }
    $probe = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $Port)
    try { $probe.Start() } finally { $probe.Stop() }
    $cloudflared = $null
    if (!$LocalOnly) {
        $installed = Get-Command cloudflared -ErrorAction SilentlyContinue
        $cloudflared = if ($installed) { $installed.Source } else { Join-Path $root 'storage/tools/cloudflared.exe' }
        if (!(Test-Path -LiteralPath $cloudflared)) { throw 'First run .\deployment\Install-Cloudflared.ps1 (free, no account needed).' }
        foreach ($file in @('config.yml','config.yaml')) {
            if (Test-Path -LiteralPath (Join-Path $env:USERPROFILE ".cloudflared/$file")) {
                throw 'An existing Cloudflare tunnel configuration was found. Quick Tunnels require running without that configuration; it has been left untouched.'
            }
        }
    }
    New-Item -ItemType Directory -Path $runtime -Force | Out-Null
    # Opening a second launcher must never truncate an active launcher's logs.
    $lock = [IO.File]::Open((Join-Path $runtime 'launcher.lock'), 'OpenOrCreate', 'ReadWrite', 'None')
    $addressFile = Join-Path $runtime 'connection.json'
    if (Test-Path -LiteralPath $addressFile) { Remove-Item -LiteralPath $addressFile }
    if (!$SkipBuild) {
        $env:VITE_API_BASE_URL = '/api'
        Push-Location $frontend
        try {
            & npm.cmd run build -- --outDir $build --emptyOutDir
            if ($LASTEXITCODE -ne 0) { throw 'Frontend build failed. The tunnel was not started.' }
        } finally { Pop-Location }
    }
    if (!(Test-Path -LiteralPath (Join-Path $build 'index.html'))) { throw 'Demo frontend build is missing. Run without -SkipBuild.' }
    $origin = "http://127.0.0.1:$Port"
    $publicUrl = $origin
    if (!$LocalOnly) {
        $tunnel = Start-DemoProcess $cloudflared @('tunnel','--no-autoupdate','--url',$origin) 'tunnel'
        $deadline = (Get-Date).AddSeconds(60)
        $publicUrl = $null
        do {
            Assert-DemoChildren
            $log = Get-Content -LiteralPath (Join-Path $runtime 'tunnel.err.log') -Raw -ErrorAction SilentlyContinue
            if ($log -match 'https://[a-z0-9-]+\.trycloudflare\.com') { $publicUrl = $Matches[0]; break }
            Start-Sleep -Milliseconds 300
        } while ((Get-Date) -lt $deadline)
        if (!$publicUrl) { throw 'No temporary HTTPS address was received. Review storage/free-demo/tunnel.err.log and check your internet connection.' }
    }
    $env:APP_ENV = 'production'
    $env:APP_DEBUG = 'false'
    $env:APP_URL = $publicUrl
    $env:FRONTEND_URL = $publicUrl
    $env:CORS_ALLOWED_ORIGINS = $publicUrl
    $env:SESSION_SECURE_COOKIE = if ($LocalOnly) { 'false' } else { 'true' }
    $env:EDUPATH_DEMO_MODE = 'true'
    $env:EDUPATH_DEMO_FRONTEND_DIR = $build
    $router = Join-Path $PSScriptRoot 'demo-router.php'
    $server = Start-DemoProcess $php @('-d','display_errors=0','-d','log_errors=1','-S',"127.0.0.1:$Port",'-t',('"' + (Join-Path $backend 'public') + '"'),('"' + $router + '"')) 'server'
    $ready = $false
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        Assert-DemoChildren
        try {
            $response = Invoke-WebRequest -UseBasicParsing -Uri "$origin/api/programs" -Headers @{Accept='application/json'} -TimeoutSec 3
            $body = $response.Content | ConvertFrom-Json
            if ($response.StatusCode -eq 200 -and $body.success -eq $true -and $null -ne $body.programs) { $ready = $true; break }
        } catch { if ($attempt -eq 29) { throw 'The local EduPath API failed its startup check. Confirm the MySQL Server used by your Workbench connection is running and that backend/.env matches it. Review storage/free-demo/server.err.log.' } }
        Start-Sleep -Milliseconds 300
    }
    if (!$ready) { throw 'The local address did not return the expected EduPath programs response.' }
    if (!$SkipBackgroundJobs) {
        $null = Start-DemoProcess $php @('artisan','queue:work','--sleep=3','--tries=3','--timeout=120') 'queue'
        $null = Start-DemoProcess $php @('artisan','schedule:work') 'scheduler'
    }
    $connection = [ordered]@{ web_url=$publicUrl; api_url="$publicUrl/api"; started_at=(Get-Date).ToUniversalTime().ToString('o'); temporary=$true; local_only=[bool]$LocalOnly; background_jobs=(!$SkipBackgroundJobs) }
    $connection | ConvertTo-Json | Set-Content -LiteralPath $addressFile -Encoding UTF8
    Write-Output "Web: $publicUrl"
    Write-Output "Mobile API: $publicUrl/api"
    Write-Output 'Local API startup check passed. Keep your MySQL Server, this terminal and your internet connection running. Workbench may be closed. Press Ctrl+C to stop.'
    if ($LocalOnly) { Write-Output 'Local verification only: no public tunnel. Open the web app through HTTPS in tunnel mode.' }
    if ($SkipBackgroundJobs) { Write-Output 'Queue worker and scheduled notifications are disabled for this run.' }
    $stopAt = if ($RunSeconds -gt 0) { (Get-Date).AddSeconds($RunSeconds) } else { $null }
    while (!$stopAt -or (Get-Date) -lt $stopAt) { Assert-DemoChildren; Start-Sleep -Milliseconds 500 }
} finally {
    foreach ($child in $children) { if (!$child.HasExited) { Stop-Process -Id $child.Id -ErrorAction SilentlyContinue } }
    if ($lock) {
        if ($addressFile -and (Test-Path -LiteralPath $addressFile)) { Remove-Item -LiteralPath $addressFile }
        $lock.Dispose()
    }
    foreach ($name in $overrides) { [Environment]::SetEnvironmentVariable($name, $previous[$name], 'Process') }
}
