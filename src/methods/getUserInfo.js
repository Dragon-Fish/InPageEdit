var mwApi = new mw.Api();

var getUserInfo = function () {
  /**
 * @description 获取用户权限信息
 */
  mwApi.getUserInfo().then(
    data => {
      console.info('[InPageEdit] 成功获取用户权限信息');
      mw.config.set('wgUserRights', data.rights);
    },
    error => {
      console.warn('[InPageEdit] 警告：无法获取用户权限信息', error);
      mw.config.set('wgUserRights', []);
    }
  );

  /**
   * @description 获取封禁状态
   */
  if (mw.config.get('wgUserName') !== null) {
    mwApi.get({
      action: 'query',
      list: 'users',
      usprop: 'blockinfo',
      ususers: mw.config.get('wgUserName')
    }).then(data => {
      if (data.query.users[0].blockid) {
        mw.config.set('wgUserIsBlocked', true);
      } else {
        mw.config.set('wgUserIsBlocked', false);
      }
    });
  }
}

module.exports = {
  getUserInfo
}