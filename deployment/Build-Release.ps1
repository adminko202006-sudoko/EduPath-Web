param([string]$ApiBaseUrl = '/api')
$ErrorActionPreference = 'Stop'
if ($ApiBaseUrl -ne '/api' -and $ApiBaseUrl -notmatch '^https://[^\s]+/api/?$') { throw 'Use /api or a deployed HTTPS API address ending in /api.' }
$projectRoot = Split-Path $PSScriptRoot -Parent
$previousApiUrl = $env:VITE_API_BASE_URL
try {
    $env:VITE_API_BASE_URL = $ApiBaseUrl
    Push-Location (Join-Path $projectRoot 'frontend')
    try {
        & npm run build
        if ($LASTEXITCODE -ne 0) { throw 'Frontend build failed; no release archive created.' }
    } finally { Pop-Location }
    & php (Join-Path $PSScriptRoot 'package.php')
    if ($LASTEXITCODE -ne 0) { throw 'Release packaging failed.' }
} finally { $env:VITE_API_BASE_URL = $previousApiUrl }
