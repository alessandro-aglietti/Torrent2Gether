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

function getTorrentInfo(torrentId, timeout = 60000) {
    const ret = {
        metdata: {},
        invokedAt: new Date(),
        peers: [],
        errors: [],
        warnings: []
    };
    // console.log("######################### getTorrentInfo", { ret })

    return new Promise((resolve, reject) => {
        var client = new WebTorrent()
        client.on('error', function (err) {
            const error = {
                on: new Date(),
                err,
            }

            ret.errors.push(error)
        })
        
        const _timeout = setTimeout(() => {
            if (ret.metadata && ret.metadata.magnetURI) {
                const torrentMetaFilePath = `${getTorrentFilePath(ret.metadata.magnetURI)}.meta.json`;
                fs.writeFileSync(torrentMetaFilePath, JSON.stringify(ret, null, 2));
            }

            client.destroy((err) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(ret)
                }
            });
        }, timeout)

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
        })

        torrent.on('warning', function (warn) {

            const warning = {
                on: new Date(),
                warn,
            }

            ret.warnings.push(warning)

            // console.log("######################### warning", { on: new Date(), ret, warn })
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
                clearTimeout(_timeout)
                if (err) {
                    reject(err)
                } else {
                    reject(error)
                }
            });
        })

        torrent.on('wire', (wire) => {
            // https://github.com/webtorrent/webtorrent/issues/1529#issuecomment-432266162
            wire.on('bitfield', (bitfield) => {
                // Bits set in the bitfield.
                var setBits = 0
                // Maximum number of bits available to be set with the current field size.
                var maxBits = bitfield.buffer.length << 3
                // The maximum number of bits which constitutes the whole torrent.
                var fullBits = torrent.pieces.length

                for (i = 0; i <= maxBits; i++) {
                    if (bitfield.get(i)) setBits++
                }
                var state = fullBits === setBits ? "SEEDER" : "LEECHER";

                const peer = {
                    on: new Date(),
                    state,
                    peerId: wire.peerId,
                    setBits,
                    fullBits,
                    type: wire.type,
                    ratio: setBits / fullBits
                }

                ret.peers.push(peer)
            })
        })
    });
}

module.exports = {
    magent2torrent,
    getTorrentInfo
}
