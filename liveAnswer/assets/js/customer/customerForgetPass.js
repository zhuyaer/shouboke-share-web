/**
 * Created by lycamhost on 16/11/16.
 */



$(function(){
    $('form :input').blur(function(){
        var $parent = $(this).parent();
        $parent.find(".tip").remove();
        //验证手机号码
        if( $(this).is('#phoneNum') ){
            if( this.value=="" || ( this.value!="" && !/^(13[0-9]|15[012356789]|17[678]|18[0-9]|14[57])[0-9]{8}$/.test(this.value) ) ){
                var errorMsg = '请输入正确的电话号码.';
                $parent.append('<div class="tip error">'+errorMsg+'</div>');
            }
        }
        //验证码
        if( $(this).is('#confirmCode') ){
            if( this.value=="" || this.value.length < 6){
                var errorMsg = '请输入手机收到的6位验证码。';
                $parent.append('<div class="tip error">'+errorMsg+'</div>');
            }
        }

        //输入密码
        if( $(this).is('#password') ){
            var reg = /^(?=.*[0-9])(?=.*[a-zA-Z]).{8,16}$/;
            if(!reg.test(this.value)){
                var errorMsg = '至少是字母、数字的组合，可以输入特殊字符,8-16位字符。';
                $parent.append('<div class="tip error">'+errorMsg+'</div>');
            }
        }
        //验证密码
        if( $(this).is('#confirmPsw') ){
            var password = $('#password').val();
            if( this.value=="" ||(this.value != password) ){
                var errorMsg = '请再次输入密码，两次输入密码必须一致。';
                $parent.append('<div class="tip error">'+errorMsg+'</div>');
            }
        }

    });//end blur

});

// =============================================================向手机发送验证码 start

var InterValObj; //timer变量，控制时间
var curCount;//当前剩余秒数
var _this={};

function sendMessage() {

    var count = 60; //间隔函数，1秒执行
    var phoneNum=$("#phoneNum").val();//手机号码
    curCount = count;
    if(phoneNum != ""){

        //设置button效果，开始计时
        $("#getCode").attr("disabled", "true");
        $("#getCode").val( curCount + "s");
        InterValObj = window.setInterval(SetRemainTime, 1000); //启动计时器，1秒执行一次

        //向用户发送验证码
        $.ajax({
            type: "POST", //用POST方式传输
            dataType: "text", //数据格式:JSON
            url: $.customerServerHttp+'/sms/getSmsCode', //目标地址
            data: {
                phone : phoneNum,
                type : "forget_password"
            },
            error: function () { },
            success: function (){ }
        });
    }else{
        alert("手机号码不能为空！");
    }
}

//timer处理函数
function SetRemainTime() {
    if (curCount == 0) {
        window.clearInterval(InterValObj);//停止计时器
        $("#getCode").removeAttr("disabled");//启用按钮
        $("#getCode").val("重新获取");
        code = ""; //清除验证码。如果不清除，过时间后，输入收到的验证码依然有效
    }
    else {
        curCount--;
        $("#getCode").val(curCount + "s");
    }
}
// =============================================================向手机发送验证码 end


// ==========================验证验证码 start
function submitVerify(){

    var phoneNum = $("#phoneNum").val();
    var authCode = $("#authCode").val();

    if(phoneNum == ''){
        alert("手机号不能为空!");
    }else if(authCode == ''){
        alert("验证码不能为空!");
    }else{
        $.ajax({
            type: "POST", //用POST方式传输
            dataType: "json",
            url: $.customerServerHttp+'/sms/verifySmsCode', //目标地址
            data: {
                phone : phoneNum,
                authCode : authCode,
                type : "forget_password"
            },
            error: function (error){
                console.log(JSON.stringify(error));
                alert("验证码输入错误!");
            },
            success: function (data){
                console.log(data);
                localStorage.setItem("customerName",phoneNum);
                console.log("phoneNum",phoneNum);
                window.location.href = "customerForgetPass2.html";
            }
        });
    }
}
// ==========================验证验证码 end



//   ===========================================修改密码 start

function changePsw(){
    var params = {};
    var password = $("#password").val();
    var confirmPassword = $("#confirmPsw").val();
    var username = localStorage.getItem("customerName");
    console.log("username",username);
    params.password = password;
    params.phone = username;

    var reg = /^(?=.*[0-9])(?=.*[a-zA-Z]).{8,16}$/;

    if (!reg.test(password)){
        alert("新密码不能为空,且至少是字母、数字的组合，可以输入特殊字符,8-16位字符。");
        return;
    }else if(confirmPassword == '' || (password != confirmPassword)){
        alert("确认密码不能为空且必须与新密码一致。");
        return;
    }else if((password != '') && (confirmPassword != '') && (password == confirmPassword)){
        $.ajax({
            type: "POST", //用POST方式传输
            dataType: "json",
            url: $.customerServerHttp+'/dealer/setPassword', //目标地址
            data: params,
            success: function (){
                window.location.href = "customerForgetPass3.html";
            },
            error: function (error) {
                console.log(error);
                alert(JSON.parse(error.responseText).error_description);
            }
        });
    }else {
        alert("确认密码与新密码不一致,请重新输入!")
    }

}

//   ===========================================修改密码 end
