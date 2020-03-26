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
var texture = new THREE.TextureLoader().load( '../resources/data/textures/aframe-k.png' );

function start(container, marker, video, input_width, input_height, canvas_draw, render_update, track_update, greyCover) {
    var vw, vh;
    var sw, sh;
    var pscale, sscale;
    var w, h;
    var pw, ph;
    var ox, oy;
    var worker;
    var camera_para = '../../../resources/data/camera_para.dat'

    var canvas_process = document.createElement('canvas');
    var context_process = canvas_process.getContext('2d');

    var renderer = new THREE.WebGLRenderer({ canvas: canvas_draw, alpha: true, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);

    var scene = new THREE.Scene();

    var ambientLight = new THREE.AmbientLight( 0xcccccc );
    scene.add( ambientLight );

    var camera = new THREE.Camera();
    camera.matrixAutoUpdate = false;

    var pointLight = new THREE.PointLight( 0xffffff, 0.8 );
    camera.add( pointLight );

    scene.add(camera);

    var root = new THREE.Object3D();
    scene.add(root);

  	var mat = new THREE.MeshLambertMaterial({color: 0xbbbbff, map: texture});
    var planeGeom = new THREE.PlaneGeometry(1,1,1,1);
    var plane = new THREE.Mesh(planeGeom, mat);
  	plane.position.z = 0;
  	plane.position.x = 90;
  	plane.position.y = 90;
  	plane.scale.set(180,180,180);


    root.matrixAutoUpdate = false;
    root.add(plane);

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

        worker = new Worker('../resources/jsartoolkit5/artoolkit/artoolkit.worker.js');

        worker.postMessage({ type: "load", pw: pw, ph: ph, camera_para: camera_para, marker: marker.url });

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
                    document.body.classList.remove( 'loading' );
                    document.getElementById('loading').remove();
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

    var found = ( msg ) => {
        if( !msg ) {
            world = null;
        } else {
            world = JSON.parse( msg.matrixGL_RH );
        }
    };

    var lasttime = Date.now();
    var time = 0;

    var draw = () => {
        render_update();

        if (!world) {
            plane.visible = false;
        } else {
            plane.visible = true;

            // interpolate matrix
            for( var i = 0; i < 16; i++ ) {
               trackedMatrix.delta[i] = world[i] - trackedMatrix.interpolated[i];
               trackedMatrix.interpolated[i] = trackedMatrix.interpolated[i] + ( trackedMatrix.delta[i] / interpolationFactor );
             }

            setMatrix( root.matrix, trackedMatrix.interpolated );
            plane.visible = true;
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
    var tick = () => {
        draw();
        requestAnimationFrame(tick);
    };

    load();
    tick();
    process();
}
