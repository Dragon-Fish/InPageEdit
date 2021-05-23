var mwApi = new mw.Api();
var config = mw.config.get();

const { _analysis } = require('./_analysis');
const { _msg } = require('./_msg');
const { _hasRight } = require('./_hasRight');

const { $br, $progress } = require('./_elements');

const { findAndReplace } = require('./findAndReplace');
const { preference } = require('./preference');
const { progress } = require('./progress')
const { quickPreview } = require('./quickPreview');
const { quickDiff } = require('./quickDiff');

/**
 * @module quickEdit 快速编辑模块
 * 
 * @param {Object} options
 * @param {String} options.page edit page (default: wgPageName)
 * @param {Number} options.revision page rev ID
 * @param {Number} options.section edit section
 * @param {Boolean} options.reload if reload page after save successful (default: true)
 */
var quickEdit = function (options) {
  /** 获取设定信息，设置缺省值 **/
  options = options || {};
  if (typeof options === 'string') {
    options = {
      page: options || config.wgPageName
    }
  }
  var defaultOptions = {
    page: config.wgPageName,
    pageId: -1,
    revision: null,
    summaryRevision: '',
    section: null,
    editText: '',
    editMinor: false,
    editSummary: _msg('preference-summary-default'),
    editNotice: '',
    outSideClose: true,
    jsonGet: {
      action: 'parse',
      page: options.page || config.wgPageName,
      prop: 'wikitext|langlinks|categories|templates|images|sections',
      format: 'json'
    },
    jsonPost: {},
    pageDetail: {},
    jumpTo: '',
    reload: true
  }

  /** 获取用户设置 **/
  var userPreference = preference.get();

  /** 缓存时间戳 **/
  var date = new Date(),
    timestamp = date.getTime(),
    now = date.toUTCString();

  /** 将选项合并并标准化 **/
  options = $.extend({}, defaultOptions, options, userPreference);
  options.page = decodeURI(options.page); // 解码网址 Unicode

  _analysis('quick_edit');

  if (options.revision && options.revision !== config.wgCurRevisionId) {
    ssi_modal.notify('warning', {
      className: 'in-page-edit',
      content: _msg('notify-editing-history'),
      title: _msg('notify-info')
    });
    delete options.jsonGet.page;
    options.jsonGet.oldid = options.revision;
    options.summaryRevision = '(' + _msg('editor-summary-rivision') + '[[Special:Diff/' + options.revision + ']])';
  }
  if (options.section) {
    options.jsonGet.section = options.section;
  }

  // 模态框内部
  var $modalTitle = $('<span>').append(
    _msg('editor-title-editing') + ': <u class="editPage">' + options.page.replace(/_/g, ' ') + '</u>'
  );
  var $editTools = $('<div>', { class: 'editTools' }).append(
    $('<div>', { class: 'btnGroup' }).append(
      $('<div>', { class: 'toolSelect' }).append(
        $('<div>', { class: 'label', text: _msg('editor-edittool-header') }),
        $('<ul>', { class: 'ul-list' }).append(
          $('<li>', { class: 'editToolBtn', 'data-open': '\n== ', 'data-middle': _msg('editor-edittool-header-text'), 'data-close': ' ==\n', text: 'H2' }),
          $('<li>', { class: 'editToolBtn', 'data-open': '\n=== ', 'data-middle': _msg('editor-edittool-header-text'), 'data-close': ' ===\n', text: 'H3' }),
          $('<li>', { class: 'editToolBtn', 'data-open': '\n==== ', 'data-middle': _msg('editor-edittool-header-text'), 'data-close': ' ====\n', text: 'H4' }),
          $('<li>', { class: 'editToolBtn', 'data-open': '\n===== ', 'data-middle': _msg('editor-edittool-header-text'), 'data-close': ' =====\n', text: 'H5' })
        )
      )
    ),
    $('<div>', { class: 'btnGroup' }).append(
      $('<span>', { class: 'label', text: '格式' }),
      $('<button>', { class: 'editToolBtn fa fa-bold btn', 'data-open': "'''", 'data-middle': _msg('editor-edittool-bold'), 'data-close': "'''" }),
      $('<button>', { class: 'editToolBtn fa fa-italic btn', 'data-open': "''", 'data-middle': _msg('editor-edittool-italic'), 'data-close': "''" }),
      $('<button>', { class: 'editToolBtn fa fa-list-ul btn', 'data-open': '\n* ', 'data-middle': _msg('editor-edittool-list-bulleted'), 'data-close': '\n' }),
      $('<button>', { class: 'editToolBtn fa fa-list-ol btn', 'data-open': '\n# ', 'data-middle': _msg('editor-edittool-list-numbered'), 'data-close': '\n' }),
      $('<button>', { class: 'editToolBtn fa fa-won btn', 'data-open': '<' + 'nowiki>', 'data-middle': _msg('editor-edittool-nowiki'), 'data-close': '</nowiki>' }),
      $('<button>', { class: 'editToolBtn fa fa-level-down fa-rotate-90 btn', 'data-open': '<br>\n', 'data-middle': '', 'data-close': '' })
    ),
    $('<div>', { class: 'btnGroup' }).append(
      $('<span>', { class: 'label', text: '插入' }),
      $('<button>', { class: 'editToolBtn fa fa-link btn', 'data-open': '[' + '[', 'data-middle': _msg('editor-edittool-internal-link'), 'data-close': ']]' }),
      $('<button>', { class: 'editToolBtn fa fa-file-image-o btn', 'data-open': '[' + '[File:', 'data-middle': 'Example.png', 'data-close': '|thumb]]' }),
      $('<button>', { class: 'editToolBtn btn', 'data-open': '\n<' + 'gallery>\n', 'data-middle': 'Example1.jpg|Description\nExample2.png|Description', 'data-close': '\n</gallery>\n', html: '<span class="fa-stack"><i class="fa fa-picture-o fa-stack-1x"></i><i class="fa fa-picture-o fa-stack-1x" style="left: 2px;top: 2px;text-shadow: 1px 1px 0 #fff;"></i></span>' })
    ),
    $('<div>', { class: 'btnGroup extra', style: 'display: none' }).append(
      $('<span>', { class: 'label', text: '自定义' })
    ),
    $('<div>', { class: 'btnGroup special-tools', style: 'float: right' }).append(
      $('<button>', { class: 'btn fa fa-search' }).click(function () {
        findAndReplace($editArea);
      })
    )
  );
  var $editArea = $('<textarea>', { class: 'editArea', style: 'margin-top: 0;' });
  var $optionsLabel = $('<div>', { class: 'editOptionsLabel hideBeforeLoaded' }).append(
    $('<aside>', { class: 'detailArea' }).append(
      $('<label>', { class: 'detailToggle', text: _msg('editor-detail-button-toggle') }),
      $('<div>', { class: 'detailBtnGroup' }).append(
        $('<a>', { href: 'javascript:;', class: 'detailBtn', id: 'showTemplates', text: _msg('editor-detail-button-templates') }),
        ' | ',
        $('<a>', { href: 'javascript:;', class: 'detailBtn', id: 'showImages', text: _msg('editor-detail-button-images') })
      )
    ),
    // 摘要&小编辑
    $('<label>', { for: 'editSummary', text: _msg('editSummary') }),
    $br,
    $('<input>', { class: 'editSummary', id: 'editSummary', placeholder: 'Edit via InPageEdit~', value: options.editSummary.replace(/\$oldid/ig, options.summaryRevision) }),
    $br,
    $('<label>').append(
      $('<input>', { type: 'checkbox', class: 'editMinor', id: 'editMinor', checked: options.editMinor }),
      $('<span>', { text: _msg('markAsMinor') })
    ),
    $br,
    $('<label>').append(
      $('<input>', { type: 'checkbox', class: 'reloadPage', id: 'reloadPage', checked: options.reload }),
      $('<span>', { text: _msg('editor-reload-page') })
    )
  );
  var $modalContent = $('<div>').append(
    $progress,
    $('<section>', { class: 'hideBeforeLoaded' }).append(
      // 编辑工具条
      $editTools,
      // 编辑框
      $editArea
    )
  );

  // Debug
  console.time('[InPageEdit] 获取页面源代码');
  console.info('[InPageEdit] QuickEdit start with options:');
  console.table(options);

  // 显示主窗口
  ssi_modal.show({
    title: $modalTitle,
    content: $modalContent,
    outSideClose: options.outSideClose,
    className: 'in-page-edit ipe-editor timestamp-' + timestamp,
    sizeClass: 'large',

    /* 按钮 */
    buttons: [{
      side: 'left',
      label: _msg('editor-button-save'),
      className: 'btn btn-primary leftBtn hideBeforeLoaded save-btn',
      method(e, modal) {
        ssi_modal.confirm({
          className: 'in-page-edit',
          center: true,
          content: _msg('editor-confirm-save'),
          okBtn: {
            className: 'btn btn-primary',
            label: _msg('confirm')
          },
          cancelBtn: {
            className: 'btn btn-secondary',
            label: _msg('cancel')
          },
        },
          function (result) {
            if (result) {
              var text = $editArea.val(),
                minor = $optionsLabel.find('.editMinor').prop('checked'),
                section = options.section,
                summary = $optionsLabel.find('.editSummary').val();
              postArticle({
                text: text,
                page: options.page,
                minor: minor,
                section: section,
                summary: summary
              }, modal);
            }
          });
      }
    }, {
      side: 'left',
      label: _msg('editor-button-preview'),
      className: 'btn btn-secondary leftBtn hideBeforeLoaded',
      method() {
        _analysis('preview_edit');
        var text = $editArea.val();
        quickPreview({
          title: options.page,
          text: text,
          pst: true
        });
      }
    }, {
      side: 'left',
      label: _msg('editor-button-diff'),
      className: 'btn btn-secondary leftBtn hideBeforeLoaded diff-btn'
    }, {
      label: _msg('cancel'),
      className: 'btn btn-danger',
      method(e, modal) {
        modal.close();
      }
    }
    ],

    /* 预加载 */
    beforeShow($modal) {
      var $modalWindow = $('#' + $modal.modalId);
      // 设置样式
      $modalWindow.find('.hideBeforeLoaded').hide();
      $modalContent.find('.ipe-progress').css('margin', Number($(window).height() / 3 - 50) + 'px 0');
      $editArea.css('height', $(window).height() / 3 * 2 - 100);
      $modalWindow.find('.ssi-buttons').prepend($optionsLabel);
      $modalWindow.find('.ssi-modalTitle').append(
        $('<a>', {
          class: 'showEditNotice',
          href: 'javascript:void(0);',
          html: '<i class="fa fa-info-circle"></i> ' + _msg('editor-has-editNotice'),
          style: 'display: none;'
        }).click(function () {
          ssi_modal.show({
            className: 'in-page-edit',
            center: true,
            title: _msg('editor-title-editNotice'),
            content: '<section class="editNotice">' + $modalContent.data('editNotice') + '</section>'
          });
        })
      );

      /** Edit-Tool 扩展 **/
      function insertText(strings, obj) {
        var textarea = obj || $editArea[0],
          start = textarea.selectionStart,
          stop = textarea.selectionEnd,
          selectedText = textarea.value.slice(start, stop);
        textarea.value =
          textarea.value.slice(0, start) +
          (strings.open || '') +
          (selectedText || strings.middle || '') +
          (strings.close || '') +
          textarea.value.slice(stop);
        var selectStart = start + (strings.open.length || 0);
        textarea.setSelectionRange(selectStart, selectStart + (selectedText.length || strings.middle.length || 0));
        textarea.focus();
      }
      // 添加按钮
      function addBtn(open, middle, close, icon) {
        open = open || '';
        middle = middle || '';
        close = close || '';
        icon = 'fa-' + icon || 'fa-wrench';
        $modalContent.find('.btnGroup.extra').append(
          $('<button>', { class: 'editToolBtn btn', 'data-open': open, 'data-middle': middle, 'data-close': close, html: `<i class="fa ${icon}"></i>` })
        );
      }
      // 用户自定义按钮
      if (InPageEdit.buttons) {
        var btns = InPageEdit.buttons;
        $editTools.find('.btnGroup.extra').show();

        for (var i = 0; i < btns.length; i++) {
          var btn = btns[i];
          addBtn(btn.open, btn.middle, btn.close, btn.text);
        }
      }
      $editTools.find('.editToolBtn').click(function (e) {
        e.preventDefault();
        var $this = $(this),
          $open = $this.attr('data-open') || '',
          $middle = $this.attr('data-middle') || '',
          $close = $this.attr('data-close') || '';
        insertText({
          open: $open,
          middle: $middle,
          close: $close
        }, $editArea[0]);
      });
    },
    /**
     * @event onShow
     * @description 模态框显示后
     */
    onShow($modal) {
      var $modalWindow = $('#' + $modal.modalId);
      mw.hook('InPageEdit.quickEdit').fire({
        $modal,
        $modalWindow,
        $modalTitle,
        $modalContent,
        $editArea,
        $editTools,
        $optionsLabel
      });
      // 绑定事件，在尝试离开页面时提示
      $editArea.change(function () {
        $(this).attr('data-modifiled', 'true');
        $(window).bind('beforeunload', function () {
          return _msg('window-leave-confirm');
        });
      });
      // 获取权限
      if (!_hasRight('edit')) {
        ssi_modal.notify('dialog', {
          className: 'in-page-edit',
          position: 'center bottom',
          title: _msg('notify-no-right'),
          content: _msg('editor-no-right'),
          okBtn: {
            label: _msg('ok'),
            className: 'btn btn-primary',
            method(e, modal) {
              modal.close();
            }
          }
        });
        $modalWindow.find('.save-btn').addClass('btn-danger');
      }

      // 解析页面内容
      mwApi.get(options.jsonGet).done(function (data) {
        console.timeEnd('[InPageEdit] 获取页面源代码');
        contentDone(data);
      }).fail(function (a, b, errorThrown) {
        console.timeEnd('[InPageEdit] 获取页面源代码');
        console.warn('[InPageEdit]警告：无法获取页面内容');
        var data = errorThrown;
        contentDone(data);
      });

      // 页面内容获取完毕，后续工作
      function contentDone(data) {
        options.pageDetail = data;

        if (data.error) {
          console.warn('[InPageEdit]警告：无法获取页面内容');
          options.editText = '<!-- ' + data.error.info + ' -->';
          options.pageId = -1;
          $optionsLabel.find('.detailArea').hide();
        } else {
          options.editText = data.parse.wikitext['*'];
          options.pageId = data.parse.pageid;
        }
        // 设定一堆子样式
        $modalContent.find('.ipe-progress').hide();
        $modalWindow.find('.hideBeforeLoaded').fadeIn(500);
        $editArea.val(options.editText + '\n');

        var summaryVal;
        if (options.section !== null) {
          summaryVal = $optionsLabel.find('.editSummary').val();
          summaryVal = summaryVal.replace(/\$section/ig, '/* ' + data.parse.sections[0].line + ' */');
          $optionsLabel.find('.editSummary').val(summaryVal);
          $modalTitle.find('.editPage').after('<span class="editSection">→' + data.parse.sections[0].line + '</span>');
          options.jumpTo = '#' + data.parse.sections[0].anchor;
        } else {
          summaryVal = $optionsLabel.find('.editSummary').val();
          summaryVal = summaryVal.replace(/\$section/ig, '');
          $optionsLabel.find('.editSummary').val(summaryVal);
          options.jumpTo = '';
        }
        if (options.revision !== null && options.revision !== '' && options.revision !== config.wgCurRevisionId) {
          $modalTitle.find('.editPage').after('<span class="editRevision">(' + _msg('editor-title-editRevision') + '：' + options.revision + ')</span>');
          $modalWindow.find('.diff-btn').click(function () {
            _analysis('quick_diff_edit');
            var text = $editArea.val();
            var diffJson = {
              fromrev: options.revision,
              totext: text,
              hideBtn: true,
              pageName: options.page,
              isPreview: true
            }
            if (options.section) {
              diffJson.fromsection = options.section;
            }
            quickDiff(diffJson);
          });
        } else {
          $modalWindow.find('.diff-btn').attr('disabled', true);
        }

        // 获取页面基础信息
        console.time('[InPageEdit] 获取页面基础信息');
        var queryJson = {
          action: 'query',
          prop: 'revisions|info',
          inprop: 'protection',
          format: 'json'
        }
        if (options.pageId !== -1) {
          queryJson.pageids = options.pageId;
        } else {
          queryJson.titles = options.page;
        }
        mwApi.get(queryJson).done(function (data) {
          console.info('[InPageEdit] 获取页面基础信息成功');
          console.timeEnd('[InPageEdit] 获取页面基础信息');
          // 记录页面最后编辑时间，防止编辑冲突
          $modalContent.data('basetimestamp', data['query']['pages'][options.pageId].revisions ? data['query']['pages'][options.pageId]['revisions'][0]['timestamp'] : now);
          queryDone(data);
        }).fail(function (a, b, errorThrown) {
          var data = errorThrown;
          console.timeEnd('[InPageEdit] 获取页面基础信息');
          console.warn('[InPageEdit] 获取页面基础信息失败');
          $modalContent.data('basetimestamp', now);
          queryDone(data);
        });

        /** 页面保护等级和编辑提示等 **/
        function queryDone(data) {
          options.namespace = data.query.pages[options.pageId].ns; // 名字空间ID
          options.protection = data.query.pages[options.pageId]['protection'] || []; // 保护等级
          if (data.query.pages[options.pageId].revisions) {
            options.revision = data.query.pages[options.pageId]['revisions'][0]['revid']; // 版本号
          }

          // 使页面名标准化
          options.page = data.query.pages[options.pageId].title;
          $modalTitle.find('.editPage').text(options.page);

          if (options.revision) {
            $modalWindow.find('.diff-btn').attr('disabled', false).click(function () {
              _analysis('quick_diff_edit');
              var text = $editArea.val();
              var diffJson = {
                fromrev: options.revision,
                totext: text,
                hideBtn: true,
                pageName: options.page,
                isPreview: true
              }
              if (options.section) {
                diffJson.fromsection = options.section;
              }
              quickDiff(diffJson);
            })
          }

          // 页面是否被保护
          if (options.protection.length > 0) {
            for (var i = 0; i < options.protection.length; i++) {
              if (options.protection[i].type === 'edit') {
                if (
                  (options.protection[i].level === 'autoconfirmed' && !_hasRight('autoconfirmed')) ||
                  (options.protection[i].level === 'sysop' && !_hasRight('editprotected')) ||
                  (config.wgNamespaceNumber === 8 && !_hasRight('editinterface'))
                ) {
                  ssi_modal.notify('dialog', {
                    className: 'in-page-edit',
                    position: 'center bottom',
                    title: _msg('notify-no-right'),
                    content: _msg('editor-no-right'),
                    okBtn: {
                      label: _msg('ok'),
                      className: 'btn btn-primary',
                      method(e, modal) {
                        modal.close();
                      }
                    }
                  });
                  $modalWindow.find('.save-btn').addClass('btn-danger');
                }
              }
            }
          }

          // 获取编辑提示
          var namespaceNoticePage = 'Editnotice-' + options.namespace,
            pageNoticePage = namespaceNoticePage + '-' +
              options.page
                .replace(/_/g, ' ') // 将页面名里的 _ 转换为空格
                .replace(config.wgFormattedNamespaces[options.namespace] + ':', ''); // 去掉名字空间

          mwApi.get({
            action: 'query',
            meta: 'allmessages',
            ammessages: namespaceNoticePage + '|' + pageNoticePage
          }).done(function (data) {
            var wikitextNs = data.query.allmessages[0]['*'] || '',
              wikitextPage = data.query.allmessages[1]['*'] || '';
            if (wikitextNs === '' && wikitextPage === '') return; // 没有编辑提示
            // 将编辑提示解析为 html
            mwApi.post({
              action: 'parse',
              title: options.page,
              contentmodel: 'wikitext',
              preview: true,
              text: wikitextPage + '\n' + wikitextNs
            }).done(function (data) {
              options.editNotice = data.parse.text['*'];
              var notice = $modalContent.data('editNotice') || '';
              notice += '\n' + options.editNotice;
              $modalContent.data('editNotice', notice);
              $modalContent.find('.showEditNotice').show();
            });
          });

        }
      }
    },

    /* 确认是否取消 */
    beforeClose(modal) {
      if ($editArea.attr('data-modifiled') !== 'true') {
        close();
        return;
      } else if ($editArea.attr('data-confirmclose') === 'true') {
        closeNoReload();
        return;
      }
      ssi_modal.confirm({
        className: 'in-page-edit',
        center: true,
        content: _msg('editor-leave-confirm'),
        okBtn: {
          className: 'btn btn-danger',
          label: _msg('confirm')
        },
        cancelBtn: {
          className: 'btn btn-secondary',
          label: _msg('cancel')
        }
      },
        function (result) {
          if (result === true) {
            close();
          }
        });
      function close() {
        $(window).unbind('beforeunload');
        modal.options.keepContent = false;
        modal.options.beforeClose = '';
        modal.close();
        ssi_modal.notify('info', {
          className: 'in-page-edit',
          position: 'right top',
          title: _msg('cancel'),
          content: _msg('notify-no-change')
        });
      }
      function closeNoReload() {
        $(window).unbind('beforeunload');
        modal.options.keepContent = false;
        modal.options.beforeClose = '';
        modal.close();
      }
      return false;
    }
  });

  // 页面详情模块
  $optionsLabel.find('.detailBtnGroup .detailBtn').click(function () {
    _analysis('quick_edit_pagedetail');
    var $this = $(this),
      id = $this.attr('id'),
      content = $('<ul>');
    switch (id) {
      case 'showTemplates':
        var templates = options.pageDetail.parse.templates,
          templateName;
        for (let i = 0; i < templates.length; i++) {
          templateName = templates[i]['*'];
          $('<li>').append(
            $('<a>', { href: mw.util.getUrl(templateName), target: '_blank', text: templateName }),
            ' (',
            $('<a>', { href: 'javascript:;', text: _msg('quick-edit'), class: 'quickEditTemplate', 'data-template-name': templateName }),
            ')'
          ).appendTo(content);
        }
        ssi_modal.show({
          className: 'in-page-edit quick-edit-detail',
          sizeClass: 'dialog',
          title: _msg('editor-detail-title-templates'),
          content: content
        });
        break;
      case 'showImages':
        var images = options.pageDetail.parse.images,
          imageName;
        for (let i = 0; i < images.length; i++) {
          imageName = images[i];
          $('<li>').append(
            $('<a>', { href: mw.util.getUrl('File:' + imageName), target: '_balnk', text: imageName }),
            ' (',
            $('<a>', { href: 'javascript:;', class: 'quickViewImage', text: _msg('editor-detail-images-quickview'), 'data-image-name': imageName }),
            ' | ',
            $('<a>', { href: config.wgScript + '?title=Special:Upload&wpDestFile=' + imageName + '&wpForReUpload=1', target: '_balnk', text: _msg('editor-detail-images-upload') }),
            ')'
          ).appendTo(content);
        }
        ssi_modal.show({
          className: 'in-page-edit quick-edit-detail',
          sizeClass: 'dialog',
          title: _msg('editor-detail-title-images'),
          content
        });
        break;
    }
    $('.in-page-edit.quick-edit-detail .quickEditTemplate').click(function () {
      _analysis('quick_edit_pagedetail_edit_template');
      var $this = $(this);
      var page = $this.attr('data-template-name');
      quickEdit({
        page
      });
    });
    $('.in-page-edit.quick-edit-detail .quickViewImage').click(function () {
      _analysis('quick_edit_pagedetail_view_image');
      var $this = $(this);
      var imageName = $this.attr('data-image-name');
      ssi_modal.show({
        className: 'in-page-edit quick-view-image',
        center: true,
        title: imageName.replace(/_/g, ' '),
        content: $('<center>', { id: 'imageLayer' }).append(
          $progress
        ),
        buttons: [{
          label: _msg('editor-detail-images-upload'),
          className: 'btn btn-primary',
          method() {
            window.open(config.wgScript + '?title=Special:Upload&wpDestFile=' + imageName + '&wpForReUpload=1');
          }
        }, {
          label: _msg('close'),
          className: 'btn btn-secondary',
          method(a, modal) { modal.close() }
        }],
        onShow() {
          mwApi.get({
            action: 'query',
            format: 'json',
            prop: 'imageinfo',
            titles: 'File:' + imageName.replace(/file:/g, ''),
            iiprop: 'url'
          }).done(function (data) {
            $('.quick-view-image .ipe-progress').hide();
            $('.quick-view-image #imageLayer').append(
              $('<img>', { src: data.query.pages['-1'].imageinfo[0].url, class: 'loading', style: 'max-width: 80%; max-height: 60vh' })
            );
            $('.quick-view-image #imageLayer img').load(function () {
              $(this).removeClass('loading');
            });
          })
        }
      });
    });
  });

  // 发布编辑模块
  function postArticle({
    text,
    page,
    minor,
    summary,
    section
  }, modal) {
    _analysis('quick_edit_save');
    progress(_msg('editor-title-saving'));
    options.jsonPost = {
      action: 'edit',
      basetimestamp: $modalContent.data('basetimestamp'),
      starttimestamp: now,
      text,
      title: page,
      minor,
      summary,
      errorformat: 'plaintext'
    }
    if (section !== undefined && section !== '' && section !== null) {
      options.jsonPost.section = section;
      delete options.jsonPost.basetimestamp;
    }

    mwApi.postWithToken('csrf', options.jsonPost).done(saveSuccess).fail(saveError);

    // 保存正常
    function saveSuccess(data, feedback, errorThrown) {
      if (data.edit.result === 'Success') {
        progress(true);
        // 是否重载页面
        if ($optionsLabel.find('.reloadPage').prop('checked')) {
          var content;
          $(window).unbind('beforeunload');
          content = _msg('notify-save-success');
          setTimeout(function () {
            if (page === config.wgPageName) {
              window.location = mw.util.getUrl(page) + options.jumpTo;
              window.location.reload();
            } else {
              window.location.reload();
            }
          }, 500);
        } else {
          console.info('[InPageEdit] 将不会重载页面！');
          content = _msg('notify-save-success-noreload');
          setTimeout(function () {
            progress(false);
            $editArea.attr('data-confirmclose', 'true');
            modal.close();
          }, 1500);
        }

        ssi_modal.notify('success', {
          className: 'in-page-edit',
          position: 'right top',
          title: _msg('notify-success'),
          content
        });
      } else {
        saveError(data, feedback, errorThrown)
      }
    }

    // 保存失败
    function saveError(errorCode, feedback, errorThrown) {
      progress(false);
      var data = errorThrown || errorCode; // 规范错误代码
      var errorInfo,
        errorMore = '';
      if (data.errors !== undefined) {
        errorCode = data.errors[0].code;
        errorInfo = data.errors[0]['*'];
        errorMore = '';
      } else if (data.edit.result !== 'Success') {
        errorCode = data.edit.code || 'Unknown';
        errorInfo = data.edit.info || 'Reason unknown.';
        errorMore = data.edit.warning || '';
      } else {
        errorCode = 'unknown';
        errorInfo = 'Reason unknown.';
        errorMore = 'Please contact plug-in author or try again.'
      }
      ssi_modal.show({
        className: 'in-page-edit',
        sizeClass: 'dialog',
        center: true,
        title: _msg('editor-save-error'),
        content: errorInfo + '<hr style="clear: both" />' + errorMore
      });
      ssi_modal.notify('error', {
        className: 'in-page-edit',
        position: 'right top',
        closeAfter: {
          time: 15
        },
        title: _msg('notify-error'),
        content: _msg('editor-save-error') + '：<code>' + errorCode + '</code>'
      });

      console.error('[InPageEdit] Submit failed: \nCode: ' + errorCode);
      return;
    }
  }
}

module.exports = {
  quickEdit
}