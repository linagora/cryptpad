define([
    '/common/common-interface.js',
    '/customize/messages.js',
    '/customize/utils.js',
    '/common/hyperscript.js',
    '/common/outer/local-store.js',
], function (UI, Messages, Utils, h, LocalStore) {
    var customShare = {};

    customShare.getTab = function(openpaasEmailShareUrl, hashes, padConfig, callback) {
        var openpaasShareTabContent = h('div', [
            h('label', Messages.share_linkAccess),
            h('br'),
            h('input#cp-op-share-editable-true.cp-share-editable-value', {
                type: 'radio',
                name: 'cp-op-share-editable',
                value: 1,
                checked: 'checked'
            }),
            h('label', { 'for': 'cp-op-share-editable-true' }, Messages.share_linkEdit),
            h('input#cp-op-share-editable-false.cp-share-editable-value', {
                type: 'radio',
                name: 'cp-op-share-editable',
                value: 0
            }),
            h('label', { 'for': 'cp-op-share-editable-false' }, Messages.share_linkView),
            h('br'),
        ]);

        if (!hashes.editHash) {
            $(openpaasShareTabContent).find('#cp-op-share-editable-false').attr('checked', true);
            $(openpaasShareTabContent).find('#cp-op-share-editable-true').attr('disabled', true);
        }

        var getLinkValue = function () {
            var edit = $(openpaasShareTabContent).find('#cp-op-share-editable-true').is(':checked');
            var hash = (edit && hashes.editHash) ? hashes.editHash : hashes.viewHash;
            var href = padConfig.origin + padConfig.pathname + '#' + hash;
            return href;
        };

        var getPadRightsNote = function() {
            var editRights = $(openpaasShareTabContent).find('#cp-op-share-editable-true').is(':checked');
            return (editRights ? Messages.share_openpaasEditRightsNote : Messages.share_openpaasReadOnlyRightsNote );
        };

        var linkButtons = [{
            name: Messages.cancel,
            onClick: function () {},
            keys: [27]
        },{
            name: Messages.share_openpaasLink,
            onClick: function () {
                var emailBody = Messages._getKey('share_openpaasEmailContent', [getLinkValue(), getPadRightsNote()]);
                var jsonMailtoObject = {
                    subject: Messages.share_openpaasEmailSubject,
                    textBody: emailBody,
                    htmlBody: emailBody
                };
                var fullShareLink = openpaasEmailShareUrl + encodeURIComponent(JSON.stringify(jsonMailtoObject));
                Utils.openCenteredPopup(fullShareLink, 'share-by-email', 600, 400);
            },
            keys: [13]
        }];

        var tab = {
            title: Messages.share_openpaasCategory,
            content: UI.dialog.customModal(openpaasShareTabContent, {buttons: linkButtons})
        };

        return callback(tab);
    };

    return customShare;
});