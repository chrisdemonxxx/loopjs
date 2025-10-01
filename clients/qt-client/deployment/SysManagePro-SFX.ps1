# Self-Extracting Executable for SysManagePro
param([string]$TempDir = $env:TEMP)

Write-Host "SysManagePro - Self-Extracting Executable" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Create temporary directory
$TempPath = Join-Path $TempDir "SysManagePro_$(Get-Random)"
New-Item -ItemType Directory -Path $TempPath -Force | Out-Null

try {
    Write-Host "Extracting files..." -ForegroundColor Yellow
    
    # Extract main executable
    $ExePath = Join-Path $TempPath "SysManagePro.exe"
    Copy-Item $MyInvocation.MyCommand.Path $ExePath
    
    # Extract DLLs
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
    
    Write-Host "Starting SysManagePro..." -ForegroundColor Green
    
    # Run the application
    Set-Location $TempPath
    Start-Process "SysManagePro.exe" -Wait
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    # Clean up temporary files
    if (Test-Path $TempPath) {
        Remove-Item $TempPath -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
