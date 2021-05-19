const api = require('../util/api')
const { _msg } = require('./_msg')

function getNotice(cb) {
  return $.get(api.specialNotice).then(data => {
    cb && cb(data)
  })
}

function getLocal() {
  var noticeList = localStorage.getItem('InPageEditNoticeId') || []
  try {
    noticeList = JSON.parse(noticeList)
  } catch (e) {
    localStorage.setItem('InPageEditNoticeId', '[]')
    noticeList = []
  }
  return noticeList
}

function setLocal({ id }) {
  var noticeList = localStorage.getItem('InPageEditNoticeId') || []
  try {
    noticeList = JSON.parse(noticeList)
  } catch (e) {
    noticeList = []
  }
  if (!id.includes(noticeList)) {
    noticeList.push(id)
  }
  localStorage.setItem('InPageEditNoticeId', JSON.stringify(noticeList))
  console.info('[InPageEdit] Notice save as viewed', id)
}

function isViewed({ id }) {
  var noticeList = getLocal()
  var viewed = id.includes(noticeList)
  console.info('[InPageEdit] Notice with id: ' + id, viewed)
  return viewed
}

function makeList({ id, level, title, message }) {
  return $('<section>', { class: 'notice-list level-' + level, id }).append(
    $('<h4>', { html: title }),
    $('<div>', { html: message })
  )
}

/**
 * @module specialNotice 特别通知
 */
var specialNotice = function () {
  getNotice(data => {
    var noticeContainer = $('<div>', { class: 'ipe-notice-container' }),
      noticeList = []
    $.each(data, (_, item) => {
      if (!isViewed(item)) {
        noticeList.push(makeList(item))
      }
    })

    console.info('[InPageEdit] Notice list', noticeList)

    // 没有未读消息
    if (noticeList.length < 1) return

    noticeContainer.append(noticeList)
    ssi_modal.show({
      className: 'in-page-edit ipe-special-notice',
      sizeClass: 'dialog',
      outSideClose: false,
      center: true,
      title: _msg('version-notice-title'),
      content: noticeContainer,
      buttons: [
        {
          label: _msg('updatelog-dismiss'),
          className: 'btn btn-single',
          method(e, modal) {
            modal.close()
            $.each(noticeList, (_, item) => {
              setLocal(item)
            })
          },
        },
      ],
    })
  })
}

module.exports = {
  specialNotice,
  getNotice,
}
