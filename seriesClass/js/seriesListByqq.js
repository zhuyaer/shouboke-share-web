// 注：大量公有函数放至同级common.js
mui.init();
var pageNumber=1;
var flag=false;
var token=sessionStorage.getItem('token',token);
var cardId=getQueryString('cardId')||sessionStorage.getItem('cardId');
var streamId=getQueryString('streamId')||sessionStorage.getItem('streamId');
sessionStorage.setItem('memoryUrl',location.href);//记录当前页面地址，以便在信息绑定之后跳转
// cardId=sessionStorage.getItem('cardId');
if(cardId&&token&&cardId!='null'){
    console.log('token=',token)
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
//var qqLinkUrl='https://graph.qq.com/oauth2.0/authorize?response_type=token&client_id=1105569906&redirect_uri=http://shouboke.tv/seriesClass/html/seriesListByqq.html?state=';
var qqLinkUrl='https://graph.qq.com/oauth2.0/authorize?response_type=token&client_id=1105569906&redirect_uri=http://shouboke.tv/weChat_web_develop/seriesClass/html/seriesListByqq.html?state=';
var qqChildClassUrl='http://shouboke.tv/weChat_web_develop/qqSeriesClass.html?state=';
//var qqChildClassUrl='http://shouboke.tv/shareModel/qqSeriesClass.html?state=';
var wxPayUrl='http://shouboke.tv/weChat_web_develop/class/html/h5wxPay.html';
//var wxPayUrl='http://shouboke.tv/class/html/h5wxPay.html';
load();
var refresh=sessionStorage.getItem('refresh');
if(refresh){
    sessionStorage.setItem('refresh','');
    setTimeout(function(){
        location.reload();
    },300)
}
var code=getQueryString('code');//获取code
var streamId=getQueryString('state');
if(!streamId){
    var url = window.location.hash;
    var array1 = url.split("=");
    streamId =array1[3];
}
if(!token){
	qqLogin();
}else{

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
        if(uPhone){
            cardClose();
            subscribe();
        }else{
            window.location.href=bindUrl;
        }
    }
})
function qqLogin(){
    var streamId=sessionStorage.getItem('streamId');
    if(QC.Login.check()){//判断是否已经获得授权
        QC.Login.getMe(function(openId, accessToken){
            qqOpenId=openId;
            sessionStorage.setItem('qqOpenId',qqOpenId)
            qqToken=accessToken;
            var nickName=randomString(6);
            $.ajax({
                url: _url+'v4/user/getQQUnionId?qq_token='+qqToken,
                type:'get',
                success:function(data){
                    var unionid=data.unionid;
                    console.log(data)
                    $.ajax({
                        url: _url+"/user/thirdpart",
                        type: "post",
                        data: {
                            type: 'qq',
                            openid:qqOpenId,
                            platform:platform,
                            unionid:unionid,
                            nickname:nickName
                        },
                        success: function (data){
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
                            dataJson=JSON.stringify(dataJson);
                            token=data.token.token;
                            sessionStorage.setItem('dataJsonSession',dataJson)
                        	sessionStorage.setItem('token',data.token.token);
                            flag=true;
                            getClass();
                            if(cardId&&cardId!='null'){
                                getCard();
                            }
                        },
                        error: function (error) {
                            console.log('error');
                            window.location.href=qqLinkUrl+streamId;
                        }
                	});
                },
                error:function(err){
                    console.log(err);
                }
            })
        });
	}else{
        console.log('noLogin')
        window.location.href=qqLinkUrl+streamId;
    }
}

mui("ul").on('tap','li',function(){
  var id = this.getAttribute("id");
  var isFreeWatch=this.getAttribute("isFreeWatch");
  if(isFreeWatch=='yes'){
  	window.location.href=qqChildClassUrl+id;
  }else{
  	mui.toast('报名解锁全部课程');
  }
})

mui("#bottom").on('tap','#bottomRight',function(){
    if(ifCharge&&cardData.discount!=100){
        window.location.href=wxPayUrl;
    }else{
        if(uPhone){
            subscribe();
        }else{
            window.location.href=bindUrl;
        }
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



function randomString(len) {
    var $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
    var maxPos = $chars.length;
    var pwd = '';
    for (var i= 0; i < len; i++) {
        pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return pwd;
}


function getClass(){
    var streamId=getQueryString('streamId')||sessionStorage.getItem('streamId');
    var token=sessionStorage.getItem('token');
    sessionStorage.setItem('redirectUrl',window.location.href)
    console.log(streamId);
    console.log('token',token);
    mui.ajax({
        url:_url+'/v4/stream/getChildStreams?streamId='+streamId+'&page='+pageNumber,
        headers:{Authorization: 'Bearer '+token},
        success:function(data){
            pageNumber++;
            console.log(pageNumber)
            if(data.child.items.length>0){
                mui('#refreshContainer').pullRefresh().endPullupToRefresh(false);
            }else{
                mui('#refreshContainer').pullRefresh().endPullupToRefresh(true);
            }
            myData=data;
            loadInfo(data);
        },
        error:function(error){
            // alert(error.responseText)
            if(JSON.parse(error.responseText).error == "not_team_member"){//非团队成员
                mui("#block")[0].style.display="none";
                mui("#isTeam")[0].style.display="block";
                // mui('#isTeam')[0].innerHTML="您不是团队成员，无观看权限";
            }else if(JSON.parse(error.responseText).error=="not_found"){
                mui("#block")[0].style.display="none";
                mui("#isTeam")[0].style.display="block";
                mui('#isTeam')[0].innerHTML="视频已删除";
            }else{
                mui("#block")[0].style.display="none";
                mui("#isTeam")[0].style.display="block";
                mui('#isTeam')[0].innerHTML="视频暂不支持观看";
            }
            mui('.ui-loading-block')[0].style.display='none';
        }
    })
}
