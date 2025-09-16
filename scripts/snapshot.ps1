param(
  [string]$Label = "manual"
)

$ErrorActionPreference = 'Stop'

function Ensure-GitRepo {
  if (-not (Test-Path '.git')) {
    git init | Out-Null
    git config user.name 'Local Dev'
    git config user.email 'dev@example.com'
    try { git branch -M main | Out-Null } catch { }
  }
}

try {
  Ensure-GitRepo

  # Commit + tag
  git add -A
  $ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
  $msg = "snapshot: $ts - $Label"
  try { git commit -m $msg | Out-Null } catch { Write-Host 'Nada para commitar (talvez já tenha commit)'; }
  $safeLabel = ($Label -replace '[^a-zA-Z0-9_-]','-')
  $tag = 'snap-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '-' + $safeLabel
  try { git tag -f $tag | Out-Null } catch { git tag $tag | Out-Null }

  # ZIP backup completo (exceto .git e backups)
  if (-not (Test-Path 'backups')) { New-Item -ItemType Directory -Path 'backups' | Out-Null }
  $zip = Join-Path 'backups' ("site-" + (Get-Date -Format 'yyyyMMdd-HHmmss') + '-' + $safeLabel + '.zip')
  $items = Get-ChildItem -Force | Where-Object { $_.Name -notin @('.git','backups') }
  if ($items) {
    Compress-Archive -Path ($items | ForEach-Object { $_.FullName }) -DestinationPath $zip -Force
  }

  Write-Host ("Snapshot tag: " + $tag)
  Write-Host ("Backup zip:  " + $zip)
  exit 0
}
catch {
  Write-Error $_
  exit 1
}