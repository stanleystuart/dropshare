#!/usr/bin/env node
(function () {
  "use strict";

  var dropshare = require('dropshare')
    , port = process.argv[2] || 3700 // 37 === DS
    ;

  dropshare.create().listen(port);

  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
}());
