(function () {
  "use strict";
  /**
   * Module dependencies.
   */

  var express = require('express')
    , connect = require('connect')
    , util = require('util')
    , fs = require('fs')
    , assert = require('assert')
    , Futures = require('futures')
    , Formaline = require('formaline')
      // The DropShare Epoc -- 1320969600000 -- Fri, 11 Nov 2011 00:00:00 GMT
    , generateId = require('./gen-id').create(1320769600000)
    , storage = require('./redis-wrapper').create()
    , filesDir = __dirname + '/files'
    , app
    ;

  connect.cors = require('connect-cors');

  app = express.createServer();

  // Configuration
  app.configure(function () {
    //app.use(connect.cors());
    app.use(express.bodyParser());
    //app.use(express.methodOverride());
    //app.use(express.router());
    app.use(express.static(__dirname + '/public'));
  });

  app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
  });

  app.configure('production', function(){
    app.use(express.errorHandler());
  });

  // Routes
  function createIds(req, res, next) {
    var i
      , sequence = Futures.sequence()
      , ids = []
      , id
      , meta
      , err
      , now = Date.now()
      ;

    if (!req.body instanceof Array) {
      var err = {
        "result": "error",
        "data": "Must be an array of file metadata."
      };

      res.send(JSON.stringify(err), 400);
      return;
    }

    // TODO use forEachAsync
    for (i = 0; i < req.body.length; i++) {
      meta = req.body[i];
      meta.timestamp = now;
      id = generateId();
      sequence.then(function (next) {
        storage.set(id, meta, function (err, data) {
          ids.push(id);
          next();
        });
      });
    }

    sequence.then(function (next) {
      res.send(JSON.stringify(ids));
      next();
    });
  }

  function handleUploadedFiles (json, res) {
    var responses = [];

    json.files.forEach(function (fileObj) {
      handleUploadedFile(fileObj, function (response) {
        responses.push(response);
      });
    });
    //TODO: responses not working? they need to be in a callback?
    res.send(formatFileUploadResponses(responses));
  }

  function handleUploadedFile (file, cb) {
    console.log("calling handleUploadedFile");
    // Check that metadata exists for this ID
    storage.get(file.name, function (err, result) {
      var response;
      if (err !== null || result === null) {
        cb({
          "result": "error",
          "data": "No metadata for id '" + file.name + "'."
        });
        return;
      }

      // If metadata exists, then move the file and update the metadata with the new path
      var res = moveFileToStorage(file.name, file.value[0], cb({
        "result": "success",
        "data": "File " + file.name + " stored successfully."
      }));
    });
  }

  function moveFileToStorage(fileId, file) {
    console.log("calling moveFileToStorage");
    var is
    , os
    , newFilePath = filesDir + '/' + file.sha1checksum;
    fs.stat(file.path, function (err, stat) {
      assert.strictEqual(err, null, "tried to move a non-existent file");

      //check if file with same checksum already exists
      fs.stat(newFilePath, function (err, stat) {
        if (typeof stat === "undefined") {
          // File does not exist already, so move it in to place
          is = fs.createReadStream(file.path);
          os = fs.createWriteStream(newFilePath);
          util.pump(is, os, function () {
            console.log("file moved!");
          });
        }
        else {
          console.log("file already exists");
        }

        addSHA1ToMetadata(fileId, file.sha1checksum);
      });
    });
  }

  function addSHA1ToMetadata(id, checksum) {
    storage.get(id, function (err, data, isJSON) {
      assert.ok(isJSON, "Metadata is not JSON");

      data.sha1checksum = checksum;
      storage.set(id, data, function (err, res) {
        assert.deepEqual(err, null, "Error storing metadata again.");
      });
    });
  }

  function formatFileUploadResponses (responses) {
    return JSON.stringify(responses);
  }

  function receiveFiles(req, res, next) {
    var form
    , config;

    config = {
      sha1sum: true
      , uploadThreshold: 1024 * 1024 * 1024
      , listeners: {
        'loadend': function (json, res, callback) {
          console.log( '\nPost Done.\n' );
          try {
            callback(json, res);
          } catch ( err ) {
            console.log( 'error', err.stack );
          }
        }
      } // end listeners
    }; // end config object

    form = new Formaline(config);
    form.parse(req, res, handleUploadedFiles);
  }

  function sendFile(req, res, next) {
    /*
     * 1. Check if a file exists for that id
     * 2. if so, allow them to download the file with the given filename
     * 3. if they don't provide a filename, then do it with the filename stored in the metadata
     * 4. if no file exists, then return an error
     */

    storage.get(req.params.id, function (err, data) {
      if (err || data === null || typeof(data.sha1checksum) === "undefined") {
        console.log('could not find the data');
        res.writeHead(400, {'content-type': 'application/json'});
        res.write(JSON.stringify({
          "result": "failure",
          "message": "No files uploaded for " + req.params.id + "."
        }));
        res.end();
        return;
      }

      fs.readFile(filesDir + '/' + data.sha1checksum, function (err, fileData) {
        if (err) {
          throw err;
        }

        res.writeHead(200, {'content-type': data.type });
        console.log('fdata:', fileData);
        res.write(fileData);
        res.end();
      });

    });
  }

  function removeFile(req, res, next) {
    res.end('Not Supported Yet');  
  }

  app.post('/files/new', createIds);
  app.post('/files', receiveFiles);
  app.get('/files/:id/:filename?', sendFile);
  app.delete('/files/:id', removeFile);

  function create(options) {
    filesDir = options.files;
    return app;
  }

  module.exports.create = create;
}());
