@echo off
echo Building LoopJS Stealth Client...

REM Set environment
set MINGW_DIR=C:\Qt\Tools\mingw1310_64
set CMAKE_DIR=C:\Qt\Tools\CMake_64
set PATH=%MINGW_DIR%\bin;%CMAKE_DIR%\bin;%PATH%

REM Create build directory
if not exist build mkdir build
cd build

REM Configure with CMake
cmake .. -G "MinGW Makefiles" -DCMAKE_C_COMPILER="%MINGW_DIR%\bin\gcc.exe" -DCMAKE_CXX_COMPILER="%MINGW_DIR%\bin\g++.exe"

REM Build the project
cmake --build . --config Release

echo Build complete!
echo Executable location: build\bin\Release\StealthClient.exe
pause
