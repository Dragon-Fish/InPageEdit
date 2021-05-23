const { _msg } = require('./_msg');

const { $progress } = require('./_elements.js');

/**
 * @module progress 载入中模块
 * @param {Boolean|String} title
 * @default "Loading..."
 * @returns
 * - true: Mark top progress box as done
 * - false: Close top progress box
 * - String: Show new progress box with title
 */
var progress = function (title) {
  if (title === true) {
    $('.in-page-edit.loadingbox .ssi-modalTitle').html(_msg('done'));
    $('.in-page-edit.loadingbox .ipe-progress').addClass('done');
  } else if (title === false) {
    if ($('.in-page-edit.loadingbox').length > 0) {
      $('.in-page-edit.loadingbox').appendTo('body');
      ssi_modal.close();
    }
  } else {
    if ($('.in-page-edit.loadingbox').length > 0) return;
    if (typeof title === 'undefined') {
      title = 'Loading...'
    }
    ssi_modal.show({
      title: title,
      content: $progress,
      className: 'in-page-edit loadingbox',
      center: true,
      sizeClass: 'dialog',
      closeIcon: false,
      outSideClose: false
    });
  }
}

module.exports = {
  progress
}