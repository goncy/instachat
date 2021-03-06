var express = require('express');
var app = express();

var port = process.env.PORT || 8080;

var io = require('socket.io').listen(app.listen(port));

require('./config')(app, express);
require('./routes')(app, io);