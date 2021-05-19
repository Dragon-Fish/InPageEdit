const { _msg } = require('./_msg')
const { $br } = require('./_elements')

/**
 * @module findAndReplace 查找替换模块
 * @param {element} element Textarea
 */
function findAndReplace(element) {
  if (element === undefined)
    element = $('.in-page-edit.ipe-editor:last .editArea')
  var origin = element.val()

  ssi_modal.show({
    className: 'in-page-edit',
    sizeClass: 'dialog',
    center: true,
    outSideClose: false,
    // position: 'right bottom',
    title: _msg('fAndR-title'),
    content: $('<div>', { class: 'module far-module' }).append(
      $('<div>', { class: 'module_content', id: 'findfielddiv' }).append(
        $('<section>').append(
          $('<h4>', { text: _msg('fAndR-find-text') }),
          $('<textarea>', { id: 'find_this', style: 'margin: 0', rows: 4 }),
          $('<h4>', { text: _msg('fAndR-replace-text') }),
          $('<textarea>', { id: 'replace_with', style: 'margin: 0', rows: 4 })
        ),
        $('<section>', { style: 'padding: 7px 0' }).append(
          $('<label>').append(
            $('<input>', { type: 'checkbox', id: 'globl', checked: '' }),
            $('<span>', { text: _msg('fAndR-globl') })
          ),
          $br,
          $('<label>').append(
            $('<input>', { type: 'checkbox', id: 'case_sen' }),
            $('<span>', { text: _msg('fAndR-case-sen') })
          ),
          $br,
          $('<label>').append(
            $('<input>', { type: 'checkbox', id: 'regex_search' }),
            $('<span>', { text: _msg('fAndR-enable-regex') })
          )
        )
      )
    ),
    buttons: [
      {
        label: _msg('fAndR-button-undo'),
        className: 'btn btn-danger',
        method() {
          element.val(origin)
          ssi_modal.notify('info', {
            className: 'in-page-edit',
            title: _msg('notify-info'),
            content: _msg('notify-fAndR-undo'),
          })
          // modal.close();
        },
      },
      {
        className: 'btn btn-primary',
        label: _msg('fAndR-button-replace'),
        method() {
          /**
           * 查找替换主函数
           * 借鉴：https://dev.fandom.com/wiki/MediaWiki:FindAndReplace/code.js
           **/
          if ($('#find_this').val() === '') return
          var searchfor = '',
            searchexp,
            $textarea = element,
            replacewith = $('#replace_with').val().replace(/\r/gi, ''),
            text = $textarea.val().replace(/\r/gi, ''),
            flagg = 'g',
            flagi = 'i',
            enableregex = 0

          if ($('#globl').prop('checked') === false) {
            flagg = ''
          }
          if ($('#case_sen').prop('checked') === true) {
            flagi = ''
          }
          if ($('#regex_search').prop('checked') === true) {
            enableregex = 1
          }
          var flags = flagg + flagi + 'm'
          if (enableregex === 1) {
            searchfor = $('#find_this').val()
          } else {
            searchfor = $('#find_this')
              .val()
              .replace(/\r/gi, '')
              .replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1')
          }
          searchexp = new RegExp(searchfor, flags)
          var rcount = 0
          var matched = text.match(searchexp)
          if (matched !== null) {
            rcount = matched.length
          }
          text = text.replace(searchexp, replacewith)
          $textarea.val(text)
          ssi_modal.notify('success', {
            className: 'in-page-edit',
            title: _msg('notify-success'),
            content: _msg('notify-fAndR-done', rcount),
          })
          // modal.close();
        },
      },
    ],
  })
}

module.exports = {
  findAndReplace,
}
