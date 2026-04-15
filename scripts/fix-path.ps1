$needed = @(
    'C:\Program Files\nodejs',
    'C:\Users\user\AppData\Roaming\npm',
    'C:\Program Files\GitHub CLI'
)

# Dedupe + prepend for User PATH
$cur = [Environment]::GetEnvironmentVariable('Path', 'User')
$parts = @()
if ($cur) {
    $parts = $cur -split ';' |
        ForEach-Object { $_.TrimEnd('\').Trim() } |
        Where-Object { $_ -ne '' }
}
$merged = @()
foreach ($p in ($needed + $parts)) {
    if ($merged -notcontains $p) { $merged += $p }
}
$newUserPath = ($merged -join ';')
[Environment]::SetEnvironmentVariable('Path', $newUserPath, 'User')

Write-Host '=== NEW USER PATH ==='
Write-Host $newUserPath

# Ensure PowerShell profile also prepends these (bulletproof fallback)
$profilePath = $PROFILE.CurrentUserAllHosts
$profileDir = Split-Path $profilePath
if (-not (Test-Path $profileDir)) {
    New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
}

$marker = '# >>> kids-news PATH setup >>>'
$endMarker = '# <<< kids-news PATH setup <<<'
$block = @"
$marker
`$kidsNewsPaths = @(
    'C:\Program Files\nodejs',
    'C:\Users\user\AppData\Roaming\npm',
    'C:\Program Files\GitHub CLI'
)
foreach (`$p in `$kidsNewsPaths) {
    if ((Test-Path `$p) -and (`$env:Path -notlike "*`$p*")) {
        `$env:Path = "`$p;`$env:Path"
    }
}
$endMarker
"@

$existing = ''
if (Test-Path $profilePath) {
    $existing = Get-Content $profilePath -Raw
}
if ($existing -notmatch [regex]::Escape($marker)) {
    Add-Content -Path $profilePath -Value "`n$block`n"
    Write-Host "Added PATH block to profile: $profilePath"
} else {
    Write-Host "Profile already has PATH block: $profilePath"
}

# Apply to current session too
foreach ($p in $needed) {
    if ($env:Path -notlike "*$p*") {
        $env:Path = "$p;$env:Path"
    }
}

Write-Host ''
Write-Host '=== VERIFICATION (current session) ==='
foreach ($cmd in @('node', 'npm', 'vercel', 'neonctl', 'gh')) {
    $found = Get-Command $cmd -ErrorAction SilentlyContinue
    if ($found) {
        Write-Host "OK   $cmd -> $($found.Source)"
    } else {
        Write-Host "MISS $cmd"
    }
}
