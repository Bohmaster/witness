var path     = require('path')
var fs       = require('fs')
var request  = require('request')
var ffmpeg   = require('fluent-ffmpeg')
var chokidar = require('chokidar')
var FormData = require('form-data')
var io       = require('socket.io-client')
var express  = require('express')
var monkey   = require('node-monkey')()

var cameras = require('../data.json');

monkey.attachConsole();

function makeCameraUrl(camera) {
      camera.url = camera.protocol + '://' + camera.credentials.username + ':' + camera.credentials.password + '@' + camera.ip + camera.port + camera.quality.low
}




// GLOBAL VARIABLES
var CONTAINER_URL = 'http://131.255.6.34:3000/api/containers/videos/upload'
var ON_DEMAND = false
var BUFFER = {};

// var INDEX = 0
var CURRENT_CAMERA = -1;

// Initializing app
var app = express()

// Initializing chokidar watcher
var watcher = chokidar.watch('storage', {
  ignoreInitial: true
})

// APP configuration
app.get('/', function (req, res) {
  res.send('Hello world!')
})

app.listen(3000, function () {
  console.log('Initializing Witness system on port 3000!')
  
  for (camera in cameras) {

    BUFFER['CAMERA_' + camera] = {
      array: [],
      index: 0
    }

    var cam = cameras[camera];
    makeCameraUrl(cam);
    watchers(cam, camera);
    runFFMPEG(cam);
  }

  // console.log(BUFFER);

})

// Socket configuration
var socket = io.connect('http://104.131.0.206:3005')

  socket.on('connect', function (sock) {
        console.log('Connected to server')
  })

  socket.on('error', function (sock) {
        console.log('ERROR')
  })

var on_demand = io.connect('http://192.168.0.205:3010')

  on_demand.on('connect', function (sock) {
        console.log('Connected to server. PROXY MEN')        
  });

  on_demand.on('video:requested', function(args) {

          console.log('video requested', args);
          
          if (args[2] == "yes") {
            console.log(args[2]);
            CURRENT_CAMERA = args[3];
            ON_DEMAND = true;
          } else {
            console.log(args[2]);
            ON_DEMAND = false;
            CURRENT_CAMERA = -1;
          }

          on_demand.emit('signal:accepted', true);

        });      

  on_demand.on('error', function (sock) {
        console.log('ERROR!')
  })  

// Files configuration
function watchers(camera, index) {
  watcher = chokidar.watch('storage/' + camera.name, {
    ignoreInitial: true
  });

  watcher
  .on('add', function (pathName) {
    console.log('---Subiendo', pathName, 'OnDemand: ' + ON_DEMAND)

    var file = pathName.slice(17);

    console.log('FILE', file);
    
    BUFFER['CAMERA_' + index].array.push(file);
    BUFFER['CAMERA_' + index].index++;

    var ARRAY_LIST = BUFFER['CAMERA_' + index].array;
    var INDEX = BUFFER['CAMERA_' + index].index;

    console.log('HERE', ARRAY_LIST, INDEX);

    if (ARRAY_LIST.length == 1) {
      console.log('---Subiendo primer video', camera.name)
    } else {
      // console.log('INDEXXXXXXXXXXXX', INDEX-2);
      // console.log('---Video ' + ARRAY_LIST[INDEX -2] + ' subido. On demand: ' + ON_DEMAND)
      if (ON_DEMAND && (CURRENT_CAMERA == index)) {
        var form_data = 
            {
              file: fs.createReadStream('storage/CAMARA_' + CURRENT_CAMERA + '/' + ARRAY_LIST[INDEX-2])
            }
        request
          .post({
            url: CONTAINER_URL,
            formData: form_data,
            postData: {
              mimeType: 'video/mp4',
            }},
             function responseCallback(err, response, body) {
                if (err) {
                    console.log('---ERROR al subir video', err)
                }

                console.log('Video subido al servidor', ARRAY_LIST[INDEX-2])

                socket.emit('file:added', {
                  file: file, list: ARRAY_LIST
                })
            });
      }
    }
    
  })
  .on('error', function(err) {
    console.log('ERROR from watcher', err)
  })
}

//FFMPEG config
function runFFMPEG(camera) {
  console.log('Corriendo: ', camera.name);
  ffmpeg(camera.url)
  // .withVideoCodec('x264')
  .outputOptions([     
     '-f segment',
     '-strftime 1',
     '-segment_time 5',
     '-reset_timestamps 1',
     '-segment_format mp4'
    ]).on('start', function (commandLine) {
       console.log(commandLine);
    }).on('error', function (err) {
         console.log('HA SURGIDO UN ERROR: ', err);
    }).on('end', function () {
         console.log('ended');
  }).save('/home/pi/WtS/system/storage/' + camera.name + '/' + camera.id + '-%Y-%m-%d_%H-%M-%S.mp4'); 
};


var spawn = require('child_process').spawn;
var gps_py = spawn('python', ['final.py']);

gps_py.stdout.setEncoding('utf8');

gps_py.stdout.on('data', function(data) {
    console.log('Data received');
    var gpsObj = JSON.parse(data);
    
    if (gpsObj.status == 'OK') {
	var data = {
		latitude: gpsObj.latitud,
                longitude: gpsObj.longitud
	};
	socket.emit('geolocation:send', data)   
    }
});

gps_py.stdout.on('error', function(data) {
    console.log('Error received');
    console.log(data);
});


