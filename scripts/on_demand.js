var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');

app.listen(3010);

var args = [];

function handler (req, res) {
  console.log('Server');  
  res.send(data);
}

process.argv.forEach(function (val, index, array) {
  console.log(index + ': ' + val);
  args.push(val);
});

io.on('connection', function (socket) {
  console.log('CLIENT CONNECTED');

  socket.emit('video:requested', args);

  socket.on('signal:accepted', function (data) {
    console.log('Exiting...');
    process.exit(0)
  });
});

console.log(args);