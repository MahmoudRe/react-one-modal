# One Modal - Check Element Visibility

To ensure a great user experience in OneModal, we check the element visibility before attempting to set the focus on it. That means the element is visible within the scrollable area - if existed - inside the modal. We have researched for the best practices to do so, and here is the results!

## Element Viability: Check vs Detect

When you search for the term "check element's visibility", you will directly encounter "detect element's visibility" topic which is common in the web community, because of various essential applications like registering AD impression, lazy-loading images, creating infinity scroll, or starting "intro" transition whenever the element is visible - though the last use-case is done nowadays with the css `animation` property. Detecting element's visibility means that repeatedly checking element's visibility and execute a callback accordingly, this can be done by `setInterval()` function or on `DOMContentLoaded`, `load`, `resize`, `scroll` events - for example [this famous answer by Dan on StackOverflow](https://stackoverflow.com/a/7557433/11901007). Therefore, it is important to differentiate between detecting visibility and checking visibility with regards to the best practice and performance. While some of the wildly adopted practices by the community are now considered no longer recommended like `element.getBoundingClientRect()`, it is mostly referred to in the context of "detecting visibility" where extra milliseconds on each check can add up to cause a laggy scrolling, unpleasant animation and bad user experience in general.

## Factors to determine element visibility

Element visibility is determined by multiple factors, namely:

1. element's position relative to the viewport. Is the element outside the viewport?
2. element's position relative to a scrollable container - Is the element outside the visible area of a scrollable container?
3. element's position relative to the position of other elements in higher stacking context in the page - Is the element hidden by another element on top, ie. in higher stacking context?
4. element's style and the style inherited from its ancestor's - Is the element or one of its ancestors have any of these css styles applied: `visibility: hidden`, `opacity: 0`, `height: 0`, `width: 0` `max-height: 0`, `max-width: 0`, `transform: translate([X], [Y])`, `transform: scale(0)`, or `display: none`?

The factors are ordered from the most uncontrollable factor, ie. element's position in the viewport where in normal web-page some parts of the page are out of the view and it's wildly differ according to the medium, from large monitor to small mobile screen; to the most controllable factor, ie. css style applied to the element, which can be specifically set and controlled by the developer.

In the web community, most implementations of `isElementVisible(element)` are concerned with the first factor, ie. element's position relative to the viewport, while some more specific implementation take a container element as second argument to check viability relative to that specific container element. This is because these implementation are meant for specific use cases mentioned above for _detecting_ element viability. Nonetheless, a comprehensive implementation that exhaustively cover all cases is needed for application where there is little to know about the website layout, like in developing a third-party libraries that count AD impressions. In this article we will go over each of these factors, analyze the different methods that was/is used with pros and cons of each method, provide a tested implementation, and building up for a comprehensive implementation that cover all factors.

## Visibility according to element position

There are three main methods that were/are used to determine element's visibility according to its position.

### 1. Manual calculation using offset properties [deprecated]

By using the `offsetParent`, `offsetTop`, `offsetLeft`, `offsetWidth`, and `offsetHeight` properties, we can calculate the position of an element and compare it to the viewport or a scrollable element's size and position to check its visibility. The calculation involves summing up the offsets of the element and all its ancestors to get the total offset until the border of the document.

By the time you are reading this, this technique is considered ancient, dating back to the era before IE 7; Imagine! Nevertheless, we are mentioning it here as a legacy of how developers dealt with such issues back then.

<details>
  <summary>
  If you are interested in the implementation, check it out here.
  </summary>
  </br>

Check if the entire element is in the viewport:

```ts
function isFullyInViewport(el) {
  var top = el.offsetTop
  var left = el.offsetLeft
  var width = el.offsetWidth
  var height = el.offsetHeight

  while (el.offsetParent) {
    el = el.offsetParent
    top += el.offsetTop
    left += el.offsetLeft
  }

  var viewportHeight = document.documentElement.clientHeight || document.body.clientHeight
  var viewportWidth = document.documentElement.clientWidth || document.body.clientWidth
  var scrollX = document.documentElement.scrollLeft || document.body.scrollLeft
  var scrollY = document.documentElement.scrollTop || document.body.scrollTop

  return (
    top >= scrollY &&
    left >= scrollX &&
    top + height <= scrollY + viewportHeight &&
    left + width <= scrollX + viewportWidth
  )
}
```

Check if part of the element is in the viewport:

```ts
function isPartiallyInViewport(el) {
  var top = el.offsetTop
  var left = el.offsetLeft
  var width = el.offsetWidth
  var height = el.offsetHeight

  while (el.offsetParent) {
    el = el.offsetParent
    top += el.offsetTop
    left += el.offsetLeft
  }

  var viewportHeight = document.documentElement.clientHeight || document.body.clientHeight
  var viewportWidth = document.documentElement.clientWidth || document.body.clientWidth
  var scrollX = document.documentElement.scrollLeft || document.body.scrollLeft
  var scrollY = document.documentElement.scrollTop || document.body.scrollTop

  return (
    top < scrollY + viewportHeight && left < scrollX + viewportWidth && top + height > scrollY && left + width > scrollX
  )
}
```

> The source code inspired from: [Peter Mortensen at StackOverflow](https://stackoverflow.com/a/125106), with some changes because some browser API's like `window.innerHeight` wasn't supported before IE9. Here is a test to different way to obtain viewport size and position back then: [Getting window size](https://www.softcomplex.com/docs/get_window_size_and_scrollbar_position.html)

</br>
</details>

It is considered a bad practice to use this method today because it falls short in many aspects, such as:

- Inaccuracy when the element is inside a scrollable area. In this case, even if the element is within the visible area of a scrollable container, this method considers the element's position relative to the top-left corner of all scrollable containers.
- Inaccuracy when the element is in a different stacking context than the body, such as when it has a `position: fixed` or `position: absolute`.
- Performance cost due to unnecessary [DOM reflow](https://developers.google.com/speed/docs/insights/browser-reflow) caused by accessing offset properties on each ancestor of the element.
- Not considering the situations where the element has `display: none`, `visibility: hidden`, or `opacity: 0`.
- Not considering the situation where the element is hidden under another element with a higher stacking context.

### 2. element[.getBoundingClientRect()](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect)

The common way to detect if an element is visible, and it was considered as the best practice before introducing the [Intersection Observer API](#3-intersection-observer-api). It is still the go to solution if there is a need to target browsers before 2019. Here, `element.getBoundingClientRect()` function returns `DOMRect` object with the size and position of an element relative to the viewport, so no need to manually calculate this from offsets, and it is accurate when the element is within the visible area a scrollable container. By having this information, we can directly check weather an element is within the viewport of within the visible area of a scrollable container.

Here is the code to check if the element is visible in the viewport:

```ts
function isFullyVisibleInViewport(element) {
  let { top, bottom, left, right } = element.getBoundingClientRect()
  return top >= 0 && left >= 0 && bottom <= window.innerHeight && right <= window.innerWidth
}
```

> <details>
> <summary>
> If, God forbid, you have to support IE 6-8, then this will still work, just use `document.documentElement` as fallback.
> </summary>
> </br>
>
> ```js
> function isElementInViewport(el) {
>   var rect = el.getBoundingClientRect()
>
>   return (
>     rect.top >= 0 &&
>     rect.left >= 0 &&
>     rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
>     rect.right <= (window.innerWidth || document.documentElement.clientWidth)
>   )
> }
> ```
>
> Source: [Dan at StackOverflow](https://stackoverflow.com/a/7557433)
>
> </details>

However, being within the viewport doesn't mean visible to user, since the element can be within the viewport, but hidden within a scrollable container. With some modification, we can check weather it is within the visible area of given container element:

```ts
function isFullyVisibleInContainer(element, container) {
  const { bottom, height, top } = element.getBoundingClientRect()
  const containerRect = container.getBoundingClientRect()

  return (
    top >= containerRect.top &&
    bottom <= containerRect.bottom &&
    left >= containerRect.left &&
    right <= containerRect.right
  )
}
```

Now we can combine the two implementation to get to the solution that check the element viability according to its position relative to the viewport and all its scrollable ancestors.

```ts
function isFullyVisible(element) {
  const elementRect = element.getBoundingClientRect() // cache it
  return isFullyVisible(elementRect, element.parentElement)
}

function isFullyVisibleInContainer(elementRect, container) {
  const { bottom, height, top } = elementRect

  if (!container || container == document.documentElement)
    return top >= 0 && left >= 0 && bottom <= window.innerHeight && right <= window.innerWidth

  const containerRect = container.getBoundingClientRect()

  return (
    top >= containerRect.top &&
    bottom <= containerRect.bottom &&
    left >= containerRect.left &&
    right <= containerRect.right &&
    isFullyVisibleInContainer(elementRect, container.parentElement)
  )
}
```

The issue with `getBoundingClientRect()` is that it runs synchronously on the main thread. This issue becomes prominent when we talk about detecting viability with large number of elements, eg. repeatedly checking viability on scroll event.

### 3. [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)

The modern and performant way to determine element visibility according it its position. The performance cost compared to `getBoundingClientRect` is mentioned in the article: [How to get element bounds without forcing a reflow](https://toruskit.com/blog/how-to-get-element-bounds-without-reflow/). The main performance gain is that the position calculation run asynchronously on different thread, hence not blocking the main thread. Note that the callback of the `observer` still runs on the main thread, which is expected as the callback is concerned with small tasks reacting to the calculation that has been already done.

```ts
const observer = new IntersectionObserver(([entry]) => {
  if (entry.isIntersecting) {
    // YOUR CODE, when element become partially or fully visible
  } else {
    // YOUR CODE, when element become fully hidden
  }
})

const element = document.querySelector('[SELECTOR]')
observer.observe(element)
```

> This is a simplified implementation for simple visibility detection when element become visible/hidden. Consult [the documentation](<(https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)>) for more complex cases, like executing the callback on specific `intersectionRatio` threshold.

The advantages of this method:

- East to use (relatively speaking), the callback is executed when the element's visibility changes, and you will get the new value `isIntersecting` with the `intersectionRatio`, `intersectionRect`, `boundingClientRect` as arguments.
- Performant, run asynchronously off the main thread, doesn't block page rendering.
- Does consider complex cases where the element's position is within the viewport, but outside the visible area of an overflow element, which is explicitly mentioned in the W3C specification as [content-clip](https://w3c.github.io/IntersectionObserver/#intersectionobserver-content-clip).
- Does consider the case where the element is effected by `display: none`.

However, it doesn't come without drawbacks:

- Limited browser support, unless you don't care about browser's versions before 2019.
- Quite complex if you only need to check visibility synchronously, as condition to execute specific code within large function (in our case, for example, inside the focus-shifting function when modal is fully open).
- Only consider element visibility according to its position in its stacking context, and doesn't consider if element is hidden under another element with higher stacking context.

## Visibility according to stacking context

What if an element is hidden under another element with `position` property set to `fixed`, `absolute` or `sticky`? Spoiler alert, it is will get very complex down here!

To check for that we need to check the z-index and DOM order of all the siblings of the parent element, and if any have higher stacking context (ie. have higher z-index, or if same z-index come after the element in the DOM tree, while being or having element with `position` property set to `fixed`, `absolute` or `sticky`). In this case, we have to check the positions with the previous methods and see if any overlapping occurs, and if so, weather those elements does actually block our element visibility, see [next section](#visibility-according-to-element-style).

Well, it is quite complex, so have to skip the implementation of this approach!

Another easier approach, is using `document.elementsFromPoint()` function (browsers +2018 version)

> WIP: implementation

```ts
function isBlockedByHigherStackingContext(element) {
  const rect = element.getBoundingClientRect();
  const elements = document.elementsFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
  const index = elements.indexOf(element);
  if (index === -1) {
    return true; // Element is not under the point, so it's not visible
  }
  for (let i = 0; i < index; i++) {
    const style = window.getComputedStyle(elements[i]);
    if (style.position !== 'static' && style.zIndex !== 'auto') {
      const zIndex = parseInt(style.zIndex, 10);
      if (!isNaN(zIndex) && zIndex > 0) {
        return true; // There's an element with a higher stacking context in front of the element
      }
    }
  }
  return false;
}
```

## Visibility according to element style

In JavaScript, checking an element's visibility according to its style can be achieved by using the `getComputedStyle` function. This function returns an object containing the values of all CSS properties of an element, including those set by its style attribute and those inherited from its ancestors.

For instance, if an element or any of its ancestors has a style of `display: none` or `visibility: hidden`, the element is not visible. Similarly, if an element has a style of `opacity: 0`, it is fully transparent and thus not visible. Also, we need to recursively check the computed styles of the element and all its ancestors as well. Here's an implementation to check these conditions:

```ts
function isVisible(element) {
  let currentElement = element
  let isVisibilityHiddenOverride = false // ignore ancestor `visibility: hidden` if it has been override

  while (currentElement) {
    const style = window.getComputedStyle(currentElement)

    if (style.display === 'none' || style.opacity === '0' || style.height === '0' || style.width === '0' || style.maxHeight === '0' || style.maxWidth === '0') return false

    if (style.visibility === 'visible') isVisibilityHiddenOverride = true
    else if (style.visibility === 'hidden' && !isVisibilityHiddenOverride) return false

    currentElement = currentElement.parentElement
  }

  return true
}
```

In this implementation `isVisibilityHiddenOverride` is used to track whether an element's `visibility` property has been explicitly set to `visible` or `initial`, which would override any `visibility: hidden` set on its ancestors.

## Still No Silver Polite

Now, all what we have done above is covering the conventional cases that determines an element's visibility, but think about:

- Element is fully visible but its transparent padding is not yet fully visible, where the padding is not intended as part of the element and used [as alternative to margin](https://www.youtube.com/watch?v=KVQMoEFUee8) because of [the rules of margin collapse](https://www.joshwcomeau.com/css/rules-of-margin-collapse/).
- Element is visible under transparent `<image>`, `<svg>`, or any element with `clip-path` css property.
- Element is visible under another element with transparent background, maybe not fully transparent, but `opacity: 0.8` or `background: rgba(0, 0, 0, 0.65)`.
- Having multiple containers each with `opacity: 0.3` for example, is this element can be considered partially visible? Before going to add up all the `opacity` values that effect the element, how about this those element having `background: #43ff6459`!
- `transform` property that shifts the element position or scale it, where the actual position in the layout would be different from the render!

Furthermore,

- Is element with `opacity: 0.01` considered as partially visible? what is the threshold?
- Is black box on black background is considered visible? Do we need to consider specific amount of contrast with background to consider an element visible? what is the threshold?

Well.. we can go deep into abusing any method of detecting visibility, and it is hard. How you know now if your paid AD impressions was actually visible to the user? does the visibility check method account for all the edge cases? Maybe that is an issue for bigger company to worry about. For now, you know what is going on on your website, so choose what serves your case the best.

## OneModal use-case / approach

In OneModal, we need to make sure that the first tabbable (tab-focusable) element that receives the initial-focus on modal-sheet open is visible relative the container, ie. active-sheet, to not cause undesirable scrolling and jumping over potentially important content. To combine this functionality with our approach of attempting focus to determining focusable element, mentioned (here)[LINK-TO-FOCUS-MANAGMENT-FOCUS-ARTICLE], we have first to check the element visibility according to its position relative the modal container, before attempting to set the focus on that element. Considering this use-case, we went for the `element.getBoundingClientRect()` method, as the performance cost compared to intersection Observer API is negligible here since it is done only once on relatively small number of elements. Furthermore, we can apply some optimization to make it even faster, like caching the container's position calculation (`rect`) to use down its DOM tree (we already do depth-first search to find the first tabbable element), and skip the check for most elements if they aren't tabbable or even skip entire DOM tree because the parent is fully not visible, hence non of its children is. Additionally, it is desirable that the focus-shift is done synchronously, considering the complexity and the cost of `await`-ing the promisify-ed version `IntersectionObserver()` (TO DO: real world test).
