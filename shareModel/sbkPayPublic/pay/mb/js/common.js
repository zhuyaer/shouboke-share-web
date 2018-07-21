(function(win){
    var common = {
        ajax : function(opt){
            if(opt.isLoading !== false){
                var text = (typeof opt.isLoading == "object"&&opt.isLoading.text )? opt.isLoading.text  : "正在加载..."
                var Loading = Lycam.loading(text);
            }

            var opt = opt||{};
            var host = '';
            var testUrl=(opt.url.indexOf("http://") ==-1 ? host+opt.url : opt.url);
            console.log("testUrl",testUrl)
            return $.ajax({
                url : (opt.url.indexOf("http://") ==-1 ? host+opt.url : opt.url),
                data : opt.data || {},
                type : opt.type || 'post',
                dataType : opt.dataType||'json',
                complete : function(){
                    console.log("complete")
                },
                success : function(res){
                    if(opt.isLoading !== false){
                        Loading&&Loading.hide();
                    }
                    opt.success && opt.success(res);
                },
                error : function(){
                    if(opt.isLoading !== false){
                        Loading&&Loading.hide();
                    }
                    opt.error&&opt.error();
                    console.log("api error url is ",opt.url)
                }
            });
        },
        log: function (str) {
            if (typeof str == 'object') {
                str = JSON.stringify(str);
            }
            var url = "http://www.baidu.com/?debugMsg=-----" + str + '----' + new Date().getTime();
            new Image().src = url;
        },

        trace : function(param){
            var opt = {
                source_cc : "TG6001",
                //origin_url : encodeURIComponent(location.href),
                busi_code : "",
                other : "",
                click_time : parseInt(new Date().getTime()/1000000),
                _t : new Date().getTime()
            };
            $.extend(opt,true,param||{});
            var host = "http://web.service.inke.com";
            if(location.href.indexOf("test.")>=0){
                host = "http://test.web.service.inke.com";
            }
            var url = host+"/web/web_click_report?"+$.param(opt);
            setTimeout(function(){
                new Image().src = url;
            });
        },
        //简单的模版引擎
        parseTemplate : function(d, t) {
            for (var key in d) {
                t = t.replace(new RegExp('\{' + key + '\}', 'g'), d[key]||'');
            }
            return t;
        },
        //判断是否在微信浏览器中
        is_weixn:function(){
            var ua = navigator.userAgent.toLowerCase();
            if(ua.match(/MicroMessenger/i)=="micromessenger") {
                return true;
            } else {
                return false;
            }
         }

};

    win.Common = common;
})(window);