require('source-map-support').install();

import express = require('express');
import http = require('http');
import path = require('path');

import config = require('./config');

var app = express();

app.set('port', config.port.toString());

var logger = require('morgan');
app.use(logger('dev'));

app.use(express.static(path.join(__dirname, 'app')));

app.use((err: any, req: express.Request, res: express.Response, next: (err: any) => void) => {
    console.error(err);
    next(err);
});

http.createServer(app).listen(app.get('port'), () => {
    console.log('Express server listening on port ' + app.get('port'));
});
