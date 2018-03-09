let loadingRender = (function () {
    let $loadingBox = $('.loadingBox'),
        $run = $loadingBox.find('.run');

    //=>我们需要处理的图片  json格式的字符串
    let imgList = ["img/icon.png", "img/zf_concatAddress.png", "img/zf_concatInfo.png", "img/zf_concatPhone.png", "img/zf_course.png", "img/zf_course1.png", "img/zf_course2.png", "img/zf_course3.png", "img/zf_course4.png", "img/zf_course5.png", "img/zf_course6.png", "img/zf_cube1.png", "img/zf_cube2.png", "img/zf_cube3.png", "img/zf_cube4.png", "img/zf_cube5.png", "img/zf_cube6.png", "img/zf_cubeBg.jpg", "img/zf_cubeTip.png", "img/zf_emploment.png", "img/zf_messageArrow1.png", "img/zf_messageArrow2.png", "img/zf_messageChat.png", "img/zf_messageKeyboard.png", "img/zf_messageLogo.png", "img/zf_messageStudent.png", "img/zf_outline.png", "img/zf_phoneBg.jpg", "img/zf_phoneDetail.png", "img/zf_phoneListen.png", "img/zf_phoneLogo.png", "img/zf_return.png", "img/zf_style1.jpg", "img/zf_style2.jpg", "img/zf_style3.jpg", "img/zf_styleTip1.png", "img/zf_styleTip2.png", "img/zf_teacher1.png", "img/zf_teacher2.png", "img/zf_teacher3.jpg", "img/zf_teacher4.png", "img/zf_teacher5.png", "img/zf_teacher6.png", "img/zf_teacherTip.png"];

    // 控制图片加载进度
    let total = imgList.length,
        cur = 0;
    let computed = function () {
        imgList.forEach(function (item) { // item:当前循环的那张图片地址
            let tempImg = new Image;
            tempImg.src = item;
            tempImg.onload = function () {
                cur++;
                tempImg = null;
                runFn();
            }
        })
    };

    //=>计算滚动条加载长度
    let runFn = function () {
        $run.css('width', cur / total * 100 + '%');
        if (cur >= total) {
            // 需要延迟的图片都加载成功了：进入到下一个区域（设置一个缓冲等待时间，当加载完成让用户看到加载完成的效果，再进入到下一个区域）
            let delayTimer = setTimeout(()=> {
                $loadingBox.remove();
                phoneRender.init();
                clearTimeout(delayTimer);
            }, 1000);
        }
    };
    
    return {
        init:function () {
            /*
                我们在css中把所有的区域的display都设置为none，以后开发的时候，开发哪个区域，我们就执行哪个区域的init方法，在这个方
                法当中首先控制当前区域展示（开发哪个区域哪个区域展示，其它区域隐藏）;
            */
            $loadingBox.css('display','block');
            computed();
        }
    }
})();

let phoneRender = (function ($) {
    let $phoneBox = $('.phoneBox'),
        $time = $phoneBox.find('.time'),
        $listen = $phoneBox.find('.listen'),
        $listenTouch = $listen.find('.touch'),
        $detail = $phoneBox.find('.detail'),
        $detailTouch = $phoneBox.find('.touch');

    let audioBell = $('#audioBell')[0], // 把获取的zepto对象转化为原生js对象，因为操作音频方法是原生js的zepto/jquery中没提供这些方法
        audioSay = $('#audioSay')[0];

    // 发布订阅模式
    let $phonePlan = $.Callbacks();

    //=>控制盒子的显示隐藏
    $phonePlan.add(function () {
        $listen.remove();
        $detail.css('transform', 'translateY(0)');
    });

    //=>控制SAY播放
    $phonePlan.add(function () {
        audioBell.pause(); // 铃声暂停
        audioSay.play(); // 语音播放
        $time.css('display', 'block');

        //=>随时计算播放时间
        let sayTimer = setInterval(()=> {
            //=>总时间和已经播放时间:单位秒
            let duration = audioSay.duration, // duration:总时间
                current = audioSay.currentTime; // currentTime:已经播放时间

            let minute = Math.floor(current / 60), // 当前的ms除以60向下取整->分钟；
                second = Math.floor(current - minute * 60); // 剩下的值->秒
            minute < 10 ? minute = '0' + minute : null;
            second < 10 ? second = '0' + second : null;
            $time.html(`${minute}:${second}`);

            //=>播放结束
            if (current >= duration) {
                clearInterval(sayTimer);
                enterNext();
            }
        }, 1000);
    });

    //=>DETAIL-TOUCH
    $phonePlan.add(()=>$detailTouch.tap(enterNext));

    //=>进入下一个区域(MESSAGE)
    let enterNext = function () {
        audioSay.pause();
        $phoneBox.remove();
        messageRender.init();
    };

    return {
        init:function () {
            $phoneBox.css('display','block');

            // 控制bell播放
            audioBell.play();
            audioBell.volume = 0.1; // 音量

            //=>LISTEN-TOUCH
            $listenTouch.tap($phonePlan.fire); // 发布订阅模式
        }
    }
})(Zepto);

