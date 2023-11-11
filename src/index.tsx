import React, {
  useRef,
  useReducer,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
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

export const { bindModal, getModal, useModal, setModalErrorHandler } = ModalsManager
export { Modal, ModalPushOneTimeOptions, ModalOneTimeOptions, ModalProps, ModalAnimation, BottomSheetOptions }
