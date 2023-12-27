# One Modal - Focus Management

Managing focus properly is the key for an accessible modal, but most of the time it is left entirely out or partially implemented. In nutshell, an accessible modal should behave as follow:

- On modal open, focus should be set on the first tabbable element or autofocus element if defined.
- While modal open, focus should be trapped inside modal.
- On modal close, focus should return to the element that was active before modal open.

This is a simplified requirement list of what is mentioned in "[Dialog (Modal) Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)" article, published by Web Accessibility Initiative (WAI). This article goes through the current methods used for achieving these requirement and comparing their advantages and disadvantages, to conclude with the method that is used for One Modal library, and its specific behavior for handling edge cases.

## Tabbable, Focusable and Inert

Before starting, it is worth learning the difference between the focus-categories of an HTML element. According to [ally.js](https://allyjs.io/what-is-focusable.html):

> An HTML element can be a member of exactly one of the following five categories:
>
> - Inert: The element is not interactive and thus not focusable.
> - Focusable: The element can be focused by script (element.focus()) and possibly the mouse (or pointer), but not the keyboard.
> - Tabbable: The element is keyboard focusable ("tabbable"), as it is part of the document's sequential focus navigation order. The element is also focusable by script and possibly the mouse (or pointer).
> - Only Tabbable: The element is only keyboard focusable, possibly by the mouse (or pointer), but it cannot be focused by script.
> - Forwards Focus: The element will forward focus to another element instead of receiving focus itself.
>
> *source: [allyjs.io/what-is-focusable.html](https://allyjs.io/what-is-focusable.html)*

Note: There is no consensus on the term "tabbable". Some use "tab-focusable" term from [Webkit](https://bugs.webkit.org/show_bug.cgi?id=22261), others use "tabbable" term which is more common and was used for the name of the selector `:tabbable` to grab such elements in [jQueryUI](https://api.jqueryui.com/tabbable-selector/).

## Focus-trap

Since trapping focus is essential requirement for a modal element, modal's libraries - if it concerns about the accessibility - tried different approaches to achieve that.At the first glance, it seems a simple task as someone can just listen to focus event and prevent it outside modal element, but dealing with focus is a bit tricky, since the focus event can't be prevented by calling `preventDefault()`, so with the current web technologies there is three possible ways to do focus-trap:

1. prevent the cause of the focus event, like `Tab` key press.
2. actively shifting the focus on `focus` event via `focus()` method to an element inside the modal.
3. making everything outside the modal not-focusable.

### 1. Prevent the cause of the focus event (Tab key)

In the situation, a `keydown` even listener is attached to both the first and last tabbable and focusable elements in the modal that check if the key-pressed is `Tab` and `preventDefault()`, hence the focus will not move.

Nevertheless, this isn't ideal as it works only on conventional keyboard, but doesn't consider other input devices that move focus, like TV remote or console controller, nor assistive technologies, like screen-reader, to navigate the page. Also it doesn't circulate the focus within the modal on its own nor cover cases where focus is set outside the focus-trap element via script or via a focus-forward element like `label`, unless it is combined with the second option of actively shifting focus.

### 2. Actively shifting focus

Actively shifting the focus on `focus` event via `focus()` method to an element inside the modal. It is the most common way among focus-trap and accessible-modal libraries. In fact, it is used in the example for [Dialog (Modal) Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) provided by Web Accessibility Initiative (WAI) on W3 organisation website, see [here](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/dialog/#top). The idea is to save the first and last focusable element in a modal, and listen for `focus` event on `document` in order to keep track of the active element and return the focus to the first or last element in the modal via `focus()` when an element outside the modal is focused. An easier implementation is listening to `focusout` event on the modal element and return it to the first element, but this doesn't consider backward navigation (`Tab` + `Shift`).

Since the focus here does occur on an element outside the focus-tap area before `focus` event fire, the page might scroll to that element first before focus is shifted in the callback, hence this might cause flickering effect. To fix this, two invisible and tabbable elements, usually `<div tabindex="0"></div>` are added before and after trap-area such that focus move to them when it leaves modal, hence scroll effect doesn't happen.

However, this is not quite the perfect solution, as actively shifting focus to keep it inside modal means focus will never reach the end of the document. This might be problematic and causes inconsistent behavior. Currently, all modern browser set the focus on the url/search bar or browser's navigation UI after the focus reach the end of the document, and before return it back to the document again. Also, think about other cases where reaching the end of document won't circulate focus like being inside `iframe`.

An element with focus-trap should act as it is the only element in the document to interact with, and keep the natural behavior of the browser to determine what should happen before circulating the focus. This leads to the last option!

### 3. Making everything outside the modal not focusable

As for the last option, it is trivial to make an element and all its descendant not-focusable with the `inert` attribute, which is now standard and fully supported on latest version of all modern browsers. However, versions before 2022/2023 doesn't support it, therefore a polyfill should be considered. To make a focus-trap, simply add `inert` attribute to all siblings of the modal element and also to all siblings of its parent element, repeat recursively until reaching the`body`.

In contrast to the impossibility of preventing focus to occur on an element, making an element not tabbable is possible and fairly easy even without `inert` attribute by using `tabindex="-1"`, which is the method used to make `inert` polyfill. At the end, navigating the document is concerned with tabbable elements and not focusable element [see the differences here](#tabbable-focusable-and-inert)

### Honorable mention: CSS-Tricks

Before ending this section, an honorable mention goes to the CSS-Tricks community for surprising us again with [a css approach to trap focus inside of an element](https://css-tricks.com/a-css-approach-to-trap-focus-inside-of-an-element/). Spoiler alert! it falls under the second method mentioned above, nevertheless recommended to read!

### One Modal approach: Progressive Enhancement

In One Modal, we have internally implemented and tested all of the above mentioned options, thus this article is from first-hand experience with the ups and downs of each method. At the end, we subtle down on using `inert`. This enables us also to implement features that wasn't possible before like *local-modals* for part of the DOM tree, and allow One Modal to have an enhanced accessibility that match the newly added `<dialog>` element like no other modal-library currently available. For better browser support, a fallback to trap-focus using the second method is implemented - [Progressive Enhancement](https://developer.mozilla.org/en-US/docs/Glossary/Progressive_Enhancement), as it is more lightweight than shipping the library with entire polyfill for `inert`. Nonetheless, users of One Modal can opt-in to add polyfill for `inert` manually to have unified user experience across broad range of browsers.

## Moving focus to the modal

As mentioned in the requirement above, when modal is open, the focus should move to the first element with [autofocus](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/autofocus) attribute if existed, or to the first tabbable, element in the modal otherwise. To find such element, a list of tab-focusable element can be queried and checked first if any has the `autofocus` attribute to focus it, else the first element in the list can be focused.

The list start very short with basic element `a, button, textarea, input, select`, but quickly grows to many uncommon focusable element `area, embed, object, iframe, embed`, then we had to filter them according to specific attributes like `type`, `disabled`, `ref` and `href`. That is all and we haven't started on different behavior for focusable element between different browsers, check the [table here](https://allyjs.io/data-tables/focusable.html) and hope that this list is exhaustive and up-to-date with newly added HTML element.

```js
let focusableElementsSelector = `a[href]:not([disabled]), area[href], button:not([disabled]),
  textarea:not([disabled]), input:not([type="hidden"]):not([disabled]),  
  select:not([disabled]), iframe, object, embed, [tabindex], [contenteditable]`
```

### Focus-attempt

To mitigate any potential issue mentioned above, One Modal takes different approach, by checking `tabindex` first to ensure the element is tabbable, and not only focusable, then attempting focus via `focus()` method on each element within the active modal-sheet element traversing the DOM depth-first from the start to the end. When the element doesn't have negative `tabindex`, and focus-attempt succeed, this element is considered a tab-focusable element by the definition of that specific browser. In this way, we don't have to keep the list of focusable elements up-to-date, and keep the decision of determining if element is focusable or not to the browser.

> The HTMLElement.focus() method sets focus on the specified element, **if it can be focused**.
>
> *source: [MDN web docs](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus)*

```ts
function attemptFocus(element) {
  if (element.tabIndex < 0) return false
  try {
    element.focus()
  } catch (e) {
    // continue regardless of error
  }
  return document.activeElement === element
}
```

This approach in fact was inspired by the example provided for [Dialog (Modal) Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

At this point, there is one edge-case to handle, in which the first tabbable element is outside of the viewport. Focusing such element will cause scroll effect and this results in bad user experience. So before focus-attempt, an element is checked it it is visible in the viewport, otherwise focus is set to the active modal-sheet with `tabindex="-1"`, such that it won't effect the tab-order of the page and only get focused via script.

## Update Dec 2023

Considering [the proposal regarding the initial focus of the `<dialog>` element](https://github.com/whatwg/html/wiki/dialog--initial-focus,-a-proposal), and following the recent change of browsers default behavior to treat `<dialog>` as tabbable element (namely Chrome and Firefox), modal-sheet are now also tabbable by default, hence not only focusable via script. The effect can be observed when cycling the focus in modal mode or when the container receives the focus in dialog mode, where the container element get focused before it passes to its descendants. This change is to ensure One Modal deliver consistent behavior for web-users and capture all characteristics of the native `<dialog>` element, while maintaining a great browser support and offering advanced features with amazing transitions.

Optionally, this change can be reversed by passing `tabindex="-1"` in `modalSheetAttribute` prop on component initialization or pass it for specific modal-sheet on calling:

```ts
modal.push(<Component />, {tabindex: -1})
modal.show(<Component />, {tabindex: -1})
```

## Resources

- <https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/>
- <https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/dialog/#top>
- <https://stackoverflow.com/a/75411648/14686695>
- <https://css-tricks.com/a-css-approach-to-trap-focus-inside-of-an-element/>
- <https://allyjs.io/data-tables/focusable.html>
- <https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-modal>
- <https://samthor.au/2021/inert/>
- <https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus>
- <https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inert>
- <https://github.com/whatwg/html/wiki/dialog--initial-focus,-a-proposal>

## Disclaimer

This article was 100% written by a human and not generated using GPT nor other type of AI.
