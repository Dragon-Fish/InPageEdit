/**
 * @method getDir
 * @return {String} 插件CDN的URL路径，结尾没有/
 * 
 * @description 注意，如果您想自己自己托管InPageEdit，_dir可以直接返回您的URL
 *              例如 const _dir = https://yourdomain.com/inpageedit
 */
function getDir() {
  var thisScript = document.currentScript.src;
  var thisUrl = thisScript.split('/');
  // 理论上入口文件位于 /dist/*.js
  // 因此删掉最后两位路径
  thisUrl.pop();
  thisUrl.pop();
  thisUrl = thisUrl.join('/');
  return thisUrl;
}

/**
 * @constant {String} _dir CDN URL
 */
const _dir = getDir();

module.exports = _dir;