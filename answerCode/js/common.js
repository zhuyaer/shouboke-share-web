/**
 * Created by laikanz on 18/3/13.
 */
//var serverHttp="http://sbkt-port-1178495353.cn-north-1.elb.amazonaws.com.cn";
var serverHttp="http://api-sbkt.lycam.tv";
var token='Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1OWU1Y2Y2ZmQyOTQwZTE0MDBhZDBmMTciLCJhcGlUb2tlbiI6eyJ0b2tlbiI6IkZNRXMyeHZjZzBvMmtMaGdlOWVVOXVJZnVZTlpsb0QxdE9Ndk9kVUZORGJheHY1WjB3QmJUMmN6Tm9ybEEzV3QifSwidHlwZSI6Ilk6MSIsInRpbWVzdGFtcCI6MTUyMTA4NjEwOTQzNywiaWF0IjoxNTIxMDg2MTA5fQ.IXUsJ85YJ7FYKUSH1YAc1bkWh8wX-m-mq9XYz8MmvZQ';
(function (win) {
    // html根元素
    var HTML_ELEMENT = document.documentElement;
    // 屏幕宽度
    var SCREEN_WIDTH = 0;
    // 标准fontSize计算值
    var BASE_FONT_SIZE = 0;
    // 处理后的fontSize计算值
    var REAL_BASE_FONT_SIZE = 0;

    /**
     * 修复异常的fontSize代码
     */
    var fix = function () {
        var ua = navigator.userAgent;
        var isIOS = /(iPhone|iPad|iPod)/.test(ua);
        // 非苹果设备，均进行检测
        if (!isIOS) {
            var div = win.document.createElement('div');
            div.style.width = '3.75rem';
            win.document.body.appendChild(div);
            win.setTimeout(function () {
                var getWidth = parseFloat(win.getComputedStyle(div).width);
                if (getWidth != SCREEN_WIDTH) {
                    // 此时是出问题的情况
                    var ratio = getWidth / SCREEN_WIDTH;
                    REAL_BASE_FONT_SIZE = (BASE_FONT_SIZE / ratio).toFixed(4);
                    HTML_ELEMENT.style.fontSize = REAL_BASE_FONT_SIZE + 'px';
                }
                div.remove();
            }, 100);
        }
    };

    /**
     * 调整根元素fontSize
     */
    var setBaseFontSize = function () {
        // 获取屏幕宽度
        SCREEN_WIDTH = HTML_ELEMENT.clientWidth;
        // 将屏幕分成3.75份，获取每一份宽度
        BASE_FONT_SIZE = SCREEN_WIDTH / 7.5;
        // 写入html元素fontSize
        HTML_ELEMENT.style.fontSize = BASE_FONT_SIZE + 'px';
        fix();
    };
    setBaseFontSize();
})(window);

function getQueryString(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) return decodeURI(r[2]); return null;
}