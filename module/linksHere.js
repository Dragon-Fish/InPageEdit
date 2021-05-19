/**
 * @module linksHere
 */

const { quickEdit } = require('./quickEdit')
const { _analysis } = require('./_analysis')
const { $progress, $link } = require('./_elements')
const { _msg } = require('./_msg')

var mwApi = new mw.Api()
var config = mw.config.get()

/**
 * @function isFile
 * @returns {Boolean} Is file page?
 */
var isFile = title => {
  var fileReg = new RegExp(`^(File|${config.wgFormattedNamespaces[6]}):`)
  return fileReg.test(title)
}

/**
 * @function getList
 * @param {Sting} title
 */
var getList = title => {
  var opt = {
    format: 'json',
    action: 'query',
    prop: isFile(title) ? 'fileusage' : 'linkshere',
    titles: title,
  }
  if (isFile(title)) {
    opt.fulimit = 'max'
  } else {
    opt.lhlimit = 'max'
  }
  return mwApi.get(opt)
}

/**
 * @function makeList
 * @param {Object} list
 */
var makeList = list => {
  var $list = $('<ol>', { class: 'ipe-links-here-list' })
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
            require: false,
          })
        }),
        ')'
      )
    )
  })
  return $list
}

/**
 * @module linksHere
 * @param {String} title
 */
async function linksHere(title = config.wgPageName) {
  _analysis('linkshere')

  if (!title || typeof title !== 'string') title = config.wgPageName

  // 构建内容
  var $progressBar = $($progress)
  var $content = $('<div>').append($progressBar)

  // 构建模态框
  var modal = ssi_modal
    .createObject({
      className: 'in-page-edit ipe-links-here',
      center: true,
      sizeClass: 'dialog',
      onShow(modal) {
        mw.hook('InPageEdit.linksHere').fire({
          modal,
          $modal: $('#' + modal.modalId),
        })
      },
    })
    .init()

  // 设定模态框
  modal.setTitle(_msg('links-here-title', title, 2))
  modal.setContent($content)

  // 显示模态框
  modal.show()

  // 异步操作
  try {
    console.info('[InPageEdit] linksHere', '开始获取页面信息')
    const data = await getList(title)
    const { pages } = data.query
    console.info('[InPageEdit] linksHere', '成功获取页面信息')
    var pageId = Object.keys(pages)[0]
    var pageList = []
    // 判定为文件还是一般页面
    if (isFile(title)) {
      pageList = pages[pageId].fileusage || []
    } else {
      pageList = pages[pageId].linkshere || []
    }
    $progressBar.hide()
    // 如果存在页面，则插入列表，否则显示提示
    if (pageList.length > 0) {
      var $list = makeList(pageList)
      $content.append($list)
    } else {
      $content.append(
        $('<div>', {
          class: 'ipe-links-here-no-page',
          html: _msg('links-here-no-page', title),
        })
      )
    }
    // 配置西文单数名词
    if (pageList.length < 2) {
      modal.setTitle(_msg('links-here-title', title, 1))
    }
    // pageId 是一个字符串，MediaWiki NM$L
    // pageId 为 "-1" 则意味着请求的页面似乎不存在
    // 但这不意味着不会有链入页面
    if (pageId === '-1') {
      $content.append(
        $('<div>', {
          html: _msg('links-here-not-exist', title),
          class: 'ipe-links-here-not-exist',
        })
      )
    }
    // 发射钩子
    mw.hook('InPageEdit.linksHere.pageList').fire(pageList)
    return pageList
  } catch (err) {
    $progressBar.hide()
    $content.append($('<p>', { class: 'error', html: err }))
    console.error('[InPageEdit] linksHere', '获取页面信息时出现问题', err)
    return err
  }
}

module.exports = {
  linksHere,
}
