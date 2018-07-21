mui.init();
var pageNumber=1;
var flag=false;
var token=sessionStorage.getItem('token',token);
sessionStorage.setItem('memoryUrl',location.href);//记录当前页面地址，以便在信息绑定之后跳转
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
//var wbLinkUrl='https://api.weibo.com/oauth2/authorize?client_id=367727881&response_type=code&redirect_uri=http://shouboke.tv/seriesClass/html/seriesListByWb.html?state=';
var wbLinkUrl='https://api.weibo.com/oauth2/authorize?client_id=367727881&response_type=code&redirect_uri=http://shouboke.tv/weChat_web_develop/seriesClass/html/seriesListByWb.html?state=';
var wbChildClassUrl='http://shouboke.tv/weChat_web_develop/wbSeriesClass.html?state=';
//var wbChildClassUrl='http://shouboke.tv/shareModel/wbSeriesClass.html?state=';
//var wbUrl='http://shouboke.tv/seriesClass/html/seriesListByWb.html?state=';
var wbUrl='http://shouboke.tv/weChat_web_develop/seriesClass/html/seriesListByWb.html?state=';
load();
var code=getQueryString('code');//获取code
var streamId=getQueryString('state')||sessionStorage.getItem('streamId');
if(!token){
	wbLogin();
}else{
    // getClass();
}
var platform=judgePhoneType();
function wbLogin(){
    var code=getQueryString('code');//获取code
    $.ajax({
        url: _url+"/weibo/token",
        type: "get",
        data: {
            code: code,
            url:wbUrl+streamId
        },
        success: function (data){
            console.log(data)
            getUserInfo(data);
        },
        error: function (error) {
            window.location.href=wbLinkUrl+streamId;
        }
    });   
}

mui("ul").on('tap','li',function(){
  var id = this.getAttribute("id");
  var isFreeWatch=this.getAttribute("isFreeWatch");
  if(isFreeWatch=='yes'){
    window.location.href=wbChildClassUrl+id;
  }else{
    mui.toast('报名解锁全部课程');
  }
})

mui("#bottom").on('tap','#bottomRight',function(){
    var uPhone=sessionStorage.getItem('uPhone');
    if(ifCharge){
        // window.location.href=wxPayUrl;
        mui.toast('关注手播课微信公众号报名');
    }else{
        if(uPhone){
            subscribe();
        }else{
            location.href=bindUrl;
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

function getUserInfo(data){//通过微博获取用户相关信息
    $.ajax({
        url: "https://api.weibo.com/2/users/show.json",
        type: "get",
        dataType:'jsonp',
        data: {
            access_token: data.access_token,
            uid: data.uid
        },
        success: function (data){
            console.log(data);
            loginByWb(data);
        },
        error: function (error) {
            //window.location.href=linkUrl
        }
    });  
}

function loginByWb(data){//微博登录首播客
    $.ajax({
        url: _url+"/user/thirdpart",
        type: "post",
        data: {
            type: 'wb',
            platform: platform,
            unionid: data.data.id,
            openid:data.data.id,
            nickname:data.data.screen_name
        },
        success: function (data){
            uPhone=data.phone;
            sessionStorage.setItem('uPhone',uPhone);
            for(var i=0;i<data.thirdpart.length;i++){
                if(data.thirdpart[i].type=="wb"){
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
                }
            }
            sessionStorage.setItem('token',data.token.token);
            flag=true;
            getClass(); 
        },
        error: function (error) {
            //window.location.href=linkUrl
         }
    });     
}


function getClass(){
    var streamId=sessionStorage.getItem('streamId');
    var token=sessionStorage.getItem('token');
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
            var dataJson={
                token:token,
                streamId:streamId
            }
            myData=data;
            loadInfo(data);
            data.flag=true;
        },
        error:function(error){
            if(JSON.parse(error.responseText).error == "not_team_member"){//非团队成员
                mui("#block")[0].style.display="none";
                mui("#isTeam")[0].style.display="block";
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
