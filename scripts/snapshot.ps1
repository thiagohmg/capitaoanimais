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

  # Preparar pasta de staging para zip e evitar locks (ex.: .gitignore em uso)
  if (-not (Test-Path 'backups')) { New-Item -ItemType Directory -Path 'backups' | Out-Null }
  $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  $staging = Join-Path 'backups' ("staging-$stamp")
  New-Item -ItemType Directory -Path $staging | Out-Null

  $exclude = @('.git','backups','.DS_Store','Thumbs.db')
  Get-ChildItem -Force | Where-Object { $_.Name -notin $exclude } | ForEach-Object {
    $dest = Join-Path $staging $_.Name
    if ($_.PSIsContainer) {
      Copy-Item -Path $_.FullName -Destination $dest -Recurse -Force
    } else {
      Copy-Item -Path $_.FullName -Destination $dest -Force
    }
  }

  $zip = Join-Path 'backups' ("site-" + $stamp + '-' + $safeLabel + '.zip')
  Compress-Archive -Path (Join-Path $staging '*') -DestinationPath $zip -Force

  # Limpar staging
  Remove-Item -Recurse -Force $staging

  Write-Host ("Snapshot tag: " + $tag)
  Write-Host ("Backup zip:  " + $zip)
  exit 0
}
catch {
  Write-Error $_
  exit 1
}