(function () {
    document.addEventListener('DOMContentLoaded', function () {//设置根元素大小，实现自适应
        var html = document.documentElement;
        var windowWidth = html.clientWidth;
        html.style.fontSize = windowWidth / 3.75 + 'px';
    }, false);
})();
var _url="http://sbkt-port-1178495353.cn-north-1.elb.amazonaws.com.cn/";//开发环境相关地址
var bindUrl="http://shouboke.tv/weChat_web_develop/class/html/bindPhone.html";
//var _url='http://api-sbkt.lycam.tv/';//生产环境相关地址
//var bindUrl="http://shouboke.tv/class/html/bindPhone.html";
var uPhone='';
var videoCharge;
var cardMoney;
var cardData={};
var dataFlag;
var cardId=getQueryString('cardId')||sessionStorage.getItem('cardId');
function getQueryString(name) { //获取地址栏参数
    // 获取参数
    var url = window.location.search;
    // 正则筛选地址栏
    var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
    // 匹配目标参数
    var result = url.substr(1).match(reg);
    //返回参数值
    return result ? decodeURIComponent(result[2]) : null;
}

mui("body").on('tap','#download',function(){//下载链接
    window.location.href='http://a.app.qq.com/o/simple.jsp?pkgname=tv.lycam.pclass';
})

mui("body").on('tap','#downClose',function(){//关闭下载提示
    mui('#zz')[0].style.display='none';
    mui('#downTips')[0].style.display='none';
})

function showCard(){//显示邀请卡信息
    mui('#zz')[0].style.display='block';
    mui('#card')[0].style.display='block';
} 

function cardClose(){//关闭邀请卡信息
    mui('#zz')[0].style.display='none';
    mui('#card')[0].style.display='none';
}

String.prototype.trim=function(){//课程描述富文本排除空格
     return this.replace(/(^\s*)|(\s*$)/g,'');
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
        return "iphone";
    }
    else if (browser.versions.android) {
        return "android";
    }
}

function description(str){//重组课程描述
    var asploded=str.split('\n\n');
    var newStr='';
    if(asploded.length>0){
        for(var i=0;i<asploded.length;i++){
            var trimmed=asploded[i].trim();
            if(trimmed.length>0){
                trimmed=trimmed.replace("<br />","<br>");
                trimmed=trimmed.replace("<br/>","<br>");
                trimmed=trimmed.replace("<br>\n","<br>");
                trimmed=trimmed.replace("\n","<br>");
            }
            newStr+="<p>"+trimmed+"</p>";
        }
        return newStr;
    }else{
        return str;
    }
}

function getCard(){//获取邀请卡信息
    mui.ajax({
        type:'get',
        url:_url+'v4/card/show',
        headers:{Authorization: 'Bearer '+token},
        data:{cardId:cardId},
        success:function(data){
            mui('#coupon')[0].innerHTML=data.discountPercent+'折优惠券';
            if(data.discount==100){
                mui('#coupon')[0].innerHTML='免费优惠券';
            }
            cardMoney=data.money;
            cardData=data;
            sessionStorage.setItem('cardInfo',JSON.stringify(data));
            status=data.status;
            mui('#present span')[1].innerHTML=data.price;
            if(!data.has&&data.status!='expired'&&data.discount){
                sessionStorage.setItem('hasCard',true);
                mui('#price')[0].innerHTML='¥'+cardData.price;
                showCard();
            }else{
                sessionStorage.setItem('hasCard',false);
            }
        },
        error:function(err){
            var errText=JSON.parse(err.response).error_output;
            mui.toast(errText);
        }
    })
}

