const _options = () => {
  return {
    url: require('./mediawiki').mwApi,
    format: 'json',
    errorformat: 'plaintext',
    errorsuselocal: 1,
  }
}

function apiGet(opt) {
  return ajax('get', opt)
}

function apiPost(opt) {
  return ajax('post', opt)
}

function apiPostWithToken(token, opt = {}) {
  opt.token = mw.user.tokens.get(token)
  return ajax('post', opt)
}

function ajax(method, opt) {
  return new Promise((resolve, reject) => {
    opt = $.extend(_options(), { method }, opt)
    $.ajax(opt).then(resolve, reject)
  })
}

module.exports = {
  apiGet,
  apiPost,
  apiPostWithToken,
}
