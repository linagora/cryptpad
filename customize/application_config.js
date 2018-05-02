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
    '/common/common-constants.js',
    '/api/config',
    '/customize/delta-words.js'
], function (AppConfig, AuthenticationProvider, Constants, ServerConfig, Delta) {

  AppConfig.availablePadTypes = ['drive', 'pad', 'code', 'slide', 'todo', 'poll'];
  AppConfig.registeredOnlyTypes = [];
  AppConfig.disableFeedback = true;
  AppConfig.disableProfile = true;
  AppConfig.hideUsageBar = true;

  AppConfig.beforeLogin = function(isLoggedIn, callback) {
    if (!isLoggedIn && ServerConfig.delegatedIdentityManagement) {
      return AuthenticationProvider.triggerLoginOrRegister(callback);
    }

    return callback();
  };
  
  if (ServerConfig.openpaasEmailShareUrl) {
    AppConfig.customizeShareOptions = function () {};
    require([
      '/customize/custom-share.js'
    ], function (CustomShare) {
      // let's add a new tab in the share modal
      AppConfig.customizeShareOptions = function(hashes, tabs, padConfig) {
        CustomShare.getTab(ServerConfig.openpaasEmailShareUrl, hashes, padConfig, function(newTab) {
          tabs.splice(0, 0, newTab);
        });
      }
    });  
  }

  AppConfig.getAvatarUri = function(accountName) {
    return ServerConfig.openpaasAPIBaseUri + '/avatars?email=' + encodeURIComponent(accountName);
  }

  function setAvatarFromOpenPaaS(getAvatarUri) {
    return function(api, callback) {
      var avatarUri = getAvatarUri(localStorage.getItem(Constants.userNameKey));
      api.setAvatar(avatarUri, callback);
    };
  }

  AppConfig.afterLogin = setAvatarFromOpenPaaS(AppConfig.getAvatarUri);

  AppConfig.customizeLogout = function postLogoutHook(callback) {
    window.location.replace(ServerConfig.ssoLogoutUri);
  };

  AppConfig.textAnalyzer = function (getter, padMetadataMgr, id) {
    Delta(getter, function (words) {
      if (!words.length) { return; }

      var padTitle = padMetadataMgr.getMetadata().title;
      if (!padTitle) { return; }

      var titleSplitted = padTitle.split(" ");

      if (titleSplitted[titleSplitted.length - 2] !== ">") { return; };

      var meetingId = titleSplitted[titleSplitted.length - 1];

      var data = {
          words: words,
          id: meetingId,
      };

      $.ajax({
        type: 'POST',
        url: ServerConfig.wordExtractionServerUrl,
        data: $.param(data),
        dataType: 'json',
        crossDomain: true,
        success: function () { console.log("success"); },
        error: function (e) {
          // TODO if error, save words which weren't posted until next time
          console.error(e);
        },
      });
    }, ServerConfig.wordExtractionSendingInterval);
  };

  return AppConfig;
});
