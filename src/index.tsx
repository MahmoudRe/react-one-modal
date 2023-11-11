import React, {
  useRef,
  useReducer,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  RefObject,
  ForwardedRef,
  useCallback
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
    classNameSheet = '',
    className = '', // className for modal (ie. container/overlay)
    colorBackgroundSheet, // default 'white', also it can be set by css variable --one-modal-color-bg
    colorBackground, // default #00000099, also it can be set by css variable --one-modal-color-overlay
    attributesSheet = {},
    attributes, // pass the reset to modal container/overlay
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

  const handleOpen = useCallback((open: boolean) => {
    setOpen(open)

    if (open) {
      if (modalRef.current) modalRef.current.style.display = ''
      modalRef.current?.scrollWidth // trigger render by requesting scrollWidth, hence changing css-selector causes transition
      modalRef.current?.removeAttribute('data-omodal-close')
    }
    if (!open) {
      focus.handleModalWillClose()
      modalRef.current?.setAttribute('data-omodal-close', '')
    }
  }, [])

  const resolveTransition = useCallback(
    (modalSheetEL: HTMLElement, options: ModalOneTimeOptions, shouldClose = false, skipTransition = !open) =>
      new Promise((resolve) => {
        const { animation: animationOptions } = options
        const eventHandler = (e: Event) => e.target === modalSheetEL && resolveHandler()

        const resolveHandler = runOnce(() => {
          modalSheetEL.removeEventListener('transitionend', eventHandler)
          modalSheetEL.removeEventListener('transitioncancel', eventHandler)
          focus.resume()
          let activeSheet = modalsArr.current.find((e) => e.state === 'active')
          const isClose = modalRef.current?.hasAttribute('data-omodal-close') // because `open` state is passed as variable on resolveTransition call-time and it would be outdated at transition end/cancel.
          if (activeSheet && !isClose) {
            Focus.setInertOnSiblings(activeSheet.htmlElement || null)

            if (activeSheet.activeElement) Focus.set(activeSheet.activeElement)
            else Focus.setOnFirstDescendant(activeSheet.htmlElement)
          }
          if (shouldClose && modalRef.current) {
            modalRef.current.style.display = 'none'
            focus.handleModalHasClosed()
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
      }),
    [open]
  )

  const push: Modal['push'] = (content, options = {}) =>
    new Promise((resolve) => {
      const { silent = false, last = false, transit = false, attributes: oneTimeAttrs } = options
      const shouldActiveChange = modalsArr.current.length === 0 || !(silent || last)
      const skipTransition = !shouldActiveChange || !open
      const i = last ? modalsArr.current.length - 1 : modalsArr.current.findIndex((e) => e.state === 'active')
      let hasCalled = false // flag to run ref callback only once

      if (!skipTransition) focus.stop()

      const modalSheet: ModalSheet = {
        id: Math.random().toString(16).slice(10),
        state: 'next',
        content: content,
        htmlElement: null,
        activeElement: null,
        props: {
          className: ('omodal__sheet ' + classNameSheet).trim(),
          ...attributesSheet,
          ...oneTimeAttrs,
          ref: (el: HTMLDivElement | null) => {
            if (!el) return

            modalSheet.htmlElement = el
            el?.addEventListener('focusin', () => (modalSheet.activeElement = document.activeElement)) // keep track of active element
            if (type === 'bottom-sheet' && !bottomSheetOptions.disableDrag) dragElement(el, bottomSheetOptions, pop)

            if (hasCalled) return // run only once, just in case of rerender and the function called again
            hasCalled = true

            if (shouldActiveChange) {
              el.scrollWidth // call el.scrollWidth to trigger render before changing states, hence transition takes effect
              modalSheet.state = 'active'
              if (i >= 0) modalsArr.current[i].state = 'previous'
            }

            resolveTransition(el, options, false, skipTransition).then(() => {
              if (transit && i >= 0) modalsArr.current.splice(i, 1) // replace current active modal
              else if (modalsArr.current.length > stackSize) modalsArr.current.shift() // remove last element
              forceUpdate()
              resolve(modalSheet)
            })

            forceUpdate()
          }
        }
      }

      if (shouldActiveChange && skipTransition) {
        modalSheet.state = 'active'
        if (i >= 0) modalsArr.current[i].state = 'previous'
      }

      modalsArr.current.splice(i + 1, 0, modalSheet)
      forceUpdate()
    })

  const transit: Modal['transit'] = (content, options) => {
    return push(content, { transit: true, ...options })
  }

  const pop: Modal['pop'] = (options = {}) =>
    new Promise((resolve) => {
      const { last = false } = options

      const len = modalsArr.current.length
      if (!len) throw Error('Modal is empty! No modal-sheet to pop')

      const activeIdx = modalsArr.current.findIndex((e) => e.state === 'active')
      if (activeIdx < 0) throw Error('No active modal-sheet!')

      const toPopIdx = last ? len - 1 : activeIdx

      const shouldClose = toPopIdx === 0
      const shouldActiveChange = toPopIdx === activeIdx
      const skipTransition = !shouldActiveChange || !open

      if (shouldClose) handleOpen(false)

      const newActiveSheet = modalsArr.current[shouldClose ? 1 : toPopIdx - 1]

      modalsArr.current[toPopIdx].state = 'next'
      if (shouldActiveChange && len > 1) newActiveSheet.state = 'active'

      // listen to the popped sheet closing-transition event, or to the new active sheet opening-transition event if not closing.
      const modalSheet = shouldClose ? modalsArr.current[toPopIdx] : newActiveSheet
      if (!modalSheet?.htmlElement) throw Error('Unexpected behavior: No HTML eLement is found while pop!') // shouldn't happen, just in case!!

      resolveTransition(modalSheet.htmlElement, options, shouldClose, skipTransition).then(() => {
        const res = modalsArr.current[toPopIdx]

        modalsArr.current.splice(toPopIdx, 1) // 2nd parameter means remove one item only

        forceUpdate()
        resolve(res as ModalSheet)
      })

      forceUpdate()
    })

  const empty: Modal['empty'] = (options = {}) =>
    new Promise((resolve) => {
      if (!modalsArr.current.length) throw Error('Modal is already empty! No modal-sheets to empty!')

      const res = [...modalsArr.current] // hard copy before empty
      const modalSheetEL = modalsArr.current.find((e) => e.state === 'active')?.htmlElement
      if (!modalSheetEL) throw Error('Unexpected behavior: No HTML eLement is found while empty!') // shouldn't happen, just in case!!

      if (open) handleOpen(false)

      resolveTransition(modalSheetEL, options, true).then(() => {
        modalsArr.current.splice(0, modalsArr.current.length) // empty array while keeping reference
        forceUpdate()
        resolve(res)
      })
    })

  const next: Modal['next'] = (options = {}) =>
    new Promise((resolve) => {
      const len = modalsArr.current.length

      if (len <= 1) throw Error('Cannot go to next sheet, modal has 0 or 1 sheet!')

      const activeSheetIdx = modalsArr.current.findIndex((e) => e.state === 'active')
      if (activeSheetIdx < 0) throw Error('No active modal-sheet!')

      if (activeSheetIdx === len - 1) throw Error('Cannot go to next sheet, current active sheet is the last one!')

      const nextSheet = modalsArr.current[activeSheetIdx + 1]
      if (!nextSheet?.htmlElement) throw Error('Unexpected behavior: No HTML element for next sheet is found!') // shouldn't happen, just in case!!

      modalsArr.current[activeSheetIdx].state = 'previous'
      nextSheet.state = 'active'
      forceUpdate()

      resolveTransition(nextSheet.htmlElement, options).then(() => resolve(nextSheet))
    })

  const back: Modal['back'] = (options = {}) =>
    new Promise((resolve) => {
      const len = modalsArr.current.length

      if (len <= 1) throw Error('Cannot go to previous sheet, modal has 0 or 1 sheet!')

      const activeSheetIdx = modalsArr.current.findIndex((e) => e.state === 'active')
      if (activeSheetIdx < 0) throw Error('No active modal-sheet!')
      if (activeSheetIdx === 0) throw Error('Cannot go to previous sheet, current active sheet is the first one!')

      const prevSheet = modalsArr.current[activeSheetIdx - 1]
      if (!prevSheet?.htmlElement) throw Error('Unexpected behavior: No HTML element for previous sheet is found!') // shouldn't happen, just in case!!

      modalsArr.current[activeSheetIdx].state = 'next'
      prevSheet.state = 'active'
      forceUpdate()

      resolveTransition(prevSheet?.htmlElement, options).then(() => resolve(prevSheet))
    })

  const hide: Modal['hide'] = (options = {}) =>
    new Promise((resolve) => {
      if (!open) throw Error('Modal is already hidden!')

      const activeSheetEL = modalsArr.current.find((e) => e.state === 'active')?.htmlElement
      if (!activeSheetEL) throw Error('Unexpected behavior: No HTML eLement is found while hide!') // shouldn't happen, just in case!!

      if (open) handleOpen(false)

      resolveTransition(activeSheetEL, options, true).then(() => resolve())
    })

  const show: Modal['show'] = async (content, options = {}) => {
    if (!modalsArr.current.length && !content) throw Error('Nothing to show!')
    if (open && !content) throw Error('Modal is already shown!')

    focus.preventPageScroll()

    let res
    if (content) res = await push(content, options)
    if (open) return res ?? modalsArr.current[modalsArr.current.length - 1]
    handleOpen(true)

    return new Promise((resolve) => {
      const modalSheetEL = modalsArr.current.find((e) => e.state === 'active')?.htmlElement
      if (!modalSheetEL) throw Error('Unexpected behavior: No HTML eLement is found while show!') // shouldn't happen, just in case!!

      focus.handleModalWillOpen()

      resolveTransition(modalSheetEL, options, false, false).then(() => {
        focus.handleModalHasOpened(modalSheetEL)
        resolve(modalsArr.current[modalsArr.current.length - 1])
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

  useEffect(() => {
    if (children) push(children)
    // rootElement.style.position = 'relative'

    return () => {
      focus.handleModalHasClosed(true)
    }
  }, [])

  return createPortal(
    <div
      className={'omodal ' + className}
      data-omodal-id={id}
      data-omodal-animation={animation.current.type}
      data-omodal-type={type}
      data-omodal-position={position}
      data-omodal-animation-pause={animation.current.disable ? '' : undefined}
      ref={modalRef}
      role='dialog'
      aria-modal='true'
      data-omodal-close=''
      onKeyDown={(ev) => {
        if (!onESC || ev.key !== 'Escape' || modalRef.current?.hasAttribute('inert')) return
        if (typeof onESC === 'string') controlFunctions[onESC]()
        if (typeof onESC === 'function') onESC(ev)
      }}
      style={{
        display: 'none',
        ['--omodal-color-bg' as any]: colorBackground || undefined,
        ['--omodal-sheet-color-bg' as any]: colorBackgroundSheet || undefined
      }}
      {...attributes}
    >
      <div
        className={'omodal__sheets'}
        onClick={(ev) => {
          if (!onClickOverlay || ev.currentTarget != ev.target) return
          if (typeof onClickOverlay === 'string') controlFunctions[onClickOverlay]()
          if (typeof onClickOverlay === 'function') onClickOverlay(ev) //nativeEvent, just in case of using addEventListener() later
        }}
      >
        {modalsArr.current.map((e) => (
          <div {...e.props} key={e.id} data-omodal-sheet-state={e.state + (open ? '' : '-closed')}>
            {e.content}
          </div>
        ))}
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
