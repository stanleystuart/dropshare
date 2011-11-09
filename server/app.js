(function () {
  "use strict";
  /**
   * Module dependencies.
   */

  var express = require('express')
    , util = require('util')
    , fs = require('fs')
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
      var toReturn
      , now = Date.now()
      , id;

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
      toReturn = randomInts[counter];

      id += toReturn;

      id = parseInt(id, 10);
      var idString = numericBuffer(id).toString('base64');
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

    console.log(typeof(req.body));
    if (!req.body instanceof Array) {
      var err = {
        'result': 'error',
        'data': 'Must be an array of file metadata.'
      };
      res.send(JSON.stringify(err), 400);
      return;
    }

    for(i = 0; i < req.body.length; i++) {
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


  app.post('/files', function (req, res, next) {
    var form
    , config;

    config = {
      sha1sum: true
      , uploadThreshold: 1024 * 1024 * 1024
      , listeners: {
        'loadend': function (json, res, callback) {
          console.log( '\nPost Done.\n' );
          console.log( '\n JSON -> \n', json, '\n' );
          res.writeHead( 200, { 'content-type' : 'text/plain' } );
          res.write( '-> ' + new Date() + '\n' );
          res.write( '-> request processed! \n' );
          res.write( '\n-> stats -> ' + JSON.stringify( json.stats, null, 4 ) + '\n' );
          res.write( '\n Initial Configuration : ' + JSON.stringify( form.initialConfig, function ( key, value ) {
            if ( typeof value === 'function' ) {
              return '..';
            }
            return value;
          }, 4 ) + '\n' );

          res.write( '\n-> fields received: [ { .. } , { .. } ] \n   ****************\n' + JSON.stringify( json.fields, null, 1 ) + '\n' );
          res.write( '\n-> files written: [ { .. } , { .. } ] \n   **************\n ' + JSON.stringify( json.files, null, 1 ) + '\n' );
          if ( form.removeIncompleteFiles ) {
            res.write( '\n-> partially written ( removed ): [ { .. } , { .. } ] \n   *****************\n'+ JSON.stringify( json.incomplete, null, 1 ) + '\n' );
          } else {
            if ( json.incomplete.length !== 0 ) {
              res.write( '\n-> partially written ( not removed ): \n   *****************\n' + JSON.stringify( json.incomplete, null, 1 ) + '\n' );
            }
          }
          res.end();
          try {
            callback();
          } catch ( err ) {
            console.log( 'error', err.stack );
          }
        }
      } // end listeners
    }; // end config object

    form = new Formaline(config);
    form.parse(req, res, function () {
      console.log("formaline callback called");
    });
  });

  app.get('/files/:id/:filename?', function (req, res, next) {

  });

  app.listen(3333);
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
}());
