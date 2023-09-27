import React, {
  useRef,
  useReducer,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  RefObject,
  ForwardedRef,
  useCallback,
  useLayoutEffect
} from 'react'
import { createPortal } from 'react-dom'
import styles from './style.module.css'
import {
  ModalAnimation,
  BottomSheetOptions,
  Modal,
  ModalPushOneTimeOptions,
  ModalOneTimeOptions,
  ModalProps,
  ModalSheet
} from './typings'
import { runOnce } from './utils'
import Focus from './focus'
import { dragElement } from './bottom-sheet-drag'

export default forwardRef((props: ModalProps, ref: ForwardedRef<Modal>) => {
  const {
    type = 'floating', // ['floating', 'full-page', 'bottom-sheet']
    bottomSheetOptions = {},
    position = 'center', // ['top', 'center', 'bottom'], in case of floating type
    stackSize = 999, // the number of pages to preserve in the stack before start dropping out old pages
    animation: animationProps = {},
    rootElement = document.body, // HTMLElement where this modal will be appended to
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

  // `useRef` with `forceUpdate` instead of useState to have up-to-date value for pages array, and push to the existed array directly
  const modalsArr = useRef<ModalSheet[]>([])
  const [, forceUpdate] = useReducer((x) => x + 1, 0)

  const [id] = useState(Math.random().toString(16).slice(10))
  const [open, setOpen] = useState(false)
  const [focus] = useState(new Focus(modalOverlayRef, id, rootElement))
  const [activeSheet, setActiveSheet] = useState<ModalSheet | null>()

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
      modalOverlayRef.current.setAttribute('data-omodal-animation', type) // Update DOM
    },
    pause: (timeout?: number) => {
      // if timeout is not passed, pause indefinitely
      modalOverlayRef.current?.setAttribute('data-omodal-animation-pause', '')
      timeout && setTimeout(animation.current.resume, timeout)
    },
    resume: (timeout?: number) => {
      // if timeout is not passed, resume indefinitely
      modalOverlayRef.current?.removeAttribute('data-omodal-animation-pause')
      timeout && setTimeout(animation.current.pause, timeout)
    }
  })

  const resolveTransition = useCallback(
    (modalEl: HTMLElement, options: ModalOneTimeOptions, triggerTransitionFn = () => {}, close = !open) =>
      new Promise((resolve) => {
        const { animation: animationOptions } = options
        const eventHandler = (e: Event) => e.target === modalEl && resolveHandler()

        const resolveHandler = runOnce(() => {
          modalEl.removeEventListener('transitionend', eventHandler)
          modalEl.removeEventListener('transitioncancel', eventHandler)
          resolve(null)
        })

        if (close) return resolveHandler()

        const disableAnimation =
          animationOptions === false ||
          (animationOptions !== true && animationOptions?.disable) ||
          (animationOptions === undefined && animation.current.disable) // defining `animation` is sufficient to enable animation on this function call

        if (disableAnimation && !animation.current.disable) animation.current.pause(250)
        if (!disableAnimation && animation.current.disable) animation.current.resume(250)
        if (disableAnimation) return resolveHandler()

        // transitionend/cancel event can be triggered by child element as well, hence ignore those
        modalEl.addEventListener('transitionend', eventHandler)
        modalEl.addEventListener('transitioncancel', eventHandler)

        triggerTransitionFn()
      }),
    [open]
  )

  const push: Modal['push'] = (content, options = {}) =>
    new Promise((resolve) => {
      const { popLast = false, attributes: oneTimeAttrs } = options
      const modalSheet: ModalSheet = {
        id: Math.random().toString(16).slice(10),
        reactNode: null,
        htmlElement: null,
        activeElement: null
      }
      let hasCalled = false // flag to run ref callback only once

      if (open) focus.stop()

      modalSheet.reactNode = (
        <div
          key={modalSheet.id}
          className={styles.modal + ' ' + className}
          ref={(el) => {
            if (!el || hasCalled) return // run only once
            hasCalled = true

            if (type === 'bottom-sheet' && !bottomSheetOptions.disableDrag) dragElement(el, bottomSheetOptions, pop)

            resolveTransition(el, options).then(() => {
              if (popLast && modalsArr.current.length > 1) {
                modalsArr.current.splice(modalsArr.current.length - 2, 1) // remove before last
                forceUpdate()
              } else if (modalsArr.current.length > stackSize) {
                modalsArr.current.shift() // remove last element
                forceUpdate()
              }

              if (open) {
                focus.resume()
                Focus.setOnFirstDescendant(el)
              }
              resolve(modalSheet)
            })

            // keep track of active element
            el.addEventListener('focusin', () => (modalSheet.activeElement = document.activeElement))
            modalSheet.htmlElement = el
          }}
          {...attributes}
          {...oneTimeAttrs}
        >
          {content}
        </div>
      )

      modalsArr.current.push(modalSheet)
      forceUpdate()

      const isActiveSheet = !activeSheet || activeSheet.id === modalsArr.current[modalsArr.current.length - 2].id
      if (isActiveSheet) setTimeout(() => setActiveSheet(modalSheet), 5) // till element is loaded, so transition takes effect
    })

  const transit: Modal['transit'] = (content, options) => {
    return push(content, { popLast: true, ...options })
  }

  const pop: Modal['pop'] = (options = {}) =>
    new Promise((resolve) => {
      const len = modalsArr.current.length
      if (!len) throw Error('No modal in the stack to pop') //no pages existed, skip this action

      // select before-last if existed or last (ie. first one)
      const modalSheet = modalsArr.current[len > 1 ? len - 2 : 0]
      const modalEl = modalSheet?.htmlElement
      if (!modalEl) throw Error('Unexpected behavior: No HTML eLement is found while pop!') // shouldn't happen, just in case!!

      const isLast = modalsArr.current.length === 1
      // if (isLast && open) focus.handleModalWillClose() // currently handleModalWillClose only stopFocus
      if (open) focus.stop()
      if (isLast) setActiveSheet(null)
      else setActiveSheet(modalSheet)

      const triggerTransitionFn = () => {
        if (isLast) {
          modalEl.classList.add(styles['--out-transition'])
          modalOverlayRef.current?.classList.add(styles['--out-transition'])
        }
      }

      resolveTransition(modalEl, options, triggerTransitionFn).then(() => {
        const res = modalsArr.current.pop()

        if (isLast && open) {
          setOpen(false)
        } else if (open) {
          focus.resume()
          setTimeout(() => {
            const prevModal = modalsArr.current[modalsArr.current.length - 1]
            if (prevModal.activeElement) Focus.set(prevModal.activeElement)
            else if (prevModal.htmlElement) Focus.setOnFirstDescendant(prevModal.htmlElement)
          }, 0) // till next render where `forceUpdate` takes effect
        }

        forceUpdate()
        resolve(res as ModalSheet)
      })
    })

  const empty: Modal['empty'] = (options = {}) =>
    new Promise((resolve) => {
      const res = [...modalsArr.current] // hard copy before empty
      const modalEl = activeSheet?.htmlElement
      if (!modalEl) throw Error('Unexpected behavior: No HTML eLement is found while empty!') // shouldn't happen, just in case!!

      if (open) focus.handleModalWillClose()

      const triggerTransitionFn = () => {
        modalEl.classList.add(styles['--out-transition'])
        modalOverlayRef.current?.classList.add(styles['--out-transition'])
      }

      resolveTransition(modalEl, options, triggerTransitionFn).then(() => {
        modalEl.classList.remove(styles['--out-transition'])
        modalsArr.current.splice(0, modalsArr.current.length) // empty array while keeping reference
        setOpen(false)
        setActiveSheet(null)
        resolve(res)
      })
    })

  const next: Modal['next'] = (options = {}) =>
    new Promise((resolve) => {
      const len = modalsArr.current.length

      if (len <= 1) throw Error('Cannot go to next sheet, modal has 0 or 1 sheet!')
      if (!activeSheet) throw Error('No active modal-sheet!')

      const i = modalsArr.current.indexOf(activeSheet)
      if (i === len - 1) throw Error('Cannot go to next sheet, current active sheet is the last one!')

      const nextSheet = modalsArr.current[i + 1]
      const modalEl = nextSheet?.htmlElement
      if (!modalEl) throw Error('Unexpected behavior: No HTML element for next sheet is found!') // shouldn't happen, just in case!!

      setActiveSheet(nextSheet)
      resolveTransition(modalEl, options).then(() => resolve(nextSheet))
    })

  const back: Modal['back'] = (options = {}) =>
    new Promise((resolve) => {
      const len = modalsArr.current.length

      if (len <= 1) throw Error('Cannot go to previous sheet, modal has 0 or 1 sheet!')
      if (!activeSheet) throw Error('No active modal-sheet!')

      const i = modalsArr.current.indexOf(activeSheet)
      if (i === 0) throw Error('Cannot go to previous sheet, current active sheet is the first one!')

      const prevSheet = modalsArr.current[i - 1]
      const modalEl = prevSheet?.htmlElement
      if (!modalEl) throw Error('Unexpected behavior: No HTML element for previous sheet is found!') // shouldn't happen, just in case!!

      setActiveSheet(prevSheet)
      resolveTransition(modalEl, options).then(() => resolve(prevSheet))
    })

  const hide: Modal['hide'] = (options = {}) =>
    new Promise((resolve) => {
      const modalEl = activeSheet?.htmlElement
      if (!modalEl) throw Error('Unexpected behavior: No HTML eLement is found while hide!') // shouldn't happen, just in case!!

      if (open) focus.handleModalWillClose()

      const triggerTransitionFn = () => {
        modalEl.classList.add(styles['--out-transition'])
        modalOverlayRef.current?.classList.add(styles['--out-transition'])
      }

      resolveTransition(modalEl, options, triggerTransitionFn).then(() => {
        modalEl.classList.remove(styles['--out-transition'])
        setOpen(false)
        resolve()
      })
    })

  const show: Modal['show'] = async (content, options = {}) => {
    if (!modalsArr.current.length && !content) return Promise.reject('Nothing to show!')

    modalOverlayRef.current?.classList.remove(styles['--out-transition'])
    focus.preventPageScroll()

    let res
    if (content) res = await push(content, options)
    if (open) return res ?? modalsArr.current[modalsArr.current.length - 1]
    setOpen(true)

    return new Promise((resolve) => {
      const modalEl = activeSheet?.htmlElement
      if (!modalEl) throw Error('Unexpected behavior: No HTML eLement is found while show!') // shouldn't happen, just in case!!

      focus.handleModalWillOpen()

      const triggerTransitionFn = () => {
        // remove class to hide element and return it to trigger transition
        modalEl.classList.add(styles['--in-transition'])
        modalEl.classList.remove(styles.active)
        setTimeout(() => modalEl.classList.add(styles.active), 10)
      }

      resolveTransition(modalEl, options, triggerTransitionFn, false).then(() => {
        setTimeout(() => {
          modalEl.classList.remove(styles['--in-transition'])
          focus.handleModalHasOpened(modalEl)
          resolve(modalsArr.current[modalsArr.current.length - 1])
        }, 10) // till next render where `open` state takes effect, and we can't resolve the promise in useEffect
      })
    })
  }

  const controlFunctions = {
    push,
    pop,
    transit,
    empty,
    next,
    back,
    hide,
    show,
    animation: animation.current
  }
  useImperativeHandle(ref, () => controlFunctions)

  useLayoutEffect(() => {
    modalsArr.current.forEach((e) => {
      if (activeSheet && activeSheet.id === e.id) e.htmlElement?.classList.add(styles.active)
      else e.htmlElement?.classList.remove(styles.active)
    })
  }, [activeSheet])

  useEffect(() => {
    if (children) push(children)
    // rootElement.style.position = 'relative'

    return () => {
      focus.handleModalHasClosed(true)
    }
  }, [])

  useEffect(() => {
    if (!open) focus.handleModalHasClosed()
  }, [open])

  return createPortal(
    <div
      className={styles.overlay + ' ' + classNameOverlay}
      data-omodal-id={id}
      data-omodal-animation={animation.current.type}
      data-omodal-type={type}
      data-omodal-position={position}
      data-omodal-open={open ? '' : undefined}
      data-omodal-animation-pause={animation.current.disable ? '' : undefined}
      ref={modalOverlayRef}
      role='dialog'
      aria-modal='true'
      onKeyDown={(ev) => {
        if (!onESC || ev.key !== 'Escape' || modalOverlayRef.current?.hasAttribute('inert')) return
        if (typeof onESC === 'string') controlFunctions[onESC]()
        if (typeof onESC === 'function') onESC(ev)
      }}
      style={{
        ['--one-modal-color-overlay' as any]: colorBackgroundOverlay || undefined,
        ['--one-modal-color-bg' as any]: colorBackground || undefined
      }}
      {...attributesOverlay}
    >
      <div
        className={styles['modals-container']}
        onClick={(ev) => {
          if (!onClickOverlay || ev.currentTarget != ev.target) return
          if (typeof onClickOverlay === 'string') controlFunctions[onClickOverlay]()
          if (typeof onClickOverlay === 'function') onClickOverlay(ev) //nativeEvent, just in case of using addEventListener() later
        }}
      >
        {modalsArr.current.map((e) => e.reactNode)}
      </div>
    </div>,
    rootElement
  )
})

