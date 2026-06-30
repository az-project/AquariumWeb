param(
  [string]$Root = "C:\Users\PC-2\source\repos\AquariumWeb",
  [int]$Port = 4174,
  [string]$Username = "admin",
  [string]$Password = "aquarium",
  [string]$DataDir = ""
)

$nodePath = (Get-Command node -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Source)
if (-not $nodePath) {
  $visualStudioNode = "C:\Program Files\Microsoft Visual Studio\2022\Community\MSBuild\Microsoft\VisualStudio\NodeJs\node.exe"
  if (Test-Path -LiteralPath $visualStudioNode) {
    $nodePath = $visualStudioNode
  }
}

if (-not $nodePath) {
  Write-Error "Node.js was not found. Install Node.js or run the Docker command in README.md."
  exit 1
}

if (-not (Test-Path -LiteralPath $Root -PathType Container)) {
  Write-Error "Project folder was not found: $Root"
  exit 1
}

if (-not $DataDir) {
  $DataDir = Join-Path $Root "data"
}

$env:PORT = [string]$Port
$env:APP_USERNAME = $Username
$env:APP_PASSWORD = $Password
$env:DATA_DIR = $DataDir

$localUrls = @("http://127.0.0.1:$Port")
$lanUrls = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object {
    $_.IPAddress -notlike "127.*" -and
    $_.IPAddress -notlike "169.254.*" -and
    $_.PrefixOrigin -ne "WellKnown"
  } |
  Select-Object -ExpandProperty IPAddress -Unique |
  ForEach-Object { "http://$($_):$Port" }

Write-Host ""
Write-Host "AquariumWeb login server"
Write-Host "Local URL:"
$localUrls | ForEach-Object { Write-Host "  $_" }
if ($lanUrls) {
  Write-Host "Phone / other PC URL on the same Wi-Fi:"
  $lanUrls | ForEach-Object { Write-Host "  $_" }
}
Write-Host "Login:"
Write-Host "  ID: $Username"
Write-Host "  PW: $Password"
Write-Host "Shared state folder:"
Write-Host "  $DataDir"
Write-Host ""
Write-Host "Keep this PowerShell window open while using the app."
Write-Host ""

Push-Location $Root
try {
  & $nodePath ".\server.js"
} finally {
  Pop-Location
}
