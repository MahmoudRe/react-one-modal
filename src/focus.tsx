import { RefObject } from 'react'
import { appendToAttribute, isModalBellow, removeFromAttribute } from './utils'
import { Action } from './typings'

export default class Focus {
  modalRef: RefObject<HTMLElement> = { current: null }
  modalId: string = ''
  isFocusShiftRequired: boolean = false // flag to set in handleModalWillClose, use in handleModalHasClosed

  constructor(modalRef: RefObject<HTMLElement>, modalId: string) {
    this.modalRef = modalRef
    this.modalId = modalId
  }

  get modalElement() {
    if (this.modalRef.current instanceof HTMLElement) return this.modalRef.current
    throw new Error('Modal element is not an instance of HTMLElement')
  }

  get rootElement() {
    return this.modalElement.parentElement ?? document.body
  }

  /**
   * This function should be called to prepare for modal opening, ie. before opening-animation
   */
  handleModalWillOpen = () => {
    let prevActiveElement = document.activeElement
    let blockingModals = this.getBlockingModals()

    if (blockingModals.length) {
      const lowestBlockingModalId = blockingModals
        .reduce((lowestModalEl, modalEl) => (isModalBellow(lowestModalEl, modalEl) ? lowestModalEl : modalEl))
        .getAttribute('data-omodal-id')

      prevActiveElement = document.querySelector(`[data-omodal-blurred-by="${lowestBlockingModalId}"]`)
      this.modalElement.setAttribute('data-omodal-blurred-by', lowestBlockingModalId || '') // so when lowestBlockingModal closes, the focus moves to this modal (first element or autofocus)
    } else {
      // TO DO:
      // - this modal should be already `inert` or child of `inert` (dynamically added siblings to an opened modal should be inert-ed).
      this.stop()
      this.modalElement.removeAttribute('inert')
      this.modalElement.removeAttribute('data-omodal-inert-by')
    }

    prevActiveElement?.setAttribute('data-omodal-blurred-by', this.modalId)
    this.setInertOnSiblings()
    this.preventPageScroll()
  }

  /**
   * This function should be called after modal has been opened, ie. after opening-animation
   */
  handleModalHasOpened = () => {
    this.resume()
    if (!this.modalElement.hasAttribute('data-omodal-blurred-by')) this.setOnActiveSheet(Action.OPEN)
  }

  /**
   * Check if another modal with higher stacking context is already open.
   */
  getBlockingModals = () =>
    [...document.querySelectorAll(`.omodal:not([data-omodal-close]):not([data-omodal-id="${this.modalId}"])`)]
      .filter(this.isBlockedBy) // prettier-ignore

  /**
   * Check if this modal is bellow (blocked by) the given element with respect to visual stacking context.
   *
   * @param {Element} element
   * @returns {boolean}
   */
  isBlockedBy = (element: Element): boolean => isModalBellow(this.modalElement, element)

  /**
   * Set 'inert' attribute to siblings of this modal, excluding other modals that blocks this modal,
   * ie. have higher z-index, or comes later in DOM tree.
   * This also update the value of `data-omodal-inert-by` attribute of the effected siblings.
   *
   * @param element optional element to set `inert` on the sibling of this element instead of this modal.
   */
  setInertOnSiblings = (element?: Element) => {
    const el = element || this.modalElement
    if (!el || el === document.body || !el.parentElement) return

    for (let sibling of el.parentElement.children) {
      if (sibling === el || !(sibling instanceof HTMLElement) || (!element && this.isBlockedBy(sibling))) continue

      sibling.setAttribute('inert', '')

      if (element) continue
      appendToAttribute(sibling, 'data-omodal-inert-by', this.modalId)
    }
  }

  /**
   * Set inert on all other sheets and set focus on new active sheet.
   */
  setOnActiveSheet = (action = Action.SHEET_CHANGE, modalElement: Element = this.modalElement) => {
    const activeSheetEl = modalElement.querySelector('[data-omodal-sheet-state="active"]')
    if (!(activeSheetEl instanceof HTMLElement)) return

    activeSheetEl.removeAttribute('inert')
    this.setInertOnSiblings(activeSheetEl)

    if (action === Action.NONE) return activeSheetEl.focus()

    const selector = action === Action.OPEN ? 'autofocus' : '[data-omodal-lastfocus]'
    if (!Focus.attempt(activeSheetEl.querySelector(selector) as HTMLElement))
      Focus.setOnFirstVisibleDescendant(activeSheetEl)
  }

  /**
   * This function should be called before modal closing, ie. before close-animation
   */
  handleModalWillClose = () => {
    // if focus inside this modal, a focus-shift is needed, hence stop focus and resume after close-animation (handleModalHasClosed)
    this.isFocusShiftRequired = this.modalElement.contains(document.activeElement)
    if (this.isFocusShiftRequired) this.stop()
  }