class ModalState {
  static modalRefs: {
    [key: string]: RefObject<Modal>
  } = {}

  static promise: Promise<any> = Promise.resolve() // chain concurrent call of control function

  // TO DO: handle errors as one error in the chain will stop rest of the chain
  static _putInQueue = (taskFn: () => Promise<any>) => {
    this.promise = this.promise.then(async () => {
      await new Promise((resolve) => setTimeout(() => resolve(null), 10)) // keep 10ms gap between tasks to allow useEffect to run on next render and properly finalis transition
      return taskFn()
    })
    return this.promise
  }

  /**
   * Promisify modalRef retrieval from modalRefs object, and reject promise on fail.
   *
   * @param {string} keyOrRef
   * @returns {Modal} modalRef if existed, otherwise throw error
   */
  static _getModal = (keyOrRef: string | RefObject<Modal>): Modal => {
    const modalRef = typeof keyOrRef === 'string' ? ModalState.modalRefs[keyOrRef]?.current : keyOrRef.current
    if (!modalRef) throw Error(`Using control function on undefined Modal: ${keyOrRef}`)
    return modalRef
  }

  /**
   * Get the Modal control functions of an already bound modal component, given its key.
   *
   * @param {string} [keyOrRef="default"]  A string key or Ref. If a key isn't passed, its value would be 'default'.
   * @returns {Modal} modal object with { push, pop, empty, hide, show, animation } functionalities
   */
  static getModal = (keyOrRef: string | RefObject<Modal> = 'default'): Modal => {
    if (typeof keyOrRef === 'string' && !ModalState.modalRefs[keyOrRef])
      console.warn(
        `No modal is rendered yet with this key: "${keyOrRef}". Please double check the key name and make sure` +
          ' you bind a Modal component with this key via bindModal(key: string) inside an already rendered component. ' +
          'Only ignore this warning if you are sure that the binding happen before calling any of the functions of this object'
      )

    // We could here simply do `return this.modalRefs[key]?.current` and then all functionalities will be exposed.
    // However, ref is `null` at the start, and is defined after Modal component is rendered.
    // That is way useRef() hook returns {current: VALUE} as reference to the mutable VALUE instead of directly return VALUE.
    // By using function closure, `this.modalRefs[key]?.current` is resolved when each of these function is called, and
    // by using _getModalRef(), the returned promise is rejected if the this.modalRefs[key] is undefined yet.

    return {
      push: (...args) => ModalState._putInQueue(() => ModalState._getModal(keyOrRef).push(...args)),
      pop: (...args) => ModalState._putInQueue(() => ModalState._getModal(keyOrRef).pop(...args)),
      empty: (...args) => ModalState._putInQueue(() => ModalState._getModal(keyOrRef).empty(...args)),
      transit: (...args) => ModalState._putInQueue(() => ModalState._getModal(keyOrRef).transit(...args)),
      next: (...args) => ModalState._putInQueue(() => ModalState._getModal(keyOrRef).next(...args)),
      back: (...args) => ModalState._putInQueue(() => ModalState._getModal(keyOrRef).back(...args)),
      hide: (...args) => ModalState._putInQueue(() => ModalState._getModal(keyOrRef).hide(...args)),
      show: (...args) => ModalState._putInQueue(() => ModalState._getModal(keyOrRef).show(...args)),
      animation: {
        get disable() {
          return ModalState._getModal(keyOrRef).animation.disable
        },
        set disable(bool: ModalAnimation['disable']) {
          ModalState._getModal(keyOrRef).animation.disable = bool
        },
        get type() {
          return ModalState._getModal(keyOrRef).animation.type ?? 'slide'
        },
        set type(type: ModalAnimation['type']) {
          ModalState._getModal(keyOrRef).animation.type = type
        },
        pause: (...args) => ModalState._getModal(keyOrRef).animation.pause(...args),
        resume: (...args) => ModalState._getModal(keyOrRef).animation.resume(...args)
      }
    }
  }

