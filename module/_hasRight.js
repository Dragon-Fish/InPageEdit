var config = mw.config.get()

/**
 * @module _hasRight 是否拥有权限
 * @param {String} right
 * @return {Boolean}
 */
const _hasRight = function (right) {
  if (config.wgUserIsBlocked === true) {
    return false
  }
  if (mw.config.get('wgUserRights').indexOf(right) > -1) {
    return true
  } else {
    return false
  }
}

module.exports = {
  _hasRight,
}
