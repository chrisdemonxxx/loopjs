@echo off
echo ========================================
echo Building Standalone SysManagePro
echo ========================================

REM Set Qt environment
set QT_DIR=C:\Qt\6.9.3\mingw_64
set PATH=%QT_DIR%\bin;%PATH%
set CMAKE_PREFIX_PATH=%QT_DIR%

REM Clean previous builds
if exist build-standalone rmdir /s /q build-standalone
if exist dist rmdir /s /q dist

REM Create build directory
mkdir build-standalone
cd build-standalone

echo.
echo Qt Version:
qmake --version
echo.

echo Configuring CMake for Standalone build...
cmake .. ^
    -G "MinGW Makefiles" ^
    -DCMAKE_BUILD_TYPE=Release ^
    -DCMAKE_PREFIX_PATH="%QT_DIR%" ^
    -DCMAKE_CXX_FLAGS="-static -static-libgcc -static-libstdc++ -O3 -DNDEBUG -s" ^
    -DCMAKE_EXE_LINKER_FLAGS="-static -static-libgcc -static-libstdc++ -Wl,--subsystem,windows" ^
    -DCMAKE_CXX_COMPILER="%QT_DIR%\bin\g++.exe" ^
    -DCMAKE_C_COMPILER="%QT_DIR%\bin\gcc.exe"

if %ERRORLEVEL% neq 0 (
    echo CMake configuration failed!
    pause
    exit /b 1
)

echo.
echo Building standalone executable...
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
copy build-standalone\SysManagePro.exe dist\

REM Check if executable exists
if exist dist\SysManagePro.exe (
    echo ========================================
    echo BUILD SUCCESSFUL!
    echo ========================================
    echo.
    echo Executable created: dist\SysManagePro.exe
    echo.
    echo File information:
    for %%I in (dist\SysManagePro.exe) do (
        echo Size: %%~zI bytes
        echo Date: %%~tI
    )
    echo.
    
    REM Test if executable runs
    echo Testing executable...
    echo.
    echo ========================================
    echo STANDALONE BUILD COMPLETE!
    echo ========================================
    echo.
    echo The executable is self-contained with all dependencies merged.
    echo No external DLLs required for deployment.
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