@echo off
echo Creating single-file Qt client executable...

REM Build the Qt client
qmake SysManagePro.pro
mingw32-make clean
mingw32-make

REM Create a temporary directory for packaging
if exist temp-package rmdir /s /q temp-package
mkdir temp-package

REM Copy executable and all Qt DLLs
copy release\SysManagePro.exe temp-package\
copy C:\Qt\6.9.3\mingw_64\bin\Qt6Core.dll temp-package\
copy C:\Qt\6.9.3\mingw_64\bin\Qt6Gui.dll temp-package\
copy C:\Qt\6.9.3\mingw_64\bin\Qt6Widgets.dll temp-package\
copy C:\Qt\6.9.3\mingw_64\bin\Qt6Network.dll temp-package\
copy C:\Qt\6.9.3\mingw_64\bin\Qt6WebSockets.dll temp-package\
copy C:\Qt\6.9.3\mingw_64\bin\Qt6Svg.dll temp-package\

REM Copy MinGW runtime DLLs
copy C:\Qt\Tools\mingw1310_64\bin\libgcc_s_seh-1.dll temp-package\
copy C:\Qt\Tools\mingw1310_64\bin\libstdc++-6.dll temp-package\
copy C:\Qt\Tools\mingw1310_64\bin\libwinpthread-1.dll temp-package\

REM Copy platform plugin
mkdir temp-package\platforms
copy C:\Qt\6.9.3\mingw_64\plugins\platforms\qwindows.dll temp-package\platforms\

REM Create a simple launcher batch file
echo @echo off > temp-package\qt-client.bat
echo cd /d "%%~dp0" >> temp-package\qt-client.bat
echo SysManagePro.exe >> temp-package\qt-client.bat

REM Create a self-extracting archive using PowerShell
powershell -Command "Compress-Archive -Path 'temp-package\*' -DestinationPath 'qt-client-package.zip' -Force"

REM Clean up
rmdir /s /q temp-package

echo Qt client packaged as qt-client-package.zip
echo Extract and run qt-client.bat to start the Qt client
pause
