/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/*globals setTimeout, document, cordova, window, device */

"use strict";

function getScrollContainers() {
    // return all elements that have scrollable regions. For your app this might
    // be very different depending on what you have present on the screen and
    // how your app is structured.
    return [].slice.call(document.querySelectorAll("[is='y-scroll-container']"), 0);
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
            cordova.plugins.Keyboard.disableScroll(true);
            window.addEventListener("native.keyboardshow", app.keyboardShown);
            window.addEventListener("native.keyboardhide", app.keyboardHidden);
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
          scrollContainers.forEach( function(el) {el.style.maxHeight = ""; } );
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
            scrollContainers.forEach( function(el) {
                var elTop = 0,
                    curEl = el;
              // calculate the top position of the scroll container
              while (curEl && curEl.offsetParent) {
                  elTop += curEl.offsetTop;
                  curEl = curEl.offsetParent;
              }
              // now that we know the top of the scroll container, the height of the
              // the screen, and the height of the keyboard, we can calculate the
              // appropriate max-height for the container.
              el.style.maxHeight = "" + (screenHeight - e.keyboardHeight - elTop) + "px";
            });
            // changing the height isn't sufficient: we need to scroll any focused
            // element into view.
            setTimeout(function() {
                var focusedElement = document.querySelector(":focus");
                if (focusedElement) {
                    // using false here means that the browser won't try to scroll
                    // the element to the top of the viewport
                    focusedElement.scrollIntoView(false);
                    setTimeout(function() {
                        // iOS doesn't always position the cursor correctly after
                        // a scroll operation. Clear the selection so that iOS is
                        // forced to recompute where the cursor should appear.
                        focusedElement.selectionStart = 0;
                        focusedElement.selectionEnd = 0;
                    }, 0);
                }
            }, 0);
        }, 0);
    }
};

app.initialize();
