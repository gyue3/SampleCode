var fs = require('fs');
var models_path = __dirname + '/models'
fs.readdirSync(models_path).forEach(function (file) {
  if (~file.indexOf('.js')) require(models_path + '/' + file)
})


//Main Thread - Port 8080
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

var configDB = require('./config/database.js');
var port = process.env.PORT || 8080;

var app = express();

//Connections
mongoose.connect(configDB.url);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
//app.use(logger('dev'));
app.use(morgan('dev')); //log every request to the console
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser()); //get info from html forms
//app.use(express.static(path.join(__dirname, 'public')));
//app.use(express.static(path.join(__dirname, 'game')));
app.use("/game", express.static(__dirname + "/game"));
app.use("/bower_components", express.static(__dirname + "/bower_components"));
app.use("/node_modules", express.static(__dirname + "/node_modules"));

app.set('view engine', 'ejs'); //EJS templating

//Passport reqs
require('./config/passport')(passport); //pass passport for configuration

app.use(session({secret: 'mysecrets'}))
app.use(passport.initialize());
app.use(passport.session()); //persistent login sessions
app.use(flash()); //use connect-flash for flash messages stored in session

//require('./app/routes.js')(app, passport); //load routes and pass in app and fully configured passport

app.use('/', routes);
app.use('/users', users);

app.listen(port);
console.log("Yay " + port);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            env: 'development',
            message: err.message,
            error: err
        });

         //res.render('signup.ejs', { message: req.flash('signupMessage') });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        env: 'production',
        message: err.message,
        error: err
    });
});


module.exports = app;

//Socket stuff - Port 8081

var mongo = require('mongodb').MongoClient;
var client = require('socket.io').listen(8081).sockets;

mongo.connect('mongodb://54.201.46.195/chat', function(err, db) {
    if(err) throw err;

    client.on('connection', function(socket) {
        var col = db.collection('messages');

        sendStatus = function(s) {
            socket.emit('status', s);
        }

        //Emit All Messages
        col.find().limit(50).sort({'date' : 1}).toArray(function(err, result) {
            if(err) throw err;

            socket.emit('output', result);
        });


        socket.on('input', function(data) {
            var name = data.name;
            var message = data.message;
            var d = new Date();
            data.date = d; //Get Date from server

            var whitespacePattern = /^\s*$/;

            if(whitespacePattern.test(name) || whitespacePattern.test(message))
            {
                sendStatus('Name and Message Invalid');
                console.log("Invalid");
            }else
            {
                col.insert({date : d, name: name, message: message}, function() {

                    //Emit latest message to all Clients
                    client.emit('output', [data]);

                    console.log('Inserted');
                    sendStatus({message: "Message Sent", clear  : true});
                });
            }
        });

    });

});
