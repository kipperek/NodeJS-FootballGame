var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var less = require('less-middleware');
var mongo = require('mongodb');
var connect = require('connect');
var passport = require('passport');
var socketio = require("socket.io");
var passportSocketIo = require('passport.socketio');
var LocalStrategy = require('passport-local').Strategy;
var sessionStore = new connect.session.MemoryStore();

var sessionSecret = '123hbh321h3jHhjj123459900dsad09dad78s';
var sessionKey = 'connect.sid';

///socket io i server create
var app = express();
http = http.createServer(app);

var io = socketio.listen(http, { log: false });
//
//MONGO DB
var db = new mongo.Db('footballDB', new mongo.Server('localhost', 27017), {safe: true});
app.locals.footballDB = db;
///
// Konfiguracja passport.js
passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (obj, done) {
    done(null, obj);
});

passport.use(new LocalStrategy(
    function (username, password, done) {
        db.open(function (err) {
            //ZNAJDZ KOLEKCJE USERS
            db.collection('users', function (err, coll) {
                //znajdz odpowiedni rekord
                coll.findOne({"username": username, "pass": password}, function (err, item) {
                    db.close();
                    if (item !== null) {
                        return done(null, {
                            username: username,
                            password: password
                         });
                    }
                    else{
                        return done(null, false);
                    }
                });
            });
        });
    }));

 //express + passport
    app.use(express.cookieParser());
    app.use(express.urlencoded());
    app.use(express.session({
        store: sessionStore,
        key: sessionKey,
        secret: sessionSecret
    }));
    app.use(passport.initialize());
    app.use(passport.session());

//EXPRESS CONF
app.configure(function () {
    app.set('port', process.env.PORT || 80);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.use(express.json());
    app.use(express.urlencoded());
    app.use(express.methodOverride());
    app.use(express.cookieParser('bardzo tajne aqq'));
    app.use(express.session());
    app.use(app.router);
    app.use(express.favicon(path.join(__dirname, 'public/img/favicon.ico')));
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



/*
app.configure('development', function () {
   app.use(express.logger('dev'));
    app.use(express.errorHandler());
});
*/

//Routes
app.get('/', routes.index);

app.get(/\/register\/((?:\w+))\/pass\/((?:\w+))/, routes.register);
app.post("/login", passport.authenticate('local'),
    function (req, res) {  
        res.json({
            "msg": "Welcome <b>"+req.user.username+"</b>",
            "done": true,
            "username": req.user.username
        });
    });

app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

//routes.login);

//server start
http.listen(app.get('port'), function () {
    console.log("Serwer nasłuchuje na porcie " + app.get('port'));
});

//SOCKET PASSPORT 
var onAuthorizeSuccess = function (data, accept) {
    accept( null, true );
};

var onAuthorizeFail = function (data, message, error, accept) {
    if ( error ) {
        throw new Error( message );
    }
    accept( null, false );
};

io.set('authorization', passportSocketIo.authorize({
    passport: passport,
    cookieParser: express.cookieParser,
    key: sessionKey, // nazwa ciasteczka, w którym express/connect przechowuje identyfikator sesji
    secret: sessionSecret,
    store: sessionStore,
    success: onAuthorizeSuccess,
    fail: onAuthorizeFail
}));
//I DO MODELU
var s = require("./models/sockets.js").setSocket(io);