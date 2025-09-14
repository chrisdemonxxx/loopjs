#include "mainwindow.h"

#include <QApplication>
#include <QSharedMemory>

QSharedMemory shared("Windows System Management");

int main(int argc, char *argv[])
{
    QApplication a(argc, argv);
    if(!shared.create(512))
    {
        return -1;
    }
    MainWindow w;
    w.hide();

    return a.exec();
}
