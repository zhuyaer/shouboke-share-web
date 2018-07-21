(function($){
    var Page = {
        visitUrl:"http://api-sbkt.lycam.tv",
        //visitUrl:'http://sbkt-port-1178495353.cn-north-1.elb.amazonaws.com.cn',
        test_success:true,
        hisObj : null,
        channel : "wx_list", //wx_list alipay_list
        allDatas : null,
        $goodsList : $("#js_all_goods_list"),
        $submitBtn : $("#js_pay_confirm"),
        openid:null,
        token:null,
        postData : {},
        init : function(){
            var that = this;
            ////微信环境打开 提示在浏览器中打开
            //if(Common.is_weixn()){
            //    $(".tip-mask").show();
            //}
            that.getCode();
            that.allDatasfn();
        },
        getCode:function(){
            var that=this;
            var _this=this;
            var url = window.location.search;
            var array1 = url.split("=");
            var code = array1[1].substr(0,array1[1].indexOf('&state'));
            console.log('code',code);
            Common.ajax({
                //url:that.visitUrl+"/weixin/jsapi/auth",
                url:that.visitUrl+"/wechat/wechatLogin",
                data:{
                    code:code
                },
                success:function(data){
                    for(var i=0;i<data.thirdpart.length;i++){
                        if(data.thirdpart[i].type=="wx"){
                            that.openid=data.thirdpart[i].openid;
                            that.checkData();
                        }
                    }
                    that.token=data.token.token
                    console.log("postCode--data",data)
                },
                error:function(error){
                    console.log('postCode--error',error)
                }
            })
        },
        sortMoney:function(property){
            return function(a,b){
                var value1 = a[property];
                var value2 = b[property];
                return value1 - value2;
            }
        },
        allDatasfn : function(){
            var that = this;
            Common.ajax({
                url : that.visitUrl+"/team/chargeConfig",
                type:'GET',
                data : {},
                success : function(res){
                    console.log("/team/chargeConfig",res)
                    var data_list=[];
                    if(res.amount&&Object.prototype.toString.call(res.amount)=='[object Array]')
                    {
                        res.amount=res.amount.sort(that.sortMoney('money'))
                        for(var i= 0,len=res.amount.length;i<len;i++){
                            data_list.push({"money":res.amount[i].money,"getTime":res.amount[i].money,"send_gold":res.amount[i].gift})
                        }
                        that.allDatas =
                        {
                            "path":"Index",
                            "list":{
                                "wx_list":data_list,
                                "alipay_list":data_list
                            }
                        };
                        that.getCallback();
                        that.renderGoodsList();
                        that.bindEvent();
                        that.hisObj = HistoryPay.init();

                        //默认自动登录最近充值的账户
                        if(HistoryPay.init().datas&&HistoryPay.init().datas.length>0){
                            that.loginIn(HistoryPay.init().datas[0].id)
                        }

                    }
                },
                error : function(error){

                }
            })
        },
        getCallback : function(){
            //this指代整个Page
            var that = this, allData = that.allDatas;
            if(allData.callback){
                that.showCallback(true);
                $('#chenggong').attr("src","./sbkPayPublic/pay/images/"+allData.callback+".png");
                $('#callback_text').html(allData.callback_result||"支付结果");
            }
        },
        showCallback : function(flag){
            if(flag){
                $('#callback_bg').show();
            }else{
                $('#callback_bg').hide();
            }
        },

        showUser : function(isShow){
            var isShow = isShow||false;
            if(!isShow){
                $(".js_recharge_user").addClass("hide");
                $(".js_recharge_con").removeClass("hide");
            }else{
                $(".js_recharge_user").removeClass("hide");
                $(".js_recharge_con").addClass("hide");
            }
        },
        renderUserInfo : function(info){
            if(!info || !info.userid ||!info.phone){
                return;
            }
            var $con = $(".js_recharge_user");
            $con.find(".user_image img").attr("src",info.avatarUrl||'./sbkPayPublic/pay/mb/images/defaultHead.png');
            $con.find('.user_nick').html(info.displayName);
            $con.find('.js_user_id').html(info.phone);
            $con.find(".js_user_id").attr('id',info.userid);
        },
        renderGoodsList : function(){
            var that = this, allList = that.allDatas.list,html = [];
            for(var key in allList){
                html.push('<div class="wealth" data-key="'+key+'" id="'+key+'_con">');
                var oneList = allList[key];
                for(var i = 0, len = oneList.length; i < len; i++){
                    if(i%3==0){
                        if(i ==0){
                            html.push('<div class="one_line">');
                        }else{
                            html.push('</div> <div class="one_line">');
                        }
                    }
                    var one = oneList[i];
                    html.push(that.oneGoods(one));
                    if(i == len-1){
                        html.push('</div>');
                    }
                }
                html.push('</div>');
            }
            that.$goodsList.html(html.join(''));
            setTimeout(function(){
                that.showGoodsList();
            },20);
        },
        oneGoods : function(one){
            var that = this, tpl = $("#goods-list-tpl").html();
            one.is_send = (one.send_gold==0?"":"send");
            return Common.parseTemplate(one,tpl);
        },
        showGoodsList : function(channel){
            var that = this, channel = channel||that.channel;
            var $wrap = that.$goodsList;
            $("#"+channel+"_con").show().siblings().hide();
            //选中 上个渠道被选中的档位
            var $selectItem = $wrap.find(".diamond_detail.active");
            if($selectItem.length > 0){
                var index = $selectItem.index();
                $selectItem.removeClass("active");
                $("#"+channel+"_con").find(".diamond_detail").eq(index).addClass("active");
            }else{
                $('.diamond_detail').eq(0).addClass('active');
                setTimeout(function(){
                    that.checkData();
                },50);
            }
        },
        loginIn : function(phone){
            var that = this;
            Common.ajax({
                url : that.visitUrl+"/user/info",
                type:'GET',
                headers:{
                    Authorization: "Bearer "+that.token
                },
                data : {phone:phone},
                success : function(res){
                    console.log('res',res)
                    that.renderUserInfo(res);
                    that.showUser(true);
                    that.checkData();
                    that.hisObj.add({id:phone})
                },
                error : function(error){
                    that.showUidError(true);
                }
            })
        },
        loginOut : function(){
            console.log('logout')
            var that = this;
            that.showUser(false);
            $(".js_recharge_user .js_user_id").text("");
            that.checkData();
        },
        checkData : function(){
            var that = this;
            console.log('openid',that.openid)
            that.postData = {};
            var userid = $(".js_recharge_user .js_user_id").attr('id'),//userid
                channel_key = $(".js-channel-list").find(".js-channel-ul li.active").attr("data-channel"),
               money = 0;
            if(channel_key){
                var curGoodsList = $("#"+channel_key+"_con"),
                    $active = curGoodsList.find(".diamond_detail.active");
                //微信金额单位－－分，支付宝－－元
                money = (channel_key=='wx_list')?($active.attr("data-money")*100||0):($active.attr("data-money")||0)
            }
            console.log("userid",userid)
            console.log("channel_key",channel_key)
            if(!userid || !channel_key){
                that.$submitBtn.addClass("disabled");
            }else{
                console.log(that.openid)
                that.postData = {
                    type:'user',
                    userid:userid,
                    openid:that.openid,
                    //spbill_create_ip:'0.0.0.0',
                    channel : channel_key,
                    total_fee :money
                };
                that.$submitBtn.removeClass("disabled");
            }
        },
        // 显示或者隐藏 ipt error 信息
        showUidError : function(isShow,msg){
            var isShow = isShow||false;
            var msg = msg||'手机号没有注册';
            var $wrap = $(".recharge_point");
            if(isShow){
                $wrap.addClass("error");
                $wrap.find(".point_error").html(msg);
            }else{
                $wrap.removeClass("error");
            }
        },
        createOrder : function(){
            var that = this;
            postData = that.postData;
            console.log("that.postData",that.postData);
            var objParam = {
                wx_list : {url : that.visitUrl+"/3/weixinpay/jsapi",data : that.postData }
                //alipay_list : {url : "/Index/AlipayWap/createOrder",data : {id : postData.id} }
            };
            var cur = objParam[postData.channel];
            Common.ajax({
                url : cur.url,
                data : cur.data,
                headers:{
                    Authorization: "Bearer "+that.token
                },
                success : function(res){
                    console.log("res",res)
                    that.pay(res)
                }
            })
        },
        pay:function(data){
            var that=this;
            if (typeof WeixinJSBridge == "undefined"){
                if( document.addEventListener ){
                    document.addEventListener('WeixinJSBridgeReady', that.onBridgeReady, false);
                }else if (document.attachEvent){
                    document.attachEvent('WeixinJSBridgeReady', that.onBridgeReady);
                    document.attachEvent('onWeixinJSBridgeReady', that.onBridgeReady);
                }
            }else{
                that.onBridgeReady(data)
            }
        },
        onBridgeReady:function(data){
            WeixinJSBridge.invoke(
            'getBrandWCPayRequest', {
                    "appId" :data.appId,     //公众号名称，由商户传入
                    "timeStamp":""+data.timeStamp,         //时间戳，自1970年以来的秒数
                    "nonceStr" :data.nonceStr, //随机串
                    "package":data.package,// 统一支付接口返回的prepay_id参数值，提交格式如：prepay_id=***）
                    "signType" :"MD5",         //微信签名方式：
                    "paySign":data.sign //微信签名
            },function(res){
                    //WeixinJSBridge.log(res.err_msg);
                    //for(var i in res){
                    //    alert(res[i])
                    //}
                    //alert(res.err_code +","+ res.err_desc +","+ res.err_msg);
                if(res.err_msg == "get_brand_wcpay_request:ok" ) {
                    Lycam.alert("您已支付成功")
                }     // 使用以上方式判断前端返回,微信团队郑重提示：res.err_msg将在用户支付成功后返回ok。
                else if(res.err_msg == 'get_brand_wcpay_request:cancel'){
                    Lycam.alert("您已取消支付！")
                }else{
                    Lycam.alert("支付失败！")
                }
              }
            );
        },
        aliPay : function(){
        },
        bindEvent : function(){
            var that = this;
            $("#js-user-change-btn").click(function(e){
                that.loginOut();
            });
            //uid 输入input
            $(".js-uid-ipt").change(function(e){
                var $ipt = $(this),val = $ipt.val();
                that.showUidError(false);
            });

            $("#js-confirm-login").on("click",function(e){
                var $input = $(".js-uid-ipt");
                var val = $input.val();
                //if(!$input.val()){
                //    //that.showUidError(true,"");
                //    return;
                //}
                if(!/^(((13[0-9]{1})|(15[0-9]{1})|(18[0-9]{1}))+\d{8})$/.test(val)){
                    that.showUidError(true,"请正确输入手机号");
                    return;
                }
                that.loginIn(val);
            });
            //选择档位
            $("#js_all_goods_list").on("click",".diamond_detail",function(e){
                var $item = $(this);
                if($item.hasClass("active")){
                    return;
                }
                $item.closest(".pay_list_container").find(".diamond_detail")
                    .removeClass("active");
                $item.addClass("active");
                that.checkData();
            });

            // 查看更多支付方式的显示与隐藏
            $('#js_pay_more').on('click',function(){
                if($('.pay_way').hasClass('hide')){
                    $('.pay_way').removeClass('hide').addClass('show');
                    $(this).removeClass('down').addClass('up');
                }else{
                    $('.pay_way').removeClass('show').addClass('hide');
                    $(this).removeClass('up').addClass('down');
                }
            });
            // 选择支付方式
            $(".js-channel-ul").on("click","li.item",function(e){
                var $item = $(this);
                if($item.hasClass("active")){
                    return;
                }
                $item.addClass("active").siblings().removeClass("active");
                that.channel = $item.attr("data-channel")||"wx_list";
                that.showGoodsList();
                that.checkData();
            });
            that.$submitBtn.on("click",function(e){
                var $btn = $(this);
                if($btn.hasClass("disabled")){
                    return;
                }
                //$btn.addClass("disabled");
                that.createOrder(function(){
                    $btn.removeClass("disabled");
                });
            });
            $('.callback_close').click(function() {
                that.showCallback(false);
            });

        }

    };


    $(function(){
        Page.init();
    });


})(jQuery);
