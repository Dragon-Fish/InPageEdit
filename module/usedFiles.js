/**
 * TBD
 */

for (let i = 0; i < images.length; i++) {
  imageName = images[i]
  $('<li>')
    .append(
      $('<a>', {
        href: mw.util.getUrl('File:' + imageName),
        target: '_balnk',
        text: imageName,
      }),
      ' (',
      $('<a>', {
        href: 'javascript:;',
        class: 'quickViewImage',
        text: _msg('editor-detail-images-quickview'),
        'data-image-name': imageName,
      }),
      ' | ',
      $('<a>', {
        href:
          config.wgScript +
          '?title=Special:Upload&wpDestFile=' +
          imageName +
          '&wpForReUpload=1',
        target: '_balnk',
        text: _msg('editor-detail-images-upload'),
      }),
      ')'
    )
    .appendTo(content)
}
ssi_modal.show({
  className: 'in-page-edit quick-edit-detail',
  sizeClass: 'dialog',
  title: _msg('editor-detail-title-images'),
  content,
})
$('.in-page-edit.quick-edit-detail .quickViewImage').click(function () {
  _analysis('quick_edit_pagedetail_view_image')
  var $this = $(this)
  var imageName = $this.attr('data-image-name')
  ssi_modal.show({
    className: 'in-page-edit quick-view-image',
    center: true,
    title: imageName.replace(/_/g, ' '),
    content: $('<center>', { id: 'imageLayer' }).append($progress),
    buttons: [
      {
        label: _msg('editor-detail-images-upload'),
        className: 'btn btn-primary',
        method() {
          window.open(
            config.wgScript +
              '?title=Special:Upload&wpDestFile=' +
              imageName +
              '&wpForReUpload=1'
          )
        },
      },
      {
        label: _msg('close'),
        className: 'btn btn-secondary',
        method(a, modal) {
          modal.close()
        },
      },
    ],
    onShow() {
      mwApi
        .get({
          action: 'query',
          format: 'json',
          prop: 'imageinfo',
          titles: 'File:' + imageName.replace(/file:/g, ''),
          iiprop: 'url',
        })
        .done(function (data) {
          $('.quick-view-image .ipe-progress').hide()
          $('.quick-view-image #imageLayer').append(
            $('<img>', {
              src: data.query.pages['-1'].imageinfo[0].url,
              class: 'loading',
              style: 'max-width: 80%; max-height: 60vh',
            })
          )
          $('.quick-view-image #imageLayer img').load(function () {
            $(this).removeClass('loading')
          })
        })
    },
  })
})
