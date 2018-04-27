require(['/api/config'], function (ApiConfig) {
    // see ckeditor_base.js getUrl()
    window.CKEDITOR_GETURL = function (resource) {
        if (resource.indexOf( '/' ) === 0) {
            resource = window.CKEDITOR.basePath.replace(/\/bower_components\/.*/, '') + resource;
        } else if (resource.indexOf(':/') === -1) {
            resource = window.CKEDITOR.basePath + resource;
        }
        if (resource[resource.length - 1] !== '/' && resource.indexOf('ver=') === -1) {
            var args = ApiConfig.requireConf.urlArgs;
            if (resource.indexOf('/bower_components/') !== -1) {
                args = 'ver=' + window.CKEDITOR.timestamp;
            }
            resource += (resource.indexOf('?') >= 0 ? '&' : '?') + args;
        }
        return resource;
    };
    require(['/bower_components/ckeditor/ckeditor.js']);
});
define([
    'jquery',
    '/bower_components/hyperjson/hyperjson.js',
    '/common/sframe-app-framework.js',
    '/common/cursor.js',
    '/common/TypingTests.js',
    '/customize/messages.js',
    '/pad/links.js',
    '/bower_components/nthen/index.js',
    '/common/media-tag.js',
    '/api/config',
    '/common/common-hash.js',
    '/common/common-util.js',
    '/bower_components/chainpad/chainpad.dist.js',
    '/customize/application_config.js',

    '/bower_components/diff-dom/diffDOM.js',

    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'less!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/customize/src/less2/main.less',
], function (
    $,
    Hyperjson,
    Framework,
    Cursor,
    TypingTest,
    Messages,
    Links,
    nThen,
    MediaTag,
    ApiConfig,
    Hash,
    Util,
    ChainPad,
    AppConfig)
{
    var DiffDom = window.diffDOM;

    var slice = function (coll) {
        return Array.prototype.slice.call(coll);
    };

    var removeListeners = function (root) {
        slice(root.attributes).map(function (attr) {
            if (/^on/.test(attr.name)) {
                root.attributes.removeNamedItem(attr.name);
            }
        });
        slice(root.children).forEach(removeListeners);
    };

    var hjsonToDom = function (H) {
        var dom = Hyperjson.toDOM(H);
        removeListeners(dom);
        return dom;
    };

    var module = window.REALTIME_MODULE = window.APP = {
        Hyperjson: Hyperjson,
        logFights: true,
        fights: [],
        Cursor: Cursor,
    };

    var isNotMagicLine = function (el) {
        return !(el && typeof(el.getAttribute) === 'function' &&
            el.getAttribute('class') &&
            el.getAttribute('class').split(' ').indexOf('non-realtime') !== -1);
    };

    var hjsonFilters = function (hj) {
        /* catch `type="_moz"` before it goes over the wire */
        var brFilter = function (hj) {
            if (hj[1].type === '_moz') { hj[1].type = undefined; }
            return hj;
        };
        var mediatagContentFilter = function (hj) {
            if (hj[0] === 'MEDIA-TAG') { hj[2] = []; }
            return hj;
        };
        brFilter(hj);
        mediatagContentFilter(hj);
        return hj;
    };

    var domFromHTML = function (html) {
        return new DOMParser().parseFromString(html, 'text/html');
    };

    var forbiddenTags = [
        'SCRIPT',
        //'IFRAME',
        'OBJECT',
        'APPLET',
        //'VIDEO',
        //'AUDIO'
    ];

    var getHTML = function (inner) {
        return ('<!DOCTYPE html>\n' + '<html>\n' + inner.innerHTML);
    };

    var CKEDITOR_CHECK_INTERVAL = 100;
    var ckEditorAvailable = function (cb) {
        var intr;
        var check = function () {
            if (window.CKEDITOR) {
                clearTimeout(intr);
                cb(window.CKEDITOR);
            }
        };
        intr = setInterval(function () {
            console.log("Ckeditor was not defined. Trying again in %sms", CKEDITOR_CHECK_INTERVAL);
            check();
        }, CKEDITOR_CHECK_INTERVAL);
        check();
    };

    var mkDiffOptions = function (cursor, readOnly) {
        return {
            preDiffApply: function (info) {
                /*
                    Don't accept attributes that begin with 'on'
                    these are probably listeners, and we don't want to
                    send scripts over the wire.
                */
                if (['addAttribute', 'modifyAttribute'].indexOf(info.diff.action) !== -1) {
                    if (info.diff.name === 'href') {
                        // console.log(info.diff);
                        //var href = info.diff.newValue;

                        // TODO normalize HTML entities
                        if (/javascript *: */.test(info.diff.newValue)) {
                            // TODO remove javascript: links
                        }
                    }

                    if (/^on/.test(info.diff.name)) {
                        console.log("Rejecting forbidden element attribute with name (%s)", info.diff.name);
                        return true;
                    }
                }
                /*
                    Also reject any elements which would insert any one of
                    our forbidden tag types: script, iframe, object,
                        applet, video, or audio
                */
                if (['addElement', 'replaceElement'].indexOf(info.diff.action) !== -1) {
                    if (info.diff.element && forbiddenTags.indexOf(info.diff.element.nodeName) !== -1) {
                        console.log("Rejecting forbidden tag of type (%s)", info.diff.element.nodeName);
                        return true;
                    } else if (info.diff.newValue && forbiddenTags.indexOf(info.diff.newValue.nodeType) !== -1) {
                        console.log("Rejecting forbidden tag of type (%s)", info.diff.newValue.nodeName);
                        return true;
                    }
                }

                if (info.node && info.node.tagName === 'BODY') {
                    if (info.diff.action === 'removeAttribute' &&
                        ['class', 'spellcheck'].indexOf(info.diff.name) !== -1) {
                        return true;
                    }
                }

                /* DiffDOM will filter out magicline plugin elements
                    in practice this will make it impossible to use it
                    while someone else is typing, which could be annoying.

                    we should check when such an element is going to be
                    removed, and prevent that from happening. */
                if (info.node && info.node.tagName === 'SPAN' &&
                    info.node.getAttribute('contentEditable') === "false") {
                    // it seems to be a magicline plugin element...
                    if (info.diff.action === 'removeElement') {
                        // and you're about to remove it...
                        // this probably isn't what you want

                        /*
                            I have never seen this in the console, but the
                            magic line is still getting removed on remote
                            edits. This suggests that it's getting removed
                            by something other than diffDom.
                        */
                        console.log("preventing removal of the magic line!");

                        // return true to prevent diff application
                        return true;
                    }
                }

                // Do not change the contenteditable value in view mode
                if (readOnly && info.node && info.node.tagName === 'BODY' &&
                    info.diff.action === 'modifyAttribute' && info.diff.name === 'contenteditable') {
                    return true;
                }

                cursor.update();

                // no use trying to recover the cursor if it doesn't exist
                if (!cursor.exists()) { return; }

                /*  frame is either 0, 1, 2, or 3, depending on which
                    cursor frames were affected: none, first, last, or both
                */
                var frame = info.frame = cursor.inNode(info.node);

                if (!frame) { return; }

                if (typeof info.diff.oldValue === 'string' && typeof info.diff.newValue === 'string') {
                    var pushes = cursor.pushDelta(info.diff.oldValue, info.diff.newValue);

                    if (frame & 1) {
                        // push cursor start if necessary
                        if (pushes.commonStart < cursor.Range.start.offset) {
                            cursor.Range.start.offset += pushes.delta;
                        }
                    }
                    if (frame & 2) {
                        // push cursor end if necessary
                        if (pushes.commonStart < cursor.Range.end.offset) {
                            cursor.Range.end.offset += pushes.delta;
                        }
                    }
                }
            },
            postDiffApply: function (info) {
                if (info.frame) {
                    if (info.node) {
                        if (info.frame & 1) { cursor.fixStart(info.node); }
                        if (info.frame & 2) { cursor.fixEnd(info.node); }
                    } else { console.error("info.node did not exist"); }

                    var sel = cursor.makeSelection();
                    var range = cursor.makeRange();

                    cursor.fixSelection(sel, range);
                }
            }
        };
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////

    var addToolbarHideBtn = function (framework, $bar) {
        // Expand / collapse the toolbar
        var cfg = {
            element: $bar.find('.cke_toolbox_main')
        };
        var onClick = function (visible) {
            $(window).trigger('resize');
            $(window).trigger('cryptpad-ck-toolbar');
            framework._.sfCommon.setAttribute(['pad', 'showToolbar'], visible);
        };
        framework._.sfCommon.getAttribute(['pad', 'showToolbar'], function (err, data) {
            if (typeof(data) === "undefined" || data) { $('.cke_toolbox_main').show(); }
            else { $('.cke_toolbox_main').hide(); }
            var $collapse = framework._.sfCommon.createButton('toggle', true, cfg, onClick);
            framework._.toolbar.$rightside.append($collapse);
        });
    };

    var displayMediaTags = function (framework, dom, mediaTagMap) {
        setTimeout(function () { // Just in case
            var tags = dom.querySelectorAll('media-tag:empty');
            Array.prototype.slice.call(tags).forEach(function (el) {
                MediaTag(el);
                $(el).on('keydown', function (e) {
                    if ([8,46].indexOf(e.which) !== -1) {
                        $(el).remove();
                        framework.localChange();
                    }
                });
                var observer = new MutationObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                        if (mutation.type === 'childList') {
                            var list_values = [].slice.call(el.children);
                            mediaTagMap[el.getAttribute('src')] = list_values;
                        }
                    });
                });
                observer.observe(el, {
                    attributes: false,
                    childList: true,
                    characterData: false
                });
            });
        });
    };

    var restoreMediaTags = function (tempDom, mediaTagMap) {
        var tags = tempDom.querySelectorAll('media-tag:empty');
        Array.prototype.slice.call(tags).forEach(function (tag) {
            var src = tag.getAttribute('src');
            if (mediaTagMap[src]) {
                mediaTagMap[src].forEach(function (n) {
                    tag.appendChild(n);
                });
            }
        });
    };

    var andThen2 = function (editor, Ckeditor, framework) {
        var mediaTagMap = {};
        var $bar = $('#cke_1_toolbox');
        var $html = $bar.closest('html');
        var $faLink = $html.find('head link[href*="/bower_components/components-font-awesome/css/font-awesome.min.css"]');
        if ($faLink.length) {
            $html.find('iframe').contents().find('head').append($faLink.clone());
        }

        var ml = Ckeditor.instances.editor1.plugins.magicline.backdoor.that.line.$;
        [ml, ml.parentElement].forEach(function (el) {
            el.setAttribute('class', 'non-realtime');
        });

        var ifrWindow = $html.find('iframe')[0].contentWindow;

        var documentBody = ifrWindow.document.body;

        var inner = window.inner = documentBody;

        var cursor = module.cursor = Cursor(inner);

        var openLink = function (e) {
            var el = e.currentTarget;
            if (!el || el.nodeName !== 'A') { return; }
            var href = el.getAttribute('href');
            if (href) {
                framework._.sfCommon.openUnsafeURL(href);
            }
        };

        framework.onEditableChange(function (unlocked) {
            if (!framework.isReadOnly()) {
                $(inner).attr('contenteditable', '' + Boolean(unlocked));
            }
            $(inner).css({ background: unlocked ? '#fff' : '#eee' });
        });

        framework.setMediaTagEmbedder(function ($mt) {
            $mt.attr('contenteditable', 'false');
            $mt.attr('tabindex', '1');
            editor.insertElement(new window.CKEDITOR.dom.element($mt[0]));
        });

        framework.setTitleRecommender(function () {
            var text;
            if (['h1', 'h2', 'h3'].some(function (t) {
                var $header = $(inner).find(t + ':first-of-type');
                if ($header.length && $header.text()) {
                    text = $header.text();
                    return true;
                }
            })) { return text; }
        });

        var DD = new DiffDom(mkDiffOptions(cursor, framework.isReadOnly()));

        // apply patches, and try not to lose the cursor in the process!
        framework.onContentUpdate(function (hjson) {
            if (!Array.isArray(hjson)) { throw new Error(Messages.typeError); }
            var userDocStateDom = hjsonToDom(hjson);

            userDocStateDom.setAttribute("contenteditable",
                inner.getAttribute('contenteditable'));

            restoreMediaTags(userDocStateDom, mediaTagMap);

            // Deal with adjasent text nodes
            userDocStateDom.normalize();
            inner.normalize();

            var patch = (DD).diff(inner, userDocStateDom);
            (DD).apply(inner, patch);
            displayMediaTags(framework, inner, mediaTagMap);
            if (framework.isReadOnly()) {
                var $links = $(inner).find('a');
                // off so that we don't end up with multiple identical handlers
                $links.off('click', openLink).on('click', openLink);
            }
        });

        framework.setTextContentGetter(function () {
            var innerCopy = inner.cloneNode(true);
            displayMediaTags(framework, innerCopy, mediaTagMap);
            innerCopy.normalize();
            $(innerCopy).find('*').each(function (i, el) {
                $(el).append(' ');
            });
            var str = $(innerCopy).text();
            str = str.replace(/\s\s+/g, ' ');
            return str;
        });
        framework.setContentGetter(function () {
            displayMediaTags(framework, inner, mediaTagMap);
            inner.normalize();
            return Hyperjson.fromDOM(inner, isNotMagicLine, hjsonFilters);
        });

        $bar.find('#cke_1_toolbar_collapser').hide();
        if (!framework.isReadOnly()) {
            addToolbarHideBtn(framework, $bar);
        } else {
            $('.cke_toolbox_main').hide();
        }

        framework.onReady(function (newPad) {
            if (!module.isMaximized) {
                module.isMaximized = true;
                $('iframe.cke_wysiwyg_frame').css('width', '');
                $('iframe.cke_wysiwyg_frame').css('height', '');
            }
            $('body').addClass('app-pad');

            editor.focus();
            if (newPad) {
                cursor.setToEnd();
            } else if (framework.isReadOnly()) {
                cursor.setToStart();
            }

            if (framework.isReadOnly()) {
                $(inner).attr('contenteditable', 'false');
            }

            var fmConfig = {
                ckeditor: editor,
                body: $('body'),
                onUploaded: function (ev, data) {
                    var parsed = Hash.parsePadUrl(data.url);
                    var hexFileName = Util.base64ToHex(parsed.hashData.channel);
                    var src = '/blob/' + hexFileName.slice(0,2) + '/' + hexFileName;
                    var mt = '<media-tag contenteditable="false" src="' + src + '" data-crypto-key="cryptpad:' + parsed.hashData.key + '" tabindex="1"></media-tag>';
                    editor.insertElement(window.CKEDITOR.dom.element.createFromHtml(mt));
                }
            };
            window.APP.FM = framework._.sfCommon.createFileManager(fmConfig);

            framework._.sfCommon.getAttribute(['pad', 'width'], function (err, data) {
                if (data) {
                    var $iframe = $('html').find('iframe').contents();
                    $iframe.find('html').addClass('cke_body_width');
                }
            });
        });

        framework.onDefaultContentNeeded(function () {
            documentBody.innerHTML = Messages.initialState;
        });

        var importMediaTags = function (dom, cb) {
            var $dom = $(dom);
            $dom.find('media-tag').each(function (i, el) {
                $(el).empty();
            });
            cb($dom[0]);
        };
        framework.setFileImporter({ accept: 'text/html' }, function (content, f, cb) {
            importMediaTags(domFromHTML(content).body, function (dom) {
                cb(Hyperjson.fromDOM(dom));
            });
        }, true);

        var exportMediaTags = function (inner, cb) {
            var $clone = $(inner).clone();
            nThen(function (waitFor) {
                $(inner).find('media-tag').each(function (i, el) {
                    if (!$(el).data('blob')) { return; }
                    Util.blobToImage($(el).data('blob'), waitFor(function (imgSrc) {
                        $clone.find('media-tag[src="' + $(el).attr('src') + '"] img')
                            .attr('src', imgSrc);
                    }));
                });
            }).nThen(function () {
                cb($clone[0]);
            });
        };
        framework.setFileExporter('html', function (cb) {
            exportMediaTags(inner, function (toExport) {
                cb(new Blob([ getHTML(toExport) ], { type: "text/html;charset=utf-8" }));
            });
        }, true);

        framework.setNormalizer(function (hjson) {
            return [
                'BODY',
                {
                    "class": "cke_editable cke_editable_themed cke_contents_ltr cke_show_borders",
                    "contenteditable": "true",
                    "spellcheck":"false"
                },
                hjson[2]
            ];
        });

        /* hitting enter makes a new line, but places the cursor inside
            of the <br> instead of the <p>. This makes it such that you
            cannot type until you click, which is rather unnacceptable.
            If the cursor is ever inside such a <br>, you probably want
            to push it out to the parent element, which ought to be a
            paragraph tag. This needs to be done on keydown, otherwise
            the first such keypress will not be inserted into the P. */
        inner.addEventListener('keydown', cursor.brFix);

        editor.on('change', framework.localChange);

        // export the typing tests to the window.
        // call like `test = easyTest()`
        // terminate the test like `test.cancel()`
        window.easyTest = function () {
            cursor.update();
            var start = cursor.Range.start;
            var test = TypingTest.testInput(inner, start.el, start.offset, framework.localChange);
            framework.localChange();
            return test;
        };

        $bar.find('.cke_button').click(function () {
            var e = this;
            var classString = e.getAttribute('class');
            var classes = classString.split(' ').filter(function (c) {
                return /cke_button__/.test(c);
            });

            var id = classes[0];
            if (typeof(id) === 'string') {
                framework.feedback(id.toUpperCase());
            }
        });

        framework.start();
    };

    var main = function () {
        var Ckeditor;
        var editor;
        var framework;

        nThen(function (waitFor) {
            Framework.create({
                toolbarContainer: '#cke_1_toolbox',
                contentContainer: '#cke_1_contents',
                patchTransformer: ChainPad.NaiveJSONTransformer,
                thumbnail: {
                    getContainer: function () { return $('iframe').contents().find('html')[0]; },
                    filter: function (el, before) {
                        if (before) {
                            module.cursor.update();
                            $(el).parents().css('overflow', 'visible');
                            $(el).css('max-width', '1200px');
                            $(el).css('max-height', Math.max(600, $(el).width()) + 'px');
                            $(el).css('overflow', 'hidden');
                            $(el).find('body').css('background-color', 'transparent');
                            return;
                        }
                        $(el).parents().css('overflow', '');
                        $(el).css('max-width', '');
                        $(el).css('max-height', '');
                        $(el).css('overflow', '');
                        $(el).find('body').css('background-color', '#fff');
                        var sel = module.cursor.makeSelection();
                        var range = module.cursor.makeRange();
                        module.cursor.fixSelection(sel, range);
                    }
                }
            }, waitFor(function (fw) { window.APP.framework = framework = fw; }));

            nThen(function (waitFor) {
                ckEditorAvailable(waitFor(function (ck) {
                    Ckeditor = ck;
                    require(['/pad/wysiwygarea-plugin.js'], waitFor());
                }));
                $(waitFor());
            }).nThen(function (waitFor) {
                Ckeditor.config.toolbarCanCollapse = true;
                if (screen.height < 800) {
                    Ckeditor.config.toolbarStartupExpanded = false;
                    $('meta[name=viewport]').attr('content',
                        'width=device-width, initial-scale=1.0, user-scalable=no');
                } else {
                    $('meta[name=viewport]').attr('content',
                        'width=device-width, initial-scale=1.0, user-scalable=yes');
                }
                // Used in ckeditor-config.js
                Ckeditor.CRYPTPAD_URLARGS = ApiConfig.requireConf.urlArgs;
                var backColor = AppConfig.appBackgroundColor;
                var newCss = '.cke_body_width { background: '+ backColor +'; height: 100%; }' +
                    '.cke_body_width body {' +
                        'max-width: 50em; padding: 10px 30px; margin: 0 auto; min-height: 100%;'+
                        'box-sizing: border-box;'+
                    '}';
                Ckeditor.addCss(newCss);
                Ckeditor.plugins.addExternal('mediatag','/pad/', 'mediatag-plugin.js');
                module.ckeditor = editor = Ckeditor.replace('editor1', {
                    customConfig: '/customize/ckeditor-config.js',
                });
                editor.on('instanceReady', waitFor());
            }).nThen(function () {
                editor.plugins.mediatag.translations = {
                    title: Messages.pad_mediatagTitle,
                    width: Messages.pad_mediatagWidth,
                    height: Messages.pad_mediatagHeight
                };
                Links.addSupportForOpeningLinksInNewTab(Ckeditor)({editor: editor});
            }).nThen(waitFor());

        }).nThen(function (/*waitFor*/) {
            andThen2(editor, Ckeditor, framework);
        });
    };
    main();
});
