// 导入方法
const _dir = require('./_dir');
const { loadScript } = require('./loadScript');
const { getUserInfo } = require('./getUserInfo');
const { loadStyles } = require('./loadStyles');
const { updateNotice } = require('./updateNotice');
const { syncI18nData } = require('./syncI18nData');

const version = require('../modules/version');


/**
 * @method initMain
 * @return {Object} InPageEdit
 */
module.exports = async function init() {

  mw.hook('InPageEdit.init.before').fire();

  // Await MediaWiki
  await mw.loader.using(['mediawiki.api', 'mediawiki.util', 'mediawiki.user']);

  // 是否需要刷新缓存
  const purgeCache = Boolean(
    mw.util.getParamValue('ipe', location.href) === 'nocache' ||
    version !== localStorage.getItem('InPageEditVersion')
  )

  // 加载样式表
  loadStyles(purgeCache);

  // 等待 i18n 缓存
  await syncI18nData(purgeCache);

  mw.hook('InPageEdit.init.i18n').fire({ _msg: require('../modules/_msg')._msg })

  // 等待前置插件
  await loadScript(_dir + '/src/ssi_modal/ssi-modal.min.js');

  mw.hook('InPageEdit.init.modal').fire({ ssi_modal: window.ssi_modal });

  // 导入全部模块
  const { _analysis } = require('../modules/_analysis');
  const { _msg } = require('../modules/_msg');
  const { about } = require('../modules/about');
  const api = require('../modules/api.json');
  const { articleLink } = require('../modules/articleLink');
  const { findAndReplace } = require('../modules/findAndReplace');
  const { loadQuickDiff } = require('../modules/loadQuickDiff');
  const { preference } = require('../modules/preference');
  const { pluginStore } = require('../modules/pluginStore');
  const { progress } = require('../modules/progress');
  const { quickDelete } = require('../modules/quickDelete');
  const { quickDiff } = require('../modules/quickDiff');
  const { quickEdit } = require('../modules/quickEdit');
  const { quickPreview } = require('../modules/quickPreview');
  const { quickRedirect } = require('../modules/quickRedirect');
  const { quickRename } = require('../modules/quickRename');
  const { specialNotice } = require('../modules/specialNotice');
  const { versionInfo } = require('../modules/versionInfo');

  // 初始化前置模块
  preference.set();
  getUserInfo();
  loadQuickDiff();
  articleLink();
  updateNotice();

  // !暂定，触发用户插件
  pluginStore.initUserPlugin();

  // 写入模块
  var InPageEdit = {
    _dir,
    about,
    api,
    articleLink,
    findAndReplace,
    loadQuickDiff,
    preference,
    progress,
    quickDelete,
    quickDiff,
    quickEdit,
    quickPreview,
    quickRedirect,
    quickRename,
    specialNotice,
    version,
    versionInfo,
    // 别名 Alias
    fnr: findAndReplace,
    delete: quickDelete,
    diff: quickDiff,
    edit: quickEdit,
    preview: quickPreview,
    redirect: quickRedirect,
    quickMove: quickRename,
    rename: quickRename,
  }

  // 锁定重要变量
  var importantVariables = [
    '_dir',
    'api',
    'version',
  ];
  importantVariables.forEach(key => {
    try {
      Object.freeze(InPageEdit[key]);
    } catch (e) {
      // Do nothing
    }
  });

  // 触发钩子，传入上下文
  mw.hook('InPageEdit').fire({
    _analysis,
    _msg,
    InPageEdit
  });

  // 花里胡哨的加载提示
  console.info('    ____      ____                   ______    ___ __ \n   /  _/___  / __ \\____ _____ ____  / ____/___/ (_) /_\n   / // __ \\/ /_/ / __ `/ __ `/ _ \\/ __/ / __  / / __/\n _/ // / / / ____/ /_/ / /_/ /  __/ /___/ /_/ / / /_  \n/___/_/ /_/_/    \\__,_/\\__, /\\___/_____/\\__,_/_/\\__/  \n                      /____/                v' + version);

  // 传回InPageEdit
  return InPageEdit;
}