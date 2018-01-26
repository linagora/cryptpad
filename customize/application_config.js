/*
 * You can override the configurable values from this file.
 * The recommended method is to make a copy of this file (/customize.dist/application_config.js)
   in a 'customize' directory (/customize/application_config.js).
 * If you want to check all the configurable values, you can open the internal configuration file
   but you should not change it directly (/common/application_config_internal.js)
*/
define([
    '/common/application_config_internal.js',
    '/customize/authentication-provider.js',
    '/common/outer/local-store.js',
    '/api/config'
], function (AppConfig, AuthenticationProvider, LocalStore, ServerConfig) {

  AppConfig.availablePadTypes = ['drive', 'pad', 'code', 'slide'];
  AppConfig.registeredOnlyTypes = [];
  AppConfig.disableFeedback = true;
  AppConfig.disableProfile = true;

  AppConfig.beforeLogin = function(isLoggedIn, callback) {
    if (!isLoggedIn && ServerConfig.delegatedIdentityManagement) {
      AuthenticationProvider.triggerLogin(callback);
    } else {
      callback();
    }
  };

  AppConfig.getAvatarUri = function(accountName) {
    return ServerConfig.openpaasAPIBaseUri + '/avatars?email=' + encodeURIComponent(accountName);
  }

  function setAvatarFromOpenPaaS(getAvatarUri) {
    return function(api, callback) {
      var avatarUri = getAvatarUri(LocalStore.getAccountName());
      api.setAvatar(avatarUri, callback);
    };
  }

  AppConfig.afterLogin = setAvatarFromOpenPaaS(AppConfig.getAvatarUri);

  return AppConfig;
});
