mui.init();
load();
mui(".mui-content").on('tap','#getYzCode',function(){//获取验证码
	tel=mui('#tel')[0].value;
	var flag=/0?(13|14|15|18)[0-9]{9}/;
	var psd=/^(?=.*[0-9])(?=.*[a-zA-Z]).{8,16}$/;
	if(flag.test(tel)){
		if(psd.test(mui('#pwd')[0].value)){
			sendCode();
		}else{
			mui.toast('密码至少是字母、数字的组合,8-16位字符',{ duration:'short', type:'div' })
		}
	}else{
		mui.toast('请输入正确的手机号',{ duration:'short', type:'div' })
	}
}) 

var code=getQueryString('code');//获取code
mui.ajax(_url+'/wechat/wechatLogin',{//获取token
	data:{code:code},
	dataType:'json',//服务器返回json格式数据
	type:'post',//HTTP请求类型
	timeout:10000,//超时时间设置为10秒；
	headers:{'Content-Type':'application/json'},	              
	success:function(data){
		uphone=data.phone;
		token=data.token.token;
		if(uphone){
			sessionStorage.setItem('token',token)
			location.href='../html/createClass.html';
		}
	},
    error:function(xhr,type,errorThrown){
	//异常处理；
		console.log(type);
	}
});


function sendCode(){
	var tel=mui('#tel')[0].value;
	mui.ajax(_url+'sms/getCode?phone='+tel+"&type=binding",{
		dataType:'json',//服务器返回json格式数据
		type:'get',//HTTP请求类型
		timeout:10000,//超时时间设置为10秒；
		headers:{'Content-Type':'application/json',Authorization: 'Bearer '+token},	              
		success:function(data){
			hasCode();
		},
    		error:function(xhr,type,errorThrown){
		//异常处理；
			mui.toast('获取验证码失败',{ duration:'short', type:'div' })
		}
	});
}

function hasCode(){//获取验证码成功
  var timeCount=180;
  mui('#getYzCode')[0].innerHTML=timeCount+'s后失效';
  var countTimer=setInterval(function(){
  	timeCount--;
  	if(timeCount<=0){
  		mui('#getYzCode')[0].innerHTML='重新发送';
  		clearInterval(countTimer)
  	}else{
  		mui('#getYzCode')[0].innerHTML=timeCount+'s后失效';
  	}
  },1000)
}

mui(".mui-content").on('tap','#bind',function(){//绑定手机号
	if(mui('#yzCode')[0].value.length==6){
		mui('#yzCode')[0].blur();
		verifyCode();
	    bindLoad=Zepto.loading({
        		content:'正在加载中...',
    		});
    		mui('#bind')[0].setAttribute('class','mui-btn mui-btn-primary mui-disabled');
	}else{
		mui.toast('请完整填写验证码',{ duration:'short', type:'div' })
	}
}) 

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

function verifyCode(){//验证验证码
	var yzCode=mui('#yzCode')[0].value;
	mui.ajax(_url+'/sms/verifyCode',{
		dataType:'json',//服务器返回json格式数据
		type:'post',//HTTP请求类型
		timeout:10000,//超时时间设置为10秒；
		headers:{'Content-Type':'application/json',Authorization: 'Bearer '+token},	
		data:{phone:tel,authCode:yzCode,type:'binding'},
		success:function(data){
			bind();
		},
    		error:function(xhr,type,errorThrown){
		//异常处理；
			bindLoad.loading("hide");
			mui('#bind')[0].setAttribute('class','mui-btn mui-btn-primary');
			mui.toast('验证码错误',{ duration:'short', type:'div' })
		}
	});	
}

function bind(){//绑定手机
	mui.ajax(_url+'/user/bindPhone',{
		dataType:'json',//服务器返回json格式数据
		type:'post',//HTTP请求类型
		timeout:10000,//超时时间设置为10秒；
		headers:{'Content-Type':'application/json',Authorization: 'Bearer '+token},	
		data:{phone:tel,password:mui('#pwd')[0].value},
		success:function(data){
			bindLoad.loading("hide");
			mui('#bind')[0].setAttribute('class','mui-btn mui-btn-primary');
			location.href='https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx18e63e75d50cb458&redirect_uri=http://shouboke.tv%2fclass%2fhtml%2fcreateClass.html&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect';
		},
    		error:function(xhr,type,errorThrown){
		//异常处理；
			bindLoad.loading("hide");
			mui('#bind')[0].setAttribute('class','mui-btn mui-btn-primary');
			mui.toast('绑定失败',{ duration:'short', type:'div' })
		}
	});	
}
