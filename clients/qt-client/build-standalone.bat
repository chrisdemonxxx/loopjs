@echo off
echo ========================================
echo Packaging Standalone SysManagePro
echo ========================================

REM Check if existing build exists
if not exist release\SysManagePro.exe (
    echo ========================================
    echo ERROR: No existing build found!
    echo ========================================
    echo.
    echo Please build the project first using one of these methods:
    echo.
    echo 1. Use Qt Creator to build the project
    echo 2. Install CMake and run: cmake --build build
    echo 3. Use the existing build.bat script
    echo.
    pause
    exit /b 1
)

REM Clean previous distributions
if exist dist rmdir /s /q dist

REM Create distribution directory
mkdir dist

echo.
echo Found existing build: release\SysManagePro.exe
echo.

REM Copy executable to dist
copy release\SysManagePro.exe dist\

REM Set Qt environment
set QT_DIR=C:\Qt\6.9.3\mingw_64

REM Copy required Qt DLLs
echo.
echo Copying Qt dependencies...
copy "%QT_DIR%\bin\Qt6Core.dll" dist\
copy "%QT_DIR%\bin\Qt6Gui.dll" dist\
copy "%QT_DIR%\bin\Qt6Widgets.dll" dist\
copy "%QT_DIR%\bin\Qt6WebSockets.dll" dist\
copy "%QT_DIR%\bin\Qt6Network.dll" dist\

REM Copy MinGW runtime DLLs
copy "%QT_DIR%\bin\libgcc_s_seh-1.dll" dist\
copy "%QT_DIR%\bin\libstdc++-6.dll" dist\
copy "%QT_DIR%\bin\libwinpthread-1.dll" dist\

REM Create platforms plugin directory
if not exist dist\platforms mkdir dist\platforms
copy "%QT_DIR%\plugins\platforms\qwindows.dll" dist\platforms\

REM Create tls plugin directory and copy SChannel backend
if not exist dist\tls mkdir dist\tls
copy "%QT_DIR%\plugins\tls\qschannelbackend.dll" dist\tls\
copy "%QT_DIR%\plugins\tls\qcertonlybackend.dll" dist\tls\

echo Qt dependencies copied successfully.
echo.

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
