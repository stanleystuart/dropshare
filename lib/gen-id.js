 (function () {
  "use strict";

  var removeTrailingEqualsRegex = /([a-zA-Z0-9\+\/]+)=+/
    , numericBuffer = require('numeric-buffer')
    ;

  function create(timestamp) {
    // Generate a fairly unique ID for file uploads.
    // Use the difference between a passed in time and the
    // current timestamp in seconds, along with a random integer
    // appended to that, to generate the id.
    // Note: this is not actually very secure, consequences of
    // someone guessing someone else's unique id are low, so
    // it is not a big deal.
    var randomInts = []
      , i = 0
      ;

    function createRandomBits() {
      for (i; i < 10000; i += 1) {
        randomInts[i] = i;
      }

      //Sort in random order
      randomInts.sort(function (a, b) {
        return Math.random()  - 0.5;
      });
    }

    return function () {
      var randomSuffix
        , now = Date.now()
        , id
        , base64Id
        ;

      // Difference between timestamp and passed in time in seconds
      id = parseInt((now - timestamp) / 1000, 10).toString();

      // If we have used up all the random integers,
      // re-sort them and start again at the beginning of the random integers.
      if (!randomInts.length) {
        createRandomBits();
      }
      randomSuffix = randomInts.pop();

      id += randomSuffix;
      id = parseInt(id, 10);

      // Convert the int into a base64 string, but without forward slashes
      base64Id = numericBuffer(id).toString('base64');
      base64Id = base64Id.replace(removeTrailingEqualsRegex, "$1");
      base64Id = base64Id.replace(/\//g, ".");

      return base64Id;
    };
  }

  module.exports.create = create;
 }());
