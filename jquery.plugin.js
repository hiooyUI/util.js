/**
 * 分页异步获取列表数据，页面向上滚动时候加载前面页码，向下滚动时加载后面页码
 *
 * @param {Object} options
 *        - {String} ajaxdata_url -- ajax异步的URL 如data.php
 *        - {String} page_val_name -- ajax异步的URL中的页码参数名 如pageno
 *        - {Number} page_no -- 初始加载页码，默认1  [如2,则与前面两参数结合为data.php?pageno=2
 *        - {Boolean} is_lazyload -- 是否开启懒加载
 *        - {Number} page_count --  总页数
 *        - {String} empty_msg -- 没有数据的时候提示（可传输图片） 
 *        - {String} ending_msg -- 最大页码显示提示
 */
$.fn.list_data = function (options) {
    //参数
    var This = $(this);
    var flag = false;//flag为false时为初次加载，防止不断加载
    var defaults = {
        ajaxdata_url: '',
        page_val_name: 'current',
        page_no: 1,
        page_count: '',
        is_lazyload: true,
        loading_msg: '加载中...',
        empty_msg: '没有相关数据！',
        ending_msg: '没有更多数据了!'
    };
    var opt = $.extend(defaults, options)

    //没有数据的提示语
    if (opt.page_count <= 0) {
        This.html("<div class='ui-no-msg'>" + opt.empty_msg + "</div>");
        return true;
    }

    //获取页码，暂时不会用到
    var get_return_page = function () {
        /*var url = location.href;
        var page = '';
        if (url.indexOf("#") > 0) {
            var arr = url.split("#");
            var pagestr = arr[1];
            if (pagestr.indexOf("_") > 0) {
                var arr2 = pagestr.split("_");
                var page = arr2[0];
            }
        }
        if (page == '' || page == undefined) {
            return 1;
        } else {
            return page;
        }*/
        return opt.page_no;
    }

    //基础参数
    var page = get_return_page() * 1;
    var page_up = page;
    var page_down = page;

    //异步加载数据
    var loadmore = function (page, pos) {
        var loading = "<div class='ajax-loading'>" + opt.loading_msg + "</div>";
        $.ajax({
            type: "GET",
            url: opt.ajaxdata_url + "&" + opt.page_val_name + "=" + page,
            beforeSend: function () {
                $(".ajax-loading").remove();
                $(".ui-no-msg").remove();
                if (pos == 'before') {
                    $(loading).insertBefore(This);
                } else {
                    $(loading).insertAfter(This);
                }
                $(".ajax-loading").show();
                flag = true;
            },
            dataType: "html",
            error: function () {
                //This.html("<div class='ui-no-msg'>数据异常，请刷新重试！</div>");
                $("<div class='ui-no-msg'>数据异常，请刷新重试！</div>").appendTo(This);
                $(".ajax-loading").remove();
            },
            success: function (content) {
                flag = false;
                content = $.parseHTML(content);
                if (pos == 'before') {
                    $(content).prependTo(This);
                } else {
                    $(content).appendTo(This);
                }
                $(".ajax-loading").remove();
                $(".ui-no-msg").remove();

                //是否开启懒加载
                if (opt.is_lazyload == true) {
                    lazyLoadImgs(This);
                }
            }

        });
    }

    //懒加载
    function lazyLoadImgs(e) {
        e.find("img").lazyload({
            effect: "show",
            event: "sporty"
        });
        var timeout = setTimeout(function () { e.find("img").trigger("sporty") }, 500);
    }

    //初始加载
    if (flag == false) {
        loadmore(page, 'after');

        $(window).scroll(function () {
            var scrollTop = $(this).scrollTop();
            var scrollHeight = $(document).height();
            var windowHeight = $(this).height();

            //滚动到顶部 
            if (scrollTop == 0) {
                if (page_up > 1) {
                    page_up--;
                    //loadmore(page_up, 'before');暂时不需要向上滚动加载
                }
            } else {
                //滚动到底部 
                if (scrollTop + windowHeight >= (scrollHeight - 200)) {//到离底部200像素就开始加载
                    if (page_down < opt.page_count) {
                        page_down++;
                        loadmore(page_down, 'after');
                    } else {
                        $(".ajax-ending").remove();
                        $("<div class='ajax-ending'>" + opt.ending_msg + "</div>").appendTo(This);
                        $(".ajax-ending").delay(2000).hide();
                    }
                }
            }
        });
    }

}

