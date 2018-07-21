/**
 * Created by lycamhost on 16/11/7.
 */

$(function () {
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
            },
            error: function (error) {
                console.log("loginError",error);
                var data = $.parseJSON(error.responseText);  //将string转换为json
                if(data.error=='invalid_param'){
                    alert("密码已发生变更,请重新登录。");
                }
            }
        });
    }else{
        alert("您还没登录,请先登录。");
        window.location.href = 'customerLogin.html';
    }
    // 退出登录
    $("#customer_logout").click(function () {
        localStorage.removeItem("customerName");
        localStorage.removeItem("customerPassword");
        window.location.href = "customerLogin.html";
    });
});