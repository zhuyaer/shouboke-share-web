/**
 * Created by laikanz on 16/11/18.
 */
(function($){
    var Page={
        Timer:null,
        commonUrl:"http://api-sbkt.lycam.tv/",
        href:encodeURIComponent(window.location.href),
        //固定路径
        addr:"http://shouboke.tv/shareModel/",
        //微信授权基本链接
        linkBasicUrl:"https://open.weixin.qq.com/connect/oauth2/authorize?"+
        "appid=wx18e63e75d50cb458&redirect_uri=http://shouboke.tv/shareModel/index.html&response_type=code&",
        //默认链接
        linkUrl:"https://open.weixin.qq.com/connect/oauth2/authorize?"+
        "appid=wx18e63e75d50cb458&redirect_uri=http://shouboke.tv/shareModel/index.html"+
        "&response_type=code&scope=snsapi_base&state=",
        video:document.getElementsByTagName("video")[0],
        loadComplete:false,//页面渲染程度
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

        init:function(){
            var _this=this;
            _this.getinitData={
                streamId:cookie.get("streamId1"),
                token:cookie.get("token3"),
                apiToken:cookie.get('apiToken')
            },
            _this.initwebChatShare();//分享初始配置
            _this.getVideoInfo();
            _this.bindEvent();
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
                    console.log("configdata",data)
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
            console.log(_this.getinitData.streamId)
            console.log(_this.getinitData.token)
            console.log(cookie.get('nickname'));
            $.ajax({
                url: _this.commonUrl+"stream/show",  //获取视频信息以及权限
                type:"get",
                data:{
                    type:'join',
                    streamId:_this.getinitData.streamId
                },
                headers:{
                    Authorization: "Bearer "+_this.getinitData.token
                },
                success:function (data) {
                    _this.wxShare(data)
                    console.log("stream/show",data)
                    _this.loadComplete=false;//渲染情况
                    if(data.isSubscribe){//报名成功
                        _this.showpass();//通过团队验证后才可加载以下函数
                        if(!_this.hotVideoList.onceGet){
                            _this.getHotDta()
                        }
                        _this.loadVideoInfo(data);
                        _this.getHistoryComment();
                        _this.connectMsg(data.chatChannel,data.chatUrl);
                    }else{
                        if(data.isPassword&&!_this.passCoursePsd){//密码课且未通过验证
                            $("#login_form").hide();
                            $("#passChecked").show();
                            _this.showpassLogin();
                        }else{
                            _this.showpass();//通过团队验证后才可加载以下函数
                            if(!_this.hotVideoList.onceGet){//未请求过
                                _this.getHotDta()
                            }
                            _this.loadVideoInfo(data);
                            _this.getHistoryComment();
                            _this.connectMsg(data.chatChannel,data.chatUrl);
                        }
                    }
                },
                error:function (error) {
                    _this.wxShare()
                    console.log("loadVideoError",error);
                    if(JSON.parse(error.responseText).error == "not_team_member"){//非团队成员
                        if(_this.hasClickLogin){//已经登陆过一次
                            _this.loadComplete=true;
                            _this.showNotpass();
                        }else{
                            //团队课权限校验
                            _this.teamIimit()
                        }
                    }else if(JSON.parse(error.responseText).error=="not_found"){
                        _this.loadComplete=true
                        _this.showNotpass();
                        $("#notgetAcross p").html("视频已删除")
                    }else{
                        _this.loadComplete=true
                        _this.showNotpass();
                        $("#notgetAcross p").html("视频暂时不支持观看");
                    }
                }
            });
        },

        getVideoInfoAgin:function(){
            var _this=this;
            $.ajax({
                url: _this.commonUrl+"stream/show",  //获取视频信息以及权限
                type:"get",
                data:{
                    streamId:_this.getinitData.streamId,
                    type:'join'
                },
                headers:{
                    Authorization: "Bearer "+_this.getinitData.token
                },
                success:function (data) {
                    _this.loadVideoInfo(data);
                    if(!_this.onConnectLine){//判断是否连接mqtt
                        _this.connectMsg(data.chatChannel,data.chatUrl);
                    }
                },
                error:function (error) {
                    console.log("loadVideoError",error);
                }
            });
        },

        //验证过程状态
        showpassLogin:function(){
            var _this=this;
            $(".ui-loading-block").hide();
            $("#getAcross").hide();
            $("#checking").show();
            $("#notgetAcross").hide()
            _this.loginEvent();
            _this.loginBtn();//验证input是否有值
            //$("input#passcheckedInput").focus();
            //$("input#phoneNum").focus();
        },

        showpass:function(){//通过验证但还未加载，所以$(".ui-loading-block")暂不隐藏
            var _this=this;
            $("#getAcross").show();
            $("#checking").hide();
            $("#notgetAcross").hide()
        },

        showNotpass:function(){
            $(".ui-loading-block").hide();
            $("#getAcross").hide();
            $("#checking").hide();
            $("#notgetAcross").show()
        },

        //存储token+streamId
        memory:function(){
            var _this=this;
            cookie.remove(['token3','streamId1']);
            cookie.set('token3', _this.getinitData.token, {expires: 2});
            cookie.set('streamId1', _this.getinitData.streamId,{expires: 2});
        },

        loginBtn:function(){
            var _this=this;
            var phoneNum = $("#phoneNum").val();
            var password = $("#password").val();
            if( phoneNum !== ""&&password !== ""){
                $("#login").removeClass("disabled");
                return _this.canLogin=true;
            }else{
                if(!$("#login").hasClass("disabled")){
                    $("#login").addClass("disabled");
                    return _this.canLogin=false;
                }
            }
        },

        //团队课验证权限
        teamIimit:function(){
            var _this=this;
            //私密课程,需要登录
            if (cookie.get('remPsd') == "true"){//记住密码7天默认登录
                console.log(cookie.get(['phoneNum','password']));
                $.ajax({
                    url:_this.commonUrl +'login',
                    data: {
                        username:cookie.get("phoneNum"),
                        password:cookie.get("password")
                    },
                    type: "post",
                    success: function (data){
                        console.log("loginSuccess",data);
                        cookie.remove(['userid']);
                        cookie.set('userid', data.id);
                        //重新登录替换token
                        _this.getinitData.token=data.token.token;
                        _this.memory();
                        _this.getVideoInfo();
                    },
                    error: function (error) {
                        //非团队成员
                        $("#login_form").show();
                        $("#passChecked").hide();
                        _this.showpassLogin();
                    }
                });
            }else{
                $("#login_form").show();
                $("#passChecked").hide();
                _this.showpassLogin();
            }
        },

        //微信各类转发分享配置
        wxShare:function(data){
            var _this=this;
            if(data){
                console.log('wxSharedata',data)
                var readyModel=data.user.displayName+'的['+data.title+'],将于'+data.startTime+'开讲!',
                    overModel='欢迎观看'+data.user.displayName+'的['+data.title+']!',
                    liveModel=data.user.displayName+'的['+data.title+']正在直播!';
                //信息完全的微信分享
                wx.ready(function(){
                    wx.onMenuShareTimeline({//朋友圈
                        title:data.status =="ready"?readyModel:data.status =="live"?liveModel:overModel , // 分享标题
                        link: _this.linkUrl+_this.getinitData.streamId+"#wechat_redirect", // 分享链接
                        imgUrl: data.thumbnailUrl, // 分享图标
                        success: function () {
                            //alert("分享成功")
                            //// 用户确认分享后执行的回调函数
                            //$.tips({
                            //    content:'分享成功',
                            //    stayTime:2000,
                            //    type:"success"
                            //})
                            //_this.getVideoInfoAgin()
                        },
                        cancel: function(){
                            // 用户取消分享后执行的回调函数

                        }
                    });
                    wx.onMenuShareAppMessage({//分享到朋友
                        title: data.status == "ready"?readyModel:data.status == "live"?liveModel:overModel, // 分享标题
                        desc: data.description, // 分享描述
                        link: _this.linkUrl+_this.getinitData.streamId+'#wechat_redirect', // 分享链接
                        imgUrl: data.thumbnailUrl, // 分享图标
                        success: function () {
                            //alert("分享成功")
                            //// 用户确认分享后执行的回调函数
                            //$.tips({
                            //    content:'分享成功',
                            //    stayTime:2000,
                            //    type:"success"
                            //})
                            //_this.getVideoInfoAgin()
                        },
                        cancel: function () {
                            // 用户取消分享后执行的回调函数
                        }
                    });
                });
                wx.error(function(info){
                    console.log('err',info)
                });
            }else{
                //微信分享
                wx.ready(function(){
                    wx.onMenuShareTimeline({//朋友圈
                        title:"手播课", // 分享标题
                        link: _this.linkUrl+_this.getinitData.streamId+"#wechat_redirect", // 分享链接
                        imgUrl:_this.addr+"assets/img/logoIcon.png", // 分享图标
                        success: function () {
                            //_this.getVideoInfoAgin()
                        },
                        cancel: function () {
                            // 用户取消分享后执行的回调函数

                        }
                    });
                    wx.onMenuShareAppMessage({//分享到朋友
                        title: "手播课", // 分享标题
                        desc:"为痛苦和快乐的直播提供简单可靠的技术", // 分享描述
                        link: _this.linkUrl+_this.getinitData.streamId+'#wechat_redirect', // 分享链接
                        imgUrl:_this.addr+"assets/img/logoIcon.png", // 分享图标
                        success: function () {
                            //_this.getVideoInfoAgin()
                            //alert(1)
                        },
                        cancel: function () {
                            // 用户取消分享后执行的回调函数
                        }
                    });
                });
                wx.error(function(info){
                    console.log('err',info)
                });
            }


        },
        //加载视频信息
        loadVideoInfo:function(data){
            //iphone6s 不能在切换页面时收起弹框
            $("input:focus").blur();
            console.log('stream/show',data)
            var _this=this;
            $("title").html(data.title);
            $(".courseTitle").html(data.title);
            $(".startTime").html(data.startTime);
            $(".duration").html(data.duration);
            $(".introduceContent").html(data.description);
            $(".subscribeCount").html(data.subscribeCount+"人");

            _this.posterImg=data.thumbnailUrl
            if(data.isSubscribe){//已报名
                _this.isSubscribe=true;
                if(data.status == "over"){
                    $(".videoTab.active")&&$(".videoTab.active").removeClass("active");
                    $(".live_playBack").addClass("active")
                    $(".live_playBack #video").show()
                    $(".live_playBack .poster").hide()
                    $(".road").hide();
                    $("#video").attr("src",data.streamUrl);
                    $("#video").attr("poster",data.thumbnailUrl);
                    $("#video").get(0).onloadedmetadata=function(){
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
                    $("#video").attr("poster",data.thumbnailUrl);
                    $("#video").get(0).onloadedmetadata=function(){
                        _this.loaded();
                    };

                }else{
                    $(".videoTab.active")&&$(".videoTab.active").removeClass("active");
                    $(".readyV").addClass("active")
                    $(".readyposter").attr("src",data.thumbnailUrl);
                    $(".readyposter").get(0).onload=function(){
                        //ready 倒计时
                        _this.countDown(data.startTime);
                        _this.loaded();
                    }
                }
                $("#isSubscribe").hide();
            }else{//未报名
                if(data.status == "over"||data.status == "live"){
                    $(".videoTab.active")&&$(".videoTab.active").removeClass("active");
                    $(".live_playBack").addClass("active")
                    $(".live_playBack #video").hide()
                    $(".live_playBack .poster").show()
                    $(".road").hide();
                    $(".live_playBackPoster").attr("src",data.thumbnailUrl);
                    $(".live_playBackPoster").get(0).onload=function(){
                        _this.loaded();
                    }
                }else{
                    $(".videoTab.active")&&$(".videoTab.active").removeClass("active");
                    $(".readyV").addClass("active")
                    $(".readyposter").attr("src",data.thumbnailUrl);
                    $(".readyposter").get(0).onload=function(){
                        //ready 倒计时
                        _this.countDown(data.startTime);
                        _this.loaded();
                    }
                }
                if(!data.ifCharge){
                    _this.ifCharge=false;
                    $(".charge").html("免费")
                }else{
                    _this.ifCharge=true;
                    $(".charge").html(data.charge+"元")
                    $("#payMoney h4").html(data.title);
                    $("#payMoney .moneyCount").html(data.charge);
                    _this.postData={//报名支付所需参数
                        type:'subscribe',
                        streamId:data.streamId,
                        userid:cookie.get('userid'),
                        openid:cookie.get("openid"),
                        total_fee:parseInt(data.charge?data.charge*100:0)
                    }
                }
                $("#isSubscribe").show();
                setTimeout(function(){$(".popup").addClass('visible')},500)
                setTimeout(function(){$(".popup.visible")&&$(".popup.visible").removeClass('visible')},5000)
            }
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
                    streamId:_this.getinitData.streamId,
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
                userName : timestamp,
                password : _this.getinitData.apiToken
            });
            _this.onConnectLine=true
            //called when the client connects
            function onConnect() {
                // Once a connection has been made, make a subscription and send a message.
                console.log("onConnect:连接成功");
                client.subscribe(chatChannel);
            }
            // called when the client loses its connection
            function onConnectionLost(responseObject) {
                console.log("onConnect:连接失败");
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
                }
                $(".dialogue").html(_this.commentCount);
                $(".peopleCount").html(_this.audienceNum);
            }
        },
        clearpauseTip:function(){
            $("#videoBox .pauseTip")&&$("#videoBox .pauseTip").remove()
            $("#videoBox .pauseTipText")&&$("#videoBox .pauseTipText").remove()
        },

        //收费报名
        shoubokeCharge:function(){
            var _this=this;
            _this.tapApply=1
            if(_this.ifCharge){//需要收费
                $("#payMoney.ui-dialog").dialog("show");
            }else{
                _this.siGnSuccess();
                return;
            }
        },
        createOrder:function(){
            var _this=this;
            console.log('_this.postData',_this.postData)
            $.ajax({
                url: _this.commonUrl+'3/weixinpay/jsapi',
                data:_this.postData,
                headers:{
                    Authorization: "Bearer "+_this.getinitData.token
                },
                type:"post",
                success:function(data){
                    console.log("3/weixinpay/jsapi",data);
                    _this.pay(data)
                },
                error:function(error){
                    _this.tapApply=0
                    console.log("sendInfoError",error)
                    _this.warn("调起支付失败，请重试！");
                }

            });
        },
        pay:function(data){
            var that=this;
            if (typeof WeixinJSBridge == "undefined"){
                if( document.addEventListener ){
                    document.addEventListener('WeixinJSBridgeReady', that.onBridgeReady, false);
                }else if (document.attachEvent){
                    document.attachEvent('WeixinJSBridgeReady', that.onBridgeReady);
                    document.attachEvent('onWeixinJSBridgeReady', that.onBridgeReady);
                }
            }else{
                that.onBridgeReady(data)
            }
        },
        onBridgeReady:function(data){
            var _this=this;
            WeixinJSBridge.invoke(
                'getBrandWCPayRequest', {
                    "appId" :data.appId,     //公众号名称，由商户传入
                    "timeStamp":""+data.timeStamp,         //时间戳，自1970年以来的秒数
                    "nonceStr" :data.nonceStr, //随机串
                    "package":data.package,// 统一支付接口返回的prepay_id参数值，提交格式如：prepay_id=***）
                    "signType" :"MD5",         //微信签名方式：
                    "paySign":data.sign //微信签名
                },function(res){
                    //WeixinJSBridge.log(res.err_msg);
                    //for(var i in res){
                    //    alert(res[i])
                    //}
                    //alert(res.err_code +","+ res.err_desc +","+ res.err_msg);
                    if(res.err_msg == "get_brand_wcpay_request:ok" ) {
                        //需要付费的课程支付成功后不用调用报名接口
                        _this.completePay=true;
                        var el=$.tips({
                            content:'报名成功',
                            stayTime:2000,
                            type:"success"
                        });
                        el.on("tips:hide",function(){
                            _this.getVideoInfoAgin()
                            //$(".apply").addClass("active").html("已报名");
                        })
                    }     // 使用以上方式判断前端返回,微信团队郑重提示：res.err_msg将在用户支付成功后返回ok。
                    else if(res.err_msg == 'get_brand_wcpay_request:cancel'){
                        _this.tapApply=0;
                        _this.warn("您已取消支付！")
                    }else{
                        _this.tapApply=0;
                        _this.warn("支付失败！")
                    }
                }
            );
        },
        //报名成功
        siGnSuccess:function(){
            var _this=this;
            var postData;
            if(_this.psdCourse){
                postData={streamId:_this.getinitData.streamId,password:_this.psdCourse}
            }else{
                postData={streamId:_this.getinitData.streamId}
            }
            $.ajax({
                type:'POST',
                url:_this.commonUrl+'stream/subscribe',
                data:postData,
                headers:{
                    Authorization: "Bearer "+_this.getinitData.token
                },
                success:function(data){
                    console.log('data',data)
                    if(data.success){
                        var el=$.tips({
                            content:'报名成功',
                            stayTime:2000,
                            type:"success"
                        });
                        el.on("tips:hide",function(){
                            _this.getVideoInfoAgin()
                            //$(".apply").addClass("active").html("已报名");
                        })
                    }
                },
                error:function(error){
                    //alert(error)
                    _this.tapApply=0
                    console.log('stream/subscribe',error)
                    var el=$.tips({
                        content:'报名失败',
                        stayTime:3000,
                        type:"warn"
                    });
                }
            })

        },
        getHotDta:function(){
            var _this=this;

            var readyurl=_this.commonUrl+'stream/popular?status=ready&page='+_this.hotVideoList.readyPage+'&length='+_this.hotVideoList.readyperPageCount+'&keyword='+(_this.forData?_this.forData:"");
            var overurl=_this.commonUrl+'stream/popular?status=over&page='+_this.hotVideoList.overPage+'&length='+_this.hotVideoList.overperPageCount+'&keyword='+(_this.forData?_this.forData:"");
            var liveurl=_this.commonUrl+'stream/popular?status=live&page='+_this.hotVideoList.livePage+'&length='+_this.hotVideoList.liveperPageCount+'&keyword='+(_this.forData?_this.forData:"");
            //－－－－－－－－－－－－－－－－－－－－－－精彩预告
            $.ajax({
                type:'GET',
                url:readyurl,
                success:function(data){
                    console.log("readydata",data)
                    _this.hotVideoList.onceGet=true;
                    var count=data.count
                    var data=data.data;
                    if(data.length==0){
                        $('.readyListTitle').remove();
                        $('.hotreadyList').remove()
                    }else{
                        var opt='';
                        for(var i=0;i<data.length;i++){
                            opt+='<li>'+
                            '<div class="test-img"><a href="'+_this.linkUrl+data[i].streamId+'#wechat_redirect"><img src="'+data[i].thumbnailUrl+'"/></a></div>'+
                            '<p class="videoTitle">'+data[i].title+'</p>'+
                            '<p class="videoCourse_other">'+
                            '<span class="dialogueOther">'+data[i].chatMessageCount+'</span>'+
                            '<span class="peopleCountOther">'+data[i].watchedCount+'</span>'+
                            '</p>'+
                            '</li>'
                        }
                        $(".hotreadyList").html(opt);
                    }
                },
                error:function(error){
                    console.log("error",error)
                }
            });
            //－－－－－－－－－－－－－－－－－－－－－－热门回放
            $.ajax({
                type:'GET',
                url:overurl,
                success:function(data){
                    console.log("overdata",data)
                    var count=data.count
                    var data=data.data;
                    if(data.length==0){
                        $('.overListTitle').remove();
                        $('.hotoverList').remove()
                    }else{
                        var opt='';
                        for(var i=0;i<data.length;i++){
                            opt+='<li>'+
                            '<div class="test-img"><a href="'+_this.linkUrl+data[i].streamId+'#wechat_redirect"><img src="'+data[i].thumbnailUrl+'"/></a></div>'+
                            '<p class="videoTitle">'+data[i].title+'</p>'+
                            '<p class="videoCourse_other">'+
                            '<span class="dialogueOther">'+data[i].chatMessageCount+'</span>'+
                            '<span class="peopleCountOther">'+data[i].watchedCount+'</span>'+
                            '</p>'+
                            '</li>'
                        }
                        $(".hotoverList").html(opt);
                    }
                },
                error:function(error){
                    console.log("error",error)
                }
            });
            //－－－－－－－－－－－－－－－－－－－－－－热门直播
            $.ajax({
                type:'GET',
                url:liveurl,
                success:function(data){
                    console.log("livedata",data)
                    var count=data.count
                    var data=data.data;
                    if(data.length==0){
                        $('.liveListTitle').remove();
                        $('.hotliveList').remove()
                    }else{
                        var opt='';
                        for(var i=0;i<data.length;i++){
                            opt+='<li>'+
                            '<div class="test-img"><a href="'+_this.linkUrl+data[i].streamId+'#wechat_redirect"><img src="'+data[i].thumbnailUrl+'"/></a></div>'+
                            '<p class="videoTitle">'+data[i].title+'</p>'+
                            '<p class="videoCourse_other">'+
                            '<span class="dialogueOther">'+data[i].chatMessageCount+'</span>'+
                            '<span class="peopleCountOther">'+data[i].watchedCount+'</span>'+
                            '</p>'+
                            '</li>'
                        }
                        $(".hotliveList").html(opt);
                    }
                },
                error:function(error){
                    console.log("error",error)
                }
            });
        },

        loaded:function(){
            var _this=this;
            //$(".videoTab.active").css({"minHeight":($(window).width()*9/16)+"px"})
            var Height=$(window).height()-$("header").height()-$(".videoTab.active").height()-$(".ui-tab-nav").height();
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
                _this.warn("内容不能为空")
            }else{
                $(".nothingSay")&&$(".nothingSay").remove();
                $.ajax({
                    url: _this.commonUrl+'msg/push',
                    data:{
                        streamId: _this.getinitData.streamId,
                        content: msg,
                        type: postType
                    },
                    headers:{
                        Authorization: "Bearer "+_this.getinitData.token
                    },
                    type:"post",
                    success:function(data){
                        $("#msgInfo").val("")
                        console.log("sendInfoSuccessData",data);
                    },
                    error:function(error){
                        console.log("sendInfoError",error)
                        _this.warn("发送失败,请重试。");
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

        warn:function(content){
            $.tips({
                content:content,
                stayTime:3000,
                type:"warn"
            })
        },

        success:function(content){
            $.tips({
                content:content,
                stayTime:3000,
                type:"success"
            })
        },

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
                        Authorization: "Bearer " + _this.getinitData.token
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
                            _this.warn("验证码错误")
                        }
                    },
                    error: function(){
                        if(!$("#sureBind").hasClass("disabled")){
                            $("#sureBind").addClass("disabled")
                        }
                        _this.warn("验证码错误")
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
                        Authorization: "Bearer "+_this.getinitData.token
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
                        _this.warn("发送验证码失败")
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
                        Authorization: "Bearer "+_this.getinitData.token
                    },
                    data:{
                        type:cookie.get("type"),
                        unionid:cookie.get("unionid"),
                        openid:cookie.get("openid"),
                        nickname:cookie.get("nickname")
                    },
                    success:function(data){
                        _this.success("绑定成功")
                        cookie.remove(['token3','apiToken']);
                        cookie.set('token3',data.token.token,{expires: 2});//TOKEN有效期是两天
                        cookie.set('apiToken', data.token.apiToken.value);
                        _this.getinitData.token=data.token.token
                        _this.getinitData.apiToken=data.token.apiToken.value
                        $("#bindPhone.ui-dialog").dialog("hide");
                    },
                    error:function(error){
                        _this.warn(JSON.parse(error.responseText).error_output)
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
                            cookie.remove(['userid']);
                            cookie.set('userid', data.id);
                            _this.hasClickLogin=true;
                            if ($("#remPsd").is(':checked')){
                                cookie.set('remPsd', 'true', {expires: 7});
                                cookie.set('phoneNum', phoneNum, {expires: 7});
                                cookie.set('password', password, {expires: 7});
                            }else {
                                cookie.remove(['remPsd', 'phoneNum','password']);
                            }
                            console.log("loginSuccess",data);
                            //重新登录替换token
                            _this.getinitData.token=data.token.token
                            _this.memory();

                            //用户号码正确后还要验证是否是团队成员再提示绑定
                            $.ajax({
                                url: _this.commonUrl+"stream/show",  //获取视频信息以及权限
                                type:"get",
                                data:{
                                    streamId:_this.getinitData.streamId,
                                    type:'join'
                                },
                                headers:{
                                    Authorization: "Bearer "+_this.getinitData.token
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
                            _this.warn("用户名或密码错误");
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
                        streamId: _this.getinitData.streamId,
                        password:$("#passcheckedInput").val()
                    },
                    headers:{
                        Authorization: "Bearer "+_this.getinitData.token
                    },
                    type:"post",
                    success:function(data){
                        if(data.success){
                            _this.psdCourse=$("#passcheckedInput").val()
                            _this.success("密码验证成功")
                            _this.passCoursePsd=true
                            _this.getVideoInfo();
                        }else{
                            _this.warn("课程密码错误")
                        }
                    },
                    error:function(error){
                        _this.warn("课程密码错误")
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
                        //_this.warn("请先报名")
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
                    window.location.href='http://shouboke.tv/webChatPublic/live.html'
                })
                $(".readyListTitle .findMore").on('click',function(){
                    window.location.href='http://shouboke.tv/webChatPublic/notice.html'
                })
                $(".overListTitle .findMore").on('click',function(){
                    window.location.href='http://shouboke.tv/webChatPublic/playBack.html'
                })
        },
        isWeiXin:function(){
            var ua = window.navigator.userAgent.toLowerCase();
            if(ua.match(/MicroMessenger/i) == 'micromessenger'){
                return true;
            }else{
                return false;
            }
        }
    };
    $(function(){
        FastClick.attach(document.body);
        // 第三方授权登录
        postCode();
        function postCode(){
            //获取信息
            var url = window.location.search;
            var array1 = url.split("=");
            var code = array1[1].substr(0,array1[1].indexOf('&state'));
            var streamId = array1[2];
            //针对未授权登录客户新增授权链接
            var linkUrl=Page.linkBasicUrl+"scope=snsapi_userinfo&state="+streamId
            var u = navigator.userAgent;
            var h=window.innerHeight,w=window.innerWidth;
            //iPhone不重新postCode,回退时会出现空白页，iPad、iPhone6Plus、iphoneSE、安卓重新postCode回退会重新授权一次
            var isAndroid = u.indexOf('Android') > -1 || u.indexOf('Linux') > -1, //g
                iPhone=u.indexOf('iPhone') > -1 || u.indexOf('Mac') > -1, //是否为iPhone或者QQHD浏览器
                isiPad=u.indexOf('iPad') > -1,//是否iPad
                isPhone6p=u.match(/mobile/i)!==null && u.match(/iphone/i)!==null && ( h>w ? (Math.abs(w-414)<10 && h<=736) : (Math.abs(w-736)<10) && h<=414),
                isPhoneSE=u.match(/mobile/i)!==null && u.match(/iphone/i)!==null && (315<w<370)//暂时没有办法区分SE，5，5s,需要测试机型后更改
            //if(isAndroid&&cookie.get('token3')){
            //    cookie.remove(['streamId1'])
            //    cookie.set('streamId1', streamId);
            //    Page.init();
            //}else if(isiPad&&cookie.get('token3')){
            //    cookie.remove(['streamId1'])
            //    cookie.set('streamId1', streamId);
            //    Page.init();
            //}else if(isPhone6p&&cookie.get('token3')){
            //    cookie.remove(['streamId1'])
            //    cookie.set('streamId1', streamId);
            //    Page.init();
            //}else if(isPhoneSE&&cookie.get('token3')){
            //    cookie.remove(['streamId1'])
            //    cookie.set('streamId1',streamId);
            //    Page.init();
            //}
            //else{
            //
            //}
            $.ajax({
                url: Page.commonUrl+"wechat/wechatLogin",
                type: "post",
                data: {
                    code: code
                },
                success: function (data){
                    try{
                        console.log('loginIndata',data)
                        //存储微信参数信息，用于绑定手机   platform 待定
                        cookie.remove(['token3','streamId1','type','unionid','openid','nickname','userid','apiToken']);
                        cookie.set('token3',data.token.token,{expires: 2});//TOKEN有效期是两天
                        cookie.set('streamId1',streamId);
                        cookie.set('type',data.thirdpart[0].type);
                        cookie.set('unionid',data.thirdpart[0].unionid);
                        cookie.set('openid',data.thirdpart[0].openid);
                        cookie.set('nickname',data.thirdpart[0].nickname);
                        cookie.set('userid',data.id);
                        cookie.set('apiToken',data.token.apiToken.value);
                    }finally{
                        Page.init();
                    }
                },
                error: function (error) {
                    if(cookie.get('onceauth')){
                        console.log("loginError",error);
                        $(".ui-loading-block.show")&&$(".ui-loading-block.show").removeClass('show')
                        alert('加载出错了')
                    }else{
                        window.location.href=linkUrl
                        cookie.set('onceauth',true,{expires: 1});
                    }
                }
            });
        }

        //ios5s及部分机型输入框被弹起键盘遮住
        var inputTextBox = $("#sendInfoBox").get(0);
        setInterval(function(){
            inputTextBox.scrollIntoView(false);
        },200)
        //华为手机键盘被遮住在视频下层
        var timer, windowInnerHeight;
        function eventCheck(e) {
            if (e) { //blur,focus事件触发的
                if (e.type == 'click') {//如果是点击事件启动计时器监控是否点击了键盘上的隐藏键盘按钮，没有点击这个按钮的事件可用，keydown中也获取不到keyCode值
                    setTimeout(function () {//由于键盘弹出是有动画效果的，要获取完全弹出的窗口高度，使用了计时器
                        windowInnerHeight = window.innerHeight;//获取弹出android软键盘后的窗口高度
                        timer = setInterval(function () { eventCheck() }, 100);
                    }, 500);
                }
                else clearInterval(timer);
            }
            else { //计时器执行的，需要判断窗口可视高度，如果改变说明android键盘隐藏了
                if (window.innerHeight > windowInnerHeight) {
                    clearInterval(timer);
                }
            }
        }
        $('#sendInfoBox').click(eventCheck).blur(eventCheck);
    })

})(Zepto);