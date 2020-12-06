/**
 * @module linksHere
 */

const quickEdit = require('./quickEdit')
const _analysis = require('./_analysis')
const { $progress, $link } = require('./_elements')
const _msg = require('./_msg')

var mwApi = new mwApi.Api()
var config = mw.config.get()

/**
 * @function getList
 * @param {Sting} title
 */
// 成功返回样例
// {
//   "batchcomplete": "",
//   "query": {
//     "pages": {
//       "208519": {
//         "pageid": 208519,
//         "ns": 0,
//         "title": "Main Page",
//         "linkshere": [
//           {
//             "pageid": 204731,
//             "ns": 12,
//             "title": "Help:\u9b54\u672f\u5b57/\u89e3\u6790\u5668\u51fd\u6570"
//           },
//           {
//             "pageid": 212703,
//             "ns": 2,
//             "title": "User:Cotangent"
//           }
//         ]
//       }
//     }
//   }
// }
// 失败返回样例
// {
//   "batchcomplete": "",
//   "query": {
//     "pages": {
//       "-1": {
//         "ns": 0,
//         "title": "No such page",
//         "missing": ""
//       }
//     }
//   }
// }
var getList = title => {
  return mwApi.get({
    format: 'json',
    action: 'query',
    prop: 'linkshere',
    titles: title,
    lhlimit: 'max',
  })
}

/**
 * @function makeList
 * @param {Object} obj
 */
var makeList = list => {
  var $list = $('<ol>', { class: 'ipe-linksHere-list' }).css({
    display: 'none',
  })
  $.each(list, (index, { title }) => {
    $list.append(
      $('<li>').append(
        $link({ page: title }),
        ' (',
        $link({ text: _msg('quick-edit') }).click(function () {
          quickEdit({
            page: title,
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
var linksHere = async title => {
  _analysis('linkshere')

  if (!title || typeof title !== 'string') title = config.wgPageName

  // 构建内容
  var $progressBar = $($progress)
  var $content = $('<div>').append($progressBar)

  // 构建模态框
  var modal = ssi_modal.createObject({}).init()

  // 设定模态框
  modal.setTitle(_msg('links-here-title', title))
  modal.setContent($content)

  modal.setOptions({
    className: 'in-page-edit ipe-linksHere',
    center: true,
    sizeClass: 'dialog',
    onShow(e) {
      mw.hook('InPageEdit.linksHere').fire({
        modal,
        $modal: $('#' + e.modalId),
      })
    },
  })

  // 显示模态框
  modal.show()

  // 异步操作
  try {
    console.info('[InPageEdit] linksHere', '开始获取页面信息')
    const { pages } = await getList(title).query
    console.info('[InPageEdit] linksHere', '成功获取页面信息')
    var pageId = Object.keys(pages)[0]
    var pageList = pages[pageId].linkshere || []
    var $list = makeList(pageList)
    $content.append($list)
    $progressBar.hide()
    mw.hook('InPageEdit.linksHere.pageList').fire(pageList)
  } catch (err) {
    $progressBar.hide()
    $content.append($('<p>', { class: 'error', text: err }))
    console.error('[InPageEdit] linksHere', '获取页面信息时出现问题', err)
  }
}

module.exports = {
  linksHere,
}