/**
 * Created by laikanz on 18/3/2.
 */
var _this={};
var coverUrl,posterUrl;
var trueOption='A';//默认正确答案
var questionType='教育';
var questionDiff=1;
var quizRace='';//当前直播答题题集ID
var addIds=[];//用以存放直播答题需要添加的题集题目ID
var streamObj={}//点击课程时，临时存放课程相关信息，如封面时间等
var checkShow=false//题库复选框是否显示
var replaceShow=false//题库单选框是否显示
var oldQuizId;//待替换ID
var questionLength;//统计当前题集中的题目数量
var quesData;//临时存放当前的题集信息
var answeredNum=1;//临时存放当前已达题目索引
var timer1;//课程倒计时
var overFlag=false;//直播答题结束标识，true代表，所有人全军覆没
_this.userInfo = JSON.parse(localStorage.getItem('userInfo'));
getQuizSet();
$(".trueOption").change(function(){//获取正确选项
    trueOption=$(this).val()
});
$(".questionType").change(function(){//获取题目类型
    questionType=$(this).val()
});
$(".questionDiff").change(function(){//获取题目难度
    questionDiff=$(this).val()
});

$('#courseList').on('click','.coverImg',function(){//点击课程封面，获取直播课程信息、以及题集题目
    $('#courseList>div:first-child').hide();
    quizRace=$(this).parent().attr('quizRace');
    $('#courseDetail').show();
    $('#startAnswer').show();
    $('#courseDetail .continueAdd').hide();
    getCourseQuestion();
    streamObj.coverUrl=$(this).find('img').attr('src');
    streamObj._id=$(this).parent().attr('_id');
    streamObj.title=$(this).parent().find('.videoInfo>p:first-of-type').html();
    streamObj.awards=$(this).parent().find('.awards').attr('awards');
    streamObj.time=$(this).parent().find('.time').html();
    $('#courseDetail .delete').hide();
    $('#courseDetail .classView img').attr('src',streamObj.coverUrl)
    $('#courseDetail .classViewInfo>h5').html(streamObj.title)
    $('#courseList .paginationDiv').hide();
    $('#liVing').hide();
    $('.move').hide();
    countDown(streamObj.time);
})

$('#courseList').on('click','.edit',function(){//点击编辑课程，获取直播课程信息、以及题集题目
    quizRace=$(this).parent().parent().parent().attr('quizRace');
    streamObj.coverUrl=$(this).parent().parent().parent().find('img').attr('src');
    streamObj._id=$(this).parent().parent().parent().attr('_id');
    streamObj.title=$(this).parent().parent().parent().find('.videoInfo>p:first-of-type').html();
    streamObj.awards=$(this).parent().parent().find('.awards').attr('awards');
    streamObj.time=$(this).parent().parent().find('.time').html();
    $('#courseDetail .classView img').attr('src',streamObj.coverUrl)
    $('#courseDetail .classViewInfo>h5').html(streamObj.title)
    $('#startAnswer').hide();
    $('#courseList>div:first-child').hide();
    $('#courseList .paginationDiv').hide();
    $('#courseDetail').show();
    $('#courseDetail .continueAdd').show();
    $('#liVing').hide();
    $('.move').show();
    getCourseQuestion();
    countDown(streamObj.time);
})

function countDown(time){//倒计时计算函数
    timer1=setInterval(function(){
        var now=Date.parse(new Date());//当前时间
        var _time=Date.parse(time);//直播开始时间
        var leftTime=_time-now;
        var days=parseInt(leftTime / 1000 / 60 / 60 / 24);//剩余天数
        var hours = parseInt(leftTime / 1000 / 60 / 60 % 24); //计算剩余的小时
        var minutes = parseInt(leftTime / 1000 / 60 % 60);//计算剩余的分钟
        var seconds = parseInt(leftTime / 1000 % 60, 10);//计算剩余的秒数
        if(leftTime>0){
            $('#courseDetail .classViewInfo span:nth-of-type(2)').html('课程倒计时：'+days+'天'+hours+'小时'+minutes+'分'+seconds+'秒')
        }else{
            clearInterval(timer1);
        }
    },1000)
}

