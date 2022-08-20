import React, {
  useRef,
  useReducer,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle
} from 'react'
import { createPortal } from 'react-dom'
import styles from './modal.css'

function dragElement(elmnt, options = {}) {
  let yInit = 0,
    yDiff = 0,
    yPrev = 0,
    scrollEnd = true

  let {
    positions = [700, 400, 100],
    startPosition: currPosition = positions[0],
    swipeThreshold = 10
  } = options

  //set position of initial open
  elmnt.style.height = 'calc(100% - ' + currPosition + 'px)'
  elmnt.style.top = 'calc(' + currPosition + 'px)'

  if (document.getElementById(elmnt.id + 'header')) {
    // if present, the header is where you move the DIV from:
    document.getElementById(elmnt.id + 'header').onmousedown = dragStart
    document.getElementById(elmnt.id + 'header').ontouchstart = dragStart
  } else {
    // otherwise, move the DIV from anywhere inside the DIV:
    elmnt.onmousedown = dragStart
    elmnt.ontouchstart = dragStart
  }

  function isScrollEnd(element) {
    if (element === elmnt || element?.parentElement === elmnt)
      return element?.scrollTop === 0

    if (element?.scrollTop === 0) return isScrollEnd(element?.parentElement)

    return false
  }

  function dragStart(e) {
    e = e || window.event
    
    scrollEnd = isScrollEnd(e.target)

    // get the mouse cursor position at startup:
    yPrev = yInit = e.clientY || e.touches[0].clientY
    document.onmouseup = dragClose
    document.ontouchend = dragClose

    // call a function whenever the cursor moves:
    document.onmousemove = dragMove
    document.addEventListener('touchmove', dragMove, { passive: false })

    elmnt.style.transition = 'none'
  }

  function dragMove(e) {
    e = e || window.event

    // calculate the new cursor position:
    yDiff = yPrev - (e.clientY || e.touches[0].clientY)
    yPrev = e.clientY || e.touches[0].clientY

    // set the element's new position:
    if (elmnt.offsetTop - yDiff > positions[positions.length - 1] && scrollEnd) {
      e.preventDefault()
      elmnt.style.top = elmnt.offsetTop - yDiff + 'px'
      elmnt.style.height = 'calc(100% - ' + (elmnt.offsetTop - yDiff) + 'px)'
    } else {
      scrollEnd = false
    }
  }

  function dragClose(e) {
    e = e || window.event

    // stop moving when mouse button is released:
    document.onmouseup = null
    document.ontouchend = null
    document.onmousemove = null
    document.removeEventListener('touchmove', dragMove, { passive: false })
    elmnt.style.transition = 'all 0.25s cubic-bezier(0, 0.3, 0.15, 1)'

    let nextPosition = currPosition

    // swipe up
    if (yDiff > swipeThreshold && scrollEnd) {
      console.log('swipe up')
      elmnt.style.transition += ', height 0.15s cubic-bezier(0, 0.3, 0.15, 1)'
      nextPosition =
        positions[Math.min(positions.length - 1, positions.indexOf(currPosition) + 1)]
    }
    // swipe down
    else if (yDiff < -1 * swipeThreshold && scrollEnd) {
      console.log('swipe down')
      elmnt.style.transition += ', height 0.35s cubic-bezier(0, 0.3, 0.15, 1)'
      nextPosition = positions[Math.max(0, positions.indexOf(currPosition) - 1)]
    }
    // drag up/down
    else {
      console.log('drag ' + yDiff)
      let currTop = parseInt(elmnt.style.top)
      nextPosition = positions.reduce(
        (acc, pos) => (Math.abs(acc - currTop) < Math.abs(pos - currTop) ? acc : pos),
        currPosition
      )
    }

    currPosition = nextPosition
    elmnt.style.height = 'calc(100% - ' + nextPosition + 'px)'
    elmnt.style.top = nextPosition + 'px'
  }
}

