# Cordova Keyboard Handling Example

Acheiving keyboard handling in Cordova that approaches a native experience isn't terribly obvious, especially with the typically
used project settings. For example, on iOS, the typical behavior is to scroll the entire webview, which means that important widgets
like navigation bars and the like can easily be scrolled off-screen. If there are additional scrollable regions, you get additional
strange behavior where one scroll region handles input until no more scrolling can occur in that direction, and then another scroll
actually adjusts the viewport. Android also has this behavior, but it can also resize the viewport when the keyboard appears. This
more closely matches Android's typical behavior where scrollable areas resize appropriately.

This was available for awhile on iOS, and there are various plugins that bring it back. But think about it: this is _not_ the way
the keyboard works on iOS, even in native applications. Instead of resizing the underlying viewport, the keyboard appears _above_
the content. Scrollable areas, instead of resizing, gain extra content padding in order that every item within can still appear
above the keyboard. Tab and tool bars that appear at the bottom of the screen don't suddenly appear above the keyboard, rather, they
are obscured by the keyboard.

A Cordova app that doesn't demonstrate this behavior on iOS automatically feels a little different. For one, widgets that should be
anchored to the bottom of the screen may move in unexpected ways. Secondly, resizing the viewport definitely incurs additional
computation as the browser has to recalculate the positions for everything in the DOM. This can cause animations to skip frames.

There is a better way: instead of forcing the viewport to change when the keyboard appears, we instead need to adjust how our
content _reacts_ to the keyboard itself. We can always add additional padding or change the heights of certain elements to ensure
that the keyboard doesn't obscure important elements. Granted, this is more work, but in all honestly, it's astonishingly very
little additional work.

## Demonstration

I've got a demonstration up at <https://appetize.io/app/kew62veageuua3ea12x1vjetm8>. Go play with it.

<iframe src="https://appetize.io/embed/kew62veageuua3ea12x1vjetm8?device=iphone5s&scale=100&autoplay=false&orientation=portrait&deviceColor=black" width="378px" height="800px" frameborder="0" scrolling="no"></iframe>

## Building

If you want to build the app in this repository, you will need Cordova installed on your machine. Then:

```
$ cd your-project-directory
$ cordova create keyboardexample com.your.domain CdvKbdEx --copy-from /path/to/clone/of/this/repository
$ cd keyboardexample
$ cordova plugin add com.ionic.keyboard
$ cordova plugin add org.apache.cordova.device
$ cordova platform add ios
```

## How it works

The Ionic keyboard plugin is a little different from most other Cordova keyboard plugins. Instead of allowing the webview to shrink
in response to the keyboard appearing on-screen, the plugin isntead reports the height of the keyboard to the app. We can use this
height to calculate how our app should react in order to ensure that content is still visible.


