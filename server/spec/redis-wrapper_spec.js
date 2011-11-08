var redisWrapper = require('../redis-wrapper')
  , wrapper = new redisWrapper()
  , util = require('util');

util.debug(util.inspect(wrapper));

describe('redisWrapper', function () {
  it('sets and gets JSON data correctly', function () {
    var testData = {
      'foo': 'bar',
      'baz': 'a whole lot of nothing'
    }
    , id = 'ALKJHDLKSHJF';

    wrapper.set(id, testData);
    wrapper.get(id, function (err, data) {
      expect(data).toEqual(testData);
    });
  });
});
