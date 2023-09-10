import { MutableRefObject, ReactNode, RefObject } from 'react'
import { HTMLDivElementRef } from './typings'

// Bellow class includes material derived from: Modal Dialog Example
// https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/dialog/#top.
// Copyright © 2023 World Wide Web Consortium. https://www.w3.org/copyright/software-license-2023/
export default class Focus {
  static ignoreTrap = false
  static pageActiveElement = document.activeElement // to save element with focus before modal has opened
  static modalsArr: MutableRefObject<[ReactNode, HTMLDivElementRef][]> = { current: [] }
  static modalOverlayRef: RefObject<HTMLDivElement> = { current: null }

  static init(
    modalsArr: MutableRefObject<[ReactNode, HTMLDivElementRef][]>,
    modalOverlayRef: RefObject<HTMLDivElement>
  ) {
    Focus.modalsArr = modalsArr
    Focus.modalOverlayRef = modalOverlayRef
    document.body.addEventListener('focus', Focus.trap, true)
  }

  static trap(ev: FocusEvent) {
    if (Focus.ignoreTrap || !Focus.modalsArr.current.length) return

    const modal = Focus.modalsArr.current[Focus.modalsArr.current.length - 1][1]
    const isOpen = Focus.modalOverlayRef.current?.dataset.modalOpen

    if (!modal.current || !isOpen) return

    if (modal.current.contains(ev.target as Node)) {
      modal.activeElement = ev.target as Element
    } else {
      Focus.setOnFirstDescendant(modal.current)
      if (modal.activeElement == document.activeElement) {
        Focus.setOnLastDescendant(modal.current)
      }
      modal.activeElement = document.activeElement
    }
  }

  /**
   * set focus back to previous element before modal has opened
   */
  static setBackOnPrevious() {
    const len = Focus.modalsArr.current.length
    const modal = Focus.modalsArr.current[len - 1]?.[1]
    const isOpen = Focus.modalOverlayRef.current?.dataset.modalOpen

    if (len > 0 && isOpen) Focus.set(modal.activeElement)
    else Focus.set(Focus.pageActiveElement)
  }

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
    Focus.ignoreTrap = true
    try {
      element.focus()
    } catch (e) {
      // continue regardless of error
    }
    Focus.ignoreTrap = false
  }
}
