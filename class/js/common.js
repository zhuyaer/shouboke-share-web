/**
 * Created by laikanz on 17/6/28.
 */
var _url="http://sbkt-port-1178495353.cn-north-1.elb.amazonaws.com.cn/";
//var _url='http://192.168.1.109:1337';
//var _url='http://192.168.1.115:1337';
//var _url='http://api-sbkt.lycam.tv/';
var appId='wx18e63e75d50cb458';
(function () {
    document.addEventListener('DOMContentLoaded', function () {//设置根元素大小，实现自适应
        var html = document.documentElement;
        var windowWidth = html.clientWidth;
        html.style.fontSize = windowWidth / 3.75 + 'px';
    }, false);
})();

function dataURLtoBlob(dataurl) {//base64转2进制
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

function getQueryString(name) { //获取地址栏参数
	var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i"); 
	var r = window.location.search.substr(1).match(reg); 
	if (r != null) return unescape(r[2]); return null; 
} 

function judgePhoneType() {
    //判断设备是安卓还是苹果
    var browser = {
        versions: function() {
            var u = navigator.userAgent, app = navigator.appVersion;
            return {//移动终端浏览器版本信息
                trident: u.indexOf('Trident') > -1, //IE内核
                presto: u.indexOf('Presto') > -1, //opera内核
                webKit: u.indexOf('AppleWebKit') > -1, //苹果、谷歌内核
                gecko: u.indexOf('Gecko') > -1 && u.indexOf('KHTML') == -1, //火狐内核
                mobile: !!u.match(/AppleWebKit.*Mobile.*/) || !!u.match(/AppleWebKit/), //是否为移动终端
                ios: !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/), //ios终端
                android: u.indexOf('Android') > -1 || u.indexOf('Linux') > -1, //android终端或者uc浏览器
                iPhone: u.indexOf('iPhone') > -1 || u.indexOf('Mac') > -1, //是否为iPhone或者QQHD浏览器
                iPad: u.indexOf('iPad') > -1, //是否iPad
                webApp: u.indexOf('Safari') == -1 //是否web应该程序，没有头部与底部
            };
        }(),
        language: (navigator.browserLanguage || navigator.language).toLowerCase()
    };
    if (browser.versions.ios || browser.versions.iPhone || browser.versions.iPad) {
        return "ios";
    }
    else if (browser.versions.android) {
        return "android";
    }
}
