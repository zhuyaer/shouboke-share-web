/**
 * Created by laikanz on 16/11/18.
 */
(function($){
    var Page={
        Timer:null,
        href:encodeURIComponent(window.location.href),
        /******************生产环境配置START***************/
        // commonUrl:"http://api-sbkt.lycam.tv/",
        commonUrl:'http://sbkt-port-1178495353.cn-north-1.elb.amazonaws.com.cn/',
        //固定路径
        addr:"http://shouboke.tv/shareModel/",
        //微信授权基本链接
        linkBasicUrl:"https://open.weixin.qq.com/connect/oauth2/authorize?"+
        "appid=wx18e63e75d50cb458&redirect_uri=http://shouboke.tv/shareModel/index.html&response_type=code&",
        //默认链接
        linkUrl:"https://open.weixin.qq.com/connect/oauth2/authorize?"+
        "appid=wx18e63e75d50cb458&redirect_uri=http://shouboke.tv/shareModel/index.html"+
        "&response_type=code&scope=snsapi_base&state=",
        reloadUrl:'https://graph.qq.com/oauth2.0/authorize?response_type=token&client_id=1105569906&redirect_uri=http://shouboke.tv/weChat_web_develop/qqSeriesClass.html?state=',
        // reloadUrl:'https://graph.qq.com/oauth2.0/authorize?response_type=token&client_id=1105569906&redirect_uri=http://shouboke.tv/shareModel/qqSeriesClass.html?state=',
        /******************生产环境配置END***************/
        video:document.getElementsByTagName("video")[0],
        loadComplete:false,//页面渲染程度
        onceConnect:false,
        unpublish:true,//避免重复接收mqtt下发的消息
        publish:true,
        pause:true,
        tapApply:0,
        posterImg:null,
        changeLines:[],//视频线路
        hotVideoList:{
            onceGet:false,
            readyPage:1,
            livePage:1,
            overPage:1,
            readyperPageCount:2,
            liveperPageCount:2,
            overperPageCount:2,
            forData:""
        },
        commentCount:0,//发言条数
        audienceNum:0,//人数
        initCount:40,//默认获取最近40条留言
        completePay:false,//支付情况,免费课此参数默认为true
        question:false,//普通发言或提问
        hasClickLogin:false,//用户至少有一次登录验证的机会
        isSubscribe:false,//报名情况
        /**
         * 绑定账号相关
         */
        phone:null,
        boxInput:null,
        timer:null,
        authCode:0,
        onceBindEvent:false,
        /*举报相关*/
        report:{
            reason:'',
            reportContact:'',
            hasReport:false,
            picUploadImg:""
        },
        init:function(){
            var _this=this;
            // _this.report();
            _this.dataObj=JSON.parse(sessionStorage.getItem('dataJsonSession'))
            _this.getVideoInfo();
            // _this.initwebChatShare();//分享初始配置
            _this.bindEvent();
            // _this.getTicket();
            //从进入5秒后还未正常加载（loadedmeatadata）
            setTimeout(function(){
                if(!_this.loadComplete){
                    _this.loaded();
                }
            },5000)
        },

        //微信分享配置初始化
        initwebChatShare:function(){
            var _this=this;
            $.ajax({
                url:_this.commonUrl+"weixin/share/signature?url="+_this.href,  //获取签名
                type:"get",
                success:function(data){
                    //微信分享配置相关
                    wx.config({
                        debug: false, //开启调试模式
                        appId: 'wx18e63e75d50cb458', // 必填，公众号的唯一标识
                        timestamp: data.timestamp, // 必填，生成签名的时间戳
                        nonceStr: data.noncestr, // 必填，生成签名的随机串
                        signature: data.sign,// 必填，签名，见附录1
                        jsApiList: [
                            // 所有要调用的 API 都要加到这个列表中
                            'checkJsApi',  //判断当前客户端版本是否支持指定JS接口
                            'onMenuShareTimeline',  //分享到朋友圈
                            'onMenuShareAppMessage', //分享给朋友
                            'onMenuShareQQ',  //分享到QQ
                            'onMenuShareWeibo', //分享到微博
                            'onMenuShareQZone' //分享到QQ空间
                        ] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
                    });
                },
                error:function(error){
                    console.log("signatureError",error);
                }
            });
        },
        //获取视频信息以及权限
        getVideoInfo:function(){
            var _this=this;
            _this.dataObj.streamId=getQueryString('state');
            if(!_this.dataObj.streamId){
                var url = window.location.hash;
                var array1 = url.split("=");
                //var code = array1[1].substr(0,array1[1].indexOf('&state'));
                //var streamId = getQueryString('state');//获取streamId
                _this.dataObj.streamId =array1[3];
            }
            $.ajax({
                url: _this.commonUrl+"stream/show?streamId="+_this.dataObj.streamId+"&type=join&isSeries=true",  //获取视频信息以及权限
                type:"get",
                headers:{
                    Authorization: "Bearer "+_this.dataObj.token
                },
                success:function (data) {
                    // _this.wxShare(data)
                    console.log("stream/show",data);
                    _this.category=data.category;
                    sessionStorage.setItem('category',_this.category);
                    console.log('----',_this.category)
                    _this.loadComplete=false;//渲染情况
                    _this.loadVideoInfo(data);
                    _this.getHistoryComment();
                    console.log(!data.chatUrl=="")
                    if(!data.chatUrl==""){
                        _this.onceConnect=true;
                        _this.connectMsg(data.chatChannel,data.chatUrl);
                    }
                },
                error:function (error) {

                }
            });
        },

        //存储token+streamId
        memory:function(data){
            var _this=this;
            //登录或报名后token，userid更新
            var dataJson={
                token:data.token.token,
                streamId:_this.dataObj.streamId,
                type:_this.dataObj.type,
                unionid:_this.dataObj.unionid,
                openid:_this.dataObj.openid,
                nickname:_this.dataObj.nickname,
                userid:data.id,
                apiToken:_this.dataObj.apiToken
            }
            try{
                dataJson=JSON.stringify(dataJson)
                sessionStorage.setItem('dataJsonSession',dataJson)
            }finally{
                _this.dataObj=JSON.parse(sessionStorage.getItem('dataJsonSession'))
            }
        },

        //加载视频信息
        loadVideoInfo:function(data){
            //iphone6s 不能在切换页面时收起弹框
            $("input:focus").blur();
            var _this=this;
            _this.loaded();
            $("title").html(data.title);
            $(".courseTitle").html(data.title);
            $(".startTime").html(data.startTime);
            $(".duration").html(data.duration);
            if(data.description){
                $(".introduceContent").html(description(data.description));
            }
            $(".subscribeCount").html(data.subscribeCount+"人");
            if(data.qrImgUrl){
                console.log(data)
                $(".qrImgUrl>img").attr('src','http://shouboke-web.oss-cn-hangzhou.aliyuncs.com/shareModel/assets/img/getqrcode.jpg')
            }else{
                $(".qrImgUrl_tip").hide()
                $(".qrImgUrl").hide()
            }
            console.log('---data',data);
            var thumbnailUrl=sessionStorage.getItem('thumbnailUrl');
            _this.posterImg=thumbnailUrl
                _this.isSubscribe=true;
                if(data.status == "over"||data.status == "upload"){
                    $(".videoTab.active")&&$(".videoTab.active").removeClass("active");
                    $(".live_playBack").addClass("active")
                    $(".live_playBack #video").show()
                    $(".live_playBack .poster").hide()
                    $(".road").hide();
                    $("#video").attr("src",data.streamUrl);
                    $("#video").attr("poster",thumbnailUrl);
                    $("#video").get(0).onloadedmetadata=function(){
                        _this.video.play()
                        _this.loaded();
                    }
                }else if(data.status == "live"){
                    $(".videoTab.active")&&$(".videoTab.active").removeClass("active");
                    $(".live_playBack").addClass("active")
                    $(".live_playBack #video").show()
                    $(".live_playBack .poster").hide()
                    _this.changeUrl(data.streamUrls);
                    $(".road").show();
                    $("#video").attr("src",_this.changeLines[0]);
                    $("#video").attr("poster",thumbnailUrl);
                    $("#video").get(0).onloadedmetadata=function(){
                        _this.video.play()
                        _this.loaded();
                    };

                }else{
                    $(".police").hide()
                    $(".videoTab.active")&&$(".videoTab.active").removeClass("active");
                    $(".readyV").addClass("active")
                    $(".readyposter").attr("src",thumbnailUrl);
                    $(".readyposter").get(0).onload=function(){
                        //ready 倒计时
                        _this.countDown(data.startTime);
                        _this.loaded();
                    }
                }
                $("#isSubscribe").hide();
            if(data.anchorStatus=="pause"){
                $("#videoBox").append("<div class='pauseTip'></div>")
                $(".pauseTip").css("backgroundImage","url("+_this.posterImg+")")
                $("#videoBox").append("<span class='pauseTipText'>主播暂时离开</span>")
            }
        },

        //获取历史聊天记录
        getHistoryComment:function(){
            var _this=this;
            $.ajax({
                url:_this.commonUrl+'stream/question',
                type:"get",
                data:{
                    type:"all",
                    streamId:_this.dataObj.streamId,
                    page: "1",
                    resultsPerPage:_this.initCount,
                    order:"desc"  //降序
                },
                success:function(data){
                    console.log("getCommentSuccess",data);
                    var length = data.items.length;
                    _this.commentCount = data.totalItems;
                    if(length>0){
                        $(".dialogue").html(_this.commentCount);
                        var commentList = "";
                        for(var i=length-1;i>=0;i--){ //倒序显示
                            if(data.items[i].type == "message"){
                                commentList+='<li class="streamInfo">'+
                                '<div class="ui-avatar-s">'+
                                '<span style="background-image:url('+data.items[i].user.avatarUrl+')"></span>'+
                                '</div>'+
                                '<div class="ui-list-info">'+
                                '<h4 class="ui-nowrap">'+data.items[i].user.displayName+'<small class="date">'+formatDate(data.items[i].createdAt,'yyyy-MM-dd HH:mm')+'</small></h4>'+
                                '<div>'+data.items[i].content+'</div>'+
                                '</div>'+
                                '</li>'
                            }else{
                                commentList+='<li class="streamInfo">'+
                                '<div class="ui-avatar-s">'+
                                '<span style="background-image:url('+data.items[i].user.avatarUrl+')"></span>'+
                                '</div>'+
                                '<div class="ui-list-info">'+
                                '<h4 class="ui-nowrap">'+data.items[i].user.displayName+'<div class="userqusetion"><img src='+_this.addr+'assets/img/question.png /></div><small class="date">'+formatDate(data.items[i].createdAt,'yyyy-MM-dd HH:mm')+'</small></h4>'+
                                '<div class="questionContent">'+data.items[i].content+'</div>'+
                                '</div>'+
                                '</li>'
                            }
                        }
                        $(".infoBox").append(commentList);
                    }else{
                        $(".infoBox").html("<span class='nothingSay'>还没人说话呢,说两句吧。(*^__^*)。</span>");
                    }
                },
                error:function(error){
                    console.log("getCommentError",error);
                }
            });
        },
        // MQTT connect start
        connectMsg:function(chatChannel,chatUrl){
            console.log('23433')
            var _this=this;
            var timestamp = (new Date()).valueOf()+Math.random().toString(36).replace(/[^a-z]+/g, '');
            // Create a client instance
            var client = new Paho.MQTT.Client(chatUrl, Number(8083), "/mqtt", timestamp);
            // set callback handlers
            client.onConnectionLost = onConnectionLost;
            client.onMessageArrived = onMessageArrived;
            // connect the client
            client.connect({
                onSuccess:onConnect,
                onFailure:function(message){
                    console.log('onFailure:连接失败')
                    //console.log("Connection failed: " + message.errorMessage + "Retrying")
                    console.log('timestamp',timestamp)
                    console.log('password',_this.dataObj.apiToken)
                    _this.connectMsg(chatChannel,chatUrl)
                },
                userName : timestamp,
                password : _this.dataObj.apiToken
            });
            //called when the client connects
            function onConnect() {
                // Once a connection has been made, make a subscription and send a message.
                console.log("onConnect:连接成功");
                client.subscribe(chatChannel);
            }
            // called when the client loses its connection
            function onConnectionLost(responseObject) {
                console.log("onConnectionLost:连接失败");
                console.log("responseObject",responseObject);
                if (responseObject.errorCode !== 0) {
                    _this.connectMsg(chatChannel,chatUrl)
                    console.log("onConnectionLost:"+responseObject.errorMessage);
                }
            }
            // called when a message arrives
            function onMessageArrived(message) {
                var data =  JSON.parse(message.payloadString);
                console.log("mqtt——msg",data)
                var sendTime = new Date();
                _this.time = sendTime;
                var commentList="";
                switch(data.type)
                {
                    case  "message":
                        $(".nothingSay")&&$(".nothingSay").remove();
                        ++_this.commentCount;
                        commentList+='<li class="streamInfo">'+
                        '<div class="ui-avatar-s">'+
                        '<span style="background-image:url('+data.metaInfo.avatarUrl+')"></span>'+
                        '</div>'+
                        '<div class="ui-list-info">'+
                        '<h4 class="ui-nowrap">'+data.metaInfo.displayName+'<small class="date">'+formatDate(_this.time,'yyyy-MM-dd HH:mm')+'</small></h4>'+
                        '<div>'+data.metaInfo.content+'</div>'+
                        '</div>'+
                        '</li>'
                        $(".infoBox").append(commentList);
                        $("#infobox").scrollTop($("#infobox")[0].scrollHeight);
                        break;
                    case "question":
                        $(".nothingSay")&&$(".nothingSay").remove();
                        ++_this.commentCount;
                        commentList+='<li class="streamInfo">'+
                        '<div class="ui-avatar-s">'+
                        '<span style="background-image:url('+data.metaInfo.avatarUrl+')"></span>'+
                        '</div>'+
                        '<div class="ui-list-info">'+
                        '<h4 class="ui-nowrap">'+data.metaInfo.displayName+'<div class="userqusetion"><img src='+_this.addr+'assets/img/question.png /></div><small class="date">'+formatDate(_this.time,'yyyy-MM-dd HH:mm')+'</small></h4>'+
                        '<div class="questionContent">'+data.metaInfo.content+'</div>'+
                        '</div>'+
                        '</li>'
                        $(".infoBox").append(commentList);
                        $("#infobox").scrollTop($("#infobox")[0].scrollHeight);
                        break;
                    case "audience_num"://在现观众
                        _this.audienceNum = data.metaInfo.count;
                        break;
                    case "stream.status":
                        if(data.content.status=="stream.pause"){
                            _this.clearpauseTip()
                            $(".live_playBack #video").hide()
                            $("#videoBox").append("<div class='pauseTip'></div>")
                            $(".pauseTip").css("backgroundImage","url("+_this.posterImg+")")
                            $("#videoBox").append("<span class='pauseTipText'>主播暂时离开</span>")
                        }else if(data.content.status=="stream.publish"){
                            _this.clearpauseTip()
                            _this.getVideoInfoAgin()
                        }else if(data.content.status=="stream.unpublish"){
                            _this.clearpauseTip()
                            $(".live_playBack #video").hide()
                            $("#videoBox").append("<div class='pauseTip'></div>")
                            $(".pauseTip").css("backgroundImage","url("+_this.posterImg+")")
                            $("#videoBox").append("<p class='pauseTipText'>主播已结束直播<br>共<span class='audienceCount greenPoint'>"+_this.audienceNum+"人</span>观看</p>")
                        }else{return;}
                        break;
                    case  "stream_closed":
                        alert(data.metaInfo.content)
                }
                $(".dialogue").html(_this.commentCount);
                $(".peopleCount").html(_this.audienceNum);
            }
        },
        clearpauseTip:function(){
            $("#videoBox .pauseTip")&&$("#videoBox .pauseTip").remove()
            $("#videoBox .pauseTipText")&&$("#videoBox .pauseTipText").remove()
        },

        loaded:function(){
            var _this=this;
            //$(".videoTab.active").css({"minHeight":($(window).width()*9/16)+"px"})
            var Height=$(window).height()-$("header").height()-180-$(".ui-tab-nav").height();
            $(".ui-tab-content").css({"height":Height+"px"});
            $(".ui-loading-block").hide();//图片／视频加载完成后
            _this.loadComplete=true
        },

        sendInfo:function(msg){
            var _this=this,postType="";
            if(_this.question){
                postType="question"
            }else{
                postType="message"
            }
            if(msg == ''){
                warn("内容不能为空")
            }else{
                $(".nothingSay")&&$(".nothingSay").remove();
                $.ajax({
                    url: _this.commonUrl+'msg/push',
                    data:{
                        streamId: _this.dataObj.streamId,
                        content: msg,
                        type: postType
                    },
                    headers:{
                        Authorization: "Bearer "+_this.dataObj.token
                    },
                    type:"post",
                    success:function(data){
                        $("#msgInfo").val("")
                        console.log("sendInfoSuccessData",data);
                    },
                    error:function(error){
                        console.log("sendInfoError",error)
                        warn("发送失败,请重试。");
                    }
                });
            }
        },

        //预告倒计时
        countDown:function(time){
            var _this=this;
            var date1=new Date();  //现在时间
            var date2=new Date(time.replace(/-/g, "/")).getTime();    //预计开播时间
            // safria浏览器对new Date("2016-11-22")时间格式的不兼容   new Date('2014-02-18'.replace(/\s/, 'T'))
            // new Date('2014-02-18T15:00:48'.replace(/\s/, 'T'))
            var date3=date2-date1.getTime();  //时间差的毫秒数
            if(date3<=1000){
                $(".timeTip").hide();
                $("#time").hide();
                $(".delayTip").show();
                return;
            }else{
                //计算出相差天数/向下取整
                var days=Math.floor(date3/(24*3600*1000));
                //计算出小时数
                var leave1=date3%(24*3600*1000)    //计算天数后剩余的毫秒数
                var hours=Math.floor(leave1/(3600*1000))
                //计算相差分钟数
                var leave2=leave1%(3600*1000)        //计算小时数后剩余的毫秒数
                var minutes=Math.floor(leave2/(60*1000))
                //计算相差秒数
                var leave3=leave2%(60*1000)      //计算分钟数后剩余的毫秒数
                var seconds=Math.round(leave3/1000)
                function n(n){
                    return n=(n<10)?("0"+n):n
                }
                var objhtml=
                    '<div class="blackrgba">'+
                    '<ul class="clearfix">' +
                    '<li><div class="timeItem"><div class="line"></div>'+n(days)+'</div><div>天</div></li>'+
                    '<li><div class="timeItem"><div class="line"></div>'+n(hours)+'</div><div>小时</div></li>'+
                    '<li><div class="timeItem"><div class="line"></div>'+n(minutes)+'</div><div>分</div></li>'+
                    '<li><div class="timeItem"><div class="line"></div>'+n(seconds)+'</div><div>秒</div></li>'+
                    '</ul>'+
                    '</div>'
                $("#time").html(objhtml)
                clearInterval(_this.Timer)
                _this.Timer=setInterval(function(){_this.countDown(time)},1000)
            }
        },

        changeUrl:function(streamUrls){
            var _this=this;
            $(streamUrls).each(function (i,n) {
                if(n.type == "HLS"){
                    _this.changeLines.push(n.url);
                }
            });
        },
        //举报相关START-----------------------------------
        uploadImg:function () {
            var _this = this;
            document.getElementById("uploadImage").addEventListener("change",function () {
                var that = this;
                var phoneType = platform;
                console.log(phoneType)
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
                        //console.log(img.getAttribute("src"));
                        if(phoneType == "ios"){
                            document.getElementById("filePicker").style.backgroundImage="url("+img.getAttribute("src")+")";
                            $(".imgBox").addClass('hasImg');
                        }
                    };
                    _this.report.picUploadImg = img.getAttribute("src");
                    return rst;
                });
            });
        },
        reportBoxvaildInput:function(){
            var _this=this,$ckeckInput=$("input[type='checkbox']:checked");
            var phonereg = /^(((13[0-9]{1})|(15[0-9]{1})|(18[0-9]{1}))+\d{8})$/;

            var reasons=[];
            if($ckeckInput.length==0){
                warn('至少选择一个举报原因');
            }else if(!phonereg.test($(".telphone").val())){
                // warn('请正确输入手机号')
                warn('请正确输入手机号');
            }else if(!$(".imgBox").hasClass('hasImg')){
                // warn('请留下证据截图')
                warn('请留下证据截图');
            }else{
                for(var i=0;i<$ckeckInput.length;i++){
                    reasons.push($($ckeckInput[i]).val());
                    if(i==$ckeckInput.length-1){
                        _this.report.reason=reasons;
                        _this.report.reportContact=$(".telphone").val();
                        _this.reportSubmitBtn(false);
                        _this.reportUploadSubmit();
                    }
                }
            }
        },
        warning:function(_html){
            $('.ui-poptips-cnt').html(_html);
            $('.ui-poptips-warn').show();
            setTimeout(function(){
                $('.ui-poptips-warn').hide();
            },2000)
        },
        reportSubmitBtn:function(status){
            if(!status){
                $("#submitReport").val('正在提交中...')
                $("#submitReport").addClass('disabled')
            }else{
                $("#submitReport").val('提交')
                $("#submitReport.disabled")&&$("#submitReport.disabled").removeClass('disabled')
            }
        },
        reportUploadSubmit:function () {
            var _this = this;
            $.ajax({
                url: _this.commonUrl+'/v3/report',
                headers:{
                    Authorization: "Bearer "+_this.dataObj.token
                },
                type:"POST",
                // processData: false,
                // contentType: false,
                data:{
                    streamId:_this.dataObj.streamId,
                    pic:_this.report.picUploadImg,
                    reason: _this.report.reason,
                    contact: _this.report.reportContact
                },
                success:function (data) {
                    _this.warning("举报成功");
                    _this.report.hasReport=true;
                    setTimeout(function(){
                        //切换回去
                        $("#contentBox").addClass('show')
                        $("#reportBox.show")&&$("#reportBox.show").removeClass('show')
                    },3000)
                },
                error:function (error) {
                    _this.warning(JSON.parse(error.responseText).error_output)
                    //warn('举报失败，请重试');
                    _this.reportSubmitBtn(true)
                    if(JSON.parse(error.responseText).error=="request_forbidden"){
                        setTimeout(function(){
                            //切换回去
                            $("#contentBox").addClass('show')
                            $("#reportBox.show")&&$("#reportBox.show").removeClass('show')
                        },3000)
                    }

                }
            });
        },
        //举报相关END-----------------------------------

        //绑定手机号初始化
        initBind:function(){
            var _this=this;
            _this.bindPhoneEvent();
            var container=document.getElementById("inputBoxContainer");
            _this.boxInput={
                maxLength:"",
                realInput:"",
                bogusInput:"",
                bogusInputArr:"",
                callback:"",
                init:function(fun){
                    var that = this;
                    this.callback = fun;
                    that.realInput = container.children[0];
                    that.bogusInput = container.children[1];
                    that.bogusInputArr = that.bogusInput.children;
                    that.maxLength = that.bogusInputArr[0].getAttribute("maxlength");
                    that.realInput.oninput = function(){
                        that.setValue();
                    }
                    that.realInput.onpropertychange = function(){
                        that.setValue();
                    }
                },
                setValue:function(){
                    this.realInput.value = this.realInput.value.replace(/\D/g,"");
                    console.log(this.realInput.value.replace(/\D/g,""))
                    var real_str = this.realInput.value;
                    for(var i = 0 ; i < this.maxLength ; i++){
                        this.bogusInputArr[i].value = real_str[i]?real_str[i]:"";
                    }
                    if(real_str.length >= this.maxLength){
                        this.realInput.value = real_str.substring(0,6);
                        this.callback();//执行回调
                    }else{//验证码未通过验证
                        if(!$("#sureBind").hasClass("disabled")){
                            $("#sureBind").addClass("disabled")
                        }
                    }
                },
                getBoxInputValue:function(){
                    var realValue = "";
                    for(var i in this.bogusInputArr){
                        if(!this.bogusInputArr[i].value){
                            break;
                        }
                        realValue += this.bogusInputArr[i].value;
                    }
                    return realValue;
                }
            }
            _this.boxInput.init(function() {
                _this.authCode = _this.boxInput.getBoxInputValue();
                console.log(_this.boxInput.getBoxInputValue())
                //填写完整验证码后,验证验证码是否正确
                $.ajax({
                    url: _this.commonUrl + "sms/verifyCode",
                    type: 'post',
                    headers: {
                        Authorization: "Bearer " + _this.dataObj.token
                    },
                    data: {
                        phone: _this.phone,
                        authCode: _this.authCode,
                        type: 'binding'
                    },
                    success: function(data){
                        if (data.success) {
                            console.log("验证码验证成功")
                            $("#countNum").addClass('hide');
                            $("#sureBind.hide")&&$("#sureBind.hide").removeClass('hide');
                            $("#sureBind.disabled")&&$("#sureBind.disabled").removeClass("disabled");
                            clearInterval(_this.timer)
                        }else{
                            if(!$("#sureBind").hasClass("disabled")){
                                $("#sureBind").addClass("disabled")
                            }
                            warn("验证码错误")
                        }
                    },
                    error: function(){
                        if(!$("#sureBind").hasClass("disabled")){
                            $("#sureBind").addClass("disabled")
                        }
                        warn("验证码错误")
                    }
                })

            });
        },

        countNumInit:function(){
            var _this=this, countNum=180;
            $("#countNum").html(countNum+"s后失效")
            _this.timer=setInterval(function(){
                countNum--;
                if(countNum<=0){
                    $("#countNum").removeClass("countDowning")
                    $("#countNum").html('重新发送')
                    clearInterval(_this.timer)
                }else{
                    $("#countNum").html(countNum+"s后失效")
                }

            },1000)
        },

        bindPhoneEvent:function(){
            var _this=this;
            $("#sendVerify").on('click',function(){//发送短信验证
                $.ajax({
                    url:_this.commonUrl+"sms/getCode?phone="+_this.phone+"&type=binding",
                    type:'get',
                    headers:{
                        Authorization: "Bearer "+_this.dataObj.token
                    },
                    success:function(data){
                        if(data.success){
                            console.log('发送sms成功')
                            $("#countNum.hide")&&$("#countNum.hide").removeClass('hide');
                            $(".noticeBind").addClass('hide');
                            $(".verify.hide")&& $(".verify.hide").removeClass("hide")
                            _this.countNumInit();
                            $("#sendVerify").addClass('hide');
                        }else{
                            console.log('data','发送sms失败',data)
                        }
                    },
                    error:function(error){
                        console.log('发送sms失败',error)
                        warn("发送验证码失败")
                    }
                })

            })
            $("#countNum").on('click',function(){
                if($("#countNum").hasClass("countDowning")){
                    return;
                }else{
                    $("#countNum").addClass("countDowning")
                    _this.countNumInit()
                }
            })
            $("#sureBind").on('click',function(){
                if($("#sureBind").hasClass("disabled")){return;}
                $.ajax({
                    url:_this.commonUrl+"user/bindThirdPart",
                    type:'post',
                    headers:{
                        Authorization: "Bearer "+_this.dataObj.token
                    },
                    data:{
                        type:_this.dataObj.type,
                        unionid:_this.dataObj.unionid,
                        openid:_this.dataObj.openid,
                        nickname:_this.dataObj.nickname
                    },
                    success:function(data){
                        success("绑定成功")
                        //绑定后token，apiToken更新
                        try{
                            var dataJson={
                                token:data.token.token,
                                streamId:_this.dataObj.streamId,
                                type:_this.dataObj.type,
                                unionid:_this.dataObj.unionid,
                                openid:_this.dataObj.openid,
                                nickname:_this.dataObj.nickname,
                                userid:_this.dataObj.userid,
                                apiToken:data.token.apiToken.value
                            }
                            dataJson=JSON.stringify(dataJson)
                            sessionStorage.setItem('dataJsonSession',dataJson)
                        }finally{
                            _this.dataObj=JSON.parse(sessionStorage.getItem('dataJsonSession'))
                        }
                        $("#bindPhone.ui-dialog").dialog("hide");
                    },
                    error:function(error){
                        alert(JSON.parse(error.responseText).error_output)
                        console.log('绑定失败',JSON.parse(error.responseText).error_output)
                        setTimeout(function(){ $("#bindPhone.ui-dialog").dialog("hide")},3000)
                    }
                })
            })
        },

        loginEvent:function(){
            var _this=this;
            //验证能否登录
            $("#phoneNum").keyup(function(){
                _this.loginBtn()
            })
            $("#password").keyup(function(){
                _this.loginBtn()
            })
            $("#login").click(function () {
                var phoneNum = $("#phoneNum").val();
                var password = $("#password").val();
                if(_this.canLogin){
                    console.log("_this.canLogin",_this.canLogin)
                    $.ajax({
                        url:_this.commonUrl +'login',
                        data: {
                            username:phoneNum,
                            password:password
                        },
                        type: "post",
                        success: function (data){
                            console.log('loginDta',data)
                            try{
                                var dataJson={
                                    token:data.token.token,
                                    streamId:_this.dataObj.streamId,
                                    type:_this.dataObj.type,
                                    unionid:_this.dataObj.unionid,
                                    openid:_this.dataObj.openid,
                                    nickname:_this.dataObj.nickname,
                                    userid:data.id,
                                    apiToken:data.token.apiToken.value
                                }
                                dataJson=JSON.stringify(dataJson)
                                sessionStorage.setItem('dataJsonSession',dataJson)
                            }finally{
                                _this.dataObj=JSON.parse(sessionStorage.getItem('dataJsonSession'))
                            }
                            _this.hasClickLogin=true;
                            if ($("#remPsd").is(':checked')){
                                localStorage.setItem('remPsd',"true")
                                localStorage.setItem('phoneNum',phoneNum)
                                localStorage.setItem('password',password)
                            }else {
                                localStorage.setItem('remPsd',"")
                                localStorage.setItem('phoneNum',"")
                                localStorage.setItem('password',"")
                            }
                            console.log("loginSuccess",data);
                            //重新登录替换token
                            _this.memory(data);

                            //用户号码正确后还要验证是否是团队成员再提示绑定
                            $.ajax({
                                url: _this.commonUrl+"stream/show",  //获取视频信息以及权限
                                type:"get",
                                data:{
                                    streamId:_this.dataObj.streamId,
                                    type:'join'
                                },
                                headers:{
                                    Authorization: "Bearer "+_this.dataObj.token
                                },
                                success:function (data) {
                                    //提示绑定
                                    _this.phone=phoneNum;
                                    _this.initBind();
                                    setTimeout(function(){
                                        $("#bindPhone.ui-dialog").dialog("show");
                                    },500)
                                },
                                error:function (error) {
                                    _this.showNotpass();
                                }
                            });
                        },
                        error: function (error) {
                            //用户名或密码错误
                            warn("用户名或密码错误");
                            console.log("loginError",error);

                        }
                    });
                }

            })

            $("#bindPhone.ui-dialog").on("dialog:hide",function(e){
                console.log("dialog hide")
                _this.getVideoInfo();
            });
            //验证密码课
            $("#passcheckedInput").keyup(function(){
                if($("#passcheckedInput").val()==""){
                    if(!$("#psdlogin").hasClass("disabled")){
                        $("#psdlogin").addClass("disabled")
                    }
                }else{
                    $("#psdlogin.disabled")&&$("#psdlogin.disabled").removeClass("disabled")
                }
            })
            $("#psdlogin").click(function(){
                if($("#passcheckedInput").val()==""){
                    return;
                }
                $.ajax({
                    url: _this.commonUrl+'stream/checkPassword',
                    data:{
                        streamId: _this.dataObj.streamId,
                        password:$("#passcheckedInput").val()
                    },
                    headers:{
                        Authorization: "Bearer "+_this.dataObj.token
                    },
                    type:"post",
                    success:function(data){
                        if(data.success){
                            _this.psdCourse=$("#passcheckedInput").val()
                            success("密码验证成功")
                            _this.passCoursePsd=true
                            _this.getVideoInfo();
                        }else{
                            warn("课程密码错误")
                        }
                    },
                    error:function(error){
                        warn("课程密码错误")
                    }

                });
            })
        },

        bindEvent:function(){
            var _this=this;
            _this.video.addEventListener('ended', function (e) {
                _this.getVideoInfoAgin()
            })
            $("#sendInfoBox").hide()
            $(".ui-tab .ui-tab-nav").on("click","li", function(){
                $(".ui-tab-nav li.current")&&$(".ui-tab-nav li.current").removeClass("current");
                $(".ui-tab-content li.show")&&$(".ui-tab-content li.show").removeClass("show")
                $(this).addClass("current");
                var n=$(this).index();
                if(n==0){
                    $("#sendInfoBox").show()
                }else{
                    $("#sendInfoBox").hide()
                }
                $(".ui-tab-content li:nth-child("+(n+1)+")").addClass("show")
            });
            $(".apply").on("click",function(){
                if( _this.tapApply==1){return;}else{_this.shoubokeCharge()}
            });
            //前去支付
            $("#webChatPay").on("click",function(){
                _this.createOrder()
            });
            $(".question").on("click",function(){
                if($(".question").hasClass("active")){
                    $(this).removeClass("active");
                    _this.question=false;
                }else{
                    $(this).addClass("active");
                    _this.question=true;
                }
            });
            //取消支付
            $(".cancelPay").on('click',function(){
                _this.tapApply=0
            });
            //发送消息
            $(".sendInfo").on('click',function(){
                var msg=$("#msgInfo").val()
                if(_this.isSubscribe){//已报名
                    _this.sendInfo(msg);
                }else{
                    $(".popup .content").html("报名才能发言哦")
                    setTimeout(function(){$(".popup").addClass('visible')},500)
                    setTimeout(function(){$(".popup.visible")&&$(".popup.visible").removeClass('visible')},5000)
                }
            });
            // 选择线路
            $(".road .chooseImg").on("click",function(){
                _this.video.pause();
                $(".chooseImg.active")&&$(".chooseImg.active").removeClass("active")
                $(this).addClass("active");
                if($(this).next().hasClass("road1")){
                    $("#video").attr("src",_this.changeLines[0]);
                    _this.video.play();
                }else{
                    $("#video").attr("src",_this.changeLines[1]);
                    _this.video.play();
                }
            });
            $(".liveListTitle .findMore").on('click',function(){
                window.location.href='http://shouboke.tv/webChatPublic/qqRecommend.html'
            })
            // $(".readyListTitle .findMore").on('click',function(){
            //     window.location.href='http://shouboke.tv/webChatPublic/qqRecommend.html'
            // })
            // $(".overListTitle .findMore").on('click',function(){
            //     window.location.href='http://shouboke.tv/webChatPublic/playBack.html'
            // })
            //切换到举报
            $(".police").on('click',function(){
                if(_this.report.hasReport){
                    warn("您已经举报过该视频了")
                }else{
                    $("#reportBox").addClass('show')
                    $("#contentBox.show")&&$("#contentBox.show").removeClass('show')
                    _this.uploadImg()
                }
            })

            //举报相关事件
            $("#submitReport").click(function () {
                _this.reportBoxvaildInput();
            });
        }
    };
    $(function(){
        var url = location.href;
            FastClick.attach(document.body);
            // 第三方授权登录
            init_to();
            function init_to(){
                //获取信息
                var url = window.location.hash;
                var array1 = url.split("=");
                var streamId = array1[3];
                console.log('url',window.location.hash);
                console.log('streamid',streamId);
                var u = navigator.userAgent;
                var h=window.innerHeight,w=window.innerWidth;
                var isAndroid = u.indexOf('Android') > -1 || u.indexOf('Linux') > -1, //g
                    iPhone=u.indexOf('iPhone') > -1 || u.indexOf('Mac') > -1, //是否为iPhone或者QQHD浏览器
                    isiPad=u.indexOf('iPad') > -1,//是否iPad
                    isPhone6_6s=u.match(/mobile/i)!==null && u.match(/iphone/i)!==null && 375<w<667,
                    isPhoneSE=u.match(/mobile/i)!==null && u.match(/iphone/i)!==null && w>315&&w<370
                //暂时没有办法区分SE，5，5s,需要测试机型后更改(315<w<370)
                if(isAndroid){
                    platform='android';
                }else{
                    platform='ios';
                }
                var refresh=sessionStorage.getItem('refresh');
                if(refresh){
                    sessionStorage.setItem('refresh','');
                    setTimeout(function(){
                        location.reload();
                    },300)
                }
                var dataObj=sessionStorage.getItem('dataJsonSession')?JSON.parse(sessionStorage.getItem('dataJsonSession')):false
                if(dataObj&&dataObj.token){
                    try{
                        //更新streamId
                        var dataJson={
                            token:dataObj.token,
                            streamId:streamId,
                            type:dataObj.type,
                            unionid:dataObj.unionid,
                            openid:dataObj.openid,
                            nickname:dataObj.nickname,
                            userid:dataObj.userid,
                            apiToken:dataObj.apiToken
                        }
                        sessionStorage.setItem('dataJsonSession',JSON.stringify(dataJson))
                    }finally{
                        //iPhone不重新postCode,回退时会出现空白页，iPad、iphoneSE、安卓重新postCode回退会重新授权一次
                        if(isAndroid){
                            Page.init();
                        }else if(isiPad){
                            Page.init();
                        }else{
                            postCode()
                        }
                    }
                }else{
                    postCode()
                }
                var inputTextBox = document.getElementById("sendInfoBox");
                $("#msgInfo").on('focus',function(){//ios5s及部分机型输入框被弹起键盘遮住
                    if(!isPhone6_6s){
                        setTimeout(function(){
                            inputTextBox.scrollIntoView(false);
                        },200)
                    }
                })
            }
            $("#close img").click(
                function(){
                    var zz=document.getElementById('zz');
                    var all=document.getElementById('all');
                    all.style.display='none';
                    zz.style.display='none';
                    $('#videoBox')[0].appendChild($('#videoBox video')[0]);
                }

            )
            function randomString(len) {
                var $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
                var maxPos = $chars.length;
                var pwd = '';
                for (var i= 0; i < len; i++) {
                    pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
                }
                return pwd;
            }
            function postCode(){
            //获取信息
            var url = window.location.hash;
            console.log(url)
            var array1 = url.split("=");
            //var code = array1[1].substr(0,array1[1].indexOf('&state'));
            //var streamId = getQueryString('state');//获取streamId
            streamId =array1[3];
            if(!url){
                streamId=getQueryString('state');
            }
            console.log(streamId)
            var loginToken=getCookie('__qc__k');
            var nickName=randomString(6);//生成6位数的随机名字
            console.log('iflogin',QC.Login.check())
            if(QC.Login.check()){//判断是否已经获得授权
                QC.Login.getMe(function(openId, accessToken){
                    console.log('url',url);
                    qqOpenId=openId;
                    sessionStorage.setItem('qqOpenId',qqOpenId)
                    qqToken=accessToken;
                    $.ajax({
                        url: Page.commonUrl+'v4/user/getQQUnionId?qq_token='+qqToken,
                        type:'get',
                        success:function(data){
                            var unionid=data.unionid;
                            $.ajax({
                                url: Page.commonUrl+"/user/thirdpart",
                                type: "post",
                                data: {
                                    type: 'qq',
                                    openid:qqOpenId,
                                    platform:platform,
                                    unionid:unionid,
                                    nickname:nickName
                                },
                                success: function (data){
                                    for(var i=0;i<data.thirdpart.length;i++){
                                        if(data.thirdpart[i].type=="qq"){
                                            try{
                                                var dataJson={
                                                    token:data.token.token,
                                                    streamId:streamId,
                                                    type:data.thirdpart[i].type,
                                                    unionid:data.thirdpart[i].unionid,
                                                    openid:data.thirdpart[i].openid,
                                                    nickname:data.thirdpart[i].nickname,
                                                    userid:data.id,
                                                    apiToken:data.token.apiToken.value
                                                }
                                                dataJson=JSON.stringify(dataJson)
                                                sessionStorage.setItem('dataJsonSession',dataJson)
                                            }finally{
                                                Page.init();
                                            }
                                        }
                                    }
                                },
                                error: function (error) {
                                    //window.location.href=linkUrl
                                }
                            });
                        },
                        error:function(err){
                            console.log(err);
                        }
                    })
                });
            }else{
                window.location.href=Page.reloadUrl+streamId;
            }
            //针对未授权登录客户新增授权链接
            //var linkUrl=Page.linkBasicUrl+"scope=snsapi_userinfo&state="+streamId;
        }
    })

})(Zepto);