/*
 * This is an internal configuration file.
 * If you want to change some configurable values, use the '/customize/application_config.js'
 * file (make a copy from /customize.dist/application_config.js)
 */
define(function() {
    var config = {};

    /* Select the buttons displayed on the main page to create new collaborative sessions
     * Existing types : pad, code, poll, slide
     */
    config.availablePadTypes = ['drive', 'pad', 'code', 'slide', 'poll', 'whiteboard', 'file', 'todo', 'contacts'];
    config.registeredOnlyTypes = ['file', 'contacts'];

    /*  Cryptpad apps use a common API to display notifications to users
     *  by default, notifications are hidden after 5 seconds
     *  You can change their duration here (measured in milliseconds)
     */
    config.notificationTimeout = 5000;
    config.disableUserlistNotifications = false;
    config.hideLoadingScreenTips = false;

    config.enablePinning = true;

    // Update the default colors available in the whiteboard application
    config.whiteboardPalette = [
        '#000000', // black
        '#FFFFFF', // white
        '#848484', // grey
        '#8B4513', // saddlebrown
        '#FF0000', // red
        '#FF8080', // peach?
        '#FF8000', // orange
        '#FFFF00', // yellow
        '#80FF80', // light green
        '#00FF00', // green
        '#00FFFF', // cyan
        '#008B8B', // dark cyan
        '#0000FF', // blue
        '#FF00FF', // fuschia
        '#FF00C0', // hot pink
        '#800080', // purple
    ];

    // Background color in the apps with centered content:
    // - file app in view mode
    // - rich text app when editor's width reduced in settings
    config.appBackgroundColor = '#666';

    // Set enableTemplates to false to remove the button allowing users to save a pad as a template
    // and remove the template category in CryptDrive
    config.enableTemplates = true;

    // Set enableHistory to false to remove the "History" button in all the apps.
    config.enableHistory = true;

    /*  user passwords are hashed with scrypt, and salted with their username.
        this value will be appended to the username, causing the resulting hash
        to differ from other CryptPad instances if customized. This makes it
        such that anyone who wants to bruteforce common credentials must do so
        again on each CryptPad instance that they wish to attack.

        WARNING: this should only be set when your CryptPad instance is first
        created. Changing it at a later time will break logins for all existing
        users.
    */
    config.loginSalt = '';
    config.minimumPasswordLength = 8;

    // Amount of time (ms) before aborting the session when the algorithm cannot synchronize the pad
    config.badStateTimeout = 30000;

    // Customize the icon used for each application.
    // You can update the colors by making a copy of /customize.dist/src/less2/include/colortheme.less
    config.applicationsIcon = {
        file: 'fa-file-text-o',
        pad: 'fa-file-word-o',
        code: 'fa-file-code-o',
        slide: 'fa-file-powerpoint-o',
        poll: 'fa-calendar',
        whiteboard: 'fa-paint-brush',
        todo: 'fa-tasks',
        contacts: 'fa-users',
    };

    // Ability to create owned pads and expiring pads through a new pad creation screen.
    // The new screen can be disabled by the users in their settings page
    config.displayCreationScreen = true;

    // Prevent anonymous users from storing pads in their drive
    config.disableAnonymousStore = false;

    // Hide the usage bar in settings and drive
    //config.hideUsageBar = true;

    // Disable feedback for all the users and hide the settings part about feedback
    //config.disableFeedback = true;

    // Add new options in the share modal (extend an existing tab or add a new tab).
    // More info about how to use it on the wiki:
    // https://github.com/xwiki-labs/cryptpad/wiki/Application-config#configcustomizeshareoptions
    //config.customizeShareOptions = function (hashes, tabs, config) {};

    // Add code to be executed on every page before loading the user object. `isLoggedIn` (bool) is
    // indicating if the user is registered or anonymous. Here you can change the way anonymous users
    // work in CryptPad, use an external SSO or even force registration
    // *NOTE*: You have to call the `callback` function to continue the loading process
    //config.beforeLogin = function(isLoggedIn, callback) {};

    // Add code to be executed on every page after the user object is loaded (also work for
    // unregistered users). This allows you to interact with your users' drive
    // *NOTE*: You have to call the `callback` function to continue the loading process
    //config.afterLogin = function(api, callback) {};

    // Disabling the profile app allows you to import the profile informations (display name, avatar)
    // from an external source and make sure the users can't change them from CryptPad.
    // You can use config.afterLogin to import these values in the users' drive.
    //config.disableProfile = true;

    return config;
});
