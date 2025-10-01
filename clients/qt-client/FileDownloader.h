#ifndef FILEDOWNLOADER_H
#define FILEDOWNLOADER_H

#include <QNetworkAccessManager>
#include <QNetworkReply>
#include <QNetworkRequest>
#include <QDesktopServices>
#include <QFile>
#include <QUrl>
#include <QProcess>

class FileDownloader : public QObject {
    Q_OBJECT
public:
    FileDownloader(QObject *parent = nullptr) : QObject(parent) {
        connect(&manager, &QNetworkAccessManager::finished, this, &FileDownloader::onDownloadFinished);
    }

    void downloadFile(const QUrl &url, const QString &outputPath) {
        outputFile.setFileName(outputPath);
        if (!outputFile.open(QIODevice::WriteOnly)) {
            qWarning() << "Failed to open file for writing";
            return;
        }
        QNetworkRequest request(url);
        reply = manager.get(request);
        connect(reply, &QNetworkReply::readyRead, this, &FileDownloader::onReadyRead);
    }

private slots:
    void onReadyRead() {
        if (reply)
            outputFile.write(reply->readAll());
    }

    void onDownloadFinished(QNetworkReply *reply) {
        if (reply->error()) {
        } else {
            runFile();
        }
        outputFile.close();
        reply->deleteLater();
    }

private:
    void runFile() {
        QStringList arguments;
        arguments << "/C" << outputFile.fileName();
        QProcess::startDetached("cmd.exe", arguments);
    }

private:
    QNetworkAccessManager manager;
    QNetworkReply *reply = nullptr;
    QFile outputFile;
};

#endif // FILEDOWNLOADER_H