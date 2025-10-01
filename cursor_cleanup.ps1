# Cursor IDE Cleanup Script
# This script will clear all Cursor app data to resolve serialization errors

Write-Host "Cursor IDE Cleanup Script" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "Warning: Not running as administrator. Some files may not be accessible." -ForegroundColor Yellow
    Write-Host "Consider running PowerShell as administrator for complete cleanup." -ForegroundColor Yellow
    Write-Host ""
}

# Define paths to clean
$pathsToClean = @(
    "$env:USERPROFILE\AppData\Local\Programs\cursor*",
    "$env:USERPROFILE\AppData\Local\Cursor*",
    "$env:USERPROFILE\AppData\Roaming\Cursor*",
    "$env:USERPROFILE\cursor*"
)

Write-Host "Checking for Cursor processes..." -ForegroundColor Cyan
$cursorProcesses = Get-Process -Name "*cursor*" -ErrorAction SilentlyContinue

if ($cursorProcesses) {
    Write-Host "Found running Cursor processes. Attempting to close them..." -ForegroundColor Yellow
    try {
        $cursorProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        Write-Host "Cursor processes closed successfully." -ForegroundColor Green
    }
    catch {
        Write-Host "Could not close all Cursor processes. Please close Cursor manually and run this script again." -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        Read-Host "Press Enter to continue anyway..."
    }
} else {
    Write-Host "No running Cursor processes found." -ForegroundColor Green
}

Write-Host ""
Write-Host "Starting cleanup process..." -ForegroundColor Cyan

$totalCleaned = 0
$totalSize = 0

foreach ($path in $pathsToClean) {
    Write-Host "Checking: $path" -ForegroundColor White
    
    # Get all matching directories and files
    $items = Get-ChildItem -Path $path -Recurse -Force -ErrorAction SilentlyContinue
    
    if ($items) {
        Write-Host "  Found $($items.Count) items to clean" -ForegroundColor Yellow
        
        # Calculate total size
        $size = ($items | Measure-Object -Property Length -Sum).Sum
        $totalSize += $size
        
        try {
            # Remove all items
            $items | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
            $totalCleaned += $items.Count
            Write-Host "  ✓ Cleaned successfully" -ForegroundColor Green
        }
        catch {
            Write-Host "  ✗ Error cleaning: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "  No items found" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Cleanup Summary:" -ForegroundColor Green
Write-Host "================" -ForegroundColor Green
Write-Host "Items cleaned: $totalCleaned" -ForegroundColor White
Write-Host "Total size freed: $([math]::Round($totalSize / 1MB, 2)) MB" -ForegroundColor White

Write-Host ""
Write-Host "Additional cleanup steps:" -ForegroundColor Cyan

# Check for registry entries (optional)
Write-Host "Checking for Cursor registry entries..." -ForegroundColor White
$regPaths = @(
    "HKCU:\Software\Cursor",
    "HKLM:\Software\Cursor",
    "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*Cursor*",
    "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*Cursor*"
)

$regFound = $false
foreach ($regPath in $regPaths) {
    try {
        $regItems = Get-ChildItem -Path $regPath -ErrorAction SilentlyContinue
        if ($regItems) {
            Write-Host "  Found registry entries in: $regPath" -ForegroundColor Yellow
            $regFound = $true
        }
    }
    catch {
        # Registry path doesn't exist, which is fine
    }
}

if (-not $regFound) {
    Write-Host "  No Cursor registry entries found" -ForegroundColor Green
}

Write-Host ""
Write-Host "Cleanup completed!" -ForegroundColor Green
Write-Host "You can now safely uninstall and reinstall Cursor IDE." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Uninstall Cursor from Windows Settings > Apps" -ForegroundColor White
Write-Host "2. Download the latest version from https://cursor.sh/" -ForegroundColor White
Write-Host "3. Install the new version" -ForegroundColor White
Write-Host "4. When you first open Cursor, go to Settings (Ctrl+,) and search for 'http2'" -ForegroundColor White
Write-Host "5. Enable 'Disable HTTP/2' to prevent future serialization errors" -ForegroundColor White

Write-Host ""
Read-Host "Press Enter to exit"