$('#courseDetail').on('click','.nextQuestion',function(){
    var num=answeredNum;
    $('.living .result').hide();
    if(num<quesData.quizzes.length){
        $('#courseDetail .listItem:nth-of-type('+(num+1)+')').find('.opreation').hide();
        setLiving(quesData.quizzes[num],(num+1))
    }else{
        getCourseQuestion();
    }
})

$('#courseDetail').on('click','.distribute',function(){//分发题目
    var $this=this;
    var quizId=$(this).attr('_id')
    var process='default';
    var _id=$(this).attr('_id');
    var index=$(this).parent().parent().attr('index');
    if(index=='1'){
        process='start';
    }
    var data={
        streamId:streamObj._id,
        quizRaceId:quizRace,
        process:process
    }
    $.ajax({
        url: $.serverHttp + '/api/race/question/'+quizId,
        headers: {
            Authorization: 'Bearer ' + _this.userInfo.token.token
        },
        contentType: 'application/json',
        type: 'post',
        data: JSON.stringify(data),
        success: function (data) {
            var i=10;
            var timer=setInterval(function(){//分发答题进入倒计时，倒计时结束之后修改按钮状态
                i--;
                if(i>=0){
                    $('#countDown').html(i)
                }else{
                    clearInterval(timer)
                    $($this).attr('disabled','disabled');
                    $($this).addClass('btn-default');
                    $($this).removeClass('btn-success');
                    $($this).next().removeAttr('disabled');
                    $($this).next().removeClass('btn-default');
                    $($this).next().addClass('btn-success');
                }
            },1000)

        },
        error: function (error) {
            swal({
                title: "提示！",
                text: "下发失败",
                timer: 1000,
                showConfirmButton: false
            });
        }
    })
})

$(document).on('click','.publishAnswer',function(){//获取并公布单题答题情况
    var process='default';
    var $this=this;
    var _id=$(this).attr('_id');
    var index=$(this).parent().parent().attr('index');
    if(index=='1'){
        process='start';
    }else if(index==questionLength){
        process='end';
    }
    var data={
        streamId:streamObj._id,
        quizRaceId:quizRace,
        process:process
    }
    $.ajax({
        url: $.serverHttp + '/api/race/answer/'+_id,
        headers: {
            Authorization: 'Bearer ' + _this.userInfo.token.token
        },
        contentType: 'application/json',
        type: 'post',
        data: JSON.stringify(data),
        success: function (data) {
            document.getElementsByClassName('chooseCount')[0].innerHTML=data.optionsInfo.opts['1']+'人';
            document.getElementsByClassName('chooseCount')[1].innerHTML=data.optionsInfo.opts['2']+'人';
            document.getElementsByClassName('chooseCount')[2].innerHTML=data.optionsInfo.opts['3']+'人';
            document.getElementsByClassName('chooseCount')[0].style.display='inline';
            document.getElementsByClassName('chooseCount')[1].style.display='inline';
            document.getElementsByClassName('chooseCount')[2].style.display='inline';
            $($this).attr('disabled','disabled');
            $($this).addClass('btn-default');
            $($this).removeClass('btn-success');
            $($this).next().removeAttr('disabled');
            $($this).next().removeClass('btn-default');
            $($this).next().addClass('btn-success');
            $('.living .result').show();
            $('.living .result').find('span:nth-of-type(2)').html((data.optionsInfo.opts['1']+data.optionsInfo.opts['2']+data.optionsInfo.opts['3']));
            $('.living .result').find('span:nth-of-type(4)').html(data.optionsInfo.revi);
            if(data.optionsInfo.opts[data.rightAnswer]==0&&data.optionsInfo.revi==0){
                overFlag=true;
                swal("提示！", "很遗憾，全军覆没", "error");
            }
        },
        error: function (error) {
            swal({
                title: "提示！",
                text: "获取答题情况失败",
                timer: 1000,
                showConfirmButton: false
            });
        }
    });
})

