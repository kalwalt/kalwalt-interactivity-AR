;(function () {
    'use strict'

var NFTLoader = function (width, height, cameraPara) {
  this.width = width;
  this.height = height;
  this.cameraPara = cameraPara;
  this.root = new THREE.Object3D();
  this.root.matrixAutoUpdate = false;
};

NFTLoader.prototype.init = function (container, video, canvas, marker, stats) {
console.log(this.cameraPara);
var cameraParam = this.cameraPara;
var root = this.root;
  if(stats){
    var statsMain = new Stats();
    statsMain.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.getElementById("stats1").appendChild(statsMain.dom);

    var statsWorker = new Stats();
    statsWorker.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.getElementById("stats2").appendChild(statsWorker.dom);
  } else {
    document.getElementById("stats").remove();
  };

  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    var hint = {
      audio: false,
      video: true
    };

    if (window.innerWidth < 800) {
      hint = {
        audio: false,
        video: {
            width: { ideal: this.width },
            height: { ideal: this.height },
            facingMode:
                { exact:
                    "environment"
                }
            },
      };
    };

    navigator.mediaDevices.getUserMedia(hint).then(function(stream) {
      video.srcObject = stream;
      video.addEventListener("loadedmetadata", function() {
        video.play();

        start(
          container,
          markers[marker],
          video,
          video.videoWidth,
          video.videoHeight,
          canvas,
          function() {
            if(stats){
              statsMain.update();
            }
          },
          function() {
            if(stats){
              statsWorker.update();
            }
          },
          cameraParam,
          root
        );
      });
    }).catch(function(err) {

     console.log(err.name + ": " + err.message);

   });
  };


};

NFTLoader.prototype.add = function (obj) {
  var root = this.root;
  root.add(obj);
};

NFTLoader.prototype.loadModel = function (url, scale) {
  var root = this.root;
  var model;

  /* Load Model */
  var threeGLTFLoader = new THREE.GLTFLoader();

  var objPositions;

  threeGLTFLoader.load(url, function (gltf) {
          model = gltf.scene;
          model.name = "Duck";
          model.scale.set(scale, scale, scale);
          model.rotation.x = Math.PI/2;

          root.matrixAutoUpdate = false;
          root.add(model);
       }
    );
};


var clock = new THREE.Clock();
var mixers = [];

function isMobile() {
    return /Android|mobile|iPad|iPhone/i.test(navigator.userAgent);
}

var interpolationFactor = 24;

var trackedMatrix = {
    // for interpolation
    delta: [
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ],
    interpolated: [
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ]
}

var markers = {
    pinball: {
        width: 1637,
        height: 2048,
        dpi: 215,
        url: "../../dataNFT/pinball",
    }
};

var setMatrix = function (matrix, value) {
    var array = [];
    for (var key in value) {
        array[key] = value[key];
    }
    if (typeof matrix.elements.set === "function") {
        matrix.elements.set(array);
    } else {
        matrix.elements = [].slice.call(array);
    }
};

function start(container, marker, video, input_width, input_height, canvas_draw, render_update, track_update, cameraParam, root) {
    var vw, vh;
    var sw, sh;
    var pscale, sscale;
    var w, h;
    var pw, ph;
    var ox, oy;
    var worker;
    var camera_para
    if(window !== 'undefined'){
      console.log(cameraParam);
      camera_para = cameraParam;
    }

    var canvas_process = document.createElement("canvas");
    var context_process = canvas_process.getContext("2d");

    var renderer = new THREE.WebGLRenderer({
        canvas: canvas_draw,
        alpha: true,
        antialias: true,
        precision: 'mediump'
    });
    renderer.setPixelRatio(window.devicePixelRatio);

    var scene = new THREE.Scene();

    var camera = new THREE.Camera();
    camera.matrixAutoUpdate = false;

    scene.add(camera);

    var light = new THREE.AmbientLight(0xffffff);
    scene.add(light);

    scene.add(root);


    var load = function() {
        vw = input_width;
        vh = input_height;

        pscale = 320 / Math.max(vw, (vh / 3) * 4);
        sscale = isMobile() ? window.outerWidth / input_width : 1;

        sw = vw * sscale;
        sh = vh * sscale;

        w = vw * pscale;
        h = vh * pscale;
        pw = Math.max(w, (h / 3) * 4);
        ph = Math.max(h, (w / 4) * 3);
        ox = (pw - w) / 2;
        oy = (ph - h) / 2;
        canvas_process.style.clientWidth = pw + "px";
        canvas_process.style.clientHeight = ph + "px";
        canvas_process.width = pw;
        canvas_process.height = ph;

        renderer.setSize(sw, sh);

        worker = new Worker('../resources/jsartoolkit5/artoolkit/artoolkit.worker.js');

        worker.postMessage({
            type: "load",
            pw: pw,
            ph: ph,
            camera_para: camera_para,
            marker: marker.url
        });

        worker.onmessage = function(ev) {
            var msg = ev.data;
            switch (msg.type) {
                case "loaded": {
                    var proj = JSON.parse(msg.proj);
                    var ratioW = pw / w;
                    var ratioH = ph / h;
                    proj[0] *= ratioW;
                    proj[4] *= ratioW;
                    proj[8] *= ratioW;
                    proj[12] *= ratioW;
                    proj[1] *= ratioH;
                    proj[5] *= ratioH;
                    proj[9] *= ratioH;
                    proj[13] *= ratioH;
                    setMatrix(camera.projectionMatrix, proj);
                    break;
                }

                case "endLoading": {
                    if (msg.end == true) {
                        // removing loader page if present
                        var loader = document.getElementById('loading');
                        if (loader) {
                            loader.querySelector('.loading-text').innerText = 'Start the tracking!';
                            setTimeout(function(){
                                loader.parentElement.removeChild(loader);
                            }, 2000);
                        }
                    }
                    break;
                }

                case "found": {
                    found(msg);
                    break;
                }
                case "not found": {
                    found(null);
                    break;
                }
            }
            track_update();
            process();
        };
    };

    var world;

    var found = function(msg) {
        if (!msg) {
            world = null;
        } else {
            world = JSON.parse(msg.matrixGL_RH);
        }
    };

    var lasttime = Date.now();
    var time = 0;

    function process() {
        context_process.fillStyle = "black";
        context_process.fillRect(0, 0, pw, ph);
        context_process.drawImage(video, 0, 0, vw, vh, ox, oy, w, h);

        var imageData = context_process.getImageData(0, 0, pw, ph);
        worker.postMessage({ type: "process", imagedata: imageData }, [
            imageData.data.buffer
        ]);
    }

    var tick = function() {
        draw();
        requestAnimationFrame(tick);
    };

    var draw = function() {
        render_update();
        var now = Date.now();
        var dt = now - lasttime;
        time += dt;
        lasttime = now;

        if (!world) {
            root.visible = false;
        } else {
            root.visible = true;

            // interpolate matrix
            for (var i = 0; i < 16; i++) {
                trackedMatrix.delta[i] = world[i] - trackedMatrix.interpolated[i];
                trackedMatrix.interpolated[i] =
                    trackedMatrix.interpolated[i] +
                    trackedMatrix.delta[i] / interpolationFactor;
            }
            // set matrix of 'root' by detected 'world' matrix
            setMatrix(root.matrix, trackedMatrix.interpolated);
        }

        renderer.render(scene, camera);
    };

    load();
    tick();
    process();
}


window.NFTLoader = NFTLoader;
window.THREE = THREE;
})();
