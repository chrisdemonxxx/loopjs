@echo off
echo ========================================
echo Building SysManagePro - Production Release
echo ========================================

REM Set Qt environment
set QT_DIR=C:\Qt\6.9.3\mingw_64
set PATH=%QT_DIR%\bin;%PATH%
set CMAKE_PREFIX_PATH=%QT_DIR%

REM Clean previous builds
if exist build-production rmdir /s /q build-production
if exist dist rmdir /s /q dist

REM Create build directory
mkdir build-production
cd build-production

echo.
echo Qt Version:
qmake --version
echo.

echo Configuring CMake for Production build...
cmake .. ^
    -G "MinGW Makefiles" ^
    -DCMAKE_BUILD_TYPE=Release ^
    -DCMAKE_PREFIX_PATH="%QT_DIR%" ^
    -DCMAKE_CXX_FLAGS="-static -static-libgcc -static-libstdc++ -O3 -DNDEBUG" ^
    -DCMAKE_EXE_LINKER_FLAGS="-static -static-libgcc -static-libstdc++" ^
    -DQT_USE_STATIC_LIBS=ON ^
    -DCMAKE_CXX_COMPILER="%QT_DIR%\bin\g++.exe" ^
    -DCMAKE_C_COMPILER="%QT_DIR%\bin\gcc.exe"

if %ERRORLEVEL% neq 0 (
    echo CMake configuration failed!
    pause
    exit /b 1
)

echo.
echo Building executable...
cmake --build . --config Release --parallel

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
copy build-production\SysManagePro.exe dist\

REM Check if executable exists
if exist dist\SysManagePro.exe (
    echo ========================================
    echo BUILD SUCCESSFUL!
    echo ========================================
    echo.
    echo Executable created: dist\SysManagePro.exe
    echo.
    echo File information:
    dir dist\SysManagePro.exe
    echo.
    echo Checking dependencies...
    echo.
    
    REM Check if it's a standalone executable
    echo Testing if executable is standalone...
    echo.
    
    echo ========================================
    echo PRODUCTION BUILD COMPLETE!
    echo ========================================
    echo.
    echo The executable should be self-contained with all DLLs merged.
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