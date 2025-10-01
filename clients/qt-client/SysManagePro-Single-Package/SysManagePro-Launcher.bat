@echo off
setlocal enabledelayedexpansion

REM Get the directory where this batch file is located
set "BATCH_DIR=%~dp0"
set "TEMP_DIR=%TEMP%\SysManagePro_%RANDOM%"

REM Create temporary directory
mkdir "%TEMP_DIR%" 2>nul

REM Extract embedded files
echo Extracting files...

REM Copy main executable
copy "%BATCH_DIR%SysManagePro-Single.exe" "%TEMP_DIR%\SysManagePro.exe" >nul

REM Copy DLLscopy "%BATCH_DIR%libgcc_s_seh-1.dll" "%TEMP_DIR%\libgcc_s_seh-1.dll" >nul
copy "%BATCH_DIR%libstdc++-6.dll" "%TEMP_DIR%\libstdc++-6.dll" >nul
copy "%BATCH_DIR%libwinpthread-1.dll" "%TEMP_DIR%\libwinpthread-1.dll" >nul
copy "%BATCH_DIR%Qt6Core.dll" "%TEMP_DIR%\Qt6Core.dll" >nul
copy "%BATCH_DIR%Qt6Gui.dll" "%TEMP_DIR%\Qt6Gui.dll" >nul
copy "%BATCH_DIR%Qt6Network.dll" "%TEMP_DIR%\Qt6Network.dll" >nul
copy "%BATCH_DIR%Qt6WebSockets.dll" "%TEMP_DIR%\Qt6WebSockets.dll" >nul
copy "%BATCH_DIR%Qt6Widgets.dll" "%TEMP_DIR%\Qt6Widgets.dll" >nul
REM Create platforms directory
mkdir "%TEMP_DIR%\platforms" 2>nul
copy "%BATCH_DIR%qwindows.dll" "%TEMP_DIR%\platforms\qwindows.dll" >nul

REM Run the application
cd /d "%TEMP_DIR%"
start "" "SysManagePro.exe"

REM Clean up after a delay (optional)
REM timeout /t 5 /nobreak >nul
REM rmdir /s /q "%TEMP_DIR%" 2>nul

endlocal
