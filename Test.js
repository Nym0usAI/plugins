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
  
            Lampa.Utils.putScriptAsync(["https://beta.l-vid.online/online.js","https://beta.l-vid.online/catalog.js"], function() {});
        }
    },200);
})();
