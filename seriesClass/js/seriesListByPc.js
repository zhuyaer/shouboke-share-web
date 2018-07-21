mui.init();
var pageNumber=1;
//var pcLinkUrl='https://open.weixin.qq.com/connect/qrconnect?appid=wx2bdf9454bae8767f&redirect_uri=http://handsclass.lycam.tv/seriesClass/html/seriesListByPc.html?response_type=code&scope=snsapi_login&state=';
var pcLinkUrl='https://open.weixin.qq.com/connect/qrconnect?appid=wx2bdf9454bae8767f&redirect_uri=http://handsclass.lycam.tv/weChat_web_develop/seriesClass/html/seriesListByPc.html?response_type=code&scope=snsapi_login&state=';
//var pcSeriesLink="http://handsclass.lycam.tv/shareModel/pcSeriesClass.html?state=";
var pcSeriesLink="http://handsclass.lycam.tv/classItem/pcSeriesClass.html?state=";
var flag=false;
var token=sessionStorage.getItem('token',token);
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
load();
var code=getQueryString('code');//获取code
var streamId=getQueryString('state');
sessionStorage.setItem('streamId',streamId);
var platform=judgePhoneType();
getPublicIp();
if(!token){
  pcLogin();
}else{

}
function pcLogin(){
    $.ajax({
        url: _url+"/user/login/wechat",
        type: "post",
        data: {
            code: code,
        },
        success: function (data){
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
            sessionStorage.setItem('token',data.token.token);
            flag=true;
            getClass();
        },
        error: function (error) {
            window.location.href=pcLinkUrl+streamId;
        }
    });   
}

mui("ul").on('tap','li',function(){
  var id = this.getAttribute("id");
  var isFreeWatch=this.getAttribute("isFreeWatch");
  if(isFreeWatch=='yes'){
  	window.location.href=pcSeriesLink+id;
  }else{
  	mui.toast('报名解锁全部课程');
  }
})

mui("#bottom").on('tap','#bottomRight',function(){
    mui.confirm('使用微信扫码支付','报名',['取消','报名'],function(e){
    	if(e.index==1){
        getPayTicket();
    		mui('#qrContent')[0].style.display='block';
    	}
    },'div')
})

mui("#isPassword").on('click','#login',function(){
  var pwd = mui('#isPassword input')[0].value;
  if(pwd){
    checkPwd(pwd);
  }else{
    mui.toast('请输入密码');
  }
})

function getPayTicket(){
  var streamId=getQueryString('state');
  var token=sessionStorage.getItem('token');
  $.ajax({
    url:_url+'/3/weixinpay/unifiedorder',
    type:'post',
    headers:{Authorization: 'Bearer '+token},
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
    
      timer_weChat = setInterval(function () {
        weChatPayStatus(data.out_trade_no);
      }, 3000);
    }
  })
}

function weChatPayStatus(out_trade_no) {
  var streamId=getQueryString('state');
  var token=sessionStorage.getItem('token');
  $.ajax({
    url: _url + '/3/weixinpay/orderquery',
    headers: {
      Authorization: 'Bearer ' +token
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
        clearInterval(timer_weChat);
        location.reload();
      }
    },
    error: function (error) {
       console.log('weChatPayStatusError', error);
    }
  });
}
function getPublicIp(){
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
}

function getClass(){
    var streamId=getQueryString('state');
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
            nickName=data.stream.nickname;
            streamTitle=data.stream.title;
            streamCharge=data.stream.charge*100;
            // sessionStorage.setItem('dataJsonSession',dataJson);
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