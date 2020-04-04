function nftLoader(container, video, videoWidth, videoHeight, canvas, marker, stats) {

  if(stats){
    var statsMain = new Stats();
    statsMain.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.getElementById("stats1").appendChild(statsMain.dom);

    var statsWorker = new Stats();
    statsWorker.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.getElementById("stats2").appendChild(statsWorker.dom);
  } else {
    document.getElementById("stats").remove();
  }

  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    var hint = {
      audio: false,
      video: true
    };

    if (window.innerWidth < 800) {
      hint = {
        audio: false,
        video: {
            width: { ideal: videoWidth },
            height: { ideal: videoHeight },
            facingMode:
                { exact:
                    "environment"
                }
            },
      };
    }

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
          }
        );
      });
    });
  }


}
