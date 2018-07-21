/**
 * Created by laikanz on 18/3/13.
 */
mui(".mui-content").on('tap','#getCode',function(){
    var tel=mui('input')[0].value;
    var name=mui('input')[1].value;
    var area=mui('input')[2].value;
    var school=mui('input')[3].value;
    var college=mui('input')[4].value;
    var major=mui('input')[5].value;
    var data=JSON.stringify({
        phone:tel,
        name:name,
        area:area,
        school:school,
        college:college,
        major:major
    })
    if(tel&&name&&area&&school&&college&&major){
        $.ajax({
            url:serverHttp+'/api/raceIdent',
            data:data,
            type:'post',//HTTP请求类型
            contentType: 'application/json',
            headers: {
               Authorization: token
            },
            success:function(data){
                if(data.status=='exists'){
                    mui.alert('您的验证码为'+data.data.identCode,'您已拥有验证码')
                }else if(data.status=='new'){
                    mui.alert('您的验证码为'+data.data.identCode,'获取成功')
                }
            },
            error:function(xhr,type,errorThrown){
                //异常处理；
                mui.toast(xhr.responseJSON.error_description)
                console.log(xhr);
            }
        });
    }else{
        mui.toast('信息未填写完整',50000);
    }
})

var place=getQueryString('place');
var school=getQueryString('school');
if(school){
    $('#title>h5:first-of-type').html(school+'新媒体知识大赛');
}
$('#input>.inputItem:nth-of-type(3)>input').val(place);
$('#input>.inputItem:nth-of-type(4)>input').val(school);