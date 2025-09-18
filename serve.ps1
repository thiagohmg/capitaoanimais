# Minimal static HTTP server using TcpListener (no admin/urlacl required)
param(
  [int]$Port = 8000
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
if (-not $root) { $root = Split-Path -Parent $MyInvocation.MyCommand.Path }

# Start listener with IPv6 DualMode when available (accepts IPv4 and IPv6)
try {
  $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::IPv6Any, $Port)
  try { $listener.Server.DualMode = $true } catch {}
  $listener.Start()
  Write-Host ("Serving {0} at http://localhost:{1}/" -f $root, $Port) -ForegroundColor Green
} catch {
  # Fallback to IPv4 only
  $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $Port)
  $listener.Start()
  Write-Host ("Serving {0} at http://127.0.0.1:{1}/" -f $root, $Port) -ForegroundColor Green
}

function Get-ContentType($ext) {
  switch ($ext.ToLower()) {
    '.html' { 'text/html; charset=utf-8' }
    '.htm'  { 'text/html; charset=utf-8' }
    '.css'  { 'text/css' }
    '.js'   { 'application/javascript' }
    '.json' { 'application/json' }
    '.svg'  { 'image/svg+xml' }
    '.png'  { 'image/png' }
    '.jpg'  { 'image/jpeg' }
    '.jpeg' { 'image/jpeg' }
    '.gif'  { 'image/gif' }
    '.ico'  { 'image/x-icon' }
    default { 'application/octet-stream' }
  }
}

while ($true) {
  $client = $listener.AcceptTcpClient()
  try {
    $stream = $client.GetStream()
    $reader = New-Object System.IO.StreamReader($stream, [Text.Encoding]::ASCII, $false, 2048, $true)
    $writer = New-Object System.IO.StreamWriter($stream, [Text.Encoding]::ASCII, 2048, $true)
    $writer.NewLine = "`r`n"

    $requestLine = $reader.ReadLine()
    if (-not $requestLine) { continue }
    $parts = $requestLine.Split(' ')
    if ($parts.Count -lt 2) { continue }
    $method = $parts[0]
    $url = $parts[1]

    # Read and discard headers
    while (($line = $reader.ReadLine()) -ne $null -and $line -ne '') {}

    if ($method -ne 'GET' -and $method -ne 'HEAD') { $method = 'GET' }

    $rel = [Uri]::UnescapeDataString($url.Split('?')[0]).TrimStart('/')
    if ([string]::IsNullOrWhiteSpace($rel)) {
      # Preferir index.html como página inicial
      if (Test-Path (Join-Path $root 'index.html')) { $rel = 'index.html' }
      elseif (Test-Path (Join-Path $root 'modern-index.html')) { $rel = 'modern-index.html' }
      else { $rel = '' }
    }

    # Prevent path traversal
    if ($rel.Contains('..')) { $rel = '' }

    $path = Join-Path $root $rel

    # Log básico da requisição
    Write-Host ("{0} {1}" -f $method, $rel) -ForegroundColor DarkGray

    if (-not (Test-Path $path)) {
      $body = [Text.Encoding]::UTF8.GetBytes("404 Not Found")
      $writer.WriteLine('HTTP/1.1 404 Not Found')
      $writer.WriteLine('Content-Type: text/plain; charset=utf-8')
      $writer.WriteLine('Content-Length: ' + $body.Length)
      $writer.WriteLine('Connection: close')
      $writer.WriteLine()
      $writer.Flush()
      $stream.Write($body, 0, $body.Length)
      continue
    }

    $ext = [IO.Path]::GetExtension($path)
    $contentType = Get-ContentType $ext
    $bytes = [IO.File]::ReadAllBytes($path)

    $writer.WriteLine('HTTP/1.1 200 OK')
    $writer.WriteLine('Content-Type: ' + $contentType)
    $writer.WriteLine('Content-Length: ' + $bytes.Length)
    # Cache-Control: desabilitar cache para HTML/CSS/JS em desenvolvimento
    $cacheHeader = 'no-cache'
    if ($ext -eq '.html' -or $ext -eq '.css' -or $ext -eq '.js') { $cacheHeader = 'no-store, must-revalidate' }
    $writer.WriteLine('Cache-Control: ' + $cacheHeader)
    $writer.WriteLine('Connection: close')
    $writer.WriteLine()
    $writer.Flush()

    if ($method -ne 'HEAD') { $stream.Write($bytes, 0, $bytes.Length) }
  } catch {
    # ignore per-request errors
  } finally {
    try { $client.Close() } catch {}
  }
}