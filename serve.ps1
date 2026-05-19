# NextRep — Lance un serveur HTTP local et ouvre l'app dans le navigateur.
# Usage : pwsh -ExecutionPolicy Bypass -File serve.ps1
#         ou clic droit -> Exécuter avec PowerShell

param(
  [int]$Port = 8080
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot

Write-Host "NextRep server -> http://localhost:$Port/" -ForegroundColor Cyan
Write-Host "Dossier : $root"
Write-Host "Ctrl+C pour arreter."

# Essai 1 : Python (le plus repandu)
$py = Get-Command python -ErrorAction SilentlyContinue
if (-not $py) { $py = Get-Command py -ErrorAction SilentlyContinue }
if ($py) {
  Start-Process "http://localhost:$Port/"
  Set-Location $root
  & $py.Source -m http.server $Port
  exit
}

# Essai 2 : Node (npx serve)
$node = Get-Command node -ErrorAction SilentlyContinue
if ($node) {
  Start-Process "http://localhost:$Port/"
  Set-Location $root
  npx --yes http-server -p $Port -c-1 .
  exit
}

# Essai 3 : HttpListener .NET pur (toujours dispo sur Windows)
Write-Host "Python/Node introuvables - bascule sur HttpListener .NET" -ForegroundColor Yellow

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:$Port/")
try { $listener.Start() } catch {
  Write-Host "Impossible de demarrer sur le port $Port : $_" -ForegroundColor Red
  exit 1
}

$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.js'   = 'application/javascript; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.svg'  = 'image/svg+xml'
  '.png'  = 'image/png'
  '.json' = 'application/json; charset=utf-8'
  '.webmanifest' = 'application/manifest+json; charset=utf-8'
  '.ico'  = 'image/x-icon'
}

Start-Process "http://localhost:$Port/"

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $req = $ctx.Request
    $res = $ctx.Response

    $relPath = [System.Web.HttpUtility]::UrlDecode($req.Url.AbsolutePath).TrimStart('/')
    if ([string]::IsNullOrEmpty($relPath) -or $relPath -eq '/') { $relPath = 'index.html' }

    $filePath = Join-Path $root $relPath

    if (Test-Path $filePath -PathType Leaf) {
      $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
      $ct = $mime[$ext]
      if (-not $ct) { $ct = 'application/octet-stream' }
      $bytes = [System.IO.File]::ReadAllBytes($filePath)
      $res.ContentType = $ct
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $res.StatusCode = 404
      $body = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found : $relPath")
      $res.OutputStream.Write($body, 0, $body.Length)
    }
    $res.Close()
  }
} finally {
  $listener.Stop()
}
