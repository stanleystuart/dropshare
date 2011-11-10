(function () {
  "use strict";

  var dropshare = require('./lib/index')
    , options = {
          "tmp": "/tmp"
        , "files": __dirname + "/files"
        , "client": __dirname + "/public"
      }
    , server = dropshare.create(options)
    ;

  module.exports = server;
}());
