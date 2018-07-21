mui.init({
  pullRefresh : {
    container:"#list",//下拉刷新容器标识，querySelector能定位的css选择器均可，比如：id、.class等
    down : {
      height:50,//可选,默认50.触发下拉刷新拖动距离,
      auto: false,//可选,默认false.首次加载自动下拉刷新一次
      contentdown : "下拉可以刷新",//可选，在下拉可刷新状态时，下拉刷新控件上显示的标题内容
      contentover : "释放立即刷新",//可选，在释放可刷新状态时，下拉刷新控件上显示的标题内容
      contentrefresh : "正在刷新...",//可选，正在刷新状态时，下拉刷新控件上显示的标题内容
      callback :pulldown //必选，刷新函数，根据具体业务来编写，比如通过ajax从服务器获取新数据；
    },
    up : {
      height:50,//可选.默认50.触发上拉加载拖动距离
      auto:false,//可选,默认false.自动上拉加载一次
      contentrefresh : "正在加载...",//可选，正在加载状态时，上拉加载控件上显示的标题内容
      contentnomore:'没有更多数据了',//可选，请求完毕若没有更多数据时显示的提醒内容；
      callback :pullup //必选，刷新函数，根据具体业务来编写，比如通过ajax从服务器获取新数据；
    }
  }
});

var code=getQueryString('code');//获取code
load();

mui("#list").on('tap','.mui-table-view-cell',function(){//为视频列表添加事件实现页面跳转
  //获取id
  var id = this.getAttribute("id");
  window.location.href='https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx18e63e75d50cb458&redirect_uri=http://shouboke.tv/shareModel/index.html&response_type=code&scope=snsapi_base&state='+id;
}) 

var page=2;//上拉加载页数，默认为2
var token=sessionStorage.getItem('token');
if(!token){
	mui.ajax(_url+'/wechat/wechatLogin',{//登陆获取用户信息
		data:{code:code},
		dataType:'json',//服务器返回json格式数据
		type:'post',//HTTP请求类型
		timeout:10000,//超时时间设置为10秒；
		headers:{'Content-Type':'application/json'},	              
		success:function(data){
			userId=data.uuid;
			token=data.token.token;
			sessionStorage.setItem('token',token);
			pulldown();
		},
    		error:function(xhr,type,errorThrown){
			//异常处理；
		}
	});
}else{
	pulldown();
}

function pulldown(){//下拉刷新
	mui.ajax(_url+'/user/subscriptions?resultsPerPage=10&page=1',{
		dataType:'json',//服务器返回json格式数据
		type:'get',//HTTP请求类型
		timeout:10000,//超时时间设置为10秒；
		headers:{'Content-Type':'application/json',Authorization: 'Bearer '+token},	              
		success:function(data){
			mui('#list ul')[0].innerHTML='';
			for(var i=0;i<data.items.length;i++){
				if(data.items[i].title.length>18){
					data.items[i].title=data.items[i].title.substr(0,15)+'...';
				}
				if(data.items[i].user.displayName.length>3){
					data.items[i].user.displayName=data.items[i].user.displayName.substr(0,2)+'...';
				}
				mui('#list ul')[0].innerHTML+='<li id="'+data.items[i].streamId+'" class="mui-table-view-cell"><div class="listLeft"><img src="'+data.items[i].thumbnailUrl+'"/></div><div class="listRight"><div class="classTitle"><p>'+data.items[i].title+'</p></div><div class="userHead"><img src="'+data.items[i].user.avatarUrl+'"/></div><div class="uname">'+data.items[i].user.displayName+'</div><div class="createTime">'+data.items[i].startTime+'</div></div></li>';
			}
			page=2;
			mui('#list').pullRefresh().endPulldownToRefresh();
			mui('#list').pullRefresh().refresh(true);
			el.loading("hide");
		},
    		error:function(xhr,type,errorThrown){
		//异常处理；
			mui.toast('获取数据失败',{ duration:'short', type:'div' }) 
		}
	});
}

function pullup(){//上拉加载
	mui.ajax(_url+'/user/subscriptions?resultsPerPage=10&page='+page,{
		dataType:'json',//服务器返回json格式数据
		type:'get',//HTTP请求类型
		timeout:10000,//超时时间设置为10秒；
		headers:{'Content-Type':'application/json',Authorization: 'Bearer '+token},	              
		success:function(data){
			for(var i=0;i<data.items.length;i++){
				if(data.items[i].title.length>18){
					data.items[i].title=data.items[i].title.substr(0,15)+'...';
				}
				if(data.items[i].user.displayName.length>3){
					data.items[i].user.displayName=data.items[i].user.displayName.substr(0,2)+'...';
				}
				mui('#list ul')[0].innerHTML+='<li id="'+data.items[i].streamId+'" class="mui-table-view-cell"><div class="listLeft"><img src="'+data.items[i].thumbnailUrl+'"/></div><div class="listRight"><div class="classTitle"><p>'+data.items[i].title+'</p></div><div class="userHead"><img src="'+data.items[i].user.avatarUrl+'"/></div><div class="uname">'+data.items[i].user.displayName+'</div><div class="createTime">'+data.items[i].startTime+'</div></div></li>';
			}
			if(data.nextPageAvailable){
				page++;
			}
			mui('#list').pullRefresh().endPullupToRefresh(!data.nextPageAvailable);//结束下拉操作
		},
    		error:function(xhr,type,errorThrown){
		//异常处理；
			mui.toast('获取数据失败',{ duration:'short', type:'div' }) 
		}
	});	
}

function load(){//加载动画
	 el=Zepto.loading({
        content:'正在加载中...',
   })

    el.on("loading:hide",function(){
        mui('#block')[0].style.display='block';
    });
}