$(document).on('click','#publishResult',function(){//获取并公布最终答题结果
    var data={
        streamId:streamObj._id
    }
    $.ajax({
        url: $.serverHttp + '/api/race/final/'+quizRace,
        headers: {
            Authorization: 'Bearer ' + _this.userInfo.token.token
        },
        contentType: 'application/json',
        type: 'post',
        data: JSON.stringify(data),
        success: function (data) {
            swal({
                title: "提示！",
                text: "公布答题结果成功",
                timer: 1000,
                showConfirmButton: false
            });
        },
        error: function (error) {
            swal({
                title: "提示！",
                text: "公布答题结果失败",
                timer: 1000,
                showConfirmButton: false
            });
        }
    });
})

$('#courseDetail').on('click','#startAnswer',function(){//开始答题
    if(questionLength>0){
        $('#liVing').show();
        $(this).hide();
    }else{
        swal({
            title: "提示！",
            text: "当前直播还未添加题目",
            timer: 1000,
            showConfirmButton: false
        });
    }
})

function uploadImg(file,type){//上传课程封面
    var file = file.files[0];
    $.ajax({
        url: $.serverHttp + '/api/upload/policy',
        headers: {
            Authorization: 'Bearer ' + _this.userInfo.token.token
        },
        success:function(res){
            var fd = new FormData()
            var host=res.host
            fd.append('OSSAccessKeyId', res.OSSAccessKeyId)
            fd.append('policy', res.policy)
            fd.append('signature', res.signature)
            fd.append('key', res.startsWith + res.saveName)
            fd.append('success_action_status', 200)
            fd.append('file', file, res.saveName)
            if(type=='cover'){
                coverUrl=res.host + '/' + res.startsWith + res.saveName
            }else{
                posterUrl=res.host + '/' + res.startsWith + res.saveName
            }
            $.ajax({
                url: host,
                type: 'post',
                data: fd,
                contentType: false,
                processData:false,
                success:function(data){
                    if(type=='cover'){
                        $("#liveCover").css("background-image","url("+coverUrl+")");
                    }else{
                        $("#livePoster").css("background-image","url("+posterUrl+")");
                    }
                },
                error:function(){

                }
            })
        },
        error: function (error) {
            console.log('getChargeIndoError', error);
        }
    })
}
$('#liveAnswer').on('click','#sureBuild',function(){//创建课程，成功后切换至添加题目界面
    var courseTitle=$('.courseTitle>input').val();
    var beginTime=$('.beginTime>input').val();
    var bonus=$('.bonus>input').val();
    var place=$('.place>input').val();
    var schoolName=$('.schoolName>input').val();
    var data={};
    data.title=courseTitle;
    data.startTime=formatDate(beginTime,'yyyy-MM-dd HH:mm');
    data.thumbnailUrl=coverUrl;
    data.quizRace={};
    data.quizRace.awards=Number(bonus);
    data.quizRace.zone=place;
    data.quizRace.school=schoolName;
    data.quizRace.poster=posterUrl;
    data.streamType="quizRace";
    //预定义数据，页面暂时用不到，接口需要
    data.category='教育';
    data.charge='0';
    data.description='nothing';
    data.dstPercent='0';
    data.duration='0.5h';
    data.ifCharge=false;
    data.isDst=false;
    data.isReplay=true;
    data.privacy=false;
    if(courseTitle&&beginTime&&bonus&&place&&schoolName){
        if(coverUrl&&posterUrl){
            $.ajax({
                url: $.serverHttp + '/api/stream/quizRace',
                headers: {
                    Authorization: 'Bearer ' + _this.userInfo.token.token
                },
                contentType: 'application/json',
                type: 'post',
                data: JSON.stringify(data),
                success: function (data) {
                    location.reload();
                    //quizRace=data.quizRace;
                    //$('#questionView .classView img').attr('src',data.thumbnailUrl);
                    //$('#questionView .classViewInfo h5').html(data.title);
                    //$('#questionView .classViewInfo span:first-of-type').html('奖金：¥ 100000');
                    //$('#questionView .classViewInfo span:nth-of-type(2)').html(data.startTime);
                    //$('#createCourse>ul').hide();
                    //$('#liveAnswer').hide();
                    //$('#questionView').show();
                    //$('#createCourse>ul').show();
                    //$('#publishLive').hide();
                },
                error: function (error) {
                    console.log('error', error);
                    swal({
                        title: "提示！",
                        text: error.responseJSON.error_description,
                        timer: 1000,
                        showConfirmButton: false
                    });
                }
            });
        }else{
            swal({
                title: "提示",
                text: "您还未上传封面或海报",
                timer: 2000,
                showConfirmButton: false
            });
        }
    }else{
        swal({
            title: "提示",
            text: "课程信息未填写完整",
            timer: 2000,
            showConfirmButton: false
        });
    }
})

