/**
 * @module stepModal 分步走模态框
 *
 * @param {Object} params
 * @param {Array} params.contents Modal contents { title: String, content: String, method: Function }
 * @param {Number} params.step From step, 1 means first one
 * @param {String} params.btnBefore
 * @param {String} params.btnAfter
 * @param {String} param.btnDone
 * @param {Function} param.afterDone
 * @param {Function} param.onShow
 *
 * @return {Promise} After done
 * @return {Object} $modal Modal Obj
 *
 * @example stepModal([{
 *   title: 'step 1 title',
 *   content: 'step 1 content',
 *   method(modal) {}
 * }]).then(()=>console.log('done'))
 */
var stepModal = params => {
  var $def = $.Deferred()
  var {
    title,
    content,
    contents,
    step,
    btnBefore,
    btnAfter,
    btnDone,
    afterDone,
    onShow,
  } = params

  // 规范变量
  contents = contents || content
  if (typeof contents !== 'object')
    throw 'stepModal contents type error: Unexpected type ' + typeof contents
  if (contents.length < 1) throw 'stepModal missing contents'
  $.each(contents, (key, val) => {
    if (typeof val === 'string') val = { content: val }
    if (!val.title) val.title = title || ''
    if (!val.content) val.content = ''
    contents[key] = val
  })
  step = step || 1
  if (isNaN(step) || step < 1) step = 1
  if (!contents[step]) step = 1

  // content 数组前插一位，方便处理以下逻辑：
  // step1 指的就是第一步，而不是数组的第二个
  try {
    contents.unshift(0)
  } catch (e) {
    console.error('stepModal unknown error', e)
    return
  }
  var allSteps = contents.length - 1

  var $modal = ssi_modal
    .createObject({
      center: 1,
      className:
        'in-page-edit ipe-stepModal ' +
        (params.className ? params.className : ''),
      sizeClass: params.sizeClass || 'small',
      outSideClose: 0,
      onShow(modal) {
        onShow && onShow(modal)
      },
    })
    .init()
  var $modalObj = $(document.getElementById($modal.modalId))

  $modal.setButtons([
    {
      label: btnBefore ? btnBefore : '← before',
      className: 'btn btn-secondary btn-before',
      side: 'left',
      method: before,
    },
    {
      label: btnAfter ? btnAfter : 'after →',
      className: 'btn btn-secondary btn-after',
      method: after,
    },
    {
      label: btnDone ? btnDone : 'done √',
      className: 'btn btn-primary btn-done',
      method(e, modal) {
        modal.close()
        $def.resolve()
        afterDone && afterDone()
      },
    },
  ])

  var $btnBefore = $modalObj.find('.btn-before'),
    $btnAfter = $modalObj.find('.btn-after'),
    $btnDone = $modalObj.find('.btn-done')

  // 设定初始状态
  $btnDone.hide()
  if (step === 1) $btnBefore.hide()
  if (step === allSteps) {
    $btnAfter.hide()
    $btnDone.show()
  }
  $modalObj.find('.ssi-closeIcon').hide()

  /**
   * @function setStep
   * @param {Number} step
   */
  function setStep(step) {
    $modal.setTitle(`${contents[step].title} (${step}/${allSteps})`)
    $modal.setContent(contents[step].content)
    if (contents[step].method && typeof contents[step].method === 'function')
      contents[step].method($modal)
  }

  /**
   * @function before
   */
  function before(modal) {
    var $btn = $(modal.target)
    if (step <= 1) return (step = 1)

    $btnAfter.show()
    $btnDone.hide()

    step--
    setStep(step)

    if (step <= 1) $btn.hide()
  }

  /**
   * @function after
   */
  function after(modal) {
    var $btn = $(modal.target)
    if (step >= allSteps) return (step = allSteps)

    $btnBefore.show()

    step++
    setStep(step)

    if (step >= allSteps) {
      $btn.hide()
      $btnDone.show()
    }
  }

  // init
  $modal.show()
  setStep(step)

  $def.$modal = $modal
  return $def
}

module.exports = {
  stepModal,
}
