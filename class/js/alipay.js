mui.init();
var code=getQueryString('code');//获取code
var href=encodeURIComponent(window.location.href);
var dataObj=JSON.parse(sessionStorage.getItem('dataJsonSession'));
var token=dataObj.token;
var codeFlag=false;
var checkCodeFlag=false;
var cardInfo=JSON.parse(sessionStorage.getItem('cardInfo'));
var qqOpenId=sessionStorage.getItem('qqOpenId');
var platform=judgePhoneType();
load();
var time;
var actPrice='';
var cardData={};
var cardId='';
var countTime=document.getElementById('time');
Zepto.ajax({//获取公网ip
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
mui.ajax(_url+"/user/thirdpart",{//获取token
	data: {
         type: 'qq',
         openid:qqOpenId,
         platform:platform,
         unionid:dataObj.unionid,
         nickname:dataObj.nickname
    },
	dataType:'json',//服务器返回json格式数据
	type:'post',//HTTP请求类型
	timeout:10000,//超时时间设置为10秒；
	headers:{'Content-Type':'application/json'},	              
	success:function(data){
		token=data.token.token;
		uphone=data.phone;
		ifBind();
		getvideo();
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
				actPrice=data.price*100;
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
				actPrice=data.price*100;
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
			getSign();
		},
		error:function(xhr,type,errorThrown){
			//异常处理；
			var err=(JSON.parse(xhr.response)).error_output;
			mui.toast(err);
		}
	});
}

function getSign(){//获取签名后的订单信息
	var tel=mui('#tel')[0].value;
    var title=sessionStorage.getItem('title');
	var token=sessionStorage.getItem('token');
	var distributor=sessionStorage.getItem('distributor');//分销者ID
	var postData={
		type:'subscribe',
		streamId:dataObj.streamId,
		body:title+' 课程报名',
		total_fee:realPrice,
		trade_type:'MWEB',
		realName:'',
		phone:tel,
		userid:dataObj.userid,
		spbill_create_ip:spbill_create_ip
	}
	if(cardId){
		postData.actPrice=actPrice;
		postData.cardId=cardId;
	}
	if(distributor){
		postData.distributor=distributor;
	}
	mui.ajax(_url+'/3/weixinpay/h5_unifiedorder',{
		data:postData,
		dataType:'json',//服务器返回json格式数据
		type:'post',//HTTP请求类型
		timeout:10000,//超时时间设置为10秒；
		headers:{Authorization: 'Bearer '+token},	              
		success:function(data){
			var redirectUrl=sessionStorage.getItem('memoryUrl');
			//var url=encodeURIComponent(redirectUrl);
			sessionStorage.setItem('refresh',true);
			location.href=data.mweb_url+'&redirect_url='+redirectUrl;
		},
   		error:function(xhr,type,errorThrown){
		//异常处理；
			console.log(xhr,type,errorThrown);
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
	mui.ajax(_url+'/stream/show?streamId='+dataObj.streamId,{
		dataType:'json',//服务器返回json格式数据
		type:'get',//HTTP请求类型
		timeout:10000,//超时时间设置为10秒；
		headers:{Authorization: 'Bearer '+token},	              
		success:function(data){
			showUserInfo(data);
			video=data;
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
		if(data.user.displayName>4){
			data.user.displayName=data.user.displayName.substr(0,4)+'...';
		}
		mui('#userName')[0].innerHTML=data.user.displayName;
		mui('#price')[0].innerHTML='¥'+data.charge;
		mui('#realPay')[0].innerHTML='¥'+data.charge;
		mui('#userHead img')[0].src=data.user.avatarUrl;
		realPrice=Math.round(data.charge*100);//价格单位为分
}

function payClick(){//点击支付按钮，判断支付信息　
	var phoneRule=/^1[34578]\d{9}$/;
	var tel=mui('#tel')[0].value;
	var yzCode=mui('#code')[0].value;
	console.log(uphone)
	if(uphone){//判断是否已经绑定手机
		getSign();
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
	var flag=/0?(13|14|15|18)[0-9]{9}/;
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
	var el=Zepto.loading({
        content:'正在加载中...'
    })
    setTimeout(function(){
        el.loading("hide");
    },1000);
    el.on("loading:hide",function(){
        mui('#block')[0].style.display='block';
    });
}

function judgePhoneType() {
    //判断设备是安卓还是苹果
    var browser = {
        versions: function() {
            var u = navigator.userAgent, app = navigator.appVersion;
            return {//移动终端浏览器版本信息
                trident: u.indexOf('Trident') > -1, //IE内核
                presto: u.indexOf('Presto') > -1, //opera内核
                webKit: u.indexOf('AppleWebKit') > -1, //苹果、谷歌内核
                gecko: u.indexOf('Gecko') > -1 && u.indexOf('KHTML') == -1, //火狐内核
                mobile: !!u.match(/AppleWebKit.*Mobile.*/) || !!u.match(/AppleWebKit/), //是否为移动终端
                ios: !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/), //ios终端
                android: u.indexOf('Android') > -1 || u.indexOf('Linux') > -1, //android终端或者uc浏览器
                iPhone: u.indexOf('iPhone') > -1 || u.indexOf('Mac') > -1, //是否为iPhone或者QQHD浏览器
                iPad: u.indexOf('iPad') > -1, //是否iPad
                webApp: u.indexOf('Safari') == -1 //是否web应该程序，没有头部与底部
            };
        }(),
        language: (navigator.browserLanguage || navigator.language).toLowerCase()
    };
    if (browser.versions.ios || browser.versions.iPhone || browser.versions.iPad) {
        return "ios";
    }
    else if (browser.versions.android) {
        return "android";
    }
}
