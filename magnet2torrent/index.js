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

async function getTorrentInfo(torrentId, timeout = 60000) {
    const ret = {
        metadata: {
            numPeers: null,
        },
        invokedAt: new Date(),
        peers: [],
        errors: [],
        warnings: [],
        torrent: {},
        infoHash: {
            on: null
        }
    };
    // console.log("######################### getTorrentInfo", { ret })

    return new Promise((resolve, reject) => {
        const client = new WebTorrent()
        client.on('error', function (err) {
            const error = {
                on: new Date(),
                err,
            }

            ret.errors.push(error)
        })
        
        const _timeout = setTimeout(() => {
            if (ret.metadata) {

                ret.metadata.numPeers = ret.torrent.numPeers

                if (ret.metadata.magnetURI) {
                    const torrentMetaFilePath = `${getTorrentFilePath(ret.metadata.magnetURI)}.meta.json`;
                    fs.writeFileSync(torrentMetaFilePath, JSON.stringify(ret, null, 2));
                }

                if (ret.metadata.piecesLength) {
                    ret.peers = ret.peers.map((peer) => {
                        if (peer.fullBits === 0) {
                            const fullBits = ret.metadata.piecesLength
                            peer.state = fullBits === peer.setBits ? "SEEDER" : "LEECHER";
                            peer.ratio = peer.setBits / fullBits
                        }
                        return peer
                    })
                }
            }

            client.destroy((err) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(ret)
                }
            });
        }, timeout)

        // start of torrent oNs
        ret.torrent = client.add(torrentId, {
            destroyStoreOnDestroy: true // If truthy, client will delete the torrent's chunk store (e.g. files on disk) when the torrent is destroyed
        });

        ret.torrent.on('infoHash', function () {
            // console.log("######################### warning", { on: new Date(), ret })

            ret.infoHash = {
                on: new Date(),
            }
        });

        ret.torrent.on('metadata', function () {
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
                comment: torrent.comment,
                piecesLength: torrent.pieces.length
            }
        })

        ret.torrent.on('warning', function (warn) {

            const warning = {
                on: new Date(),
                warn,
            }

            ret.warnings.push(warning)

            // console.log("######################### warning", { on: new Date(), ret, warn })
        })

        ret.torrent.on('error', function (err) {
            // console.log("######################### error", { on: new Date(), ret, err })

            const error = {
                on: new Date(),
                err,
            }

            ret.errors.push(error)
            // console.log("######################### reject on", { error })
            // client.destroy((err) => {
            //     clearTimeout(_timeout)
            //     if (err) {
            //         reject(err)
            //     } else {
            //         reject(error)
            //     }
            // });
        })

        ret.torrent.on('wire', (wire) => {
            // https://github.com/webtorrent/webtorrent/issues/1529#issuecomment-432266162
            wire.on('bitfield', (bitfield) => {
                // wire.destroy()
                // Bits set in the bitfield.
                let setBits = 0
                // Maximum number of bits available to be set with the current field size.
                const maxBits = bitfield.buffer.length << 3
                // The maximum number of bits which constitutes the whole torrent.
                const fullBits = torrent.pieces.length

                for (i = 0; i <= maxBits; i++) {
                    if (bitfield.get(i)) setBits++
                }
                const state = fullBits === setBits ? "SEEDER" : "LEECHER";

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
        // end of torrent oNs
    });
}

module.exports = {
    magent2torrent,
    getTorrentInfo
}
