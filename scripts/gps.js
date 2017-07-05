var spawn = require('child_process').spawn;
var gps_py = spawn('python', ['final.py']);
var io       = require('socket.io-client')

var socket = io.connect('http://104.131.0.206:3005');

  socket.on('connect', function (sock) {
        console.log('Connected to server')
  });

  socket.on('error', function (sock) {
        console.log('ERROR')
  });

gps_py.stdout.setEncoding('utf8');

gps_py.stdout.on('data', function(data) {
    console.log('Data received');
    var gpsObj = JSON.parse(data);
    
    if (gpsObj.status == 'OK') {
	var data = {
		latitude: parseFloat(gpsObj.latitud),
                longitude: parseFloat(gpsObj.longitud)
	};
	socket.emit('geolocation:send', data)   
    }
});

gps_py.stdout.on('error', function(data) {
    console.log('Error received');
    console.log(data);
});

