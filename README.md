# Cordova Keyboard Avoidance Example

> **IMPORTANT**: This isn't intended to be a drop-in solution, although depending on your app's layout, it's possible it could work
> with minimal modifications. This example is intended more to spark ideas than it is to provide a plug-and-play implementation.

When it comes to Cordova apps on iOS, the typical behavior when the keyboard is visible is to pan the webview. This is _far_ from
desirable, since this is most definitely not how things work in native apps.

The other method commonly used is to resize the web view, a lot like is done on Android. This isn't perfect either, because it
often results in widgets that should stay attached to the bottom appearing directly above the keyboard. If you pay attention to
native apps, the soft keyboard often appears _over_ tabs and tool bars rather than pushing them up.

There is a better way: instead of forcing the viewport to change when the keyboard appears, we can instead adjust how our
content _reacts_ to the keyboard itself. We can always add additional padding or change the heights of certain elements to ensure
that the keyboard doesn't obscure important elements. Granted, this is more work, but in all honestly, it's astonishingly very
little additional work to get something that works better than resizing the web view. It's not a perfectly native result yet,
but it's a start.

## Demonstration

* Instant Scroll: <https://youtu.be/LcKPPCe-YXU>
* Smooth Scroll: <http://youtu.be/vWCa7F3Lv-w>

## Building

If you want to build the app in this repository, you will need Cordova installed on your machine. Then clone this repository to your computer, and then:

```
$ cd project-clone-directory/cordova-app
$ cordova prepare    # plugins and platforms should be installed
```

## How it works

The Ionic keyboard plugin is a little different from most other Cordova keyboard plugins. Instead of allowing the webview to shrink
in response to the keyboard appearing on-screen, the plugin isntead reports the height of the keyboard to the app. We can use this
height to calculate how our app should react in order to ensure that content is still visible.

The first step is to prevent scrolling in the webview. This can be turned on and off when the keyboard appears and disappears (if
you need it), or if your app is like many and uses internal scrolling areas for content, you can turn it off at app startup.

Then, we need to register two handlers: one that is called when the keyboard is shown and the other is called when the keyboard
is hidden.

```
if (device.platform === "iOS") {
    cordova.plugins.Keyboard.disableScroll(true);
    window.addEventListener("native.keyboardshow", app.keyboardShown);
    window.addEventListener("native.keyboardhide", app.keyboardHidden);
}
```

The interesting stuff really happens when the keyboard is shown. Ionic will pass us the height of the keyboard as `keyboardHeight`
on the first parameter. We'll handle that in a moment, but the first thing we do is stuff everything into a `setTimeout` so
as to give things a chance to settle down before we go manipulating the DOM:

```
keyboardShown: function keyboardShown(e) {
    setTimeout(function() {
        // all code goes here
    }, 0);
}
```

Next, we calculate the screen height, and then get all the elements that we need to resize. What elements need resizing will vary
based upon your app and your app's needs, but in this example, we resize all scroll containers:

```
var screenHeight = window.screen.height,
    scrollContainers = getScrollContainers();
```

The code for finding all the scroll containers is pretty simple in this example:

```
function getScrollContainers() {
    return [].slice.call(document.querySelectorAll("[is='y-scroll-container']"), 0);
}
```

Once we have a list of elements that need to be resized, we iterate over that list and calculate the element's `top` position on
the screen. Once we have that information, we can calculate how large the scroll container should be in order to avoid the keyboard
itself.

```
scrollContainers.forEach( function(el) {
    var scTop = sc.getBoundingClientRect().top;
    sc.style.maxHeight = "" + (screenHeight - e.keyboardHeight - scTop) + "px";
});
```

This adjusts the maximum height of the scroll container so that the content within can scroll. Since the scroll container is
entirely above the keyboard, the content within is also entirely visible.

> NOTE: All of this is assuming that the scroll container's top is already above the top of where the keyboard would appear. This
> is normally the case, but if your layouts include scrolling containers that are below where the keyboard would appear, you're
> going to get a negative `maxHeight`, which isn't exactly ideal.

Unfortunately we're not quite done yet: the keyboard appears because the user requests it, and this is usually because they have
tapped a text field. At this point, the text field may be well below the fold, so-to-speak, and iOS won't automatically scroll
it into view at this point.

