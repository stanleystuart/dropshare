(function () {
  "use strict";

  //
  // Drop Area Widget
  //
  function preCalculatePos(elSelector) {
    var posObj
      ;

    posObj = $(elSelector).offset();
    posObj.right = posObj.left + posObj.width;
    posObj.bottom = posObj.top + (posObj.height);

    return posObj;
  }

  function handleDrag(ev) {
    console.log('handledrag');
    //ev.stopPropagation();
    ev.preventDefault();
  }

  function NewDropAreaWidget(callback, widgetRoot, dropEl) {
    var parentPos
      , chooser
      , chooserClass
      ;

    function handleFileSelectOrDrop(ev) {
      ev.preventDefault();

      var files = this.files || ev.dataTransfer && ev.dataTransfer.files
        ;

      callback.call(this, files, ev);
    }

    function onMouseMove(ev) {
      // For some reason it is MUCH faster to render this input as a child
      // However, as moving-target-child it never "onMouseLeave"s
      if (
             (ev.pageX > parentPos.right)
          || (ev.pageY > parentPos.bottom)
          || (ev.pageY < parentPos.top)
          || (ev.pageX < parentPos.left)
         ) {
        // TODO this is about 20 pixels off on the top in webkit
        // fine in firefox

        onMouseLeave(ev);
        return;
      }

      chooser.css({ top: ev.pageY - 10, left: ev.pageX - 10 });
    }

    function onMouseLeave(ev) {
      chooser.css({ top: -1000, left: -1000 });
    }

    chooserClass = 'updrop-file-chooser';
    // These values were copied from min.us
    // and seem to work well for both firefox
    // and webkit
    // TODO separate style without sacrificing convenience
    chooser = $('<input'
      + ' type="file"'
      + ' class="' + chooserClass + '"'
      + ' multiple="multiple"'
      + ' style="'
        + ' position: absolute;'
        + ' opacity: 0;'
        + ' top: -1000px;'
        + ' left: -1000px;'
        + ' z-index: 1000000;'
        + ' margin: -10px 0pt 0pt -179px;'
        + ' height: 30px;'
        + ' margin: -10px 0pt 0pt -179px;'
        + ' cursor: pointer;'
      + '"'
      + ' >')
      ;

    $(dropEl).append(chooser);

    parentPos = preCalculatePos(dropEl);

    $(widgetRoot).delegate(dropEl + ' input.' + chooserClass, 'change', handleFileSelectOrDrop);
    $(widgetRoot).delegate(dropEl, 'dragover', handleDrag);
    $(widgetRoot).delegate(dropEl, 'drop', handleFileSelectOrDrop);
    $(widgetRoot).delegate(dropEl, 'mousemove', onMouseMove);
    $(widgetRoot).delegate(dropEl, 'mouseleave', onMouseLeave);
  }

  module.exports.create = NewDropAreaWidget;
}());
