mui.init();
var code=getQueryString('code');//获取code
load();
var file;
mui.ajax(_url+'/wechat/wechatLogin',{//登陆获取用户信息
	data:{code:code},
	dataType:'json',//服务器返回json格式数据
	type:'post',//HTTP请求类型
	timeout:10000,//超时时间设置为10秒；
	headers:{'Content-Type':'application/json'},	              
	success:function(data){
		userId=data.uuid;
		token=data.token.token;
		getUserInfo(userId);
	},
    error:function(xhr,type,errorThrown){
	//异常处理；
		console.log(type);
	}
});

function readFile(_this){
	 file = _this.files[0];
     var reader = new FileReader();
     reader.readAsDataURL(file);
     reader.onload = function(e){
     	image=e.target.result;
     	mui('#headImg img')[0].src=image;
     	coverImg = new FormData();
     	coverImg.append('pic',file);
     	var blobImg=dataURLtoBlob(image);
     }
}

function getUserInfo(userId){
	mui.ajax(_url+'/user/show',{
		data:{userid:userId},
		dataType:'json',//服务器返回json格式数据
		type:'get',//HTTP请求类型
		timeout:10000,//超时时间设置为10秒；
		headers:{'Content-Type':'application/json',Authorization: 'Bearer '+token},	              
		success:function(data){
			el.loading("hide");
			avatarUrl=data.avatarUrl;
			displayName=data.displayName;
			gender=data.gender;
			birthday=data.birthday;
			description=data.description;
			mui('#headImg>img')[0].src=avatarUrl;
			mui('#nickName')[0].value=displayName;
			if(birthday){
				mui('#birthday')[0].value=birthday;
			}
			mui('#personalSign')[0].value=description;
			if(gender){
				mui('#sex')[0].value='男';
			}else{
				mui('#sex')[0].value='女';
			}
		},
    		error:function(xhr,type,errorThrown){
			//异常处理；
			console.log(type);
		}
	});
}


function sexPiker(){// 性别选择
	var sexPicker = new mui.PopPicker();
	sexPicker.setData([{value:'male',text:'男'},{value:'female',text:'女'}]);
	sexPicker.show(function(data) {
		mui('#sex')[0].value=data[0].text;
	})
}

function dtPiker(){
	var dtPicker = new mui.DtPicker({type:'date'}); 
    dtPicker.show(function (selectItems) { 
    		mui('#birthday')[0].value=selectItems.value;
    })
}

function submitClick(){
	var nickName=mui('#nickName')[0].value;
	var sex=mui('#sex')[0].value;
	var birthday=mui('#birthday')[0].value;
	var personalSign=mui('#personalSign')[0].value;
	if(nickName){
		if(sex){
			submit();
		}else{
			mui.toast('请选择性别',{ duration:'short', type:'div' }) 
		}
	}else{
		mui.toast('请输入昵称',{ duration:'short', type:'div' }) 
	}
}

function submit(){//提交个人资料,修改
	var displayName=mui('#nickName')[0].value;
	var description=mui('#personalSign')[0].value;
	var sex=mui('#sex')[0].value;
	var birthday=mui('#birthday')[0].value;
	if(sex=='男'){
		gender=true;
	}else{
		gender=false;
	}
	mui.ajax(_url+'/user/edit',{
		data:{
			displayName:displayName,
			description:description,
			gender:gender,
			birthday:birthday
		},
		dataType:'json',//服务器返回json格式数据
		type:'post',//HTTP请求类型
		timeout:10000,//超时时间设置为10秒；
		headers:{'Content-Type':'application/json',Authorization: 'Bearer '+token},	              
		success:function(data){
			mui.toast('修改成功',{ duration:'short', type:'div' }) ;
			if(file){
				upLoader();
			}
		},
    		error:function(xhr,type,errorThrown){
			mui.toast('修改失败',{ duration:'short', type:'div' }) 
		}
	})
}

function upLoader(){
	mui.ajax(_url+'upload/avatar',{
		data:coverImg,
		processData:false,
		contentType: false,
		dataType:'json',//服务器返回json格式数据
		type:'post',//HTTP请求类型
		timeout:10000,//超时时间设置为10秒；
		headers:{Authorization: 'Bearer '+token},	              
		success:function(data){
		},
    		error:function(xhr,type,errorThrown){
			mui.toast('修改头像失败',{ duration:'short', type:'div' }) 
		}
	})
}

function load(){//加载动画
	 el=Zepto.loading({
        content:'正在加载中...',
   })
    el.on("loading:hide",function(){
        mui('#block')[0].style.display='block';
    });
}

