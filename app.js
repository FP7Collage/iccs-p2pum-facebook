
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
    ,facebook=require('./routes/facebook')
    ,udum=require('./routes/udum')
    ,fs = require('fs')
  , http = require('http')
    ,nunjucks=require('nunjucks')
    , passport = require('passport')
    , util = require('util')
    , path = require('path');


var app = express();
require('./config/view.js').views(app,nunjucks);

app.facebook_app_id="403359629796497";
app.facebook_app_secret="58323d83ae0368e261be573c1e245e98";

require('./config/db.js');
require('./model/Person');


var p = require('./config/passport.js');
p.passport(app,passport,"https://localhost:7000/auth/facebook/callback");


var fbcontroller = require('./app/controllers/facebook.js').setup(app);
var rstore = require('./config/session.js').redis(app);

require('./config/schedule.js').schedule(app,fbcontroller);


// all environments
app.set('port', process.env.PORT || 3002);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser(app.facebook_app_secret) );
app.use(express.session({secret: app.facebook_app_secret, store:rstore}));
// use passport session
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));




// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}


app.get('/', p.ensureAuthenticated("/login"), routes.index);
app.post('/',p.ensureAuthenticated("/login"),facebook.canvas);
app.get('/logout', routes.logout);
app.get('/login',routes.login);


app.get('/auth/facebook', passport.authenticate('facebook',{scope: ['email','user_about_me','user_likes','user_notes','user_subscriptions','read_friendlists','read_stream'] }));
app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
        successRedirect: '/',
        failureRedirect: '/login' }));

app.get('/udum/social/:id',udum.fetchSocial);
app.get('/udum/tags/:id',udum.fetchTags);


http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});


if ('development' == app.get('env')) {

    https = require('https');
    https.createServer({
        key: fs.readFileSync('/private/etc/apache2/ssl/server.key'),
        cert: fs.readFileSync('/private/etc/apache2/ssl/server.crt')
    },app).listen(7000,function(){
            console.log('Express server listening on port 7000 (ssl)')
        });


}



