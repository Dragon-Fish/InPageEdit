var mwApi = new mw.Api();
var config = mw.config.get();

const { _analysis } = require('./_analysis');
const { _msg } = require('./_msg');

const { $br, $progress } = require('./_elements');

/**
 * @module quickDiff 快速页面差异模块
 * @param {Object} param standard MediaWiki API params
 */
var quickDiff = function (param) {
  mw.hook('InPageEdit.quickDiff').fire();
  _analysis('quick_diff');
  if ($('[href*="mediawiki.diff.styles"]').length < 1) {
    mw.loader.load(mw.util.wikiScript('load') + '?modules=mediawiki.legacy.shared|mediawiki.diff.styles&only=styles', 'text/css');
  }
  var $modalTitle,
    $diffArea,
    $loading;
  if ($('.quick-diff').length > 0) {
    console.info('[InPageEdit] Quick diff 正在加载新内容');
    $modalTitle = $('.quick-diff .pageName');
    $diffArea = $('.quick-diff .diffArea');
    $loading = $('.quick-diff .ipe-progress');
    $modalTitle.text(_msg('diff-loading'));
    $diffArea.hide();
    $('.quick-diff').appendTo('body');
  } else {
    $modalTitle = $('<span>', { class: 'pageName', text: _msg('diff-loading') });
    $diffArea = $('<div>', { class: 'diffArea', style: 'display: none' });
    $loading = $($progress);

    ssi_modal.show({
      className: 'in-page-edit quick-diff',
      sizeClass: 'large',
      fixedHeight: true,
      fitScreen: true,
      title: $modalTitle,
      content: $('<div>').append($loading, $diffArea),
      buttons: [{
        label: _msg('diff-button-todiffpage'),
        className: 'btn btn-secondary toDiffPage'
      }]
    });
  }
  $loading.show().css('margin-top', $('.quick-diff .ssi-modalContent').height() / 2);
  $('.quick-diff .toDiffPage').unbind();
  param.action = 'compare';
  param.prop = 'diff|diffsize|rel|ids|title|user|comment|parsedcomment|size';
  param.format = 'json';
  if (param.totext) {
    param.topst = true;
  } else if (param.fromtext) {
    param.frompst = true;
  }
  mwApi.post(param).done(function (data) {
    var diffTable = data.compare['*'];
    var toTitle;
    $loading.hide();
    if (param.pageName === undefined) {
      toTitle = data.compare.totitle;
    } else {
      toTitle = param.pageName;
    }
    function userLink(user) {
      return '<a class="diff-user" href="' + mw.util.getUrl('User:' + user) + '">' + user + '</a> (<a href="' + mw.util.getUrl('User_talk:' + user) + '">' + _msg('diff-usertalk') + '</a> | <a href="' + mw.util.getUrl('Special:Contributions/' + user) + '">' + _msg('diff-usercontrib') + '</a> | <a href="' + mw.util.getUrl('Special:Block/' + user) + '">' + _msg('diff-userblock') + '</a>)';
    }
    $modalTitle.html(_msg('diff-title') + ': <u>' + toTitle + '</u>');
    $diffArea.show().html('').append(
      $('<table>', { class: 'diff difftable' }).append(
        $('<colgroup>').append(
          $('<col>', { class: 'diff-marker' }),
          $('<col>', { class: 'diff-content' }),
          $('<col>', { class: 'diff-marker' }),
          $('<col>', { class: 'diff-content' })
        ),
        $('<tbody>').append(
          $('<tr>').append(
            $('<td>', { colspan: 2, class: 'diff-otitle' }).append(
              $('<a>', { href: config.wgScript + '?oldid=' + data.compare.fromrevid, text: data.compare.fromtitle }),
              ' (',
              $('<span>', { class: 'diff-version', text: _msg('diff-version') + data.compare.fromrevid }),
              ') (',
              $('<a>', { class: 'editLink', href: config.wgScript + '?action=edit&title=' + data.compare.fromtitle + '&oldid=' + data.compare.fromrevid, text: _msg('diff-edit') }),
              ')',
              $br,
              userLink(data.compare.fromuser),
              $br,
              ' (',
              $('<span>', { class: 'diff-comment', html: data.compare.fromparsedcomment }),
              ') ',
              $br,
              $('<a>', { class: 'prevVersion ipe-analysis-quick_diff_modalclick', href: 'javascript:void(0);', text: '←' + _msg('diff-prev') }).click(() => {
                quickDiff({
                  fromrev: data.compare.fromrevid,
                  torelative: 'prev'
                });
              })
            ),
            $('<td>', { colspan: 2, class: 'diff-ntitle' }).append(
              $('<a>', { href: config.wgScript + '?oldid=' + data.compare.torevid, text: data.compare.totitle }),
              ' (',
              $('<span>', { class: 'diff-version', text: _msg('diff-version') + data.compare.torevid }),
              ') (',
              $('<a>', { class: 'editLink', href: config.wgScript + '?action=edit&title=' + data.compare.totitle + '&oldid=' + data.compare.torevid, text: _msg('diff-edit') }),
              ')',
              $br,
              userLink(data.compare.touser),
              $br,
              ' (',
              $('<span>', { class: 'diff-comment', html: data.compare.toparsedcomment }),
              ') ',
              $br,
              $('<a>', { class: 'nextVersion ipe-analysis-quick_diff_modalclick', href: 'javascript:void(0);', text: _msg('diff-nextv') + '→' }).click(() => {
                _analysis('quick_diff_modalclick');
                quickDiff({
                  fromrev: data.compare.torevid,
                  torelative: 'next'
                });
              })
            )
          ),
          diffTable,
          $('<tr>', { class: 'diffSize', style: 'text-align: center' }).append(
            $('<td>', { colspan: '2', text: data.compare.fromsize + _msg('diff-bytes') }),
            $('<td>', { colspan: '2', text: data.compare.tosize + _msg('diff-bytes') })
          )
        )
      )
    );
    $('.quick-diff button.toDiffPage').click(function () {
      location.href = config.wgScript + '?oldid=' + data.compare.fromrevid + '&diff=' + data.compare.torevid;
    });
    require('./articleLink').articleLink($('.quick-diff .editLink'));
    if (param.isPreview === true) {
      $('.quick-diff button.toDiffPage').hide();
      $diffArea.find('.diff-otitle').html('<b>' + _msg('diff-title-original-content') + '</b>');
      $diffArea.find('.diff-ntitle').html('<b>' + _msg('diff-title-your-content') + '</b>');
    }
    if (data.compare.fromsize === undefined || data.compare.tosize === undefined) {
      $diffArea.find('.diffSize').hide();
    }
    // 无上一版本或下一版本
    if (data.compare.fromrevid === undefined && param.isPreview !== true) {
      $diffArea.find('.diff-otitle').html('<span class="noPrevVerson">' + data.warnings.compare['*'] + '</span>');
    } else if (data.compare.torevid === undefined && param.isPreview !== true) {
      $diffArea.find('.diff-ntitle').html('<span class="noNextVerson">' + data.warnings.compare['*'] + '</span>');
    }
    // GitHub@issue#5 修复被隐藏版本的问题
    if (data.compare.fromtexthidden !== undefined) {
      $diffArea.find('.diff-otitle .diff-version').addClass('diff-hidden-history');
    }
    if (data.compare.totexthidden !== undefined) {
      $diffArea.find('.diff-ntitle .diff-version').addClass('diff-hidden-history');
    }
    if (data.compare.fromuserhidden !== undefined) {
      $diffArea.find('.diff-otitle .diff-user').addClass('diff-hidden-history');
    }
    if (data.compare.touserhidden !== undefined) {
      $diffArea.find('.diff-ntitle .diff-user').addClass('diff-hidden-history');
    }
    if (data.compare.fromcommenthidden !== undefined) {
      $diffArea.find('.diff-comment').addClass('diff-hidden-history');
    }
    if (data.compare.tocommenthidden !== undefined) {
      $diffArea.find('.diff-ntitle .diff-comment').addClass('diff-hidden-history');
    }
    if (data.error) {
      console.warn('[InPageEdit] 快速差异获取时系统告知出现问题');
      $diffArea.html(_msg('diff-error') + ': ' + data.error.info + '(<code>' + data.error.code + '</code>)');
    }
  }).fail(function (errorCode, errorThrown) {
    console.warn('[InPageEdit] 快速差异获取失败');
    $loading.hide();
    if (errorThrown.error && errorThrown.error.info && errorThrown.error.code) {
      $diffArea.show().html(_msg('diff-error') + ': ' + errorThrown.error.info + '(<code>' + errorThrown.error.code + '</code>)');
    } else {
      $diffArea.show().html(_msg('diff-error'));
    }
  });
}

module.exports = {
  quickDiff
}