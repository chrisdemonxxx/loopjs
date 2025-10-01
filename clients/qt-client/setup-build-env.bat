@echo off
echo ========================================
echo Setting up Build Environment
echo ========================================

echo.
echo This script will help you set up the build environment for SysManagePro.
echo.

REM Check if Qt is installed
set QT_DIR=C:\Qt\6.9.3\mingw_64
if not exist "%QT_DIR%" (
    echo ERROR: Qt 6.9.3 not found at %QT_DIR%
    echo.
    echo Please install Qt 6.9.3 with MinGW compiler from:
    echo https://www.qt.io/download-qt-installer
    echo.
    echo Make sure to install the MinGW 64-bit compiler.
    echo.
    pause
    exit /b 1
)

echo Qt found at: %QT_DIR%
echo.

REM Check if CMake is available
cmake --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo CMake not found. Installing CMake...
    echo.
    echo Please download and install CMake from:
    echo https://cmake.org/download/
    echo.
    echo Or install via package manager:
    echo.
    echo Using Chocolatey:
    echo   choco install cmake
    echo.
    echo Using Scoop:
    echo   scoop install cmake
    echo.
    echo Using winget:
    echo   winget install Kitware.CMake
    echo.
    echo After installing CMake, restart this script.
    echo.
    pause
    exit /b 1
)

echo CMake found:
cmake --version
echo.

REM Set environment variables
set PATH=%QT_DIR%\bin;%PATH%
set CMAKE_PREFIX_PATH=%QT_DIR%

echo Environment variables set:
echo PATH includes: %QT_DIR%\bin
echo CMAKE_PREFIX_PATH: %CMAKE_PREFIX_PATH%
echo.

echo ========================================
echo Build Environment Ready!
echo ========================================
echo.
echo You can now run:
echo   .\build-standalone.bat
echo.
echo Or build manually:
echo   mkdir build
echo   cd build
echo   cmake .. -G "MinGW Makefiles"
echo   cmake --build .
echo.

pause
