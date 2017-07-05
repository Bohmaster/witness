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
      console.log('INDEXXXXXXXXXXXX', INDEX-2);
      console.log('---Video ' + ARRAY_LIST[INDEX -2] + ' subido. On demand: ' + ON_DEMAND)
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

module.exports.watchers  = watchers;
module.exports.runFFMPEG = runFFMPEG; 