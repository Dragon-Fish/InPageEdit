/**
 * @module usedTemplates 模版使用分析
 */

const { mwApi } = require('./util')

const { _msg } = require('./_msg')
const { quickEdit } = require('./quickEdit')
const { linksHere } = require('./linksHere')

const { $link } = require('./_elements')

const getList = title => {
  return mwApi.get({
    format: 'json',
    action: 'query',
    prop: 'pageinfo',
    titles: title,
  })
}

/**
 * @function makeList
 * @param {Object} list
 */
var makeList = list => {
  var $list = $('<ul>', { class: 'ipe-used-templates-list' })
  $.each(list, (index, { title, redirect }) => {
    $list.append(
      $('<li>').append(
        $link({ page: title }).attr('target', '_blank'),
        redirect !== undefined
          ? ' (<i>' + _msg('links-here-isRedirect') + '</i>)'
          : '',
        ' (',
        $link({ text: '← ' + _msg('links-here') }).click(function () {
          linksHere(title)
        }),
        ' | ',
        $link({ text: _msg('quick-edit') }).click(function () {
          quickEdit({
            page: title,
            reload: false,
          })
        }),
        ')'
      )
    )
  })
  return $list
}

const usedTemplates = title => {
  var modal = ssi_modal
    .createObject({
      className: 'in-page-edit ipe-used-templates',
      sizeClass: 'dialog',
    })
    .init()

  modal.setTitle(_msg('editor-detail-title-templates'))
  modal.setContent(title)

  modal.show()
}

module.exports = {
  usedTemplates,
}
