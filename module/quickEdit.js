const { apiGet, apiPost, apiPostWithToken } = require('../util/mwApi')
const { config } = require('../util/mediawiki')

const { _analysis } = require('./_analysis')
const { _msg } = require('./_msg')
const { _hasRight } = require('./_hasRight')

const { $br, $progress } = require('./_elements')

const { findAndReplace } = require('./findAndReplace')
const { preference } = require('./preference')
const { progress } = require('./progress')
const { quickPreview } = require('./quickPreview')
const { quickDiff } = require('./quickDiff')

function quickEdit(options) {
  _analysis('quick_edit')
  // 合并选项
  if (typeof options === 'string') {
    options = {
      page: options || config.wgPageName,
    }
  }
  options = {
    page: config.wgPageName,
    pageId: -1,
    revision: null,
    section: null,
    editMinor: false,
    editSummary: _msg('preference-summary-default'),
    editNotice: [],
    outSideClose: true,
    jumpTo: '',
    reload: true,
    ...options,
    ...preference.get(),
  }
  options.page = decodeURI(options.page) // 解码网址 Unicode

  const info = {
    jsonGet: {
      action: 'parse',
      page: options.page || config.wgPageName,
      prop: 'wikitext|langlinks|categories|templates|images|sections',
      format: 'json',
    },
    jsonPost: {},
    pageDetail: {},
  }

  // 标题
  const $editPage = $('<u>', {
    class: 'editPage',
    text: options.page.replace(/_/g, ' '),
  })
  const $modalTitle = $('<span>').append(
    _msg('editor-title-editing') + ': ',
    $editPage
  )

  // 内容
  const $editTools = $('<div>', { class: 'editTools' }).append(
    $('<div>', { class: 'btnGroup' }).append(
      $('<div>', { class: 'toolSelect' }).append(
        $('<div>', { class: 'label', text: _msg('editor-edittool-header') }),
        $('<ul>', { class: 'ul-list' }).append(
          $('<li>', {
            class: 'editToolBtn',
            'data-open': '\n== ',
            'data-middle': _msg('editor-edittool-header-text'),
            'data-close': ' ==\n',
            text: 'H2',
          }),
          $('<li>', {
            class: 'editToolBtn',
            'data-open': '\n=== ',
            'data-middle': _msg('editor-edittool-header-text'),
            'data-close': ' ===\n',
            text: 'H3',
          }),
          $('<li>', {
            class: 'editToolBtn',
            'data-open': '\n==== ',
            'data-middle': _msg('editor-edittool-header-text'),
            'data-close': ' ====\n',
            text: 'H4',
          }),
          $('<li>', {
            class: 'editToolBtn',
            'data-open': '\n===== ',
            'data-middle': _msg('editor-edittool-header-text'),
            'data-close': ' =====\n',
            text: 'H5',
          })
        )
      )
    ),
    $('<div>', { class: 'btnGroup' }).append(
      $('<span>', { class: 'label', text: '格式' }),
      $('<button>', {
        class: 'editToolBtn fa fa-bold btn',
        'data-open': "'''",
        'data-middle': _msg('editor-edittool-bold'),
        'data-close': "'''",
      }),
      $('<button>', {
        class: 'editToolBtn fa fa-italic btn',
        'data-open': "''",
        'data-middle': _msg('editor-edittool-italic'),
        'data-close': "''",
      }),
      $('<button>', {
        class: 'editToolBtn fa fa-list-ul btn',
        'data-open': '\n* ',
        'data-middle': _msg('editor-edittool-list-bulleted'),
        'data-close': '\n',
      }),
      $('<button>', {
        class: 'editToolBtn fa fa-list-ol btn',
        'data-open': '\n# ',
        'data-middle': _msg('editor-edittool-list-numbered'),
        'data-close': '\n',
      }),
      $('<button>', {
        class: 'editToolBtn fa fa-won btn',
        'data-open': '<' + 'nowiki>',
        'data-middle': _msg('editor-edittool-nowiki'),
        'data-close': '</nowiki>',
      }),
      $('<button>', {
        class: 'editToolBtn fa fa-level-down fa-rotate-90 btn',
        'data-open': '<br>\n',
        'data-middle': '',
        'data-close': '',
      })
    ),
    $('<div>', { class: 'btnGroup' }).append(
      $('<span>', { class: 'label', text: '插入' }),
      $('<button>', {
        class: 'editToolBtn fa fa-link btn',
        'data-open': '[' + '[',
        'data-middle': _msg('editor-edittool-internal-link'),
        'data-close': ']]',
      }),
      $('<button>', {
        class: 'editToolBtn fa fa-file-image-o btn',
        'data-open': '[' + '[File:',
        'data-middle': 'Example.png',
        'data-close': '|thumb]]',
      }),
      $('<button>', {
        class: 'editToolBtn btn',
        'data-open': '\n<' + 'gallery>\n',
        'data-middle': 'Example1.jpg|Description\nExample2.png|Description',
        'data-close': '\n</gallery>\n',
        html:
          '<span class="fa-stack"><i class="fa fa-picture-o fa-stack-1x"></i><i class="fa fa-picture-o fa-stack-1x" style="left: 2px;top: 2px;text-shadow: 1px 1px 0 #fff;"></i></span>',
      })
    ),
    $('<div>', { class: 'btnGroup extra', style: 'display: none' }).append(
      $('<span>', { class: 'label', text: '自定义' })
    ),
    $('<div>', {
      class: 'btnGroup special-tools',
      style: 'float: right',
    }).append(
      $('<button>', { class: 'btn fa fa-search' }).click(function () {
        findAndReplace($editArea)
      })
    )
  )
  const $editArea = $('<textarea>', {
    class: 'editArea',
    style: 'margin-top: 0;',
  })
  const $optionsLabel = $('<div>', {
    class: 'editOptionsLabel hideBeforeLoaded',
  }).append(
    // $('<aside>', { class: 'detailArea' }).append(
    //   $('<label>', {
    //     class: 'detailToggle',
    //     text: _msg('editor-detail-button-toggle'),
    //   }),
    //   $('<div>', { class: 'detailBtnGroup' }).append(
    //     $('<a>', {
    //       href: 'javascript:;',
    //       class: 'detailBtn',
    //       id: 'showTemplates',
    //       text: _msg('editor-detail-button-templates'),
    //     }),
    //     ' | ',
    //     $('<a>', {
    //       href: 'javascript:;',
    //       class: 'detailBtn',
    //       id: 'showImages',
    //       text: _msg('editor-detail-button-images'),
    //     })
    //   )
    // ),
    // 摘要&小编辑
    $('<label>', { for: 'editSummary', text: _msg('editSummary') }),
    $br,
    $('<input>', {
      class: 'editSummary',
      id: 'editSummary',
      placeholder: 'Edit via InPageEdit~',
      value: options.editSummary.replace(/\$oldid/gi, options.summaryRevision),
    }),
    $br,
    $('<label>').append(
      $('<input>', {
        type: 'checkbox',
        class: 'editMinor',
        id: 'editMinor',
        checked: options.editMinor,
      }),
      $('<span>', { text: _msg('markAsMinor') })
    ),
    $br,
    $('<label>').append(
      $('<input>', {
        type: 'checkbox',
        class: 'reloadPage',
        id: 'reloadPage',
        checked: options.reload,
      }),
      $('<span>', { text: _msg('editor-reload-page') })
    )
  )
  const $modalContent = $('<div>').append(
    $progress,
    $('<section>', { class: 'hideBeforeLoaded' }).append(
      // 编辑工具条
      $editTools,
      // 编辑框
      $editArea
    )
  )

  // 创建模态框
  const modal = ssi_modal.createObject()
  // 初始化
  modal.init()
  // 配置
  modal.setTitle($modalTitle)
  modal.setContent($modalContent)
  modal.setOptions('className', 'in-page-edit ipe-editor')
  modal.setOptions('sizeClass', 'large')
  // 按钮
  modal.setButtons([
    {
      side: 'left',
      label: _msg('editor-button-save'),
      className: 'btn btn-primary leftBtn hideBeforeLoaded save-btn',
      method(e, modal) {
        ssi_modal.confirm(
          {
            className: 'in-page-edit',
            center: true,
            content: _msg('editor-confirm-save'),
            okBtn: {
              className: 'btn btn-primary',
              label: _msg('confirm'),
            },
            cancelBtn: {
              className: 'btn btn-secondary',
              label: _msg('cancel'),
            },
          },
          function (result) {
            if (result) {
              var text = $editArea.val(),
                minor = $optionsLabel.find('.editMinor').prop('checked'),
                section = options.section,
                summary = $optionsLabel.find('.editSummary').val()
              postArticle(
                {
                  text: text,
                  page: options.page,
                  minor: minor,
                  section: section,
                  summary: summary,
                },
                modal
              )
            }
          }
        )
      },
    },
    {
      side: 'left',
      label: _msg('editor-button-preview'),
      className: 'btn btn-secondary leftBtn hideBeforeLoaded',
      method() {
        _analysis('preview_edit')
        var text = $editArea.val()
        quickPreview({
          title: options.page,
          text: text,
          pst: true,
        })
      },
    },
    {
      side: 'left',
      label: _msg('editor-button-diff'),
      className: 'btn btn-secondary leftBtn hideBeforeLoaded diff-btn',
    },
    {
      label: _msg('cancel'),
      className: 'btn btn-danger',
      method(e, modal) {
        modal.close()
      },
    },
  ])
  // 防止误关闭
  modal.setOptions('outSideClose', false)
  modal.setOptions('beforeClose', function () {
    if ($editArea.attr('data-modifiled') !== 'true') {
      close()
      return
    } else if ($editArea.attr('data-confirmclose') === 'true') {
      closeNoReload()
      return
    }
    ssi_modal.confirm(
      {
        className: 'in-page-edit',
        center: true,
        content: _msg('editor-leave-confirm'),
        okBtn: {
          className: 'btn btn-danger',
          label: _msg('confirm'),
        },
        cancelBtn: {
          className: 'btn btn-secondary',
          label: _msg('cancel'),
        },
      },
      function (result) {
        if (result === true) {
          close()
        }
      }
    )
    function close() {
      $(window).unbind('beforeunload')
      modal.options.keepContent = false
      modal.options.beforeClose = ''
      modal.close()
      ssi_modal.notify('info', {
        className: 'in-page-edit',
        position: 'right top',
        title: _msg('cancel'),
        content: _msg('notify-no-change'),
      })
    }
    function closeNoReload() {
      $(window).unbind('beforeunload')
      modal.options.keepContent = false
      modal.options.beforeClose = ''
      modal.close()
    }
    return false
  })

  // 走你！
  modal.show()
}

