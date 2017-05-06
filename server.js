'use strict';

var express = require('express');
var http = require('http');
var path = require('path');
var app = express();

app.set('port', '3002');

var logger = require('morgan');
app.use(logger('dev'));

app.use(express.static(path.join(__dirname, '.')));

app.use(function (err, req, res, next) {
    console.error(err);
    next(err);
});

http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});
