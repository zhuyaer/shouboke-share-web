/**
 * Created by lycamhost on 16/11/17.
 */


// dataTable相关
var dataTableLan={
    "sProcessing":"正在加载中......",
    "sLengthMenu":"每页显示 _MENU_ 条记录",
    "sZeroRecords":"对不起，查询不到相关数据！",
    "sEmptyTable":"表中无数据存在！",
    "sInfo":"当前显示 _START_ 到 _END_ 条，共 _TOTAL_ 条记录",
    "sInfoEmpty":"当前显示0条记录",
    "sInfoFiltered":"数据表中共为 _MAX_ 条记录",
    "sSearch":"搜索",
    "oPaginate":{
        "sFirst": "首页",
        "sPrevious":"上一页",
        "sNext": "下一页",
        "sLast": "末页"
    }
};
var paging=[
    [10,20,30,-1], [10,20,30, "All"]
];

//时间格式化
function formatDate(time, format){
    var t = new Date(time);
    var tf = function(i){return (i < 10 ? '0' : '') + i};
    return format.replace(/yyyy|MM|dd|HH|mm|ss/g, function(a){
        switch(a){
            case 'yyyy':
                return tf(t.getFullYear());
                break;
            case 'MM':
                return tf(t.getMonth() + 1);
                break;
            case 'mm':
                return tf(t.getMinutes());
                break;
            case 'dd':
                return tf(t.getDate());
                break;
            case 'HH':
                return tf(t.getHours());
                break;
            case 'ss':
                return tf(t.getSeconds());
                break;
        }
    })
}