/**
 * Created by lycamhost on 17/2/28.
 */

(function ($) {
    var Page={
        visitUrl: "http://sbkt-port-1178495353.cn-north-1.elb.amazonaws.com.cn",
        streamId:JSON.parse(sessionStorage.getItem('dataJsonSession')).streamId,
        token:JSON.parse(sessionStorage.getItem('dataJsonSession')).token,
        report:{
            reason:'',
            reportContact:'',
            hasReport:false,
            picUploadImg:""
        },
        init:function(){
            var _this=this;
            _this.uploadImg();
            _this.bindEvent();
        },
        uploadImg:function () {
            var _this = this;
            document.getElementById("uploadImage").addEventListener("change",function () {
                var that = this;
                var phoneType = _this.judgePhoneType();
                if(phoneType == "android"){
                    var objUrl = getObjectURL(that.files[0]) ;  //预览功能的实现  不过用的那个插件自己就会返回URL,所以用不着啦啦~~
                    // 但是。。Android那个插件处理好像慢了那么一两秒,要事先预览,当用户使用的手机为安卓机时,为了不给用户延迟的用户体验,就用这个来事先预览吧= =
                    console.log("objUrl = "+objUrl) ;
                    if (objUrl) {
                        $(".imgBox").css("background-image", "url("+objUrl+")") ;
                        $(".imgBox").addClass('hasImg');
                    }

                    //建立一個可存取到該file的url
                    function getObjectURL(file) {
                        var url = null ;
                        if (window.createObjectURL!=undefined) { // basic
                            url = window.createObjectURL(file) ;
                        } else if (window.URL!=undefined) { // mozilla(firefox)
                            url = window.URL.createObjectURL(file) ;
                        } else if (window.webkitURL!=undefined) { // webkit or chrome
                            url = window.webkitURL.createObjectURL(file) ;
                        }
                        return url ;
                    }
                }
                lrz(that.files[0], {
                    width: 640
                }).then(function (rst) {
                    var img = new Image();
                    img.src = rst.base64;
                    img.onload = function () {
                        console.log(img.getAttribute("src"));
                        if(phoneType == "iphone"){
                            document.getElementById("filePicker").style.backgroundImage="url("+img.getAttribute("src")+")";
                            $(".imgBox").addClass('hasImg');
                        }
                    };
                    _this.report.picUploadImg = img.getAttribute("src");
                    return rst;
                });
            });
        },
        judgePhoneType:function () {
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
                return "iphone";
            }
            else if (browser.versions.android) {
                return "android";
            }
        },
        reportBoxvaildInput:function(){
            var _this=this,$ckeckInput=$("input[type='checkbox']:checked");
            var phonereg = /^(((13[0-9]{1})|(15[0-9]{1})|(18[0-9]{1}))+\d{8})$/;

            var reasons=[];
            if($ckeckInput.length==0){
                _this.warn('至少选择一个举报原因')
            }else if(!phonereg.test($(".telphone").val())){
                _this.warn('请正确输入手机号')
            }else if(!$(".imgBox").hasClass('hasImg')){
                _this.warn('请留下证据截图')
            }else{
                for(var i=0;i<$ckeckInput.length;i++){
                    reasons.push($($ckeckInput[i]).val());
                    if(i==$ckeckInput.length-1){
                        _this.report.reason=reasons;
                        _this.report.reportContact=$(".telphone").val();
                        if(_this.report.hasReport){  //如果已经举报
                            return;
                        }else{
                            _this.reportSubmitBtn(false);
                            _this.reportUploadSubmit();
                        }
                    }
                }
            }
        },
        reportSubmitBtn:function(status){
            if(!status){
                $("#submitReport").val('正在提交中...')
                $("#submitReport").addClass('disabled')
            }
        },
        reportUploadSubmit:function () {
            var _this = this;
            $.ajax({
                url: _this.visitUrl+'/v3/report',
                headers:{
                    Authorization: "Bearer "+_this.token
                },
                type:"POST",
                // processData: false,
                // contentType: false,
                data:{
                    streamId: _this.streamId,
                    pic:_this.report.picUploadImg,
                    reason: _this.report.reason,
                    contact: _this.report.reportContact
                },
                success:function (data) {
                    _this.success("举报成功");
                    _this.report.hasReport=true;
                    setTimeout(function(){
                        window.history.go(-1);
                        //-----------------------跳转回去---------------
                    },3000)
                },
                error:function (error) {
                    _this.warn('举报失败，请重试');
                    $("#submitReport").removeClass('disabled')
                }
            });
        },
        bindEvent:function(){
            var _this=this;
            $("#submitReport").click(function () {
                _this.reportBoxvaildInput();
            });
        }
    };

    $(function(){
        FastClick.attach(document.body);
        Page.init()
    })
})(Zepto);