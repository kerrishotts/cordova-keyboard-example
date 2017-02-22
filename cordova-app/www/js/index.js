/*
 * Apache license
 */

/*globals setTimeout, document, cordova, window, device */
var app = (function(){
    "use strict";

    var useSmoothScrolling = true,
        smoothScrollDuration = 100;

    function getScrollContainers() {
        // return all elements that have scrollable regions. For your app this might
        // be very different depending on what you have present on the screen and
        // how your app is structured.
        return [].slice.call(document.querySelectorAll("[is='y-scroll-container']"), 0);
    }

    function handleTextSelection(focusedElement) {
        setTimeout(function() {
            var selStart = focusedElement.selectionStart,
                selEnd = focusedElement.selectionEnd;
            focusedElement.selectionStart = 0;
            focusedElement.selectionEnd = 0;
            setTimeout(function() {
                focusedElement.selectionStart = selStart;
                focusedElement.selectionEnd = selEnd;
            }, 33);
        }, 0);
    }

    var app = {
        // Application Constructor
        initialize: function() {
            this.bindEvents();
        },
        // Bind Event Listeners
        //
        // Bind any events that are required on startup. Common events are:
        // "load", "deviceready", "offline", and "online".
        bindEvents: function() {
            document.addEventListener("deviceready", this.onDeviceReady, false);
        },
        // deviceready Event Handler
        //
        // The scope of "this" is the event. In order to call the "receivedEvent"
        // function, we must explicitly call "app.receivedEvent(...);"
        onDeviceReady: function() {
            if (device.platform === "iOS") {
                // disable scrolling of the webview
                // you could also do this only when the keyboard is visible and then
                // renable the scrolling when the keyboard is hidden
                window.addEventListener("native.keyboardshow", app.keyboardShown);
                window.addEventListener("native.keyboardhide", app.keyboardHidden);
                cordova.plugins.Keyboard.disableScroll(true);
            }
        },
        // keyboardHidden event handler
        //
        // called when the keyboard is hidden.
        keyboardHidden: function keyboardHidden() {
            // whenever the keyboard is hidden, we need to return all the scroll
            // containers that we modified to their appropriate heights
            setTimeout(function() {
            var scrollContainers = getScrollContainers();
            // setting max-height to blank will allow the element to size
            // based on the original CSS values
            scrollContainers.forEach( function(sc) {sc.style.maxHeight = ""; } );
            }, 0);
        },
        // keyboardShown event handler
        //
        // Called when the keyboard is shown.
        // The height of the keyboard is in e.keyboardHeight
        keyboardShown: function keyboardShown(e) {
            setTimeout(function() {
                var screenHeight = window.screen.height,
                    scrollContainers = getScrollContainers();
                // for each scroll container in the DOM, we need to calculate the
                // the height it should be to fit in the reduced view
                scrollContainers.forEach( function(sc) {
                    var scTop = sc.getBoundingClientRect().top;
                    // now that we know the top of the scroll container, the height of the
                    // the screen, and the height of the keyboard, we can calculate the
                    // appropriate max-height for the container.
                    sc.style.maxHeight = "" + (screenHeight - e.keyboardHeight - scTop) + "px";
                });
                // changing the height isn't sufficient: we need to scroll any focused
                // element into view.
                setTimeout(function() {
                    var focusedElement = document.querySelector(":focus");
                    if (focusedElement) {
                        if (!useSmoothScrolling || !window.requestAnimationFrame) {
                            // scroll the element into view, but only if we have to
                            if (focusedElement.scrollIntoViewIfNeeded) {
                                focusedElement.scrollIntoViewIfNeeded();
                            } else {
                                // aim for the bottom of the viewport
                                focusedElement.scrollIntoView(false);
                            }
                            // iOS doesn't always position the cursor correctly after
                            // a scroll operation. Clear the selection so that iOS is
                            // forced to recompute where the cursor should appear.
                            handleTextSelection(focusedElement);
                        } else {
                            // to scroll the element smoothly into view, things become a little
                            // more difficult.
                            var fElTop = focusedElement.getBoundingClientRect().top,
                                sc = focusedElement, scTop, scBottom;
                            // find the containing scroll container if we can
                            while (sc && !sc.matches("[is='y-scroll-container']")) {
                                sc = sc.parentElement;
                            }
                            if (sc) {
                                scTop = sc.getBoundingClientRect().top;
                                scBottom = sc.getBoundingClientRect().bottom;
                                if (fElTop < scTop || fElTop > (((scBottom - scTop) / 2) + scTop)) {
                                    // the element isn't above the keyboard (or is too far above),
                                    // scroll it into view smoothly
                                    var targetTop = ((scBottom - scTop) / 2) + scTop,
                                        deltaTop = fElTop - targetTop,
                                        origScrollTop = sc.scrollTop,
                                        startTimestamp = null;
                                    // animate our scroll
                                    window.requestAnimationFrame(function scrollStep(timestamp) {
                                        if (!startTimestamp) {
                                            startTimestamp = timestamp;
                                        }
                                        var progressDelta = timestamp - startTimestamp,
                                            pct = progressDelta / smoothScrollDuration;
                                        sc.scrollTop = origScrollTop + (deltaTop * pct);
                                        if (progressDelta < smoothScrollDuration) {
                                            window.requestAnimationFrame(scrollStep);
                                        } else {
                                            // set the scroll to the final desired position, just in case
                                            // we didn't actually get there (or overshot)
                                            sc.scrollTop = origScrollTop + deltaTop;
                                            handleTextSelection(focusedElement);
                                        }
                                    });
                                }
                            }
                        }
                    }
                }, 0);
            }, 0);
        }
    };
    return app;
})();

app.initialize();
