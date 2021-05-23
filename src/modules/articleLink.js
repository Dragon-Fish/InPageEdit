var config = mw.config.get();
const { _msg } = require('./_msg');

const { preference } = require('./preference');
const { quickEdit } = require('./quickEdit');

const { getParamValue } = mw.util;

/**
 * @module articleLink 获取段落编辑以及编辑链接
 * @param {Sting|Element} el jQuery element to find edit links
 */
var articleLink = function (el) {
  if (el === undefined) {
    if (preference.get('redLinkQuickEdit') === true) {
      el = $('#mw-content-text a');
    } else {
      el = $('#mw-content-text a:not(.new)');
    }
  }
  el = $(el);
  $.each(el, function (_, item) {
    var $this = $(item);
    if ($this.attr('href') === undefined) return;
    var url = $this.attr('href'),
      action = getParamValue('action', url) || getParamValue('veaction', url),
      title = getParamValue('title', url),
      section = getParamValue('section', url) ? getParamValue('section', url).replace(/T-/, '') : null,
      revision = getParamValue('oldid', url);

    // 不是本地编辑链接
    if (!RegExp('^' + config.wgServer).test(url) && !RegExp('^/').test(url)) return;

    // 不是 index.php?title=FOO 形式的url
    if (title === null) {
      title = url.replace(config.wgServer, '');
      title = title.split('?')[0];
      title = title.replace(config.wgArticlePath.replace('$1', ''), '');
    }

    if (action === 'edit' && title !== undefined) {
      $this.addClass('ipe-articleLink-resolved').after(
        $('<span>', {
          'class': 'in-page-edit-article-link-group'
        }).append(
          $('<a>', {
            href: 'javascript:void(0)',
            class: 'in-page-edit-article-link',
            text: _msg('quick-edit')
          }).click(function () {
            var options = {};
            options.page = decodeURI(title);
            if (revision !== null) {
              options.revision = revision;
            } else if (section !== null) {
              options.section = section;
            }
            if (!config.wgIsArticle) options.reload = false;
            quickEdit(options);
          })
        )
      );
    }
  });
}

module.exports = {
  articleLink
}