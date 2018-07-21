/**
 * Created by laikanz on 17/6/28.
 */
mui.init();
var jq=$.noConflict();
load();
var classLength='0.5h';
var viewType='no';//观看范围
var coverImg='';//视频封面
var image='';
var file;
var viewFlag=false;//观看权限是否已指定
function readFile(_this){
	 file = _this.files[0];
     var reader = new FileReader();
     reader.readAsDataURL(file);
     reader.onload = function(e){
     	image=e.target.result;
     	mui('#view')[0].src=image;
     	coverImg = new FormData();
     }
}

 var typePicker = new mui.PopPicker();
 typePicker.setData([{value: "其他",text: "其他"}, {value: "摄影",text: "摄影"}, {value: "旅行",text: "旅行"}, {value: "教育",text: "教育"}, {value: "艺术",text: "艺术"}, {value: "美食",text: "美食"}, {value: "职场",text: "职场"}])

var lengthPicker = new mui.PopPicker();
 lengthPicker.setData([{value: "0.5h",text: "0.5 h"}, {value: "1.0h",text: "1.0 h"}, {value: "1.5h",text: "1.5 h"}, {value: "2.0h",text: "2.0 h"}, {value: "2.5h",text: "2.5 h"}, {value: "3.0h",text: "3.0 h"}, {value: "3.5h",text: "3.5 h"}, {value: "4.0h",text: "4.0 h"}, {value: "4.5h",text: "4.5 h"}, {value: "5.0h",text: "5.0 h"}])

function typePiker(){//类型选择控件
	typePicker.show(function(data) {
		mui('#classType')[0].value=data[0].value;
	})
}

function lengthPiker(){//课程时长选择控件
	lengthPicker.show(function(data) {
		mui('#classLength')[0].value=data[0].text;
		classLength=data[0].value;
		console.log(classLength)
	})
}

var dtPicker = new mui.DtPicker(); 
function timePiker(){
	 dtPicker.show(function (selectItems) {  
     	mui('#time')[0].value=selectItems.text;
    })
}

function chooseRange(){//选择直播观众范围，谁可以看
	mui('#block')[0].style.display='none';
	mui('#range')[0].style.display='block';
}

function closePanel(){//关闭范围选择
	mui('#block')[0].style.display='block';
	mui('#range')[0].style.display='none';
}

function openTeam(){//打开团队选择
	mui('#chooseTeam')[0].style.display='block';
	mui('#range')[0].style.display='none';
	viewType='team';
	getTeam();
}

function closeTeam(){//关闭团队
	mui('#chooseTeam')[0].style.display='none';
	mui('#block')[0].style.display='none';
	mui('#range')[0].style.display='block';
}

var code=getQueryString('code');//获取code
var token=sessionStorage.getItem('token');
if(!token){//如果没有授权，则申请授权
	mui.ajax(_url+'/wechat/wechatLogin',{//获取token
		data:{code:code},
		dataType:'json',//服务器返回json格式数据
		type:'post',//HTTP请求类型
		timeout:10000,//超时时间设置为10秒；
		headers:{'Content-Type':'application/json'},	              
		success:function(data){
			token=data.token.token;
			for(var i=0;i<data.thirdpart.length;i++){
				if(data.thirdpart[i].type='wx'){
					var accessToken=data.thirdpart[i].access_token;
				}
			}
		},
    		error:function(xhr,type,errorThrown){
		//异常处理；
			console.log(type);
		}
	});
}


function getTeam(){//获取个人团队信息
	mui.ajax(_url+'/user/team/list',{
	dataType:'json',//服务器返回json格式数据
	type:'get',//HTTP请求类型
	timeout:10000,//超时时间设置为10秒；
	headers:{'Content-Type':'application/json',Authorization: 'Bearer '+token},	              
	success:function(data){
		mui('#teamList ul')[0].innerHTML='';
		for(var i=0;i<data.items.length;i++){
			mui('#teamList ul')[0].innerHTML+='<li class="mui-table-view-cell"><div class="mui-input-row mui-checkbox mui-left"><label class="center">'+data.items[i].name+'</label><input name="team" value="'+data.items[i].teamId+'" type="checkbox"></div></li>'
		}
	},
    error:function(xhr,type,errorThrown){
	//异常处理；
		console.log(type);
	}
	});
}

function getTeamList(){//点击完成，获取团队列表
    var checkedTeam=document.getElementsByName("team"); 
    teamList='';
    for(var i=0;i<checkedTeam.length;i++){
       if(checkedTeam[i].checked){
         teamList+=checkedTeam[i].value+",";
       }
     }
    teamList=teamList.substr(0,teamList.length-1);
    if(checkedTeam.length<1){
    	 teamList='';
    }
    console.log(teamList)
   if(teamList){
   	closeTeam();
   }else{
   	mui.toast('您还未指定团队',{ duration:'short', type:'div' }) 
   }
}

function inputPwd(){//选择密码输入
	mui('#pwd')[0].focus();
	viewType='pwd';
}

function choosePublic(){//选择公开方式
	viewType='public';
}

