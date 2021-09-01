const parseTorrent = require('parse-torrent')
const { announceList } = require('create-torrent')
const magnetUri = require('magnet-uri')
const wrtc = require('wrtc')
const fs = require('fs')

function getTorrentFilePath(magnet) {
    const parsedMagnet = parseTorrent(magnet);

    const infoHash = parsedMagnet.infoHash;
    const torrentFileName = `${infoHash.toUpperCase()}.torrent`;
    const torrentsFolder = `${__dirname}/torrents`
    const torrentFilePath = `${torrentsFolder}/${torrentFileName}`;

    return torrentFilePath
}

function writeTorrentStatsReport(t2gTorrentStats) {
    t2gTorrentStats.onEnd = new Date()
    t2gTorrentStats.executionTime = t2gTorrentStats.onEnd.getTime() - t2gTorrentStats.on.getTime()

    if (t2gTorrentStats.metadata) {

        t2gTorrentStats.metadata.numPeers_beforeStatsReport = t2gTorrentStats.torrent.numPeers

        if (t2gTorrentStats.metadata.piecesLength) {
            t2gTorrentStats.peers = t2gTorrentStats.peers.map((peer) => {
                if (peer.fullBits === 0) {
                    peer.piecesLength = t2gTorrentStats.metadata.piecesLength
                    peer.state = peer.piecesLength === peer.setBits ? "SEEDER" : "LEECHER";
                    peer.ratio = peer.setBits / peer.piecesLength
                }
                return peer
            })
        }

        t2gTorrentStats.metadata.numPeers_byPeersPeerId = peersCount(t2gTorrentStats.peers)

        if (t2gTorrentStats.metadata.magnetURI) {
            const torrentMetaFilePath = `${getTorrentFilePath(t2gTorrentStats.metadata.magnetURI)}.meta.json`;
            delete t2gTorrentStats.torrent
            fs.writeFileSync(torrentMetaFilePath, JSON.stringify(t2gTorrentStats, null, 2));
        }
    }
}

function destroyer(webTorrentClient, t2gTorrentStats, resolve, reject) {
    writeTorrentStatsReport(t2gTorrentStats)

    webTorrentClient.destroy((err) => {
        if (err) {
            reject(err)
        } else {
            resolve(t2gTorrentStats)
        }
    });
}

async function magent2torrent(magnet) {
    const parsedMagnet = parseTorrent(magnet);
    const torrentFileBuffer = parseTorrent.toTorrentFile(parsedMagnet);
    const torrentFilePath = getTorrentFilePath(magnet);
    fs.writeFileSync(torrentFilePath, torrentFileBuffer);

    return torrentFilePath;
}

function bitfield2peerInfo(bitfield, wire, torrent) {
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

    return peer
}

function peersCount(peers) {
    return new Set(peers.map(peer => peer.peerId)).size
}

function getWebTorrentClient(hybrid = false) {
    if (hybrid) {
        globalThis.WEBTORRENT_ANNOUNCE = announceList
            .map(arr => arr[0])
            .filter(url => url.indexOf('wss://') === 0 || url.indexOf('ws://') === 0)

        globalThis.WRTC = wrtc
    }

    const WebTorrent = require('webtorrent')

    return new WebTorrent()
}

function getTorrentMagnetFromFile (torrentFileName, onlyWSS = false) {
    const parsedTorrentFile = parseTorrent(fs.readFileSync(torrentFileName))
    const infoHash = parsedTorrentFile.infoHash.toUpperCase()
    const magnetObj = {
        xt : [
            `urn:btih:${infoHash}`
        ],
        announce: onlyWSS ? parsedTorrentFile.announce.filter(tr => tr.indexOf("wss") !== -1) : parsedTorrentFile.announce // tr
    };
    return magnetUri.encode(magnetObj)
}

function getTorrentInfo(torrentId, peersCountThreshold = 10, hybrid = false, waitForWrtcPeer = false) {
    const ret = {
        on: new Date(),
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

    return new Promise((resolve, reject) => {
        const client = getWebTorrentClient(hybrid)
        client.on('error', function (err) {
            const error = {
                on: new Date(),
                err,
            }
            ret.errors.push(error)

            destroyer(
                client,
                ret,
                destroyerResolveArg => reject({ error, destroyerResolveArg }),
                destroyerRejectArg => reject({ error, destroyerRejectArg })
            )
        })

        ret.torrent = client.add(torrentId, {
            destroyStoreOnDestroy: true // If truthy, client will delete the torrent's chunk store (e.g. files on disk) when the torrent is destroyed
        });

        // start of torrent oNs

        ret.torrent.on('infoHash', function () {
            ret.infoHash = {
                on: new Date(),
            }
        });

        ret.torrent.on('metadata', function () {
            ret.metadata = {
                // "Torrent API" on https://webtorrent.io/docs
                on: new Date(),
                infoHash: ret.torrent.infoHash,
                magnetURI: ret.torrent.magnetURI,
                announce: ret.torrent.announce,
                files: ret.torrent.files?.map(file => ({ name: file.name, path: file.path })),
                numPeers_onMetadata: ret.torrent.numPeers,
                path: ret.torrent.path,
                ready: ret.torrent.ready,
                length: ret.torrent.length,
                created: ret.torrent.created,
                createdBy: ret.torrent.createdBy,
                comment: ret.torrent.comment,
                piecesLength: ret.torrent.pieces.length
            }

            if (!waitForWrtcPeer) destroyer(client, ret, resolve, reject)
        })

        ret.torrent.on('warning', function (warn) {
            const warning = {
                on: new Date(),
                warn,
            }
            ret.warnings.push(warning)
        })

        ret.torrent.on('error', function (err) {
            const error = {
                on: new Date(),
                err,
            }
            ret.errors.push(error)
            destroyer(client, ret, resolve, reject)
        })

        ret.torrent.on('wire', (wire) => {
            // https://github.com/webtorrent/webtorrent/issues/1529#issuecomment-432266162
            wire.on('bitfield', (bitfield) => {
                // wire.destroy()
                const peerInfo = bitfield2peerInfo(bitfield, wire, ret.torrent)
                ret.peers.push(peerInfo)
                if (waitForWrtcPeer && peerInfo.type === 'webrtc') {
                    destroyer(client, ret, resolve, reject)
                }
                if (peersCount(ret.peers) > peersCountThreshold) {
                    // destroyer(client, ret, resolve, reject)
                }
            })
        })

        // end of torrent oNs
    });
}

module.exports = {
    magent2torrent,
    getTorrentInfo,
    getTorrentMagnetFromFile
}
