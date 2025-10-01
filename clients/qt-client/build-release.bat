@echo off
echo ========================================
echo Building SysManagePro - Release Version
echo ========================================

REM Clean previous builds
if exist build-release rmdir /s /q build-release
if exist dist rmdir /s /q dist

REM Create build directory
mkdir build-release
cd build-release

echo.
echo Configuring CMake for Release build...
cmake .. -G "MinGW Makefiles" -DCMAKE_BUILD_TYPE=Release -DCMAKE_CXX_FLAGS="-static -static-libgcc -static-libstdc++" -DCMAKE_EXE_LINKER_FLAGS="-static -static-libgcc -static-libstdc++"

if %ERRORLEVEL% neq 0 (
    echo CMake configuration failed!
    pause
    exit /b 1
)

echo.
echo Building executable...
cmake --build . --config Release

if %ERRORLEVEL% neq 0 (
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo Build completed successfully!
echo.

REM Create distribution directory
cd ..
mkdir dist

REM Copy executable to dist
copy build-release\SysManagePro.exe dist\

REM Check if executable exists
if exist dist\SysManagePro.exe (
    echo ========================================
    echo BUILD SUCCESSFUL!
    echo ========================================
    echo.
    echo Executable created: dist\SysManagePro.exe
    echo.
    echo File size:
    dir dist\SysManagePro.exe | findstr SysManagePro.exe
    echo.
    echo Ready for production deployment!
    echo.
) else (
    echo ========================================
    echo BUILD FAILED!
    echo ========================================
    echo Executable not found in dist directory.
    echo.
)

pause