function getQuizSet(){//获取题目设置，如分类难度等
    $.ajax({
        url: $.serverHttp + '/api/quiz/set',
        headers: {
            Authorization: 'Bearer ' + _this.userInfo.token.token
        },
        type: 'get',
        success:function(data){
            console.log(data)
            var html=''
            for(var i=0;i<data.CATEGORY.length;i++){
                html+='<option value="'+data.CATEGORY[i]+'">'+data.CATEGORY[i]+'</option>'
            }
            $('#questions .questionType').html(html)
        },
        error:function(){

        }
    })
}

$('#questions').on('change','.questionType',function(){
    getQuizzs(1,$(this).val(),$('.questionDiff').val())
})

$('#questions').on('change','.questionDiff',function(){
    getQuizzs(1,$(this).val(),$('.questionType').val())
})

function getQuizzs(page,difficulty,category){//获取题库列表
    $.ajax({
        url: $.serverHttp + '/api/quizzs',
        headers: {
            Authorization: 'Bearer ' + _this.userInfo.token.token
        },
        type: 'get',
        data:{
            page:page,
            resultsPerPage:10,
            DIFFICULTY:difficulty,
            CATEGORY:category
        },
        success:function(data){
            if(data.totalItems>0){
                $('#questions>div:nth-of-type(2)').show();
                $('#noQuestion').hide();
                var html='';
                for(var i=0;i<data.items.length;i++){
                    html+='<div id="'+data.items[i]._id+'" class="listItem"><input name="replace" type="radio" class="replaceQuestion"> <input type="checkbox" class="checkQuestions"><span class="questionNum">'+(i+1)+'.</span> <span class="questionDes">'+data.items[i].question+'</span><ul> <li class="is'+data.items[i].options[0].correct+'">A.'+data.items[i].options[0].content+'</li> <li class="is'+data.items[i].options[1].correct+'">B.'+data.items[i].options[1].content+'</li> <li class="is'+data.items[i].options[2].correct+'">C.'+data.items[i].options[2].content+'</li> </ul> <div class="opreation"> <span class="edit" _id="'+data.items[i]._id+'" data-toggle="modal" data-target="#editQuestion">编辑</span> <span class="delete" _id="'+data.items[i]._id+'">删除</span> </div></div>'
                }
                $('#questions .list').html(html);
                if(checkShow){
                    $('.checkQuestions').show();
                    $('#questions .opreation').hide();
                    $('#addToCourse').show();
                }
                if(replaceShow){
                    $('.replaceQuestion').show();
                    $('#questions .opreation').hide();
                    $('#replaceQuestion').show();
                }
                checkQuestions();
                $('#questions>.paginationDiv>.pagination').pagination({
                    showData:10,
                    totalData:data.totalItems,
                    coping: true,
                    homePage: '首页',
                    endPage: '末页',
                    prevContent: '上页',
                    nextContent: '下页',
                    current:page,
                    callback:function(api){
                        getQuizzs(api.getCurrent(),'简单','教育');
                    }
                });
            }else{
                $('#questions>div:nth-of-type(2)').hide();
                $('#noQuestion').show();
            }
        },
        error:function(){

        }
    })
}

