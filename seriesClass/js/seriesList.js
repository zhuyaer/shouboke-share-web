// 注：大量公有函数放至同级common.js
var pageNumber=1;
mui.init();
var flag=false;//判断是否自动下拉刷新一次
var token=sessionStorage.getItem('token');
var cardId=sessionStorage.getItem('cardId');
var streamId=sessionStorage.getItem('streamId');
var distributor=sessionStorage.getItem('distributor');
if(!streamId){
    streamId=getQueryString('state');
}
sessionStorage.setItem('memoryUrl',location.href);
var wxLinkUrl='http://shouboke.tv/weChat_web_develop/wxSeriesClass.html?state=';
//var wxLinkUrl='http://shouboke.tv/shareModel/wxSeriesClass.html?state=';
var wxPayUrl='https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx18e63e75d50cb458&redirect_uri=http://shouboke.tv%2fweChat_web_develop%2fclass%2fhtml%2fpayInformation.html&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect';
//var wxPayUrl='https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx18e63e75d50cb458&redirect_uri=http://shouboke.tv%2fclass%2fhtml%2fpayInformation.html&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect';
//var reloadUrl='https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx18e63e75d50cb458&redirect_uri=http://shouboke.tv/seriesClass/html/seriesList.html&response_type=code&scope=snsapi_userinfo&state=';
var reloadUrl='https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx18e63e75d50cb458&redirect_uri=http://shouboke.tv/weChat_web_develop/seriesClass/html/seriesList.html&response_type=code&scope=snsapi_base&state='+streamId;
var shareQqLink='http://shouboke.tv/weChat_web_develop/seriesClass/html/seriesListByqq.html?state=';
//var shareLink='http://shouboke.tv/seriesClass/html/seriesTransfer.html?state=';
var shareLink='http://shouboke.tv/weChat_web_develop/seriesClass/html/seriesTransfer.html?state=';
if(cardId&&cardId!='null'&&token){
    getCard();
}
mui.ready(function(){
    mui('#refreshContainer').pullRefresh({
        up:{
            auto:'true',
            callback:function(){
                if(flag||token){
                    getClass();
                }
            }
        }
    })
})
wxConfig();
load();
var refresh=sessionStorage.getItem('refresh');
if(refresh){
    sessionStorage.setItem('refresh','');
    setTimeout(function(){
        location.reload();
    },300)
}
if(!token){
	wechatLogin();
}else{
  // getClass();
}
var platform=judgePhoneType();
mui("#card").on('tap','#buyNow',function(){
    var uPhone=sessionStorage.getItem('uPhone');
    if(cardData.discount!=100){
        if(status=='pending'){
            window.location.href=wxPayUrl;
        }else if(status=='over'){
            mui.confirm('啊哦，很遗憾，优惠券被人领光了', '抱歉', ['取消','继续报名'], function(e) {
                if (e.index == 1) {
                    window.location.href=wxPayUrl;
                } else {
                
                }
            })
        }
    }else{
        subscribe();
    }
})
function wechatLogin(){
    var code=getQueryString('code');//获取code
	mui.ajax(_url+'/wechat/wechatLogin',{//登陆获取用户信息
		data:{code:code},
		dataType:'json',//服务器返回json格式数据
		type:'post',//HTTP请求类型
		timeout:10000,//超时时间设置为10秒；
		headers:{'Content-Type':'application/json'},	              
		success:function(data){
            uPhone=data.phone;
            sessionStorage.setItem('uPhone',uPhone);
            var dataJson={
                token:data.token.token,
                streamId:streamId,
                type:data.thirdpart[0].type,
                unionid:data.thirdpart[0].unionid,
                openid:data.thirdpart[0].openid,
                nickname:data.thirdpart[0].nickname,
                userid:data.id,
                apiToken:data.token.apiToken.value
            }
            dataJson=JSON.stringify(dataJson)
            sessionStorage.setItem('dataJsonSession',dataJson)
			token=data.token.token;
			sessionStorage.setItem('token',token);
            flag=true;
			getClass();
            if(cardId&&cardId!='null'){
                getCard();
            }
		},
    	error:function(xhr,type,errorThrown){
		//异常处理；
            console.log(xhr)
            var err=JSON.parse(xhr.response).error_output;
            if(!code){
                window.location.href=reloadUrl;
            }else{
                mui.confirm(err+',是否重新登录？', '温馨提示', ['否','是'], function(e) {
                    if (e.index == 1) {
                        window.location.href=reloadUrl;
                    } else {

                    }
                })
            }
		}
	});
}