/**
 * 页面上下拉换屏，海印优选微信商城商品详情页普遍使用
 * 使用方式：
 *   - var pts = new $.fn.pullSwitch2Pages();
 *   - 或者直接 $.fn.pullSwitch2Pages();
 *
 * @param {Object} options
 *        - {String} firstPage -- 首屏元素选择器
 *        - {String} secondPage -- 次屏元素选择器
 *        - {Function} onFirstPage -- 当切换到首屏时执行的回调函数
 *        - {Function} onSecondPage -- 当切换到次屏时执行的回调函数
 */
$.fn.pullSwitch2Pages = function (options) {
    var defaults = {
        firstPage: '#page_1',
        secondPage: '#page_2',
        onFirstPage: function () { },
        onSecondPage: function () { }
    }
    options = $.extend({}, defaults, options);
    
    var _self = this;
    _self.currentPage = 1,
    _self.isMoving = false,
    _self.isTouching = false,
    _self.startY = 0,
    _self.currentY = 0;
    options.onFirstPage();
    
    document.addEventListener('touchstart', function (event) {
        _self.isTouching = true;
        _self.startY = event.changedTouches[0].pageY;
    }, false);
    document.addEventListener('touchmove', function (event) {
        _self.currentY = event.changedTouches[0].pageY;
        if (shallTrigger()) {
            event.preventDefault();
        }
    }, false);
    document.addEventListener('touchend', function (event) {
        _self.currentY = event.changedTouches[0].pageY;
        switchPage();
        _self.isTouching = false;
        _self.startY = 0;
        _self.currentY = 0;
    }, false);
    function switchPage() {
        var scrollTop = $(window).scrollTop();
        var scrollHeight = $(document).height();
        var windowHeight = $(window).height();
        if (scrollTop + windowHeight >= scrollHeight && !_self.isMoving && _self.currentY - _self.startY < -15) {
            if (_self.currentPage == 1 && _self.isTouching) {
                $(options.firstPage).fadeOut();
                $(options.secondPage).fadeIn();
                $("body,html").animate({ scrollTop: 0 }, 10);
                options.onSecondPage();
                _self.currentPage = 2;
            }
        } else if (scrollTop <= 0 && !_self.isMoving && _self.currentY - _self.startY > 15) {
            if (_self.currentPage == 2 && _self.isTouching) {
                _self.isMoving = true;
                $(options.firstPage).fadeIn();
                $(options.secondPage).fadeOut();
                options.onFirstPage();
                setTimeout(function () {
                    _self.isMoving = false;
                    _self.currentPage = 1;
                }, 1000);
            }
        }
    }
    function shallTrigger() {
        var scrollTop = $(window).scrollTop();
        var scrollHeight = $(document).height();
        var windowHeight = $(window).height();
        if ((scrollTop + windowHeight >= scrollHeight && _self.currentPage == 1 && _self.currentY - _self.startY < -5) || (scrollTop <= 0 && _self.currentPage == 2 && _self.currentY - _self.startY > 5)) {
            return true;
        } else {
            return false;
        }
    }
    /**
     * 可以暴露给外面使用的函数，用于返回到首屏
     * 使用方式：
     *   - var pts = new $.fn.pullSwitch2Pages();
     *   - pts.back();
     */
    _self.back = function () { 
        if (_self.currentPage == 2 && !_self.isMoving) {
            _self.isMoving = true;
            $(options.secondPage).fadeOut();
            $(options.firstPage).slideDown("slow");
            options.onFirstPage();
            setTimeout(function () {
                _self.isMoving = false;
                _self.currentPage = 1;
            }, 1000);
        }
    }
}
