import { ScrollPosition } from './typings'

/**
 * Create function closure to run `fn` only once, all subsequent call is ignored!
 *
 * @param {Function} fn
 * @returns {Function}
 */
export function runOnce(fn: Function) {
  let flag = false
  return function () {
    if (flag) return
    flag = true

    // @ts-expect-error
    fn.apply(this, arguments)
  }
}

/**
 * Check from child element till parent element if all scrollable elements
 * are at top/middle/bottom position or if no-scroll.
 * If childElement is null, this will return 'middle'!
 *
 * @param {HTMLElement} childElement
 * @param {HTMLElement} parentElement
 * @returns {ScrollPosition} 'top' | 'middle' | 'bottom' | 'no-scroll'
 */
export function getScrollPosition(childElement: HTMLElement | null, parentElement: HTMLElement): ScrollPosition {
  const allScrollAtTop = isAllScrollAtTop(childElement)
  const allScrollAtBottom = isAllScrollAtBottom(childElement)
  return allScrollAtTop && allScrollAtBottom
    ? 'no-scroll'
    : allScrollAtTop
    ? 'top'
    : allScrollAtBottom
    ? 'bottom'
    : 'middle'

  function isAllScrollAtTop(element: HTMLElement | null): boolean {
    if (element === parentElement) return element.scrollTop === 0
    if (element?.scrollTop === 0) return isAllScrollAtTop(element.parentElement)
    return false
  }

  function isAllScrollAtBottom(element: HTMLElement | null): boolean {
    if (!element) return false
    const scroll = element.offsetHeight + element.scrollTop
    const height = element.scrollHeight - 1

    if (element === parentElement) return scroll >= height
    if (scroll >= height) return isAllScrollAtBottom(element.parentElement)
    return false
  }
}

// This software includes material derived from: Modal Dialog Example
// https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/dialog/#top.
// Copyright © 2023 World Wide Web Consortium. https://www.w3.org/copyright/software-license-2023/

/**
 * @description Set focus on descendant nodes until the first focusable element is found.
 * @param element DOM node for which to find the first focusable descendant.
 * @returns {boolean} true if a focusable element is found and focus is set.
 */
export function focusFirstDescendant(element: any): boolean {
  for (let child of element.childNodes) {
    if (attemptFocus(child) || focusFirstDescendant(child)) {
      return true
    }
  }
  return false
}

export function attemptFocus(element: any) {
  if (!isFocusable(element)) return false
  try {
    element.focus()
  } catch (e) {
    // continue regardless of error
  }
  return document.activeElement === element
}

function isFocusable(element: any) {
  if (element.tabIndex < 0 || element.disabled) return false

  switch (element.nodeName) {
    case 'A':
      return !!element.href && element.rel != 'ignore'
    case 'INPUT':
      return element.type != 'hidden'
    case 'BUTTON':
    case 'SELECT':
    case 'TEXTAREA':
      return true
    default:
      return false
  }
}
