/**
 * Created by laikanz on 16/9/30.
 */
var HistoryPay = {
    datas : [],
    key : "charge_history",
    $container : $("#js-history-con"),
    maxLength : 3,
    isInit : false,
    init : function(){
        var  that = this;
        that.get();
        if(!that.isInit){
            that.bindEvent();
            that.isInit = true;
        }

        return this;
    },
    get : function(){
        var that = this;
        var str = localStorage[that.key]||"";
        if(!str){
            console.log("没有历史");
            return;
        }

        try{
            that.datas = JSON.parse(str);
            if(Object.prototype.toString.call(that.datas)!=='[object Array]'){
                that.datas=eval("(" + that.datas + ")")
            }
        }catch (e){
            alert("parse error");
        }
    },
    add : function(one){
        var that = this;
        if(!one || $.isEmptyObject(one)){
            return;
        }
        if(!one.id){
            console.error("id is error");
            return;
        }
        for(var i = 0,len = that.datas.length; i < len; i++ ){
            if(that.datas[i].id == one.id){
                that.datas.splice(i,1);
                break;
            }
        }
        that.datas.unshift(one);//向头部添加
        that.datas.splice(that.maxLength);
        that.save();
    },
    save : function(){
        var that = this;
        if(!that.datas||!that.datas.length){
            console.log("empty datas");
            delete localStorage[that.key];
            return;
        }
        try{
            localStorage[that.key] = JSON.stringify(that.datas);
        }catch (e){
            alert("save parse stringfy error");
        }
    },
    del : function(id){
        var that = this,datas = that.datas;
        if(!id){
            return;
        }
        for(var i = 0,len = datas.length; i < len; i++ ){
            if(datas[i].id == id){
                datas.splice(i,1);
                break;
            }
        }
        that.save();
    },
    renderList : function(){
        var that = this, datas = that.datas,html = [];
        if(!datas||datas.length===0){
            that.renderEmpty();
            return;
        }
        for(var i = 0, len = datas.length; i < len; i++){
            var one= datas[i];
            if(!one){
                continue;
            }
            html.push('<li data-id="'+one.id+'" class="h-item">'+one.id+'<span class="del-btn js-del-btn"></span></li>');
        }
        that.$container.find("ul").html(html.join(''));
    },
    renderEmpty : function(){
        var that = this;
        var html = "<span class='no-his-tip'>没有充值记录</span>";
        that.$container.find("ul").html(html);
    },
    show : function(){
        var that = this;
        that.renderList();
        that.$container.show();
        $(".js-switch-btn").addClass("open");
    },
    hide : function(){
        var that = this;
        that.$container.hide();
        $(".js-switch-btn").removeClass("open");
    },
    bindEvent : function(){
        var that = this, $switchBtn = $(".js-switch-btn"), $okBtn = $("#js-confirm-login");

        $switchBtn.on("click",function(e){
            var btn = $(this);
            if(btn.hasClass("open")){
                that.hide();
            }else{
                that.show();
            }
        });
        that.$container.on("click",".js-del-btn",function(e){
            var $btn = $(this), $item = $btn.closest("li"),$list = $btn.closest("ul");
            var uid = $item.attr("data-id");
            if(!uid){
                return;
            }
            $item.remove();
            that.del(uid);
            if($list.children().length ===0 ){
                that.renderEmpty();
            }
            e.stopPropagation();
        });
        $(".js-uid-ipt").on("input",function(){
            console.log("input event");
            that.hide();
        });
        $(".js-uid-ipt").on("change",function(){
            console.log("change event");
        });
        that.$container.on("click",".h-item",function(e){
            var $item = $(this);
            var uid = $item.attr("data-id");
            if(!uid){
                return;
            }
            $(".js-uid-ipt").val(uid);
            that.hide();
        });


    }




};