export default forwardRef((props, ref) => {
  let {
    className = '',
    classNameOverlay = '', // className for modal container/overlay
    attributes = {},
    size = 999, // the number of pages to preserve in the stack before start dropping out old pages
    colorOverlay, // default #00000099, also it can be set by css variable --modal-color-overlay
    colorBackground, // default 'white', also it can be set by css variable --modal-color-bg
    type = 'floating', // ['floating', 'full-page', 'bottom-sheet']
    position = 'center', // ['top', 'center', 'bottom'], in case of floating type
    callback = () => {}, // callback after a control function (push/pop/show/hide... etc). The first argument is a string of the name of the function that is called. When new content is pushed, the second argument is the content itself.
    animation: animationType = props.type == 'full-page'
      ? 'slide'
      : props.type == 'bottom-sheet' || props.position == 'bottom'
      ? 'slide-bottom'
      : 'zoom-in', // choose from [ false | 'slide' | 'slide-bottom' | 'zoom-in' ]
    children, // if existed, add them as the first
    ...attributesOverlay // pass the reset to modal container/overlay
  } = props

  const modalOverlayRef = useRef(null)
  const [, forceUpdate] = useReducer((x) => x + 1, 0)
  const modalsArr = useRef([]) // useRef instead of useState to have up-to-date value for pages array, and push new pages to the existed array directly
  const [isHidden, setHidden] = useState(false)
  const animation = useRef({
    type: animationType,
    setType: (type) => {
      // Internal state
      animationType = animation.current.type // preserve the old value to use when resume
      animation.current.type = type // current value

      // HTML element state
      if (type) {
        modalOverlayRef.current.dataset.animation = type
        modalOverlayRef.current.removeAttribute('data-animation-pause')
      } else {
        modalOverlayRef.current.setAttribute('data-animation-pause', '')
      }
    },
    pause: (timeout) => {
      // if timeout is not passed, pause indefinitely
      animation.current.type = false
      modalOverlayRef.current.setAttribute('data-animation-pause', '')
      timeout && setTimeout(animation.current.resume, timeout)
    },
    resume: () => {
      animation.current.type = animationType
      modalOverlayRef.current.removeAttribute('data-animation-pause')
    }
  })

  const push = (content, options = {}) => {
    const { popLast = false, animation: animationType = animation.current.type } = options

    // pause if the animation is already active, but options.animation is false for this instance
    if (!animationType && !!animation.current.type) animation.current.pause(250)

    modalsArr.current.push(
      <div
        key={Math.random()} // since the key is set only on push, random value should be fine
        className={styles.modal + ' ' + className}
        ref={(ref) => {
          if (ref) dragElement(ref)
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

  const pop = (options = {}) => {
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
    const len = modalOverlayRef.current.children?.length
    // select the modal before last one (or last in case of one modal)
    const modal = modalOverlayRef.current.children[len > 1 ? len - 2 : 0]
    modal.classList.add(styles['--back-transition'])
    setTimeout(() => {
      modal.classList.remove(styles['--back-transition'])
      modalsArr.current.pop()
      forceUpdate()
      callback('pop', options)
    }, 250)

    // if last modal, animate overlay hiding
    if (modalsArr.current.length <= 1) {
      modal && modalOverlayRef.current.classList.add(styles['--out-transition'])
      setTimeout(() => {
        modal && modalOverlayRef.current.classList.remove(styles['--out-transition'])
      }, 250)
    }
  }

  const close = (options = {}) => {
    const { animation: animationType = animation.current.type } = options

    if (!animationType) {
      modalsArr.current.splice(0, modalsArr.current.length) // empty array while keeping reference
      if (animation.current.type) animation.current.pause(250) // pause if animation is already active
      forceUpdate()
      callback('close', options)
      return
    }

    /* transition */
    const modal = modalOverlayRef.current.lastChild
    modal?.classList.add(styles['--back-transition'])
    modal && modalOverlayRef.current.classList.add(styles['--out-transition'])
    setTimeout(() => {
      modal?.classList.remove(styles['--back-transition'])
      modal && modalOverlayRef.current.classList.remove(styles['--out-transition'])
      modalsArr.current.splice(0, modalsArr.current.length)
      forceUpdate()
      callback('close', options)
    }, 250)
  }

  const hide = (options = {}) => {
    const { animation: animationType = animation.current.type } = options

    if (!animationType) {
      if (animation.current.type) animation.current.pause(250) // pause if animation is already active
      setHidden(true)
      callback('hide', options)
      return
    }

    /* transition */
    const modal = modalOverlayRef.current.lastChild
    modal?.classList.add(styles['--back-transition'])
    modal && modalOverlayRef.current.classList.add(styles['--out-transition'])
    setTimeout(() => {
      modal?.classList.remove(styles['--back-transition'])
      modal && modalOverlayRef.current.classList.remove(styles['--out-transition'])
      setHidden(true)
      callback('hide', options)
    }, 250)
  }

  /**
   * @param {*} arg0 either React Component to show, ie. push into the stack or options object
   * @param {*} options if arg0 was a React Component then this parameter is options object, otherwise ignore
   */
  const show = (arg0, options = {}) => {
    let { animation: animationType = animation.current.type } = options

    // the case arg0 is option and only need to show the hidden pages
    if (arg0 && arg0.animation) {
      animationType = arg0.animation

      // pause if the animation is already active, but options.animation is false for this instance
      if (!animationType && !!animation.current.type) animation.current.pause(250)

      callback('show', options)
    }

    // the case where arg0 is React Component, then push it into stack and pass option object
    if (arg0 && !arg0.animation) push(arg0, options)

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
        '--modal-color-overlay': colorOverlay || undefined,
        '--modal-color-bg': colorBackground || undefined,
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
  modalRefs = {}

  /**
   * Get the functions of an already bound modal instance, given its key.
   * If a key isn't passed, its value would be 'default'.
   *
   * @param {string} [key]
   * @returns modal object with { push, pop, close, hide, show } functions
   */
  useModal = (key = 'default') => {
    return {
      push: (content, options) => this.modalRefs[key]?.current?.push(content, options),
      pop: (options) => this.modalRefs[key]?.current?.pop(options),
      close: (options) => this.modalRefs[key]?.current?.close(options),
      transit: (content, options) =>
        this.modalRefs[key]?.current?.push(content, {
          popLast: true,
          ...options
        }),
      hide: (options) => this.modalRefs[key]?.current?.hide(options),
      show: (content, options) => this.modalRefs[key]?.current?.show(content, options),
      animation: {
        getType: () => this.modalRefs[key]?.current?.animation.current.type,
        setType: (type) => this.modalRefs[key]?.current?.animation.current.setType(type),
        pause: (timeout) =>
          this.modalRefs[key]?.current?.animation.current.pause(timeout),
        resume: () => this.modalRefs[key]?.current?.animation.current.resume()
      }
    }

    // We could here simply do `return this.modalRefs[key]?.current` and then all functionalities will be exposed.
    // However, at the start, ref is null and `this.modalRefs[key]?.current` is resolved to undefined.
    // Hence, when ref value is changed to an HTMLElement after the first render, there is no way .
    // That is way useRef() hook returns {current: VALUE} object such that "ref.current" refers to a mutable VALUE.
    // By using function closure, `this.modalRefs[key]?.current` is resolved when each of these function is called.
  }

  /**
   * Bind a Modal instance given its ref, with a given key.
   * If a key isn't passed, its value would be 'default'.
   *
   * Although the HTMLElement of the modal is located at the bottom of the <body> tag,
   * it inherits the context from the component in which it's declared.
   *
   * @param {React.MutableRefObject<HTMLElement>} ref react ref object for Modal instance.
   * @param {string} key
   * @returns modal object with { push, pop, close, transit, hide, show } functions
   */
  bindModal = (ref, key = 'default') => {
    this.modalRefs[key] = ref
    return this.useModal(key)
  }
}

const modalState = new ModalState()

export const { useModal, bindModal, getModal = useModal } = modalState
