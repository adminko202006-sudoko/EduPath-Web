$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$destination = Join-Path $root 'storage/tools/cloudflared.exe'
$directory = Split-Path $destination -Parent
New-Item -ItemType Directory -Path $directory -Force | Out-Null
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$release = Invoke-RestMethod -Uri 'https://api.github.com/repos/cloudflare/cloudflared/releases/latest' -TimeoutSec 30
$asset = $release.assets | Where-Object name -eq 'cloudflared-windows-amd64.exe' | Select-Object -First 1
if (!$asset -or $asset.digest -notmatch '^sha256:([a-f0-9]{64})$') {
    throw 'The official release did not provide a SHA-256 digest. No executable was installed.'
}
$expected = $Matches[1]
$temporary = "$destination.download"
try {
    Write-Output "Downloading official cloudflared $($release.tag_name)..."
    $ProgressPreference = 'SilentlyContinue'
    if (Get-Command curl.exe -ErrorAction SilentlyContinue) {
        & curl.exe --fail --location --silent --show-error --connect-timeout 20 --max-time 180 --output $temporary $asset.browser_download_url
        if ($LASTEXITCODE -ne 0) { throw 'The official download failed or timed out. Check your internet connection and retry.' }
    } else {
        Invoke-WebRequest -UseBasicParsing -Uri $asset.browser_download_url -OutFile $temporary -TimeoutSec 180
    }
    if ((Get-FileHash -LiteralPath $temporary -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expected) {
        throw 'Cloudflared checksum verification failed. No executable was installed.'
    }
    Move-Item -LiteralPath $temporary -Destination $destination -Force
} finally {
    if (Test-Path -LiteralPath $temporary) { Remove-Item -LiteralPath $temporary }
}
& $destination --version
if ($LASTEXITCODE -ne 0) { throw 'Cloudflared did not run successfully.' }
Write-Output "Installed verified official cloudflared $($release.tag_name) locally. No account or paid service was created."
