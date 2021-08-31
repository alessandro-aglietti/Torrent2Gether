const parseTorrent = require('parse-torrent')
const fs = require('fs')
const axios = require('axios')

// info hash (as a hex string)


async function magent2torrent(magnet) {
    const parsedMagnet = parseTorrent(magnet);
    const torrentFileBuffer = parseTorrent.toTorrentFile(parsedMagnet);

    //const torrageUrl = `https://t.torrage.info/download?h=${infoHash}`;
    //const { data } = await axios.get(torrageUrl);
    
    const infoHash = parsedMagnet.infoHash;
    const torrentFileName = `${infoHash.toUpperCase()}.torrent`;
    const torrentsFolder = `${__dirname}/torrents`
    const torrentFilePath = `${torrentsFolder}/${torrentFileName}`;
    fs.writeFileSync(torrentFilePath, torrentFileBuffer);

    return torrentFilePath;
}

module.exports = {
    magent2torrent
}