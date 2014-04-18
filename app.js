var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var less = require('less-middleware');
///socket io i server create
var app = express();
http = http.createServer(app);
var socketio = require("socket.io");
var io = socketio.listen(http);
//

app.configure(function () {
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.use(express.json());
    app.use(express.urlencoded());
    app.use(express.methodOverride());
    app.use(express.cookieParser('bardzo tajne aqq'));
    app.use(express.session());
    app.use(app.router);
    // „middleware” obsługujące LESS-a
    // samo kompiluje pliki less-owe do CSS
    // a do tego pliki wynikowe kompresuje
    // Opis parametrów:
    //
    // https://github.com/emberfeather/less.js-middleware
    app.use(less({
        src: path.join(__dirname, 'less'),
        dest: path.join(__dirname, 'public/css'),
        prefix: '/css',
        compress: true
    }));
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(express.static(path.join(__dirname, 'bower_components/jquery/dist')));
});

app.configure('development', function () {
    app.use(express.logger('dev'));
    app.use(express.errorHandler());
});
//Routes
app.get('/', routes.index);

//server start
http.listen(app.get('port'), function () {
    console.log("Serwer nasłuchuje na porcie " + app.get('port'));
});

var s = require("./models/sockets.js").setSocket(io);;