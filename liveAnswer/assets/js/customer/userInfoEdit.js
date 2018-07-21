/**
 * Created by lycamhost on 16/11/4.
 */

$(function () {
    var customerInfo = JSON.parse(localStorage.getItem("customerInfo"));
    //获取行业信息
    $.ajax({
        url:$.customerServerHttp+'/dealer/industry',
        headers:{
            access_token: customerInfo.token
        },
        type:"get",
        success:function (data) {
            console.log("getIndustryListData",data);
            var keys =[];
            var industry ='';
            for(var i in data){
                keys.push(i);
            }
            keys = keys.sort();
            for(var n=0;n<keys.length;n++){
                var key =keys[n];
                industry += '<option value='+data[key]['name']+'>'+data[key]['description']+'</option>'
            }

            $("#select_businessType").append(industry);
            $("#select_businessType").trigger("chosen:updated");
            $('#select_businessType').chosen();

            $('#select_business').chosen();
            $("#select_business").append(industry);
            $.ajax({
                url:$.customerServerHttp+'/dealer/info',
                headers:{
                    access_token: customerInfo.token
                },
                type:"get",
                success:function (data) {
                    console.log("data.industry",data.industry);
                    $("#select_business option[value='"+data.industry+"']").attr("selected","selected");
                    $('#select_business').trigger('chosen:updated');//更新
                    $("#select_business_chosen").css("width","100%");
                },
                error:function (error) {
                    console.log("getCustomerError",error);
                }
            });
        },
        error:function (error) {
            console.log("getIndustryListError",error);
        }
    });

    //   =========================================================表单验证 start
    $('form :input').blur(function(){
        var $parent = $(this).parent();
        $parent.find(".tip").remove();
        if( $(this).is('#company') ){
            if( this.value==""){
                var errorMsg = '请输入公司名称.';
                $parent.append('<div class="tip">'+errorMsg+'</div>');
            }
        }
        if( $(this).is('#username') ){
            if( this.value==""){
                var errorMsg = '请输入联系人姓名。';
                $parent.append('<div class="tip">'+errorMsg+'</div>');
            }
        }
        if( $(this).is('#email') ){
            var reg = /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+(.[a-zA-Z0-9_-])+/;
            if(!reg.test(this.value)){
                var errorMsg = '请输入合法的联系邮箱';
                $parent.append('<div class="tip">'+errorMsg+'</div>');
            }
        }
        if( $(this).is('#address')){
            if( this.value=="" ){
                var errorMsg = '请输入邮寄地址。';
                $parent.append('<div class="tip">'+errorMsg+'</div>');
            }
        }
    });

    //  =====================================================向后台提交表单  修改信息
    //用户注册成功以后的经销商信息完善页面
    $("#submit").click(function () {
        var company = $("#company").val();
        var username = $("#username").val();
        var email = $("#email").val();
        var address = $("#address").val();
        var intro = $("#intro").val();
        var telephone=$("#telephone").val();
        var indus = $("#select_businessType option:selected").text();
        var indus_edit = $("#select_business option:selected").text();
        var reg = /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+(.[a-zA-Z0-9_-])+/;  //邮箱正则
        if( company == ''){
            alert("请输入公司名称!");
        }else if( username == ""){
            alert("请输入联系人姓名!");
        }else if(email == "" || (!reg.test(email))){
            alert("请输入正确的邮箱地址。");
        }else if(address == ""){
            alert("请输入邮寄地址!")
        }else{
            $.ajax({
                type: "POST",
                dataType: "json",
                headers:{
                    access_token: customerInfo.token
                },
                url: $.customerServerHttp+'/dealer/edit',
                data: {
                    company : company,
                    email : email,
                    contact : username,
                    mailingAddress:address,
                    industry:indus||indus_edit,
                    description: intro,
                    telephone:telephone
                },
                success: function (data){
                    console.log("editSuccess",data);
                    var customerName = localStorage.getItem("customerName");
                    var customerPassword = localStorage.getItem("customerPassword");
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
                },
                error: function (error) {
                    console.log(error);
                }
            });
        }
    });
    //经销商中心的信息修改
    $("#submitEdit").click(function () {
        var company = $("#company").val();
        var username = $("#username").val();
        var email = $("#email").val();
        var address = $("#address").val();
        var intro = $("#intro").val();
        var telephone=$("#telephone").val();
        var indus = $("#select_businessType option:selected").text();
        var indus_edit = $("#select_business option:selected").text();
        var reg = /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+(.[a-zA-Z0-9_-])+/;  //邮箱正则
        if( company == ''){
            alert("请输入公司名称!");
        }else if( username == ""){
            alert("请输入联系人姓名!");
        }else if(email == "" || (!reg.test(email))){
            alert("请输入正确的邮箱地址。");
        }else if(address == ""){
            alert("请输入邮寄地址!")
        }else{
            $.ajax({
                type: "POST",
                dataType: "json",
                headers:{
                    access_token: customerInfo.token
                },
                url: $.customerServerHttp+'/dealer/edit',
                data: {
                    company : company,
                    email : email,
                    contact : username,
                    mailingAddress:address,
                    industry:indus||indus_edit,
                    description: intro,
                    telephone:telephone
                },
                success: function (data){
                    console.log("editSuccess",data);
                    var $copySuccess = $("<div class='edit-tip'><div class='copy-tips-wrap'>修改成功!</div></div>");
                    $("body").find(".edit-tip").remove().end().append($copySuccess);
                    $(".edit-tip").fadeOut(3000);
                    $.ajax({
                        url:$.customerServerHttp+'/dealer/info',
                        headers:{
                            access_token: customerInfo.token
                        },
                        type:"get",
                        success:function (data) {
                            console.log("getCustomerEditInfo",data);
                            $(".telephone").val(data.phone);
                            $("#user_Name").val(data.contact);
                            $(".company").val(data.company);
                            $(".address").val(data.mailingAddress);
                            $("#company").val(data.company);
                            $("#username").val(data.contact);
                            $("#email").val(data.email);
                            $("#address").val(data.mailingAddress);
                            $("#intro").html(data.description);
                            $("#telephone").val(data.phone);
                            $("#select_business option[value='"+data.industry+"']").attr("selected","selected");
                        },
                        error:function (error) {
                            console.log("getCustomerEditError",error);
                        }
                    });
                    $('#editPersonal').modal('hide');
                },
                error: function (error) {
                    console.log(error);
                }
            });
        }
    })
});