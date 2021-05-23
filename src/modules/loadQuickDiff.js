var config = mw.config.get();
const { _msg } = require('./_msg');
const { _analysis } = require('./_analysis');

const { quickDiff } = require('./quickDiff');

/**
 * @module loadQuickDiff 在特定页面查询差异链接并绑定快速差异
 */
var loadQuickDiff = function () {
  // 最近更改
  function addLink() {
    $('.mw-changeslist-groupdiff, .mw-changeslist-diff, .mw-changeslist-diff-cur, .mw-history-histlinks a').unbind('click', ipeDiffLink);
    var ipeDiffLink = $('.mw-changeslist-groupdiff, .mw-changeslist-diff, .mw-changeslist-diff-cur, .mw-history-histlinks a').click(function (e) {
      e.preventDefault();
      _analysis('quick_diff_recentchanges');
      var $this = $(this),
        href = $this.attr('href'),
        diff = mw.util.getParamValue('diff', href),
        curid = mw.util.getParamValue('curid', href),
        oldid = mw.util.getParamValue('oldid', href);
      if (diff === '0') {
        quickDiff({ fromrev: oldid, toid: curid });
      } else if (diff === 'prev' || diff === 'next' || diff === 'cur') {
        quickDiff({ fromrev: oldid, torelative: diff });
      } else {
        quickDiff({ fromrev: oldid, torev: diff });
      }
    });
  }
  if ($('.mw-rcfilters-enabled').length > 0) {
    setInterval(addLink, 500);
    $('.mw-rcfilters-enabled').addClass('ipe-continuous-active');
  } else {
    addLink();
  }
  // 查看历史页面的比较按钮与快速编辑
  if (config.wgAction === 'history') {
    $('.historysubmit.mw-history-compareselectedversions-button').after(
      $('<button>').text(_msg('quick-diff')).click(function (e) {
        e.preventDefault();
        _analysis('quick_diff_history_page');
        var before = $('.selected.before').attr('data-mw-revid'),
          after = $('.selected.after').attr('data-mw-revid');
        quickDiff({ fromrev: after, torev: before });
      })
    );
    $('[data-mw-revid]').each(function () {
      var $this = $(this),
        oldid = $this.attr('data-mw-revid');
      $this.find('.mw-history-undo').after(
        $('<span>').html(' | <a class="in-page-edit-article-link" href="javascript:void(0);" onclick="InPageEdit.quickEdit({page:mw.config.get(\'wgPageName\'),revision:' + oldid + '});">' + _msg('quick-edit') + '</a>')
      );
    });
  }
}

module.exports = {
  loadQuickDiff
}