#include "mainwindow.h"

#include <QApplication>
#include <QSharedMemory>
#include <QDebug>
#include <iostream>

QSharedMemory shared("Windows System Management");

int main(int argc, char *argv[])
{
    // Enable console output for debugging
    qDebug() << "=== LoopJS Old Client Starting ===";
    std::cout << "=== LoopJS Old Client Starting ===" << std::endl;
    
    QApplication a(argc, argv);
    
    qDebug() << "Qt Application created";
    std::cout << "Qt Application created" << std::endl;
    
    // Check for single instance
    qDebug() << "Checking for existing instance...";
    std::cout << "Checking for existing instance..." << std::endl;
    
    if(!shared.create(512))
    {
        qDebug() << "ERROR: Another instance is already running or shared memory exists!";
        qDebug() << "Shared memory error:" << shared.errorString();
        std::cout << "ERROR: Another instance is already running!" << std::endl;
        std::cout << "Trying to attach to existing shared memory..." << std::endl;
        
        // Try to attach and then detach to clear it
        if (shared.attach()) {
            qDebug() << "Attached to existing shared memory, detaching...";
            shared.detach();
        }
        
        // Try to create again
        if (!shared.create(512)) {
            qDebug() << "Still cannot create shared memory. Please restart your PC or kill all SysManagePro processes.";
            std::cout << "ERROR: Cannot start. Another instance may be running." << std::endl;
            std::cout << "Press Enter to exit..." << std::endl;
            std::cin.get();
            return -1;
        }
    }
    
    qDebug() << "Shared memory created successfully";
    std::cout << "Shared memory OK" << std::endl;
    
    qDebug() << "Creating main window...";
    std::cout << "Creating main window..." << std::endl;
    
    try {
        MainWindow w;
        qDebug() << "Main window created";
        std::cout << "Main window created" << std::endl;
        
        // Don't hide for debugging
        // w.hide();
        w.show();  // Show window for debugging
        
        qDebug() << "Window shown, starting event loop...";
        std::cout << "Starting Qt event loop..." << std::endl;
        std::cout << "Client is now running. Check console for connection messages." << std::endl;
        
        return a.exec();
    } catch (const std::exception& e) {
        qDebug() << "EXCEPTION:" << e.what();
        std::cout << "EXCEPTION: " << e.what() << std::endl;
        std::cout << "Press Enter to exit..." << std::endl;
        std::cin.get();
        return -1;
    } catch (...) {
        qDebug() << "UNKNOWN EXCEPTION occurred!";
        std::cout << "UNKNOWN EXCEPTION occurred!" << std::endl;
        std::cout << "Press Enter to exit..." << std::endl;
        std::cin.get();
        return -1;
    }
}