  /**
   * This function should be called after modal has closed, ie. after close-animation.
   *
   * Note this function should be expected to run even when modal is already closed (eg. on mount and umount)
   *  or twice in case of unmount directly after close-animation.
   * This behavior of running twice to insure proper cleanup for modal opening and handleModalWillClose
   *  in case the modal was forcefully unmounted just after closing (ie. `close` state is false)
   *  but before close handler is called.
   */
  handleModalHasClosed = () => {
    ;[...document.querySelectorAll(`[data-omodal-inert-by~="${this.modalId}"]`)].forEach((e) => {
      if (!removeFromAttribute(e, 'data-omodal-inert-by', this.modalId)) e.removeAttribute('inert')
    })

    this.modalElement.setAttribute('data-omodal-close', 'completed')
    this.resume()

    if (!this.rootElement.querySelector(`.omodal:not([data-omodal-close])`))
      this.rootElement.removeAttribute('data-omodal-prevent-scroll')

    const previousFocusEl = document.querySelector(`[data-omodal-blurred-by="${this.modalId}"]`)
    previousFocusEl?.removeAttribute('data-omodal-blurred-by')

    const blockingModalId =
      this.modalElement.getAttribute('data-omodal-blurred-by') ||
      this.modalElement.querySelector('[data-omodal-blurred-by]')?.getAttribute('data-omodal-blurred-by')

    if (blockingModalId) previousFocusEl?.setAttribute('data-omodal-blurred-by', blockingModalId)
    else if (this.isFocusShiftRequired && previousFocusEl instanceof HTMLElement) {
      previousFocusEl?.hasAttribute('data-omodal-id')
        ? this.setOnActiveSheet(Action.SHEET_CHANGE, previousFocusEl)
        : previousFocusEl.focus()
    }
    // otherwise this is a local modal that is closed from outside its root, then keep the focus.

    this.isFocusShiftRequired = false // reset
  }

  preventPageScroll = () => this.rootElement.setAttribute('data-omodal-prevent-scroll', '')

  /**
   * To prevent effect of spamming keypress on open/close modal btn while animation is running,
   *  move focus to body till `handleModalHasOpened` or `handleModalHasClosed` is called (till animation end).
   * Before the modal is opened, we can't focus on the first element directly, since it will be hidden.
   */
  stop = () => {
    this.setOnRootElement()
    this.rootElement.addEventListener('focusin', this.setOnRootElement, true)
  }

  resume = () => {
    this.rootElement.removeEventListener('focusin', this.setOnRootElement, true)
  }

  setOnRootElement = () => {
    if (!this.rootElement.hasAttribute('tabindex')) {
      this.rootElement.tabIndex = -1
      this.rootElement.focus()
      this.rootElement.removeAttribute('tabindex')
    } else {
      this.rootElement.focus()
    }
  }

  /**
   * Set focus on descendant nodes until the first tab-focusable element is found.
   * @param element DOM node for which to find the first tab-focusable descendant.
   * @returns {boolean} true if a tab-focusable element is found and focus is set.
   */
  static setOnFirstVisibleDescendant = (element: Element | null, scrollableAncestorsRects: DOMRect[] = []): boolean => {
    if (!element) return false

    // Track the array of scrollable ancestors to cover cases where closest scrollable doesn't hide the element but higher scrollable ancestor does.
    // Call/cache the bounding-rect directly to avoid unnecessary calculations down its DOM tree.
    if (element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight)
      scrollableAncestorsRects.push(element.getBoundingClientRect())

    for (let i = 0; i < element.children.length; i++) {
      let child = element.children[i]
      if (!(child instanceof HTMLElement)) continue

      // Short-circuit to avoid unnecessary calculations
      if (child.tabIndex < 0)
        if (Focus.setOnFirstVisibleDescendant(child, scrollableAncestorsRects)) return true
        else continue

      // Check element visibility:
      // Considering the performance of getBoundingClientRect: https://toruskit.com/blog/how-to-get-element-bounds-without-reflow/
      // the performance cost is negligible here since it is done only once, the container calculations is cached
      // and it short-circuit if element isn't tabbable or its parent is completely not visible.
      // Since it desirable that focus-shift is done synchronously, the cost of `await`-ing promisified IntersectionObserver is worst.
      const childRect = child.getBoundingClientRect()
      const isFullyVisible = scrollableAncestorsRects.reduce(
        (visible, rect) =>
          visible &&
          childRect.top >= rect.top &&
          childRect.bottom <= rect.bottom &&
          childRect.left >= rect.left &&
          childRect.right <= rect.right,
        true
      )

      if (isFullyVisible && Focus.attempt(child)) return true

      const isPartiallyVisible = scrollableAncestorsRects.reduce(
        (visible, rect) =>
          visible &&
          ((childRect.top >= rect.top && childRect.top <= rect.bottom) ||
            (childRect.bottom >= rect.top && childRect.bottom <= rect.bottom) ||
            (childRect.top <= rect.top && childRect.bottom >= rect.bottom)),
        true
      )

      if (isPartiallyVisible && Focus.setOnFirstVisibleDescendant(child, scrollableAncestorsRects)) return true
    }

    return false
  }

  /**
   * Attempt focus on the given HTML element and return true if successful.
   * Focus attempt will fail (return false) if element has
   *  display:none, visibility:hidden or opacity: 0 (tested on all major browsers).
   *
   * @param {Element} element
   * @returns true if the focus attempt was successful, otherwise return false.
   */
  static attempt = (element: HTMLElement): boolean => {
    element.focus()
    return document.activeElement === element
  }
}
