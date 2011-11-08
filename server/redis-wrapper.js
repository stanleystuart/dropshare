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
        if ("undefined" === typeof(cb)) {
          cb = function (err, data) {};
        }
        client.set(id, JSON.stringify(val), cb);
      },

      get: function (id, cb) {
        client.get(id, cb);
      }
    };
  }

  module.exports = RedisWrapper;
}());
