param(
    [Parameter(Mandatory=$true)][string]$ApiBaseUrl,
    [string]$MobileProject = 'C:/Users/oseas/StudioProjects/edupath_mobile'
)
$ErrorActionPreference = 'Stop'
$address = $null
if (![Uri]::TryCreate($ApiBaseUrl, [UriKind]::Absolute, [ref]$address) -or
    $address.Scheme -ne 'https' -or $address.UserInfo -or $address.Query -or $address.Fragment -or
    !$address.AbsolutePath.TrimEnd('/').EndsWith('/api') -or $address.Host.EndsWith('.example')) {
    throw 'Supply the real deployed HTTPS API address ending in /api, without credentials, query parameters or fragments.'
}
if (!(Test-Path -LiteralPath (Join-Path $MobileProject 'pubspec.yaml'))) { throw 'Flutter project not found.' }
Push-Location $MobileProject
try {
    & flutter analyze --no-pub
    if ($LASTEXITCODE -ne 0) { throw 'Flutter analysis failed.' }
    & flutter build apk --release "--dart-define=EDUPATH_API_BASE_URL=$($address.AbsoluteUri.TrimEnd('/'))"
    if ($LASTEXITCODE -ne 0) { throw 'Mobile release build failed.' }
    Write-Output 'APK built. Configure an institutional release signing key before public distribution; the existing project uses debug signing.'
} finally { Pop-Location }
