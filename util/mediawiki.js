const mediawiki = {
  config: mw.config.get(),
  getUrl: mw.util.getUrl,
  mwApi: mw.util.wikiScript('api'),
  wikiScript: mw.util.wikiScript(),
  editToken:
    mw.user.tokens.get('csrfToken') || mw.user.tokens.get('editToken') || '+\\',
}

// Alias
mediawiki.conf = mediawiki.config
mediawiki.csrfToken = mediawiki.editToken

module.exports = mediawiki
