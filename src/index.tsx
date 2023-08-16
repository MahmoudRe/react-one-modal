import React, {
  useRef,
  useReducer,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  PropsWithChildren,
  ReactNode,
  RefObject,
  MutableRefObject
} from 'react'
import { createPortal } from 'react-dom'
import styles from './style.module.css'

interface DragOptions {
  drag: boolean
  positions: number[]
  startPosition: number
  swipeThreshold: number
  dynamicHeight: number
  headerSelector: string
}

function dragElement(el: HTMLElement, options: DragOptions) {
  let yDiff = 0,
    yPrev = 0,
    scrollEnd = true

  let {
    positions = [700, 400, 100],
    startPosition: currPosition = positions[0],
    swipeThreshold = 10,
    dynamicHeight,
    headerSelector
  } = options

  //set position of initial open
  if (dynamicHeight) el.style.height = 'calc(100% - ' + positions[0] + 'px)'
  else el.style.height = 'calc(100% - ' + positions[positions.length - 1] + 'px)'

  el.style.top = 'calc(' + currPosition + 'px)'

  // set up event listener for the start of the drag
  let headerElement = document.querySelector<HTMLElement>(headerSelector)
  if (headerElement) {
    headerElement.onmousedown = dragStart
    headerElement.ontouchstart = dragStart
  } else {
    el.onmousedown = dragStart
    el.ontouchstart = dragStart
  }

  function isScrollEnd(element: HTMLElement | null): boolean {
    if (element === el || element?.parentElement === el) return element?.scrollTop === 0

    if (element?.scrollTop === 0) return isScrollEnd(element?.parentElement)

    return false
  }

  function dragStart(event: MouseEvent | TouchEvent) {
    let ev = { clientY: 0, touches: [{ clientY: 0 }], ...event }

    scrollEnd = isScrollEnd(ev.target as HTMLElement)

    // get the mouse cursor position at startup:
    yPrev = ev.clientY || ev.touches[0].clientY
    document.onmouseup = dragClose
    document.ontouchend = dragClose

    // call a function whenever the cursor moves:
    document.onmousemove = dragMove
    document.addEventListener('touchmove', dragMove, { passive: false })

    el.style.transition = 'none'
  }

  function dragMove(event: MouseEvent | TouchEvent) {
    let ev = { clientY: 0, touches: [{ clientY: 0 }], ...event }

    // calculate the new cursor position:
    yDiff = yPrev - (ev.clientY || ev.touches[0].clientY)
    yPrev = ev.clientY || ev.touches[0].clientY

    // set the element's new position
    if (el.offsetTop - yDiff > positions[positions.length - 1] && scrollEnd) {
      // prevent scrolling if we didn't react the top nor nested elements is scrolled
      event.preventDefault()

      // delay height change according to scroll direction to prevent flickering at bottom of sheet
      if (yDiff > 0) {
        // scroll up: decrease height later
        el.style.top = el.offsetTop - yDiff + 'px'
        if (dynamicHeight)
          el.style.height = 'calc(100% - ' + (el.offsetTop - yDiff) + 'px)'
      } else {
        // scroll down: increase the height first
        if (dynamicHeight)
          el.style.height = 'calc(100% - ' + (el.offsetTop - yDiff) + 'px)'
        el.style.top = el.offsetTop - yDiff + 'px'
      }
    } else {
      // enable scroll + prevent drag down after reaching top
      scrollEnd = false
    }
  }

  function dragClose() {
    // stop moving when mouse button is released:
    document.onmouseup = null
    document.ontouchend = null
    document.onmousemove = null
    document.removeEventListener('touchmove', dragMove as EventListener, false)
    el.style.transition = 'all .25s cubic-bezier(0, 0.3, 0.15, 1)'

    let nextPosition = currPosition

    // swipe up
    if (yDiff > swipeThreshold && scrollEnd) {
      nextPosition =
        positions[Math.min(positions.length - 1, positions.indexOf(currPosition) + 1)]
    }
    // swipe down
    else if (yDiff < -1 * swipeThreshold && scrollEnd) {
      nextPosition = positions[Math.max(0, positions.indexOf(currPosition) - 1)]
    }
    // drag up/down
    else {
      let currTop = parseInt(el.style.top)
      nextPosition = positions.reduce(
        (acc, pos) => (Math.abs(acc - currTop) < Math.abs(pos - currTop) ? acc : pos),
        currPosition
      )
    }

    if (dynamicHeight && parseInt(el.style.top) < nextPosition)
      el.style.transition += ', height .25s cubic-bezier(0, 0.3, 0.15, 1) .1s'

    currPosition = nextPosition
    el.style.top = nextPosition + 'px'

    if (dynamicHeight) el.style.height = 'calc(100% - ' + nextPosition + 'px)'
  }
}

