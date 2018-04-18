/*
    This wrapper is necessary to enable strict mode.
*/
const ContextMenu = function() {
    "use strict";

    class ContextMenu {
        constructor(target, items, options) {
            /*
                Check target for errors. If there is a CM instance already
                defined for the same target as the one that's being created now
                then return a found instance instead of "recreating" the CM.
            */
            let alreadyDefined = ContextMenu._checkTarget(target);
            if (alreadyDefined) return alreadyDefined;

            /*
                Provide default (fallback) options values by setting the
                prototype of the `options` object to the ::_defaultOptions
                object.
            */
            Object.setPrototypeOf(options, ContextMenu._defaultOptions);

            /*
                Make items and options to be the properties of the CM instance
                to have an access to them in methods and outside. This provides
                a possibility to dinamically add new items and change options.
            */
            this._target = target;
            this.items = items;
            this.options = options;

            /*
                Save the instance to prevent "recreating".
            */
            ContextMenu._instances.push(this);

            /*
                Register the event listener that is responsible for tracking the
                CM invokation.
            */
            this._registerOpenEventListener();
        }

        _registerOpenEventListener() {
            /*
                When the `contextmenu` event takes place, handle it first and
                then register the event listener that is responsible for
                tracking the CM closure.
            */
            this._target.addEventListener("contextmenu", (event) => {
                this._handleCallOpen(event);
                this._registerCloseEventListener();
            });
        }

        _handleCallOpen(event) {
            /*
                Prevent opening of the CMs that are defined for those elements
                that are below the `this.target` in the DOM.
            */
            event.stopPropagation();

            /*
                If `defaultOnAlt` is `true` then check whether the alt key was
                not holded when the event was triggered or if it was. If it was
                then the code below just won't be executed, i.e. the default
                context menu will appear. But if `defaultOnAlt` is `false`, then
                just show a custom context menu in any way.
            */
            if (this.options.defaultOnAlt ? event.altKey === false : true) {
                /*
                    Prevent default (browser) context menu from appearing.
                */
                event.preventDefault();

                /*
                    Open the context menu if it's not `disabled`. Else just
                    remind that it is.
                */
                if (!this.options.disabled) {
                    this._open(event);
                }
            }
        }

        _registerCloseEventListener() {
            /*
                We need 2 sets of different event listeners to track the context
                menu closure. The first one is used if the `noRecreate` option
                is `true` and the second one if `false`.
            */
            if (this.options.noRecreate) {
                /*
                    If a click happened on the overlay and the click is not the
                    rightclick, then close the context menu. If the click is the
                    rightclick, then it will be handled by the appropriate event
                    listener defined below this if-else block.
                */
                this._overlay.addEventListener("mousedown", (event) => {
                    if (event.which !== 3) {
                        this.close();
                    }
                });
            } else {
                /*
                    Close the context menu on any click (whether right of left)
                    on the overlay. `contextmenu` event listener takes place
                    after the `mousedown`, so a new context menu will be opened
                    after the closure. This is the main idea lying under the
                    `noRecreate` option.
                */
                this._overlay.addEventListener("mousedown", (event) => {
                    this.close();
                });
            }

            /*
                But it's also necessary to close the context menu if the click
                happened not on the overlay, but over the context menu itself.
                The next 2 event listeners are necessary in order just to close
                the context menu in such case and NOT to recreate it (yeah, even
                if the `noRecreate` option is `false`).

                This part has earlier been in the `else` block. But it became
                obvious that we have to close the context menu on the right
                click over the cm, but not to close it on the left click,
                because there's a need to be able to interact with a scrollbar
                using a mouse cursor (but not only a wheel).
            */
            this._cm.addEventListener("mousedown", (event) => {
                event.stopPropagation();

                /*
                    Uncomment the part below to enable the context menu closure
                    on the left button click on the context menu, but be aware
                    of thereby disabling interaction with the scrollbar with a
                    mouse cursor.
                */
                // if (event.which !== 3) {
                //     // this.close();
                // }
            });

            this._cm.addEventListener("contextmenu", (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.close();
            });

            /*
                Here we listen to the rightclick anywhere "above" the overlay.
                This event listener is also responsible for hitting the menu
                key, so we check the `closeOnKey` option's state as well.
            */
            this._overlay.addEventListener("contextmenu", (event) => {
                event.stopPropagation();
                event.preventDefault();

                if (!this.options.closeOnKey ? event.which !== 0 : true) {
                    this.close();
                }
            });

            /*
                The event listener responsible for the CM closure on the
                "escape" key hit. We only need it to response once for 2
                ressons: to prevent document event listeners list polluting and
                to avoid fake event triggering after the CM has been closed. It
                means that we must remove it later (in the #close to be exact),
                but to do so we have to save the callback as the property of the
                instance. Using `{once: true}` as the third option is not
                suitable because a user may use some other keys during the time
                the CM is opened, which means that this event will be fired and
                removed even if the user pressed not the escape key. And this
                means that he won't be able anymore to close the CM by pressing
                the escape key. So we have to remove the event listener manually
                in the #close method.
            */
            this._escKeyListenerCallback = (event) => {
                if (event.keyCode === 27) {
                    event.stopPropagation();
                    this.close();
                }
            };

            document.addEventListener("keydown", this._escKeyListenerCallback);
        }

        _open(event) {
            /*
                Render an overlay. The overlay is used to track the context menu
                closure and also acts as sort of a grouping element.
            */
            this._renderOverlay();

            /*
                Build items DOM elements from the .items array.
            */
            this._buildItemElements();

            /*
                Render the invisible context menu in the top left corner of the
                page.
            */
            this._render();

            // add navigation events here? key down, key up, left, right, enter, etc...

            /*
                Determine where on the page the context menu must appear.
            */
            this._determinePosition(event);

            /*
                Set the correct context menu position (determined earlier with,
                probably, some additions in rare cases).
            */
            this._setPosition();

            /*
                Mark the overlay and the context menu as visible in the right
                position.
            */
            this._markAsVisible();

            /*
                Execute the opening callback.
            */
            this.options.callback.opening.call(this);
        }

        _renderOverlay() {
            /*
                Disable page scrolling via setting the `overflow` CSS property
                to `hidden`. This denies page scrolling (in any form, whether
                the obvious mouse wheel scrolling or a `page down`, `arrow up`,
                and so on).
            */
            document.documentElement.style.overflow = "hidden";

            /*
                Create a div element with `data-cm-overlay` attribute the value
                of which equals the `name` of the context menu (for styling
                purposes).
            */
            this._overlay = document.createElement("div");
            this._overlay.dataset.cmOverlay = this.options.name;

            /*
                Set the necessary styles that are absolutely must be, i.e. those
                that make the overlay what it is and whithout which (or in case
                of redefining of which) the overlay may begin to work
                incorrectly (if work at all).
            */
            this._overlay.style.cssText = "position: fixed !important;\
                                           display: block !important;\
                                           left: 0 !important;\
                                           top: 0 !important;\
                                           width: 100vw !important;\
                                           height: 100vh !important;\
                                           pointer-events: auto !important";

            /*
                Insert the overlay to the end of the body (after all the other
                elements currently presenting in the body).
            */
            document.body.appendChild(this._overlay);
        }

        _buildItemElements() {
            this._itemElements = this.items.map((item, i) => {
                return new ContextMenu.Item(item, i, this);
            });
        }

        _render() {
            /*
                Create a `div` element with `data-cm` attribute the value of
                which equals the `name` of the CM (for styling purposes also).
            */
            this._cm = document.createElement("div");
            this._cm.dataset.cm = this.options.name;

            /*
                Set the necessary styles that are absolutely must be. These
                styles make the CM what it is.
            */
            this._cm.style.cssText = "position: absolute !important;\
                                      display: block !important;\
                                      left: 0 !important;\
                                      top: 0 !important;\
                                      overflow: hidden;";

            /*
                Create a list which will hold all the items of the CM.
            */
            let list = document.createElement("ol");

            /*
                Populate the list with items.
            */
            this._itemElements.forEach((item) => {
                list.appendChild(item);
            });

            /*
                Insert the list inside the context menu (inside the `div`
                element).
            */
            this._cm.appendChild(list);

            /*
                Insert the context menu inside the overlay.
            */
            this._overlay.appendChild(this._cm);
        }

        _determinePosition(event) {
            /*
                Where the click actually happened (viewport relative).
            */
            let clickedX = event.clientX,
                clickedY = event.clientY,

                /*
                    The width and height of the viewport equals the width and
                    height of the overlay because the overlay's `width` and
                    `height` CSS proerties have been set using `vw` and `vh`.
                    I don't remember why you can't use something like
                    `window.inner(Width|Height)` here, but trust me, this
                    approach is way better and more reliable.
                */
                viewportWidth = this._overlay.getBoundingClientRect().width,
                viewportHeight = this._overlay.getBoundingClientRect().height,

                /*
                    The width and height of the yet invisible context menu. By
                    the way, this is the reason of why it was necessary to
                    render the CM before (even though invisible).
                */
                cmWidth = this._cm.getBoundingClientRect().width,
                cmHeight = this._cm.getBoundingClientRect().height,

                /*
                    "Furthest" means the bottom right point of the context menu.
                */
                furthestX = clickedX + cmWidth,
                furthestY = clickedY + cmHeight;

                /*
                    The resulting position is initially equal to the coordinates
                    where the click happened.
                */
                this._position = {x: clickedX, y: clickedY};

            /*
                But if it's obvious that the context menu won't fit on the page,
                than transfer it if necessary, or simply force it to fit by
                setting it's position so the context menu will be rendered right
                in the corner (the case of the `transfer` option set to
                `false`).
            */
            if (furthestX > viewportWidth) {
                if (this.options.transfer === "both" || this.options.transfer === "x") {
                    this._position.x -= cmWidth;
                } else {
                    this._position.x = viewportWidth - cmWidth;
                }
            }

            if (furthestY > viewportHeight) {
                if (this.options.transfer === "both" || this.options.transfer === "y") {
                    this._position.y -= cmHeight;
                } else {
                    this._position.y = viewportHeight - cmHeight;
               }
            }
        }

        _setPosition() {
            /*
                Setting the `x` coordinate. We have nothing to do with it, so
                it's OK just to set it as it is (because it has been previously
                determined).
            */
            this._cm.style.left = `${this._position.x}px`;

            /*
                For shortness later on. Familiar approach of getting the
                viewport height. `cmBottom` holds the coordinate of the bottom
                edge of the CM. `verticalMargin` is basically just an alias.
            */
            let viewportHeight = this._overlay.getBoundingClientRect().height,
                cmBottom = this._cm.getBoundingClientRect().bottom,
                verticalMargin = this.options.verticalMargin;

            /*
                If the `y` coordinate is above the top screen side (because the
                context menu has too many items and/or it has been transfered)
                then force the menu to be rendered in screen bounds, i.e make
                it's top edge's coordinate to be below the top screen (viewport)
                side for the `verticalMargin` amount of pixels.
            */
            if (this._position.y < 0) {
                /*
                    If the context menu now doesn't fit the height of the
                    viewport (that is almost always the case, becase we
                    previosly transfered the menu due to that reason), then we
                    shrink it, add arrows and enable a scrollbar (for now, may
                    be the scrollbar will be replaced with some other sort of
                    interaction (scrolling) in the future). This `if` condition
                    can not be combined with the previous one via the `&&`
                    because of incorrect `else` statement handling.
                */
                if (cmBottom > viewportHeight) {
                    /*
                        Setting the `y` position including the `verticalMargin`
                        and restricting the height of the context menu (also
                        including the `verticalMargin`).
                    */
                    this._cm.style.top = `${verticalMargin}px`;
                    this._cm.style.maxHeight = `${viewportHeight - verticalMargin * 2}px`;

                    /*
                        Prepare the "up" and "down" arrows.
                        `data-cm-item="arrow"` attribute may also be treated as
                        "special", but we don't add it to the list of allowed
                        specials because we don't want a user to use arrows
                        anywhere else (among items). We also use the same
                        identidier for both "up" and "down" because they will
                        probably be styled the identical. It's still possible to
                        overcome this restriction though.
                    */
                    let arrowUp = document.createElement("div");
                    let arrowUpChar = document.createTextNode("▲");
                    arrowUp.appendChild(arrowUpChar);
                    arrowUp.dataset.cmItem = "arrow";

                    let arrowDown = document.createElement("div");
                    let arrowDownChar = document.createTextNode("▼");
                    arrowDown.appendChild(arrowDownChar);
                    arrowDown.dataset.cmItem = "arrow";

                    /*
                        Insert the arrows as the first and the last elements of
                        the context menu (around the actual menu that is the
                        `ol` element).
                    */
                    this._cm.insertBefore(arrowUp, this._cm.firstChild);
                    this._cm.appendChild(arrowDown);

                    /*
                        Now the the actual menu (`ol` element) is the second
                        element in the context menu (`div` element). Getting
                        the height of the `div` element and the height of the
                        two arrows for further calculations. Remember that the
                        arrows may still be styled independently one from
                        another, i.e. they may have different heights, so it's
                        good practice not to just multiply the height of the
                        first one by 2, but to encounter heights of the both.
                    */
                    let menu = this._cm.children[1],
                        cmHeight = this._cm.getBoundingClientRect().height,
                        arrowUpHeight = arrowUp.getBoundingClientRect().height,
                        arrowDownHeight = arrowDown.getBoundingClientRect().height;

                    /*
                        Restricting the actual menu's height to be the height
                        of the `div` element minus the height of the 2 arrows
                        and enabling a scrollbar to have access to all of the
                        items via scrolling.
                    */
                    menu.style.maxHeight = `${cmHeight - arrowUpHeight - arrowDownHeight}px`;
                    menu.style.overflow = "auto";
                }
            } else {
                /*
                    If the context menu fits on the page well, then just
                    explicitly set it's position to the earlier determined
                    without any tweaking.
                */
                this._cm.style.top = this._position.y + "px";
            }
        }

        _markAsVisible() {
            /*
                Here we can finally mark the CM as visible by respectively
                setting it's class attribute. Notice, that the CM has actually
                always been visible. The thing is that all the calculations
                happen so fast, that a user simply isn't able to notice the CM
                movement from the top left corner to the right position. This
                `visible` mark is necessary to add the user an ability to
                animate the appearance of the CM (for example using the CSS
                `opacity` property).
            */
            this._overlay.className = "visible";
            this._cm.className = "visible";
        }

        close() {
            /*
                Restore the initial `overflow` CSS property's value.
            */
            document.documentElement.style.overflow = "";

            /*
                Removing the overlay means removing all the footprints of the
                context menu together with it's event listeners.
            */
            this._overlay.remove();

            /*
                Remove escape key press event listener.
            */
            document.removeEventListener("keydown", this._escKeyListenerCallback);

            /*
                Execute the closure callback.
            */
            this.options.callback.closure.call(this);
        }

        static _checkTarget(target) {
            /*
                Checking if there is an already defined for this target context
                menu.
            */
            let alreadyDefined = this._instances.find((instance) => {
                return instance._target === target;
            });

            /*
                Warn and return a found one if any.
            */
            if (alreadyDefined) {
                return alreadyDefined;
            }
        }

        static get _defaultOptions() {
            return {
                name: "",
                disabled: false,
                defaultOnAlt: true,
                closeOnKey: false,
                noRecreate: true,
                transfer: "y",
                verticalMargin: 10,
                callback: {
                    opening() {},
                    closure() {}
                }
            };
        }
    }

    /*
        The static property that holds all the instances of the ContextMenu to
        prevent recreating.
    */
    ContextMenu._instances = [];

    ContextMenu.Item = class Item {
        constructor(descr, index, contextMenu) {
            /*
                Store the description, index of the item and the CM that this
                item belongs to as properties of the instance to have access to
                them in methods.
            */
            this.descr = descr;
            this.index = index;
            this.cm = contextMenu;

            /*
                Actually build the DOM node relying on the provided description
                (the object that describes the item).
            */
            this._buildNode();

            /*
                Return the built node as a ready-to-use DOM element.
            */
            return this._node;
        }

        _buildNode() {
            /*
                The description may take one of two forms: an object and a
                string. Using object a user defines custom items, and using
                string he defines "special" items like "separator". Therefore
                there're 2 deffirent ways of building the item.
            */
            if (typeof this.descr === "object") {
                this._buildFromObject();
            } else if (typeof this.descr === "string") {
                this._buildFromString();
            }
        }

        _buildFromObject() {
            /*
                If an object is provided as the description of the item, then we
                must create a `li` element with the text provided by the `title`
                property of the description object, add empty `data-cm-item`
                attribute to it and register the event listener responsible for
                tracking the action call. `tabIndex` attribute adds basic
                keyboard support for the interaction with the CM. TODO: there's
                currently no way to trigger an action using a keyboard.
            */
            let text = document.createTextNode(this.descr.title);
            this._node = document.createElement("li");
            this._node.tabIndex = 0;

            this._node.appendChild(text);
            this._node.dataset.cmItem = "";

            this._registerActionEventListener(this.descr.action);
        }

        _buildFromString() {
            /*
                If a string is provided as the description of the item, then
                this item must be trated as a special one. The (extensible) list
                of all the available special items is stored in the
                ::_specialItems static property. The elements that represent
                certain special items are also stored in there. Special items
                don't have actions attached to them so there's no need to add
                appropriate event listener (as it is in case of building the
                item from an object).
            */
            let type = ContextMenu.Item._specialItems[this.descr];
            this._node = document.createElement(type);

            this._node.dataset.cmItem = this.descr;
        }

        _registerActionEventListener() {
            /*
                Listen to `mouseup` (whether left of right button) and trigger
                the action attached to the item. Threshold in 200ms is necessary
                to avoid "falsy" action triggering. 200 is just an approximate
                value. More research is needed to establish the value more
                accurately.
            */
            setTimeout(() => {
                this._node.addEventListener("mouseup", (event) => {
                    this.descr.action.call(this.cm);
                    this.cm.close();
                });
            }, 200);

            /*
                We must also register some other event listeners that are
                responsible for correct CM closure handling.
            */
            this._registerBehaviorEventListener();
        }

        _registerBehaviorEventListener() {
            /*
                `action` triggers on `mouseup` event. But the `mousedown` and
                `contextmenu` events happen before the `mouseup`. It means that
                these events will bubble up the DOM tree and will soon or later
                lead to the CM closure. So we have to stop event propagation in
                order to prevent such behavior. This is why this method is
                named so.
            */
            this._node.addEventListener("mousedown", (event) => {
                event.stopPropagation();
            });

            this._node.addEventListener("contextmenu", (event) => {
                event.stopPropagation();
                event.preventDefault();
            });
        }

        static get _specialItems() {
            return {
                separator: "div"
            }
        }
    }

    return ContextMenu;
}();
