var redisWrapper = require('../redis-wrapper')
  , wrapper = new redisWrapper()

describe('redisWrapper', function () {
  it('sets and gets JSON data correctly', function () {
    var testData = {
      'foo': 'bar',
      'baz': 'a whole lot of nothing'
    }
    , id = 'test1';

    wrapper.set(id, testData);
    wrapper.get(id, function (err, data) {
      expect(data).toEqual(testData);
    });
    waits(500);
  });

  it('sets and gets strings correctly', function () {
    var dat = 'HURP DURP'
    , id = 'abc';

    wrapper.set(id, dat);
    wrapper.get(id, function (err, data, isJSON) {
      expect(data).toEqual(dat);
      expect(isJSON).toEqual(false);
    });
    waits(500);
  });
});
