(function () {
  "use strict";
  /**
   * Module dependencies.
   */

  var express = require('express')
    , util = require('util')
    , fs = require('fs')
    , assert = require('assert')
    , numericBuffer = require('numeric-buffer')
    , Futures = require('futures')
    , Formaline = require('formaline')
    , redisWrapper = require('./redis-wrapper')
    , installTime
    , storage = new redisWrapper();

  var app = module.exports = express.createServer();

  // Configuration
  app.configure(function(){
    //get first start time, or create it if it does not exist
    fs.readFile('install_time.txt', function (err, data) {
      var time = Date.now();
      if (err) {
        fs.writeFile('install_time.txt', time.toString(), function (err) {
          if (err) {
            throw err;
          }
          console.log("install_time written out!");
          installTime = time;
        });
      }
      else {
        console.log("install_time found, and it is " + data);
        installTime = parseInt(data, 10);
      }
    });

    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
  });

  app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
  });

  app.configure('production', function(){
    app.use(express.errorHandler());
  });


  // Generate a fairly unique ID for file uploads.
  // Use the difference between a passed in time and the
  // current timestamp in seconds, along with a random integer
  // appended to that, to generate the id.
  // Note: this is not actually very secure, consequences of
  // someone guessing someone else's unique id are low, so
  // it is not a big deal.
  // TODO: pull this out into a separate file
  var generateID = (function () {
    var randomInts = []
    , i = 0
    , counter = 0


    for (i; i < 10000; i++) {
      randomInts[i] = i;
    }

    //Sort in random order
    randomInts.sort(function (a, b) {
      return Math.random()  - 0.5;
    });

    return function (startTime) {
      var randomSuffix
      , now = Date.now()
      , id
      , idString
      , removeTrailingEqualsRegex;

      // Difference between startTime and passed in time in seconds
      id = parseInt((now - startTime) / 1000, 10).toString();

      // If we have used up all the random integers,
      // re-sort them and start again at the beginning of the random integers.
      if (counter >= randomInts.length) {
        randomInts.sort(function (a, b) {
          return Math.random()  - 0.5;
        });
        counter = 0;
      }
      randomSuffix = randomInts[counter];

      id += randomSuffix;

      id = parseInt(id, 10);
      // Convert the int into a base64 string
      idString = numericBuffer(id).toString('base64');
      removeTrailingEqualsRegex = /([a-zA-Z0-9\+\/]+)=+/;
      idString = idString.replace(removeTrailingEqualsRegex, "$1");
      counter += 1;
      return idString;
    };
  }());

  // Routes
  app.post('/files/new', function (req, res, next) {
    var i
    , sequence = Futures.sequence()
    , ids = []
    , id
    , err

    if (!req.body instanceof Array) {
      var err = {
        "result": "error",
        "data": "Must be an array of file metadata."
      };
      res.send(JSON.stringify(err), 400);
      return;
    }

    for (i = 0; i < req.body.length; i++) {
      id = generateID(installTime);
      sequence.then(function (next) {
        storage.set(id, req.body[i], function (err, data) {
          ids.push(id);
          next();
        });
      });
    }

    sequence.then(function (next) {
      res.send(JSON.stringify(ids));
      next();
    });
  });

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
    , newFilePath = 'files/' + file.sha1checksum;
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

  app.post('/files', function (req, res, next) {
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
  });

  app.get('/files/:id/:filename?', function (req, res, next) {
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

      fs.readFile('files/' + data.sha1checksum, function (err, fileData) {
        res.writeHead(200, {'content-type': data.type });
        res.write(fileData);
        res.end();
      });

    });
  });

  // app.delete('/files/:id', function (req, res, next) {

  // });

  app.listen(3333);
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
}());
