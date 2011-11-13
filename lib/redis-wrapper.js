(function () {
  "use strict";
  var redis = require('redis');

  function RedisWrapper() {

    var client = redis.createClient();
    client.on('error', function (err) {
      console.log("Redis error: " + err);
    });

    return {
      set: function (id, val, cb) {
        if (typeof(cb) === 'undefined') {
          cb = function (err, data) {};
        }

        if (typeof(val) !== "string") {
          val = JSON.stringify(val);
        }

        client.set(id, val, cb);
      },

      get: function (id, cb) {
        client.get(id, function (err, data) {
          var isJSON = true;
          if (data) {
            // If JSON was not stored, then what to do? we need to catch it somehow
            try {
              data = JSON.parse(data);
            }
            catch (e) {
              console.log('data was not json. hope that is okay');
              isJSON = false;
            }
          }
          cb(err, data, isJSON);
        });
      },

      del: function (id, cb) {
        client.del(id, cb);
      },

      quit: function () {
        client.quit();
      }
    };
  }

  function create() {
    return new RedisWrapper();
  };

  module.exports.create = create;
}());
