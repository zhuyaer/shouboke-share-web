/**
 * Created by lycamhost on 16/11/4.
 */

$(function(){

    //页面初始化时判断本地是否保存用户的用户名和密码,若有,则自动登录
    var customerName = localStorage.getItem("customerName");
    var customerPassword = localStorage.getItem("customerPassword");
    var customerInfo = JSON.parse(localStorage.getItem("customerInfo"));
    if(customerName&&customerPassword){
        $.ajax({
            url: $.customerServerHttp+'/dealer/login',
            data: {
                username:customerName,
                password:customerPassword
            },
            type: "post",
            success: function (data){
                console.log("loginSuccessData",data);
                localStorage.setItem("customerName",customerName);
                localStorage.setItem("customerPassword",customerPassword);
                localStorage.setItem("customerInfo",JSON.stringify(data));
                window.location.href = 'customerCenter.html';
            },
            error: function (error) {
                console.log("loginError",error);
                var data = $.parseJSON(error.responseText);  //将string转换为json
                if(data.error=='invalid_param'){
                    alert("密码已发生变更,请重新登录。");
                }
            }
        });
    }

    //login
    $("#customer_login").click(function () {
        var phoneNum = $("#phoneNum").val();
        var password = $("#password").val();
        if( phoneNum == ""){
            alert("手机号不能为空!");
        }else if( password == ""){
            alert("密码不能为空!");
        }else{
            $.ajax({
                url: $.customerServerHttp+'/dealer/login',
                data: {
                    username:phoneNum,
                    password:password
                },
                type: "post",
                success: function (data){
                    console.log("loginSuccess",data);
                    localStorage.setItem("customerName",phoneNum);
                    localStorage.setItem("customerPassword",password);
                    localStorage.setItem("customerInfo",JSON.stringify(data));
                    window.location.href = 'customerCenter.html';
                },
                error: function (error) {
                    console.log("loginError",error);
                    alert(JSON.parse(error.responseText).error_output);
                }
            });
        }
    })

});