// 发布编辑模块
function postArticle(
  { text, page, minor, summary, section, basetimestamp, starttimestamp },
  modal
) {
  _analysis('quick_edit_save')
  const progress = progress(_msg('editor-title-saving'))
  const jsonPost = {
    action: 'edit',
    basetimestamp,
    starttimestamp,
    text,
    title: page,
    minor,
    summary,
    errorformat: 'plaintext',
  }
  if (section !== undefined && section !== '' && section !== null) {
    jsonPost.section = section
    delete jsonPost.basetimestamp
  }

  apiPostWithToken('csrf', jsonPost).done(saveSuccess).fail(saveError)

  // 保存正常
  function saveSuccess(data, feedback, errorThrown) {
    if (data.edit.result === 'Success') {
      progress(true)
      // 是否重载页面
      if ($optionsLabel.find('.reloadPage').prop('checked')) {
        var content
        $(window).unbind('beforeunload')
        content = _msg('notify-save-success')
        setTimeout(function () {
          if (page === config.wgPageName) {
            window.location = mw.util.getUrl(page) + options.jumpTo
            window.location.reload()
          } else {
            window.location.reload()
          }
        }, 500)
      } else {
        console.info('[InPageEdit] 将不会重载页面！')
        content = _msg('notify-save-success-noreload')
        setTimeout(function () {
          progress(false)
          $editArea.attr('data-confirmclose', 'true')
          modal.close()
        }, 1500)
      }

      ssi_modal.notify('success', {
        className: 'in-page-edit',
        position: 'right top',
        title: _msg('notify-success'),
        content,
      })
    } else {
      saveError(data, feedback, errorThrown)
    }
  }

  // 保存失败
  function saveError(errorCode, feedback, errorThrown) {
    progress(false)
    var data = errorThrown || errorCode // 规范错误代码
    var errorInfo,
      errorMore = ''
    if (data.errors !== undefined) {
      errorCode = data.errors[0].code
      errorInfo = data.errors[0]['*']
      errorMore = ''
    } else if (data.edit.result !== 'Success') {
      errorCode = data.edit.code || 'Unknown'
      errorInfo = data.edit.info || 'Reason unknown.'
      errorMore = data.edit.warning || ''
    } else {
      errorCode = 'unknown'
      errorInfo = 'Reason unknown.'
      errorMore = 'Please contact plug-in author or try again.'
    }
    ssi_modal.show({
      className: 'in-page-edit',
      sizeClass: 'dialog',
      center: true,
      title: _msg('editor-save-error'),
      content: errorInfo + '<hr style="clear: both" />' + errorMore,
    })
    ssi_modal.notify('error', {
      className: 'in-page-edit',
      position: 'right top',
      closeAfter: {
        time: 15,
      },
      title: _msg('notify-error'),
      content: _msg('editor-save-error') + '：<code>' + errorCode + '</code>',
    })

    console.error('[InPageEdit] Submit failed: \nCode: ' + errorCode)
    return
  }
}

module.exports = {
  quickEdit,
}