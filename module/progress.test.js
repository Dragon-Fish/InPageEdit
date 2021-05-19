var _msg = (s) => s
var sleep = (delay) => {
  if (isNaN(Number(delay)) || delay < 0) delay = 0
  return new Promise((next) => {
    setTimeout(next, delay)
  })
}
var $progress =
  '<div class="ipe-progress" style="width: 100%"><div class="ipe-progress-bar"></div></div>'

class Progress {
  #getThis = () => this

  /**
   * @constructor
   * @param {String} title
   */
  constructor(title) {
    this.title = title || 'Loading...'
    // this.getThis = () => this

    // 处理模态框
    this.modal = ssi_modal.createObject({})

    // 选项
    this.modal.setOptions('center', true)
    this.modal.setOptions('className', 'in-page-edit ipe-progress')
    this.modal.setOptions('outSideClose', false)
    // this.modal.setOptions()
    this.modal.init()

    // 内容
    this.$progress = $($progress)
    this.modal.setTitle(title)
    this.modal.setContent($progress)

    this.modal.show()
  }

  setTitle(title) {
    this.modal.setTitle(title)
  }
  setStatus(status) {
    const self = getThis()
    if (status) {
      self.$progress.addClass('done')
    } else {
      self.$progress.removeClass('done')
    }
  }
  async done(msg, delay) {
    const self = this.getThis()
    this.setStatus(true)
    this.setTitle(msg || _msg('done'))
    if (delay) {
      await sleep(delay)
      self.close()
    }
  }
  close() {
    this.modal.close()
  }
}

var p = new Progress('加载中……')
