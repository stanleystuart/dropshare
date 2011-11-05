(function () {
  "use strict";

  console.log('Hello from DropShare!');

  var $ = require('ender')
    ;

  function handleDrag(ev) {
    console.log('handledrag');
    //ev.stopPropagation();
    ev.preventDefault();
  }

  function handleDrop(ev) {
    console.log('I think you might have dropped something...')
    
    //ev.stopPropagation();
    ev.preventDefault();
    var files = ev.dataTransfer.files
      , i
      ;

    if (!files) {
      console.log('... looks like litter to me.');
      return;
    }

    for (i = 0; i < files.length; i += 1) {
      console.log(files[i]);
    }
  }

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
      $('input').css({ top: 10, left: 10 });
    }
    //console.log(ev.pageX, ev.pageY);
  }

  function onMouseLeave(ev) {
    $('input').css({ top: -1000, left: -1000 });
  }

  var parentPos 
    , chooser
    ;

  function addHandlers() {
    console.log('adding handlers');
    
    $('input').css({'position': 'absolute'});

    parentPos = $('#dropzone').offset();
    chooser = $('input[type=file]');
    parentPos.right = parentPos.left + parentPos.width;
    parentPos.bottom = parentPos.top + parentPos.height;

    $('body').delegate('#dropzone', 'dragover', handleDrag);
    $('body').delegate('#dropzone', 'drop', handleDrop);
    $('body').delegate('#dropzone', 'mousemove', function () { onMouseMove.apply(this, arguments) });
    $('body').delegate('#dropzone', 'mouseleave', function () { onMouseLeave.apply(this, arguments) });
  }




  $.domReady(addHandlers);

}());