  /**
   * Create a modal instance with the given key and bind it to a modal component through `ref`.
   * You can retrieve this modal instance anywhere using the `getModal(key)`.
   *
   * @param {string} [key = "default"] If a key isn't passed, its value would be 'default'.
   * @returns {[Modal, RefObject<Modal>]} Tuple array with first element is Modal control functions, and second element ref object.
   */
  static bindModal = (key: string = 'default'): [Modal, RefObject<Modal>] => {
    const newModalRef = useRef<Modal>(null) // react-hook should be outside any conditions
    if (!ModalState.modalRefs[key]) ModalState.modalRefs[key] = newModalRef

    return [ModalState.getModal(key), ModalState.modalRefs[key]]
  }

  /**
   * Use a keyless modal, by binding a newly created modal instance to a modal component through `ref` and returning its control function.
   *
   * This should be used for one-time quick-use of Modal, as it won't be bound to a key for later retrieval.
   * Nevertheless, if access to this instance on other component is needed, call `getModal(ref)` passing `ref` of this modal as an argument.
   *
   * @returns {[Modal, RefObject<Modal>]} Tuple array with first element is Modal control functions, and second element ref object.
   */
  static useModal = (): [Modal, RefObject<Modal>] => {
    const newModalRef = useRef<Modal>(null)
    return [ModalState.getModal(newModalRef), newModalRef]
  }
}

export const { bindModal, getModal, useModal } = ModalState
export { Modal, ModalPushOneTimeOptions, ModalOneTimeOptions, ModalProps, ModalAnimation, BottomSheetOptions }
