$machinePath = [Environment]::GetEnvironmentVariable('Path','Machine')
$userPath = [Environment]::GetEnvironmentVariable('Path','User')
$env:Path = "$machinePath;$userPath"

Write-Host "=== PATH contains GitHub CLI? ==="
Write-Host ($env:Path -like '*GitHub CLI*')

Write-Host ""
Write-Host "=== Direct file test ==="
Test-Path 'C:\Program Files\GitHub CLI\gh.exe'

Write-Host ""
Write-Host "=== Get-Command ==="
Get-Command gh, vercel, neonctl, node -ErrorAction SilentlyContinue | Format-Table Name, Source -AutoSize

Write-Host ""
Write-Host "=== Versions ==="
& gh --version
& vercel --version
& neonctl --version
