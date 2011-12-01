(function () {
  "use strict";

  console.log('Hello from DropShare!');

  var $ = require('ender')
    , request = require('ahr2')
    , pure = require('pure').$p
    , sequence = require('sequence')()
    , Updrop = require('./vendor/updrop')
    , UiTabs = require('./vendor/ui-tabs')
    , warnOnLargeFiles = true
    , linkTpl
    ;


  function uploadMeta(files, meta) {
    // I was attaching directly files[i].link = link
    // but that failed (inconsistently) in Firefox
    // maybe buggy garbage collection?
    var fileData = []
      ;

    $('#no-links').hide();

    // begin tempalte
    meta.forEach(function (m, i) {
      var link = $(linkTpl)
        ;

      link.find('.id').text('');
      link.find('.name').text(m.name);
      link.find('a').text(' ');
      link.find('a').attr('href', '#');
      //link.find('progress').attr('max', m.size);
      //link.find('progress').find('.max', m.size);
      link.find('.remove-file').hide();

      fileData[i] = {};
      fileData[i].link = link;
      fileData[i].file = files[i];

      $('ul#uploadlist').append(link);
    });

    request.post('/files/new', {}, meta).when(function (err, ahr, data) {
      var formData = new FormData()
        ;

      formData.append('secret', data.secret)

      // TODO data.result
      data.forEach(function (token, j) {
        var file = fileData[j].file
          , link = fileData[j].link
          , host = location.host
          , fullhost = location.protocol + '//' + host
          ;
        // TODO selectable target server

        formData.append(token, file);
        console.log('formData append', token, file.name);

        // TODO use data-meta-id
        link.find('.id').text(token);
        //link.find('.name').text(file.name);
        //link.find('progress')
        link.find('progress').attr('max', file.size);
        link.find('progress').find('.max').text(file.size);
        link.find('.name').remove();
        link.find('a').text(host + '#' + token); //encodeURIComponent(file.name));
        link.find('a').attr('href', fullhost + '#' + token); //encodeURIComponent(file.name));
      });
      // this hack forces Chrome / Safari to redraw
      $('#uploadlist')[0].style.display = 'none';
      $('#uploadlist')[0].offsetHeight;
      $('#uploadlist')[0].style.display = 'block';

      // "global" upload queue
      sequence.then(function (next) {
        var emitter;
        emitter = request.post('/files', {}, formData);
        emitter.when(function (err, ahr, data2) {
          console.log('data at data2', data);
          data.forEach(function (token, k) {
            console.log(fileData, k);
            var file = fileData[k].file
              , link = fileData[k].link
              ;

            console.log('file, link', file, link);

            // TODO
            link.find('progress').remove();
            // TODO
            //link.find('.remove-file').show();
          });
          next();
        });

        console.log(emitter);
        emitter.upload.on('progress', function (ev) {
          var totalLoaded = ev.loaded
            , i
            , file
            , bytesLeft
            , link
            , bytesLoaded
            ;

          fileData.forEach(function (fileDatum, i) {
          //for (i = 0; i < files.length; i += 1) {
            file = fileDatum.file;
            link = fileDatum.link;

            if (totalLoaded > 0) {
              bytesLeft = file.size - totalLoaded;
              if (bytesLeft > 0) {
                bytesLoaded = file.size - bytesLeft;
              } else {
                bytesLoaded = file.size;
                bytesLeft = 0;
              }
              totalLoaded -= bytesLoaded;
            } else {
              bytesLoaded = 0;
              bytesLeft = file.size;
            }

            link.find('progress').attr('value', bytesLoaded);
            link.find('progress').find('.val').text(bytesLoaded);
          //}
          });
          // TODO 

          console.log('progressEv', ev.loaded, ev.total);
        });
      });
    });
  }

  function handleDrop(files) {
    // handles both drop and file input change events
    var i
      , file
      , meta = []
      ;

    if (!files) {
      console.log('... looks drag-n-drop like litter to me.');
      return;
    }

    if (!files.length) {
      alert('looks like you tried to drop a folder, but your browser doesn\'t support that yet');
      return;
    }

    for (i = 0; i < files.length; i += 1) {
      file = files[i];
      console.log(files[i]);
      meta.push({
          "type": file.type
        , "name": file.name || file.fileName
        , "size": file.size || file.fileSize
        , "lastModifiedDate": file.lastModifiedDate
        , "path": file.mozFullPath || file.webkitRelativePath
      });
      //file.xyz = 'something';
      // $()
      //$('#uploadlist').append('<li class=\'file-info\'></li>');
      if (warnOnLargeFiles) {
        warnOnLargeFiles = false;
        if (file.size >= (100 * 1024 * 1024)) {
          alert(''
            + 'Some browsers have issues with files as large as the ones you\'re trying to upload (100MiB+).'
            + 'If your browser becomes slow, unresponsive, or crashes; try using Chrome instead'
            );
        }
      }
    }

    console.log(JSON.stringify(files));

    uploadMeta(files, meta);
  }

  function onRemoveFile(ev) {
    var id = $(this).closest('.file-info').find('.id').text().trim()
      , imSure = confirm('Are you sure you want to delet this?')
      , self = this
      ;

    if (!imSure) {
      return;
    }

    request.delete(location.protocol + '//' + location.host + '/files/' + id).when(function (err, ahr, data) {
      console.log('prolly deleted:', err, ahr, data);
      $(self).closest('li').remove();
      if (!$('ul#uploadlist li').length) {
        $('#no-links').show();
      }
    });
  }

  function onDragOut(ev) {
    var url = $(this).attr('data-downloadurl')
      , result
      ;

    console.log('data-downloadurl', url);
    result = ev.dataTransfer && ev.dataTransfer.setData('DownloadURL', url);

    if (!result) {
      alert('Sad Day! Your browser doesn\'t support drag-downloading files');
    }
  }

  function switchToShare() {
    var resource = location.hash.substr(1).split('/');

    // convert #share/xzy and #/share/xyz to #xyz
    // TODO remove after a reasonable amount of time
    if (/\/(s|share)/.exec(resource[0] || resource[1])) {
      console.log('share', location.hash);
      resource.shift(); // moves the '#' out
      resource.shift(); // moves 's[hare]' out
      location.hash = resource.join('/');
      return true;
    }

    // only handle short urls without leading '/'
    if ('' === resource[0]) {
      console.log('noshare', location.hash);
      return false;
    }

    console.log('goshare', location.hash);

    console.log(resource);
    var id = resource[0]
      , name = resource[1] || 'stream.bin'
      , url = location.protocol + '//' + location.host + '/files/' + id + '/' + name
      , type = 'application/octet-stream'
      ;

    request.get('/meta/' + id).when(function (err, ahr, data) {
      if (!data || !data.success) {
        alert('Sad day! Looks like a bad link.');
        return;
      }

      url = location.protocol + '//' + location.host + '/files/' + id + '/' + data.result.name
      $('a.dnd').attr('href', url);
      $('a.dnd').attr('data-downloadurl', type + ':' + decodeURIComponent(name) + ':' + url);
      $('#loading').hide();

      if (data.result.expired) {
        alert('Sad day! "' + (data.result.name || 'That file')  + '" is no longer available. :\'|');
        return;
      }

      console.log('data.result', data.result);
      if (!data.result.sha1checksum && !data.result.sha1sum && !data.result.md5sum) {
        alert('Wait for it... \njust. a. few. more. minutes... \nThe file is still uploading (or the upload failed{');
        return;
      }
    });

    // TODO loading
    $('#loading').show();
    $('a.dnd').attr('href', url);
    $('a.dnd').attr('data-downloadurl', type + ':' + decodeURIComponent(name) + ':' + url);

    $('.uiview').hide();
    $('.share.uiview').show();

    return true;
  }

  function handleSpecialRoutes(oldHash, newHash, urlObj) {
    return switchToShare();
  }

  function addHandlers() {
    linkTpl = $('ul#uploadlist').html()
    $('ul#uploadlist').html('')

    // The input selector is created by updrop
    Updrop.create(handleDrop, 'body', '#dropzone');
    Updrop.create(handleDrop, 'body', '#uploadzone');
    
    $('body').delegate('.remove-file', 'click', onRemoveFile);

    //$('body').delegate('.tabs a', 'click', switchTabView);
    $('body').delegate('a.dnd', 'dragstart', onDragOut);
    $('.uiview').hide();
    UiTabs.create(handleSpecialRoutes, 'body', '.tab', '.uiview');
  }




  $.domReady(addHandlers);

}());
