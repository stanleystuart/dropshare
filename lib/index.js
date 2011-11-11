(function () {
  "use strict";
  /**
   * Module dependencies.
   */

  var connect = require('connect')
    , util = require('util')
    , fs = require('fs.extra')
    , assert = require('assert')
    , Futures = require('futures')
    , Formaline = require('formaline')
      // The DropShare Epoch -- 1320969600000 -- Fri, 11 Nov 2011 00:00:00 GMT
    , generateId = require('./gen-id').create(1320769600000)
    , storage = require('./redis-wrapper').create()
    , filesDir = __dirname + '/files'
    , server
    ;

  connect.cors = require('connect-cors');

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

      res.end(JSON.stringify(err), 400);
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
      res.writeHead(200, {'content-type': 'application/json'});
      res.write(JSON.stringify(ids));
      res.end();
      next();
    });
  }

  function handleUploadedFiles (json, res) {
    var responses = []
      , sequence = require('sequence')()
      ;

    json.files.forEach(function (fileObj) {
      sequence.then(function (next) {
        handleUploadedFile(fileObj, function (response) {
          responses.push(response);
          next();
        });
      });
    });

    //TODO: responses not working? they need to be in a callback?
    sequence.then(function (next) {
      res.end(formatFileUploadResponses(responses));
      next();
    });
  }

  function handleUploadedFile (file, cb) {
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
    var is
      , os
      , newFilePath = filesDir + '/' + file.sha1checksum
      ;

    fs.stat(file.path, function (err, stat) {
      assert.strictEqual(err, null, "tried to move a non-existent file");

      //check if file with same checksum already exists
      fs.stat(newFilePath, function (err, stat) {
        if (typeof stat === "undefined") {
          // File does not exist already, so move it in to place
          fs.move(file.path, newFilePath, function (err) {
            if (err) {
              throw err;
            }

          });
        }
        else {
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
      , config
      ;

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

  function checkForFileExistence(req, res, err, data) {
    if (err || data === null || typeof(data.sha1checksum) === "undefined") {
      res.writeHead(400, {'content-type': 'application/json'});
      res.write(JSON.stringify({
        "result": "error",
        "data": "No files uploaded for " + req.params.id + "."
      }));
      res.end();
      return false;
    }
    return true;
  }

  function sendFile(req, res, next) {
    storage.get(req.params.id, function (err, data) {
      if (!checkForFileExistence(req, res, err, data)) {
        return;
      }

      fs.readFile(filesDir + '/' + data.sha1checksum, function (err, fileData) {
        if (err) {
          console.log('trying to get a file that\'s probably deleted');
          throw err;
        }

        res.writeHead(200, {'content-type': data.type });
        res.write(fileData);
        res.end();
      });

    });
  }

  // Delete both the metadata and the file on the FS.
  // NOTE: this will break stuff it multiple IDs refer to the same
  // file. For example, if the same file is uploaded multiple times,
  // it will have the same sha1 hash. If one ID is DELETEd, it will
  // delete the file that other IDs refer to, and then a GET is
  // issued for a different ID that refers to the same file,
  // it will explode.

  // This could be fixed by storing a list of IDs files keyed by
  // the SHA1 hash of the file the refer to.
  function removeFile(req, res, next) {
    var id = req.params.id
      ;

    storage.get(id, function (err, data) {
      if (!checkForFileExistence(req, res, err, data)) {
        return;
      }

      function error(res, data) {
          res.writeHead(500, {'content-type': 'application/json'});
          res.write(JSON.stringify({
            "result": "error",
            "data": "Error in deleting " + data.id + "."
          }));
          res.end();
          return;
      }


      storage.del(id, function (err) {
        if (err) {
          error(res, data);
          return;
        }

        fs.unlink(filesDir + '/' + data.sha1checksum, function (err) {
          if (err) {
            error(res, data);
            return;
          }

          res.writeHead(200, {'content-type': 'application/json'});
          res.write(JSON.stringify({
            "result": "success",
            "data": "Successfully deleted " + req.params.id + "."
          }));
          res.end();
        });
      });
    });
  }

  function create(options) {

    function router(app) {
      app.post('/files/new', createIds);
      app.post('/files', receiveFiles);
      app.get('/files/:id/:filename?', sendFile);
      app.delete('/files/:id', removeFile);
    }

    filesDir = options.files;

    server = connect.createServer(
        connect.cors()
      , connect.static(options.client)
      , connect.bodyParser()
      , connect.query()
      //, connect.methodOverride()
      , connect.router(router)
      // Development
      , connect.errorHandler({ dumpExceptions: true, showStack: true }) 
      // Production
      //, connect.errorHandler()
    );

    return server;
  }

  module.exports.create = create;
}());
