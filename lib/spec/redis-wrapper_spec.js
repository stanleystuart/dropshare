var redisWrapper = require('../redis-wrapper')
  , wrapper = redisWrapper.create()

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
      wrapper.del(id, function (err) {});
    });
  });

  it('sets and gets strings correctly', function () {
    var dat = 'HURP DURP'
    , id = 'abc';

    wrapper.set(id, dat);
    wrapper.get(id, function (err, data, isJSON) {
      expect(data).toEqual(dat);
      expect(isJSON).toEqual(false);
      wrapper.del(id, function (err) {});
    });
  });

  it('lets you delete a value correctly', function () {
    var id = 'asdflhasdlkfhal'
      , dat = {hurp: 'durp'}
      ;

    wrapper.set(id, dat);
    wrapper.del(id, function (err) {
      expect(err).toEqual(null);
    });

    wrapper.get(id, function (err, data) {
      expect(data).toEqual(null);
    });
    waits(800);
    wrapper.quit();
  });
});
