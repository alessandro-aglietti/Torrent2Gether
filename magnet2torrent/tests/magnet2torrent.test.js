const { magent2torrent, getTorrentInfo,getTorrentMagnetFromFile } = require('../index');

test('magnet to torrent file', async () => {
    const magnet = "magnet:?xt=urn:btih:7FA6EC9C323CA54A33DF16C8F41272A41A8ACB32&dn=Voyagers+%282021%29+BluRay+1080p.H264+Ita+Eng+AC3+5.1+Sub+Ita+Eng+-+realDMDJ&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.tiny-vps.com%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80%2Fannounce&tr=udp%3A%2F%2Ftracker.torrent.eu.org%3A451%2Fannounce&tr=udp%3A%2F%2Ftracker.pirateparty.gr%3A6969%2Fannounce&tr=udp%3A%2F%2F9.rarbg.com%3A2710%2Fannounce&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.cyberia.is%3A6969%2Fannounce&tr=udp%3A%2F%2Fp4p.arenabg.com%3A1337%2Fannounce&tr=udp%3A%2F%2Fexplodie.org%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.iamhansen.xyz%3A2000%2Fannounce&tr=udp%3A%2F%2Fexodus.desync.com%3A6969%2Fannounce&tr=udp%3A%2F%2Fipv4.tracker.harry.lu%3A80%2Fannounce&tr=udp%3A%2F%2Fopen.stealth.si%3A80%2Fannounce&tr=udp%3A%2F%2Ftracker.zer0day.to%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&tr=udp%3A%2F%2Fcoppersurfer.tk%3A6969%2Fannounce";
    expect(await magent2torrent(magnet)).toBe(`/data/torrents/7FA6EC9C323CA54A33DF16C8F41272A41A8ACB32.torrent`);
});

test('getTorrentInfo', async () => {
    const magnet = "magnet:?xt=urn:btih:7FA6EC9C323CA54A33DF16C8F41272A41A8ACB32&dn=Voyagers+%282021%29+BluRay+1080p.H264+Ita+Eng+AC3+5.1+Sub+Ita+Eng+-+realDMDJ&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.tiny-vps.com%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80%2Fannounce&tr=udp%3A%2F%2Ftracker.torrent.eu.org%3A451%2Fannounce&tr=udp%3A%2F%2Ftracker.pirateparty.gr%3A6969%2Fannounce&tr=udp%3A%2F%2F9.rarbg.com%3A2710%2Fannounce&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.cyberia.is%3A6969%2Fannounce&tr=udp%3A%2F%2Fp4p.arenabg.com%3A1337%2Fannounce&tr=udp%3A%2F%2Fexplodie.org%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.iamhansen.xyz%3A2000%2Fannounce&tr=udp%3A%2F%2Fexodus.desync.com%3A6969%2Fannounce&tr=udp%3A%2F%2Fipv4.tracker.harry.lu%3A80%2Fannounce&tr=udp%3A%2F%2Fopen.stealth.si%3A80%2Fannounce&tr=udp%3A%2F%2Ftracker.zer0day.to%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&tr=udp%3A%2F%2Fcoppersurfer.tk%3A6969%2Fannounce";
    const torrentInfos = await getTorrentInfo(magnet);
    expect(torrentInfos).toHaveProperty('invokedAt');
    expect(torrentInfos).toHaveProperty('errors');
    expect(torrentInfos.errors.length).toBe(0);
    expect(torrentInfos).toHaveProperty('infoHash');
    expect(torrentInfos.infoHash).toHaveProperty('on');
    expect(torrentInfos).toHaveProperty('metadata');
    expect(torrentInfos.metadata).toHaveProperty('numPeers_onMetadata');
    expect(torrentInfos.metadata).toHaveProperty('numPeers_beforeStatsReport');
}, 60000);

test('getTorrentInfo only btih', async () => {
    const magnet = "magnet:?xt=urn:btih:5cf4ddd89c66fba956604659ff41a46029c24e0a";
    const torrentInfos = await getTorrentInfo(magnet);
    expect(torrentInfos).toHaveProperty('invokedAt');
    expect(torrentInfos).toHaveProperty('errors');
    expect(torrentInfos.errors.length).toBe(0);
    expect(torrentInfos).toHaveProperty('infoHash');
    expect(torrentInfos.infoHash).toHaveProperty('on');
    expect(torrentInfos).toHaveProperty('metadata');
    expect(torrentInfos.metadata).toHaveProperty('numPeers_onMetadata');
    expect(torrentInfos.metadata).toHaveProperty('numPeers_beforeStatsReport');
}, 60000);

test('getTorrentInfo only btih peersCountThreshold 2', async () => {
    const magnet = "magnet:?xt=urn:btih:514e5b1830b4b8d7b748e1aae8b076bd7b0faeff";
    const torrentInfos = await getTorrentInfo(magnet, 2);
    expect(torrentInfos).toHaveProperty('invokedAt');
    expect(torrentInfos).toHaveProperty('errors');
    expect(torrentInfos.errors.length).toBe(0);
    expect(torrentInfos).toHaveProperty('infoHash');
    expect(torrentInfos.infoHash).toHaveProperty('on');
    expect(torrentInfos).toHaveProperty('metadata');
    expect(torrentInfos.metadata).toHaveProperty('numPeers_byPeersPeerId');
    expect(torrentInfos.metadata).toHaveProperty('numPeers_beforeStatsReport');
}, 60000);

test('getTorrentMagnetFromFile only wss', async () => {
    const torrentMagnet = await getTorrentMagnetFromFile(`${__dirname}/data/sintel.torrent`, true);
    expect(torrentMagnet).toBe('magnet:?xt=urn:btih:08ADA5A7A6183AAE1E09D831DF6748D566095A10&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&tr=wss%3A%2F%2Ftracker.fastcast.nz');
    expect(await magent2torrent(torrentMagnet)).toBe(`/data/torrents/08ADA5A7A6183AAE1E09D831DF6748D566095A10.torrent`);
});

test('getTorrentFromFile only wss', async () => {
    const torrentMagnet = await getTorrentMagnetFromFile(`${__dirname}/data/sintel.torrent`, true);
    const torrentInfos = await getTorrentInfo(torrentMagnet, 10, true, true, 15000);
    expect(torrentInfos).toHaveProperty('invokedAt');
    expect(torrentInfos).toHaveProperty('errors');
    expect(torrentInfos.errors.length).toBe(0);
    expect(torrentInfos).toHaveProperty('infoHash');
    expect(torrentInfos.infoHash).toHaveProperty('on');
    expect(torrentInfos).toHaveProperty('metadata');
    expect(torrentInfos.metadata).toHaveProperty('numPeers_onMetadata');
    expect(torrentInfos.metadata).toHaveProperty('numPeers_beforeStatsReport');
}, 60000);


test('setTimeout and Promise', async () => {
    function zio() {
        const ret = "ok"

        return new Promise((resolve, reject) => {
            const _timeout = setTimeout(() => resolve(ret), 2000);
        });
    }

    const pp = await zio();

    expect(pp).toBe("ok");
}, 60000);