function loadInfo(data){//加载课程相关信息
    var newBind=sessionStorage.getItem('newBind');//新绑定用户标识
    var freeNewBind=sessionStorage.getItem('freeNewBind');//用户进入免费课程绑定
    if(newBind){
        mui('#downTips')[0].style.display='block';
        mui('#zz')[0].style.display='block';
    }
    console.log(data.stream.isSubscribe)
    if(freeNewBind&&!data.stream.isSubscribe){
        subscribe();
    }
    sessionStorage.setItem('newBind','');//取消标识
    sessionStorage.setItem('freeNewBind','');
    var items=data.child.items;
    sessionStorage.setItem('thumbnailUrl',data.stream.thumbnailUrl);
    document.title=data.stream.title;
    mui('#userName')[0].innerHTML=data.stream.user.displayName;
    mui('#classPrice')[0].innerHTML='¥'+data.stream.charge;
    mui('#coverImg img')[0].src=data.stream.thumbnailUrl;
    if(cardData&&!cardData.has&&cardData.status!='expired'&&cardData.discount){
        mui('#price')[0].innerHTML='¥'+cardData.price;
    }else{
        mui('#price')[0].innerHTML='¥'+data.stream.charge;
    }
    if(mui('#original')[0]){
        mui('#original')[0].innerHTML='原价：¥'+data.stream.charge;
    }
    videoCharge=data.stream.charge;
    ifCharge=data.stream.ifCharge;
    mui('#headImg img')[0].src=data.stream.user.avatarUrl;
    mui('#numCuont')[0].innerHTML='报名人数：'+data.stream.subscribeCount+'人';
    mui('#classInfo div')[0].innerHTML='课时：'+data.child.totalItems+'节';
    mui('#classInfo div')[1].innerHTML='分类：'+data.stream.category;
    mui('#title')[0].innerHTML=data.stream.title;
    var isSubscribe=data.stream.isSubscribe;
    pwd=data.stream.password;
    if(isSubscribe){//判断是否已经报名
        mui('#bottom')[0].style.display="none";
        viewLabel='观看';
        for(var i=0;i<items.length;i++){
            var videoStatus='.';
            if(items[i].title.length>17){
                items[i].title=items[i].title.substr(0,17)+'...';
            }
            if(items[i].status=='live'){
                videoStatus='.<span class="videoLabel">直播中</span>';
            }
            if(items[i].status=='pause'){
                videoStatus='.<span class="videoLabel" style="color:#f89422">暂停中</span>';
            }
            if(items[i].status=='ready'){
                viewLabel='<span style="color:#aeb2c6">未开播</span>';
            }
           mui('ul')[0].innerHTML+='<li id="'+items[i].streamId+'" isFreeWatch="yes" class="mui-table-view-cell"><div class="listLeft"><h5>'+(i+1)+videoStatus+items[i].title+'</h5><span class="timeStart">时间: '+items[i].startTime+'</span><span class="timeLength">预计'+items[i].duration+'</span></div><div class="listRight"><span class="viewTest">'+viewLabel+'</span><span class="mui-icon mui-icon-arrowright"></span></div></li>';
        }
    }else{
        viewLabel='观看';
        for(var i=0;i<items.length;i++){
            var videoStatus='.';
            if(items[i].title.length>17){
                items[i].title=items[i].title.substr(0,17)+'...';
            }
            if(items[i].status=='live'){
                videoStatus='.<span class="videoLabel">直播中</span>';
            }
            if(items[i].status=='pause'){
                videoStatus='.<span class="videoLabel" style="color:#f89422">暂停中</span>';
            }
            if(items[i].status=='ready'){
                viewLabel='<span style="color:#aeb2c6">未开播</span>';
            }
            if(items[i].isFreeWatch){
                mui('ul')[0].innerHTML+='<li id="'+items[i].streamId+'" isFreeWatch="yes" class="mui-table-view-cell"><div class="listLeft"><h5>'+(i+1)+videoStatus+items[i].title+'</h5><span class="timeStart">时间: '+items[i].startTime+'</span><span class="timeLength">预计'+items[i].duration+'</span></div><div class="listRight"><span class="viewTest">'+viewLabel+'</span><span class="mui-icon mui-icon-arrowright"></span></div></li>';
            }else{
                mui('ul')[0].innerHTML+='<li id="'+items[i].streamId+'" isFreeWatch="no" class="mui-table-view-cell"><div class="listLeft"><h5>'+(i+1)+videoStatus+items[i].title+'</h5><span class="timeStart">时间: '+items[i].startTime+'</span><span class="timeLength">预计'+items[i].duration+'</span></div><div class="listRight"><span class="mui-icon mui-icon-locked"></span><span class="mui-icon mui-icon-arrowright"></span></div></li>';
            }
        }
    }
    var source=data.stream.description;
    var newSource=description(source);
    mui('#desContent')[0].innerHTML=newSource;
    el.loading("hide");
    if(!isSubscribe&&data.stream.password&&!dataFlag){//当前系列课程为密码课
        mui("#block")[0].style.display="none";
        mui("#isPassword")[0].style.display="block";
        dataFlag=true;
        cardClose();
    }
    if(localStorage.remPwd){//判断团队课校验是否记住密码
        mui('#userName')[0].value=localStorage.phoneNum;
        mui('#password')[0].value=localStorage.password;
    }
}

