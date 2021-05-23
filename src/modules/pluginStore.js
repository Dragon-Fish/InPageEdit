// const _dir = require('../method/_dir');
// const { _msg } = require('./_msg');
const pluginCDN = require('./api.json').pluginCDN;

/**
 * @module pluginStore 加载InPageEdit插件
 */
var pluginStore = {
  /**
   * @module pluginStore.get 获取官方插件
   */
  get() {
    return $.ajax({
      url: pluginCDN + '/index.json',
      dataType: 'json',
      crossDomain: true,
      cache: false
    })
  },
  saveCache(data) {
    var ipe = window.InPageEdit || {}
    ipe.cache = ipe.cache || {}
    ipe.cache.pluginList = data
    window.InPageEdit = ipe
  },
  loadCache() {
    var ipe = window.InPageEdit || {}
    ipe.cache = ipe.cache || {}
    return ipe.cache.pluginList
  },
  /**
   * @module pluginStore.load 载入插件
   * @param {String} name 
   */
  load(name) {
    if (/^https?:\/\//.test(name)) {
      mw.loader.load(name);
      console.info('[InPageEdit] 从远程加载非官方插件', name)
    } else {
      const { loadScript } = require('../methods/loadScript')
      loadScript(pluginCDN + '/plugins/' + name).then(
        () => console.info('[InPageEdit] 插件 ' + name + ' 加载成功'),
        err => console.warn('[InPageEdit] 插件 ' + name + ' 加载失败', err)
      )
      console.info('[InPageEdit] 从官方插件商店加载插件', name)
    }
  },
  /**
   * @module pluginStore.initUserPlugin 初始化用户插件
   */
  initUserPlugin() {
    const { preference } = require('./preference')
    var userPlugins = preference.get('plugins')
    if (typeof userPlugins === 'object' && userPlugins.length > 0) {
      $.each(userPlugins, (key, val) => {
        pluginStore.load(val)
      })
    }
  }
}

module.exports = {
  pluginStore
}