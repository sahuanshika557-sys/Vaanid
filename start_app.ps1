$ErrorActionPreference = "Stop"

function Test-CommandExists {
  param([string]$CommandName)

  return $null -ne (Get-Command $CommandName -ErrorAction SilentlyContinue)
}

if (-not (Test-CommandExists "uv")) {
  Write-Error "Missing required command: uv. Please install uv (https://docs.astral.sh/uv/)."
}

if (-not (Test-CommandExists "pnpm")) {
  Write-Error "Missing required command: pnpm. Please install pnpm (https://pnpm.io/installation)."
}

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

# Ensure backend dependencies are synced
if (-not (Test-Path "$repoRoot\backend\.venv")) {
  Write-Host "Setting up Python virtual environment in backend..."
  Set-Location "$repoRoot\backend"
  $env:UV_LINK_MODE = "copy"
  uv sync --link-mode=copy
  Set-Location $repoRoot
}

# Ensure frontend dependencies are installed
if (-not (Test-Path "$repoRoot\frontend\node_modules")) {
  Write-Host "Installing frontend node dependencies..."
  Set-Location "$repoRoot\frontend"
  pnpm install
  Set-Location $repoRoot
}

# Check if .env.local uses LiveKit Cloud
$envFile = "$repoRoot\backend\.env.local"
$isCloud = $false
if (Test-Path $envFile) {
  $content = Get-Content $envFile -Raw
  if ($content -match "LIVEKIT_URL=.*livekit\.cloud") {
    $isCloud = $true
  }
}

if ($isCloud) {
  Write-Host "Using LiveKit Cloud configured in .env.local. Skipping local livekit-server."
} elseif (Test-CommandExists "livekit-server") {
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$repoRoot'; livekit-server --dev"
} elseif (Test-Path "$repoRoot\livekit-server.exe") {
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$repoRoot'; .\livekit-server.exe --dev"
} else {
  Write-Warning "livekit-server was not found. Skipping local LiveKit startup and using your configured LIVEKIT_URL instead."
}

# Kill any stale node processes using port 3000
try {
  $connections = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
  foreach ($conn in $connections) {
    if ($conn.OwningProcess -gt 0) {
      Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    }
  }
} catch {
  # Ignore cleanup errors
}

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$repoRoot\backend'; uv run python src/agent.py start"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$repoRoot\frontend'; pnpm dev"

Write-Host "Waiting for frontend server to become ready on http://localhost:3000..."
$ready = $false
$attempts = 0
while (-not $ready -and $attempts -lt 30) {
  Start-Sleep -Seconds 2
  $attempts++
  try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($response -and $response.StatusCode -ge 200 -and $response.StatusCode -lt 400) {
      $ready = $true
    }
  } catch {
    # Server starting...
  }
}

Start-Process "http://localhost:3000"
Write-Host "Started backend and frontend. Opening http://localhost:3000 in browser..."
