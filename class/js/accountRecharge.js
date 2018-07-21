mui.init();
load();
var openId=sessionStorage.getItem('openId');
var 	userId=sessionStorage.getItem('userId');
var 	code=sessionStorage.getItem('code');
var token=sessionStorage.getItem('token');
var userName=sessionStorage.getItem('userName');
var totleTime=sessionStorage.getItem('totleTime');
var href=encodeURIComponent(window.location.href);
mui('#tabHeader h4')[0].innerHTML=totleTime;
mui('#mineInfo span')[1].innerHTML=userName;
if(totleTime>=60){
	mui('#tabHeader')[0].style.backgroundColor='#14c864';
}else{
	mui('#tabHeader')[0].style.backgroundColor='#DD524D';
}
getSign();
function cardClick(){
	var other=mui('#other input')[0].value;
	var rechargeNum=mui('#rechargeNum input')[0].value;
	if(rechargeNum&&rechargeNum>0){
		if(other){
			ifPhone('card');
		}else{
			rechargeByCard();
		}
	}else{
		mui.toast('请填写充值金额',{ duration:'short', type:'div' }) 
	}
}

function wxClick(){
	var other=mui('#other input')[0].value;
	var rechargeNum=mui('#rechargeNum input')[0].value;
	if(rechargeNum&&rechargeNum>0){
		if(other){
			ifPhone('wx');
		}else{
			createOrder();
		}
	}else{
		mui.toast('请填写充值金额',{ duration:'short', type:'div' }) 
	}
}

function rechargeByCard(userid){//使用卡券充值
	mui.ajax(_url+'/3/voucher',{
		data:{voucherId:voucherId,userid:userid},
		dataType:'json',//服务器返回json格式数据
		type:'get',//HTTP请求类型
		timeout:10000,//超时时间设置为10秒；
		headers:{'Content-Type':'application/json',Authorization: 'Bearer '+token},	              
		success:function(data){
			
		},
    	error:function(xhr,type,errorThrown){
		//异常处理；
		}
	});
}

function createOrder(){
	var rechargeNum=mui('#rechargeNum input')[0].value*100;
	subLoad=Zepto.loading({
       	content:'请求中'
    });
    	mui('#weixin')[0].setAttribute('class','mui-btn mui-disabled');
	mui.ajax(_url+'/3/weixinpay/jsapi',{
		data:{type:'user',userid:userId,openid:openId,total_fee:rechargeNum},
		dataType:'json',//服务器返回json格式数据
		type:'post',//HTTP请求类型
		timeout:10000,//超时时间设置为10秒；
		headers:{'Content-Type':'application/json',Authorization: 'Bearer '+token},	              
		success:function(data){
			rechargeBywx(data);
		},
    		error:function(xhr,type,errorThrown){
		//异常处理；
		}
	});
}

function onBridgeReady(data){
   WeixinJSBridge.invoke(
       'getBrandWCPayRequest', {
        	   "appId":data.appId,     //公众号名称，由商户传入     
           "timeStamp":data.timeStamp,         //时间戳，自1970年以来的秒数     
           "nonceStr":data.nonceStr, //随机串     
           "package":data.package,     
           "signType":"MD5",         //微信签名方式：     
           "paySign":data.sign //微信签名 
       },
       function(res){     
       		subLoad.loading('hide');
    			mui('#weixin')[0].setAttribute('class','mui-btn');
           if(res.err_msg == "get_brand_wcpay_request:ok" ) {// 使用以上方式判断前端返回,微信团队郑重提示：res.err_msg将在用户支付成功后返回    ok，但并不保证它绝对可靠。
           		mui.alert('充值成功','提示','确认',function(){window.location.href='https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx18e63e75d50cb458&redirect_uri=http://shouboke.tv%2fclass%2fhtml%2fmyAccount.html&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect'})
           }else if(res.err_msg == 'get_brand_wcpay_request:cancel'){
           		mui.alert('支付已取消','提示','确认',function(){window.location.href='https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx18e63e75d50cb458&redirect_uri=http://shouboke.tv%2fclass%2fhtml%2fmyAccount.html&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect'})
           }else{
           		mui.alert('支付失败','提示','确认',function(){window.location.href='https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx18e63e75d50cb458&redirect_uri=http://shouboke.tv%2fclass%2fhtml%2fmyAccount.html&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect'})
           }
       }
  	 ); 
}

function rechargeBywx(data){
	if (typeof WeixinJSBridge == "undefined"){
   		if( document.addEventListener ){
      		document.addEventListener('WeixinJSBridgeReady', onBridgeReady, false);
   		}else if (document.attachEvent){
        		document.attachEvent('WeixinJSBridgeReady', onBridgeReady); 
        		document.attachEvent('onWeixinJSBridgeReady', onBridgeReady);
    		}
   	}else{
   		onBridgeReady(data);
	}
}

function ifPhone(rechargeType){//判断该用户是否存在，获取该用户信息
	var otherPhone=mui('#other input')[0].value;
	mui.ajax(_url+'/user/info?phone='+otherPhone,{
		dataType:'json',//服务器返回json格式数据
		type:'get',//HTTP请求类型
		timeout:10000,//超时时间设置为10秒；
		headers:{Authorization: 'Bearer '+token},	              
		success:function(data){
			if(data.userid){
				userId=data.userid;
				if(rechargeType=='card'){//判断支付方式
					rechargeByCard(userid);
				}else{
					createOrder();
				}
			}
		},
    		error:function(xhr,type,errorThrown){
		//异常处理；				
			mui.toast('用户不存在',{ duration:'short', type:'div' })
		}
	});
}

function getSign(){//获取微信初始化签名
	mui.ajax(_url+'weixin/share/signature?url='+href,{//获取token
		data:{code:code},
		dataType:'json',//服务器返回json格式数据
		type:'get',//HTTP请求类型
		timeout:10000,//超时时间设置为10秒；
		headers:{'Content-Type':'application/json'},	              
		success:function(data){
			console.log(data)
			wx.config({
               debug: false, //开启调试模式
               appId: 'wx18e63e75d50cb458', // 必填，公众号的唯一标识
               timestamp: data.timestamp, // 必填，生成签名的时间戳
               nonceStr: data.noncestr, // 必填，生成签名的随机串
               signature: data.sign,// 必填，签名，见附录1
               jsApiList: [
               		'checkJsApi',
               		'chooseWXPay'
                    ] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
               });
		},
   		error:function(xhr,type,errorThrown){
		//异常处理；
			console.log(type);
		}
	});
}

function load(){//加载动画
	 var el=Zepto.loading({
        content:'正在加载中...',
    })
    setTimeout(function(){
        el.loading("hide");
    },1000);
    el.on("loading:hide",function(){
        mui('#block')[0].style.display='block';
    });
}

function canCharge(_this){
	if(_this.value&&_this.value>0){
		mui('#weixin')[0].style.backgroundColor='#14c864';
	}else{
		mui('#weixin')[0].style.backgroundColor='#ddd';
	}
}
