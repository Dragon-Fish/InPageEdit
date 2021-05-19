const { _msg } = require('./_msg')
const { $progress } = require('./_elements')

var mwApi = new mw.Api()

/**
 * @module quickPreview 快速预览文章页
 * @param params {Object}
 */
var quickPreview = function (params, modalSize = 'large', center = false) {
  var defaultOptions = {
    action: 'parse',
    preview: true,
    disableeditsection: true,
    prop: 'text',
    format: 'json',
  }
  var options = $.extend({}, defaultOptions, params)
  mw.hook('InPageEdit.quickPreview').fire()
  var timestamp = new Date().getTime()
  console.time('[InPageEdit] Request preview')
  ssi_modal.show({
    sizeClass: new RegExp(
      /dialog|small|smallToMedium|medium|mediumToLarge|large|full|auto/
    ).test(modalSize)
      ? modalSize
      : 'large',
    center: Boolean(center),
    className: 'in-page-edit previewbox',
    title: _msg('preview-title'),
    content: $('<section>').append(
      $progress,
      $('<div>', {
        class: 'InPageEditPreview',
        'data-timestamp': timestamp,
        style: 'display:none',
        text: _msg('preview-placeholder'),
      })
    ),
    fixedHeight: true,
    fitScreen: true,
    buttons: [{ label: '', className: 'hideThisBtn' }],
    onShow() {
      $('.previewbox .ipe-progress').css(
        'margin-top',
        $('.previewbox .ipe-progress').parent().height() / 2
      )
      $('.previewbox .hideThisBtn').hide()
      mwApi
        .post(options)
        .then(function (data) {
          console.timeEnd('[InPageEdit] Request preview')
          var content = data.parse.text['*']
          $('.previewbox .ipe-progress').hide(150)
          $('.InPageEditPreview[data-timestamp="' + timestamp + '"]')
            .fadeIn(500)
            .html(content)
        })
        .fail(function () {
          console.timeEnd('[InPageEdit] Request preview')
          console.warn('[InPageEdit] 预览失败')
          $('.previewbox .ipe-progress').hide(150)
          $('.InPageEditPreview[data-timestamp="' + timestamp + '"]')
            .fadeIn(500)
            .html(_msg('preview-error'))
        })
    },
  })
}

module.exports = {
  quickPreview,
}
