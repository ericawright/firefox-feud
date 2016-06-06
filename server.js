
var fs = require('fs');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var MOZ_FILE = 'moz-data.json';
var SAMPLE_FILE = 'sample-data.json';
var filename = process.env.MOZ?  MOZ_FILE : SAMPLE_FILE;
var data_file = path.join(__dirname, filename);

app.use('/', express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Additional middleware which will set headers that we need on each request.
app.use(function (req, res, next) {
    // Set permissive CORS header - this allows this server to be used only as
    // an API server in conjunction with something like webpack-dev-server.
  res.setHeader('Access-Control-Allow-Origin', '*');

  next();
});

app.get('/api/feud-data', function (req, res) {
  fs.readFile(data_file, function (err, data) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    res.json(JSON.parse(data));
  });
});

app.post('/api/feud-data', function (req, res) {
  fs.readFile(data_file, function (err, data) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    var questions = JSON.parse(data);
    var which_question = req.body.question;
    questions[which_question].counter += 1;

    fs.writeFile(data_file, JSON.stringify(questions, null, 2), function(err) {
      if (err) {
        console.error(err);
        process.exit(1);
      }
    });
  });
});

app.get('/', function (req, res) {
  res.sendfile('index.html');
});

io.on('connection', function (socket) {
  console.log('a user connected');

  socket.on('hide answers', function (state) {
    socket.broadcast.emit('update game', state);
  });

  socket.on('reveal answer', function (react_id) {
    socket.broadcast.emit('reveal answer', react_id);
  });

  socket.on('update game', function (state) {
    socket.broadcast.emit('update game', state);
  });

  socket.on('trigger strike', function (strike_count) {
    socket.broadcast.emit('trigger strike', strike_count);
  });

  socket.on('trigger correct', function () {
    socket.broadcast.emit('trigger correct');
  });

  socket.on('toggle logo flip', function () {
    socket.broadcast.emit('toggle logo flip');
  });

  socket.on('disconnect', function () {
    console.log('user disconnected');
  });

});

http.listen(process.env.PORT || 3000)
