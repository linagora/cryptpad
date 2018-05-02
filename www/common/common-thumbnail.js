define([
    'jquery',
    '/common/common-util.js',
    '/common/visible.js',
    '/common/common-hash.js',
    '/file/file-crypto.js',
    '/bower_components/tweetnacl/nacl-fast.min.js',
], function ($, Util, Visible, Hash, FileCrypto) {
    var Nacl = window.nacl;
    var Thumb = {
        dimension: 100,
        padDimension: 200,
        UPDATE_INTERVAL: 60000,
        UPDATE_FIRST: 5000
    };

    var supportedTypes = [
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/gif',
        'video/',
        'application/pdf'
    ];

    Thumb.isSupportedType = function (type) {
        return supportedTypes.some(function (t) {
            return type.indexOf(t) !== -1;
        });
    };

    // create thumbnail image from metadata
    // return an img tag, or undefined if anything goes wrong
    Thumb.fromMetadata = function (metadata) {
        if (!metadata || typeof(metadata) !== 'object' || !metadata.thumbnail) { return; }
        try {
            var u8 = Nacl.util.decodeBase64(metadata.thumbnail);
            var blob = new Blob([u8], {
                type: 'image/png'
            });
            var url = URL.createObjectURL(blob);
            var img = new Image();
            img.src = url;
            img.width = Thumb.dimension;
            img.height = Thumb.dimension;
            return img;
        } catch (e) {
            console.error(e);
            return;
        }
    };

    var getResizedDimensions = Thumb.getResizedDimensions = function (img, type) {
        var h = type === 'video' ? img.videoHeight : img.height;
        var w = type === 'video' ? img.videoWidth : img.width;

        var dim = type === 'pad' ? Thumb.padDimension : Thumb.dimension;

        // if the image is too small, don't bother making a thumbnail
        /*if (h <= dim && w <= dim) {
            return {
                x: Math.floor((dim - w) / 2),
                w: w,
                y: Math.floor((dim - h) / 2),
                h : h
            };
        }*/

        // the image is taller than it is wide, so scale to that.
        var r = dim / (h > w? h: w); // ratio
        if (h <= dim && w <= dim) { r = 1; }

        var d;
        if (h > w) {
            var newW = Math.floor(w*r);
            d = Math.floor((dim - newW) / 2);
            return {
                dim: dim,
                x: d,
                w: newW,
                y: 0,
                h: dim,
            };
        } else {
            var newH = Math.floor(h*r);
            d = Math.floor((dim - newH) / 2);
            return {
                dim: dim,
                x: 0,
                w: dim,
                y: d,
                h: newH
            };
        }
    };

    // assumes that your canvas is square
    // nodeback returning blob
    Thumb.fromCanvas = function (canvas, D, cb) {
        var c2 = document.createElement('canvas');
        if (!D) { return void cb('ERROR'); }

        c2.width = D.dim;
        c2.height = D.dim;

        var ctx = c2.getContext('2d');
        ctx.drawImage(canvas, D.x, D.y, D.w, D.h);

        cb(void 0, c2.toDataURL());
    };

    Thumb.fromImageBlob = function (blob, cb) {
        var url = URL.createObjectURL(blob);
        var img = new Image();

        img.onload = function () {
            var D = getResizedDimensions(img, 'image');
            Thumb.fromCanvas(img, D, cb);
        };
        img.onerror = function () {
            cb('ERROR');
        };
        img.src = url;
    };
    Thumb.fromVideoBlob = function (blob, cb) {
        var url = URL.createObjectURL(blob);
        var video = document.createElement("VIDEO");
        video.addEventListener('loadeddata', function() {
            var D = getResizedDimensions(video, 'video');
            Thumb.fromCanvas(video, D, cb);
        }, false);
        video.addEventListener('error', function (e) {
            console.error(e);
            cb('ERROR');
        });
        video.src = url;
    };
    Thumb.fromPdfBlob = function (blob, cb) {
        require.config({paths: {'pdfjs-dist': '/common/pdfjs'}});
        require(['pdfjs-dist/build/pdf'], function (PDFJS) {
            var url = URL.createObjectURL(blob);
            var makeThumb = function (page) {
                var vp = page.getViewport(1);
                var canvas = document.createElement("canvas");
                canvas.width = canvas.height = Thumb.dimension;
                var scale = Math.min(canvas.width / vp.width, canvas.height / vp.height);
                canvas.width = Math.floor(vp.width * scale);
                canvas.height = Math.floor(vp.height * scale);
                return page.render({
                    canvasContext: canvas.getContext("2d"),
                    viewport: page.getViewport(scale)
                }).promise.then(function () {
                    return canvas;
                });
            };
            PDFJS.getDocument(url).promise
            .then(function (doc) {
                return doc.getPage(1).then(makeThumb).then(function (canvas) {
                    var D = getResizedDimensions(canvas, 'pdf');
                    Thumb.fromCanvas(canvas, D, cb);
                });
            }).catch(function () {
                cb('ERROR');
            });
        });
    };
    Thumb.fromBlob = function (blob, cb) {
        if (blob.type.indexOf('video/') !== -1) {
            return void Thumb.fromVideoBlob(blob, cb);
        }
        if (blob.type.indexOf('application/pdf') !== -1) {
            return void Thumb.fromPdfBlob(blob, cb);
        }
        Thumb.fromImageBlob(blob, cb);
    };

    window.html2canvas = undefined;
    Thumb.fromDOM = function (opts, cb) {
        var element = opts.getContainer();
        if (!element) { return; }
        var todo = function () {
            if (opts.filter) { opts.filter(element, true); }
            window.html2canvas(element, {
                allowTaint: true,
                onrendered: function (canvas) {
                    if (opts.filter) { opts.filter(element, false); }
                    setTimeout(function () {
                        var D = getResizedDimensions(canvas, 'pad');
                        Thumb.fromCanvas(canvas, D, cb);
                    }, 10);
                }
            });
        };
        if (window.html2canvas) { return void todo(); }
        require(['/bower_components/html2canvas/build/html2canvas.min.js'], todo);
    };

    Thumb.initPadThumbnails = function (common, opts) {
        if (!opts.href || !opts.getContent) {
            throw new Error("href and getContent are needed for thumbnails");
        }
        var oldThumbnailState;
        var mkThumbnail = function () {
            var content = opts.getContent();
            if (content === oldThumbnailState) { return; }
            oldThumbnailState = content;
            Thumb.fromDOM(opts, function (err, b64) {
                Thumb.setPadThumbnail(common, opts.href, b64);
            });
        };
        var nafa = Util.notAgainForAnother(mkThumbnail, Thumb.UPDATE_INTERVAL);
        var to;
        var tUntil;
        var interval = function () {
            tUntil = nafa();
            if (tUntil) {
                window.clearTimeout(to);
                to = window.setTimeout(interval, tUntil+1);
                return;
            }
            to = window.setTimeout(interval, Thumb.UPDATE_INTERVAL+1);
        };
        Visible.onChange(function (v) {
            if (v) {
                window.clearTimeout(to);
                return;
            }
            interval();
        });
        if (!Visible.currently()) { to = window.setTimeout(interval, Thumb.UPDATE_FIRST); }
    };

    var addThumbnail = function (err, thumb, $span, cb) {
        var img = new Image();
        img.src = thumb.slice(0,5) === 'data:' ? thumb : 'data:image/png;base64,'+thumb;
        $span.find('.cp-icon').hide();
        $span.prepend(img);
        cb($(img));
    };
    Thumb.addThumbnail = function(thumb, $span, cb) {
        return addThumbnail(null, thumb, $span, cb);
    };
    var getKey = function (href) {
        var parsed = Hash.parsePadUrl(href);
        return 'thumbnail-' + parsed.type + '-' + parsed.hashData.channel;
    };
    Thumb.setPadThumbnail = function (common, href, b64, cb) {
        cb = cb || function () {};
        var k = getKey(href);
        common.setThumbnail(k, b64, cb);
    };
    Thumb.displayThumbnail = function (common, href, $container, cb) {
        cb = cb || function () {};
        var parsed = Hash.parsePadUrl(href);
        var k = getKey(href);
        var whenNewThumb = function () {
            var secret = Hash.getSecrets('file', parsed.hash);
            var hexFileName = Util.base64ToHex(secret.channel);
            var src = Hash.getBlobPathFromHex(hexFileName);
            var cryptKey = secret.keys && secret.keys.fileKeyStr;
            var key = Nacl.util.decodeBase64(cryptKey);
            FileCrypto.fetchDecryptedMetadata(src, key, function (e, metadata) {
                if (e) {
                    if (e === 'XHR_ERROR') { return; }
                    return console.error(e);
                }
                if (!metadata) { return console.error("NO_METADATA"); }

                var v = metadata.thumbnail;
                if (!v) {
                    v = 'EMPTY';
                }
                Thumb.setPadThumbnail(common, href, v, function (err) {
                    if (!metadata.thumbnail) { return; }
                    addThumbnail(err, metadata.thumbnail, $container, cb);
                });
            });
        };
        common.getThumbnail(k, function (err, v) {
            if (!v && parsed.type === 'file') {
                // We can only create thumbnails for files here since we can't easily decrypt pads
                return void whenNewThumb();
            }
            if (!v) { return; }
            if (v === 'EMPTY') { return; }
            addThumbnail(err, v, $container, cb);
        });
    };

    return Thumb;
});
