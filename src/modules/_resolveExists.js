const { _msg } = require('./_msg');
const { _hasRight } = require('./_hasRight');

const { quickDelete } = require('./quickDelete');
const { quickEdit } = require('./quickEdit');

/**
 * @module _resolveExists 解决目标页面已存在的问题
 * @param {String} page 需要解决的页面
 * @param {Object|String} reason 填字符串则直接指定两种原因
 * @param {String} reason.delete 删除原因
 * @param {String} reason.edit 编辑原因
 */
var _resolveExists = function (page, reason = {}) {
  var canDelete = _hasRight('delete');

  if (typeof reason === 'string') {
    reason = {
      delete: reason,
      edit: reason
    }
  }

  ssi_modal.show({
    className: 'in-page-edit resovle-exists',
    sizeClass: 'dialog',
    center: true,
    outSideClose: false,
    title: _msg('target-exists-title'),
    content: _msg((canDelete ? 'target-exists-can-delete' : 'target-exists-no-delete'), page),
    buttons: [
      {
        className: 'btn btn-danger btn-exists-delete-target',
        label: _msg('quick-delete'),
        method(a, modal) {
          modal.close();
          quickDelete(page, reason.delete || null);
        }
      },
      {
        className: 'btn btn-primary',
        label: _msg('quick-edit'),
        method() {
          quickEdit({
            page: page,
            summary: (reason.edit ? '[InPageEdit] ' + reason : null),
            reload: false
          })
        }
      },
      {
        className: 'btn btn-secondary' + (canDelete ? ' btn-single' : ''),
        label: _msg('cancel'),
        method: (a, modal) => {
          modal.close();
        }
      }
    ],
    onShow: () => {
      if (!canDelete) {
        $('.btn-exists-delete-target').hide();
      }
    }
  });
}

module.exports = {
  _resolveExists
}