/**
 * Created by lycamhost on 16/10/12.
 */
Array.prototype.remove = function(val) {
    var index = this.indexOf(val);
    if (index > -1) {
        this.splice(index, 1);
    }
};

$(document).on('mouseenter','.login_success',function () {
    $(".personal").css("display","block");
});

$(document).on('mouseleave','.login_success',function () {
    $(".personal").css("display","none");
});

//logout
$(document).on('click','#log_out',function () {
    $("#login").html("登录");
    $("#login").show();
    $(".login_success").hide();
    localStorage.clear();
    window.location.reload();
});

//重写
window.alert = function(str)
{
    var shield = document.createElement("DIV");
    shield.id = "shield";
    var alertFram = document.createElement("DIV");
    alertFram.id="alertFram";
    var strHtml = '<ul class="shieldUl">';
    strHtml += '<li class="shieldContent">'+str+'</li>';
    strHtml += '<li class="shieldBtn_wrap"><div onclick="doOk()" class="alertButton alertBlue">确定</div></li>';
    strHtml += '</ul>';
    alertFram.innerHTML = strHtml;
    document.body.appendChild(alertFram);
    document.body.appendChild(shield);
    this.doOk = function(){
        alertFram.style.display = "none";
        shield.style.display = "none";
    }
    alertFram.focus();
    document.body.onselectstart = function(){return false;};
    document.onkeydown = function(e){
        var ev = document.all ? window.event : e;
        if(ev.keyCode==13) {
            alertFram.style.display = "none";
            shield.style.display = "none";
        }
    }
}
$(function () {
    //暂时没有第三方登录和忘记密码--------------
    $(".modal-body-2").remove();
    $(".forget_pass").remove()

    //没有登录和没有内容DIV垂直居中
    var height = $(window).height();
    $("#no_login").css("height",(height-200)+'px');
    $("#no_login").css("line-height",(height-200)+'px');

    //页面初始化时判断本地是否保存用户的用户名和密码,若有,则自动登录
    var userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if(userInfo){
        $(".charge_item_son").show();
        $(".charge_item_sub").hide();
        var canUpload=userInfo.canUpload;
        if(!canUpload||canUpload=='false'){
            //$('#buildClass').hide();
            $('#upClass').hide();
        }else{
            //$('#buildClass').show();
            $('#upClass').show();
        }
        $("#login").html("");
        $("#user_headPic").attr("src",userInfo.avatarUrl);
        $(".user_head").attr("src",userInfo.avatarUrl);
        $("#userName").html(userInfo.displayName)
        $("#userPhone").html(userInfo.phone)
        $(".two.userId").attr('id',userInfo.id)
        $(".login").css("display","none");
        $(".login_success").css("display","block");
        $("#myModal").css("display","none");
        $('.modal-backdrop').css("display","none");
        $.ajax({
            url: $.serverHttp+'/login',
            data: {
                username:userName,
                password:password
            },
            type: "post",
            success: function (data){

            },
            error: function (error) {
                console.log("loginError",error);
                // console.log(typeof(error));
                var data = $.parseJSON(error.responseText);  //将string转换为json
                // console.log(data.error);
                // console.log(typeof (data.error));
                $(".charge_item_son").hide();
                $(".charge_item_sub").show();
                if(data.error=='invalid_param'){
                    $("#login").html("登录");
                    alert("密码已发生变更,请重新登录。");
                    $(".charge_item_son").hide();
                    $(".charge_item").hide();
                }
            }
        });
    }else{
        $("#login").html("登录");
        $("#loadMore").hide();
    }

    //login
    function login() {
        var userName = $("#user").val();
        var password = $("#pass").val();
        if( userName == ""){
            alert("用户名不能为空!");
        }else if( password == ""){
            alert("密码不能为空!");
        }else{
            $.ajax({
                url:$.serverHttp+'/login',
                data: {
                    username:userName,
                    password:password
                },
                type: "post",
                success: function (data){
                    if(data.acl&&data.acl.canUpload){
                        sessionStorage.setItem("canUpload",data.acl.canUpload);
                    }

                    window.location.reload();
                    var canUpload=sessionStorage.getItem('canUpload');
                    if(!canUpload||canUpload=='false'){
                        $('#buildClass').hide();
                        $('#upClass').hide();
                    }else{
                        $('#buildClass').show();
                        $('#upClass').show();
                    }
                    $("#login").html("");
                    $(".charge_item_son").show();
                    $(".charge_item_sub").hide();
                    console.log("loginSuccessData",data);
                    localStorage.setItem("userName",userName);
                    localStorage.setItem("password",password);
                    localStorage.setItem("userInfo",JSON.stringify(data));
                    if(data){
                        $("#user_headPic").attr("src",data.avatarUrl);
                        $(".user_head").attr("src",data.avatarUrl);
                        $("#userName").html(data.displayName)
                        $("#userPhone").html(data.phone)
                        $(".two.userId").attr('id',data.id)
                    }else{
                        $("#user_headPic").attr("src",'img/user_origin.png');
                        $(".user_head").attr("src",'img/user_origin.png');
                    }

                    $(".login").css("display","none");
                    $(".login_success").css("display","block");

                    $("#myModal").css("display","none");
                    $('.modal-backdrop').css("display","none");
                },
                error: function (error) {
                    $(".charge_item_son").hide();
                    $(".charge_item_sub").show();
                    if(error.responseText){
                        $(".error_tip").html("用户名或者密码错误。");
                    }
                }
            });
        }
    }

    //微博登录
    $('.wb_login_btn').click(function () {
        WB2.login(function () {
            WB2.anyWhere(function (W) {
                // 调用 account/get_uid 接口，获取用户信息
                W.parseCMD('/account/get_uid.json', function (oResult, bStatus) {
                    if (bStatus) {
                        console.log(oResult.uid);
                    }
                }, {source:367727881
                }, {
                    method: 'get',
                    cache_time: 30
                });
            });
        });
    });

    $('#pass').keydown(function(e){
        if(e.keyCode==13){  //按enter触发login事件
            // 处理事件
            login();
        }
    });

    $("#login_btn").click(function () {
        login();
    });


    //登录成功,鼠标悬浮在头像上时显示信息
    $(".login_success").mouseenter(function () {
        console.log(123)
        $(".personal").css("display","block");
    });
});
