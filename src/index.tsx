import React, {
  useRef,
  useReducer,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  ReactNode,
  RefObject,
  ForwardedRef,
  useCallback
} from 'react'
import { createPortal } from 'react-dom'
import styles from './style.module.css'
import {
  ModalAnimation,
  BottomSheetOptions,
  Modal,
  ModalOneTimeOptions,
  ModalProps,
  HTMLDivElementRef
} from './typings'
import { focusFirstDescendant, focusLastDescendant, ignoreFocusTrap, runOnce } from './utils'
import { dragElement } from './bottom-sheet-drag'

export default forwardRef((props: ModalProps, ref: ForwardedRef<Modal>) => {
  const {
    type = 'floating', // ['floating', 'full-page', 'bottom-sheet']
    bottomSheetOptions = {},
    position = 'center', // ['top', 'center', 'bottom'], in case of floating type
    stackSize = 999, // the number of pages to preserve in the stack before start dropping out old pages
    animation: animationProps = false,
    rootElement = document.body, // HTMLElement where this modal will be appended to
    allowBodyScroll = false,
    className = '',
    classNameOverlay = '', // className for modal container/overlay
    colorBackgroundOverlay, // default #00000099, also it can be set by css variable --one-modal-color-overlay
    colorBackground, // default 'white', also it can be set by css variable --one-modal-color-bg
    attributes = {},
    attributesOverlay, // pass the reset to modal container/overlay
    children, // if existed, add them as the first
    onESC,
    onClickOverlay
  } = props

  const modalOverlayRef = useRef<HTMLDivElement>(null)
  const [pageActiveElement, setPageActiveElement] = useState<Element | null>(document.activeElement) // to save element with focus before modal has opened

  // `useRef` with `forceUpdate` instead of useState to have up-to-date value for pages array, and push to the existed array directly
  const modalsArr = useRef<[ReactNode, HTMLDivElementRef][]>([])
  const [, forceUpdate] = useReducer((x) => x + 1, 0)

  const [isHidden, setHidden] = useState(false)

  const _animationType = useRef<ModalAnimation['type']>(
    (animationProps && animationProps.type) ?? props.type == 'full-page'
      ? 'slide'
      : props.type == 'bottom-sheet' || props.position == 'bottom'
      ? 'slide-bottom'
      : 'zoom-in'
  )
  const animation = useRef<ModalAnimation>({
    disable: animationProps === false || !!animationProps.disable,
    get type() {
      return _animationType.current
    },
    set type(type: ModalAnimation['type']) {
      if (!type || !modalOverlayRef.current) return
      _animationType.current = type
      modalOverlayRef.current.dataset.animation = type // Update DOM
    },
    pause: (timeout?: number) => {
      // if timeout is not passed, pause indefinitely
      modalOverlayRef.current?.setAttribute('data-animation-pause', '')
      timeout && setTimeout(animation.current.resume, timeout)
    },
    resume: (timeout?: number) => {
      // if timeout is not passed, resume indefinitely
      modalOverlayRef.current?.removeAttribute('data-animation-pause')
      timeout && setTimeout(animation.current.pause, timeout)
    }
  })

  const _handleAnimationOption = useCallback((options: ModalOneTimeOptions) => {
    const { animation: animationOptions } = options

    const disableAnimation =
      animationOptions === false ||
      (animationOptions !== true && animationOptions?.disable) ||
      // defining `animationOptions` is sufficient to do animation on this function call, no need to set disable = false
      (animationOptions === undefined && animation.current.disable)

    if (disableAnimation && !animation.current.disable) animation.current.pause(250)
    if (!disableAnimation && animation.current.disable) animation.current.resume(250)

    return disableAnimation
  }, [])

  // return focus to previous element before modal has opened
  const _returnFocus = useCallback(() => {
    const len = modalsArr.current.length
    const modal = modalsArr.current[len - 1]?.[1]
    if (len > 0 && !isHidden && modal.activeElement instanceof HTMLElement) modal.activeElement.focus()
    else if (!isHidden && pageActiveElement instanceof HTMLElement) pageActiveElement.focus()
  }, [isHidden, pageActiveElement])

  const push: Modal['push'] = (content, options = {}) =>
    new Promise((resolve) => {
      const { popLast = false, role = 'dialog', attributes: oneTimeAttrs } = options
      const disableAnimation = _handleAnimationOption(options)
      const elementRef: HTMLDivElementRef = { current: null, activeElement: null } // like ref, since can't useRef() here
      let hasCalled = false // flag to run ref callback only once

      if (!allowBodyScroll) document.body.setAttribute('data-prevent-scroll', '')

      // if this is the first push, save the focused element on the page to retain its focus after close
      if (!modalsArr.current.length) setPageActiveElement(document.activeElement)

      // make sure the ---out-transition has been removed
      modalOverlayRef.current?.classList.remove(styles['--out-transition'])

      modalsArr.current.push([
        <div
          key={Math.random()} // since the key is set only on push, random value should be fine
          className={className}
          role={role}
          aria-modal='true'
          ref={(el) => {
            if (!el || hasCalled) return // run only once
            hasCalled = true

            //set class after the element is loaded into the DOM, so the transition takes affect
            setTimeout(() => el.classList.add(styles.modal), 5)

            if (type === 'bottom-sheet' && !bottomSheetOptions.disableDrag) dragElement(el, bottomSheetOptions, pop)

            const resolveHandler = runOnce(() => {
              if (popLast && modalsArr.current.length > 1) {
                modalsArr.current.splice(modalsArr.current.length - 2, 1) // remove before last
                forceUpdate()
              } else if (modalsArr.current.length > stackSize) {
                modalsArr.current.shift() // remove last element
                forceUpdate()
              }

              focusFirstDescendant(el)
              elementRef.activeElement = document.activeElement

              resolve([content, elementRef])
            })

            if (disableAnimation) resolveHandler()
            else {
              el.addEventListener('transitionend', resolveHandler, { once: true })
              el.addEventListener('transitioncancel', resolveHandler, { once: true })
              // setTimeout(resolveHandler, 250) //fallback support legacy browser
            }

            elementRef.current = el
          }}
          {...attributes}
          {...oneTimeAttrs}
        >
          {content}
        </div>,
        elementRef
      ])
      forceUpdate()
    })

  const transit: Modal['transit'] = (content, options) => {
    return push(content, { popLast: true, ...options })
  }

  const pop: Modal['pop'] = (options = {}) =>
    new Promise((resolve) => {
      const len = modalsArr.current.length
      if (!len) throw Error('No modal in the stack to pop') //no pages existed, skip this action

      // select before-last if existed or last (ie. first one)
      const modal = modalsArr.current[len > 1 ? len - 2 : 0][1]

      const disableAnimation = _handleAnimationOption(options)
      if (disableAnimation) {
        const res = modalsArr.current.pop()
        forceUpdate()
        if (len <= 1) document.body.removeAttribute('data-prevent-scroll')
        _returnFocus()
        resolve(res as [ReactNode, HTMLDivElementRef])
        return
      }

      /* transition */
      // select the modal before last one (or last in case of one modal)
      const modalEl = modal.current
      if (!modalEl) throw Error('Unexpected behavior: No HTML eLement is found while pop!') // shouldn't happen, just in case!!

      modalEl.classList.add(styles['--back-transition'])

      const resolveHandler = runOnce(() => {
        modalEl.classList.remove(styles['--back-transition'])
        const res = modalsArr.current.pop()
        forceUpdate()
        if (len <= 1) document.body.removeAttribute('data-prevent-scroll')
        _returnFocus()
        resolve(res as [ReactNode, HTMLDivElementRef])
      })

      modalEl.addEventListener('transitionend', resolveHandler, { once: true })
      modalEl.addEventListener('transitioncancel', resolveHandler, { once: true })
      // setTimeout(resolveHandler, 250) //fallback support legacy browser

      // if last modal, animate overlay hiding
      if (len <= 1) modalOverlayRef.current?.classList.add(styles['--out-transition'])
    })

  const empty: Modal['empty'] = (options = {}) =>
    new Promise((resolve) => {
      const len = modalsArr.current.length
      const res = [...modalsArr.current]

      const modal = modalsArr.current[len - 1][1]
      if (!isHidden && pageActiveElement instanceof HTMLElement) pageActiveElement.focus()

      const disableAnimation = _handleAnimationOption(options)
      if (disableAnimation || !len) {
        modalsArr.current.splice(0, modalsArr.current.length) // empty array while keeping reference
        forceUpdate()
        document.body.removeAttribute('data-prevent-scroll')
        _returnFocus()
        resolve(res)
        return
      }

      /* transition */
      const modalEl = modal.current
      if (!modalEl) throw Error('Unexpected behavior: No HTML eLement is found while empty!') // shouldn't happen, just in case!!

      modalEl.classList.add(styles['--back-transition'])

      const resolveHandler = runOnce(() => {
        modalEl.classList.remove(styles['--back-transition'])
        modalsArr.current.splice(0, modalsArr.current.length)
        forceUpdate()
        document.body.removeAttribute('data-prevent-scroll')
        _returnFocus()
        resolve(res)
      })

      modalEl.addEventListener('transitionend', resolveHandler, { once: true })
      modalEl.addEventListener('transitioncancel', resolveHandler, { once: true })
      // setTimeout(resolveHandler, 250) //fallback support legacy browser

      // if there was modal, animate overlay hiding
      if (len) modalOverlayRef.current?.classList.add(styles['--out-transition'])
    })

  const hide: Modal['hide'] = (options = {}) =>
    new Promise((resolve) => {
      const len = modalsArr.current.length

      const modal = modalsArr.current[len - 1][1]
      if (pageActiveElement instanceof HTMLElement) pageActiveElement.focus()

      const disableAnimation = _handleAnimationOption(options)
      if (disableAnimation) {
        setHidden(true)
        document.body.removeAttribute('data-prevent-scroll')
        _returnFocus()
        resolve()
        return
      }

      /* transition */
      const modalEl = modal.current
      if (!modalEl) throw Error('Unexpected behavior: No HTML eLement is found while hide!') // shouldn't happen, just in case!!

      modalEl.classList.add(styles['--back-transition'])

      const resolveHandler = runOnce(() => {
        modalEl.classList.remove(styles['--back-transition'])
        setHidden(true)
        document.body.removeAttribute('data-prevent-scroll')
        _returnFocus()
        resolve()
      })

      modalEl.addEventListener('transitionend', resolveHandler, { once: true })
      modalEl.addEventListener('transitioncancel', resolveHandler, { once: true })
      // setTimeout(resolveHandler, 250) //fallback support legacy browser

      // if there was modal, animate overlay hiding
      if (len) modalOverlayRef.current?.classList.add(styles['--out-transition'])
    })

  const show: Modal['show'] = (content, options = {}) =>
    new Promise((resolve) => {
      let res
      if (content) res = push(content, options)

      if (!allowBodyScroll) document.body.setAttribute('data-prevent-scroll', '')

      if (isHidden) setPageActiveElement(document.activeElement)
      const modalActiveElement = modalsArr.current[modalsArr.current.length - 1][1].activeElement
      if (modalActiveElement instanceof HTMLElement) modalActiveElement.focus()

      setHidden(false)
      resolve(res ?? modalsArr.current[modalsArr.current.length - 1])
    })

  const controlFunctions = {
    push,
    pop,
    transit,
    empty,
    hide,
    show,
    animation: animation.current
  }
  useImperativeHandle(ref, () => controlFunctions)

  useEffect(() => {
    if (children) push(children)

    function trapFocus(ev: FocusEvent) {
      if (ignoreFocusTrap || !modalsArr.current.length || isHidden) return

      const modal = modalsArr.current[modalsArr.current.length - 1][1]

      if (!modal.current) return

      if (modal.current.contains(ev.target as Node)) {
        modal.activeElement = ev.target as Element
      } else {
        focusFirstDescendant(modal.current)
        if (modal.activeElement == document.activeElement) {
          focusLastDescendant(modal.current)
        }
        modal.activeElement = document.activeElement
      }
    }

    document.body.addEventListener('focus', trapFocus, true)
  }, [])

  return createPortal(
    <div
      className={styles.overlay + ' ' + classNameOverlay}
      data-animation={animation.current.type}
      data-modal-type={type}
      data-modal-position={position}
      data-modal-open={!!(modalsArr.current.length && !isHidden)}
      ref={modalOverlayRef}
      onClick={(ev) => {
        if (!onClickOverlay || ev.currentTarget != ev.target) return
        if (typeof onClickOverlay === 'string') controlFunctions[onClickOverlay]()
        if (typeof onClickOverlay === 'function') onClickOverlay(ev) //nativeEvent, just in case of using addEventListener() later
      }}
      onKeyDown={(ev) => {
        if (!onESC || ev.key !== 'Escape') return
        if (typeof onESC === 'string') controlFunctions[onESC]()
        if (typeof onESC === 'function') onESC(ev)
      }}
      style={{
        ['--one-modal-color-overlay' as any]: colorBackgroundOverlay || undefined,
        ['--one-modal-color-bg' as any]: colorBackground || undefined
      }}
      {...attributesOverlay}
    >
      <div tabIndex={0}></div> {/* bracket all modal-sheets with invisible `div` to traps focus (prevent page scroll when focus leaves modal and restored) */}
      <div className={styles['modals-container']}>
        {modalsArr.current.map((e) => e[0])}
      </div>
      <div tabIndex={0}></div>
    </div>,
    rootElement
  )
})

