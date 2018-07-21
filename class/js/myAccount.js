mui.init();
load();
var redirectUrl='https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx18e63e75d50cb458&redirect_uri=http://shouboke.tv/weChat_web_develop/class/html/myAccount.html&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect';
var code=getQueryString('code');//获取code
sessionStorage.setItem('code',code);
wechatLogin();
function wechatLogin(){
	mui.ajax(_url+'/wechat/wechatLogin',{//登陆获取用户信息
		data:{code:code},
		dataType:'json',//服务器返回json格式数据
		type:'post',//HTTP请求类型
		timeout:10000,//超时时间设置为10秒；
		headers:{'Content-Type':'application/json'},
		success:function(data){
			for(var i=0;i<data.thirdpart.length;i++){
				if(data.thirdpart[i].type=='wx')
					var openId=data.thirdpart[i].openid;
				var unionid=data.thirdpart[i].unionid;
			}
			sessionStorage.setItem('unionid',unionid);
			sessionStorage.setItem('openId',openId);
			sessionStorage.setItem('userId',data.id);
			sessionStorage.setItem('token',data.token.token);
			getInfo();//获取用户账户数据
		},
		error:function(xhr,type,errorThrown){
			//异常处理；
			location.href=redirectUrl;
		}
	});
}

function getInfo(){
	var token=sessionStorage.getItem('token');
	mui.ajax(_url+'/v4/income/account',{//登陆获取用户信息
		dataType:'json',//服务器返回json格式数据
		type:'get',//HTTP请求类型
		timeout:10000,//超时时间设置为10秒；
		headers:{Authorization: 'Bearer '+token},
		success:function(data){
			console.log(data);
			sessionStorage.setItem('totalIncome',data.availableMoney);//可提现金额
			mui('#income h4')[0].innerHTML=data.totalMoney;
			mui('#balance h4')[0].innerHTML=Math.round(data.remainTime);//剩余分钟数
			sessionStorage.setItem('totleTime',Math.round(data.remainTime));
			mui('#incomeInfo p')[0].innerHTML=data.subsMoney;
			mui('#incomeInfo p')[2].innerHTML=data.dstorMoney;
			mui('#incomeInfo p')[4].innerHTML=data.drawedMoney;
			mui('#income h5')[1].innerHTML='可提现 '+data.availableMoney;
			el.loading("hide");
		},
		error:function(xhr,type,errorThrown){
			//异常处理；
			mui.toast('获取数据失败');
		}
	});
}

function rechargeClick(){
	location.href='./accountRecharge.html';
}

function withdrawals(){
	window.location.href='./cash.html';
}

function load(){//加载动画
	el=Zepto.loading({
        content:'正在加载中...'
    })
    el.on("loading:hide",function(){
        mui('#block')[0].style.display='block';
    });
}

