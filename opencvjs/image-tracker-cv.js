var orb, refGray;
var refKeyPts;
var refDescr;
var corners = [];
var initialized;

const ValidPointTotal = 6;
const MaxFeatures = 2000;
var template_keypoints_vector;
var template_descriptors;
var homography_transform;

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

function initTemplateImage(templateImageData) {
  var src = cv.imread(templateImageData);
  // 
  cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
  // 
  template_keypoints_vector = new cv.KeyPointVector();
  // 
  template_descriptors = new cv.Mat();
  // 
  var noArray = new cv.Mat();
  // 
  var orb = new cv.ORB(MaxFeatures);
  // 
  orb.detectAndCompute(src, noArray, template_keypoints_vector, template_descriptors);
  // 
  src.delete()
  noArray.delete()
  orb.delete()
}

function detectAndCompute(keyFrameImageData) {
//function detectAndCompute(src) {
  // 
  //var src = cv.imread(keyFrameImageData);
  var src = convertImageToGray(keyFrameImageData);
  // 
  //cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
  // 
  var frame_keypoints_vector = new cv.KeyPointVector();
  // 
  var frame_descriptors = new cv.Mat();
  // 
  var orb = new cv.ORB(MaxFeatures);
  // 
  var noArray = new cv.Mat();
  // 
  orb.detectAndCompute(src, noArray, frame_keypoints_vector, frame_descriptors)
  var knnMatches = new cv.DMatchVectorVector();
  // 
  var matcher = new cv.BFMatcher();
  matcher.knnMatch(frame_descriptors, template_descriptors, knnMatches, 2)
  // 
  var frame_keypoints = [];
  // 
  var template_keypoints = [];
  //
  for (var i = 0; i < knnMatches.size(); i++) {
      var point = knnMatches.get(i).get(0)
      var point2 = knnMatches.get(i).get(1)

      if (point.distance < 0.7 * point2.distance) {
          // 
          var frame_point = frame_keypoints_vector.get(point.queryIdx).pt
          frame_keypoints.push(frame_point)
          // 
          var template_point = template_keypoints_vector.get(point.trainIdx).pt
          template_keypoints.push(template_point)
      }
     
  }

  // 
  var frameMat = new cv.Mat(frame_keypoints.length, 1, cv.CV_32FC2);
  var templateMat = new cv.Mat(template_keypoints.length, 1, cv.CV_32FC2);

  for (let i = 0; i < template_keypoints.length; i++) {
      // 
      frameMat.data32F[i * 2] = frame_keypoints[i].x;
      frameMat.data32F[i * 2 + 1] = frame_keypoints[i].y;
      // 
      templateMat.data32F[i * 2] = template_keypoints[i].x;
      templateMat.data32F[i * 2 + 1] = template_keypoints[i].y;
  }
  console.log("template key points: ",template_keypoints.length);
  // 
  if (template_keypoints.length >= ValidPointTotal) {
      var homography = cv.findHomography(templateMat, frameMat, cv.RANSAC)
      homography_transform = homography.data64F
  }else{
      homography_transform = null
  }

  //   
  noArray.delete()
  orb.delete()
  frame_keypoints_vector.delete()
  frame_descriptors.delete()
  knnMatches.delete()
  matcher.delete()
  templateMat.delete()
  frameMat.delete()
  //src.delete()
  frame_keypoints = null
  template_keypoints = null

  return {
      prediction: homography_transform,
  }
}

function detect(imageData) {
  var result;
  var startTime = new Date();
  
  result = detectAndCompute(imageData)
  console.log('detectAndCompute:', new Date() - startTime, 'ms');

  return result
}

function dispose() {
  //
  isValidKeyFrame = false;
  //
  if (template_keypoints_vector) {
      template_keypoints_vector.delete()
      template_keypoints_vector = null
  }
  //
  if (template_descriptors) {
      template_descriptors.delete()
      template_descriptors = null
  }
  //
  homography_transform = null
  //
  var lastFrame;
  if (lastFrame) {
      lastFrame.delete()
      lastFrame = null
  }
  //
  var lastFrameMat
  if (lastFrameMat) {
      lastFrameMat.delete()
      lastFrameMat = null
  }
}

function convertImageToGray(img) {
  let dst = new cv.Mat();
  cv.cvtColor(img, dst, cv.COLOR_RGBA2GRAY, 0);
  return dst;
}