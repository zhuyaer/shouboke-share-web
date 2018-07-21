/**
 * Created by lycamhost on 16/11/3.
 */

$(function () {

    $("#getCode").click(function () {
        sendMessage()
    });

    // =============================================================向手机发送验证码

    var InterValObj; //timer变量，控制时间
    var curCount;//当前剩余秒数
    var count = 60; //间隔函数，1秒执行

    function sendMessage() {
        var phoneNumber=$("#phoneNumber").val();//手机号码
        curCount = count;
        if(phoneNumber != ""){

            //设置button效果，开始计时
            $("#getCode").attr("disabled", "true");
            $("#getCode").val( curCount + "s");
            InterValObj = window.setInterval(SetRemainTime, 1000); //启动计时器，1秒执行一次

            // 向后台发送处理数据
            $.ajax({
                type: "get",
                dataType: "text", //数据格式:JSON
                url: $.customerServerHttp+'/sms/getSmsCode', //目标地址
                data: {
                    phone : phoneNumber,
                    type : "register"
                },
                success: function (){ },
                error: function (error) {
                    console.log(error);
                }
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

    //   =========================================================表单验证 start
    $('form :input').blur(function(){
        var $parent = $(this).parent();
        $parent.find(".tip").remove();
        //验证手机号码
        if( $(this).is('#phoneNumber') ){
            if( this.value=="" || ( this.value!="" && !/^(13[0-9]|15[012356789]|17[678]|18[0-9]|14[57])[0-9]{8}$/.test(this.value) ) ){
                var errorMsg = '请输入正确的电话号码.';
                $parent.append('<div class="tip">'+errorMsg+'</div>');
            }
        }
        //验证码
        if( $(this).is('#verifyCode') ){
            if( this.value=="" || this.value.length < 6){
                var errorMsg = '请输入手机收到的6位验证码。';
                $parent.append('<div class="tip">'+errorMsg+'</div>');
            }
        }
        //输入密码
        if( $(this).is('#password') ){
            var reg = /^(?=.*[0-9])(?=.*[a-zA-Z]).{8,16}$/;
            // if( this.value=="" || this.value.length < 8 || this.value.length>16){
            if(!reg.test(this.value)){
                var errorMsg = '至少是字母、数字的组合，可以输入特殊字符,8-16位字符。';
                $parent.append('<div class="tip">'+errorMsg+'</div>');
            }
        }
        //验证密码
        if( $(this).is('#confirmPassword') ){
            var password = $('#password').val();
            if( this.value=="" ||(this.value != password) ){
                var errorMsg = '请再次输入密码，两次输入密码必须一致。';
                $parent.append('<div class="tip">'+errorMsg+'</div>');
            }
        }
    })

    //  =====================================================向后台提交表单
    $("#register").click(function () {
        var phoneNumber = $("#phoneNumber").val();
        var password = $("#password").val();
        var confirmPassword = $("#confirmPassword").val();
        var verifyCode = $("#verifyCode").val();

        var reg = /^(?=.*[0-9])(?=.*[a-zA-Z]).{8,16}$/;

        if( phoneNumber == '' || ( phoneNumber != "" && !/^(13[0-9]|15[012356789]|17[678]|18[0-9]|14[57])[0-9]{8}$/.test(phoneNumber) )){
            alert("请输入正确的手机号!");
        }else if( verifyCode == "" || verifyCode.length <6){
            alert("请输入手机收到的六位验证码!");
        }else if(password == "" || (!reg.test(password))){
            alert("至少是字母、数字的组合，可以输入特殊字符,8-16位字符。");
        }else if(confirmPassword == "" || (password != confirmPassword)){
            alert("请输入确认密码,并且两次输入的密码必须一致!")
        }else{
            $.ajax({
                type: "POST", //用POST方式传输
                dataType: "json", //数据格式:JSON
                url: $.customerServerHttp+'/sms/verifySmsCode', //目标地址
                data: {
                    phone : phoneNumber,
                    authCode : $("#verifyCode").val(),
                    type : "register"
                },
                error: function () {
                    console.log(error);
                },
                success: function (){
                    $.ajax({
                        type: "POST", 
                        dataType: "JSON", 
                        url: $.customerServerHttp+'/dealer/register', 
                        data:{
                            phone:phoneNumber,
                            password:password
                        },
                        success: function (data){
                            console.log("customerRegisterSuccess",data);
                            $.ajax({  //register success -> login default
                                url: $.customerServerHttp+'/dealer/login',
                                data: {
                                    username:phoneNumber,
                                    password:password
                                },
                                type: "post",
                                success: function (data){
                                    console.log("loginSuccessData",data);
                                    localStorage.setItem("customerName",phoneNumber);
                                    localStorage.setItem("customerPassword",password);
                                    localStorage.setItem("customerInfo",JSON.stringify(data));
                                    window.location.href = "customerUserInfo.html";
                                },
                                error: function (error) {
                                    console.log("loginError",error);
                                }
                            });
                        },
                        error: function (error) {
                            console.log("registerError",error);
                            // alert(JSON.stringify(error));
                            // alert("手机号已经注册,请输入未注册的手机号。");
                        }
                    });
                }
            });
        }
    });

    // =========================================没有勾选同意协议,则不能点击注册按钮
    $('#agree').click(function(){
        // console.log(typeof ($('#agree').val()));
        if($('#agree').val()== '0'){
            $('#agree').attr('value','1');
            $('#register').removeAttr("disabled");
        }else{
            $('#agree').attr('value','0');
            $('#register').attr('disabled','disabled');
        }
    });
});
