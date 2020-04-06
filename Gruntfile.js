/*global module,require */
module.exports = function(grunt) {
  "use strict";

  var pkg = grunt.file.readJSON("package.json");

  grunt.initConfig({
    pkg: pkg,

    uglify: {
      options: {},
      dist: {
        src: "resources/js/nftLoader/nftLoader.js",
        dest: "resources/build/nftLoader/nftLoader.min.js"
      }
    }
  });

  grunt.loadNpmTasks("grunt-contrib-uglify-es");
};
