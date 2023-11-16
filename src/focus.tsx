import { RefObject } from 'react'
import { ModalSheet } from './typings'

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

    if (this.isUpperModalOpened()) {
      // TO DO: 
      // - a flag option to allow this behavior
      // - this modal should be already `inert` or child of `inert` (dynamically added siblings to an opened modal should be inert-ed).
      // - set inert on all siblings of this modal, with `data-omodal-set-inert-by` attribute, so when the upper modal is closed, focus is trapped here.
      // - ensure the focus is set on the modal when the upper modal is closed.
      modalEl.setAttribute('inert', '')  
    }
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

  isUpperModalOpened = () => {
    const modalEl = this.modalRef.current
    if (!modalEl) return

    const zIndexThisModal = parseInt(getComputedStyle(modalEl).zIndex)
    return [...document.querySelectorAll(`.omodal:not([data-omodal-close]):not([data-omodal-id="${this.modalId}"])`)]
      .map(
        (e) =>
          zIndexThisModal > parseInt(getComputedStyle(e).zIndex) ||
          modalEl.compareDocumentPosition(e) === Node.DOCUMENT_POSITION_PRECEDING
      )
      .some((e) => !e)
  }

  static setInertOnSiblings = (el: HTMLElement | null, id?: string) => {
    if (!el || el === document.body || !el.parentElement) return

    el.removeAttribute('inert')
    for (let sibling of el.parentElement.children) {
      if (sibling == el || !(sibling instanceof HTMLElement)) continue

      if (id)
        sibling.dataset.omodalSetInertBy = sibling.dataset.omodalSetInertBy
          ? sibling.dataset.omodalSetInertBy + ' ' + id
          : id

      if (!sibling.hasAttribute('inert')) sibling.setAttribute('inert', '')
    }
  }

  /**
   * Handle focus when active sheet changed, ie. set inert on all other sheets and set focus on new active sheet.
   */
  handleActiveSheetHasChanged = (activeSheet?: ModalSheet) => {
    if (!activeSheet) return
    Focus.setInertOnSiblings(activeSheet.htmlElement || null)

    if (activeSheet.activeElement) Focus.set(activeSheet.activeElement)
    else Focus.setOnFirstDescendant(activeSheet.htmlElement)
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
