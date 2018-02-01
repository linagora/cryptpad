define([], function () {
    var AuthenticationProvider = {};
    
    AuthenticationProvider.triggerLogin = function (callback) {
        require([
            '/customize/login.js',
            '/common/outer/local-store.js',
            '/api/me'
        ], function (Login, LocalStore, Me) {
            Login.loginOrRegister(Me.email, Me.pkey, false, function(err, result) {
                if (err) {
                    // Unhandled error
                    return callback('error');
                }

                LocalStore.login(result.userHash, result.userName, callback);
                return;
            });
        });
    };

    return AuthenticationProvider;
});
