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
function Resolve-DemoTool([string]$Name, [string[]]$FallbackPaths) {
    $command = Get-Command $Name -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($command) { return $command.Source }
    foreach ($candidate in $FallbackPaths) {
        if (Test-Path -LiteralPath $candidate -PathType Leaf) { return $candidate }
    }
    throw "$Name was not found. Install it or add its folder to PATH, then start EduPath again."
}
$php = Resolve-DemoTool 'php.exe' @('C:\xampp\php\php.exe')
$npm = if (!$SkipBuild) { Resolve-DemoTool 'npm.cmd' @((Join-Path $env:ProgramFiles 'nodejs\npm.cmd'), (Join-Path $env:APPDATA 'npm\npm.cmd')) } else { $null }
$children = [Collections.Generic.List[System.Diagnostics.Process]]::new()
$lock = $null
$addressFile = Join-Path $runtime 'connection.json'
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
    New-Item -ItemType Directory -Path $runtime -Force | Out-Null
    # Check the launcher lock before probing the port or touching active logs.
    try {
        $lock = [IO.File]::Open((Join-Path $runtime 'launcher.lock'), 'OpenOrCreate', 'ReadWrite', 'None')
    } catch [IO.IOException] {
        # Only a sharing/lock violation means another launcher owns the file.
        if (($_.Exception.HResult -band 0xffff) -notin @(32,33)) { throw }
        try {
            $active = Get-Content -LiteralPath $addressFile -Raw | ConvertFrom-Json
            if ($active.web_url -notmatch '^https://[a-z0-9-]+\.trycloudflare\.com$' -and $active.web_url -notmatch '^http://127\.0\.0\.1:\d+$') {
                throw 'The saved demo address is invalid.'
            }
            if ($active.api_url -ne "$($active.web_url)/api") { throw 'The saved API address is invalid.' }
            # Older launchers did not record their local origin; their default was 8088.
            $activeOrigin = if ($active.local_origin) { $active.local_origin } elseif ($active.local_only) { $active.web_url } else { 'http://127.0.0.1:8088' }
            if ($activeOrigin -notmatch '^http://127\.0\.0\.1:\d+$') { throw 'The saved local address is invalid.' }
            $response = Invoke-WebRequest -UseBasicParsing -Uri "$activeOrigin/api/programs" -Headers @{Accept='application/json'} -TimeoutSec 5
            $body = $response.Content | ConvertFrom-Json
            if ($response.StatusCode -ne 200 -or $body.success -ne $true -or $null -eq $body.programs) { throw 'The active API did not pass its health check.' }
        } catch {
            throw 'Another demo launcher holds the lock, but its saved connection could not be verified. It may still be starting or its API may be unavailable. Check its terminal and storage/free-demo logs; press Ctrl+C in that terminal before restarting.'
        }
        Write-Output 'EduPath is already running; its local API health check passed.'
        Write-Output "Web: $($active.web_url)"
        Write-Output "Mobile API: $($active.api_url)"
        Write-Output 'Keep the original demo terminal running. To rebuild or change startup options, press Ctrl+C there, then run this command again. This invocation did not rebuild or change the running demo. Public tunnel connectivity was not checked.'
        return
    }
    $probe = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $Port)
    try {
        $probe.Start()
    } catch [Net.Sockets.SocketException] {
        if ($_.Exception.SocketErrorCode -eq [Net.Sockets.SocketError]::AddressAlreadyInUse) {
            throw "Port $Port is already in use. Stop the server using it in its own terminal, or run .\deployment\Start-FreeDemo.ps1 -Port 8090 with an unused port. No existing process was stopped."
        }
        throw
    } finally { $probe.Stop() }
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
    if (Test-Path -LiteralPath $addressFile) { Remove-Item -LiteralPath $addressFile }
    if (!$SkipBuild) {
        Write-Output 'Building the React frontend...'
        $env:VITE_API_BASE_URL = '/api'
        Push-Location $frontend
        try {
            & $npm run build -- --outDir $build --emptyOutDir
            if ($LASTEXITCODE -ne 0) { throw 'Frontend build failed. The tunnel was not started.' }
        } finally { Pop-Location }
    }
    if (!(Test-Path -LiteralPath (Join-Path $build 'index.html'))) { throw 'Demo frontend build is missing. Run without -SkipBuild.' }
    $origin = "http://127.0.0.1:$Port"
    $publicUrl = $origin
    if (!$LocalOnly) {
        Write-Output 'Starting the Cloudflare HTTPS tunnel...'
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
    Write-Output 'Starting the Laravel API and serving the frontend...'
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
        Write-Output 'Starting the queue worker and notification scheduler...'
        $null = Start-DemoProcess $php @('artisan','queue:work','--sleep=3','--tries=3','--timeout=120') 'queue'
        $null = Start-DemoProcess $php @('artisan','schedule:work') 'scheduler'
    }
    $connection = [ordered]@{ web_url=$publicUrl; api_url="$publicUrl/api"; local_origin=$origin; started_at=(Get-Date).ToUniversalTime().ToString('o'); temporary=$true; local_only=[bool]$LocalOnly; background_jobs=(!$SkipBackgroundJobs) }
    $connection | ConvertTo-Json | Set-Content -LiteralPath $addressFile -Encoding UTF8
    Write-Output "Web: $publicUrl"
    Write-Output "Local web/API server: $origin"
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
