var orb, refGray;
var refKeyPts;
var refDescr;
var corners = [];
var initialized;

function initAR(img, refCols, refRows){
  orb = new cv.ORB(5000);
  
  let src = cv.imread(img);
  refGray = convertImageToGray(src)
 
  console.log("Image converted to gray!");

  var noArray = new cv.Mat();
  refDescr = new cv.Mat();
  refKeyPts = new cv.KeyPointVector();

  orb.detectAndCompute(refGray, noArray, refKeyPts, refDescr);

  // initialize reference image corners for warping
  
  corners[0] = new cv.Point( 0, 0 );
  corners[1] = new cv.Point( refCols, 0 );
  corners[2] = new cv.Point( refCols, refRows );
  corners[3] = new cv.Point( 0, refRows );
  console.log(corners);

  initialized = true;
  console.log('initialized is: ', initialized);
  console.log('Ready!');
  let out = new cv.Mat();
  cv.drawKeypoints(refGray, refKeyPts, out, [0, 255, 0, 255]);
  
  cv.imshow('canvasOutput', out);
  refGray.delete()
}

function convertImageToGray(img) {
  let dst = new cv.Mat();
  cv.cvtColor(img, dst, cv.COLOR_RGBA2GRAY, 0);
  return dst;
}