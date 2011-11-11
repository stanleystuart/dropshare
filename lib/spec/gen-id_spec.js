(function () {
  "use strict";
  var genId = require('../gen-id').create(10000000)
    ;

  describe('gen-id', function () {
    it('generates base64 ids without forward-slashes', function () {
      var ids = []
        , i = 0
        , id
        ;
      for (i; i < 1000; i++) {
        id = genId();
        (function (generatedId) {
          expect(generatedId).toMatch(/^[A-Za-z0-9\.\+]+$/);
        })(id);
      }
    });
  });
}());
