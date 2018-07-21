mui.init();
var code=getQueryString('code');//获取code
var href=encodeURIComponent(window.location.href);
var dataObj=JSON.parse(sessionStorage.getItem('dataJsonSession'));
var codeFlag=false;
var cardInfo=JSON.parse(sessionStorage.getItem('cardInfo'));
var streamInfo=JSON.parse(sessionStorage.getItem('dataJsonSession'));
var streamId=streamInfo.streamId||sessionStorage.getItem('streamId');
load();
var time;
var actPrice='';
var cardData={};
var cardId='';
var countTime=document.getElementById('time');
mui.ajax(_url+'/wechat/wechatLogin',{//获取token
	data:{code:code},
	dataType:'json',//服务器返回json格式数据
	type:'post',//HTTP请求类型
	timeout:10000,//超时时间设置为10秒；
	headers:{'Content-Type':'application/json'},	              
	success:function(data){
		token=data.token.token;
		uphone=data.phone;
		ifBind();
		for(var i=0;i<data.thirdpart.length;i++){
			if(data.thirdpart[i].type=='wx')
			openid=data.thirdpart[i].openid;
		}
		userid=data.id;
		getvideo();
		getSign();
		if(cardInfo){
			getCustomer();
		}
	},
    error:function(xhr,type,errorThrown){
	//异常处理；
		console.log(type);
	}
});

function getCustomer(){
	mui.ajax(_url+'/v4/card/customer/show',{//获取token
		data:{cardId:cardInfo.id},
		dataType:'json',//服务器返回json格式数据
		type:'get',//HTTP请求类型
		timeout:10000,//超时时间设置为10秒；
		headers:{Authorization: 'Bearer '+token},	              
		success:function(data){
			console.log('--',data);
			if(data.error||data.status=='expired'){
				createCard();
			}else if(data.seconds>0){
				time=data.seconds;
				cardData=data;
				mui('#oldPrice')[0].value='¥'+data.stream.charge;
				mui('#coupon')[0].value='- ¥'+(data.stream.charge-data.price).toFixed(2);
				mui('#realPay')[0].innerHTML='¥'+data.price;
				actPrice=Math.round(data.price*100);
				cardId=data.card.id;
				if(data.card.discount&&data.card.status!='expired'){
					showCoupon();
					setInterval(function(){
						if(time>0){
            				time=time-1;
        				}else{
        					hideCoupon();
        				}
        				countDown(time);
    				},1000)
				}
			}
		},
   		error:function(xhr,type,errorThrown){
		//异常处理；
			if(JSON.parse(xhr.response).error='cardId错误'){
				createCard();
			}
		}
	});
}

function hideCoupon(){
	console.log(cardData)
	mui('#countDown')[0].style.display='none';
	mui('#couponInfo')[0].style.display='none';
	mui('#realPay')[0].innerHTML='¥'+cardData.stream.charge;
}

function showCoupon(){
	console.log(cardData.price)
	mui('#countDown')[0].style.display='block';
	mui('#couponInfo')[0].style.display='block';
	mui('#realPay')[0].innerHTML='¥'+cardData.price;
}

function createCard(){
	mui.ajax(_url+'/v4/card/customer/create',{//获取token
		data:{cardId:cardInfo.id},
		dataType:'json',//服务器返回json格式数据
		type:'post',//HTTP请求类型
		timeout:10000,//超时时间设置为10秒；
		headers:{Authorization: 'Bearer '+token},	              
		success:function(data){
			time=data.seconds;
			if(data.error){
				mui.toast(data.error)
			}else{
				time=data.seconds;
				cardData=data;
				mui('#oldPrice')[0].value='¥'+data.stream.charge;
				mui('#coupon')[0].value='- ¥'+(data.stream.charge-data.price).toFixed(2);
				if(data.price){
					mui('#realPay')[0].innerHTML='¥'+data.price;
				}else{
					mui('#realPay')[0].innerHTML='¥'+data.stream.charge;
				}
				actPrice=Math.round(data.price*100);
				cardId=data.card.id;
				if(data.card.discount&&data.card.status!='expired'){
					showCoupon();
					setInterval(function(){
						if(time>0){
            				time=time-1;
        				}else{
        					hideCoupon();
        				}
        				countDown(time);
    				},1000)
				}
			}
		},
   		error:function(xhr,type,errorThrown){
		//异常处理；
			console.log(type);
		}
	});
}

