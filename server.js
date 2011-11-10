(function () {
  "use strict";

  var dropshare = require('./lib/index')
    , options = {
          "tmp": "/tmp"
        , "files": __dirname + "/files"
        , "client": "./public"
      }
    , server = dropshare.create(options)
    ;

  module.exports = server;
}());
