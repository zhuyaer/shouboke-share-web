/**
 * Created by laikanz on 16/11/18.
 */
(function($){
    var Page={
        Timer:null,
        href:encodeURIComponent(window.location.href),
        /******************生产环境配置START***************/
     commonUrl:"http://sbkt-port-1178495353.cn-north-1.elb.amazonaws.com.cn/",
           //commonUrl:'http://api-sbkt.lycam.tv/',
        //固定路径
     addr:"http://shouboke.tv/weChat_web_develop/",
           //addr:"http://shouboke.tv/shareModel/",
     //shareLink:"http://shouboke.tv/shareModel/transfer.html?streamId=",
     shareLink:"http://shouboke.tv/weChat_web_develop/transfer.html?streamId=",
        //微信授权基本链接
     linkBasicUrl:"https://open.weixin.qq.com/connect/oauth2/authorize?"+
     "appid=wx18e63e75d50cb458&redirect_uri=http://shouboke.tv/weChat_web_develop/index.html&response_type=code&",
           //linkBasicUrl:"https://open.weixin.qq.com/connect/oauth2/authorize?"+
           //"appid=wx18e63e75d50cb458&redirect_uri=http://shouboke.tv/shareModel/index.html&response_type=code&",
//        默认链接
     linkUrl:"https://open.weixin.qq.com/connect/oauth2/authorize?"+
     "appid=wx18e63e75d50cb458&redirect_uri=http://shouboke.tv/weChat_web_develop/index.html"+
     "&response_type=code&scope=snsapi_base&state=",
           //linkUrl:"https://open.weixin.qq.com/connect/oauth2/authorize?"+
  //"appid=wx18e63e75d50cb458&redirect_uri=http://shouboke.tv/shareModel/index.html"+
  //         "&response_type=code&scope=snsapi_base&state=",
     wxPayUrl:'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx18e63e75d50cb458&redirect_uri=http://shouboke.tv%2fweChat_web_develop%2fclass%2fhtml%2fpayInformation.html&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect',
           //wxPayUrl:'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx18e63e75d50cb458&redirect_uri=http://shouboke.tv%2fclass%2fhtml%2fpayInformation.html&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect',
        /******************生产环境配置END***************/
     listUrl:'http://shouboke.tv/webChatPublic/developWxRecommend.html',
           //listUrl:'http://shouboke.tv/webChatPublic/wxRecommend.html',
        bindUrl:"http://shouboke.tv/weChat_web_develop/class/html/bindPhone.html",
        //bindUrl:"http://shouboke.tv/class/html/bindPhone.html",
        video:document.getElementsByTagName("video")[0],
        loadComplete:false,//页面渲染程度
        onceConnect:false,
        unpublish:true,//避免重复接收mqtt下发的消息
        publish:true,
        pause:true,
        postData:{},
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
        // 邀请卡相关
        cardId:getQueryString('cardId')||sessionStorage.getItem('cardId'),
        distributor:sessionStorage.getItem('distributor'),
        /*举报相关*/
        report:{
            reason:'',
            reportContact:'',
            hasReport:false,
            picUploadImg:""
        },
        init:function(){
            var _this=this;
            sessionStorage.setItem('memoryUrl',location.href);
            // _this.report();
            _this.dataObj=JSON.parse(localStorage.getItem('dataJsonSession'))
            _this.getVideoInfo();
            _this.initwebChatShare();//分享初始配置
            _this.bindEvent();
            _this.getTicket();
            // _this.ifSubscribe();
            //从进入5秒后还未正常加载（loadedmeatadata）
            var refresh=sessionStorage.getItem('refresh');
            if(refresh){
                sessionStorage.setItem('refresh','');
                setTimeout(function(){
                    location.reload();
                },300)
            }
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
            var token=localStorage.getItem('token');
            if(!token){
                token=_this.dataObj.token;
            }
            $.ajax({
                url: _this.commonUrl+"stream/show?streamId="+_this.dataObj.streamId+"&type=join",  //获取视频信息以及权限
                type:"get",
                headers:{
                    Authorization: "Bearer "+token
                },
                success:function (data) {
                    sessionStorage.setItem('redirectUrl',window.location.href);
                    sessionStorage.setItem('category',data.category)
                    _this.wxShare(data)
                    console.log("stream/show",data)
                    _this.loadComplete=false;//渲染情况
                    sessionStorage.setItem('_userId',data.user.id);
                    if(data.isSubscribe){//报名成功
                        _this.showpass();//通过团队验证后才可加载以下函数
                        if(!_this.hotVideoList.onceGet){
                            _this.getHotDta()
                        }
                        _this.loadVideoInfo(data);
                        _this.getHistoryComment();
                        if(!data.chatUrl==""){
                            _this.onceConnect=true;
                            _this.connectMsg(data.chatChannel,data.chatUrl);
                        }
                    }else{
                        var cardId=getQueryString('cardId')||sessionStorage.getItem('cardId');
                        if(cardId&&cardId!='null'){
                            getCard(data);
                        }
                        if(data.isPassword&&!_this.passCoursePsd){//密码课且未通过验证
                            _this.cardClose();
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
                            if(!data.chatUrl==""){
                                _this.onceConnect=true;
                                _this.connectMsg(data.chatChannel,data.chatUrl);
                            }
                        }
                    }
                },
                error:function (error) {
                    // alert(_this.cardClose)
                    _this.cardClose();
                    _this.wxShare();
                    // alert(JSON.parse(error.responseText).error)
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
                    }else if(JSON.parse(error.responseText).error=='invalid_credentials'){
                        _this.postCode();
                    }else{
                        _this.loadComplete=true
                        _this.showNotpass();
                        $("#notgetAcross p").html("视频暂时不支持观看");
                    }
                }
            });
        },

        cardClose:function (){
            $('#zz')[0].style.display='none';
            $('#card')[0].style.display='none';
        },

        getTicket:function(){
            var _this=this;
            $.ajax({
                url: _this.commonUrl+"wechat/getWeChatTicket",
                type:"post",
                data:{streamId:_this.dataObj.streamId,nickname:_this.dataObj.nickname},
                headers:{
                    Authorization: "Bearer "+_this.dataObj.token
                },
                success:function (data) {
                    var qrImgUrl='https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket='+data.ticket;
                    $('#qrDialog>img').attr('src',qrImgUrl);
                },
                error:function (error) {
                    console.log("getTicketError",error);
                }
            });
        },
        getVideoInfoAgin:function(){
            var _this=this;
            $.ajax({
                url: _this.commonUrl+"stream/show?streamId="+_this.dataObj.streamId+"&type=join",  //获取视频信息以及权限
                type:"get",
                headers:{
                    Authorization: "Bearer "+_this.dataObj.token
                },
                success:function (data) {
                    _this.loadVideoInfo(data);
                    if(!_this.onceConnect){
                        _this.onceConnect=true;
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
                localStorage.setItem('dataJsonSession',dataJson)
            }finally{
                _this.dataObj=JSON.parse(localStorage.getItem('dataJsonSession'))
            }
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
            var cardInfo=JSON.parse(sessionStorage.getItem('cardInfo'))
            // alert(localStorage.getItem('remPsd'))
            //私密课程,需要登录
            if (localStorage.getItem('remPsd') == "true"){//记住密码
                $.ajax({
                    url:_this.commonUrl +'login',
                    data: {
                        username:localStorage.getItem("phoneNum"),
                        password:localStorage.getItem("password")
                    },
                    type: "post",
                    success: function (data){
                        uPhone=data.phone;
                        sessionStorage.setItem('phoneFlag',uPhone);
                        console.log("loginSuccess",data);
                        _this.memory(data);
                        if(cardInfo&&!cardInfo.has){
                            showCard();
                        }
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
                // alert('teamshow')
                $("#login_form").show();
                $("#passChecked").hide();
                _this.showpassLogin();
            }
        },

        //微信各类转发分享配置
        wxShare:function(data){
            var _this=this;
            var link=_this.shareLink+_this.dataObj.streamId;
            if(_this.distributor){
                link=_this.shareLink+_this.dataObj.streamId+'&distributor='+_this.distributor;
            }
            if(data){
                var readyModel=data.user.displayName+'的['+data.title+'],将于'+data.startTime+'开讲!',
                    overModel='欢迎观看'+data.user.displayName+'的['+data.title+']!',
                    liveModel=data.user.displayName+'的['+data.title+']正在直播!';
                var shareData={//分享到朋友
                        title: data.status == "ready"?readyModel:data.status == "live"?liveModel:overModel, // 分享标题
                        desc: '分享真知，成长智慧，改变人生', // 分享描述
                        link: link, // 分享链接，默认分享当前页，目前微信分享不支持https格式的链接
                        imgUrl: data.thumbnailUrl, // 分享图标
                        success: function () {

                        },
                        cancel: function () {
                            // 用户取消分享后执行的回调函数
                        }
                    }

                //信息完全的微信分享
                wx.ready(function(){
                    wx.onMenuShareTimeline(shareData);
                    wx.onMenuShareAppMessage(shareData);
                    wx.onMenuShareQQ(shareData);
                    wx.onMenuShareQZone(shareData);
                    wx.error(function(info){
                        console.log('err',info)
                    });
                });
            }else{
                //微信分享
                wx.ready(function(){
                    wx.onMenuShareTimeline({//朋友圈
                        title:"手播课", // 分享标题
                        link: link, // 分享链接
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
                        link: link, // 分享链接
                        imgUrl:_this.addr+"assets/img/logoIcon.png", // 分享图标
                        success: function () {

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
            var _this=this;
            var newBind=sessionStorage.getItem('newBind');//新绑定用户标识
            var freeNewBind=sessionStorage.getItem('freeNewBind');//免费课程新用户绑定标识
            if(newBind){
                $('#downTips').show();
                $('#zz').show();
            }
            //if(freeNewBind&&!data.isSubscribe){//免费课程，未绑定用户绑定之后，更换了TOKEN，再次调用接口报名
            //    _this.freeSign();
            //}
            sessionStorage.setItem('newBind','');//取消标识
            sessionStorage.setItem('freeNewBind','');
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

            _this.posterImg=data.thumbnailUrl
            if(data.isSubscribe){//已报名
                _this.isSubscribe=true;
                if(data.status == "over"||data.status == "upload"){
                    $(".videoTab.active")&&$(".videoTab.active").removeClass("active");
                    $(".live_playBack").addClass("active")
                    $(".live_playBack #video").show()
                    $(".live_playBack .poster").hide()
                    $(".road").hide();
                    $("#video").attr("src",data.streamUrl);
                    $("#video").attr("poster",data.thumbnailUrl);
                    $("#video").get(0).onloadedmetadata=function(){
                        //_this.video.play()
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
                        //_this.video.play()
                        _this.loaded();
                    };

                }else{
                    $(".police").hide()
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
                    $(".police").hide()
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
                    var cardInfo=JSON.parse(sessionStorage.getItem('cardInfo'));
                    console.log(cardInfo);
                    if(cardInfo){
                        $("#original").html(cardInfo.stream.charge+"元");
                    }

                    if(cardInfo&&!cardInfo.has&&cardInfo.status!='expired'&&cardInfo.discount){
                        $(".charge").html(cardInfo.price+"元");
                    }else{
                        $(".charge").html(data.charge+"元");
                    }
                    $("#payMoney h4").html(data.title);
                    $("#payMoney .moneyCount").html(data.charge);
                    _this.postData={//报名支付所需参数
                        type:'subscribe',
                        streamId:data.streamId,
                        userid:_this.dataObj.userid,
                        openid:_this.dataObj.openid,
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

        //点击报名按钮
        shoubokeCharge:function(){
            var _this=this;
            _this.tapApply=1;
            var phoneFlag=sessionStorage.getItem('phoneFlag');
            if(_this.ifCharge){//收费课
                if(cardData.discount!=100||cardData.status=='expired'){ //优惠券折扣不为100%
                    location.href=_this.wxPayUrl;
                }else{//优惠券折扣为100%
                    if(phoneFlag){
                        _this.freeSign();
                    }else{
                        $('#describe').html('绑定手机号即可使用优惠券');
                        $('#bindDialog').dialog("show");
                    }
                }
            }else{//免费课
                _this.freeSign();
            }
        },
        freeSign:function(){
            var _this=this;
            var cardInfo=JSON.parse(sessionStorage.getItem('cardInfo'));
            var cardId=sessionStorage.getItem('cardId');
            var token=localStorage.getItem('token');
            if(cardInfo&&cardInfo.discount==100){
                if(_this.psdCourse){
                    _this.postData={streamId:_this.dataObj.streamId,password:_this.psdCourse,cardId:_this.cardId}
                }else{
                    _this.postData={streamId:_this.dataObj.streamId,cardId:_this.cardId
                    }
                }
                if(!cardInfo.has){
                    $.ajax({//获取token
                        url:_this.commonUrl+'/v4/card/customer/create',
                        data:{cardId:cardId},
                        dataType:'json',//服务器返回json格式数据
                        type:'post',//HTTP请求类型
                        timeout:10000,//超时时间设置为10秒；
                        headers:{Authorization: 'Bearer '+token},
                        success:function(data){
                            _this.freeSubscribe();
                        },
                        error:function(xhr,type,errorThrown){                                //异常处理；
                        }
                    })
                }
            }else{
                if(_this.psdCourse){
                    _this.postData={streamId:_this.dataObj.streamId,password:_this.psdCourse}
                }else{
                    _this.postData={streamId:_this.dataObj.streamId}
                }
                _this.freeSubscribe();
            }
        },
        freeSubscribe:function(){//调用免费报名接口
            var _this=this;
            var cardId=sessionStorage.getItem('cardId');
            var token=localStorage.getItem('token');
            $.ajax({
                type:'POST',
                url:_this.commonUrl+'stream/subscribe',
                data:_this.postData,
                headers:{
                    Authorization: "Bearer "+token
                },
                success:function(data){
                    if(cardId&&cardId!='null'){
                        _this.cardClose();
                    }
                    if(data.success){
                        _this.ifSubscribe();
                        var el=$.tips({
                            content:'报名成功',
                            stayTime:2000,
                            type:"success"
                        });
                        el.on("tips:hide",function(){
                            _this.getVideoInfoAgin();
                            $(".apply").addClass("active").html("已报名");
                        })
                    }
                },
                error:function(error){
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
        createOrder:function(){
            var _this=this;
            console.log('_this.postData',_this.postData)
            $.ajax({
                url: _this.commonUrl+'3/weixinpay/jsapi',
                data:_this.postData,
                headers:{
                    Authorization: "Bearer "+_this.dataObj.token
                },
                type:"post",
                success:function(data){
                    console.log("3/weixinpay/jsapi",data);
                    _this.pay(data)
                },
                error:function(error){
                    _this.tapApply=0
                    console.log("sendInfoError",error)
                    warn("调起支付失败，请重试！");
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
                        warn("您已取消支付！")
                    }else{
                        _this.tapApply=0;
                        warn("支付失败！")
                    }
                }
            );
        },

        createCard:function (){
            var _this=this;
            var token=localStorage.getItem('token');
            var cardId=sessionStorage.getItem('cardId');

        },
        //报名前的操作，构造数据，如果是收费课百分百优惠则需要先调用创建卡券接口
        siGnSuccess:function(){
            var cardInfo=JSON.parse(sessionStorage.getItem('cardInfo'));
            var _this=this;
            if(_this.psdCourse){
                if(cardData.discount==100){
                    if(!cardInfo.has){
                        _this.createCard();
                    }
                    _this.postData={streamId:_this.dataObj.streamId,password:_this.psdCourse,cardId:_this.cardId}
                }else{
                    _this.postData={streamId:_this.dataObj.streamId,password:_this.psdCourse}
                }
            }else{
                if(cardData.discount==100){
                    if(!cardInfo.has){
                        _this.createCard();
                    }
                    _this.postData={streamId:_this.dataObj.streamId,cardId:_this.cardId}
                }else{
                    _this.postData={streamId:_this.dataObj.streamId}
                }
            }

        },
        report:function(){//报名后弹出二维码供用户扫描
            var height=document.documentElement.clientHeight+'px';
            var zz=document.getElementById('zz');
            var all=document.getElementById('all');
            all.style.display='block';
            zz.style.display='block'
            zz.style.height=height;
            // document.getElementsByTagName("video")[0].style.display='none';
            $('video').hide();
            // $('#videoBox video').remove();

        },
        hasSubscribe:function(){//已经关注，向服务器发送消息
            var _this=this;
            $.ajax({
                type:'post',
                url:_this.commonUrl+'/v4/wechat/getStreamTipMsg',
                data:{
                    openId:_this.dataObj.openid,
                    nickname:_this.dataObj.nickname,
                    streamId:_this.dataObj.streamId
                },
                headers:{
                    Authorization: "Bearer "+_this.dataObj.token
                },
                success:function(data){
                },
                error:function(error){

                }
            })

        },
        ifSubscribe:function(){//判断用户是否已经关注咱家公众号
            var _this=this;
            $.ajax({
                type:'get',
                url:_this.commonUrl+'v4/wechat/isSubscribe',
                data:{
                    openId:_this.dataObj.openid
                },
                headers:{
                    Authorization: "Bearer "+_this.dataObj.token
                },
                success:function(data){
                        if(!data){
                            _this.report();
                        }else{
                            _this.hasSubscribe();
                        }
                },
                error:function(error){

                }
            })
        },
        getHotDta:function(){
            var _this=this;
            var category=sessionStorage.getItem('category');
            var _userId=sessionStorage.getItem('_userId');
            var liveurl=_this.commonUrl+'/v4/stream/relatedStreams?page='+_this.hotVideoList.livePage+'&resultsPerPage='+_this.hotVideoList.liveperPageCount+'&userid='+_userId+'&category='+category;
            $.ajax({
                type:'GET',
                url:liveurl,
                headers: {
                    Authorization: "Bearer " + _this.dataObj.token
                },
                success:function(data){
                    console.log("livedata",data)
                    var count=data.count
                    // var data=data.data;
                    if(data.items.length==0){
                        $('.liveListTitle').remove();
                        $('.hotliveList').remove()
                    }else{
                        var opt='';
                        for(var i=0;i<data.items.length;i++){
                            opt+='<li>'+
                            '<div class="test-img"><a href="'+_this.linkUrl+data.items[i].streamId+'#wechat_redirect"><img src="'+data.items[i].thumbnailUrl+'"/></a></div>'+
                            '<p class="videoTitle">'+data.items[i].title+'</p>'+
                            '<p class="videoCourse_other">'+
                            '<span class="dialogueOther">'+data.items[i].chatMessageCount+'</span>'+
                            '<span class="peopleCountOther">'+data.items[i].watchedCount+'</span>'+
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
                var phoneType = judgePhoneType();
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
        reportBoxvaildInput:function(){
            var _this=this,$ckeckInput=$("input[type='checkbox']:checked");
            var phonereg = /^(((13[0-9]{1})|(15[0-9]{1})|(18[0-9]{1}))+\d{8})$/;

            var reasons=[];
            if($ckeckInput.length==0){
                warn('至少选择一个举报原因')
            }else if(!phonereg.test($(".telphone").val())){
                warn('请正确输入手机号')
            }else if(!$(".imgBox").hasClass('hasImg')){
                warn('请留下证据截图')
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
                    success("举报成功");
                    _this.report.hasReport=true;
                    setTimeout(function(){
                        //切换回去
                        $("#contentBox").addClass('show')
                        $("#reportBox.show")&&$("#reportBox.show").removeClass('show')
                    },3000)
                },
                error:function (error) {
                    warn(JSON.parse(error.responseText).error_output)
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
                            localStorage.setItem('dataJsonSession',dataJson)
                        }finally{
                            _this.dataObj=JSON.parse(localStorage.getItem('dataJsonSession'))
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
                                localStorage.setItem('dataJsonSession',dataJson)
                            }finally{
                                _this.dataObj=JSON.parse(localStorage.getItem('dataJsonSession'))
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
                var cardInfo=JSON.parse(sessionStorage.getItem('cardInfo'))
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
                            _this.passCoursePsd=true;
                            console.log(cardInfo)
                            if(cardInfo&&!cardInfo.has){
                                showCard();
                            }
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
                if( _this.tapApply==1){return;}else{_this.shoubokeCharge();}
            });
            //前去支付
            $("#webChatPay").on("click",function(){
                _this.createOrder()
            });

            $("#goOn").on('click',function(){
                _this.shoubokeCharge();
            })


            $("#buyNow").on('click',function(){//抢优惠券
                if(cardData.status=='over'){
                    $('#cardDialog').dialog("show");
                }else{
                    _this.shoubokeCharge();
                }
            })
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

            $("#download").on('click',function(){
                window.location.href='http://a.app.qq.com/o/simple.jsp?pkgname=tv.lycam.pclass';
            })

            $("#downClose").on('click',function(){
                $('#zz').hide();
                $('#downTips').hide();
            })
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
            //点击消息框判断用户是否绑定手机号
            $("#msgInfo").on('focus',function(){
                var phoneFlag=sessionStorage.getItem('phoneFlag');
                if(!phoneFlag) {
                    $('#bindDialog').dialog("show");
                    $("#msgInfo").blur();
                }
            });
            $("#bind").on('click',function(){
                window.location.href=_this.bindUrl;
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
                window.location.href=_this.listUrl;
            })
            // $(".readyListTitle .findMore").on('click',function(){
            //     window.location.href='http://shouboke.tv/webChatPublic/notice.html'
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
        // alert('init...')
        var url = location.href;
            FastClick.attach(document.body);
            // 第三方授权登录
            init_to();
            function init_to(){
                //获取信息
                var winHeight = $(window).height();
                $(window).resize(function(){
                    var thisHeight=$(this).height();
                    if(winHeight - thisHeight >100){
                        setTimeout(function(){
                            $('#contentBox').css('margin-top','-100px');
                            $('#contentBox').css('transition','margin 0.1s');
                        },200)

                    }else{
                        setTimeout(function(){
                            $('#contentBox').css('margin-top','0px');
                            $('#contentBox').css('transition','margin 0.1s');
                        },200)
                    }
                });
                var url = window.location.search;
                var array1 = url.split("=");
                var streamId = getQueryString('state');
                var u = navigator.userAgent;
                var h=window.innerHeight,w=window.innerWidth;
                var isAndroid = u.indexOf('Android') > -1 || u.indexOf('Linux') > -1, //g
                    iPhone=u.indexOf('iPhone') > -1 || u.indexOf('Mac') > -1, //是否为iPhone或者QQHD浏览器
                    isiPad=u.indexOf('iPad') > -1,//是否iPad
                    isPhone6_6s=u.match(/mobile/i)!==null && u.match(/iphone/i)!==null && 375<w<667,
                    isPhoneSE=u.match(/mobile/i)!==null && u.match(/iphone/i)!==null && w>315&&w<370
                //暂时没有办法区分SE，5，5s,需要测试机型后更改(315<w<370)
                var dataObj=localStorage.getItem('dataJsonSession')?JSON.parse(localStorage.getItem('dataJsonSession')):false
                console.log(dataObj.token)
                if(dataObj&&dataObj.token){
                    getUser(dataObj.token);
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
                        console.log(dataJson)
                        localStorage.setItem('dataJsonSession',JSON.stringify(dataJson))
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
                    _this.getVideoInfoAgin();
                }

            )
            Page.postCode=postCode;
            function getUser(token){
                $.ajax({
                    url: Page.commonUrl+'/user/show',
                    headers:{
                        Authorization: "Bearer "+token
                    },
                    success:function (data){
                        if(data.phone){
                            sessionStorage.setItem('phoneFlag',data.phone);
                        }else{
                            sessionStorage.setItem('phoneFlag','');
                        }
                    }
                })
            }
            function postCode(){
                //获取信息
                var url = window.location.search;
                var array1 = url.split("=");
                var code = array1[1].substr(0,array1[1].indexOf('&state'));
                var streamId =getQueryString('state');
                //针对未授权登录客户新增授权链接
                var linkUrl=Page.linkBasicUrl+"scope=snsapi_userinfo&state="+streamId
                $.ajax({
                    url: Page.commonUrl+"wechat/wechatLogin",
                    type: "post",
                    data: {
                        code: code
                    },
                    success: function (data){
                        sessionStorage.setItem('phoneFlag',data.phone);
                        var cardId=getQueryString('cardId')||sessionStorage.getItem('cardId');
                        if(cardId){
                            sessionStorage.setItem('cardId',cardId);
                        }
                        localStorage.setItem('token',data.token.token);
                        for(var i=0;i<data.thirdpart.length;i++){
                            if(data.thirdpart[i].type=="wx"){
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
                                    localStorage.setItem('dataJsonSession',dataJson)
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
            }
    })

})(Zepto);