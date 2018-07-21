/**
 * Created by lycamhost on 16/11/8.
 */

$(function () {
    var _this={};
    _this.totalFee = 0; //总金额
    _this.minusFee = 0;  //折后减少的金额
    _this.chargeFee=0; //应付折后价
    _this.reg = /^\d+$/;  //验证用户输入值

    var customerInfo = JSON.parse(localStorage.getItem("customerInfo"));
    console.log("customerInfo",customerInfo);

    //获取经销商信息
    $.ajax({
        url:$.customerServerHttp+'/dealer/info',
        headers:{
            access_token: customerInfo.token
        },
        type:"get",
        success:function (data) {
            console.log("getCustomerInfo",data);
            $("#userName").val(data.contact);
            $("#telephone").val(data.phone);
            $("#company").val(data.company);
            $("#address").val(data.mailingAddress);
            _this.discount=data.discount/100; //折扣
            $("#discount").html(_this.discount*100+'%');
        },
        error:function (error) {
            console.log("getCustomerError",error);
        }
    });

    //修改发票的信息  同步修改到经销商个人地址
    $("#save").click(function () {
        var company = $("#company").val();
        var address = $("#address").val();
        var user_Name = $("#userName").val();
        if(user_Name == ''){
            alert("请输入联系人。");
        }else if(company == '') {
            alert("请输入发票抬头。")
        }else {
            $.ajax({
                type: "POST",
                dataType: "json",
                headers:{
                    access_token: customerInfo.token
                },
                url: $.customerServerHttp+'/dealer/edit',
                data: {
                    contact:user_Name,
                    company : company,
                    mailingAddress:address
                },
                success: function (data){
                    console.log("editSuccess",data);
                    var $copySuccess = $("<div class='copy-tips'><div class='copy-tips-wrap'>修改成功!</div></div>");
                    $("body").find(".copy-tips").remove().end().append($copySuccess);
                    $(".copy-tips").fadeOut(3000);
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
                    $('#billModal').modal('hide');
                },
                error: function (error) {
                    console.log(error);
                }
            });
        }
    });

    //  导航切换
    $("#chargeWay li").each(function (index,i) {
        $(this).click(function () {
            $("#chargeWay li.active").removeClass("active");
            $("#chargeWay li").eq(index).addClass("active");
        });
    });

    //是否索要发票
    $("#yes").click(function () {
        $('#billModal').modal('show');
    });

    //循环监听每一个input的value值得改变动态改变付款数值
    $("ul#feeUl").on("keyup",".chooseNum input",function(){
        _this.totalFee = 0;
        if(_this.reg.test($(this).val()) || $(this).val()==''){
            for(var i=0;i<$(".chooseNum input").length;i++){
                _this.totalFee +=parseInt($(".chooseNum input")[i].value*$(".chooseNum input").eq(i).attr("money"))
            }
            $("#totalFee").html(_this.totalFee);
            var charge_value = _this.totalFee*_this.discount;
            var charge_minus = _this.totalFee-charge_value;
            $("#charge_value").html(Math.round(charge_value*100)/100);
            $("#charge_minus").html(Math.round(charge_minus*100)/100);//实现四舍五入  有两位小数则保留  否则保留整数
        }else{
            alert("请输入一个非负整数。");
            $(this).val(0);
            for(var i=0;i<$(".chooseNum input").length;i++){
                _this.totalFee +=parseInt($(".chooseNum input")[i].value*$(".chooseNum input").eq(i).attr("money"))
            }
            $("#totalFee").html(_this.totalFee);
            var charge_value = _this.totalFee*_this.discount;
            var charge_minus = _this.totalFee-charge_value;
            $("#charge_value").html(Math.round(charge_value*100)/100);
            $("#charge_minus").html(Math.round(charge_minus*100)/100);//实现四舍五入  有两位小数则保留  否则保留整数
        }
    });
    $(".minus").click(function () {
        var fee = $(this).next().val();
        var feeMinus = parseInt(fee)-1;
        if(parseInt(fee) >= 1){
            $(this).next().val(feeMinus.toString());
        }

        //循环监听每一个input的value值得改变动态改变付款数值
        _this.totalFee = 0;
        if(_this.reg.test($(this).next().val())){
            for(var i=0;i<$(".chooseNum input").length;i++){
                _this.totalFee+=parseInt($(".chooseNum input")[i].value*$(".chooseNum input").eq(i).attr("money"))
            }
            $("#totalFee").html(_this.totalFee);
            var charge_value = _this.totalFee*_this.discount;
            var charge_minus = _this.totalFee-charge_value;
            $("#charge_value").html(Math.round(charge_value*100)/100);
            $("#charge_minus").html(Math.round(charge_minus*100)/100);//实现四舍五入  有两位小数则保留  否则保留整数
        }
    });
    $(".plus").click(function () {
        var fee = $(this).prev().val();
        var feePlus = parseInt(fee)+1;
        if(parseInt(fee) >= 0){
            $(this).prev().val(feePlus.toString());
        }

        //循环监听每一个input的value值得改变动态改变付款数值
        _this.totalFee = 0;
        if(_this.reg.test($(this).prev().val())){
            for(var i=0;i<$(".chooseNum input").length;i++){
                _this.totalFee+=parseInt($(".chooseNum input")[i].value*$(".chooseNum input").eq(i).attr("money"))
            }
            $("#totalFee").html(_this.totalFee);
            var charge_value = _this.totalFee*_this.discount;
            var charge_minus = _this.totalFee-charge_value;
            $("#charge_value").html(Math.round(charge_value*100)/100);
            $("#charge_minus").html(Math.round(charge_minus*100)/100);//实现四舍五入  有两位小数则保留  否则保留整数
        }
    });

    $("#pay_btn").click(function () {
        var $loadingTip = $("<div class='loading-tip'><div class='copy-tips-wrap'>加载中,亲稍候o(∩_∩)o~~</div></div>");
        $("body").find(".loading-tip").remove().end().append($loadingTip);
        var payMoney = $("#charge_value").html();
        // var orderDetail = [];
        var orderDetail = '';
        var totalFee = $("#totalFee").html();
        var charge_value = $("#charge_value").html();
        var billType = $("#billType").val();
        var billContent = $("#billContent").val();
        var telephone = $("#telephone").val();
        var company = $("#company").val();
        var address = $("#address").val();
        var contact = $("#userName").val();
        if($("#needBill input[name='need']:checked").val() == 1){
            _this.dataJson={    //发票信息json
                "type": billType,
                "title":company,
                "content":billContent,
                "contact":contact,
                "mailingAddress":address,
                "telephone":telephone,
                "price":totalFee,
                "priceAfterDiscount":charge_value,
                "discount":customerInfo.user.discount
            }
        }else{
            _this.dataJson={}
        }

        //循环获取用户选择的卡券面值及其数量
        for(var i=0;i<$(".chooseNum input").length;i++){
            var num = parseInt($(".chooseNum input")[i].value);
            if(num != 0){
                for(var n = 0;n<num;n++){
                    orderDetail += $(".chooseNum input").eq(i).attr("money")+',';
                }
            }
        }
        var orderList = orderDetail.substring(0,orderDetail.length-1);  //截取掉最后一个逗号
        if(parseInt(payMoney) == 0){
            alert("请先选择卡券。")
        }else {
            if($("#zhiFuBao").hasClass("active")){  //支付宝充值
                $("#payCount_aliPay").html(payMoney);
                $('.customerCenter_content_wrapper').hide();
                $("#pay_aliPay_div").show();

                _this.timer=null;
                $.ajax({
                    url: $.customerServerHttp+"/pay/alipay/qr/create",
                    // url:"http://192.168.1.123:1337/pay/alipay/qr/create",
                    headers:{
                        access_token: customerInfo.token
                    },
                    type: "post",
                    data:{
                        amount:parseInt(payMoney),
                        detail:orderList,
                        invoice:_this.dataJson
                    },
                    success:function (data) {
                        // console.log("alipaySuccessData",data);
                        var out_trade_no = data.out_trade_no;
                        new QRCode('aliPay', {
                            text: data.qr_code,
                            width: 268,
                            height: 268,
                            colorDark : '#000000',
                            colorLight : '#ffffff',
                            correctLevel : QRCode.CorrectLevel.H
                        });
                        $(".loading-tip").hide();  //提示加载中的消息消失
                        _this.timer = setInterval(function () {
                            payStatus(out_trade_no);
                        },3000);
                    },
                    error:function (error) {
                        console.log("alipayError",error);
                    }
                });
                function payStatus(out_trade_no) {
                    $.ajax({
                        url:$.customerServerHttp+'/pay/alipay/qr/query',
                        headers:{
                            access_token: customerInfo.token
                        },
                        type: "get",
                        dataType:"json",
                        data:{
                            out_trade_no:out_trade_no
                        },
                        success:function (data) {
                            console.log("aliPayStatusSuccessData",data);
                            data.parse;
                            if(data.alipay_trade_query_response.trade_status == 'TRADE_SUCCESS'){
                                clearInterval( _this.timer);
                                var $copySuccess = $("<div class='copy-tips'><div class='copy-tips-wrap'>支付成功!正在跳转...</div></div>");
                                $("body").find(".copy-tips").remove().end().append($copySuccess);
                                $(".copy-tips").fadeOut(3000,function () {
                                    window.location.reload();
                                });
                            }
                        },
                        error:function (error) {
                            console.log("aliPayStatusError",error);
                        }
                    })
                }
            }else if($("#weChat").hasClass("active")){
                $("#payCount_weChat").html(payMoney);
                $('.customerCenter_content_wrapper').hide();
                $("#pay_weChat_div").show();

                var payMoneyFee = payMoney*100;
                console.log("payMoneyFee",payMoneyFee);
                console.log("typeOfPayMoneyFee",typeof(payMoneyFee));

                _this.timer_weChat=null;
                $.ajax({
                    url: $.customerServerHttp+"/pay/wx/qr/create",
                    headers:{
                        access_token: customerInfo.token
                    },
                    type: "post",
                    data:{
                        total_fee:payMoneyFee,
                        detail:orderList,
                        trade_type:"NATIVE",
                        invoice:_this.dataJson
                    },
                    success:function (data) {
                        console.log("weChatPaySuccessData",data);
                        var out_trade_no = data.out_trade_no;
                        new QRCode('weChatPay', {
                            text: data.code_url,
                            width: 268,
                            height: 268,
                            colorDark : '#000000',
                            colorLight : '#ffffff',
                            correctLevel : QRCode.CorrectLevel.H
                        });
                        $(".loading-tip").hide();  //提示加载中的消息消失
                        _this.timer_weChat = setInterval(function () {
                            weChatPayStatus(out_trade_no);
                        },3000);
                    },
                    error:function (error) {
                        console.log("weChatPayError",error);
                    }
                });

                function weChatPayStatus(out_trade_no) {
                    $.ajax({
                        url:$.customerServerHttp+'/pay/wx/qr/query',
                        headers:{
                            access_token: customerInfo.token
                        },
                        type: "get",
                        dataType:"json",
                        data:{
                            out_trade_no:out_trade_no
                        },
                        success:function (data) {
                            console.log("weChatPayStatusSuccessData",data);
                            data.parse;
                            if(data.trade_state == 'SUCCESS'){
                                clearInterval(_this.timer_weChat);
                                var $copySuccess = $("<div class='copy-tips'><div class='copy-tips-wrap'>支付成功!正在跳转...</div></div>");
                                $("body").find(".copy-tips").remove().end().append($copySuccess);
                                $(".copy-tips").fadeOut(3000,function () {
                                    window.location.reload();
                                });
                            }
                        },
                        error:function (error) {
                            console.log("weChatPayStatusError",error);
                        }
                    })
                }
            }else{
                $('#bank_trans').modal('show');
                $('#bank_trans').on('hidden.bs.modal', function (e) {
                    window.location.reload();
                });
                $.ajax({
                    url:$.customerServerHttp+'/pay/bank/create',
                    dataType:"json",
                    headers:{
                        access_token: customerInfo.token
                    },
                    type:"post",
                    data:{
                        total_amount:parseInt(payMoney),
                        detail:orderList,
                        invoice:_this.dataJson
                    },
                    success:function (data) {
                        console.log("successData",data);
                        $(".loading-tip").hide();  //提示加载中的消息消失
                    },
                    error:function (error) {
                        console.log("error",error);
                    }
                })
            }
        }
    });

    //返回选择支付方式
    $("#back_aliPay").click(function (e) {
        e.preventDefault();
        $("#pay_aliPay_div").hide();
        $("#pay_weChat_div").hide();
        $(".customerCenter_content_wrapper").show();
        $("#aliPay").empty();
        clearInterval(_this.timer);
    });
    $("#back_weChat").click(function (e) {
        e.preventDefault();
        $("#pay_aliPay_div").hide();
        $("#pay_weChat_div").hide();
        $(".customerCenter_content_wrapper").show();
        $("#weChatPay").empty();
        clearInterval(_this.timer_weChat);
    });
});