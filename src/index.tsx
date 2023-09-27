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
import './style.css'
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

  const modalRef = useRef<HTMLDivElement>(null)

  // `useRef` with `forceUpdate` instead of useState to have up-to-date value for pages array, and push to the existed array directly
  const modalsArr = useRef<ModalSheet[]>([])
  const [, forceUpdate] = useReducer((x) => x + 1, 0)

  const [id] = useState(Math.random().toString(16).slice(10))
  const [open, setOpen] = useState(false)
  const [focus] = useState(new Focus(modalRef, id, rootElement))
  const [activeSheet, setActiveSheet] = useState<ModalSheet | null>(null)

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
      if (!type || !modalRef.current) return
      _animationType.current = type
      modalRef.current.setAttribute('data-omodal-animation', type) // Update DOM
    },
    pause: (timeout?: number) => {
      // if timeout is not passed, pause indefinitely
      modalRef.current?.setAttribute('data-omodal-animation-pause', '')
      timeout && setTimeout(animation.current.resume, timeout)
    },
    resume: (timeout?: number) => {
      // if timeout is not passed, resume indefinitely
      modalRef.current?.removeAttribute('data-omodal-animation-pause')
      timeout && setTimeout(animation.current.pause, timeout)
    }
  })

  const resolveTransition = useCallback(
    (
      modalSheetEL: HTMLElement,
      options: ModalOneTimeOptions,
      newActiveSheet: ModalSheet | null,
      triggerTransitionFn = () => {},
      skipTransition = !open
    ) =>
      new Promise((resolve) => {
        const { animation: animationOptions } = options
        const eventHandler = (e: Event) => e.target === modalSheetEL && resolveHandler()

        const resolveHandler = runOnce(() => {
          modalSheetEL.removeEventListener('transitionend', eventHandler)
          modalSheetEL.removeEventListener('transitioncancel', eventHandler)
          focus.resume()
          if (newActiveSheet) Focus.setInertOnSiblings(newActiveSheet.htmlElement || null)
          if (newActiveSheet && open) {
            if (newActiveSheet.activeElement) Focus.set(newActiveSheet.activeElement)
            else if (newActiveSheet.htmlElement) Focus.setOnFirstDescendant(newActiveSheet.htmlElement)
          }
          resolve(null)
        })

        if (skipTransition) return resolveHandler()

        const disableAnimation =
          animationOptions === false ||
          (animationOptions !== true && animationOptions?.disable) ||
          (animationOptions === undefined && animation.current.disable) // defining `animation` is sufficient to enable animation on this function call

        if (disableAnimation && !animation.current.disable) animation.current.pause(250)
        if (!disableAnimation && animation.current.disable) animation.current.resume(250)
        if (disableAnimation) return resolveHandler()

        // transitionend/cancel event can be triggered by child element as well, hence ignore those
        modalSheetEL.addEventListener('transitionend', eventHandler)
        modalSheetEL.addEventListener('transitioncancel', eventHandler)

        triggerTransitionFn()
      }),
    [open]
  )

  const push: Modal['push'] = (content, options = {}) =>
    new Promise((resolve) => {
      const { silent = false, last = false, popLast = false, attributes: oneTimeAttrs } = options
      const modalSheet: ModalSheet = {
        id: Math.random().toString(16).slice(10),
        reactNode: null,
        htmlElement: null,
        activeElement: null
      }
      const shouldActiveChange = modalsArr.current.length === 0 || !(silent || last)
      const skipTransition = !shouldActiveChange || !open
      let hasCalled = false // flag to run ref callback only once

      if (!skipTransition) focus.stop()

      modalSheet.reactNode = (
        <div
          key={modalSheet.id}
          className={'omodal__sheet ' + className}
          ref={(el) => {
            if (!el || hasCalled) return // run only once
            hasCalled = true

            if (type === 'bottom-sheet' && !bottomSheetOptions.disableDrag) dragElement(el, bottomSheetOptions, pop)

            const newActiveSheet = shouldActiveChange ? modalSheet : activeSheet
            resolveTransition(el, options, newActiveSheet, () => {}, skipTransition).then(() => {
              if (popLast && modalsArr.current.length > 1) {
                modalsArr.current.splice(modalsArr.current.length - 2, 1) // remove before last
                forceUpdate()
              } else if (modalsArr.current.length > stackSize) {
                modalsArr.current.shift() // remove last element
                forceUpdate()
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

      const i = !last && activeSheet ? modalsArr.current.indexOf(activeSheet) : modalsArr.current.length - 1
      modalsArr.current.splice(i + 1, 0, modalSheet)
      forceUpdate()

      if (shouldActiveChange) setTimeout(() => setActiveSheet(modalSheet), 5) // till element is loaded, so transition takes effect
    })

  const transit: Modal['transit'] = (content, options) => {
    return push(content, { popLast: true, ...options })
  }

  const pop: Modal['pop'] = (options = {}) =>
    new Promise((resolve) => {
      const { last = false } = options

      const len = modalsArr.current.length
      if (!len) throw Error('Modal is empty! No modal-sheet to pop')

      if (!activeSheet) throw Error('No active modal-sheet!')
      const activeIdx = modalsArr.current.indexOf(activeSheet)

      // if called with `last` option, select before-last (if before not existed, select the first one)
      // otherwise select active (if it is not the first one (ie. 0), select before-active)
      const i = last ? (len > 1 ? len - 2 : 0) : activeIdx && activeIdx - 1
      const modalSheet = modalsArr.current[i]
      const modalSheetEL = modalSheet?.htmlElement
      if (!modalSheetEL) throw Error('Unexpected behavior: No HTML eLement is found while pop!') // shouldn't happen, just in case!!

      const shouldClose = last ? len === 1 : activeIdx === 0
      const shouldActiveChange = !last || activeIdx === len - 1
      const skipTransition = (last && activeIdx !== len - 1) || !open
      // if (shouldClose && open) focus.handleModalWillClose() // currently handleModalWillClose only stopFocus

      if (!skipTransition) focus.stop()
      if (shouldClose) setActiveSheet(null)
      else if (shouldActiveChange) setActiveSheet(modalSheet)

      const triggerTransitionFn = () => {
        if (shouldClose) {
          modalSheetEL.classList.add('omodal__sheet--out-transition')
          modalRef.current?.classList.add('omodal__sheet--out-transition')
        }
      }

      const newActiveSheet = !shouldClose && shouldActiveChange ? modalSheet : activeSheet
      resolveTransition(modalSheetEL, options, newActiveSheet, triggerTransitionFn, skipTransition).then(() => {
        const res = modalsArr.current[shouldClose ? 0 : i + 1]

        modalsArr.current.splice(shouldClose ? 0 : i + 1, 1) // 2nd parameter means remove one item only

        if (shouldClose) setActiveSheet(len > 1 ? modalsArr.current[0] : null)
        if (shouldClose && open) {
          setOpen(false)
        }

        forceUpdate()
        resolve(res as ModalSheet)
      })
    })

  const empty: Modal['empty'] = (options = {}) =>
    new Promise((resolve) => {
      if (!modalsArr.current.length) throw Error('Modal is already empty! No modal-sheets to empty!')

      const res = [...modalsArr.current] // hard copy before empty
      const modalSheetEL = activeSheet?.htmlElement
      if (!modalSheetEL) throw Error('Unexpected behavior: No HTML eLement is found while empty!') // shouldn't happen, just in case!!

      if (open) focus.handleModalWillClose()

      const triggerTransitionFn = () => {
        modalSheetEL.classList.add('omodal__sheet--out-transition')
        modalRef.current?.classList.add('omodal__sheet--out-transition')
      }

      resolveTransition(modalSheetEL, options, activeSheet, triggerTransitionFn).then(() => {
        modalSheetEL.classList.remove('omodal__sheet--out-transition')
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
      const modalSheetEL = nextSheet?.htmlElement
      if (!modalSheetEL) throw Error('Unexpected behavior: No HTML element for next sheet is found!') // shouldn't happen, just in case!!

      setActiveSheet(nextSheet)
      resolveTransition(modalSheetEL, options, nextSheet).then(() => resolve(nextSheet))
    })

  const back: Modal['back'] = (options = {}) =>
    new Promise((resolve) => {
      const len = modalsArr.current.length

      if (len <= 1) throw Error('Cannot go to previous sheet, modal has 0 or 1 sheet!')
      if (!activeSheet) throw Error('No active modal-sheet!')

      const i = modalsArr.current.indexOf(activeSheet)
      if (i === 0) throw Error('Cannot go to previous sheet, current active sheet is the first one!')

      const prevSheet = modalsArr.current[i - 1]
      const modalSheetEL = prevSheet?.htmlElement
      if (!modalSheetEL) throw Error('Unexpected behavior: No HTML element for previous sheet is found!') // shouldn't happen, just in case!!

      setActiveSheet(prevSheet)
      resolveTransition(modalSheetEL, options, prevSheet).then(() => resolve(prevSheet))
    })

  const hide: Modal['hide'] = (options = {}) =>
    new Promise((resolve) => {
      if (!open) throw Error('Modal is already hidden!')

      const modalSheetEL = activeSheet?.htmlElement
      if (!modalSheetEL) throw Error('Unexpected behavior: No HTML eLement is found while hide!') // shouldn't happen, just in case!!

      if (open) focus.handleModalWillClose()

      const triggerTransitionFn = () => {
        modalSheetEL.classList.add('omodal__sheet--out-transition')
        modalRef.current?.classList.add('omodal__sheet--out-transition')
      }

      resolveTransition(modalSheetEL, options, null, triggerTransitionFn).then(() => {
        modalSheetEL.classList.remove('omodal__sheet--out-transition')
        setOpen(false)
        resolve()
      })
    })

  const show: Modal['show'] = async (content, options = {}) => {
    if (!modalsArr.current.length && !content) throw Error('Nothing to show!')
    if (open && !content) throw Error('Modal is already shown!')

    modalRef.current?.classList.remove('omodal__sheet--out-transition')
    focus.preventPageScroll()

    let res
    if (content) res = await push(content, options)
    if (open) return res ?? modalsArr.current[modalsArr.current.length - 1]
    setOpen(true)

    return new Promise((resolve) => {
      const modalSheetEL = activeSheet?.htmlElement
      if (!modalSheetEL) throw Error('Unexpected behavior: No HTML eLement is found while show!') // shouldn't happen, just in case!!

      focus.handleModalWillOpen()

      const triggerTransitionFn = () => {
        // remove class to hide element and return it to trigger transition
        modalSheetEL.classList.add('omodal__sheet--in-transition')
        modalSheetEL.classList.remove('omodal__sheet--active')
        setTimeout(() => modalSheetEL.classList.add('omodal__sheet--active'), 10)
      }

      resolveTransition(modalSheetEL, options, activeSheet, triggerTransitionFn, false).then(() => {
        setTimeout(() => {
          modalSheetEL.classList.remove('omodal__sheet--in-transition')
          focus.handleModalHasOpened(modalSheetEL)
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
      if (activeSheet && activeSheet.id === e.id) e.htmlElement?.classList.add('omodal__sheet--active')
      else e.htmlElement?.classList.remove('omodal__sheet--active')
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
      className={'omodal ' + classNameOverlay}
      data-omodal-id={id}
      data-omodal-animation={animation.current.type}
      data-omodal-type={type}
      data-omodal-position={position}
      data-omodal-open={open ? '' : undefined}
      data-omodal-animation-pause={animation.current.disable ? '' : undefined}
      ref={modalRef}
      role='dialog'
      aria-modal='true'
      onKeyDown={(ev) => {
        if (!onESC || ev.key !== 'Escape' || modalRef.current?.hasAttribute('inert')) return
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
        className={'omodal__sheets'}
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

  static errorHandler: ((e: Error) => any) | null = null // to suppress all errors in production
  static _promiseChain: Promise<any> = Promise.resolve() // chain concurrent call of control function

  // TO DO: handle errors as one error in the chain will stop rest of the chain
  static _putInQueue = (taskFn: () => Promise<any>) => {
    ModalState._promiseChain = ModalState._promiseChain
      .then(async () => {
        await new Promise((resolve) => setTimeout(() => resolve(null), 10)) // keep 10ms gap between tasks to allow useEffect to run on next render and properly finalis transition
        return taskFn()
      })
      .catch((err: Error) => {
        return err // this.promiseChain shouldn't stop, error will be re-thrown only in the returned instance
      })

    return ModalState._promiseChain.then((e) => {
      if (e instanceof Error) {
        if (typeof ModalState.errorHandler === 'function') ModalState.errorHandler(e)
        else {
          console.warn('One Modal Error: ' + e.message)
          throw e
        }
      } else return e
    })
  }

  static setModalErrorHandler = (errorHandler: ((e: Error) => any) | null) => {
    ModalState.errorHandler = errorHandler
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

export const { bindModal, getModal, useModal, setModalErrorHandler } = ModalState
export { Modal, ModalPushOneTimeOptions, ModalOneTimeOptions, ModalProps, ModalAnimation, BottomSheetOptions }
