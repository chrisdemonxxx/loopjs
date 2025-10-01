# PowerShell script to download and setup OpenSSL for Qt
param(
    [string]$OutputDir = "openssl"
)

Write-Host "========================================" -ForegroundColor Green
Write-Host "Setting up OpenSSL for Qt" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Create output directory
if (Test-Path $OutputDir) {
    Remove-Item $OutputDir -Recurse -Force
}
New-Item -ItemType Directory -Path $OutputDir | Out-Null

# Download OpenSSL 3.x for Windows
$OpenSSLUrl = "https://github.com/openssl/openssl/releases/download/openssl-3.3.2/openssl-3.3.2.tar.gz"
$OpenSSLZip = "https://github.com/IndySockets/OpenSSL-Binaries/raw/master/openssl-3.3-x64-windows.zip"
$OpenSSLFile = Join-Path $env:TEMP "openssl.zip"

Write-Host "Downloading OpenSSL binaries..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri $OpenSSLZip -OutFile $OpenSSLFile -UseBasicParsing
    Write-Host "Download complete!" -ForegroundColor Green
} catch {
    Write-Host "WARNING: Failed to download from GitHub: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "Trying alternative source..." -ForegroundColor Yellow
    
    # Try downloading from alternative source
    $OpenSSLUrl2 = "https://download.firedaemon.com/FireDaemon-OpenSSL/openssl-3.3.2.zip"
    try {
        Invoke-WebRequest -Uri $OpenSSLUrl2 -OutFile $OpenSSLFile -UseBasicParsing
        Write-Host "Download complete!" -ForegroundColor Green
    } catch {
        Write-Host "ERROR: Failed to download OpenSSL: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please download OpenSSL manually from:" -ForegroundColor Yellow
        Write-Host "  https://slproweb.com/products/Win32OpenSSL.html" -ForegroundColor Cyan
        Write-Host "Install it and run this script again." -ForegroundColor Yellow
        exit 1
    }
}

# Extract OpenSSL
Write-Host "Extracting OpenSSL..." -ForegroundColor Yellow
$OpenSSLExtractDir = Join-Path $env:TEMP "openssl-extract"
if (Test-Path $OpenSSLExtractDir) {
    Remove-Item $OpenSSLExtractDir -Recurse -Force
}
Expand-Archive -Path $OpenSSLFile -DestinationPath $OpenSSLExtractDir -Force

# Find OpenSSL DLLs in extracted directory
$CryptoDLL = Get-ChildItem -Path $OpenSSLExtractDir -Filter "*libcrypto*.dll" -Recurse | Select-Object -First 1
$SslDLL = Get-ChildItem -Path $OpenSSLExtractDir -Filter "*libssl*.dll" -Recurse | Select-Object -First 1

if ($CryptoDLL -and $SslDLL) {
    Write-Host "OpenSSL DLLs found!" -ForegroundColor Green
    
    # Copy OpenSSL DLLs to output directory
    Write-Host "Copying OpenSSL DLLs..." -ForegroundColor Yellow
    Copy-Item $CryptoDLL.FullName $OutputDir
    Copy-Item $SslDLL.FullName $OutputDir
} else {
    Write-Host "ERROR: OpenSSL DLLs not found in extracted archive!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please download OpenSSL manually from:" -ForegroundColor Yellow
    Write-Host "  https://slproweb.com/products/Win32OpenSSL.html" -ForegroundColor Cyan
    Write-Host "Install it and copy the DLLs manually." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "OpenSSL SETUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "OpenSSL DLLs copied to: $OutputDir" -ForegroundColor Cyan
Write-Host "  - libcrypto-3-x64.dll" -ForegroundColor White
Write-Host "  - libssl-3-x64.dll" -ForegroundColor White
Write-Host ""
Write-Host "These DLLs will be included in the deployment package." -ForegroundColor Green
