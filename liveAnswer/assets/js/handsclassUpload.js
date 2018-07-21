/**
 * Created by laikanz on 17/4/14.
 */
$(function() {
    var userInfo = JSON.parse(localStorage.getItem("userInfo"));
    var oncegoon = false; //一次只能选择一个文件
    var fileNames = []; //用于限制上传同一文件名文件
    var uploader = null;
    var uploadId;
    var uploadTime = 0;
    getfiles()
    uploadImg()

    function uploadImg() {
        uploader = WebUploader.create({
            // 选完文件后，是否自动上传。
            auto: false,
            // swf文件路径
            swf: 'http://shouboke.tv/sbkUploadResource/js/Uploader.swf',
            fileVal: 'doc',
            pick: {
                id: '#upfile'
            },
            //threads:1,
            chunked: true,
            //server:'http://192.168.1.110:1337/files/multipart',
            server: $.serverHttp + '/files/multipart',
            headers: {
                Authorization: "Bearer " + userInfo.token.token
            },
            method: 'POST',
            //                fileNumLimit:1,
            accept: {
                title: '允许上传的文件类型',
                extensions: '',
                mimeTypes: 'image/jpeg,image/png,image/tiff,application/pdf,video/3gpp,video/x-m4v,video/mp4,video/quicktime'
            },
            compress: false
        });

        uploader.on('beforeFileQueued', function(file) {
            uploadTime = new Date().getTime()
            console.log("开始时间", formatDate(new Date().getTime(), 'HH:mm'))
                //获取uploadId用于分片传输标记
            getUploadId(file.name)
            $("#upfile").unbind("click")
            if (fileNames.indexOf(file.name) == -1) {
                var size = file.size / (1024 * 1024).toFixed(2)
                if (file.ext == "pdf" && size > 18) {
                    alert("上传的pdf文件大小不能超过18M,请重新选择。");
                    $("#fileName").html("文件名");
                    return false;
                } else if (file.type.indexOf("video") > -1 && size > 3072) {
                    alert("上传的视频大小不能超过3072M,请重新选择。");
                    $("#fileName").html("文件名");
                    return false;
                } else {
                    uploader.reset();
                }
            } else {
                alert("请不要上传同名文件")
                uploader.cancelFile(file);
                uploader.reset();
            }
        });
        uploader.on('uploadBeforeSend', function(obj, formData, headers) {
            formData.uploadId = uploadId
            if (!formData.chunks) {
                formData.chunks = "1";
                formData.chunk = "0";
            }
        });
        // 文件上传过程中创建进度条实时显示。
        uploader.on('uploadProgress', function(file, percentage) {
            $("#fileName").html(file.name)
            var $li = $('.webuploader-pick'),
                $percent = $li.find('.progress span');
            // 避免重复创建
            if (!$percent.length) {
                $percent = $('<p class="progress"><span></span></p>')
                    .appendTo($li)
                    .find('span');
            }
            $percent.css('width', percentage * 100 + '%');
            $('.webuploader-pick').find('.progress').fadeIn();
            //上传过程中禁止再选择文件
            $("#upfile").click(function(e) {
                e.preventDefault();
            })
        });
        uploader.on('uploadError', function(file) {
            console.log('uploadError', file)
            $("#fileName").html("文件名");
            $("#upfile").unbind("click")
            alert("上传失败，请重试")
        });
        uploader.on('uploadSuccess', function(file, response) {
            uploadTime = ((new Date().getTime() - uploadTime) / 1000 / 60).toFixed(0)
            console.log("结束时间", formatDate(new Date().getTime(), 'HH:mm'))
            console.log("共花费：" + uploadTime + "分钟")
            console.log('response', response)
                //上传完成后可再选择文件
            $("#upfile").unbind("click")
            fileNames.push(response.filename)
            var $dd = ""
            $dd += '<dd class="c clearfix">' +
                '<p class="p">' + response.filename + '</p>' +
                '<p class="e">' +
                '<input class="e_top delete" type="image" src="http://shouboke.tv/sbkUploadResource/img/delete.png" id="' + response.id + '">' +
                '</p>' +
                '</dd>';
            $("#fileListContainer").prepend($dd) //向容器内第一个子节点前一位插入dom
            $('.webuploader-pick').find('.progress').fadeOut();
            if (!oncegoon) {
                oncegoon = true;
                var $span = '<span class="goonUpload">继续上传</span>'
                $(".webuploader-pick").append($span)
            }
        });
        uploader.on('uploadComplete', function(file) {
            console.log('uploadComplete', file)
            $("#fileName").html("文件名");
            $("#upfile").unbind("click")
        });

    }

    function getfiles() {
        $.ajax({
            url: $.serverHttp + '/files',
            headers: {
                Authorization: "Bearer " + userInfo.token.token
            },
            type: "get",
            data: {
                page: 0
            },
            success: function(data) {
                var $dd = "",
                    data = data.items
                for (var i = 0; i < data.length; i++) {
                    fileNames.push(data[i].filename)
                    $dd += '<dd class="c clearfix">' +
                        '<p class="p">' + data[i].filename + '</p>' +
                        '<p class="e">' +
                        '<input class="e_top delete" type="image" src="http://shouboke.tv/sbkUploadResource/img/delete.png" id="' + data[i].id + '">' +
                        '</p>' +
                        '</dd>'
                }
                $("#fileListContainer").html($dd)
            },
            error: function(error) {
                console.log(error);
            }
        });
    }

    function deleteModal(id) {
        $("#deleteBigBox").css("display", "block");
        $("#sureDelete").one("click", function() {
            $("#deleteBigBox").css("display", "none");
            $.ajax({
                url: $.serverHttp + '/files',
                headers: {
                    Authorization: "Bearer " + userInfo.token.token
                },
                type: "DELETE",
                data: {
                    fid: id
                        //type:'delete'
                },
                success: function(data) {
                    if (data.success) {
                        var deleteFileName = $("#" + id).parent().prev().text()
                        fileNames.remove(deleteFileName)
                        $("#" + id).parent().parent().remove();
                    }
                },
                error: function(error) {
                    console.log(error);
                    alert("删除失败")
                }
            });
        })
    }
    //获取uploadId用于上传分片文件
    function getUploadId(fileName) {
        $.ajax({
            url: $.serverHttp + '/files/uploadId',
            headers: {
                Authorization: "Bearer " + userInfo.token.token
            },
            type: "get",
            data: {
                name: fileName
            },
            success: function(data) {
                uploadId = data.uploadId
                uploader.upload()
            },
            error: function(error) {
                console.log(error)
            }
        })
    }

    function formatDate(time, format) {
        var t = new Date(time);
        var tf = function(i) { return (i < 10 ? '0' : '') + i };
        return format.replace(/yyyy|MM|dd|HH|mm|ss/g, function(a) {
            switch (a) {
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
    };
    $("#cancelDelete").click(function() {
        $("#deleteBigBox").css("display", "none");
    })
    $("#fileListContainer").on('click', ".delete", function() {
        var $id = $(this).attr("id")
        deleteModal($id)
    })
});