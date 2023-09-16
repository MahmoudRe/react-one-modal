import { RefObject } from 'react'

export default class Focus {
  previousActiveElement = document.activeElement // to save element with focus before modal has opened
  modalOverlayRef: RefObject<HTMLElement> = { current: null }
  modalId: string = ''

  constructor(modalOverlayRef: RefObject<HTMLElement>, modalId: string) {
    this.modalOverlayRef = modalOverlayRef
    this.modalId = modalId
  }

  /**
   * This function should be called to prepare for modal opening, ie. before opening-animation
   */
  handleModalWillOpen() {
    const modalEl = this.modalOverlayRef.current
    if (!modalEl) return

    const zIndexThisModal = parseInt(getComputedStyle(modalEl).zIndex)
    const isUpperModalExisted = [
      ...document.querySelectorAll(`[data-modal-open]:not([data-omodal-id="${this.modalId}"])`)
    ]
      .map(
        (e) =>
          zIndexThisModal > parseInt(getComputedStyle(e).zIndex) ||
          modalEl.compareDocumentPosition(e) === Node.DOCUMENT_POSITION_PRECEDING
      )
      .some((e) => !e)

    if (isUpperModalExisted) modalEl.setAttribute('inert', '')
    else {
      modalEl.removeAttribute('inert')
      this.previousActiveElement = document.activeElement
      this.stopFocus()
      this.preventPageScroll()
    }
  }

  /**
   * This function should be called after modal has been opened, ie. after opening-animation
   */
  handleModalHasOpened(modalSheetEl: HTMLElement | null) {
    const modalEl = this.modalOverlayRef.current
    if (!modalEl || !modalSheetEl) return

    if (!modalEl.hasAttribute('inert')) {
      Focus.setOnFirstDescendant(modalSheetEl)
      setInertOnAll(modalEl)
    }

    function setInertOnAll(el: HTMLElement | null) {
      if (!el || el === document.body || !el.parentElement) return

      for (let sibling of el.parentElement.children) {
        if (sibling == el || !(sibling instanceof HTMLElement)) continue

        if (!sibling.hasAttribute('inert')) {
          sibling.dataset.omodalInert = modalEl?.dataset.omodalId
          sibling.setAttribute('inert', '')
        }
      }

      setInertOnAll(el.parentElement)
    }
  }

  /**
   * This function should be called before modal closing, ie. before close-animation
   */
  handleModalWillClose() {
    this.stopFocus()
  }

  /**
   * This function should be called after modal has closed, ie. after close-animation
   */
  handleModalHasClosed() {
    const elements = document.querySelectorAll(`[data-omodal-inert="${this.modalId}"]`)
    for (let e of elements) {
      e.removeAttribute('inert')
      e.removeAttribute('data-omodal-inert')
    }

    // if opened modal, show scroll
    if (!document.querySelectorAll(`[data-modal-open]:not([data-omodal-id="${this.modalId}"])`).length)
      document.body.removeAttribute('data-prevent-scroll')

    Focus.set(this.previousActiveElement)
  }

  preventPageScroll() {
    document.body.setAttribute('data-prevent-scroll', '')
  }

  /**
   * To prevent effect of spamming keypress on open/close modal btn while animation is running,
   *  move focus to body till `handleModalHasOpened` or `handleModalHasClosed` is called (till animation end).
   * Before the modal is opened, we can't focus on the first element directly, since it will be hidden.
   */
  stopFocus() {
    if (!document.body.hasAttribute('tabindex')) {
      document.body.tabIndex = -1
      document.body.focus()
      document.body.removeAttribute('tabindex')
    } else {
      document.body.focus()
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
  static setOnFirstDescendant(element: Element): boolean {
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
  static setOnLastDescendant(element: Element): boolean {
    for (let i = element.children.length - 1; i >= 0; i--) {
      let child = element.children[i]
      if (Focus.attempt(child) || Focus.setOnLastDescendant(child)) return true
    }
    return false
  }

  static attempt(element: any): boolean {
    if (element.tabIndex < 0) return false
    Focus.set(element)
    return document.activeElement === element
  }

  static set(element: any) {
    try {
      element.focus()
    } catch (e) {
      // continue regardless of error
    }
  }
}
