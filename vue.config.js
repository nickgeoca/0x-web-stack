module.exports = {
  lintOnSave: false,
  devServer: {
    disableHostCheck: true
  },
  pluginOptions: {
    i18n: {
      locale: 'en',
      fallbackLocale: 'en',
      localeDir: 'locales',
      enableInSFC: false
    }
  },
  css: {
    // Enable CSS source maps.
    sourceMap: true
  }
};
