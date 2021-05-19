var mwApi = new mw.Api()
var config = mw.config.get()
const { _analysis } = require('./_analysis')
const { _msg } = require('./_msg')
const { _hasRight } = require('./_hasRight')
const { $br } = require('./_elements')

/**
 * @module quickDelete 删除页面模块
 * @param {String} page
 */
var quickDelete = function (page, givenReason = '') {
  mw.hook('InPageEdit.quickDelete').fire()
  console.log('Quick delete', page, givenReason)
  var reason
  page = page || config.wgPageName

  ssi_modal.show({
    outSideClose: false,
    className: 'in-page-edit quick-delete',
    center: true,
    sizeClass: 'dialog',
    title: _msg('delete-title'),
    content: $('<div>').append(
      $('<section>', { id: 'InPageEditDeletepage' }).append(
        $('<span>', {
          html: _msg('delete-reason', '<b>' + page.replace(/_/g, ' ') + '</b>'),
        }),
        $br,
        $('<label>', { for: 'delete-reason', text: _msg('editSummary') }),
        $('<input>', {
          id: 'delete-reason',
          style: 'width:96%',
          onclick: "$(this).css('box-shadow', '')",
          value: givenReason,
        })
      )
    ),
    beforeShow: function () {
      if (!_hasRight('delete')) {
        ssi_modal.dialog({
          title: _msg('notify-no-right'),
          content: _msg('delete-no-right'),
          className: 'in-page-edit quick-deletepage',
          center: true,
          okBtn: {
            className: 'btn btn-primary btn-single',
          },
        })
        return false
      }
    },
    buttons: [
      {
        label: _msg('cancel'),
        className: 'btn btn-primary',
        method: function (e, modal) {
          modal.close()
        },
      },
      {
        label: _msg('confirm'),
        className: 'btn btn-danger',
        method: function (e, modal) {
          reason = $('#InPageEditDeletepage #delete-reason').val()
          if (reason === '') {
            $('#InPageEditDeletepage #delete-reason').css(
              'box-shadow',
              '0 0 4px #f00'
            )
            return
          }
          _analysis('quick_delete')

          ssi_modal.confirm(
            {
              center: true,
              className: 'in-page-edit',
              title: _msg('delete-confirm-title'),
              content: _msg('delete-confirm-content'),
              okBtn: {
                label: _msg('confirm'),
                className: 'btn btn-danger',
              },
              cancelBtn: {
                label: _msg('cancel'),
                className: 'btn',
              },
            },
            function (result) {
              if (result) {
                reason = _msg('delete-title') + ' (' + reason + ')'
                mwApi
                  .postWithToken('csrf', {
                    action: 'delete',
                    title: page,
                    reason: reason,
                    format: 'json',
                  })
                  .then(() => {
                    ssi_modal.notify('success', {
                      className: 'in-page-edit',
                      title: _msg('notify-success'),
                      content: _msg('notify-delete-success', page),
                    })
                  })
                  .fail(function (errorCode, feedback, errorThrown) {
                    ssi_modal.notify('error', {
                      className: 'in-page-edit',
                      title: _msg('notify-error'),
                      content:
                        _msg('notify-delete-error') +
                        ': <br/><span style="font-size:amall">' +
                        errorThrown.error['*'] +
                        '(<code>' +
                        errorThrown.error['code'] +
                        '</code>)</span>',
                    })
                  })
                modal.close()
              } else {
                return false
              }
            }
          )
        },
      },
    ],
  })
}

module.exports = {
  quickDelete,
}
