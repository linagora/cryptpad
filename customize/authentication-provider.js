define([
    '/common/common-realtime.js',
    '/common/common-constants.js',
], function (Realtime, Constants) {
    var AuthenticationProvider = {},
        isRegistering;

    /**
     * Currently it seems we need to do all this on top of the register process 
     * to login the user and 'finish setting up the account' (?)
     * Most things should be removable after CryptPad's next release in 2018-02.
    **/
    function finalizeRegistration(LocalStore, result, username) {
        var proxy = result.proxy;

        LocalStore.eraseTempSessionValues();
        proxy.login_name = username;
        proxy[Constants.displayNameKey] = username;
        sessionStorage.createReadme = 1;
        LocalStore.setUserHash(result.userHash);
        proxy.edPublic = result.edPublic;
        proxy.edPrivate = result.edPrivate;
        proxy.curvePublic = result.curvePublic;
        proxy.curvePrivate = result.curvePrivate;

        proxy.profile =  {};
    }

    function setDisplayName(proxy, displayName) {
        if (!proxy || !displayName) { return; }
        proxy[Constants.displayNameKey] = displayName;
    }

    function continueLoginWhenSuccessful(LocalStore, Me, result, done) {
        return Realtime.whenRealtimeSyncs(result.realtime, function () {
            return LocalStore.login(result.userHash, result.userName, function() {
                setDisplayName(result.proxy, Me.fullname);
                if (done) { done(); }
            });
        });
    }

    function triggerRegistration(Login, LocalStore, Me, done) {
        isRegistering = true;

        Login.loginOrRegister(Me.email, Me.pkey, isRegistering, function(err, result) {
            if (err) {
                // UNHANDLED ERROR
                console.log("Error: ", err);
                return cb(err);
            }

            finalizeRegistration(LocalStore, result, Me.email);
            if (done) { done(); }
        });
    }

    AuthenticationProvider.triggerLoginOrRegister = function (callback) {
        require([
            '/customize/login.js',
            '/common/outer/local-store.js',
            '/api/me'
        ], function (Login, LocalStore, Me) {
            isRegistering = false;

            Login.loginOrRegister(Me.email, Me.pkey, isRegistering, function(err, result) {
                var loginFollowup = continueLoginWhenSuccessful.bind(this, LocalStore, Me);
                if (!err) {
                    return loginFollowup(result, callback);
                }

                if (err && err === 'NO_SUCH_USER') {
                    return triggerRegistration(Login, LocalStore, Me, loginFollowup.bind(this, result, callback));
                }
                
                // UNHANDLED ERROR
                console.log('Unhandled error');
                return callback(err);
            });
        });
    };

    return AuthenticationProvider;
});
