const parseTorrent = require('parse-torrent')
const WebTorrent = require('webtorrent')
const fs = require('fs')

function getTorrentFilePath(magnet) {
    const parsedMagnet = parseTorrent(magnet);

    const infoHash = parsedMagnet.infoHash;
    const torrentFileName = `${infoHash.toUpperCase()}.torrent`;
    const torrentsFolder = `${__dirname}/torrents`
    const torrentFilePath = `${torrentsFolder}/${torrentFileName}`;

    return torrentFilePath
}

async function magent2torrent(magnet) {
    const parsedMagnet = parseTorrent(magnet);
    const torrentFileBuffer = parseTorrent.toTorrentFile(parsedMagnet);
    const torrentFilePath = getTorrentFilePath(magnet);
    fs.writeFileSync(torrentFilePath, torrentFileBuffer);

    return torrentFilePath;
}

function getTorrentInfo(torrentId) {
    const ret = {
        invokedAt: new Date(),
        errors: [],
        warnings: []
    };
    // console.log("######################### getTorrentInfo", { ret })

    return new Promise((resolve, reject) => {
        var client = new WebTorrent()

        const torrent = client.add(torrentId, {
            destroyStoreOnDestroy: true // If truthy, client will delete the torrent's chunk store (e.g. files on disk) when the torrent is destroyed
        });

        torrent.on('infoHash', function () {
            // console.log("######################### warning", { on: new Date(), ret })

            ret.infoHash = {
                on: new Date(),
            }
        });

        torrent.on('metadata', function () {
            // console.log("######################### metadata", { on: new Date(), ret })

            ret.metadata = {
                // "Torrent API" on https://webtorrent.io/docs
                on: new Date(),
                infoHash: torrent.infoHash,
                magnetURI: torrent.magnetURI,
                announce: torrent.announce,
                // files: torrent.files?.map(file => ({ name: file.name, path: file.path })),
                numPeers: torrent.numPeers,
                path: torrent.path,
                ready: torrent.ready,
                length: torrent.length,
                created: torrent.created,
                createdBy: torrent.createdBy,
                comment: torrent.comment
            }

            const torrentMetaFilePath = `${getTorrentFilePath(ret.metadata.magnetURI)}.meta.json`;
            fs.writeFileSync(torrentMetaFilePath, JSON.stringify(ret, null, 2));

            client.destroy((err) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(ret)
                }
            });
        })

        torrent.on('warning', function (warn) {

            const warning = {
                on: new Date(),
                warn,
            }

            ret.warnings.push(warning)

            // console.log("######################### warning", { on: new Date(), ret, warn })

            if (warn.toString().indexOf('getaddrinfo ENOTFOUND') === -1) {
                // console.log("######################### reject on", { warn })
                client.destroy((err) => {
                    if (err) {
                        reject(err)
                    } else {
                        reject(ret)
                    }
                });
            }
        })

        torrent.on('error', function (err) {
            // console.log("######################### error", { on: new Date(), ret, err })

            const error = {
                on: new Date(),
                err,
            }

            ret.errors.push(error)
            // console.log("######################### reject on", { error })
            client.destroy((err) => {
                if (err) {
                    reject(err)
                } else {
                    reject(ret)
                }
            });
        })
    });
}

module.exports = {
    magent2torrent,
    getTorrentInfo
}
