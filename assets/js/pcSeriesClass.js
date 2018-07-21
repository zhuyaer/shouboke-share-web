/**
 * Created by laikanz on 16/11/18.
 */
(function($){
    var Page={
        Timer:null,
        href:encodeURIComponent(window.location.href),
        /******************生产环境配置START***************/
        commonUrl:"http://api-sbkt.lycam.tv/",
        //固定路径
        addr:"http://shouboke.tv/shareModel/",
        //微信授权基本链接
        linkBasicUrl:"https://open.weixin.qq.com/connect/oauth2/authorize?"+
        "appid=wx18e63e75d50cb458&redirect_uri=http://shouboke.tv/shareModel/index.html&response_type=code&",
        //默认链接
        linkUrl:"https://open.weixin.qq.com/connect/oauth2/authorize?"+
        "appid=wx18e63e75d50cb458&redirect_uri=http://shouboke.tv/shareModel/index.html"+
        "&response_type=code&scope=snsapi_base&state=",
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
            _this.getPublicIp();
            //从进入5秒后还未正常加载（loadedmeatadata）
            setTimeout(function(){
                if(!_this.loadComplete){
                    _this.loaded();
                }
            },5000)
        },

        getPublicIp:function(){
        $.ajax({//获取公网ip
            url:"https://api.ipify.org?format=jsonp&callback=?",
            dataType:'json',//服务器返回json格式数据
            type:'get',//HTTP请求类型
            timeout:10000,//超时时间设置为10秒；
            headers:{'Content-Type':'application/json'},                  
            success:function(data){
                spbill_create_ip=data.ip;
            },
            error:function(xhr,type,errorThrown){
            //异常处理；
                console.log(type);
            }
        });
        },
        //获取视频信息以及权限
        getVideoInfo:function(){
            var _this=this;
            var streamId=getQueryString('state');
            $.ajax({
                url: _this.commonUrl+"stream/show?streamId="+streamId+"&type=join",  //获取视频信息以及权限
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
            console.log('---',data.description)
            if(data.description){
                $(".introduceContent").html(data.description.httpHtml());
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
                _this.isSubscribe=true;
                console.log(data.status)
                if(data.status == "over"||data.status == "upload"){
                    $(".videoTab.active")&&$(".videoTab.active").removeClass("active");
                    $(".live_playBack").addClass("active")
                    $(".live_playBack #video").show()
                    $(".live_playBack .poster").hide()
                    $(".road").hide();
                    // $("#video source").attr("src",data.streamUrl);
                    // $("#video").attr("poster",data.thumbnailUrl);
                    // $("#video").get(0).onloadedmetadata=function(){
                    //     // _this.video.play()
                    //     _this.loaded();
                    // }
                    console.log('streamurl=',data.streamUrl)
                    _this.ckPlayer(data.streamUrl,'0');
                }else if(data.status == "live"){
                    $(".videoTab.active")&&$(".videoTab.active").removeClass("active");
                    $(".live_playBack").addClass("active")
                    $(".live_playBack #video").show()
                    $(".live_playBack .poster").hide()
                    _this.changeUrl(data.streamUrls);
                    $(".road").show();
                    // $("#video source").attr("src",_this.changeLines[0]);
                    // $("#video").attr("poster",data.thumbnailUrl);
                    // $("#video").get(0).onloadedmetadata=function(){
                    //     _this.loaded();
                    // };
                        // var player = videojs('video');
                        // player.play();
                    console.log('streamurl=',_this.changeLines[0])
                    _this.ckPlayer(_this.changeLines[0],'1');
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
            if(data.anchorStatus=="pause"){
                $("#videoBox").append("<div class='pauseTip'></div>")
                $(".pauseTip").css("backgroundImage","url("+_this.posterImg+")")
                $("#videoBox").append("<span class='pauseTipText'>主播暂时离开</span>")
            }
        },

        ckPlayer:function(videoUrl,ifLive){//调用ckPlayer
            console.log(videoUrl)
            var flashvars={
                f:'ckplayer/m3u8.swf',//视频地址
                a:videoUrl,//调用时的参数，只有当s>0的时候有效
                s:'4',//调用方式，0=普通方法（f=视频地址），1=网址形式,2=xml形式，3=swf形式(s>0时f=网址，配合a来完成对地址的组装)
                c:'0',//是否读取文本配置,0不是，1是
                x:'',//调用配置文件路径，只有在c=1时使用。默认为空调用的是ckplayer.xml
                i:'',//初始图片地址
                d:'',//暂停时播放的广告，swf/图片,多个用竖线隔开，图片要加链接地址，没有的时候留空就行
                u:'',//暂停时如果是图片的话，加个链接地址
                l:'',//前置广告，swf/图片/视频，多个用竖线隔开，图片和视频要加链接地址
                r:'',//前置广告的链接地址，多个用竖线隔开，没有的留空
                t:'',//视频开始前播放swf/图片时的时间，多个用竖线隔开
                y:'',//这里是使用网址形式调用广告地址时使用，前提是要设置l的值为空
                z:'',//缓冲广告，只能放一个，swf格式
                e:'8',//视频结束后的动作，0是调用js函数，1是循环播放，2是暂停播放并且不调用广告，3是调用视频推荐列表的插件，4是清除视频流并调用js功能和1差不多，5是暂停播放并且调用暂停广告
                v:'80',//默认音量，0-100之间
                p:'0',//视频默认0是暂停，1是播放，2是不加载视频
                h:'0',//播放http视频流时采用何种拖动方法，=0不使用任意拖动，=1是使用按关键帧，=2是按时间点，=3是自动判断按什么(如果视频格式是.mp4就按关键帧，.flv就按关键时间)，=4也是自动判断(只要包含字符mp4就按mp4来，只要包含字符flv就按flv来)
                q:'',//视频流拖动时参考函数，默认是start
                m:'',//让该参数为一个链接地址时，单击播放器将跳转到该地址
                o:'',//当p=2时，可以设置视频的时间，单位，秒
                w:'',//当p=2时，可以设置视频的总字节数
                g:'',//视频直接g秒开始播放
                j:'',//跳过片尾功能，j>0则从播放多少时间后跳到结束，<0则总总时间-该值的绝对值时跳到结束
                k:'',//提示点时间，如 30|60鼠标经过进度栏30秒，60秒会提示n指定的相应的文字
                n:'',//提示点文字，跟k配合使用，如 提示点1|提示点2
                wh:'',//宽高比，可以自己定义视频的宽高或宽高比如：wh:'4:3',或wh:'1080:720'
                lv:ifLive,//是否是直播流，=1则锁定进度栏
                loaded:'',//当播放器加载完成后发送该js函数loaded
                //调用播放器的所有参数列表结束
                //以下为自定义的播放器参数用来在插件里引用的
                my_title:'',
                my_url:encodeURIComponent(window.location.href)//本页面地址
                //调用自定义播放器参数结束
            };
            var params={bgcolor:'#FFF',allowFullScreen:true,allowScriptAccess:'always'};//这里定义播放器的其它参数如背景色（跟flashvars中的b不同），是否支持全屏，是否支持交互
            var video=['http://resource-s3.lycam.tv/apps/XPQKR06444/f4d46500-71bc-11e7-8077-e1bb77360d1a/streams/6971f3e0-72cc-11e7-8700-d543f9117187/hls/vod.m3u8'];
            CKobject.embed('ckplayer/ckplayer.swf','a1','ckplayer_a1','100%','100%',false,flashvars,video,params);
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

        createOrderBycode:function(){
            var _this=this;
            var streamId=getQueryString('state');
            $.ajax({
                url:_this.commonUrl+'/3/weixinpay/unifiedorder',
                type:'post',
                headers:{Authorization: 'Bearer '+_this.dataObj.token},
                data:{
                    type:'subscribe',
                    streamId:streamId,
                    body:streamTitle+'课程报名',
                    total_fee:streamCharge,
                    spbill_create_ip:spbill_create_ip,
                    trade_type:'NATIVE',
                },
                success:function(data){
                    var qrcode = new QRCode('qrcode', {
                        text: data.code_url,
                        width: 230,
                        height: 230,
                        colorDark : '#000000',
                        colorLight : '#ffffff',
                        correctLevel : QRCode.CorrectLevel.H
                    });
                    $("#payCode.ui-dialog").dialog("show");
                    _this.timer_weChat = setInterval(function () {
                        _this.weChatPayStatus(data.out_trade_no);
                    }, 3000);
                }
            })
        },
        weChatPayStatus:function (out_trade_no) {
            var _this=this;
            $.ajax({
                url: _this.commonUrl + '/3/weixinpay/orderquery',
                headers: {
                    Authorization: 'Bearer ' + _this.dataObj.token
                },
                type: 'post',
                dataType: 'json',
                data: {
                    out_trade_no: out_trade_no
                },
                success: function (data) {
                    console.log('weChatPayStatusSuccessData', data);
                    data.parse;
                    if (data.trade_state == 'SUCCESS') {
                        clearInterval(_this.timer_weChat);
                        location.reload();
                    }
                },
                error: function (error) {
                    console.log('weChatPayStatusError', error);
                }
            });
        },

        bindEvent:function(){
            var _this=this;
            // _this.video.addEventListener('ended', function (e) {
            //     _this.getVideoInfoAgin()
            // })
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
                _this.createOrderBycode();
            });
            $(".cancelPay").on("click",function(){
                $('#payMoney').removeClass('show');
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
                window.location.href='http://handsclass.lycam.tv/shareModel/pcRecommend.html'
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
        var url = location.href;
            FastClick.attach(document.body);
            // 第三方授权登录
            init_to();
            function init_to(){
                //获取信息
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
                            // postCode()
                            Page.init();
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
                    // $('#videoBox')[0].appendChild($('#videoBox video')[0]);
                    Page.getVideoInfoAgin();
                }

            )

            $('#msgInfo').focus(
                function(){
                    setTimeout(function(){
                        var pannel=$('#sendInfoBox')[0];
                        pannel.scrollIntoView(true);
                        $('#contentBox').scrollTop(100);
                    },200)
                }
            )

            function postCode(){
                //获取信息
                var url = window.location.search;
                var array1 = url.split("=");
                var code = getQueryString('code');
                var streamId = getQueryString('state');
                //针对未授权登录客户新增授权链接
                var linkUrl="http://shouboke.tv/weChat_web_develop/pcSeriesClass.html"+streamId
                $.ajax({
                    url: Page.commonUrl+"/user/login/wechat",
                    type: "post",
                    data: {
                        code: code
                    },
                    success: function (data){
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
                                    sessionStorage.setItem('dataJsonSession',dataJson)
                                }finally{
                                    Page.init();
                                }
                            }
                        }
                    },
                    error: function (error) {
                        // window.location.href=linkUrl
                    }
                });
            }
    })

})(Zepto);