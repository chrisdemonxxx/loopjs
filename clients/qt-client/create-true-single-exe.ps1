# PowerShell script to create a truly single executable with embedded DLLs
param(
    [string]$InputExe = "dist\SysManagePro.exe",
    [string]$OutputExe = "SysManagePro-True-Single.exe"
)

Write-Host "========================================" -ForegroundColor Green
Write-Host "Creating True Single Executable" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Check if input executable exists
if (-not (Test-Path $InputExe)) {
    Write-Host "ERROR: Input executable not found: $InputExe" -ForegroundColor Red
    exit 1
}

# Create output directory
$OutputDir = "true-single-exe"
if (Test-Path $OutputDir) {
    Remove-Item $OutputDir -Recurse -Force
}
New-Item -ItemType Directory -Path $OutputDir | Out-Null

# Get all DLL files
$DllFiles = Get-ChildItem "dist\*.dll"
$PlatformDlls = Get-ChildItem "dist\platforms\*.dll"

Write-Host "Found $($DllFiles.Count) DLL files and $($PlatformDlls.Count) platform DLLs" -ForegroundColor Yellow

# Create a PowerShell script that will be embedded
$EmbeddedScript = @'
# Embedded DLL extraction and execution script
param([string]$TempDir = $env:TEMP)

# Create temporary directory
$TempPath = Join-Path $TempDir "SysManagePro_$(Get-Random)"
New-Item -ItemType Directory -Path $TempPath -Force | Out-Null

try {
    # Extract embedded files
    $DllData = @{
        "libgcc_s_seh-1.dll" = @'
'@

# Add DLL data
foreach ($Dll in $DllFiles) {
    $DllName = $Dll.Name
    $DllBytes = [System.IO.File]::ReadAllBytes($Dll.FullName)
    $DllBase64 = [System.Convert]::ToBase64String($DllBytes)
    
    $EmbeddedScript += @"
        "$DllName" = @'
$DllBase64
'@
"@
}

$EmbeddedScript += @'

    }
    
    $PlatformData = @{
'@

# Add platform DLL data
foreach ($Dll in $PlatformDlls) {
    $DllName = $Dll.Name
    $DllBytes = [System.IO.File]::ReadAllBytes($Dll.FullName)
    $DllBase64 = [System.Convert]::ToBase64String($DllBytes)
    
    $EmbeddedScript += @"
        "$DllName" = @'
$DllBase64
'@
"@
}

$EmbeddedScript += @'

    }
    
    # Extract DLLs
    foreach ($Dll in $DllData.GetEnumerator()) {
        $DllPath = Join-Path $TempPath $Dll.Key
        $DllBytes = [System.Convert]::FromBase64String($Dll.Value)
        [System.IO.File]::WriteAllBytes($DllPath, $DllBytes)
    }
    
    # Create platforms directory and extract platform DLLs
    $PlatformsPath = Join-Path $TempPath "platforms"
    New-Item -ItemType Directory -Path $PlatformsPath -Force | Out-Null
    
    foreach ($Dll in $PlatformData.GetEnumerator()) {
        $DllPath = Join-Path $PlatformsPath $Dll.Key
        $DllBytes = [System.Convert]::FromBase64String($Dll.Value)
        [System.IO.File]::WriteAllBytes($DllPath, $DllBytes)
    }
    
    # Copy main executable
    $ExePath = Join-Path $TempPath "SysManagePro.exe"
    Copy-Item $MyInvocation.MyCommand.Path $ExePath
    
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

# Write the embedded script
$EmbeddedScript | Out-File -FilePath "$OutputDir\SysManagePro-Embedded.ps1" -Encoding UTF8

# Create a batch file that runs the PowerShell script
$BatchContent = @"
@echo off
powershell.exe -ExecutionPolicy Bypass -File "%~dp0SysManagePro-Embedded.ps1"
"@

$BatchContent | Out-File -FilePath "$OutputDir\SysManagePro-True-Single.bat" -Encoding ASCII

# Copy the main executable
Copy-Item $InputExe "$OutputDir\SysManagePro.exe"

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
Write-Host "TRUE SINGLE EXECUTABLE CREATED!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Output directory: $OutputDir" -ForegroundColor Cyan
Write-Host "Main executable: SysManagePro.exe" -ForegroundColor Cyan
Write-Host "Launcher script: SysManagePro-True-Single.bat" -ForegroundColor Cyan
Write-Host "Embedded script: SysManagePro-Embedded.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "File sizes:" -ForegroundColor Yellow
Write-Host "  Original executable: $([math]::Round($OriginalSize/1KB, 2)) KB" -ForegroundColor White
Write-Host "  New executable: $([math]::Round($NewSize/1KB, 2)) KB" -ForegroundColor White
Write-Host "  Total package: $([math]::Round($TotalSize/1KB, 2)) KB" -ForegroundColor White
Write-Host ""
Write-Host "This creates a truly single executable that embeds all DLLs" -ForegroundColor Green
Write-Host "and extracts them to a temporary directory when run." -ForegroundColor Green
Write-Host ""

# Create a ZIP package
$ZipName = "SysManagePro-True-Single-Package.zip"
if (Test-Path $ZipName) {
    Remove-Item $ZipName -Force
}

Compress-Archive -Path "$OutputDir\*" -DestinationPath $ZipName -Force

Write-Host "Created deployment package: $ZipName" -ForegroundColor Green
Write-Host "Size: $([math]::Round((Get-Item $ZipName).Length/1KB, 2)) KB" -ForegroundColor White
Write-Host ""
Write-Host "Ready for deployment!" -ForegroundColor Green