function subscribe(){//免费报名
    var streamId=sessionStorage.getItem('streamId');
    var token=sessionStorage.getItem('token');
    var postData;
    var pwd=sessionStorage.getItem('password');
    if(pwd){
        if(cardData.discount==100){
            postData={
                streamId:streamId,
                password:pwd,
                cardId:cardId
            }
            createCard();
        }else{
            postData={
                streamId:streamId,
                password:pwd
            }
        }
    }else{
        if(cardData.discount==100){
            postData={
                streamId:streamId,
                cardId:cardId
            }
            createCard();
        }else{
            postData={
                streamId:streamId
            }
        }
    }
    mui.ajax({
        type:'post',
        url:_url+'stream/subscribe',
        headers:{Authorization: 'Bearer '+token},
        data:postData,
        success:function(data){
            if(data.success){
                mui('#bottom')[0].style.display='none';
                for(var i=0;i<mui('ul li').length;i++){
                    mui('ul li')[i].setAttribute('isFreeWatch','yes');
                    mui('ul li')[i].children[1].children[0].setAttribute('class','viewTest');
                    mui('ul li')[i].children[1].children[0].innerHTML='观看';
                }
                mui.toast('报名成功，请关注手播课微信公众号观看');
            }
        },
        error:function(){
            mui.toast('报名失败')
        }
    })
}


function teamIimit(){//团队权限校验
    var cardInfo=JSON.parse(sessionStorage.getItem('cardInfo'));
    $.ajax({
        url:_url +'login',
        data: {
            username:mui('#phoneNum')[0].value,
            password:mui('#password')[0].value
        },
        type: "post",
        success: function (data){
            uPhone=data.phone;
            sessionStorage.setItem('uPhone',uPhone);
            pageNumber=1;
            mui('#isTeam')[0].style.display='none';
            mui('#isTeam')[0].innerHTML='您不是该团队的成员，无观看权限';
            sessionStorage.setItem('token',data.token.token);
            if(cardInfo&&!cardInfo.has){
                showCard();
            }
            getClass();
        },
        error: function (error) {
            console.log(error);
            var err=JSON.parse(error.response).error_output;
            mui.toast(err)
        }
    });
}

function checkPwd(pwd){//验证密码是否正确
    var streamId=sessionStorage.getItem('streamId');
    var token=sessionStorage.getItem('token');
    var cardInfo=JSON.parse(sessionStorage.getItem('cardInfo'));
    mui.ajax({
        url:_url+'stream/checkPassword',
        headers:{Authorization: 'Bearer '+token},
        data:{
            streamId:streamId,
            password:pwd
        },
        success:function(data){
            if(data.success){
                mui("#isPassword")[0].style.display="none";
                el.loading("hide");
                if(cardInfo&&!cardInfo.has){
                    showCard();
                }
                // loadInfoAgain(myData);
            }else{
                mui.toast('密码错误');
            }
        },
        error:function(){
            mui.toast('密码错误');
        }
    })
}

mui("#isTeam").on('tap','#login',function(){
    if(document.getElementById("remPwd").checked){
        localStorage.remPwd=true;
        localStorage.phoneNum=mui('#phoneNum')[0].value;
        localStorage.password=mui('#password')[0].value;
    }else{
        localStorage.remPwd=false;
        localStorage.phoneNum='';
        localStorage.password='';
    }
    teamIimit();
})


function load(){//加载动画
    el=Zepto.loading({
        content:'正在加载中...',
    })
    el.on("loading:hide",function(){
        mui('#block')[0].style.display='block';
        // showCard();
    });
}

function createCard(){//将该课程优惠券与该用户绑定
    var token=sessionStorage.getItem('token');
    var cardInfo=JSON.parse(sessionStorage.getItem('cardInfo'));
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
