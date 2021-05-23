var mwApi = new mw.Api();
var config = mw.config.get();

const { _analysis } = require('./_analysis');
const { _msg } = require('./_msg');
const { _hasRight } = require('./_hasRight');
const { _resolveExists } = require('./_resolveExists');
const { $br } = require('./_elements');

const { progress } = require('./progress');

/**
 * @module quickRename 快速重命名模块
 * @param {String} from
 * @param {String} to
 */
var quickRename = function (from, to) {
  mw.hook('InPageEdit.quickRename').fire();
  from = from || config.wgPageName;
  to = to || '';
  var reason,
    movetalk,
    movesubpages,
    noredirect;

  ssi_modal.show({
    outSideClose: false,
    className: 'in-page-edit quick-rename',
    center: true,
    sizeClass: 'dialog',
    title: _msg('rename-title'),
    content:
      $('<section>').append(
        $('<label>', { for: 'move-to', html: _msg('rename-moveTo', '<b>' + from.replace(/_/g, ' ') + '</b>') }),
        $br,
        $('<input>', { id: 'move-to', style: 'width:96%', onclick: "$(this).css('box-shadow','')" }),
        $br,
        $('<label>', { for: 'move-reason', text: _msg('editSummary') }),
        $br,
        $('<input>', { id: 'move-reason', style: 'width:96%' }),
        $br,
        $('<label>').append(
          $('<input>', { type: 'checkbox', id: 'movetalk', checked: 'checked' }),
          $('<span>', { text: _msg('rename-movetalk') })
        ),
        $br,
        $('<label>').append(
          $('<input>', { type: 'checkbox', id: 'movesubpages', checked: 'checked' }),
          $('<span>', { text: _msg('rename-movesubpages') })
        ),
        $br,

        $('<label>').append(
          $('<input>', { type: 'checkbox', id: 'noredirect' }),
          $('<span>', { text: _msg('rename-noredirect') })
        ),
      ),
    buttons: [{
      label: _msg('cancel'),
      className: 'btn btn-secondary',
      method: function (a, modal) {
        modal.close();
      }
    }, {
      label: _msg('confirm'),
      className: 'btn btn-primary',
      method: function () {
        to = $('.in-page-edit.quick-rename #move-to').val();
        if (to === '' || to === config.wgPageName || to === config.wgPageName.replace(/_/g, ' ')) {
          $('.in-page-edit.quick-rename #move-to').css('box-shadow', '0 0 4px #f00');
          return;
        }

        _analysis('quick_move');

        progress(_msg('editor-title-saving'));
        movetalk = $('.in-page-edit.quick-rename #movetalk').prop('checked');
        movesubpages = $('.in-page-edit.quick-rename #movesubpages').prop('checked');
        noredirect = $('.in-page-edit.quick-rename #noredirect').prop('checked');
        reason = $('.in-page-edit.quick-rename #move-reason').val();

        if (reason === '') {
          reason = _msg('rename-summary') + ' → [[:' + to + ']]';
        } else {
          reason = _msg('rename-summary') + ' → [[:' + to + ']] (' + reason + ')';
        }
        mwApi.postWithToken('csrf', {
          action: 'move',
          from: from,
          to: to,
          reason: reason,
          movetalk: movetalk,
          movesubpages: movesubpages,
          noredirect: noredirect
        }).done(function () {
          progress(true);
          ssi_modal.notify('success', {
            className: 'in-page-edit',
            content: _msg('notify-rename-success'),
            title: _msg('notify-success')
          });
          location.href = config.wgArticlePath.replace('$1', to);
        }).fail(function (errorCode, feedback, errorThrown) {
          progress(false);
          ssi_modal.notify('error', {
            className: 'in-page-edit',
            content: _msg('notify-rename-error') + ': ' + errorThrown.error.info + '<code>' + errorThrown.error.code + '</code>',
            title: _msg('notify-error')
          });
          // 如果原因是页面已存在，给出解决方案
          if (errorThrown.error.code === 'articleexists') {
            _resolveExists(to, 'For move page [[' + from + ']] to here.');
          }
        });
      }
    }],
    beforeShow: function () {
      if (!_hasRight('move')) {
        ssi_modal.dialog({
          title: _msg('notify-no-right'),
          content: _msg('rename-no-right'),
          className: 'in-page-edit quick-deletepage',
          center: true,
          okBtn: {
            className: 'btn btn-primary btn-single'
          }
        });
        return false;
      }
    }
  });
}

module.exports = {
  quickRename
}