import React, {
  useRef,
  useReducer,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  ForwardedRef,
  useCallback,
  ReactNode
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
  ModalSheet,
  Action
} from './typings'
import { runOnce } from './utils'
import Focus from './focus'
import ModalsManager from './manager'
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
    onClickOverlay,
    forceOpenIfBlocked
  } = props

  const modalRef = useRef<HTMLDivElement>(null)

  const [id] = useState(Math.random().toString(16).slice(10))
  const [open, setOpen] = useState(false)
  const [focus] = useState(new Focus(modalRef, id, rootElement))

  // `useRef` with `forceUpdate` instead of useState to have up-to-date value for pages array, and push to the existed array directly
  const modalSheets = useRef<ModalSheet[]>(children ? [createModalSheet(children)] : [])
  const [, forceUpdate] = useReducer((x) => x + 1, 0)

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

  const handleOpen = useCallback((action: Action) => {
    if (action !== Action.OPEN && action !== Action.CLOSE) return

    const shouldOpen = action === Action.OPEN
    if (open === shouldOpen) return
    setOpen(shouldOpen)

    if (shouldOpen) {
      focus.handleModalWillOpen()
      modalRef.current?.setAttribute('data-omodal-close', '')
      modalRef.current?.scrollWidth // trigger render by requesting scrollWidth, hence changing css-selector causes transition
      modalRef.current?.removeAttribute('data-omodal-close')
    } else {
      focus.handleModalWillClose()
      modalRef.current?.setAttribute('data-omodal-close', '')
    }
  }, [open]) // prettier-ignore

  const resolveTransition = useCallback(
    (options: ModalOneTimeOptions, action: Action, modalSheet?: ModalSheet) =>
      new Promise<void>((resolve) => {
        modalSheet ??= modalSheets.current.find((e) => e.state === 'active')
        if (!modalSheet) throw Error('Unexpected behavior: No active-sheet is found while resolveTransition!') // shouldn't happen, just in case!!

        const modalSheetEl = modalSheet.htmlElement
        if (!modalSheetEl) throw Error('Unexpected behavior: No HTML eLement is found while resolveTransition!') // shouldn't happen, just in case!!

        handleOpen(action)

        const eventHandler = (e: Event) => e.target === modalSheetEl && resolveHandler() // transitionend/cancel event can be triggered by child element as well, hence ignore those

        const resolveHandler = runOnce(() => {
          modalSheetEl.removeEventListener('transitionend', eventHandler)
          modalSheetEl.removeEventListener('transitioncancel', eventHandler)
          focus.resume()

          if (action === Action.OPEN) focus.handleModalHasOpened()
          else if (action === Action.CLOSE) focus.handleModalHasClosed()
          focus.handleActiveSheetHasChanged()

          resolve()
        })

        const isClose = !modalRef.current || modalRef.current.getAttribute('data-omodal-close') === 'completed'
        if (action === Action.NONE || isClose) return resolveHandler()

        const { animation: animationOptions } = options
        const disableAnimation =
          animationOptions === false ||
          (animationOptions !== true && animationOptions?.disable) ||
          (animationOptions === undefined && animation.current.disable) // defining `animation` is sufficient to enable animation on this function call

        if (disableAnimation && !animation.current.disable) animation.current.pause(250)
        if (!disableAnimation && animation.current.disable) animation.current.resume(250)
        if (disableAnimation) return setTimeout(resolveHandler, 10) //slight delay if no animation false

        modalSheetEl.addEventListener('transitionend', eventHandler)
        modalSheetEl.addEventListener('transitioncancel', eventHandler)
      }),
    [open] /* hack-fix: handleOpen() is substituted here while minifying, hence state `open` should be dependent here */
  )

  function createModalSheet(
    content: ReactNode,
    options: ModalPushOneTimeOptions = {},
    action: Action = Action.SHEET_CHANGE,
    prevIdx = -1,
    resolve?: (value: ModalSheet | PromiseLike<ModalSheet>) => void
  ): ModalSheet {
    const { transit = false, attributes: oneTimeAttrs } = options
    let hasCalled = false // flag to run ref callback only once

    const modalSheet: ModalSheet = {
      id: Math.random().toString(16).slice(10),
      state: action === Action.SHEET_CHANGE ? `active${open ? '-closed' : ''}` : 'next',
      content: content,
      htmlElement: null,
      props: {
        className: ('omodal__sheet ' + classNameSheet).trim(),
        ...attributesSheet,
        ...oneTimeAttrs,
        ref: (el: HTMLDivElement | null) => {
          if (!el) return
          modalSheet.htmlElement = el

          el.addEventListener('focusin', () => {
            el.querySelector('[data-omodal-autofocus]')?.removeAttribute('data-omodal-autofocus')
            document.activeElement?.setAttribute('data-omodal-autofocus', '')
          }) // keep track of active element
          
          if (type === 'bottom-sheet' && !bottomSheetOptions.disableDrag) dragElement(el, bottomSheetOptions, pop)

          if (hasCalled) return // run only once, just in case of rerender and the function called again
          hasCalled = true

          if (action === Action.SHEET_CHANGE) {
            el.scrollWidth // call el.scrollWidth to trigger render before changing states, hence transition takes effect
            modalSheet.state = 'active'
            if (prevIdx >= 0) modalSheets.current[prevIdx].state = 'previous'
          }

          resolveTransition(options, action).then(() => {
            if (transit && prevIdx >= 0) modalSheets.current.splice(prevIdx, 1) // replace current active modal
            else if (modalSheets.current.length > stackSize) modalSheets.current.shift() // remove last element
            forceUpdate()
            if (resolve) resolve(modalSheet as ModalSheet)
          })

          forceUpdate()
        }
      }
    }

    return modalSheet
  }

  const push: Modal['push'] = (content, options = {}) =>
    new Promise((resolve) => {
      const { silent = false, last = false } = options

      const action = modalSheets.current.length === 0 || !(silent || last) ? Action.SHEET_CHANGE : Action.NONE
      const prevIdx = last ? modalSheets.current.length - 1 : modalSheets.current.findIndex((e) => e.state === 'active')

      if (action === Action.SHEET_CHANGE && open) focus.stop()
      const modalSheet = createModalSheet(content, options, action, prevIdx, resolve)

      modalSheets.current.splice(prevIdx + 1, 0, modalSheet)
      forceUpdate()
    })

  const transit: Modal['transit'] = (content, options) => push(content, { transit: true, ...options })

  const pop: Modal['pop'] = (options = {}) =>
    new Promise((resolve) => {
      const { last = false } = options

      const len = modalSheets.current.length
      if (!len) throw Error('Modal is empty! No modal-sheet to pop')

      const activeIdx = modalSheets.current.findIndex((e) => e.state === 'active')
      if (activeIdx < 0) throw Error('No active modal-sheet!')

      const toPopIdx = last ? len - 1 : activeIdx

      const action = toPopIdx === 0 ? Action.CLOSE : toPopIdx === activeIdx ? Action.SHEET_CHANGE : Action.NONE
      const newActiveSheet = modalSheets.current[toPopIdx === 0 ? 1 : toPopIdx - 1]

      modalSheets.current[toPopIdx].state = 'next'
      if (toPopIdx === activeIdx && len > 1) newActiveSheet.state = 'active'

      // listen to the popped sheet closing-transition event, or to the new active sheet opening-transition event if not closing.
      const modalSheet = toPopIdx === 0 ? modalSheets.current[toPopIdx] : newActiveSheet

      resolveTransition(options, action, modalSheet).then(() => {
        const res = modalSheets.current[toPopIdx]
        modalSheets.current.splice(toPopIdx, 1) // 2nd parameter means remove one item only
        forceUpdate()
        resolve(res as ModalSheet)
      })

      forceUpdate()
    })

  const empty: Modal['empty'] = (options = {}) => {
    if (!modalSheets.current.length) throw Error('Modal is already empty! No modal-sheets to empty!')
    return resolveTransition(options, Action.CLOSE).then(() => {
      const res = [...modalSheets.current] // hard copy before empty
      modalSheets.current.splice(0, modalSheets.current.length) // empty array while keeping reference
      forceUpdate()
      return res
    })
  }

  const next: Modal['next'] = (options = {}) => {
    const len = modalSheets.current.length
    if (len <= 1) throw Error('Cannot go to next sheet, modal has 0 or 1 sheet!')

    const activeSheetIdx = modalSheets.current.findIndex((e) => e.state === 'active')
    if (activeSheetIdx < 0) throw Error('No active modal-sheet!')
    if (activeSheetIdx === len - 1) throw Error('Cannot go to next sheet, current active sheet is the last one!')

    const nextSheet = modalSheets.current[activeSheetIdx + 1]

    modalSheets.current[activeSheetIdx].state = 'previous'
    nextSheet.state = 'active'
    forceUpdate()

    return resolveTransition(options, Action.SHEET_CHANGE).then(() => nextSheet)
  }

  const back: Modal['back'] = (options = {}) => {
    const len = modalSheets.current.length

    if (len <= 1) throw Error('Cannot go to previous sheet, modal has 0 or 1 sheet!')

    const activeSheetIdx = modalSheets.current.findIndex((e) => e.state === 'active')
    if (activeSheetIdx < 0) throw Error('No active modal-sheet!')
    if (activeSheetIdx === 0) throw Error('Cannot go to previous sheet, current active sheet is the first one!')

    const prevSheet = modalSheets.current[activeSheetIdx - 1]

    modalSheets.current[activeSheetIdx].state = 'next'
    prevSheet.state = 'active'
    forceUpdate()

    return resolveTransition(options, Action.SHEET_CHANGE).then(() => prevSheet)
  }

  const hide: Modal['hide'] = (options = {}) => {
    if (!open) throw Error('Modal is already hidden!')
    return resolveTransition(options, Action.CLOSE)
  }

  const show: Modal['show'] = async (content, options = {}) => {
    if (!modalSheets.current.length && !content) throw Error('Nothing to show!')
    if (open && !content) throw Error('Modal is already shown!')
    if (!open && !forceOpenIfBlocked && focus.isBlockedByAnotherModal())
      throw Error('This modal is blocked by another opened modal with higher stacking context!')

    focus.preventPageScroll()

    let res
    if (content) res = await push(content, options)
    if (open) return res ?? modalSheets.current[modalSheets.current.length - 1]

    return resolveTransition(options, Action.OPEN).then(() => modalSheets.current[modalSheets.current.length - 1])
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

  useEffect(() => () => focus.handleModalHasClosed(true), []) // callback's return function runs on unmount

  return createPortal(
    <div
      className={('omodal ' + className).trim()}
      data-omodal-id={id}
      data-omodal-animation={animation.current.type}
      data-omodal-type={type}
      data-omodal-position={position}
      data-omodal-animation-pause={animation.current.disable ? '' : undefined}
      ref={modalRef}
      role='dialog'
      aria-modal='true'
      data-omodal-close='completed'
      onKeyDown={(ev) => {
        if (!onESC || ev.key !== 'Escape' || modalRef.current?.hasAttribute('inert')) return
        if (typeof onESC === 'string') controlFunctions[onESC]()
        if (typeof onESC === 'function') onESC(ev)
      }}
      style={{
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
        {modalSheets.current.map((e) => (
          <div {...e.props} key={e.id} data-omodal-sheet-state={e.state + (open ? '' : '-closed')}>
            {e.content}
          </div>
        ))}
      </div>
    </div>,
    rootElement
  )
})

export const { bindModal, getModal, useModal, setModalErrorHandler } = ModalsManager
export { Modal, ModalPushOneTimeOptions, ModalOneTimeOptions, ModalProps, ModalAnimation, BottomSheetOptions }
