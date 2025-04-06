cmake_minimum_required(VERSION 3.10)
project(holaclient)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

set(CMAKE_POSITION_INDEPENDENT_CODE ON)
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -fPIC -fPIE -pie -fexceptions")

set(SOURCES
    src/main.cpp
    src/app.cpp
    src/socket.cpp
    src/http/router.cpp
    src/http/server.cpp
    src/http/methods.cpp
    src/http/parser.cpp
    src/config/config.cpp
)

add_library(hclib STATIC ${SOURCES})
target_compile_options(hclib PRIVATE -fPIC)

add_custom_command(
    OUTPUT ${CMAKE_CURRENT_BINARY_DIR}/build_res.o
    COMMAND nasm -f elf64 -DPIC ${CMAKE_CURRENT_SOURCE_DIR}/src/build_res.asm -o ${CMAKE_CURRENT_BINARY_DIR}/build_res.o
    DEPENDS src/build_res.asm
)

target_sources(hclib PRIVATE ${CMAKE_CURRENT_BINARY_DIR}/build_res.o)

add_executable(holaclient src/main.cpp)
target_link_libraries(holaclient hclib)

add_custom_command(
    OUTPUT ${CMAKE_CURRENT_BINARY_DIR}/parser.o
    COMMAND ${CMAKE_CXX_COMPILER} -c -fPIC -o ${CMAKE_CURRENT_BINARY_DIR}/parser.o ${CMAKE_CURRENT_SOURCE_DIR}/src/http/parser.cpp
    DEPENDS src/http/parser.cpp
)
