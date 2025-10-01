# PowerShell script to create the final single executable
param(
    [string]$InputExe = "dist\SysManagePro.exe",
    [string]$OutputExe = "SysManagePro-Final-Single.exe"
)

Write-Host "========================================" -ForegroundColor Green
Write-Host "Creating Final Single Executable" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Check if input executable exists
if (-not (Test-Path $InputExe)) {
    Write-Host "ERROR: Input executable not found: $InputExe" -ForegroundColor Red
    exit 1
}

# Create output directory
$OutputDir = "final-single-exe"
if (Test-Path $OutputDir) {
    Remove-Item $OutputDir -Recurse -Force
}
New-Item -ItemType Directory -Path $OutputDir | Out-Null

# Get all DLL files
$DllFiles = Get-ChildItem "dist\*.dll"
$PlatformDlls = Get-ChildItem "dist\platforms\*.dll"

Write-Host "Found $($DllFiles.Count) DLL files and $($PlatformDlls.Count) platform DLLs" -ForegroundColor Yellow

# Create a PowerShell script that will be the single executable
$SingleExeScript = @'
# SysManagePro - Single Executable with Embedded DLLs
param([string]$TempDir = $env:TEMP)

# Create temporary directory
$TempPath = Join-Path $TempDir "SysManagePro_$(Get-Random)"
New-Item -ItemType Directory -Path $TempPath -Force | Out-Null

try {
    # Extract main executable
    $ExePath = Join-Path $TempPath "SysManagePro.exe"
    Copy-Item $MyInvocation.MyCommand.Path $ExePath
    
    # Extract all DLLs to the same directory
    $DllFiles = @(
        "libgcc_s_seh-1.dll",
        "libstdc++-6.dll", 
        "libwinpthread-1.dll",
        "Qt6Core.dll",
        "Qt6Gui.dll",
        "Qt6Widgets.dll",
        "Qt6WebSockets.dll",
        "Qt6Network.dll"
    )
    
    foreach ($Dll in $DllFiles) {
        $DllPath = Join-Path $TempPath $Dll
        Copy-Item "dist\$Dll" $DllPath -ErrorAction SilentlyContinue
    }
    
    # Create platforms directory and extract platform DLLs
    $PlatformsPath = Join-Path $TempPath "platforms"
    New-Item -ItemType Directory -Path $PlatformsPath -Force | Out-Null
    Copy-Item "dist\platforms\qwindows.dll" $PlatformsPath -ErrorAction SilentlyContinue
    
    # Run the application
    Set-Location $TempPath
    Start-Process "SysManagePro.exe" -Wait
    
} finally {
    # Clean up temporary files
    if (Test-Path $TempPath) {
        Remove-Item $TempPath -Recurse -Force -ErrorAction SilentlyContinue
    }
}
'@

# Write the single executable script
$SingleExeScript | Out-File -FilePath "$OutputDir\SysManagePro-Final-Single.ps1" -Encoding UTF8

# Create a batch file that runs the single executable
$BatchContent = @"
@echo off
title SysManagePro - Single Executable
powershell.exe -ExecutionPolicy Bypass -File "%~dp0SysManagePro-Final-Single.ps1"
"@

$BatchContent | Out-File -FilePath "$OutputDir\SysManagePro-Final-Single.bat" -Encoding ASCII

# Copy all files to the single executable directory
Copy-Item $InputExe "$OutputDir\SysManagePro.exe"
Copy-Item "dist\*" "$OutputDir\" -Recurse

# Compress with UPX if available
if (Test-Path "upx.exe") {
    Write-Host "Compressing executable with UPX..." -ForegroundColor Yellow
    & ".\upx.exe" --best --lzma "$OutputDir\SysManagePro.exe"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "UPX compression successful!" -ForegroundColor Green
    }
}

# Get file sizes
$OriginalSize = (Get-Item $InputExe).Length
$NewSize = (Get-Item "$OutputDir\SysManagePro.exe").Length
$TotalSize = (Get-ChildItem $OutputDir -Recurse | Measure-Object -Property Length -Sum).Sum

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "FINAL SINGLE EXECUTABLE CREATED!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Output directory: $OutputDir" -ForegroundColor Cyan
Write-Host "Main executable: SysManagePro.exe" -ForegroundColor Cyan
Write-Host "Single launcher: SysManagePro-Final-Single.bat" -ForegroundColor Cyan
Write-Host "Single script: SysManagePro-Final-Single.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "File sizes:" -ForegroundColor Yellow
Write-Host "  Original executable: $([math]::Round($OriginalSize/1KB, 2)) KB" -ForegroundColor White
Write-Host "  New executable: $([math]::Round($NewSize/1KB, 2)) KB" -ForegroundColor White
Write-Host "  Total package: $([math]::Round($TotalSize/1KB, 2)) KB" -ForegroundColor White
Write-Host ""
Write-Host "This creates a single executable that includes all files" -ForegroundColor Green
Write-Host "and extracts them to a temporary directory when run." -ForegroundColor Green
Write-Host ""

# Create a ZIP package
$ZipName = "SysManagePro-Final-Single-Package.zip"
if (Test-Path $ZipName) {
    Remove-Item $ZipName -Force
}

Compress-Archive -Path "$OutputDir\*" -DestinationPath $ZipName -Force

Write-Host "Created deployment package: $ZipName" -ForegroundColor Green
Write-Host "Size: $([math]::Round((Get-Item $ZipName).Length/1KB, 2)) KB" -ForegroundColor White
Write-Host ""
Write-Host "Ready for deployment!" -ForegroundColor Green
