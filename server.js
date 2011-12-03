(function () {
  "use strict";

  var dropshare = require('./lib/index')
    , config = require('./config')
    , options = {
          "tmp": "/tmp"
        , "files": __dirname + "/files"
        , "client": __dirname + "/public"
      }
    , server
    , attributeName
    ;


  // Use the options provided in the config.js file
  for (attributeName in config) {
    options[attributeName] = config[attributeName];
  }

  server = dropshare.create(options)
  module.exports = server;
}());