function checkQuestions(){//翻页时将之前选中的题目选中
    for(let j=0;j<$('#questions .listItem').length;j++){
        var id=$('#questions .listItem')[j].getAttribute('id');
        if(addIds.indexOf(id)!=-1){
            $('#questions .listItem')[j].getElementsByClassName("checkQuestions")[0].setAttribute('checked',true);
        }
    }
}

$("#editQuestion").on('click',' #sureEdit',function(){//修改题目
    var data={};
    data.quiz={};
    var question=$('#editQuestion .questionDes>input').val();
    var trueOption=$('#editQuestion .trueOption').val();
    var option1={};
    var option2={};
    var option3={};
    var options=[];
    option1.correct=false;
    option2.correct=false;
    option3.correct=false;
    option1.content=$('#editQuestion input[name="option1"]').val();
    option2.content=$('#editQuestion input[name="option2"]').val();
    option3.content=$('#editQuestion input[name="option3"]').val();
    if(trueOption=='A'){
        option1.correct=true;
    }else if(trueOption=='B'){
        option2.correct=true;
    }else{
        option3.correct=true;
    }
    options.push(option1);
    options.push(option2);
    options.push(option3);
    data.quiz.options=options;
    data.quiz.question=question;
    data.quiz.category=questionType;
    data.quiz.difficulty=questionDiff;
    console.log(data.quiz)
    if(question&&option1.content&&option2.content&&option3.content){
        $.ajax({
            url: $.serverHttp + '/api/quiz/'+editId,
            headers: {
                Authorization: 'Bearer ' + _this.userInfo.token.token
            },
            contentType: 'application/json',
            type: 'put',
            data: JSON.stringify(data),
            success: function (data) {
                swal({title:"提示！", text:"修改成功", type:"success"},function(){
                    getQuizzs(1,'简单','教育');
                });
            },
            error: function (error) {
                swal("提示！", "修改失败", "error");
            }
        });
        $('#editQuestion').modal('hide')
    }else{
        swal({
            title: "提示",
            text: "题目未填写完整",
            timer: 2000,
            showConfirmButton: false
        });
    }
});

$("#questions").on('click',' .edit',function(e){//点击编辑按钮，获取题目ID
    editId=$(e.target).attr('_id');
    $.ajax({
        url: $.serverHttp + '/api/quizzs',
        headers: {
            Authorization: 'Bearer ' + _this.userInfo.token.token
        },
        contentType: 'application/json',
        data:{
            _id:editId
        },
        type: 'get',
        success: function (data) {
            $('#editQuestion .questionDes>input').val(data.items[0].question);
            $('#editQuestion input[name="option1"]').val(data.items[0].options[0].content);
            $('#editQuestion input[name="option2"]').val(data.items[0].options[1].content);
            $('#editQuestion input[name="option3"]').val(data.items[0].options[2].content);
            if(data.items[0].options[0].correct){
                $('#editQuestion .trueOption').find("option:first-of-type").attr("selected",true);
            }else if(data.items[0].options[1].correct){
                $('#editQuestion .trueOption').find("option:nth-of-type(2)").attr("selected",true);
            }else{
                $('#editQuestion .trueOption').find("option:nth-of-type(3)").attr("selected",true);
            }
            $('#editQuestion .questionType').val(data.items[0].category);
            $('#editQuestion .questionDiff').val(data.items[0].difficulty);
        },
        error: function (error) {
            console.log(error)
        }
    })
})

$('#courseList').on('click','.replace',function(){//题集维护，替换当前题目
    $('.mySoubokeContent .myQuestions').click();
    replaceShow=true;
    $('#addQuestions').hide();
    oldQuizId=$(this).attr('_id');
})

