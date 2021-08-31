const parseTorrent = require('parse-torrent')
const WebTorrent = require('webtorrent')
const fs = require('fs')

async function magent2torrent(magnet) {
    const parsedMagnet = parseTorrent(magnet);
    const torrentFileBuffer = parseTorrent.toTorrentFile(parsedMagnet);
    
    const infoHash = parsedMagnet.infoHash;
    const torrentFileName = `${infoHash.toUpperCase()}.torrent`;
    const torrentsFolder = `${__dirname}/torrents`
    const torrentFilePath = `${torrentsFolder}/${torrentFileName}`;
    fs.writeFileSync(torrentFilePath, torrentFileBuffer);

    return torrentFilePath;
}

function getTorrentInfo(torrentId) {
    const ret = {
        invokedAt: new Date(),
    };
    return new Promise((resolve, reject) => {
        var client = new WebTorrent()

        const torrent = client.add(torrentId, {
            destroyStoreOnDestroy: true // If truthy, client will delete the torrent's chunk store (e.g. files on disk) when the torrent is destroyed
        });

        torrent.on('infoHash', function () {
            ret.infoHash = {
                on: new Date(),
            }
        });

        torrent.on('metadata', function () {
            ret.metadata = {
                // "Torrent API" on https://webtorrent.io/docs
                on: new Date(),
                infoHash: torrent.infoHash,
                magnetURI: torrent.magnetURI,
                announce: torrent.announce,
                files: torrent.files.map(file => ({ name: file.name, path: file.path })),
                numPeers: torrent.numPeers,
                path: torrent.path,
                ready: torrent.ready,
                length: torrent.length,
                created: torrent.created,
                createdBy: torrent.createdBy,
                comment: torrent.comment
            }
            torrent.destroy();
            resolve(ret);
        })

        torrent.on('warning', function (err) {
            ret.warning = {
                on: new Date(),
                err,
            }
            reject(ret);
        })

        torrent.on('error', function (err) {
            ret.error = {
                on: new Date(),
                err,
            }
            reject(ret);
        })
    });
}

module.exports = {
    magent2torrent,
    getTorrentInfo
}