interface ModalProps {
  className?: string
  classNameOverlay?: string
  attributes?: {}
  size?: number
  colorOverlay?: string // default #00000099, also it can be set by css variable --modal-color-overlay
  colorBackground?: string // default 'white', also it can be set by css variable --modal-color-bg
  type: 'floating' | 'full-page' | 'bottom-sheet'
  bottomSheetOptions?: DragOptions
  position?: 'top' | 'center' | 'bottom'
  callback?: (name: string, option?: ControlFunctionOption, content?: ReactNode) => void
  animation: false | 'slide' | 'slide-bottom' | 'zoom-in'
  children?: ReactNode
  attributesOverlay: PropsWithChildren
}

interface ControlFunctionCollection {
  push: (content: ReactNode, options?: ControlFunctionOption) => void
  pop: (options?: ControlFunctionOption) => void
  close: (options?: ControlFunctionOption) => void
  hide: (options?: ControlFunctionOption) => void
  show: (content: ReactNode, options?: ControlFunctionOption) => void
  animation: MutableRefObject<{
    type: string
    setType: (type: string) => void
    pause: (timeout: number) => void
    resume: () => void
  }>
}

interface ControlFunctionOption {
  animation?: ModalProps['animation']
  popLast?: boolean
}

export default forwardRef((props: ModalProps, ref) => {
  let {
    className = '',
    classNameOverlay = '', // className for modal container/overlay
    attributes = {},
    size = 999, // the number of pages to preserve in the stack before start dropping out old pages
    colorOverlay, // default #00000099, also it can be set by css variable --modal-color-overlay
    colorBackground, // default 'white', also it can be set by css variable --modal-color-bg
    type = 'floating', // ['floating', 'full-page', 'bottom-sheet']
    bottomSheetOptions = {} as DragOptions,
    position = 'center', // ['top', 'center', 'bottom'], in case of floating type
    callback = (_) => {}, // callback after a control function (push/pop/show/hide... etc). The first argument is a string of the name of the function that is called. When new content is pushed, the second argument is the content itself.
    animation: animationType = props.type == 'full-page'
      ? 'slide'
      : props.type == 'bottom-sheet' || props.position == 'bottom'
      ? 'slide-bottom'
      : 'zoom-in', // choose from [ false | 'slide' | 'slide-bottom' | 'zoom-in' ]
    children, // if existed, add them as the first
    attributesOverlay // pass the reset to modal container/overlay
  } = props

  const modalOverlayRef = useRef<HTMLDivElement>(null)
  const [, forceUpdate] = useReducer((x) => x + 1, 0)
  const modalsArr = useRef<ReactNode[]>([]) // useRef instead of useState to have up-to-date value for pages array, and push new pages to the existed array directly
  const [isHidden, setHidden] = useState(false)
  const animation = useRef({
    type: animationType,
    setType: (type: ModalProps['animation']) => {
      // Internal state
      animationType = animation.current.type // preserve the old value to use when resume
      animation.current.type = type // current value

      // HTML element state
      if (type && modalOverlayRef.current) {
        modalOverlayRef.current.dataset.animation = type
        modalOverlayRef.current.removeAttribute('data-animation-pause')
      } else if (modalOverlayRef.current) {
        modalOverlayRef.current.setAttribute('data-animation-pause', '')
      }
    },
    pause: (timeout?: number) => {
      // if timeout is not passed, pause indefinitely
      animation.current.type = false
      modalOverlayRef.current?.setAttribute('data-animation-pause', '')
      timeout && setTimeout(animation.current.resume, timeout)
    },
    resume: () => {
      animation.current.type = animationType
      modalOverlayRef.current?.removeAttribute('data-animation-pause')
    }
  })

  const push: ControlFunctionCollection['push'] = (content, options = {}) => {
    const { popLast = false, animation: animationType = animation.current.type } = options

    // pause if the animation is already active, but options.animation is false for this instance
    if (!animationType && !!animation.current.type) animation.current.pause(250)

    modalsArr.current.push(
      <div
        key={Math.random()} // since the key is set only on push, random value should be fine
        className={styles.modal + ' ' + className}
        ref={(ref) => {
          if (ref && type === 'bottom-sheet' && bottomSheetOptions.drag)
            dragElement(ref, bottomSheetOptions)
        }}
        {...attributes}
      >
        {content}
      </div>
    )
    forceUpdate()
    callback('push', options, content)

    if (modalsArr.current.length > size)
      if (animationType)
        setTimeout(() => {
          modalsArr.current.shift()
          forceUpdate()
        }, 250)
      else {
        modalsArr.current.shift()
        forceUpdate()
      }

    if (popLast && modalsArr.current.length > 1)
      if (animationType)
        setTimeout(() => {
          modalsArr.current.splice(modalsArr.current.length - 2, 1) // remove before last
          forceUpdate()
        }, 250)
      else {
        modalsArr.current.splice(modalsArr.current.length - 2, 1) // remove before last
        forceUpdate()
      }
  }

  const pop: ControlFunctionCollection['pop'] = (options = {}) => {
    const { animation: animationType = animation.current.type } = options

    if (!modalsArr.current.length) return //no pages existed, skip this action

    if (!animationType) {
      modalsArr.current.pop()
      if (animation.current.type) animation.current.pause(250) // pause if animation is already active
      forceUpdate()
      callback('pop', options)
      return
    }

    /* transition */
    const len = modalOverlayRef.current?.children?.length
    // select the modal before last one (or last in case of one modal)
    const modal = modalOverlayRef.current?.children[len && len > 1 ? len - 2 : 0]
    modal?.classList.add(styles['--back-transition'])
    setTimeout(() => {
      modal?.classList.remove(styles['--back-transition'])
      modalsArr.current.pop()
      forceUpdate()
      callback('pop', options)
    }, 250)

    // if last modal, animate overlay hiding
    if (modalsArr.current.length <= 1) {
      modal && modalOverlayRef.current?.classList.add(styles['--out-transition'])
      setTimeout(() => {
        modal && modalOverlayRef.current?.classList.remove(styles['--out-transition'])
      }, 250)
    }
  }

  const close: ControlFunctionCollection['close'] = (options = {}) => {
    const { animation: animationType = animation.current.type } = options

    if (!animationType) {
      modalsArr.current.splice(0, modalsArr.current.length) // empty array while keeping reference
      if (animation.current.type) animation.current.pause(250) // pause if animation is already active
      forceUpdate()
      callback('close', options)
      return
    }

    /* transition */
    const modal = modalOverlayRef.current?.lastChild as HTMLElement
    modal?.classList.add(styles['--back-transition'])
    modal && modalOverlayRef.current?.classList.add(styles['--out-transition'])
    setTimeout(() => {
      modal?.classList.remove(styles['--back-transition'])
      modal && modalOverlayRef.current?.classList.remove(styles['--out-transition'])
      modalsArr.current.splice(0, modalsArr.current.length)
      forceUpdate()
      callback('close', options)
    }, 250)
  }

  const hide: ControlFunctionCollection['hide'] = (
    options: ControlFunctionOption = {}
  ) => {
    const { animation: animationType = animation.current.type } = options

    if (!animationType) {
      if (animation.current.type) animation.current.pause(250) // pause if animation is already active
      setHidden(true)
      callback('hide', options)
      return
    }

    /* transition */
    const modal = modalOverlayRef.current?.lastChild as HTMLElement
    modal?.classList.add(styles['--back-transition'])
    modal && modalOverlayRef.current?.classList.add(styles['--out-transition'])
    setTimeout(() => {
      modal?.classList.remove(styles['--back-transition'])
      modal && modalOverlayRef.current?.classList.remove(styles['--out-transition'])
      setHidden(true)
      callback('hide', options)
    }, 250)
  }


  const show: ControlFunctionCollection['show'] = (content, options = {}) => {
    if (content) push(content, options)

    setHidden(false)
  }

  useImperativeHandle(ref, () => ({ push, pop, close, hide, show, animation }))

  useEffect(() => {
    if (children) push(children)
  }, [])

  return createPortal(
    <div
      className={styles.overlay + ' ' + classNameOverlay}
      data-animation={animationType}
      data-modal-type={type}
      data-modal-position={position}
      ref={modalOverlayRef}
      style={{
        display: !modalsArr.current.length || isHidden ? 'none' : undefined,
        ['--modal-color-overlay' as any]: colorOverlay || undefined,
        ['--modal-color-bg' as any]: colorBackground || undefined,
        background:
          modalsArr.current.length > 1 && !(type == 'floating')
            ? 'var(--modal-color-bg)'
            : undefined
      }}
      {...attributesOverlay}
    >
      {modalsArr.current}
    </div>,
    document.body
  )
})

