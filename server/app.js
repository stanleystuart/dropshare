(function () {
  "use strict";
  /**
   * Module dependencies.
   */

  var express = require('express')
    , util = require('util')
    , fs = require('fs')
    , Futures = require('futures')
    , installTime
    , redisWrapper = require('./redis-wrapper')
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
      // TODO: implement base64 conversion
      // id = parseInt(id, 10);
      // id = new Buffer(id).toString('base64');
      counter += 1;
      return id;
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
    if (! req.body instanceof Array) {
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
    res.send("HURP DURP", 200);
  });

  app.get('/files/:id/:filename?', function (req, res, next) {

  });

  app.listen(3333);
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
}());
