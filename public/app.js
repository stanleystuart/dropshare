(function () {
  "use strict";

  console.log('Hello from DropShare!');

  var $ = require('ender')
    , request = require('ahr2')
    , pure = require('pure').$p
    , sequence = require('sequence')()
    , linkTpl
    ;

  function handleDrag(ev) {
    console.log('handledrag');
    //ev.stopPropagation();
    ev.preventDefault();
  }

  function uploadMeta(files, meta) {
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

      files[i].link = link;

      $('ul#uploadlist').append(link);
    });

    request.post('/files/new', {}, meta).when(function (err, ahr, data) {
      var formData = new FormData()
        ;

      formData.append('secret', data.secret)

      // TODO data.result
      data.forEach(function (token, j) {
        var file = files[j]
          , link = file.link
          , host = location.host
          , fullhost = location.protocol + '//' + host
          ;
        // TODO selectable target server

        formData.append(token, file);
        console.log('formData append', token, file.name);

        // TODO use data-meta-id
        link.find('.id').text(token);
        //link.find('.name').text(file.name);
        link.find('.name').remove();
        link.find('a').text(host + '/#/share/' + token + '/' + file.name); //encodeURIComponent(file.name));
        link.find('a').attr('href', fullhost + '/#/share/' + token + '/' + file.name); //encodeURIComponent(file.name));
        //link.find('progress')
      });

      // "global" upload queue
      sequence.then(function (next) {
        request.post('/files', {}, formData).when(function (err, ahr, data2) {
          data.forEach(function (token, k) {
            var file = files[k]
              , link = file.link
              ;

            // TODO
            link.find('progress').remove();
            /*
            link.find('progress').attr('max', file.size);
            link.find('progress').attr('value', file.size);
            link.find('progress').find('.max', file.size);
            link.find('progress').find('.val', file.size);
            */
            link.append('<button class=\'remove-file\'>X</button>');
          });
          next();
        });
      });
    });
  }

  function handleDrop(ev) {
    console.log('I think you might have dropped something...')
    
    ev.preventDefault();
    // handles both drop and file input change events
    var files = this.files || ev.dataTransfer && ev.dataTransfer.files
      , i
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
    }

    console.log(JSON.stringify(files));

    uploadMeta(files, meta);
  }


  // TODO move out to separate file
  //
  // Drop Area Widget
  //
  function preCalculatePos(elSelector) {
    var posObj
      ;

    posObj = $(elSelector).offset();
    posObj.right = posObj.left + posObj.width;
    posObj.bottom = posObj.top + posObj.height;

    return posObj;
  }

  function createDropAreaWidget(widgetRoot, dropEl, fileEl) {
    var parentPos
      , chooser
      ;

    function onMouseMove(ev) {
      chooser.css({ top: ev.pageY - 10, left: ev.pageX - 10 });
      var pos = chooser.offset();
      pos.right = pos.left + pos.width;
      // since a child is following us,
      // the mouseout event doesn't work as well as hoped
      if (
             (ev.pageX > parentPos.right)
          || (ev.pageY > parentPos.bottom)
          || (ev.pageY < parentPos.top)
          || (ev.pageX < parentPos.left)
         ) {
        //$('input').css({ top: (parentPos.top + parentPos.bottom) / 2, left: parentPos.left + 15 });
        // TODO put far out -1000, -1000
        chooser.css({ top: 10, left: 10 });
      }
      //console.log(ev.pageX, ev.pageY);
    }

    function onMouseLeave(ev) {
      chooser.css({ top: -1000, left: -1000 });
    }

    chooser = $(dropEl + ' ' + fileEl);
    parentPos = preCalculatePos(dropEl);

    $(widgetRoot).delegate(dropEl, 'dragover', handleDrag);
    $(widgetRoot).delegate(dropEl, 'drop', handleDrop);
    $(widgetRoot).delegate(dropEl, 'mousemove', onMouseMove);
    $(widgetRoot).delegate(dropEl, 'mouseleave', onMouseLeave);
  }
  // End Drop Area Widget


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

  function switchToShare() {
    if (!/\/share/.exec(location.hash)) {
      return;
    }

    var id = location.hash.split('/')[2]
      , name = location.hash.split('/')[3] || 'stream.bin'
      , url = location.protocol + '//' + location.host + '/files/' + id + '/' + name
      , type = 'application/octet-stream'
      ;

    $('a.dnd').attr('href', url);
    $('a.dnd').attr('data-downloadurl', type + ':' + decodeURIComponent(name) + ':' + url);
    $('.uiview').hide();
    $('#share.uiview').show();
  }

  function switchTabView() {
    var name = $(this).attr('href').substr(2)
      ;

    setTimeout(switchToShare, 10);

    // todo more robust url / hash checking
    if (name.length > 20) {
      return;
    }

    $('.uiview').hide();
    $('#' + name).show();
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


  function addHandlers() {
    var dropElPos = preCalculatePos('#dropzone')
      , browseElPos = preCalculatePos('#uploadzone')
      , startTab
      ; 

    linkTpl = $('ul#uploadlist').html()
    $('ul#uploadlist').html('')

    // TODO the chooser doesn't really belong in the
    // html It's not something a designer would style anyway
    // so this could be moved to a widget creator
    createDropAreaWidget('body', '#dropzone', 'input.filechooser');
    createDropAreaWidget('body', '#uploadzone', 'input.filechooser');
    $('body').delegate('.filechooser', 'change', handleDrop);
    

    $('body').delegate('.remove-file', 'click', onRemoveFile);
    $('body').delegate('.tabs a', 'click', switchTabView);
    $('body').delegate('a.dnd', 'dragstart', onDragOut);
    $('.uiview').hide();

    // TODO use hashchange event as to not break back/forward
    startTab = location.hash.substr(2) || 'drop';
    $('a[href="#/' + startTab + '"]').click();
    switchToShare();
  }




  $.domReady(addHandlers);

}());
