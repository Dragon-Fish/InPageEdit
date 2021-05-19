var config = mw.config.get()
var api = require('./api.json')

/**
 * @module _analysis 提交统计信息模块
 * @param {String} functionID 模块ID，例如 quick_edit
 */
const _analysis = function(functionID) {
  if (preference.get('shareMyInfo') !== true) {
    return
  }
  var submitdata = {
    url: config.wgServer + config.wgArticlePath.replace('$1', ''),
    sitename: config.wgSiteName,
    username: config.wgUserName,
    function: functionID,
  }
  $.ajax({
    url: api.analysis,
    data: submitdata,
    type: 'post',
    dataType: 'json',
  }).done(function(data) {
    console.log(
      '[InPageEdit] Analysis response',
      'Status: ' + data.status,
      data.msg
    )
  })
}

module.exports = {
  _analysis,
}
