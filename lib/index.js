(function () {
  "use strict";

  var fs = require('fs')
    , connect = require('connect')
    , server
    ;

  connect.cors = require('connect-cors');

  function create() {
    server = connect.createServer(
        connect.static('./')
      , connect.cors()
    );

    return;
  }

  module.exports = server;
}());