function over(){//完成观看范围选择
	if(viewType=='public'){
		mui('#viewer')[0].innerHTML='公开';
		viewFlag=true;
		closePanel();
	}else if(viewType=='pwd'){
		if(mui('#pwd')[0].value.length<6){
			 mui.toast('请填写完整密码',{ duration:'short', type:'div' }) 
		}else{
			password=mui('#pwd')[0].value;
			viewFlag=true;
			mui('#viewer')[0].innerHTML='密码';
			closePanel();
		}
	}else if(viewType=='team'&&teamList){
		mui('#viewer')[0].innerHTML='团队';
		viewFlag=true;
		closePanel();
	}else if(!teamList){
		 mui.toast('您还未选择团队',{ duration:'short', type:'div' }) 
	}else{
		mui.toast('您还未指定观看权限',{ duration:'short', type:'div' }) 
	}
}

function submit(){//立即开播
	var className=mui('#name')[0].value;
	var liveTime=mui('#time')[0].value;
	var classLength=mui('#classLength')[0].value;
	var classType=mui('#classType')[0].value;
	console.log(coverImg)
	if(coverImg){
		if(className&&className.length>=2&&className.length<=32){
			if(classType){
				if(viewFlag){
					var data=getData();
					subData();
					subLoad=Zepto.loading({
       					content:'正在创建...',
    					});
    					mui('#liveButton')[0].setAttribute('class','mui-disabled');
				}else{
					mui.toast('您还未指定观看权限',{ duration:'short', type:'div' }) 
				}
			}else{
				mui.toast('您还未选择课程分类',{ duration:'short', type:'div' }) 
			}
		}else{
			mui.toast('课程名称应在2到32个字符之间',{ duration:'short', type:'div' }) 
		}
	}else{
		mui.toast('您还未上传视频封面',{ duration:'short', type:'div' }) 
	}
}

function getData(){//获取用户提交信息
	var className=mui('#name')[0].value;
	var liveTime=mui('#time')[0].value;
	if(!mui('#time')[0].value){
		var now=new Date();
        var year=now.getFullYear();     
        var month=now.getMonth()+1;
        if(month<10){
        		month='0'+month;
        }
        var day=now.getDate();     
        var hour=now.getHours();     
        var minute=now.getMinutes();  
        var liveTime=year+'-'+month+'-'+day+' '+hour+':'+minute;
	}
	var classType=mui('#classType')[0].value;
	var classPrice=mui('#classPrice')[0].value+'';
	var description=mui('#description')[0].value;
	if(classPrice==0||classPrice==''){
		var ifCharge='false';
		var classPrice='0';
	}else{
		var ifCharge='true';
	}
	if(viewType=='public'||viewType=='no'){
		data={
			category:classType,
			privacy:'fasle',
			ifCharge:ifCharge,	
			charge:classPrice,
			predictAudience:10,
			title:className,
			startTime:liveTime,
			duration:classLength,
			description:description
		}
	}else if(viewType=='team'){
		data={
			category:classType,
			privacy:'true',
			ifCharge:ifCharge,	
			teamId:teamList,
			charge:classPrice,
			predictAudience:10,
			title:className,
			startTime:liveTime,
			duration:classLength,
			description:description
		}
	}else if(viewType=='pwd'){
		data={
			category:classType,
			privacy:'false',
			ifCharge:ifCharge,	
			password:password,
			charge:classPrice,
			predictAudience:10,
			title:className,
			startTime:liveTime,
			duration:classLength,
			description:description
		}
	}
	return data;
}

function subData(){//提交数据，创建课程
	mui.ajax(_url+'/3/stream/create',{
	dataType:'json',//服务器返回json格式数据
	type:'post',//HTTP请求类型
	data:data,
	timeout:10000,//超时时间设置为10秒；
	headers:{'Content-Type':'application/json',Authorization: 'Bearer '+token},	              
	success:function(data){
		console.log(data);
		streamId=data.streamId;
		coverImg.append('streamId',streamId);
		coverImg.append('pic', file);
		imgUploader();
	},
    error:function(xhr,type,errorThrown){
	//异常处理；
	console.log(xhr)
		subLoad.loading('hide');
		mui('#liveButton')[0].setAttribute('class','');
		mui.toast(JSON.parse(xhr.response).error_description,{ duration:'short', type:'div' })
	}
	});
}

function imgUploader(result){//上传封面图
	jq.ajax({
	url:_url+'/upload/thumbnail',
	dataType:'json',//服务器返回json格式数据
	processData:false,
	contentType: false,
	data:coverImg,
	type:'post',//HTTP请求类型
	timeout:10000,//超时时间设置为10秒；
	headers:{Authorization: 'Bearer '+token},	
	success:function(data){
		subLoad.loading('hide');
		mui('#liveButton')[0].setAttribute('class','');
		mui.confirm('请下载app开启直播','创建成功',function(e){
			if(e.index==1){
				location.href='http://a.app.qq.com/o/simple.jsp?pkgname=tv.lycam.pclass';
			}else{
				mui.toast('课程已创建，请下载开启直播',{ duration:'short', type:'div' }) 
			}
		})
	},
    error:function(xhr,type,errorThrown){
	//异常处理；
		subLoad.loading('hide');
		mui('#liveButton')[0].setAttribute('class','');
		mui.toast('封面图上传失败',{ duration:'short', type:'div' }) ;
		mui.confirm('请下载app开启直播','创建成功',function(e){
			if(e.index==1){
				location.href='http://a.app.qq.com/o/simple.jsp?pkgname=tv.lycam.pclass';
			}else{
				mui.toast('课程已创建，请下载开启直播',{ duration:'short', type:'div' }) 
			}
		})
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

