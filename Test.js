(function () {
    'use strict';
	
    var timer = setInterval(function(){
        if(typeof Lampa !== 'undefined'){
            clearInterval(timer);
			
            var unic_id = Lampa.Storage.get('lampac_unic_id', '');
            if (!unic_id) {
              unic_id = Lampa.Utils.uid(8).toLowerCase();
              Lampa.Storage.set('lampac_unic_id', unic_id);
            }
  
            Lampa.Utils.putScriptAsync(["https://beta.l-vid.online/online.js"], function() {});
        }
    },200);
})();
(function () {
'use strict';

var Manifest = {
    api_host:'https://beta.l-vid.online',
    catalogs:{}
};

function account(url){
    url = url + '';
    if(url.indexOf('account_email=') == -1){
        var email = Lampa.Storage.get('account_email');
        if(email) url = Lampa.Utils.addUrlComponent(url,'account_email='+encodeURIComponent(email));
    }
    if(url.indexOf('uid=') == -1){
        var uid = Lampa.Storage.get('lampac_unic_id','');
        if(uid) url = Lampa.Utils.addUrlComponent(url,'uid='+encodeURIComponent(uid));
    }
    return url;
}

var Utils = { account:account };
var network = new Lampa.Reguest();

function url(u,params){
    params = params || {};
    if(params.page) u = add(u,'page='+params.page);
    if(params.query) u = add(u,'query='+params.query);
    return Manifest.api_host + Utils.account(u);
}

function add(u,params){
    return u + (/\?/.test(u) ? '&':'?') + params;
}

function get(method,params,oncomplite,onerror){
    var u = url(method,params);
    network.silent(u,function(json){
        json.url = method;
        oncomplite(addSource(json));
    },onerror);
}

function getCatalog(){
    return Manifest.catalogs[Lampa.Storage.field('source')];
}

function addSource(data,custom){
    var source = custom || Lampa.Storage.field('source');
    if(Lampa.Arrays.isObject(data) && Lampa.Arrays.isArray(data.results)){
        data.results.forEach(function(item){
            if(!item.source) item.source = source;
        });
    }
    return data;
}

/* =========================
   🔥 ГЛАВНОЕ ИСПРАВЛЕНИЕ
   Карточка всегда через TMDB
   ========================= */

function full(params,oncomplite){
    var status = new Lampa.Status(1);
    status.onComplite = oncomplite;

    // принудительно используем TMDB
    var request_url = '/catalog/card?plugin=tmdb&uri=' 
        + encodeURIComponent(params.id) 
        + '&type=' + (params.method || 'movie');

    get(Utils.account(request_url),params,function(json){

        // оставляем оригинальный source чтобы меню не ломалось
        json.source = params.source;

        if(json.seasons && json.seasons.length){
            var season = Lampa.Utils.countSeasons(json);
            if(season){
                status.need++;
                Lampa.Api.sources.tmdb.get(
                    'tv/'+json.tmdb_id+'/season/'+season,
                    {},
                    function(ep){
                        status.append('episodes',ep);
                    },
                    status.error.bind(status)
                );
            }
        }

        if(json.tmdb_id){
            status.need++;
            Lampa.Api.sources.cub.reactionsGet(
                {id:json.tmdb_id,method:json.original_name?'tv':'movie'},
                function(reactions){
                    status.append('reactions',reactions);
                }
            );
        }

        if(json.credits) status.data['persons'] = json.credits;
        if(json.recommendations) status.data['recomend'] = addSource({results:json.recommendations},'tmdb');
        if(json.similar) status.data['simular'] = addSource({results:json.similar},'tmdb');
        if(json.videos) status.data['videos'] = addSource({results:json.videos},'tmdb');

        status.append('movie',json);

    },function(){
        status.error();
    });
}

/* ========================= */

var Api = {
    full:full
};

function startPlugin(){
    window.plugin_catalog = true;
    Object.defineProperty(Lampa.Api.sources,'cub',{
        get:function(){
            return Api;
        }
    });
}

if(!window.plugin_catalog) startPlugin();

})();
