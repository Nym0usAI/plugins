(function(){

'use strict';

if (window.TorrentBadgesPlugin) return;
window.TorrentBadgesPlugin = true;

function analyze(results){

    let resolutions = {};
    let hdr = {};
    let audio = {};
    let dub = false;

    results.forEach(function(torrent){

        if (!torrent || !torrent.ffprobe || !Array.isArray(torrent.ffprobe)) return;

        let video = torrent.ffprobe.find(s => s.codec_type === 'video');
        let audios = torrent.ffprobe.filter(s => s.codec_type === 'audio');

        // RESOLUTION
        if (video && video.width && video.height) {
            let w = video.width;
            let h = video.height;

            if (w >= 7680 || h >= 4320) resolutions['8K'] = true;
            else if (w >= 3840 || h >= 2160) resolutions['4K'] = true;
            else if (w >= 2560 || h >= 1440) resolutions['2K'] = true;
            else if (w >= 1920 || h >= 1080) resolutions['FULLHD'] = true;
            else if (w >= 1280 || h >= 720) resolutions['HD'] = true;
        }

        // HDR
        if (video && video.side_data_list) {
            video.side_data_list.forEach(function(d){
                let type = (d.side_data_type || '').toLowerCase();
                if (type.includes('dolby')) hdr['Dolby Vision'] = true;
                if (type.includes('mastering') || type.includes('light')) hdr['HDR'] = true;
            });
        }

        // AUDIO
        let maxChannels = 0;
        audios.forEach(function(a){
            if (a.channels && a.channels > maxChannels)
                maxChannels = a.channels;
        });

        if (maxChannels >= 8) audio['7.1'] = true;
        else if (maxChannels >= 6) audio['5.1'] = true;
        else if (maxChannels >= 2) audio['2.0'] = true;

        // DUB
        audios.forEach(function(a){
            let lang = (a.tags?.language || '').toLowerCase();
            let title = (a.tags?.title || '').toLowerCase();

            if ((lang === 'ru' || lang === 'rus') &&
                (title.includes('dub') || title.includes('дуб')))
                dub = true;
        });

        // TITLE ANALYSIS
        let name = (torrent.title || '').toLowerCase();

        if (name.includes('dolby vision') || name.includes('dovi'))
            hdr['Dolby Vision'] = true;

        if (name.includes('hdr10+')) hdr['HDR10+'] = true;
        else if (name.includes('hdr10')) hdr['HDR10'] = true;
        else if (name.includes('hdr')) hdr['HDR'] = true;
    });

    return build(resolutions, hdr, audio, dub);
}

function build(resolutions, hdr, audio, dub){

    let result = {
        quality: null,
        hdr: null,
        sound: null,
        dub: dub
    };

    ['8K','4K','2K','FULLHD','HD'].some(q=>{
        if (resolutions[q]){ result.quality = q; return true; }
    });

    ['Dolby Vision','HDR10+','HDR10','HDR'].some(h=>{
        if (hdr[h]){ result.hdr = h; return true; }
    });

    ['7.1','5.1','2.0'].some(s=>{
        if (audio[s]){ result.sound = s; return true; }
    });

    return result;
}

function render(data, container){

    if (!container) return;

    let html = '<div class="torrent-quality-badges">';

    if (data.quality)
        html += '<span class="t-badge res">'+data.quality+'</span>';

    if (data.hdr)
        html += '<span class="t-badge hdr">'+data.hdr+'</span>';

    if (data.sound)
        html += '<span class="t-badge audio">'+data.sound+'</span>';

    if (data.dub)
        html += '<span class="t-badge dub">ДУБ</span>';

    html += '</div>';

    container.insertAdjacentHTML('beforeend', html);
}

// STYLE
Lampa.Listener.follow('app', function(e){

    if (e.type === 'ready'){

        Lampa.Template.add('torrent_badges_style', `
            <style>
                .torrent-quality-badges{
                    display:flex;
                    gap:6px;
                    flex-wrap:wrap;
                    margin-top:6px;
                }
                .t-badge{
                    padding:3px 8px;
                    border-radius:10px;
                    font-size:12px;
                    font-weight:600;
                    border:1px solid rgba(255,255,255,0.4);
                }
                .res{border-color:#00bcd4}
                .hdr{border-color:#ff9800}
                .audio{border-color:#4caf50}
                .dub{border-color:#f44336}
            </style>
        `);
    }
});

// HOOK
Lampa.Listener.follow('torrent', function(e){

    if (e.type === 'load'){

        let data = analyze(e.data.results);

        setTimeout(function(){

            let container = document.querySelector('.torrent__files');
            if (container) render(data, container);

        }, 300);
    }
});

})();