$('#courseList').on('click','.delete',function(){//题集维护，删除当前题目
    var _id=$(this).attr('_id');
    swal({
        title: "确定删除吗？",
        text: "删除后无法恢复",
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "确定删除！",
        closeOnConfirm: false
    }, function(){
        $.ajax({
            url: $.serverHttp + '/api/quizRace/'+quizRace,
            headers: {
                Authorization: 'Bearer ' + _this.userInfo.token.token
            },
            contentType: 'application/json',
            data:JSON.stringify({
                quizId:_id
            }),
            type: 'delete',
            success: function (data) {
                getCourseQuestion();
                swal("删除！", "删除成功", "success");
            },
            error: function (error) {
                swal("错误！", "删除失败", "error");
            }
        })
    });
})

$('#courseList').on('click','.move>span',function(){//题集维护，上移或下移题目
    var _id=$(this).parent().attr('_id');
    console.log(_id)
    var direction=-1;
    if($(this).hasClass('down')){
        direction=1
    }
    $.ajax({
        url: $.serverHttp + '/api/quizRace/'+quizRace+'/quiz',
        headers: {
            Authorization: 'Bearer ' + _this.userInfo.token.token
        },
        contentType: 'application/json',
        data:JSON.stringify({
            quizId:_id,
            direction:direction
        }),
        type: 'put',
        success: function (data) {
            getCourseQuestion();
            swal({
                title: "提示！",
                text: "移动成功",
                timer: 1000,
                showConfirmButton: false
            });
        },
        error: function (error) {
            swal({
                title: "提示！",
                text: error.responseJSON.error_description,
                timer: 1000,
                showConfirmButton: false
            });
        }
    })
})

function clearInput(){
    $('#inputQuestion #question').val('');
    $('#inputQuestion input[name="option1"]').val('');
    $('#inputQuestion input[name="option2"]').val('');
    $('#inputQuestion input[name="option3"]').val('');
}

$("#questions").on('click',' .delete',function(e){//题库维护，点击删除按钮，获取题目ID
    var deleteId=$(e.target).attr('_id');
    swal({
        title: "确定删除吗？",
        text: "删除后无法恢复",
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "确定删除！",
        closeOnConfirm: false
    }, function(){
        $.ajax({
            url: $.serverHttp + '/api/quiz/'+deleteId,
            headers: {
                Authorization: 'Bearer ' + _this.userInfo.token.token
            },
            contentType: 'application/json',
            type: 'delete',
            success: function (data) {
                swal("删除！", "删除成功", "success");
            },
            error: function (error) {
                swal("错误！", "删除失败", "error");
            }
        })
    });
})

$(document).on('click','.continueAdd',function(){//前往题库为当前直播答题添加题目
    $('.mySoubokeContent .myQuestions').click();
    $('.checkQuestions').show();
    $('#questions .opreation').hide();
    $('#addQuestions').hide();
    checkShow=true;
})

$('#questions').on('click','#addToCourse',function(){//添加题目到当前直播答题课程
    var data=JSON.stringify({
        ids:addIds
    });
    $.ajax({
        url: $.serverHttp + '/api/quizRace/'+quizRace,
        headers: {
            Authorization: 'Bearer ' + _this.userInfo.token.token
        },
        contentType: 'application/json',
        type: 'post',
        data:data,
        success: function (data) {
            $('.courseList').click();
            swal({title:"提示！", text:"添加成功", type:"success"},function(){
                $('#buildClass').click();
                addIds=[];
            });
        },
        error: function (error) {
            swal("提示！", "添加失败", "error");
        }
    })
})

$('#questions').on('click','#replaceQuestion',function(){//替换题目到当前直播答题课程
    var newQuizId=$('#questions input.replaceQuestion:checked').parent().attr('id');
    if(newQuizId){
        var data=JSON.stringify({
            newQuizId:newQuizId,
            oldQuizId:oldQuizId
        });
        $.ajax({
            url: $.serverHttp + '/api/quizRace/'+quizRace,
            headers: {
                Authorization: 'Bearer ' + _this.userInfo.token.token
            },
            contentType: 'application/json',
            type: 'put',
            data:data,
            success: function (data) {
                $('.mySoubokeContent .courseList').click();
            },
            error: function (error) {
                console.log(error)
                swal("提示！", error.responseJSON.error_description, "error");
            }
        })
    }else{
        swal("提示！", "您还未选择题目", "error");
    }
})


