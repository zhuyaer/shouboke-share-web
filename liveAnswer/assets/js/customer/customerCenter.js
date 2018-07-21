/**
 * Created by lycamhost on 16/11/9.
 */

$(function () {
    var _this={};
    var customerInfo = JSON.parse(localStorage.getItem("customerInfo"));
    console.log("customerInfo",customerInfo);
    $("#userID").html(customerInfo.user.id);
    $("#user_contact").html(customerInfo.user.contact);
    $("#customer_userHead").on("mouseover",function () {
        $(".edit").show();
    });
    $("#customer_userHead").on("mouseout",function () {
        $(".edit").hide();
    });

    //获取经销商信息
    $.ajax({
        url:$.customerServerHttp+'/dealer/info',
        headers:{
            access_token: customerInfo.token
        },
        type:"get",
        success:function (data) {
            console.log("getCustomerInfo",data);
            $(".telephone").val(data.phone);
            $("#user_Name").val(data.contact);
            $(".company").val(data.company);
            $(".address").val(data.mailingAddress);
            _this.discount=data.discount/100; //折扣
            $("#discount").html(_this.discount*100+'%');

            // 编辑经销商信息时回显数据
            $("#company").val(data.company);
            $("#username").val(data.contact);
            $("#email").val(data.email);
            $("#address").val(data.mailingAddress);
            $("#intro").html(data.description);
            $("#telephone").val(data.phone);
            $("#select_business option[value='"+data.industry+"']").attr("selected","selected");
        },
        error:function (error) {
            console.log("getCustomerError",error);
        }
    });

    //get user card list
    $.ajax({
        url:$.customerServerHttp+'/voucher/list',
        headers:{
            access_token: customerInfo.token
        },
        type:"get",
        data:{
            page:1,
            resultsPerPage:20000
        },
        success:function (data) {
            console.log("getCardListData",data);
            $("#count").html(data.totalItems);
            $("#cardCount").html(data.totalItems);
            var cardList = "";
            for(var i=0;i<data.items.length;i++){
                if(data.items[i].isUsed){
                    cardList += '<tr role="row" class="center">'+
                        '<td id="get'+i+'">'+data.items[i].voucherId+'</td>'+
                        '<td>'+data.items[i].value+'</td>'+
                        '<td>'+formatDate(data.items[i].createdAt,'yyyy-MM-dd HH:mm')+'</td>'+
                        '<td>永久</td>'+
                        '<td>'+
                        '<span class="used">已使用</span>'+
                        '</td>'+
                        '<td>'+
                        '<div class="rel"><a id="copy'+i+'" href="javascript:;" class="btn btn-default copy">复制序列号</a></div>'+
                        '</td>'+
                        '</tr>'
                }else{
                    cardList += '<tr role="row" class="center">'+
                        '<td id="get'+i+'">'+data.items[i].voucherId+'</td>'+
                        '<td>'+data.items[i].value+'</td>'+
                        '<td>'+formatDate(data.items[i].createdAt,'yyyy-MM-dd HH:mm')+'</td>'+
                        '<td>永久</td>'+
                        '<td>'+
                        '<span class="not_used">未使用</span>'+
                        '</td>'+
                        '<td>'+
                        '<div class="rel"><a id="copy'+i+'" href="javascript:;" class="btn btn-default copy">复制序列号</a></div>'+
                        '</td>'+
                        '</tr>'
                }
            }
            $("#cardList").append(cardList);
            _this.myCardTable = $("#myCardTable").DataTable({
                //默认以某列来排序
                order: [
                    [ 2, "desc" ]],
                aLengthMenu: paging,
                bProcessing : true,
                aoColumns: [
                    {bSortable: false},
                    null,
                    null,
                    {bSortable: false},
                    {bSortable: false},
                    {bSortable: false}
                ],
                oLanguage:dataTableLan
            });
            //点击按钮复制
            $("#cardList a.copy").each(function () {
                $("#"+$(this).attr('id')).zclip({
                    path: "../assets/js/customer/ZeroClipboard.swf",
                    copy: function(){
                        return $(this).parent().parent().parent().find("td:nth-child(1)").text();
                    },
                    afterCopy:function(){/* 复制成功后的操作 */
                        var $copySuccess = $("<div class='copy-tips'><div class='copy-tips-wrap'>复制成功!</div></div>");
                        $("body").find(".copy-tips").remove().end().append($copySuccess);
                        $(".copy-tips").fadeOut(3000);
                    }
                });
            });
            $("#myCardTable_paginate").bind("click",function () {
                $("#cardList a.copy").zclip({
                    path: "../assets/js/customer/ZeroClipboard.swf",
                    copy: function(){
                        return $(this).parent().parent().parent().find("td:nth-child(1)").text();
                    },
                    afterCopy:function(){/* 复制成功后的操作 */
                        var $copySuccess = $("<div class='copy-tips'><div class='copy-tips-wrap'>复制成功!</div></div>");
                        $("body").find(".copy-tips").remove().end().append($copySuccess);
                        $(".copy-tips").fadeOut(3000);
                    }
                });
            });

        },
        error:function (error) {
            console.log("getCardListError",error);
        }
    });

    //get user purchase history
    getPurchaseHistory();
    function getPurchaseHistory() {
        $.ajax({
            url:$.customerServerHttp+'/trade/list',
            headers:{
                access_token: customerInfo.token
            },
            type:"get",
            data:{
                page:1,
                resultsPerPage:20000
            },
            success:function (data) {
                console.log("getPurchaseHistoryData",data);
                $("#historyNum").html(data.totalItems);
                var purchaseHistory = "";
                for(var i=0;i<data.items.length;i++){
                    if(data.items[i].invoice){
                        purchaseHistory += '<tr id="row'+i+'" role="row" class="center">'+
                            '<td>'+data.items[i].out_trade_no+'</td>'+
                            '<td>'+data.items[i].total_amount+'</td>'+
                            '<td>'+formatDate(data.items[i].updatedAt,'yyyy-MM-dd HH:mm')+'</td>'+
                            '<td class="trade_way">'+tradeWay(data.items[i].trade_type)+'</td>'+
                            '<td>'+payJudge(data.items[i].status)+'</td>'+
                            '<td>是</td>'+
                            '<td>'+showDetail(data.items[i].status,data.items[i].extraInfo.detail)+'</td>'+
                            '</tr>';
                    }else{
                        purchaseHistory += '<tr id="row'+i+'" role="row" class="center">'+
                            '<td>'+data.items[i].out_trade_no+'</td>'+
                            '<td>'+data.items[i].total_amount+'</td>'+
                            '<td>'+formatDate(data.items[i].updatedAt,'yyyy-MM-dd HH:mm')+'</td>'+
                            '<td class="trade_way">'+tradeWay(data.items[i].trade_type)+'</td>'+
                            '<td>'+payJudge(data.items[i].status)+'</td>'+
                            '<td>'+getBill(data.items[i].status,i)+'</td>'+
                            '<td>'+showDetail(data.items[i].status,data.items[i].extraInfo.detail)+'</td>'+
                            '</tr>';
                    }
                }
                $("#purchaseHistoryList").html(purchaseHistory);
                _this.purchaseHistoryTable = $("#purchaseTable").DataTable({
                    //默认以某列来排序
                    order: [[ 2, "desc" ]],
                    aLengthMenu: paging,
                    bProcessing : true,
                    aoColumns: [
                        {bSortable: false},
                        null,
                        null,
                        null,
                        null,
                        null,
                        {bSortable: false}
                    ],
                    oLanguage:dataTableLan
                });
                $("#purchaseHistory").on("click",".getBill",function (e) {
                    e.preventDefault();
                    $('#billModal').modal('show');
                    // 修改发票的信息  同步修改到经销商个人信息
                    $("#save").click(function () {
                        var company = $(".company").val();
                        var address = $(".address").val();
                        var user_Name = $("#user_Name").val();
                        if(user_Name == ''){
                            alert("请输入联系人。");
                        }else if(company == '') {
                            alert("请输入发票抬头。")
                        }else if(telephone == ''){
                            alert("请输入联系电话。")
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

                    var telephone = $(".telephone").val();
                    var company = $(".company").val();
                    var address = $(".address").val();
                    var priceAfterDiscount = data.items[$(this).attr("id")].total_amount;
                    var total_amount = data.items[$(this).attr("id")].total_amount/customerInfo.user.discount;
                    var price = Math.round(total_amount*100)/100;
                    var out_trade_num = data.items[$(this).attr("id")].out_trade_no;
                    $("#sureGet").click(function () {
                        var dataJson={    //发票信息json
                            "type": "普通发票",
                            "title":company,
                            "content":"技术服务",
                            "contact":customerInfo.user.contact,
                            "mailingAddress":address,
                            "telephone":telephone,
                            "price":price,
                            "priceAfterDiscount":priceAfterDiscount,
                            "discount":customerInfo.user.discount
                        };
                        $.ajax({
                            type: "POST",
                            dataType: "json",
                            headers:{
                                access_token: customerInfo.token
                            },
                            url: $.customerServerHttp+'/trade/addInvoice',
                            data:{
                                out_trade_no:out_trade_num,
                                invoice:dataJson
                            },
                            success:function (data) {
                                console.log("sureSuccess",data);
                                $('#billModal').modal('hide');
                                $('#billModal').on('hidden.bs.modal', function (e) {
                                    _this.purchaseHistoryTable.destroy();
                                    getPurchaseHistory();
                                })
                            },
                            error:function (error) {
                                console.log("sureError",error);
                            }
                        })
                    });
                });
            },
            error:function (error) {
                console.log("getPurchaseHistoryError",error);
            }
        });
    }

    $("#purchaseHistoryList").on("click",".checkDetail",function () {
        var number = $(this).attr('card');
        number = JSON.parse(number);
        console.log("number",number);
        $("#cardNum").html(number.length);
        var list = '';
        for(var i=0;i<number.length;i++){
            list += '<li class="clearfix">'+
            '<div style="float: left;width: 50%;">'+
                '卡券序列号: <span>'+number[i].voucherId+'</span>'+
            '</div>'+
            '<div style="float: left">'+
                '面值: <span>'+number[i].value+'</span>'+
            '</div>'+
            '</li>'
        }
        $("#cardDetail").html(list);
    });

    //  导航切换
    $("#purchaseHistory").hide();
    $(".nav-tabs>li").each(function (index,i) {
        $(this).click(function () {
            $(".nav-tabs > li.active").removeClass("active");
            $(".nav-tabs > li").eq(index).addClass("active");
            if($(".nav-tabs > li").eq(0).hasClass("active")){
                $("#myCardList").show();
                $("#purchaseHistory").hide();
            }else{
                $("#myCardList").hide();
                $("#purchaseHistory").show();
            }
        });
    });
});

// 支付方式
function tradeWay(tradeWay) {
    if(tradeWay == 'alipay'){
        return '支付宝支付';
    }else if (tradeWay =='bank-transfer'){
        return '银行转账';
    }else{
        return '微信支付';
    }
}
//支付状态
function payJudge(status) {
    if(status == "prepare"){
        return "<span class='used'>等待确认</span>";
    }else{
        return '<span class="not_used">支付成功</span>';
    }
}
//查看详情
function showDetail(status,extraInfo) {
    if(status == "prepare"){
        return "---";
    }else {
        return "<button card='"+JSON.stringify(extraInfo)+"' class='btn btn-default checkDetail' data-toggle='modal' data-target='#orderDetail'>查看详情</button>"
    }
}
//索要发票
function getBill(status,i) {
    if(status == "prepare"){
        return '否';
    }else{
        return '否&nbsp;&nbsp;<span id="'+i+'" class="getBill">索要</span>';
    }
}
