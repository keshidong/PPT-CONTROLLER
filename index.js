var robot = require('robotjs'),
	express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server);

var port = 8000;
server.listen(port);

var ip = (function() {
    var ifaces = require( 'os' ).networkInterfaces();
    var defultAddress = '127.0.0.1';
    var ip = defultAddress;

    function x( details ) {
        if (ip === defultAddress && details.family === 'IPv4') {
            ip = details.address;
        }
    }

    for ( var dev in ifaces ) {
        ifaces[ dev ].forEach( x );
    }

    return ip;
})();

var accessUrl = 'http'
	+ '://'
	+ ip
	+ (port === 80 ? '' : ':' + port);

console.log('Server start, %s', accessUrl);

// 模板引擎设置
app.engine('html', require('hbs').__express);
// app.set('views', __dirname + '/controlPage/');
// app.set('view engine', 'html');

app.get('/', function(req, res) {
	res.render(__dirname + '/controlPage/index.html', {
		serverURL: accessUrl
	});
});

app.use(express.static('controlPage'));

var qrcode = require('qrcode.console');

console.log(qrcode(accessUrl));

var keyMap = {
    'pageNext': 'down',
    'pageBack': 'up',
    'exit': 'escape',
    'screeningBegin': 'f5',
    'screeningCurrent': 'shift+f5'
}
io.sockets.on('connection', function(socket) {
    console.log('Client connected');
    for (item in keyMap) {
        !function () {
            var itemTemp = item;
            socket.on(itemTemp, function () {
                var keyStr = keyMap[itemTemp]
                var keysArr = keyStr.split('+');
                console.log('tap ' + keyStr + ' once!');
                robot.keyTap(keysArr.pop(), keysArr);
            });
        }();
    }
    socket.on('touchmove', function (data) {
        var mouse = robot.getMousePos();
        robot.moveMouse(mouse.x + data.x, mouse.y + data.y);
    });

    socket.on('tapLeft', function () {
        robot.mouseClick();
    });
    socket.on('tapRight', function () {
        robot.mouseClick('right');
    });
});