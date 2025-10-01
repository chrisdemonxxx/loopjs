@echo off
echo ========================================
echo Creating Single Executable
echo ========================================

REM Set paths
set QT_DIR=C:\Qt\6.9.3\mingw_64
set ENIGMA_DIR=C:\Program Files (x86)\Enigma Virtual Box
set DIST_DIR=%~dp0dist
set OUTPUT_DIR=%~dp0single-exe

REM Check if Enigma Virtual Box is installed
if not exist "%ENIGMA_DIR%\enigmavb.exe" (
    echo ERROR: Enigma Virtual Box not found!
    echo Please install it from: https://enigmaprotector.com/en/downloads/
    echo.
    pause
    exit /b 1
)

REM Check if dist directory exists
if not exist "%DIST_DIR%" (
    echo ERROR: dist directory not found!
    echo Please run build-standalone.bat first.
    echo.
    pause
    exit /b 1
)

REM Create output directory
if exist "%OUTPUT_DIR%" rmdir /s /q "%OUTPUT_DIR%"
mkdir "%OUTPUT_DIR%"

echo.
echo Found Enigma Virtual Box at: %ENIGMA_DIR%
echo Input directory: %DIST_DIR%
echo Output directory: %OUTPUT_DIR%
echo.

REM Create Enigma Virtual Box project file
echo Creating Enigma Virtual Box project...
(
echo [Enigma Virtual Box]
echo File=^%DIST_DIR%^\SysManagePro.exe
echo SaveAs=^%OUTPUT_DIR%^\SysManagePro-Single.exe
echo [Files]
echo File=^%DIST_DIR%^\Qt6Core.dll
echo File=^%DIST_DIR%^\Qt6Gui.dll
echo File=^%DIST_DIR%^\Qt6Widgets.dll
echo File=^%DIST_DIR%^\Qt6WebSockets.dll
echo File=^%DIST_DIR%^\Qt6Network.dll
echo File=^%DIST_DIR%^\libgcc_s_seh-1.dll
echo File=^%DIST_DIR%^\libstdc++-6.dll
echo File=^%DIST_DIR%^\libwinpthread-1.dll
echo File=^%DIST_DIR%^\platforms\qwindows.dll
echo [Options]
echo Compression=1
echo CompressionLevel=9
echo StripRelocations=1
echo [Version]
echo [Sign]
) > "%OUTPUT_DIR%\project.evb"

echo Project file created: %OUTPUT_DIR%\project.evb
echo.

REM Run Enigma Virtual Box
echo Running Enigma Virtual Box...
"%ENIGMA_DIR%\enigmavb.exe" "%OUTPUT_DIR%\project.evb"

if %ERRORLEVEL% neq 0 (
    echo Enigma Virtual Box failed!
    pause
    exit /b 1
)

REM Check if single executable was created
if exist "%OUTPUT_DIR%\SysManagePro-Single.exe" (
    echo.
    echo ========================================
    echo SINGLE EXECUTABLE CREATED!
    echo ========================================
    echo.
    echo File: %OUTPUT_DIR%\SysManagePro-Single.exe
    echo.
    echo File information:
    for %%I in ("%OUTPUT_DIR%\SysManagePro-Single.exe") do (
        echo Size: %%~zI bytes
        echo Date: %%~tI
    )
    echo.
    echo This single executable contains all dependencies
    echo and can run on any Windows machine without
    echo requiring additional files.
    echo.
    
    REM Create deployment package
    echo Creating deployment package...
    copy "%OUTPUT_DIR%\SysManagePro-Single.exe" "SysManagePro-Single-Final.exe"
    
    echo.
    echo ========================================
    echo DEPLOYMENT READY!
    echo ========================================
    echo.
    echo Single executable: SysManagePro-Single-Final.exe
    echo.
    echo This file can be deployed to any Windows machine
    echo without requiring any additional dependencies.
    echo.
) else (
    echo ========================================
    echo CREATION FAILED!
    echo ========================================
    echo Single executable not found.
    echo.
)

pause
