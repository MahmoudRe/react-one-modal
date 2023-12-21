import { RefObject } from 'react'
import { isElementBellow } from './utils'

export default class Focus {
  previousActiveElement = document.activeElement // to save element with focus before modal has opened
  modalRef: RefObject<HTMLElement> = { current: null }
  modalId: string = ''
  rootElement: HTMLElement = document.body

  constructor(modalRef: RefObject<HTMLElement>, modalId: string, rootElement: HTMLElement) {
    this.modalRef = modalRef
    this.modalId = modalId
    this.rootElement = rootElement
  }

  /**
   * This function should be called to prepare for modal opening, ie. before opening-animation
   */
  handleModalWillOpen = () => {
    const modalEl = this.modalRef.current
    if (!modalEl) return

    if (!this.isBlockedByAnotherModal()) {
      // TO DO:
      // - this modal should be already `inert` or child of `inert` (dynamically added siblings to an opened modal should be inert-ed).
      // - ensure the focus is set on the modal when the upper modal is closed.
      this.stop()
      modalEl.removeAttribute('inert')
      modalEl.removeAttribute('data-omodal-set-inert-by')
    }

    this.previousActiveElement = document.activeElement
    this.setInertOnSiblings()
    this.preventPageScroll()
  }

  /**
   * This function should be called after modal has been opened, ie. after opening-animation
   */
  handleModalHasOpened = () => {
    const modalEl = this.modalRef.current
    const activeSheetEl = this.modalRef.current?.querySelector('[data-omodal-sheet-state="active"]')
    if (!modalEl || !activeSheetEl) return

    if (!modalEl.hasAttribute('inert')) {
      this.resume()
      activeSheetEl.removeAttribute('inert')
      this.setInertOnSiblings(activeSheetEl)
      Focus.setOnFirstDescendant(activeSheetEl)
    }
  }

  /**
   * Check if another modal with higher stacking context is already open.
   */
  isBlockedByAnotherModal = () =>
    [...document.querySelectorAll(`.omodal:not([data-omodal-close])`)].some(this.isBlockedBy)

  /**
   * Check if this modal is bellow (blocked by) the given element with respect to visual stacking context.
   *
   * @param {Element} element
   * @returns {boolean}
   */
  isBlockedBy = (element: Element): boolean =>
    !!this.modalRef.current && isElementBellow(this.modalRef.current, element)

  /**
   * Set 'inert' attribute to siblings of this modal, excluding other modals that blocks this modal,
   * ie. have higher z-index, or comes later in DOM tree.
   * This also update the value of `data-omodal-set-inert-by` attribute of the effected siblings.
   *
   * @param element optional element to set `inert` on the sibling of this element instead of this modal.
   */
  setInertOnSiblings = (element?: Element) => {
    const el = element || this.modalRef.current
    if (!el || el === document.body || !el.parentElement) return

    for (let sibling of el.parentElement.children) {
      if (sibling === el || !(sibling instanceof HTMLElement) || (!element && this.isBlockedBy(sibling)))
        continue

      sibling.setAttribute('inert', '')

      if (element) continue
      sibling.dataset.omodalSetInertBy = sibling.dataset.omodalSetInertBy
        ? sibling.dataset.omodalSetInertBy + ' ' + this.modalId
        : this.modalId
    }
  }

  /**
   * Handle focus when active sheet changed, ie. set inert on all other sheets and set focus on new active sheet.
   */
  handleActiveSheetHasChanged = () => {
    const activeSheetEl = this.modalRef.current?.querySelector('[data-omodal-sheet-state="active"]')
    if (!activeSheetEl) return

    activeSheetEl?.removeAttribute('inert')
    this.setInertOnSiblings(activeSheetEl)

    if (this.modalRef.current?.hasAttribute('data-omodal-close')) return

    if (!Focus.attempt(activeSheetEl?.querySelector('[data-omodal-autofocus]')))
      Focus.setOnFirstDescendant(activeSheetEl)
  }

  /**
   * This function should be called before modal closing, ie. before close-animation
   */
  handleModalWillClose = () => this.stop()

  /**
   * This function should be called after modal has closed, ie. after close-animation or unmount.
   *
   * Note this function should be expected to run even when modal is already closed (eg. on mount and umount)
   *  or twice in case of unmount directly after close-animation.
   * This behavior of running twice to insure proper cleanup for modal opening and handleModalWillClose
   *  in case the modal was forcefully unmounted just after closing (ie. `close` state is false)
   *  but before close handler is called.
   */
  handleModalHasClosed = (unmount?: boolean) => {
    const elements = document.querySelectorAll(`[data-omodal-set-inert-by~="${this.modalId}"]`)
    for (let e of elements) {
      const dataSetInertBy = e.getAttribute('data-omodal-set-inert-by')?.replace(this.modalId, '').trim() || ''

      if (dataSetInertBy) e.setAttribute('data-omodal-set-inert-by', dataSetInertBy)
      else {
        e.removeAttribute('inert')
        e.removeAttribute('data-omodal-set-inert-by')
      }
    }

    // if opened modal, show scroll
    if (!document.querySelectorAll(`.omodal:not([data-omodal-close]):not([data-omodal-id="${this.modalId}"])`).length)
      this.rootElement.removeAttribute('data-omodal-prevent-scroll')

    this.modalRef.current?.setAttribute('data-omodal-close', 'completed')
    this.resume()
    if (!unmount) Focus.set(this.previousActiveElement)
  }

  preventPageScroll = () => {
    this.rootElement.setAttribute('data-omodal-prevent-scroll', '')
  }

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

  // Bellow class includes material derived from: Modal Dialog Example
  // https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/dialog/#top.
  // Copyright © 2023 World Wide Web Consortium. https://www.w3.org/copyright/software-license-2023/

  /**
   * @description Set focus on descendant nodes until the first focusable element is found.
   * @param element DOM node for which to find the first focusable descendant.
   * @returns {boolean} true if a focusable element is found and focus is set.
   */
  static setOnFirstDescendant = (element: Element | null): boolean => {
    if (!element) return false
    for (let i = 0; i < element.children.length; i++) {
      let child = element.children[i]
      if (Focus.attempt(child) || Focus.setOnFirstDescendant(child)) return true
    }
    return false
  }

  /**
   * @description Find the last descendant node that is focusable.
   * @param element
   *          DOM node for which to find the last focusable descendant.
   * @returns {boolean}
   *  true if a focusable element is found and focus is set.
   */
  static setOnLastDescendant = (element: Element): boolean => {
    for (let i = element.children.length - 1; i >= 0; i--) {
      let child = element.children[i]
      if (Focus.attempt(child) || Focus.setOnLastDescendant(child)) return true
    }
    return false
  }

  static attempt = (element: any): boolean => {
    if (!element || element.tabIndex < 0) return false
    Focus.set(element)
    return document.activeElement === element
  }

  static set = (element: any) => {
    try {
      element.focus()
    } catch (e) {
      // continue regardless of error
    }
  }
}
