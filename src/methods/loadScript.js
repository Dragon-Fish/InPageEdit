var loadScript = function (src, noCache) {
  return $.ajax({
    url: src,
    dataType: 'script',
    crossDomain: true,
    cache: !noCache
  });
}

module.exports = {
  loadScript
}