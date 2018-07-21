/**
 * Created by laikanz on 17/3/30.
 */

$(function () {
    var _this={};
    _this.serverHttp="http://sbkt-port-1178495353.cn-north-1.elb.amazonaws.com.cn/";
    _this.dataObj=JSON.parse(sessionStorage.getItem('dataJsonSession'))
    _this.player = flowplayer($("#video"), {
        splash: true,
        ratio:0.4167,
        autoplay:true,
        autoBuffering: true, //自动缓冲
        adaptiveRatio: true,
        swf: 'http://handsclass.oss-cn-shenzhen.aliyuncs.com/assets/flowplayer/flowplayer.swf',
        swfHls: 'http://handsclass.oss-cn-shenzhen.aliyuncs.com/assets/flowplayer/flowplayerhls.swf',
        clip: {
            sources: [
                { type:"",
                    src:"" }
            ]
        }
    });
    console.log(_this.dataObj)
    var streamId = _this.dataObj.streamId;
    //视频引入
    loadVideo(streamId);
    getHistory()
    // 提问按钮切换
    $(".question").on("click",function () {
        $(".question").toggleClass("forbidden");
    });
//发送消息
    $("#sendMsg").click(function () {
        var comment = $("#comment").val();
        sendInfo(comment,streamId);
        $("#comment").val("");
    });
    $("#comment").keydown(function (e) {
        if(e.keyCode==13){  //按enter触发login事件
            // 处理事件
            var comment = $("#comment").val();
            sendInfo(comment,streamId);
            $("#comment").val("");
        }
    });


    //-----------------FUNCTION-----------------
    //get history comments
    function getHistory(){
        $.ajax({
            url:_this.serverHttp+'/stream/question',
            type:"get",
            data:{
                type:"all",
                streamId:streamId,
                page: "1",
                resultsPerPage:"150",
                order:"desc"  //降序
            },
            success:function(data){
                console.log("getCommentSuccess",data);
                var commentList = "";
                var length = data.items.length;
                _this.length = length;
                if(length>0){
//                    $("#saySomething").css("display","none");
                    $(".commentNum").html(_this.length);
                }
                for(var i=length-1;i>=0;i--){ //倒序显示
                    if(data.items[i].type == "message"){
                        commentList+='<div>'+
                        '<img src="'+data.items[i].user.avatarUrl+'" alt="headPic" />'+
                        '<span class="user"><span>'+data.items[i].user.displayName+'</span>: </span>'+
                        '<span>'+data.items[i].content+'</span>'+
                        '</div>';
                    }else{
                        commentList+='<div>'+
                        '<img src="'+data.items[i].user.avatarUrl+'" alt="headPic" />'+
                        '<span class="user"><span>'+data.items[i].user.displayName+'</span><span style="color: #005AA0">问: </span></span>'+
                        '<span style="color: #005AA0;font-size: large;">'+data.items[i].content+'</span>'+
                        '</div>';
                    }
                }
                $("#commentArea").append(commentList);
            },
            error:function(error){
                console.log("getCommentError",error);
            }
        });
    }
    //直播视频播放
    function loadVideo(streamId) {
        $.ajax({
            url: _this.serverHttp+'/stream/show',
            data: {
                streamId : streamId,
                type:'join'
            },
            headers:{
                Authorization: "Bearer "+_this.dataObj.token
            },
            type: "get",
            success: function (data){
                console.log("loadSingalVedioSuccessData",data);
                console.log("userId",data.user.id);
                $("#teacherName").html(data.user.displayName);
                perHotVideoList(data.user.id);
                var streamObj = data.streamUrls;
                //接收消息
                connectMsg(data.chatChannel,data.chatUrl);

                if(data.status=="over"){
                    $(streamObj).each(function(i,n){
                        if(n.type=="HLS"){//over
                            _this.player.load({
                                sources: [
//                                    { type: 'application/x-mpegurl', src: n.url }
                                    { type: 'application/x-mpegurl', src: data.streamUrl }
                                ]
                            });
                        }
                    });
                }else if(data.status=="live"){
                    $(streamObj).each(function(i,n){
                        if(n.type=="RTMP"){//live pc端优先播放rtmp
                            _this.player.load({
                                sources: [
                                    { type: 'video/flash', src: n.url }
                                ]
                            });
                        }
                    });
                }else{
                    alert("直播还没有开始呢");
                }
                $("#videoBox").css("display", "block");
            },
            error: function (err) {
//                    console.log("loadSingalVedioErrData",err);
            }
        });

    }
    function  sendInfo(msg,streamId){
        if(msg == ''){
            alert("内容不能为空,请输入内容再发送。")
        }else{
            if($(".question").hasClass("forbidden")){
                $.ajax({
                    url: _this.serverHttp+'/msg/push',
                    data:{
                        streamId: streamId,
                        content: msg,
                        type: "message"
                    },
                    headers:{
                        Authorization: "Bearer "+_this.dataObj.token
                    },
                    type:"post",
                    success:function(data){
                        console.log("sendInfoSuccessData",data);
                    },
                    error:function(error){
                        console.log("sendInfoError",error)
                        alert("发送失败,请重试。");
                    }

                });
            }else{
                $.ajax({
                    url: _this.serverHttp+'/msg/push',
                    data:{
                        streamId: streamId,
                        content: msg,
                        type: "question"
                    },
                    headers:{
                        Authorization: "Bearer "+_this.dataObj.token
                    },
                    type:"post",
                    success:function(data){
                        console.log("sendInfoSuccessData",data);
                    },
                    error:function(error){
                        console.log("sendInfoError",error);
                        alert("发送失败,请重试。");
                    }

                });
            }
        }
    }
    /*接收消息*/
    function connectMsg(chatChannel,chatUrl){
        console.log('password',_this.dataObj)
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
                connectMsg(chatChannel,chatUrl)
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
               connectMsg(chatChannel,chatUrl)
                console.log("onConnectionLost:"+responseObject.errorMessage);
            }
        }
        // called when a message arrives
        function onMessageArrived(message) {
            var msg =  JSON.parse(message.payloadString);
            console.log("mqtt——msg",data)
            var sendTime = new Date();
            _this.time = sendTime;
            var opt="";
            switch(msg.type){
                case  "message":
                    _this.length++;
                    opt+='<div>'+
                    '<img src="'+msg.metaInfo.avatarUrl+'" alt="headPic" />'+
                    '<span class="user"><span>'+msg.metaInfo.displayName+'</span>: </span>'+
                    '<span>'+msg.metaInfo.content+'</span>'+
                    '</div>';
                    $("#commentArea").append(opt);
                    $("#commentArea").scrollTop($("#commentArea")[0].scrollHeight);
                    break;
                case "question":
                    _this.length++;
                    opt+='<div>'+
                    '<img src="'+msg.metaInfo.avatarUrl+'" alt="headPic" />'+
                    '<span class="user"><span>'+msg.metaInfo.displayName+'</span><span style="color: #005AA0;">问</span>: </span>'+
                    '<span style="color: #005AA0;font-size: large;">'+msg.metaInfo.content+'</span>'+
                    '</div>';
                    $("#commentArea").append(opt);
                    $("#commentArea").scrollTop($("#commentArea")[0].scrollHeight);
                    break;
                case "audience_num":
                    var audienceNum = msg.metaInfo.count;
                    $("#userNum").html(audienceNum);
                    break;
            }
            $(".commentNum").html(_this.length);
            //$(".dialogue").html(_this.commentCount);
            //$(".peopleCount").html(_this.audienceNum);
        }
    }
    function formatDate(time, format){
        var t = new Date(time);
        var tf = function(i){return (i < 10 ? '0' : '') + i};
        return format.replace(/yyyy|MM|dd|HH|mm|ss/g, function(a){
            switch(a){
                case 'yyyy':
                    return tf(t.getFullYear());
                    break;
                case 'MM':
                    return tf(t.getMonth() + 1);
                    break;
                case 'mm':
                    return tf(t.getMinutes());
                    break;
                case 'dd':
                    return tf(t.getDate());
                    break;
                case 'HH':
                    return tf(t.getHours());
                    break;
                case 'ss':
                    return tf(t.getSeconds());
                    break;
            }
        })
    }
    function perHotVideoList(userId){
        $.ajax({
            url: _this.serverHttp+'/user/streams',
            data:{
                status: "over",
                userid:userId,
                page:1,
                resultsPerPage:8
            },
            headers:{
                Authorization: "Bearer "+_this.dataObj.token
            },
            type:"get",
            success:function(data){
                console.log("perHotVideoListSuccess",data);
                var length = data.items.length;
                var hotVideoList = '';
                for(var i=0;i<length;i++){
                    hotVideoList += '<a href="live.html?streamId='+data.items[i].streamId+'" class="list_box_per">'+
                    '<div class="list_pic2">'+
                    '<img src="'+data.items[i].thumbnailUrl+'" alt="" class="">'+
                    '</div>'+
                    '<div class="list_intro_pre">'+
                    '<p>'+data.items[i].description+'</p>'+
                    '<p>结束时间: <span>'+formatDate(data.items[i].timeFinished,'yyyy-MM-dd HH:mm')+'</span></p>'+
                    '</div>'+
                    '</a>'
                }
                $(".list_hot_bd").html(hotVideoList);

            },
            error:function(error){
                console.log("perHotVideoListError",error);
            }
        })
    }
});