mui("ul").on('tap','li',function(){
  var id = this.getAttribute("id");
  var isFreeWatch=this.getAttribute("isFreeWatch");
  if(isFreeWatch=='yes'){
  	window.location.href=wxLinkUrl+id;
  }else{
  	mui.toast('报名解锁全部课程');
  }
})

mui("#bottom").on('tap','#bottomRight',function(){
    if(ifCharge&&cardData.discount!=100){
        window.location.href=wxPayUrl;
    }else{
        subscribe()
    }
})

mui("#isPassword").on('tap','#login',function(){
  var pwd = mui('#isPassword input')[0].value;
  sessionStorage.setItem('password',pwd);//记录密码课的密码
  if(pwd){
    checkPwd(pwd);
  }else{
    mui.toast('请输入密码');
  }
})

function getClass(){
    var streamId=sessionStorage.getItem('streamId');
    var token=sessionStorage.getItem('token');
    sessionStorage.setItem('redirectUrl',window.location.href)
    mui.ajax({
        url:_url+'/v4/stream/getChildStreams?streamId='+streamId+'&page='+pageNumber,
        headers:{Authorization: 'Bearer '+token},
        success:function(data){
            if(data.stream.isSeries){//IOS APP分享系列课子课程时会去查询该子课程，导致无课程信息，此处规避，以后可以取消
                pageNumber++;
                if(data.child.items.length>0){
                    mui('#refreshContainer').pullRefresh().endPullupToRefresh(false);
                }else{
                    mui('#refreshContainer').pullRefresh().endPullupToRefresh(true);
                }
                // mui('#refreshContainer').pullRefresh().endPullupToRefresh(true);
                // alert(pageNumber)
                wxShare(data);
                var dataJson={
                    token:token,
                    streamId:streamId
                }
                var dataJson=JSON.stringify(dataJson);
                // sessionStorage.setItem('dataJsonSession',dataJson);
                myData=data;
                loadInfo(data);
                data.flag=true;
            }else{
                sessionStorage.setItem('streamId',data.stream.parentId);
                getClass();
            }
        },
        error:function(error){
            // alert(error.responseText)
            if(JSON.parse(error.responseText).error == "not_team_member"){//非团队成员
                mui("#block")[0].style.display="none";
                mui("#isTeam")[0].style.display="block";
                cardClose();
                // mui('#isTeam')[0].innerHTML="您不是团队成员，无观看权限";
            }else if(JSON.parse(error.responseText).error=="not_found"){
                mui("#block")[0].style.display="none";
                mui("#isTeam")[0].style.display="block";
                mui('#isTeam')[0].innerHTML="视频已删除"
            }else{
                mui("#block")[0].style.display="none";
                mui("#isTeam")[0].style.display="block";
                mui('#isTeam')[0].innerHTML="视频暂不支持观看"
            }
            mui('.ui-loading-block')[0].style.display='none';
        }
    })
}

function wxConfig(){
    var shareHref=encodeURIComponent(window.location.href);
    $.ajax({
        url:_url+"weixin/share/signature?url="+shareHref,  //获取签名
        type:"get",
        success:function(data){
            // 微信分享配置相关
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
}

function wxShare(data){
    if(data){
        var shareTitle='欢迎观看'+data.stream.user.displayName+'的['+data.stream.title+']';
        var link=shareLink+streamId;
        if(distributor){
            link=shareLink+streamId+'&distributor='+distributor;
        }
        var shareData={
            title:shareTitle,
            desc:'分享真知，成长智慧，改变人生',
            imgUrl:data.stream.thumbnailUrl,
            link:link,
            success:function(){

            },
            cancel:function(){

            }
        }
        wx.ready(function(){
            wx.onMenuShareTimeline(shareData);
            wx.onMenuShareAppMessage(shareData);
            wx.onMenuShareQQ(shareData);
            wx.onMenuShareQZone(shareData);
            wx.error(function(info){
                console.log('err',info)
            });
        });
    }
}
