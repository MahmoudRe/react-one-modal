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
 * Given two Modal elements, check if the first element is visually bellow the second element.
 * The check is done as follow:
 * 1. If the two elements have the same parent, check their z-index:
 *    - If the two elements have the same z-index, check the DOM order of the elements.
 *    - If the first element has lower z-index, it is bellow the second element
 *    - Otherwise it is above.
 * 2. If the two elements do not have the same parent,
 *    - If one element is a descendant of the other, the parent is visually bellow the descendant.
 *    - If one element's root is a descendant of the other element's root,
 *       traverse up the DOM tree from the element of the child-root until having the other root as parent,
 *       then call this function recursively on the two direct descendants.
 *    - Otherwise the two modals elements aren't interfering with each other, return false.
 *
 * @param thisModalEl
 * @param otherModalEl
 * @returns true if the first element is visually bellow the second element, false otherwise.
 */
export function isModalBellow(thisModalEl: Element, otherModalEl: Element): boolean {
  const thisModalRootEl = thisModalEl.parentElement
  const otherModalRootEl = otherModalEl.parentElement
  if (!thisModalRootEl || !otherModalRootEl) return false

  if (thisModalRootEl === otherModalRootEl) {
    const zIndexThisElement = parseInt(getComputedStyle(thisModalEl).zIndex) || 0
    const zIndexOtherElement = parseInt(getComputedStyle(otherModalEl).zIndex) || 0

    return (
      zIndexThisElement < zIndexOtherElement ||
      (zIndexThisElement === zIndexOtherElement &&
        !!(thisModalEl.compareDocumentPosition(otherModalEl) & Node.DOCUMENT_POSITION_FOLLOWING))
    )
  }

  const compElements = thisModalEl.compareDocumentPosition(otherModalEl)
  if (compElements & Node.DOCUMENT_POSITION_CONTAINS) return false // expect the edge case when thisModalEl has z-index < 0, since thisModalEl is modal, this shouldn't happen!
  if (compElements & Node.DOCUMENT_POSITION_CONTAINED_BY) return true // expect the edge case when otherModalEl has z-index < 0, since otherModalEl is modal, this shouldn't happen!

  const compRoots = thisModalRootEl.compareDocumentPosition(otherModalRootEl)

  // case 1: thisModalRootEl is a descendant of otherModalRootEl, update thisModalEl to be the direct child of otherModalRootEl (the common parent)
  if (compRoots & Node.DOCUMENT_POSITION_CONTAINS) {
    while (otherModalRootEl !== thisModalEl.parentElement) thisModalEl = thisModalEl.parentElement as Element
  }
  // case 2: thisModalRootEl is a ancestor of otherModalRootEl, update otherModalEl to be the direct child of thisModalRootEl (the common parent)
  else if (compRoots & Node.DOCUMENT_POSITION_CONTAINED_BY) {
    while (thisModalRootEl !== otherModalEl.parentElement) otherModalEl = otherModalEl.parentElement as Element
  }
  // case 3: thisModalRootEl and otherModalRootEl are not related, hence modals are not interfering with each other
  else return false

  return isModalBellow(thisModalEl, otherModalEl)
}

/**
 * Append a given string to the end of the specified attribute value with space as delimiter.
 * @returns the new value of the attribute after modification.
 */
export function appendToAttribute(element: Element | null, attribute: string, toAppendStr: string) {
  if (!element) return ''
  const oldVal = element.getAttribute(attribute) || ''
  const newVal = oldVal ? oldVal + ' ' + toAppendStr : toAppendStr
  element.setAttribute(attribute, newVal)
  return newVal
}

/**
 * Remove a given string from the specified attribute value.
 * @returns the new value of the attribute after modification.
 */
export function removeFromAttribute(element: Element | null, attribute: string, toAppendStr: string) {
  if (!element) return ''
  const value = element.getAttribute(attribute)?.replace(toAppendStr, '').trim() || ''
  if (value) element.setAttribute(attribute, value)
  else element.removeAttribute(attribute)
  return value
}