But we can by searching for a focused element and scrolling it into view manually. Again, we wrap this in a `setTimeout` call so
as to give the DOM some time to process the fact that the container's height has changed:

```
setTimeout(function() {
    var focusedElement = document.querySelector(":focus");
    if (focusedElement) {
        if (!useSmoothScrolling || !window.requestAnimationFrame) {
            if (focusedElement.scrollIntoViewIfNeeded) {
                focusedElement.scrollIntoViewIfNeeded();
            } else {
                focusedElement.scrollIntoView(false);
            }
        } else {
            // smooth scrolling...
        }
    }
}, 0);
```
> `scrollIntoViewIfNeeded`, if available, is the preferred method, since it will scroll the element into the center of the
> viewport. If it's not present, though, we'll scroll the element to the bottom of the viewport. Depending on your app's needs,
> the top might make more sense (which is the default if you don't pass `false`).

This _should_ be all we need, but there's one more problem. iOS doesn't always display the blinking cursor in the correct position
after the element has been scrolled into position. In order to fix that, we can reset the selection, and that will cause the cursor
to appear in the correct location. We also wrap this in yet another `setTimeout` to ensure that the field has a chance to scroll
into view before we adjust the selection:

```
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
```

That takes care of handling when the keyboard appears, but we also need to adjust the height of the scroll containers when the
keyboard is hidden. This is much simpler, thankfully:

```
keyboardHidden: function keyboardHidden() {
    setTimeout(function() {
        var scrollContainers = getScrollContainers();
        scrollContainers.forEach( function(el) {el.style.maxHeight = ""; } );
    }, 0);
}
```

## Smooth Scrolling

The catch with this type of scrolling is that the action is instantaneous, which feels out-of-place on iOS. If your app included
jQuery or some other framework, chances are good you'd have a mechanism for scrolling an element into view smoothly.

Here's how I've added support for smooth scrolling without a framework. I make no warranty as to how robust this code is, and if
it even works in all situations. It's sufficient for the demo, though!


First, we locate the parent scroll container of the element. This probably won't work that well if you've got a complex layout
with nested scrolling containers, but for my purposes, it's sufficient.

```
var fElTop = focusedElement.getBoundingClientRect().top,
    sc = focusedElement, scTop, scBottom;
while (sc && !sc.matches("[is='y-scroll-container']")) {
    sc = sc.parentElement;
}
```

If the element is within a scroll container, we then determine if the element should be scrolled into view. We use a pretty
narrow viewport here: the top of the scroll container to the middle. Anything outside that range will be scrolled (although you
can make a case that there's no reason to do it for anything above the top).

If the element does need to be scrolled into view, we calculate where we'd like it (roughly the center), and then scroll there
over a short period of time (100ms, ATM). It's a linear animation, so it's not quite how iOS might do it, but it's close enough.
If you wanted, though, you could implement a different animation curve.

```
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
```

## Caveats

Now, this isn't perfect -- there are limitations with this approach is it stands currently, though there's always a chance that
it will be improved in the future.

* I've only considered text fields in this example, not `textarea`s.
* The event is usually received _after_ the keyboard is already visible (or in process). So there's no real point in trying to
  exactly match iOS's animation curves, since we'll be animating after the keyboard is already visible.
* Whatever is below the scroll container in the DOM (such as any other elements) may tint the keyboard. The content in the scroll
  container, however, will not help tint the keyboard, which isn't quite native. While we could use `padding-bottom` instead of
  `max-height`, `scrollIntoView[ifNeeded]` doesn't take the keyboard into account when it scrolls the element into view. So you could still
  end up focusing a text field underneath the keyboard. Furthermore, even if you handled that case, the scrollbar itself would
  appear incorrectly (part of it would be obscured by the keyboard).
* I've not worried about rotation yet. It may work, it may not.
* The keyboard isn't the only thing that acts as a soft input panel: `select` lists on an iPhone will also display a list in the
  keyboard area. The height isn't quite the same, but it appears that switching between the two is handled correctly.
* There are plenty of edge cases I haven't considered in this example yet -- e.g, scroll containers with tops below the keyboard,
  etc.
* Ionic's Keyboard plugin mis-reports the keyboard height when a hardware keyboard is attached.

## License

Apache license.