function getCourseQuestion(){//获取课程题集题目
    $('#courseDetail .list').html('');
    $.ajax({
        url: $.serverHttp + '/api/quizRace/'+quizRace,
        headers: {
            Authorization: 'Bearer ' + _this.userInfo.token.token
        },
        contentType: 'application/json',
        type: 'get',
        async: false,
        success: function (data) {
            var html='';
            var _data=data;
            var data=data.quizzes;
            quesData=_data;
            questionLength=data.length;
            if(data.length>0&&data.length==_data.processNum){
                $('#answerResult').show();
                $('#startAnswer').hide();
                $('#answerResult ul>li:first-of-type').find('p:first-of-type').text(_data.quizRace.totalJoinCount);
                $('#answerResult ul>li:nth-of-type(2)').find('p:first-of-type').text(_data.quizRace.winnerCount);
                $('#answerResult ul>li:nth-of-type(3)').find('p:first-of-type').text(_data.quizRace.awards);
                $('#answerResult ul>li:nth-of-type(4)').find('p:first-of-type').text(_data.quizRace.avgAwards);
            }else{
                $('#answerResult').hide();
                $('#startAnswer').show();
            }
            for(var i=0;i<data.length;i++){
                var countHtml1='';
                var countHtml2='';
                var countHtml3='';
                if(data[i].quizDetail.options[0]){
                    countHtml1='<span class="chooseCount" style="display: inline">'+data[i].quizDetail.options[0].count+'人</span>';
                }
                if(data[i].quizDetail.options[1]){
                    countHtml2='<span class="chooseCount" style="display: inline">'+data[i].quizDetail.options[1].count+'人</span>';
                }
                if(data[i].quizDetail.options[2]){
                    countHtml3='<span class="chooseCount" style="display: inline">'+data[i].quizDetail.options[2].count+'人</span>';
                }
                html+='<div _id="'+data[i].quiz._id+'" class="listItem"><span class="questionNum">'+(i+1)+'.</span> <span class="questionDes">'+data[i].quiz.question+'</span><ul> <li class="is'+data[i].quiz.options[0].correct+'">A.'+data[i].quiz.options[0].content+countHtml1+'</li> <li class="is'+data[i].quiz.options[1].correct+'">B.'+data[i].quiz.options[1].content+countHtml2+'</li> <li class="is'+data[i].quiz.options[2].correct+'">C.'+data[i].quiz.options[2].content+countHtml3+'</li> </ul> <div class="opreation"><span class="replace" _id="'+data[i].quiz._id+'">更换</span> <span class="delete" _id="'+data[i].quiz._id+'">删除</span><div class="move" _id="'+data[i].quiz._id+'"><span class="glyphicon glyphicon-arrow-up up" aria-hidden="true"></span><span class="glyphicon glyphicon-arrow-down down" aria-hidden="true"></span></div></div></div>'
            }
            answeredNum=_data.processNum;
            if(data.length>0&&data.length>_data.processNum){
                setLiving(data[_data.processNum],(_data.processNum+1));
            }else{
                $('#liVing').hide();
            }
            $('#courseDetail .list').html(html);
            for (var i=0;i<_data.processNum;i++){//将已答题目更换操作按钮隐藏
                $('#courseDetail .listItem:nth-of-type('+(i+1)+')').find('.opreation').hide();
            }
            if(timer1){
                clearInterval(timer1);
            }
        },
        error: function (error) {
            console.log(error)
        }
    })
}

