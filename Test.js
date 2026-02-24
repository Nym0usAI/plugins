function parseTorrents(results) {

    let resolutions = {};
    let hdr = {};
    let audio = {};
    let dub = false;

    results.forEach(function(torrent){

        if (!torrent.ffprobe || !Array.isArray(torrent.ffprobe)) return;

        let video = torrent.ffprobe.find(s => s.codec_type === 'video');
        let audios = torrent.ffprobe.filter(s => s.codec_type === 'audio');

        // ---------- RESOLUTION ----------
        if (video && video.width && video.height) {

            let w = video.width;
            let h = video.height;

            if (w >= 7680 || h >= 4320) resolutions['8K'] = true;
            else if (w >= 3840 || h >= 2160) resolutions['4K'] = true;
            else if (w >= 2560 || h >= 1440) resolutions['2K'] = true;
            else if (w >= 1920 || h >= 1080) resolutions['FULLHD'] = true;
            else if (w >= 1280 || h >= 720) resolutions['HD'] = true;
        }

        // ---------- HDR / DV ----------
        if (video && video.side_data_list) {

            video.side_data_list.forEach(function(d){

                let type = (d.side_data_type || '').toLowerCase();

                if (type.includes('dolby')) hdr['Dolby Vision'] = true;
                if (type.includes('mastering') || type.includes('light'))
                    hdr['HDR'] = true;
            });
        }

        // ---------- AUDIO ----------
        let maxChannels = 0;

        audios.forEach(function(a){
            if (a.channels && a.channels > maxChannels)
                maxChannels = a.channels;
        });

        if (maxChannels >= 8) audio['7.1'] = true;
        else if (maxChannels >= 6) audio['5.1'] = true;
        else if (maxChannels >= 2) audio['2.0'] = true;

        // ---------- DUB ----------
        audios.forEach(function(a){

            let lang = (a.tags?.language || '').toLowerCase();
            let title = (a.tags?.title || '').toLowerCase();

            if (
                (lang === 'ru' || lang === 'rus' || lang === 'russian') &&
                (title.includes('dub') || title.includes('дуб'))
            ){
                dub = true;
            }
        });

        // ---------- TITLE ANALYSIS ----------
        let name = (torrent.title || '').toLowerCase();

        if (name.includes('dolby vision') || name.includes('dovi'))
            hdr['Dolby Vision'] = true;

        if (name.includes('hdr10+')) hdr['HDR10+'] = true;
        else if (name.includes('hdr10')) hdr['HDR10'] = true;
        else if (name.includes('hdr')) hdr['HDR'] = true;
    });

    return buildBadges(resolutions, hdr, audio, dub);
}
function buildBadges(resolutions, hdr, audio, dub){

    let result = {
        quality: null,
        hdr: null,
        sound: null,
        dub: dub
    };

    // ---- QUALITY PRIORITY ----
    let qPriority = ['8K','4K','2K','FULLHD','HD'];

    for (let i = 0; i < qPriority.length; i++){
        if (resolutions[qPriority[i]]){
            result.quality = qPriority[i];
            break;
        }
    }

    // ---- HDR PRIORITY ----
    let hPriority = ['Dolby Vision','HDR10+','HDR10','HDR'];

    for (let i = 0; i < hPriority.length; i++){
        if (hdr[hPriority[i]]){
            result.hdr = hPriority[i];
            break;
        }
    }

    // ---- SOUND PRIORITY ----
    let sPriority = ['7.1','5.1','2.0'];

    for (let i = 0; i < sPriority.length; i++){
        if (audio[sPriority[i]]){
            result.sound = sPriority[i];
            break;
        }
    }

    return result;
         }
function createBadgeArray(data){

    let badges = [];

    if (data.quality){
        badges.push({
            type: 'resolution',
            value: data.quality
        });
    }

    if (data.hdr){
        badges.push({
            type: 'hdr',
            value: data.hdr
        });
    }

    if (data.sound){
        badges.push({
            type: 'audio',
            value: data.sound
        });
    }

    if (data.dub){
        badges.push({
            type: 'dub',
            value: 'Дубляж'
        });
    }

    return badges;
            }
let parsed = parseTorrents(results);
let badges = createBadgeArray(parsed);

console.log(badges);
