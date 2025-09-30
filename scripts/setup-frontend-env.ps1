# ================================================
# Frontend Environment Setup Script
# ================================================
# Creates environment variable files for the frontend
# ================================================

param(
    [Parameter(Mandatory=$false)]
    [string]$BackendUrl = "https://loopjs-backend-361659024403.us-central1.run.app",
    
    [Parameter(Mandatory=$false)]
    [string]$WebSocketUrl = "wss://loopjs-backend-361659024403.us-central1.run.app/ws"
)

Write-Host "Setting up frontend environment variables..." -ForegroundColor Cyan

# Production environment
$prodEnv = @"
# Production environment variables
# These are baked into the build at build time

# Backend API URL (without trailing slash)
REACT_APP_API_URL=$BackendUrl

# WebSocket URL
REACT_APP_WS_URL=$WebSocketUrl
"@

Set-Content -Path "frontend\.env.production" -Value $prodEnv
Write-Host "[OK] Created frontend\.env.production" -ForegroundColor Green

# Development environment
$devEnv = @"
# Development environment variables
# These are used when running 'npm start' locally

# Backend API URL (without trailing slash)
REACT_APP_API_URL=$BackendUrl

# WebSocket URL
REACT_APP_WS_URL=$WebSocketUrl

# For local backend development, uncomment and modify:
# REACT_APP_API_URL=http://localhost:3001
# REACT_APP_WS_URL=ws://localhost:3001/ws
"@

Set-Content -Path "frontend\.env.development" -Value $devEnv
Write-Host "[OK] Created frontend\.env.development" -ForegroundColor Green

# Example environment
$exampleEnv = @"
# Example environment variables
# Copy this to .env.local for local development

# Backend API URL (without trailing slash)
REACT_APP_API_URL=$BackendUrl

# WebSocket URL
REACT_APP_WS_URL=$WebSocketUrl
"@

Set-Content -Path "frontend\.env.example" -Value $exampleEnv
Write-Host "[OK] Created frontend\.env.example" -ForegroundColor Green

Write-Host "`nFrontend environment configuration complete!" -ForegroundColor Green
Write-Host "Backend URL: $BackendUrl" -ForegroundColor White
Write-Host "WebSocket URL: $WebSocketUrl" -ForegroundColor White

