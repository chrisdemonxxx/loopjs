@echo off
:: Build Script for LoopJS Old Client
:: This script automates the CMake build process

echo ============================================
echo LoopJS Old Client - Build Script
echo ============================================
echo.

:: Check if CMake is installed
cmake --version >NUL 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] CMake is not installed or not in PATH!
    echo Please install CMake from: https://cmake.org/download/
    pause
    exit /b 1
)

echo [INFO] CMake found
echo.

:: Check for Qt installation
if "%Qt6_DIR%"=="" if "%Qt5_DIR%"=="" (
    echo [WARNING] Qt environment variables not set
    echo You may need to set Qt6_DIR or Qt5_DIR
    echo Example: set Qt6_DIR=C:\Qt\6.5.0\msvc2019_64\lib\cmake\Qt6
    echo.
)

:: Get the script directory
set "SOURCE_DIR=%~dp0"
set "BUILD_DIR=%SOURCE_DIR%build"

:: Clean previous build (optional)
set /p CLEAN_BUILD="Clean previous build? (Y/N): "
if /i "%CLEAN_BUILD%"=="Y" (
    echo [INFO] Cleaning build directory...
    if exist "%BUILD_DIR%" rmdir /S /Q "%BUILD_DIR%"
    echo [SUCCESS] Build directory cleaned
)

:: Create build directory
if not exist "%BUILD_DIR%" (
    echo [INFO] Creating build directory...
    mkdir "%BUILD_DIR%"
)

:: Navigate to build directory
cd /d "%BUILD_DIR%"

:: Configure with CMake
echo.
echo [INFO] Configuring project with CMake...
cmake ..
if %errorLevel% neq 0 (
    echo [ERROR] CMake configuration failed!
    cd /d "%SOURCE_DIR%"
    pause
    exit /b 1
)

echo [SUCCESS] Configuration complete
echo.

:: Build the project
echo [INFO] Building project (Release mode)...
cmake --build . --config Release
if %errorLevel% neq 0 (
    echo [ERROR] Build failed!
    cd /d "%SOURCE_DIR%"
    pause
    exit /b 1
)

echo.
echo ============================================
echo Build Complete!
echo ============================================
echo.
echo Executable location: %BUILD_DIR%\Release\SysManagePro.exe
echo.
echo To install, run: install.bat
echo To test, run: %BUILD_DIR%\Release\SysManagePro.exe
echo.

:: Return to source directory
cd /d "%SOURCE_DIR%"

pause
