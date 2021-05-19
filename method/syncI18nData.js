var config = mw.config.get()

const _dir = require('./_dir')

// 设置
const cacheTime = 2 * 60 * 60 * 1000
const cacheUrl = _dir + '/i18n/languages.json'
const funcName = 'InPageEdit'
const localCacheName = 'i18n-cache-' + funcName + '-content'
const localCacheTime = 'i18n-cache-' + funcName + '-timestamp'

/**
 * @method i18n Get i18n data
 * @param {Boolean} noCache true - forced no cache
 */
async function syncI18nData(noCache) {
  const now = new Date().getTime()
  // 如果语言为 qqx，不返回任何东西
  if (config.wgUserLanguage === 'qqx') {
    console.warn('[InPageEdit] User language is qqx')
    return true
  }
  // 缓存存在且缓存未过期
  if (
    localStorage.getItem(localCacheName) &&
    now - localStorage.getItem(localCacheTime) < cacheTime &&
    !noCache
  ) {
    var json = {}
    try {
      json = JSON.parse(localStorage.getItem(localCacheName))
    } catch (e) {
      console.warn('[InPageEdit] i18n 数据不合法')
      await getOriginalData()
      return true
    }
    if (json.en) {
      return true
    } else {
      console.warn('[InPageEdit] i18n 数据可能已损坏')
      await getOriginalData()
      return true
    }
  } else {
    await getOriginalData()
    return true
  }
}

/**
 * @function saveToCache
 */
function saveToCache(data) {
  const now = new Date().getTime()
  data = JSON.stringify(data)
  localStorage.setItem(localCacheName, data)
  localStorage.setItem(localCacheTime, now)
}

/**
 * @function getOriginalData
 */
async function getOriginalData() {
  console.time('[InPageEdit] 从远程获取 i18n 数据')
  var data = await $.getJSON(cacheUrl, {
    cache: false,
    timestamp: new Date().getTime(),
  })
  if (typeof data !== 'object') data = {}
  saveToCache(data)
  console.timeEnd('[InPageEdit] 从远程获取 i18n 数据')
  return data
}

module.exports = {
  syncI18nData,
}