/*--MESSAGE--*/
let messageRender = (function ($) {
    let $messageBox = $('.messageBox'),
        $talkBox = $messageBox.find('.talkBox'),
        $talkList = $talkBox.find('li'),
        $keyBord = $messageBox.find('.keyBord'),
        $keyBordText = $keyBord.find('span'),
        $submit = $keyBord.find('.submit'),
        musicAudio = $('#musicAudio')[0];
    let $plan = $.Callbacks();

    //=>控制消息列表逐条显示
    let step = -1,
        autoTimer = null,
        interval = 1500,
        offset = 0;
    $plan.add(()=> {
        autoTimer = setInterval(()=> {
            step++;
            let $cur = $talkList.eq(step);
            $cur.css({
                opacity: 1,
                transform: 'translateY(0)'
            });
            // 当第三条完全展示后立即调取出键盘（step === 2 && 当前li显示的动画已经完成）
            if (step === 2) {
                // transitionend:当前元素正在运行的css过度动画已经完成，就会触发这个事件（有几个元素样式需要改变，就会触发执行几次）
                $cur.one('transitionend', ()=> { // one方法：是事件绑定，只绑定一次，触发一次后，给事件绑定的方法自动移除
                    $keyBord.css('transform', 'translateY(0)')
                        .one('transitionend', textMove); // textMove：文字打印机效果方法
                });
                clearInterval(autoTimer);
                return;
            }

            // 从第五条开始每当展示一个li，都需要让ul整体上移
            if (step >= 4) {
                offset += -$cur[0].offsetHeight;
                $talkBox.css(`transform`, `translateY(${offset}px)`);
            }

            // 已经把li都显示了，结束动画进入到下一个区域即可；
            if (step >= $talkList.length - 1) {
                clearInterval(autoTimer);

                // 进入到下一个环节之前给设置一个延迟：让用户给最后一条数据读完
                let delayTimer = setTimeout(()=> {
                    musicAudio.pause();
                    $messageBox.remove();
                    cubeRender.init();
                    clearTimeout(delayTimer);
                }, interval);
            }
        }, interval);
    });

    //=>控制文字及其打印机效果
    let textMove = function () {
        let text = $keyBordText.html();
        $keyBordText.css('display', 'block').html(''); // 设置文字内容为空
        let timer = null,
            n = -1;
        timer = setInterval(()=> {
            if (n >= text.length) {
                // 打印机效果完成：让发送按钮显示
                clearInterval(timer);
                $keyBordText.html(text);
                $submit.css('display', 'block').tap(()=> {
                    $keyBordText.css('display', 'none');
                    $keyBord.css('transform', 'translateY(3.7rem)');
                    $plan.fire(); // 此时计划表中只有一个方法，重新通知计划表中这个方法执行
                });
                return;
            }
            n++;
            $keyBordText[0].innerHTML += text.charAt(n); // 转化为原生js才能是用innerHTML  charAt(n):如果为空字符串不会显示undefined
        }, 100);
    };

    return {
        init: function () {
            $messageBox.css('display', 'block');
            musicAudio.play();
            $plan.fire();
        }
    }
})(Zepto);

/*--CUBE--*/
$(document).on('touchstart touchmove', function (e) {
    e.preventDefault();
});
let cubeRender = (function ($) {
    let $cubeBox = $('.cubeBox'),
        $box = $cubeBox.find('.box');

    let touchBegin = function (e) {
        //=>this:box
        let point = e.changedTouches[0];
        $(this).attr({
            strX: point.clientX,
            strY: point.clientY,
            isMove: false,
            changeX: 0,
            changeY: 0
        });
    };

    let touching = function (e) {
        let point = e.changedTouches[0],
            $this = $(this);
        let changeX = point.clientX - parseFloat($this.attr('strX')),
            changeY = point.clientY - parseFloat($this.attr('strY'));
        if (Math.abs(changeX) > 10 || Math.abs(changeY) > 10) {
            $this.attr({
                isMove: true,
                changeX: changeX,
                changeY: changeY
            });
        }
    };

    let touchEnd = function (e) {
        let point = e.changedTouches[0],
            $this = $(this);
        let isMove = $this.attr('isMove'),
            changeX = parseFloat($this.attr('changeX')),
            changeY = parseFloat($this.attr('changeY')),
            rotateX = parseFloat($this.attr('rotateX')),
            rotateY = parseFloat($this.attr('rotateY'));
        if (isMove === 'false') return;

        rotateX = rotateX - changeY / 3;
        rotateY = rotateY + changeX / 3;
        $this.css(`transform`, `scale(.6) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`).attr({
            rotateX: rotateX,
            rotateY: rotateY
        });
    };

    return {
        init: function () {
            $cubeBox.css('display', 'block');

            //=>事件绑定实现相关效果
            $box.attr({
                rotateX: -30,
                rotateY: 45
            }).on({
                touchstart: touchBegin,
                touchmove: touching,
                touchend: touchEnd
            });

            //=>每一个页面的点击操作
            $box.find('li').tap(function () {
                $cubeBox.css('display', 'none');
                let index = $(this).index();
                detailRender.init(index);
            });
        }
    }
})(Zepto);

loadingRender.init();
