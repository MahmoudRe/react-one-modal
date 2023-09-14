export default class Focus {
  static pageActiveElement = document.activeElement // to save element with focus before modal has opened

  static handleModalOpen(modalEl: HTMLElement | null, modalSheetEl: HTMLElement | null) {
    if(!modalEl || !modalSheetEl) return

    // if other modals are opened with higher z-inder, set this to inert
    const zIndexCurrModal = parseInt(getComputedStyle(modalEl).zIndex)
    const isUpperModalExisted = [...document.querySelectorAll('data-modal-open')]
      .map(
        (e) =>
          e === modalEl ||
          zIndexCurrModal > parseInt(getComputedStyle(e).zIndex) ||
          modalEl.compareDocumentPosition(e) === Node.DOCUMENT_POSITION_PRECEDING
      )
      .some(e => !e)

    if (isUpperModalExisted) modalEl.setAttribute('inert', '') 
    else {
      modalEl.removeAttribute('inert')
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

  static handleModalClose(modalId: string) {
    const elements = document.querySelectorAll(`[data-omodal-inert="${modalId}"]`)
    for (let e of elements) {
      e.removeAttribute('inert')
      e.removeAttribute('data-omodal-inert')
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
  static setOnFirstDescendant(element: any): boolean {
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
  static setOnLastDescendant(element: any): boolean {
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
