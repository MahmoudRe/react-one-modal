import { RefObject } from 'react'

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

    const zIndexThisModal = parseInt(getComputedStyle(modalEl).zIndex)
    const isUpperModalExisted = [
      ...document.querySelectorAll(`[data-omodal-open]:not([data-omodal-id="${this.modalId}"])`)
    ]
      .map(
        (e) =>
          zIndexThisModal > parseInt(getComputedStyle(e).zIndex) ||
          modalEl.compareDocumentPosition(e) === Node.DOCUMENT_POSITION_PRECEDING
      )
      .some((e) => !e)

    if (isUpperModalExisted) modalEl.setAttribute('inert', '')
    else {
      this.previousActiveElement = document.activeElement
      Focus.setInertOnSiblings(modalEl, this.modalId)
      this.stop()
      this.preventPageScroll()
    }
  }

  /**
   * This function should be called after modal has been opened, ie. after opening-animation
   */
  handleModalHasOpened = (modalSheetEl: HTMLElement | null) => {
    const modalEl = this.modalRef.current
    if (!modalEl || !modalSheetEl) return

    if (!modalEl.hasAttribute('inert')) {
      this.resume()
      Focus.setInertOnSiblings(modalSheetEl)
      Focus.setOnFirstDescendant(modalSheetEl)
    }
  }

  static setInertOnSiblings = (el: HTMLElement | null, id?: string) => {
    if (!el || el === document.body || !el.parentElement) return

    el.removeAttribute('inert')
    for (let sibling of el.parentElement.children) {
      if (sibling == el || !(sibling instanceof HTMLElement)) continue

      if (!sibling.hasAttribute('inert')) {
        if (id) sibling.dataset.omodalInert = id
        sibling.setAttribute('inert', '')
      }
    }
  }

  /**
   * This function should be called before modal closing, ie. before close-animation
   */
  handleModalWillClose = () => {
    this.stop()
  }

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
    const elements = document.querySelectorAll(`[data-omodal-inert="${this.modalId}"]`)
    for (let e of elements) {
      e.removeAttribute('inert')
      e.removeAttribute('data-omodal-inert')
    }

    // if opened modal, show scroll
    if (!document.querySelectorAll(`[data-omodal-open]:not([data-omodal-id="${this.modalId}"])`).length)
      this.rootElement.removeAttribute('data-omodal-prevent-scroll')

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
  static setOnFirstDescendant = (element: Element): boolean => {
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
    if (element.tabIndex < 0) return false
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
