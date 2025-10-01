#ifndef DOWNLOADTHREAD_H
#define DOWNLOADTHREAD_H

#include <QUrl>
#include <QThread>
#include "FileDownloader.h"

class DownloadThread : public QThread {
    Q_OBJECT
public:
    DownloadThread(const QUrl &url, const QString &outputPath, QObject *parent = nullptr)
        : QThread(parent), m_url(url), m_outputPath(outputPath) {}

protected:
    void run() override {
        FileDownloader downloader;
        downloader.downloadFile(m_url, m_outputPath);
        exec();  // Start event loop
    }

private:
    QUrl m_url;
    QString m_outputPath;
};

#endif // DOWNLOADTHREAD_H