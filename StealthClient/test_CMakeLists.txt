cmake_minimum_required(VERSION 3.16)
project(TestClient)

set(CMAKE_CXX_STANDARD 17)

add_executable(test_client test_client.cpp)
target_link_libraries(test_client wininet)