class ModalState {
  static modalRefs: {
    [key: string]: RefObject<Modal>
  } = {}

  /**
   * Promisify modalRef retrieval from modalRefs object, and reject promise on fail.
   *
   * @param {string} key
   * @returns {Promise<Modal>} promise resolve to modalRef if existed, otherwise reject
   */
  static _getModalRef = (key: string): Promise<Modal> => {
    const modalRef = ModalState.modalRefs[key]?.current
    if (!modalRef)
      // prefers `throw` over `Promise.reject` for using this function as check in get/set animation properties
      throw Error(`Using control function on undefined Modal with key: ${key}`)

    return Promise.resolve(modalRef)
  }

  /**
   * Get the Modal control functions of an already bound modal component, given its key.
   *
   * @param {string} [key]  If a key isn't passed, its value would be 'default'.
   * @returns {Modal} modal object with { push, pop, empty, hide, show, animation } functionalities
   */
  static getModal = (key: string = 'default'): Modal => {
    if (!ModalState.modalRefs[key])
      console.warn(
        `No modal is rendered yet with this key: "${key}". Please double check the key name and make sure` +
          ' you bind a Modal component with this key via useModal(key: string) inside an already rendered component. ' +
          'Only ignore this warning if you are sure that the binding happen before calling any of the functions of this object'
      )

    // We could here simply do `return this.modalRefs[key]?.current` and then all functionalities will be exposed.
    // However, ref is `null` at the start, and is defined after Modal component is rendered.
    // That is way useRef() hook returns {current: VALUE} as reference to the mutable VALUE instead of directly return VALUE.
    // By using function closure, `this.modalRefs[key]?.current` is resolved when each of these function is called, and
    // by using _getModalRef(), the returned promise is rejected if the this.modalRefs[key] is undefined yet.

    return {
      push: (...args) => ModalState._getModalRef(key).then((ref) => ref.push(...args)),
      pop: (...args) => ModalState._getModalRef(key).then((ref) => ref.pop(...args)),
      empty: (...args) => ModalState._getModalRef(key).then((ref) => ref.empty(...args)),
      transit: (...args) => ModalState._getModalRef(key).then((ref) => ref.transit(...args)),
      hide: (...args) => ModalState._getModalRef(key).then((ref) => ref.hide(...args)),
      show: (...args) => ModalState._getModalRef(key).then((ref) => ref.show(...args)),
      animation: {
        get disable() {
          ModalState._getModalRef(key) // throw warning Error if `modalRefs[key]?.current` is undefined
          return !!ModalState.modalRefs[key]?.current?.animation.disable
        },
        set disable(bool: ModalAnimation['disable']) {
          ModalState._getModalRef(key).then((ref) => (ref.animation.disable = bool))
        },
        get type() {
          ModalState._getModalRef(key) // throw warning Error if `modalRefs[key]?.current` is undefined
          return ModalState.modalRefs[key]?.current?.animation.type ?? 'slide'
        },
        set type(type: ModalAnimation['type']) {
          ModalState._getModalRef(key).then((ref) => (ref.animation.type = type))
        },
        pause: (...args) => ModalState._getModalRef(key).then((ref) => ref.animation.pause(...args)),
        resume: (...args) => ModalState._getModalRef(key).then((ref) => ref.animation.resume(...args))
      }
    }
  }

  /**
   * Bind a modal instance to a modal component through `ref`.
   *
   * @param {string} [key = "default"] If a key isn't passed, its value would be 'default'.
   * @returns {[Modal, RefObject<Modal>]} Tuple array with first element is Modal control functions, and second element ref object.
   */
  static useModal = (key: string = 'default'): [Modal, RefObject<Modal>] => {
    if (!ModalState.modalRefs[key]) ModalState.modalRefs[key] = useRef<Modal>(null)

    return [ModalState.getModal(key), ModalState.modalRefs[key]]
  }
}

export const { useModal, getModal } = ModalState
export { Modal, ModalOneTimeOptions, ModalProps, ModalAnimation, BottomSheetOptions }
