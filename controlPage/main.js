!function () {
    var serverURL = document.getElementById('serverURL').innerText;
    var touch = document.getElementById('touch');
    var leftBt = document.getElementById('leftBt');
    var rightBt = document.getElementById('rightBt');
    var socket = io(serverURL);
    var lastTouch = null;
    var sensitivity = 40;

    function emitEvent (domID) {
        var eventDom = document.getElementById(domID);
        eventDom.onclick = function () {
            socket.emit(domID);
        }
    }

    function getOneTouchInfo (evt) {
        return {
            x: evt.targetTouches[0].clientX,
            y: evt.targetTouches[0].clientY,
            timeStamp: evt.timeStamp
        };
    }

    function getbalanceVal (num, min, max) {
        min = min || 0.1;
        max = max || 1.0;
        if (Math.abs(num) > 0 && Math.abs(num) <= min) {
            return num > 0 ? min : -min;
        } else if (Math.abs(num) >= max) {
            return num > 0 ? max : -max;
        } else {
            return num;
        }
    }

    ['pageNext', 'pageBack', 'exit', 'screeningBegin', 'screeningCurrent'].forEach(function (el) {
        emitEvent(el);
    });

    touch.addEventListener('touchmove',function (evt) {
        evt.stopPropagation();
        evt.preventDefault();

        if (evt.touches.length === 1 && evt.targetTouches.length === 1) {
            if (!lastTouch) {
                lastTouch = getOneTouchInfo(evt);
                return;
            }
            var timeGap = (getOneTouchInfo(evt).timeStamp - lastTouch.timeStamp);
            var xGap = (getOneTouchInfo(evt).x - lastTouch.x);
            var yGap = (getOneTouchInfo(evt).y - lastTouch.y);

            console.log(xGap, yGap)
            var speedX = Math.abs(getbalanceVal(xGap / timeGap, 0.1, 0.3));
            var speedY = Math.abs(getbalanceVal(yGap / timeGap, 0.1, 0.3));


            // console.log(speedX*sensitivity*xGap, speedY*sensitivity*yGap)
            // console.log(speedX*xGap*sensitivity, speedY*yGap*sensitivity)
            socket.emit('touchmove', {x: speedX*xGap*sensitivity, y: speedY*yGap*sensitivity});
            lastTouch = getOneTouchInfo(evt);

        }
    });
    touch.addEventListener('touchend', function (evt) {
        evt.stopPropagation();
        console.log('touch end!');
        lastTouch = null;
    }, false);

    // tap
    !function () {
        function triggerEvent(domArr, event, fn) {
            function trigger(dom, event) {
                // 事件触发条件
                fn(dom, function () {
                    // 满足条件触发事件
                    dom.dispatchEvent(event);
                });
            }
            domArr.forEach(function (el) {
                trigger(el, event);
            });
        }

        var tapEvent = new Event('tap');
        leftBt.addEventListener('tap', function () {
            socket.emit('tapLeft');
        }, false);
        rightBt.addEventListener('tap', function () {
            socket.emit('tapRight');
        }, false);

        triggerEvent([leftBt, rightBt], tapEvent, function (dom, fn) {
           dom.addEventListener('touchstart', function (evtStart) {
               // evtStart.stopPropagation();
               dom.addEventListener('touchend', function fnEnd(evtEnd) {
                   // evtEnd.stopPropagation();
                   // 150ms && position
                   if (evtEnd.timeStamp - evtStart.timeStamp <= 150) {
                       fn();
                   }
                   dom.removeEventListener('touchend', fnEnd);
               }, false);
           });
        });
    }();

}();