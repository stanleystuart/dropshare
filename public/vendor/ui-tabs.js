(function () {
  "use strict";

  var $ = require('ender')
    , url = require('url')
    , lastHash = location.hash
    ;

  function create(callback, root, uiTab, uiView) {
    callback = callback || function () {};

    function displayTab() {
      var resource = location.hash
        , urlObj
        , pathnames
        , viewSelector = ''
        , tabSelector = ''
        ;

      lastHash = resource;

      /*
      if (0 !== resource.indexOf('#/')) {
        return;
      }
      */
      
      urlObj = url.parse(resource.substr(1), true, true);
      console.log(urlObj);

      if (true === callback(lastHash, resource, urlObj)) {
        return;
      }

      // discount #/
      console.log('pathname', urlObj.pathname.split('/'));
      pathnames = urlObj.pathname.split('/');
      /*
      if ('#' !== pathnames.shift()) {
        console.error('Bad Parse');
        return;
      }
      */

      // hides children as well
      $(uiView).hide();
      $(uiTab).removeClass('selected');

      // This allows for nested tabs
      pathnames.forEach(function (pathname) {
        if ('' === pathname) {
          return;
        }
        // TODO always append uiview or not?
        viewSelector += uiView + '.' + pathname + ' ';
        tabSelector += uiTab + '.' + pathname + ' ';
        console.log('viewSelector', viewSelector);
        console.log('tabSelector', viewSelector);
        $(viewSelector).show();
        $(tabSelector).addClass('selected');
      });
      // This allows for a default tab
      viewSelector += uiView + '.index';
      tabSelector += uiTab + '.index';
      $(viewSelector).show();
      $(tabSelector).addClass('selected');
    }

    function parseUiTabHref(ev) {
      var href = url.resolve(location.href, $(this).attr('href'))
        , curHref = location.href.split('#').shift()
        ;

      /*
      if (href.substr(0, location.host.length) !== location.host) {
        console.log('http/https mismatch or on a different domain.', href, location.host);
        // on a different domain
        // or http/https mismatch
        return;
      }
      */

      console.log(href);
      if (href.substr(0, curHref.length) !== curHref) {
        console.log('Moving to a different directory.', href, curHref);
        // in a different directory
        return;
      }

      href = href.substr(curHref.length - 1);
      console.log(href);

      // TODO robust click-jacking support
      // valid for http/https: //domain.tld/resource
      // /path/to/res
      // path/to/res
      // ./path/to/res
      // ../path/to/res
      // resolve relative hashtags #blah -> #/current/blah; #/blah -> #/blah
      if (/^\/[^\/]?/.exec(href)) {
        // TODO add option for full click-jacking
        //location.hash = href;
        //ev.preventDefault();
      }
    }

    global.window.addEventListener('hashchange', displayTab);

    $.domReady(function () {
      // handle both cases
      $(root).delegate(uiTab + ' a', 'click', parseUiTabHref);
      $(root).delegate('a' + uiTab, 'click', parseUiTabHref);
      location.hash = location.hash.substr(1) || '/';
      displayTab();
    });
  }
  
  module.exports.create = create;
}());