class ModalState {
  modalRefs: {
    [key: string]: RefObject<HTMLDivElement & ControlFunctionCollection> | undefined
  } = {}

  getModal = (key: string = 'default') => ({
    push: (content: ReactNode, options: ControlFunctionOption) =>
      this.modalRefs[key]?.current?.push(content, options),
    pop: (options: ControlFunctionOption) => this.modalRefs[key]?.current?.pop(options),
    close: (options: ControlFunctionOption) =>
      this.modalRefs[key]?.current?.close(options),
    transit: (content: ReactNode, options: ControlFunctionOption) =>
      this.modalRefs[key]?.current?.push(content, {
        popLast: true,
        ...options
      }),
    hide: (options: ControlFunctionOption) => this.modalRefs[key]?.current?.hide(options),
    show: (content: ReactNode, options: ControlFunctionOption) =>
      this.modalRefs[key]?.current?.show(content, options),
    animation: {
      getType: () => this.modalRefs[key]?.current?.animation.current.type,
      setType: (type: string) =>
        {this.modalRefs[key]?.current?.animation.current.setType(type)},
      pause: (timeout: number) =>
        this.modalRefs[key]?.current?.animation.current.pause(timeout),
      resume: () => this.modalRefs[key]?.current?.animation.current.resume()
    }
  })

  /**
   * Get the functions of an already bound modal instance, given its key.
   * If a key isn't passed, its value would be 'default'.
   *
   * Although the HTMLElement of the modal is located at the bottom of the <body> tag,
   * it inherits the context from the component in which it's declared.
   *
   * @param {string} [key]
   * @returns modal object with { push, pop, close, hide, show } functions
   */
  useModal = (key: string = 'default') => {
    if (!this.modalRefs[key]) this.modalRefs[key] = useRef(null)

    return [this.getModal(key), this.modalRefs[key]]

    // We could here simply do `return this.modalRefs[key]?.current` and then all functionalities will be exposed.
    // However, at the start, ref is null and `this.modalRefs[key]?.current` is resolved to undefined.
    // Hence, when ref value is changed to an HTMLElement after the first render, there is no way .
    // That is way useRef() hook returns {current: VALUE} object such that "ref.current" refers to a mutable VALUE.
    // By using function closure, `this.modalRefs[key]?.current` is resolved when each of these function is called.
  }
}

const modalState = new ModalState()

export const { useModal, getModal } = modalState
