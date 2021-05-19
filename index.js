/**
 * @license GPL-3.0 GNU GENERAL PUBLIC LICENSE 3.0
 *
 * @name InPageEdit
 * @description A useful MediaWiki JavaScript Plugin written with jQuery
 * @author 机智的小鱼君 Dragon-Fish <dragon-fish@qq.com>
 * @url https://github.com/InPageEdit/InPageEdit
 */

!(async function () {
  'use strict';

  // 创建 InPageEdit 变量
  var InPageEdit = window.InPageEdit || {};

  // 防止多次运行
  if (typeof InPageEdit.version !== 'undefined') {
    throw '[InPageEdit] InPageEdit 已经在运行了';
  }

  // 初始化插件
  var init = require('./method/init');

  var mainFunctions = await init();

  // 合并入全局变量
  window.InPageEdit = $.extend({}, window.InPageEdit, mainFunctions);

})();
