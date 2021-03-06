# Custom Context Menu
Improve a web-interface's UX by customizing its context menus. _No
dependencies. Less than 3kB both files (gzipped and minified)._

## Contents
1. [Installation](#installation)
1. [Usage](#usage)
    1. [Link the script](#link-the-script)
    1. [Define a new Context Menu](#define-a-new-context-menu)
        * [Target](#target)
        * [Items](#items)
        * [Options](#options)
    1. [Fallback menu](#fallback-menu)
1. [Sub-menus](#sub-menus)
1. [Some things you might wish you knew earlier](#some-things-you-might-wish-you-knew-earlier)
1. [Examples](#examples)
    1. [Without sub-menus](#without-sub-menus)
    2. [With 2-levels-nested sub-menu](#with-2-levels-nested-sub-menu)
1. [Styling](#styling)
1. [Contribution](#contribution)

## [Installation](#installation)
1. Using NPM or Yarn

    ```bash
    $ npm install custom-context-menu --save
    ```

    ```bash
    $ yarn add custom-context-menu
    ```

1. Standalone

    You can also just download a [preferable version](https://github.com/smellyshovel/custom-context-menu/releases) of
    the package's source and use it for your taste.

## [Usage](#usage)

### [Link the script](#link-the-script)

Link the `src/context-menu.js` or both the `src/context-menu.js` and `src/context-sub-menu.js` if you do also wish to use sub-menus

```html
<script src="path/to/package/src/context-menu.js">
```

or

```html
<script src="path/to/package/src/context-menu.js">
```

Notice also that if you are about to use sub-menus then you **must** include the `context-menu.js` **before** the `context-sub-menu.js`.

### [Define a new Context Menu](#define-a-new-context-menu)

The defenition of a new Context Menu is rather simple. All you have to do is to invoke the `ContextMenu` constructor providing it with 3 arguments: a `target`, an array of `items` and, optionally, an object of `options`

```javascript
new ContextMenu(target, items, options);
```

#### [Target](#target)

The target is a DOM element interaction with which leads to opening of the Context Menu. Or it can also be a collection of elements. All the following examples are valid

```javascript
let target = document.querySelector("a#home");
```

```javascript
let target = document.querySelectorAll("div.button");
```

```javascript
let target = document.getElementById("one-and-only");
```

The `target` might also be the `document` which is quite useful for defining a fallback Context Menu

```javascript
let target = document;
```

More on the fallback menu in the [appropriate section](#fallback-menu).

#### [Items](#items)

The `items` array is used to define all the items of the Context Menu. Each item is either an object or a string

##### Object

Objects are used to describe normal items like those you can press to trigger some action

```javascript
let items = [
    {
        title: "Bring a beer",
        action: bringABeer
    },

    {
        title: "Make a sandwich",
        action() {
            let bread = getBread();
            let butter = getButter();
            let bacon = getBacon();

            makeSandwich(bread, butter, bacon);
        }
    }
];
```

Each normal item object must have 2 properties: a `title` which is a name of the item and an `action` which is a function that is gonna be invoked when the item is selected.

However, the `action` might also be an insance of the `ContextMenu.Sub`. In such case the item serves as the _caller_ of a sub-menu

```javascript
let items = [
    {
        title: "Check me in",
        action: new ContextMenu.Sub(items, options)
    }
];
```

More on sub-menus in the [appropriate section](#).

##### String
Strings are the special items. For example you might want to separate 2 items with a horizontal bar between them. In order to do so use the special `"separator"` item

```javascript
let items = [
    {
        title: "Bring a beer",
        action: bringABeer
    },

    "separator", // here

    {
        title: "Make a sandwich",
        action() {
            let bread = getBread();
            let butter = getButter();
            let bacon = getBacon();

            makeSandwich(bread, butter, bacon);
        }
    }
];
```

All the special items are predefined. There's currently only one special item - the `separator`, though the list is extensible and will probably become expanded in the future.

#### [Options](#options)

The `options` object provides the options which define the behavior of the Context Menu. This argument is optional, i.e. you might either provide it or not.

```javascript
let options = {
    name: "",
    disabled: false,
    nativeOnAlt: true,
    penetrable: false,
    transfer: "y",
    verticalSpacing: 10,
    callback: {
        opening() {},
        closure() {}
    }
};
```

The example above lists all the possible options as well as their default values. If the `options` is not provided then the defaults would be used. The same applies for the lacking options (those that you didn't specified).

##### `name`
A string holding the name of the Context Menu. It might be anything you like. The option is used purely for styling purposes in order to identify a certain Context Menu among the others.

##### `disabled`
A boolean indicating whether the Context Menu is disabled or not. If the Context Menu is disabled then right-clicking the `target` won't do anything. For example it might be useful for disabling the browser's native context menu for a certain element.

##### `nativeOnAlt`
A boolean indicating whether to show the browser's native context menu or not if the `target` has been right-clicked *and* the `alt` key was holded. **Notice**, that the `disabled` option has no influence on behavior of this one, i.e. even if the Context Menu is `disabled` but the `nativeOnAlt` is `true` then if the `target` has been right-clicked during the `alt` key holding the browser's native context menu will appear.

##### `penetrable`
A boolean indicating whether the overlay of the Context Menu is penetrable for right-clicking "through" it or not. If set to `false` then a right click on the overlay will just close the Context Menu. But if set to `true` then a new Context Menu for the appropriate target (if any) will apear right after the closure.

##### `transfer`
The option defines what to do with the Context Menu if it can't fit in the viewport. Must have one of 4 values: `"x"`, `"y"`, `"both"` or `false`. Proceed to the [demo](#) to see those in action.

##### `verticalSpacing`
The option the value of which must be an iteger represents the amount of pixels to be stepped off a top and a bottom edges of the viewport if the menu is overflowed, i.e. if it can't fit in the viewport vertically. That might be a case on having too much items or too short viewport (e.g. a very small browser window).

##### `callback`
The object with 2 properties: `opening` and `closure`, each of which is a function. The function is invoked whenever the menu is opened or closed respectively.

### [Fallback menu](#fallback-menu)

You may define Custom Context Menus for all the `<a>` elements on a page, for all the `<p>` and `<button>` elements. But what about the other stuff? If a user right-clicked not one of these elements, what's then?

Well, you can define a page-wide fallback Context menu, which will be used as the menu for all the elements the other Context Menus are not specified for. In order to do so you have to register a Context Menu with the `target` equal to the `document`

```javascript
let fallbackCM = new ContextMenu(document, items);
```

If you do also have a ContextMenu defined for all the `<a>` elements

```javascript
let aCM = new ContextMenu(document.querySelectorAll("a"), items);
```

then if you right-click any `<a>` element the a-element-menu will appear. But if you right-click anywhere else within the page, the fallback one will.

You may also reach identical behavior by using the `document.documentElement` instead of `document`. However, such approach might have some disatvantages, such as that if the `<html>` element's (which is represented by the `document.documentElement`) height is less than the height of the viewport then all the "differential" part of the page won't serve as a Context Menu caller.

## [Sub-menus](#sub-menus)

It's quite common to combine similar items into groups and thus sub-menus are your way to go. The sub-menu is a menu within a menu.

A sub-menu must be defined as an action of some item

```javascript
let items = [
    {
        title: "Hover me!",
        action: new ContextMenu.Sub(items, options)
    }
];
```

The item that is used to open the sub-menu is called a **caller**.

The only defference in the process of creation of a sub-menu is that it doesn't accept the `target` as an argument. And this is quite expected. The thing here is that the sub-menu might only be opened using its caller, i.e. the sub-menu is not tied to any DOM element (if not counting the caller itself the element), therefore there's no need in providing a `target` to a sub-menu's constructor.

The approach of defining the `items` is absolutely similar with the normal Context Menus. However, the `options` are not

```javascript
let options = {
    name: "",
    delay: {
        opening: 250,
        closure: 250
    },
    transfer: "x",
    verticalSpacing: 10,
    callback: {
        opening() {},
        closure() {}
    }
}
```

Here is the list of all the available for a sub-menu options. As you can see it's quite simiar with the one that is for not-a-sub-menu. It lacks the `disabled`, `nativeOnAlt` and `penetrable` options. The reason is because they are absolutely pointless for sub-menus.

But the `delay` option is available for sub-meus whilst not for normal Context Menus. The option defines how much time should pass before the sub-menu might be opened or closed after the caller has become selected. The time is specified in milliseconds.

## [Some things you might wish you knew earlier](#tips)

### 1. Context of an action

An action when invoked gains the context of the Context Menu instance itself

```javascript
let fallbackCM = new ContextMenu(document, [
    {
        title: "Luke, I'm your father",
        action() {
            console.log(this === fallbackCM); // true
        }
    }
]);
```

### 2. `items` and `options` are used without making copies of them

The `items` array might change during the lifecycle of the page the Context Menu using the array is used on.

The prototype of the `options` object will be substituted with the other one.

### 3. Use public properties of a Context Menu to dinamically add (or remove) `items` and change `options`

After a Context Menu is initialized (the constructor is invoked) you can still make changes to the menu's `items` and `options` by modifying the corresponding properties of the instance

```javascript
    let awesomeCM = new ContextMenu(target, items, options);

    setTimeout(() => {
        awesomeCM.items.push(newItem);
        awesomeCM.options.transfer = false;
    }, 10000);
```

The example above adds a new item to the `awesomeCM` Context Menu and changes its `transfer` option's property value to `false` in 10 seconds after the Context Menu has become initialized.

## [Examples](#examples)

### [Without sub-menus](#example-without-sub-menus)

An example of a regular Context Menu without sub-menus, with prohibited native context menus and which says "bye" after it has become closed.

```javascript
    let cmForLinks = new ContextMenu(document.querySelectorAll("a"), [
        {
            title: "Option 1",
            action() {alert("You selected the option #1")}
        },

        {
            title: "Option 2",
            action() {alert("You selected the option #2")}
        }
    ], {
        nativeOnAlt: false,
        callback: {
            opening() {},
            closure() {alert("bye")}
        }
    });
```

### [With 2-levels-nested sub-menu](#example-with-2-levels-nested-sub-menu)

An example of a Context Menu, the second item of which opens a sub-menu, the first item of which opens another one.

```javascript
    let subMenu1stLevel = new ContextMenu.Sub([
        {
            title: "2 > First",
            action: new ContextMenu.Sub([
                {
                    title: "3 > First",
                    action() {return 2 + 2}
                },

                {
                    title: "3 > Second",
                    action() {return 2 - 2}
                },

                {
                    title: "3 > Third",
                    action() {return 2 * 2}
                }
            ]);
        },

        "separator",

        {
            title: "2 > Second",
            action: subMenu1stLevel
        }
    ]);

    let cmForButtons = new ContextMenu(document.querySelectorAll("button"), [
        {
            title: "1 > First",
            action() {return 2 + 2}
        },

        {
            title: "1 > Second",
            action: subMenu1stLevel
        },

        {
            title: "1 > Third",
            action() {return 2 * 2}
        }
    ]);
```

## [Styling](#styling)

Each Context Menu is represented as a `<div>` with the `data-cm` attribute set to the `name` of the Context Menu. For example if you defined a Context Menu as follows

```javascript
let cm = new ContextMenu(target, items, {
    name: "fallback"
});
```

then you can easily style it with CSS adressing it by its name

```CSS
[data-cm="fallback"] {
    background-color: blue;
}
```

Of course you can style different Context Menus separately

```CSS
[data-cm="fallback"], [data-cm="another-one"] {
    background-color: blue;
}

[data-cm="the-third-one"] {
    background-color: red;
}
```

In the example above the Context Menus with `name`s `"fallback"` and `"another-one"` would have blue background, whilst the Context Menu named `"the-third-one"` would have a red one.

If a Context Menu is unnamed then its `data-cm` attribute would be just an empty string, so in order to style such a menu you'd have to refer the `[data-cm]` in your CSS

```CSS
[data-cm] {
    background-color: green;
}
```

Now all the unnamed Context Menus will have green background.

Referring empty `[data-cm]` attribute is also quite useful it you wish to style all the menus similarly except for a couple ones. For instance let's make all the Context Menus to have yellow backgrounds, while the `"fallback"` one would have a green one.

```CSS
[data-cm] {
    background-color: yellow;
}

[data-cm="fallback"] {
    background-color: green;
}
```

Now you can have hundreds of defferent named Context Menus styled the same and only the Context Menu with the `name` option set to `"fallback"` will have green background.

**Notice**, that you must define styles for `[data-cm]` before you style any other named Context Menu. Otherwise the unnamed menu's styles will override the named one's.

#### Structure

When a Context Menu is opened it appears as the child of its overlay. Overlay is used as a sort of a grouping element and also to simplify the menu closure detection. The overlay is represented by a `<div>` element with `data-cm-overlay` attribute equal to the `name` of the menu and is spawned at the end of the `<body>` whenever the menu is opened.

The menu itself consists of one element usually - the `<ol>`, which stores all the items. However 2 additional elements are added inside the `div[data-cm]` if the Context Menu is overflowed: the "up" and "down" arrow which represented by `<div>` elements with `data-cm-item-special="arrow up"` and `data-cm-item-special="arrow down"` attributes respectively.

Each item of a Context Menu is represented by `<li>` with `data-cm-item` attribute the value of which equals the `title` of the item. Callers do also have `data-cm-item-caller` attribute assigned to them, and the special items get the `data-cm-item-special` equal the type of the special that is used (for example `data-cm-item-special="separator"`).

So the stucture of a Context Menu might be represented as follows

```HTML
<body>
    <!-- ... -->
    <div data-cm-overlay="name">
        <div data-cm="name">
            <!-- <div data-cm-item-special="arrow up"></div> - if the menu is overflowed -->
                <ol>
                    <li data-cm-item="Title 1">Title 1</li>
                    <div data-cm-item-special="separator"></div>
                    <li data-cm-item="Title 2">Title 2</li>
                </ol>
            <!-- <div data-cm-item-special="arrow down"></div> - if the menu is overflowed -->
        </div>
    </div>
</body>
```

All the sub-menus of a Context Menu are stored in the same overlay as the "root's" one.

#### Items

When a mouse hovers an item, or a keyboard is used to navigate to the item then the item gets focused. So in order to highlight the item you must style its `:focuse` state

```CSS
[data-cm-item] {
    background-color: white;
}

[data-cm-item]:focus {
    background-color: purple;
}
```

Now when a user navigates to a certain item the item would become highlighted purple. **Notice**, that browsers usually by default heighlight a focused element with `outline`, so if you wish to disable this behavior then add a `outline: none;` CSS property.

#### Opening and closing transitions

In order to animate the Context Menu opening or closure use CSS transitions

```CSS
[data-cm] {
    transition: opacity 1s linear;
    opacity: 0;
}

[data-cm].visible {
    transition: opacity 0.5s linear;
    opacity: 1;
}
```

In the example above menus will smoothely appear in 1 second and hide in 0.5 seconds. The same way you can also animate overlays.

**Very important**: use the same measurement units everywhere. Menus in the following example would behave **incorrect**

```CSS
[data-cm-overlay] {
    transition: background-color 2s linear;
    background-color: rgba(0, 0, 0, 0);
}

[data-cm-overlay].visible {
    transition: background-color 900ms linear; // "s" is everywhere else, so don't use "ms" here (or instead use "ms" everywhere)
    background-color: rgba(0, 0, 0, 0.5);
}

[data-cm] {
    transition: opacity 1s linear;
    opacity: 0;
}

[data-cm].visible {
    transition: opacity 0.5s linear;
    opacity: 1;
}
```

Don't mix up seconds and milliseconds. Stick to one thing.

## [Contribution](#contribution)

I don't currently have any contribution manifest nor styleguides. Nevertheless, I'm open for any kind of contribution you can offer. So don't be shy to open an issue for everything you might want to know or let me know about or to make a pull request :sparkles:. Also, you can always contact me if you are unsure about what you can do to make this project better.