function countDown(time){
	var min=parseInt(time/60);
	var sec=parseInt(time-min*60);
	if(min<10){
		min='0'+min;
	}
	if(sec<10){
		sec='0'+sec;
	}
	countTime.innerHTML=min+':'+sec
}

function getSign(){//获取微信初始化签名
	mui.ajax(_url+'/weixin/share/signature?url='+href,{//获取token
		data:{code:code},
		dataType:'json',//服务器返回json格式数据
		type:'get',//HTTP请求类型
		timeout:10000,//超时时间设置为10秒；
		headers:{Authorization: 'Bearer '+token},	              
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

function ifBind(){//判断是否已经绑定手机号
	if(uphone){
		mui('#perfectInfo')[0].style.display='none';
		mui('#stateMent')[0].style.display='none';
		mui('.space')[0].style.display='none';
		return true;
	}else{
		return false;
	}
}

function getvideo(){//获取视频详情
	mui.ajax(_url+'/stream/show?streamId='+streamId,{
		dataType:'json',//服务器返回json格式数据
		type:'get',//HTTP请求类型
		timeout:10000,//超时时间设置为10秒；
		headers:{Authorization: 'Bearer '+token},	              
		success:function(data){
			showUserInfo(data);
		},
		error:function(xhr,type,errorThrown){
			//异常处理；
			console.log(type);
		}
	});
}

function showUserInfo(data){
		mui('#videoTitle')[0].innerHTML=data.title;
		mui('#videoCover img')[0].src=data.thumbnailUrl;
		if(data.user.displayName.length>4){
			data.user.displayName=data.user.displayName.substr(0,4)+'...';
		}
		mui('#userName')[0].innerHTML=data.user.displayName;
		mui('#price')[0].innerHTML='¥'+data.charge;
		if(cardData.status!='unused'){
			mui('#realPay')[0].innerHTML='¥'+data.charge;
		}
		mui('#userHead img')[0].src=data.user.avatarUrl;
		realPrice=Math.round(data.charge*100);//价格单位为分
		el.loading("hide");
}

function closeCount(){
	mui('#countDown')[0].style.display='none';
}

function payClick(){//点击支付按钮，判断支付信息　
	var phoneRule=/^1[34578]\d{9}$/;
	var tel=mui('#tel')[0].value;
	var yzCode=mui('#code')[0].value;
	if(ifBind()){//判断是否已经绑定手机
		createOrder();
		subLoad=Zepto.loading({
       		content:'请求中'
    		});
    		mui('#payRight')[0].setAttribute('class','mui-disabled');
	}else{
		if(tel){
			if(phoneRule.test(tel)){
				if(yzCode){
					mui('#payRight')[0].setAttribute('class','mui-disabled');
					checkCode();
				}else{
					mui.toast('请输入短信验证码');
				}
			}else{
				mui.toast('请输入正确的电话号码');
			}
		}else{
			mui.toast('请输入电话号码');
		}
	}
}



function getIdentifyCode(){//获取验证码
	var flag=/^1[34578]\d{9}$/;
	var tel=mui('#tel')[0].value;
	if(flag.test(tel)){
		sendCode();
	}else{
		mui.toast('请输入正确的电话号码',{ duration:'short', type:'div' })
	}
}

function checkCode(){//核对验证码是否正确
	var yzCode=mui('#code')[0].value;
	var tel=mui('#tel')[0].value;
	mui.ajax(_url+'/sms/verifyCode',{
		dataType:'json',//服务器返回json格式数据
		type:'post',//HTTP请求类型
		timeout:10000,//超时时间设置为10秒；
		headers:{'Content-Type':'application/json',Authorization: 'Bearer '+token},	
		data:{phone:tel,authCode:yzCode,type:'report'},
		success:function(data){
			bind();
			subLoad=Zepto.loading({
       			content:'请求中'
    			});
    			mui('#payRight')[0].setAttribute('class','mui-disabled');
    			mui('#getCode')[0].style.color='#757887';
		},
    	error:function(xhr,type,errorThrown){
		//异常处理；
				mui.toast('验证码错误',{ duration:'short', type:'div' }) 
				subLoad.loading('hide');
				mui('#payRight')[0].setAttribute('class','');
		}
	});	
}

function bind(){
	var tel=mui('#tel')[0].value;
	postData={phone:tel}
	mui.ajax(_url+'/v4/user/bindUserInfo',{
		dataType:'json',//服务器返回json格式数据
		type:'put',//HTTP请求类型
		timeout:10000,//超时时间设置为10秒；
		headers:{'Content-Type':'application/json',Authorization: 'Bearer '+token},
		data:postData,
		success:function(data){
			sessionStorage.setItem('newBind',true);//绑定标识，返回观看页面后执行对应操作
			sessionStorage.setItem('token',data.token.token);
			userid=data.userid;
			createOrder();
		},
		error:function(xhr,type,errorThrown){
			//异常处理；
			var err=(JSON.parse(xhr.response)).error_output;
			mui.toast(err);
		}
	});
}

function createOrder(){//创建支付订单
	var tel=mui('#tel')[0].value;
	var token=sessionStorage.getItem('token');
	var distributor=sessionStorage.getItem('distributor');//分销者ID
	var postData={type:'subscribe',streamId:streamId,userid:userid,openid:openid,total_fee:realPrice,realName:'',phone:tel};
	if(cardId){
		postData.actPrice=actPrice;
		postData.cardId=cardId;
	}
	if(distributor&&distributor!='null'){
		postData.distributor=distributor;
	}
	if(getPayType()=='wx'){
		mui.ajax(_url+'/3/weixinpay/jsapi',{
			dataType:'json',//服务器返回json格式数据
			type:'post',//HTTP请求类型
			timeout:10000,//超时时间设置为10秒；
			headers:{'Content-Type':'application/json',Authorization: 'Bearer '+token},	
			data:postData,
			success:function(data){
				sessionStorage.setItem('refresh',true);
				pay(data);
			},
    		error:function(xhr,type,errorThrown){
		//异常处理；		
				subLoad.loading('hide');
				mui('#payRight')[0].setAttribute('class','');
				mui.toast('创建订单失败',{ duration:'short', type:'div' })
			}
		});			
	}
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
			mui('#payRight')[0].setAttribute('class','');
			var redirectUrl=sessionStorage.getItem('redirectUrl');
           if(res.err_msg == "get_brand_wcpay_request:ok" ) {// 使用以上方式判断前端返回,微信团队郑重提示：res.err_msg将在用户支付成功后返回ok
           		mui.toast('支付成功，3s后自动跳转',{ duration:3000, type:'div' });
           		setTimeout(function(){
           			window.location.href=redirectUrl;
           		},3000)
           }else if(res.err_msg == 'get_brand_wcpay_request:cancel'){
           		mui.alert('支付已取消','提示','确认',function(){window.location.href=redirectUrl});
           		mui.alert('支付失败','提示','确认',function(){window.location.href=redirectUrl});
           }
       }
  	 ); 
}

function pay(data){
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


function getPayType(){//获取用户选择的支付方式
	var obj =document.getElementsByName("payType");
    for(var i=0; i<obj.length; i ++){
        if(obj[i].checked){
            return obj[i].value;
        }
    }
}

function sendCode(){
	var tel=mui('#tel')[0].value;
	mui.ajax(_url+'sms/getCode?phone='+tel+"&type=report",{
		dataType:'json',//服务器返回json格式数据
		type:'get',//HTTP请求类型
		timeout:10000,//超时时间设置为10秒；
		headers:{'Content-Type':'application/json',Authorization: 'Bearer '+token},	              
		success:function(data){
			hasCode(tel);
		},
    		error:function(xhr,type,errorThrown){
		//异常处理；
			mui.toast('获取验证码失败',{ duration:'short', type:'div' })
		}
	});
}

function hasCode(){//获取验证码成功
  var timeCount=60;
  mui('#getCode')[0].setAttribute('class','disabled');
  codeFlag=true;
  mui('#getCode')[0].innerHTML=timeCount+'s后失效';
  mui('#getCode')[0].style.color='#757887';
  var countTimer=setInterval(function(){
  	timeCount--;
  	if(timeCount<=0){
  		mui('#getCode')[0].innerHTML='重新发送';
  		mui('#getCode')[0].setAttribute('class','');
  		mui('#getCode')[0].style.color='#393939';
  		clearInterval(countTimer)
  	}else{
  		mui('#getCode')[0].innerHTML=timeCount+'s后重新获取';
  	}
  },1000)
  return true;
}

function load(){//加载动画
	el=Zepto.loading({
        content:'正在加载中...',
    })
    el.on("loading:hide",function(){
        mui('#block')[0].style.display='block';
    });
}
