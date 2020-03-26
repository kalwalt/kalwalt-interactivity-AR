function isMobile() {
    return /Android|mobile|iPad|iPhone/i.test(navigator.userAgent);
}

const interpolationFactor = 24;

var trackedMatrix = {
    // for interpolation
    delta: [
        0,0,0,0,
        0,0,0,0,
        0,0,0,0,
        0,0,0,0
    ],
    interpolated: [
        0,0,0,0,
        0,0,0,0,
        0,0,0,0,
        0,0,0,0
    ]
}

var markers = {
    "pinball": {
        width: 1637,
        height: 2048,
        dpi: 600,
        url: "../../dataNFT/pinball",
    },
    "hiro": {
      url: "../data/patt.hiro"
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

function start(container, markerNFT, markerHiro, video, input_width, input_height, canvas_draw, render_update, track_update, greyCover) {
    var vw, vh;
    var sw, sh;
    var pscale, sscale;
    var w, h;
    var pw, ph;
    var ox, oy;
    var worker;
    var camera_para = '../../../resources/data/camera_para-iPhone 5 rear 640x480 1.0m.dat'

    var canvas_process = document.createElement('canvas');
    var context_process = canvas_process.getContext('2d');

    var renderer = new THREE.WebGLRenderer({
      canvas: canvas_draw,
      alpha: true,
      logarithmicDepthBuffer: true,
      side: 'double',
      antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);

    var scene = new THREE.Scene();

    var ambientLight = new THREE.AmbientLight( 0xffffff );
    scene.add( ambientLight );

    var camera = new THREE.Camera();
    camera.matrixAutoUpdate = false;

    scene.add(camera);

    var rootNFT = new THREE.Object3D();
    scene.add(rootNFT);

    /* Load Model */
    var threeGLTFLoader = new THREE.GLTFLoader();

    var objPositions;

    threeGLTFLoader.load("../resources/models/cube/cube.glb", function (gltf) {
            model = gltf.scene;
            model.scale.set(80,80,80);

            rootNFT.matrixAutoUpdate = false;
            rootNFT.add(model);
        }
    );

    var cubeGeom = new THREE.BoxGeometry(1,1,1);
    var material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
    var cube = new THREE.Mesh(cubeGeom, material);
    cube.scale.set(5,5,5);
    cube.position.x = 10;
    cube.position.y = 10;

    var rootHiro = new THREE.Object3D();
    scene.add(rootHiro);
    rootHiro.matrixAutoUpdate = false;
    rootHiro.add(cube);

    var load = function() {
        vw = input_width;
        vh = input_height;

        pscale = 320 / Math.max(vw, vh / 3 * 4);
        sscale = isMobile() ? window.outerWidth / input_width : 1;

        sw = vw * sscale;
        sh = vh * sscale;
        // for custom sizing inside the load function
        /*video.style.width = sw + "px";
        video.style.height = sh + "px";
        container.style.width = sw + "px";
        container.style.height = sh + "px";
        canvas_draw.style.clientWidth = sw + "px";
        canvas_draw.style.clientHeight = sh + "px";*/
        canvas_draw.width = sw;
        canvas_draw.height = sh;
        w = vw * pscale;
        h = vh * pscale;
        pw = Math.max(w, h / 3 * 4);
        ph = Math.max(h, w / 4 * 3);
        ox = (pw - w) / 2;
        oy = (ph - h) / 2;
        //canvas_process.style.clientWidth = pw + "px";
        //canvas_process.style.clientHeight = ph + "px";
        canvas_process.width = pw;
        canvas_process.height = ph;

        renderer.setSize(sw, sh);

        worker = new Worker('../resources/jsartoolkit5/artoolkit/artoolkit.mixed_worker.js');

        worker.postMessage({ type: "load", pw: pw, ph: ph, camera_para: camera_para, marker_nft:  markerNFT.url, marker_pattern: markerHiro.url });

        worker.onmessage = (ev) => {
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
                case "endLoading":{
                    if(msg.end == true)
                    // removing loader page if present
                    if(document.getElementById("loading")){
                      document.body.classList.remove( 'loading' );
                      document.getElementById('loading').remove();
                    }
                    break;
                }
                case "found": {
                    if(msg.typeM == "NFT"){
                      found_NFT(msg);
                    } else if(msg.typeM == "Pattern") {
                      found_Pattern(msg);
                    }
                    break;
                }
                case "not found": {
                    if(msg.typeM == "NFT"){
                      found_NFT(null);
                    } else if(msg.typeM == "Pattern") {
                      found_Pattern(null);
                    }
                    break;
                }
            }
            track_update();
            process();
        };
    };

    var worldN, worldP;

    var found_NFT = function( msg ) {
        if( !msg ) {
            worldN = null;
        } else {
            worldN = JSON.parse( msg.matrixGL_RH );
            }

    };

    var found_Pattern = function( msg ) {
        if( !msg ) {
            worldP = null;
        } else {
            worldP = JSON.parse( msg.matrixGL_RH );
            console.log(worldP);
            }

    };

    var lasttime = Date.now();
    var time = 0;

    var draw = function() {
      render_update();

      if (!worldN) {
          rootNFT.visible = false;

      } else if (worldN) {
          rootNFT.visible = true;

          // interpolate matrix
          for( var i = 0; i < 16; i++ ) {
             trackedMatrix.delta[i] = worldN[i] - trackedMatrix.interpolated[i];
             trackedMatrix.interpolated[i] = trackedMatrix.interpolated[i] + ( trackedMatrix.delta[i] / interpolationFactor );
           }

          setMatrix( rootNFT.matrix, trackedMatrix.interpolated );
      }

      if (!worldP){
          rootHiro.visible = false;

      } else if (worldP){
          rootHiro.visible = true;
          console.log('Hiro detected...');
          // interpolate matrix
          for( var i = 0; i < 16; i++ ) {
             trackedMatrix.delta[i] = worldP[i] - trackedMatrix.interpolated[i];
             trackedMatrix.interpolated[i] = trackedMatrix.interpolated[i] + ( trackedMatrix.delta[i] / interpolationFactor );
           }

         setMatrix( rootHiro.matrix, trackedMatrix.interpolated );
      }

      renderer.render(scene, camera);
    };

    function process() {
        context_process.fillStyle = "black";
        context_process.fillRect(0, 0, pw, ph);
        context_process.drawImage(video, 0, 0, vw, vh, ox, oy, w, h);

        var imageData = context_process.getImageData(0, 0, pw, ph);
        worker.postMessage({ type: "process", imagedata: imageData }, [imageData.data.buffer]);
    }
    var tick = function() {
        draw();
        requestAnimationFrame(tick);
    };

    load();
    tick();
    process();
}
