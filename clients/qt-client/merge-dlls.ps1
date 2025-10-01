# PowerShell script to merge DLLs into a single executable
param(
    [string]$InputExe = "dist\SysManagePro.exe",
    [string]$OutputExe = "SysManagePro-Single.exe"
)

Write-Host "========================================" -ForegroundColor Green
Write-Host "Merging DLLs into Single Executable" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Check if input executable exists
if (-not (Test-Path $InputExe)) {
    Write-Host "ERROR: Input executable not found: $InputExe" -ForegroundColor Red
    exit 1
}

# Create output directory
$OutputDir = "single-exe"
if (Test-Path $OutputDir) {
    Remove-Item $OutputDir -Recurse -Force
}
New-Item -ItemType Directory -Path $OutputDir | Out-Null

# Copy main executable
Copy-Item $InputExe "$OutputDir\$OutputExe"

# Get all DLL files from dist directory
$DllFiles = Get-ChildItem "dist\*.dll"
$PlatformDlls = Get-ChildItem "dist\platforms\*.dll"

Write-Host "Found $($DllFiles.Count) DLL files and $($PlatformDlls.Count) platform DLLs" -ForegroundColor Yellow

# Create a batch file that will extract and run the executable
$BatchContent = @"
@echo off
setlocal enabledelayedexpansion

REM Get the directory where this batch file is located
set "BATCH_DIR=%~dp0"
set "TEMP_DIR=%TEMP%\SysManagePro_%RANDOM%"

REM Create temporary directory
mkdir "%TEMP_DIR%" 2>nul

REM Extract embedded files
echo Extracting files...

REM Copy main executable
copy "%BATCH_DIR%$OutputExe" "%TEMP_DIR%\SysManagePro.exe" >nul

REM Copy DLLs
"@

# Add DLL copy commands
foreach ($Dll in $DllFiles) {
    $DllName = $Dll.Name
    $BatchContent += "copy `"%BATCH_DIR%$DllName`" `"%TEMP_DIR%\$DllName`" >nul`n"
}

# Add platform DLL copy commands
$BatchContent += @"
REM Create platforms directory
mkdir "%TEMP_DIR%\platforms" 2>nul

"@

foreach ($Dll in $PlatformDlls) {
    $DllName = $Dll.Name
    $BatchContent += "copy `"%BATCH_DIR%$DllName`" `"%TEMP_DIR%\platforms\$DllName`" >nul`n"
}

$BatchContent += @"

REM Run the application
cd /d "%TEMP_DIR%"
start "" "SysManagePro.exe"

REM Clean up after a delay (optional)
REM timeout /t 5 /nobreak >nul
REM rmdir /s /q "%TEMP_DIR%" 2>nul

endlocal
"@

# Write the batch file
$BatchContent | Out-File -FilePath "$OutputDir\SysManagePro-Launcher.bat" -Encoding ASCII

# Copy all DLLs to output directory
foreach ($Dll in $DllFiles) {
    Copy-Item $Dll.FullName $OutputDir
}

# Create platforms directory and copy platform DLLs
New-Item -ItemType Directory -Path "$OutputDir\platforms" -Force | Out-Null
foreach ($Dll in $PlatformDlls) {
    Copy-Item $Dll.FullName "$OutputDir\platforms\"
}

# Compress the main executable with UPX
if (Test-Path "upx.exe") {
    Write-Host "Compressing executable with UPX..." -ForegroundColor Yellow
    & ".\upx.exe" --best --lzma "$OutputDir\$OutputExe"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "UPX compression successful!" -ForegroundColor Green
    } else {
        Write-Host "UPX compression failed, continuing without compression..." -ForegroundColor Yellow
    }
}

# Get file sizes
$OriginalSize = (Get-Item $InputExe).Length
$NewSize = (Get-Item "$OutputDir\$OutputExe").Length
$TotalSize = (Get-ChildItem $OutputDir -Recurse | Measure-Object -Property Length -Sum).Sum

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "MERGE COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Output directory: $OutputDir" -ForegroundColor Cyan
Write-Host "Main executable: $OutputExe" -ForegroundColor Cyan
Write-Host "Launcher script: SysManagePro-Launcher.bat" -ForegroundColor Cyan
Write-Host ""
Write-Host "File sizes:" -ForegroundColor Yellow
Write-Host "  Original executable: $([math]::Round($OriginalSize/1KB, 2)) KB" -ForegroundColor White
Write-Host "  New executable: $([math]::Round($NewSize/1KB, 2)) KB" -ForegroundColor White
Write-Host "  Total package: $([math]::Round($TotalSize/1KB, 2)) KB" -ForegroundColor White
Write-Host ""
Write-Host "The launcher script will extract all files to a temporary" -ForegroundColor Green
Write-Host "directory and run the application." -ForegroundColor Green
Write-Host ""

# Create a ZIP package
$ZipName = "SysManagePro-Single-Package.zip"
if (Test-Path $ZipName) {
    Remove-Item $ZipName -Force
}

Compress-Archive -Path "$OutputDir\*" -DestinationPath $ZipName -Force

Write-Host "Created deployment package: $ZipName" -ForegroundColor Green
Write-Host "Size: $([math]::Round((Get-Item $ZipName).Length/1KB, 2)) KB" -ForegroundColor White
Write-Host ""
Write-Host "Ready for deployment!" -ForegroundColor Green
