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

/**
 * Given two HTML elements, check if the first element is visually bellow the second element, as follow:
 * 1. If the two elements have the same parent, check their z-index:
 *    - If the two elements have the same z-index, check the DOM order of the elements.
 *    - If the first element has lower z-index, it is bellow the second element, otherwise it is above.
 * 2. If the two elements do not have the same parent, 
 *    - If one element is a descendant of the other, the parent is visually bellow the descendant.
 *    - Otherwise, traverse up the DOM tree until a common parent is found, 
 *       then call this function recursively on the two direct descendants 
 *       of the common parent that contain the two elements.
 * 
 * @param thisElement
 * @param otherElement
 * @returns true if the first element is visually bellow the second element, false otherwise.
 */
export function isElementBellow(thisElement: Element, otherElement: Element): boolean {
  if (!thisElement.parentElement || !otherElement.parentElement) return false

  if (thisElement.parentElement === otherElement.parentElement) {
    const zIndexThisElement = parseInt(getComputedStyle(thisElement).zIndex) || 0
    const zIndexOtherElement = parseInt(getComputedStyle(otherElement).zIndex) || 0

    return (
      zIndexThisElement < zIndexOtherElement ||
      (zIndexThisElement === zIndexOtherElement &&
        !!(thisElement.compareDocumentPosition(otherElement) & Node.DOCUMENT_POSITION_FOLLOWING))
    )
  }

  const compElements = thisElement.compareDocumentPosition(otherElement)
  if (compElements & Node.DOCUMENT_POSITION_CONTAINS) return false // expect the edge case when thisElement has z-index < 0, since otherElement is modal, this shouldn't happen!
  if (compElements & Node.DOCUMENT_POSITION_CONTAINED_BY) return true // expect the edge case when otherElement has z-index < 0, since otherElement is modal, this shouldn't happen!

  // TO DO: optimize to get the common parent, instead of comparing on each iteration
  const compParents = thisElement.parentElement.compareDocumentPosition(otherElement.parentElement)

  if (compParents & Node.DOCUMENT_POSITION_CONTAINS)
    return isElementBellow(getDirectDescendantContains(otherElement.parentElement, thisElement), otherElement)

  if (compParents & Node.DOCUMENT_POSITION_CONTAINED_BY)
    return isElementBellow(thisElement, getDirectDescendantContains(thisElement.parentElement, otherElement))

  return isElementBellow(thisElement.parentElement, otherElement.parentElement)
}

/**
 * Get the direct descendant of the parent element that contains the targetElement.
 * 
 * @param parent
 * @param targetElement 
 * @returns The direct descendant that contains the target element.
 */
function getDirectDescendantContains(parent: Element, targetElement: Element): Element {
  if (!targetElement.parentElement) return targetElement
  return parent === targetElement.parentElement
    ? targetElement
    : getDirectDescendantContains(parent, targetElement.parentElement)
}