function setLiving(data,index){//设置当前答题信息
    var livingHtml='';
    livingHtml='<div class="living" index="'+index+'"><span class="questionNum">'+index+'.</span><span class="questionDes">'+data.quiz.question+'</span> <ul> <li class="its'+data.quiz.options[0].correct+'">A.'+data.quiz.options[0].content+'<span class="chooseCount"></span></li> <li class="its'+data.quiz.options[1].correct+'">B.'+data.quiz.options[1].content+'<span class="chooseCount"></span></li> <li class="its'+data.quiz.options[2].correct+'">C.'+data.quiz.options[2].content+'<span class="chooseCount"></span></li> </ul> <div class="result"><span>答题人数：</span><span></span><span>复活卡使用人数：</span><span></span></div><div class="btns"> <button type="button" _id="'+data.quiz._id+'" class="distribute btn btn-success">分发题目</button> <button type="button" class="publishAnswer btn btn-default" _id="'+data.quiz._id+'" disabled="disabled">公布答案</button> <button type="button" class="nextQuestion btn btn-default"  disabled="disabled">下一题</button> </div> <div id="countDown">10 </div></div>'
    $('#liVing').html(livingHtml);
    answeredNum++;
}

$('#questions').on('click','.checkQuestions',function(){
    var checkFlag=$(this).is(':checked');
    var id=$(this).parent().attr('id');
    if(checkFlag){
        addIds.push(id)
    }else{
        var i=addIds.indexOf(id);
        addIds.splice(i,1);
    }
})

function getUserVideo(videoPage){//获取用户课程列表
    $.ajax({
        url: $.serverHttp + '/user/streams',
        headers: {
            Authorization: 'Bearer ' + _this.userInfo.token.token
        },
        contentType: 'application/json',
        type: 'get',
        data:{
            page:videoPage,
            resultsPerPage:9,
            status:'all'
        },
        success: function (data) {
            var html='';
            for(var i=0;i<data.items.length;i++){
                var priceTag='';
                var quizRaceAttr;
                var videoStatus='';
                var videoType='';
                var opreationTag='';
                if(data.items[i].quizRace){
                    videoType='直播答题'
                    opreationTag='<span class="edit">编辑</span>';
                }else{
                    opreationTag='<span class="uploadCOurse">课程下载</span>';
                    if(data.items[i].isSeries){
                        videoType='系列课'
                    }else{
                        videoType='单课'
                    }
                }
                if(data.items[i].status=='ready'){
                    videoStatus='预告';
                }else if(data.items[i].status=='over'){
                    videoStatus='回放';
                }else{
                    videoStatus='直播';
                }
                if(data.items[i].quizRace){
                    priceTag='<p class="awards" awards="'+data.items[i].quizRace.awards+'">¥ '+data.items[i].quizRace.awards+' 奖金</p>'
                    quizRaceAttr=data.items[i].quizRace._id
                }else{
                    priceTag='<p>¥ '+data.items[i].charge+'</p>';
                    quizRaceAttr='';
                }
                html+='<div quizRace="'+quizRaceAttr+'" _id="'+data.items[i].streamId+'" class="courseItem"> <div class="coverImg"> <img src="'+data.items[i].thumbnailUrl+'" alt=""/> </div> <div class="videoInfo"> <p>'+data.items[i].title+'</p>' +priceTag+ '<div class="line"></div> <div class="bottom"> <span class="timeTip">时间：</span> <span class="time">'+data.items[i].startTime+'</span> '+opreationTag+' <span class="del">删除</span> </div> </div> <div class="'+data.items[i].status+'Status videoStatus">'+videoStatus+'</div><div class="videoType">'+videoType+'</div></div>'
            }
            $('#courseList>div:first-of-type').html(html);
            $('#courseList>.paginationDiv>.pagination').pagination({
                showData:9,
                totalData:data.totalItems,
                coping: true,
                homePage: '首页',
                endPage: '末页',
                prevContent: '上页',
                nextContent: '下页',
                current:videoPage,
                callback:function(api){
                    getUserVideo(api.getCurrent());
                }
            });
        },
        error: function (error) {

        }
    })
}