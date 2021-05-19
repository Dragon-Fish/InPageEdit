var mwApi = new mw.Api()
var config = mw.config.get()

const { _analysis } = require('./_analysis')
const { _msg } = require('./_msg')
const { $br, $progress } = require('./_elements')

const { _resolveExists } = require('./_resolveExists')
const { preference } = require('./preference')

/**
 * @module quickRedirect 快速重定向模块
 * @param {'from'|'to'} type
 */
var quickRedirect = function (type = 'to') {
  mw.hook('InPageEdit.quickRedirect').fire()
  var text = '#REDIRECT [[:$1]]',
    question,
    target,
    json = {
      action: 'edit',
      createonly: 1,
      minor: preference.get('editMinor'),
      format: 'json',
      errorformat: 'plaintext',
    },
    summary

  if (type === 'to') {
    json.title = config.wgPageName
    question = _msg(
      'redirect-question-to',
      '<b>' + config.wgPageName.replace(/_/g, ' ') + '</b>'
    )
  } else if (type === 'from') {
    question = _msg(
      'redirect-question-from',
      '<b>' + config.wgPageName.replace(/_/g, ' ') + '</b>'
    )
    summary = _msg('redirect-summary') + ' → [[:' + config.wgPageName + ']]'
    json.text = text.replace('$1', config.wgPageName)
  } else {
    console.error('[InPageEdit] quickRedirect only accept "from" or "to"')
    return
  }

  ssi_modal.show({
    outSideClose: false,
    className: 'in-page-edit quick-redirect',
    center: true,
    sizeClass: 'dialog',
    title: _msg('redirect-title'),
    content: $('<div>').append(
      $('<section>').append(
        $('<span>', { html: question }),
        $br,
        $('<input>', { id: 'redirect-page', style: 'width:96%' }).click(
          function () {
            $(this).css('box-shadow', '')
          }
        ),
        $br,
        $('<label>', { for: 'redirect-reason', text: _msg('editSummary') }),
        $('<input>', { id: 'redirect-reason', style: 'width:96%' })
      ),
      $($progress).css('display', 'none')
    ),
    buttons: [
      {
        label: _msg('confirm'),
        className: 'btn btn-primary btn-single okBtn',
        method: function (a, modal) {
          target = $('.in-page-edit.quick-redirect #redirect-page').val()
          if (
            target === '' ||
            target.replace(/_/g, ' ') === config.wgPageName.replace(/_/g, ' ')
          ) {
            $('.in-page-edit.quick-redirect #redirect-page').css(
              'box-shadow',
              '0 0 4px #f00'
            )
            return
          }

          _analysis('quick_redirect')

          if (type === 'to') {
            summary = _msg('redirect-summary') + ' → [[:' + target + ']]'
            json.text = text.replace('$1', target)
          } else if (type === 'from') {
            json.title = target
          }
          if ($('.in-page-edit.quick-redirect #redirect-reason').val() !== '') {
            summary =
              summary +
              ' (' +
              $('.in-page-edit.quick-redirect #redirect-reason').val() +
              ')'
          }
          json.summary = summary

          $('.in-page-edit.quick-redirect .ipe-progress').show()
          $('.in-page-edit.quick-redirect section').hide()
          $('.in-page-edit.quick-redirect .okBtn').attr('disabled', 'disabled')

          mwApi.postWithToken('csrf', json).done(successed).fail(failed)
          // 重定向成功
          function successed(data) {
            if (data.errors) {
              failed(data.errors[0].code, data)
              return
            }
            $('.in-page-edit.quick-redirect .ipe-progress').addClass('done')
            ssi_modal.notify('success', {
              className: 'in-page-edit',
              content: _msg('notify-redirect-success'),
              title: _msg('notify-success'),
            })
            if (type === 'to') {
              window.location.reload()
            } else {
              $('.in-page-edit.quick-redirect .ipe-progress').addClass('done')
              setTimeout(function () {
                modal.close()
              }, 2000)
            }
          }
          // 重定向失败
          function failed(errorCode, errorThrown) {
            $('.in-page-edit.quick-redirect .ipe-progress').hide()
            $('.in-page-edit.quick-redirect section').show()
            $('.in-page-edit.quick-redirect .okBtn').attr('disabled', false)
            $('.in-page-edit.quick-redirect .ipe-progress').addClass('done')
            ssi_modal.notify('error', {
              className: 'in-page-edit',
              content:
                _msg('notify-redirect-error') +
                '<br>' +
                errorThrown.errors[0]['*'] +
                ' (<code>' +
                errorCode +
                '</code>)',
              title: _msg('notify-error'),
            })
            // 如果是由于页面存在，给出解决方案
            if (errorCode === 'articleexists') {
              var fromPage, toPage
              if (type === 'from') {
                fromPage = target
                toPage = config.wgPageName
              } else if (type === 'to') {
                fromPage = config.wgPageName
                toPage = target
              }
              _resolveExists(fromPage, {
                delete: 'Delete for redirect to [[' + toPage + ']]',
                edit: 'Modify for redirect',
              })
            }
          }
        },
      },
    ],
  })
}

module.exports = {
  quickRedirect,
}
