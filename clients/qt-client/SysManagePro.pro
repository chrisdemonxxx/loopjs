QT += core widgets websockets network

CONFIG += c++17

TARGET = SysManagePro
TEMPLATE = app

SOURCES += \
    main_debug.cpp \
    mainwindow.cpp

HEADERS += \
    mainwindow.h \
    FileDownloader.h \
    DownloadThread.h

# Windows specific settings
# win32 {
#     RC_ICONS = app.ico
# }

# Release build optimization
CONFIG(release, debug|release) {
    DEFINES += QT_NO_DEBUG_OUTPUT
    QMAKE_CXXFLAGS_RELEASE += -O3
}

# Debug build settings
CONFIG(debug, debug|release) {
    DEFINES += QT_DEBUG
}
