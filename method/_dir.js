/**
 * @method getDir
 * @return {String} 插件CDN的URL路径，结尾没有/
 *
 * @description 注意，如果您想自己自己托管InPageEdit，_dir可以直接返回您的URL
 *              例如 const _dir = 'https://yourdomain.com/inpageedit'
 */

function getDir() {
  var thisScript = document.currentScript.src
  var thisUrl = thisScript.split('/dist/')[0]
  thisUrl = thisUrl.split('/dev/')[0]
  return thisUrl
}

/**
 * @constant {String} _dir CDN URL
 */
const _dir = getDir()

// const _dir = require('../module/api').mainCDN

module.exports = _dir
