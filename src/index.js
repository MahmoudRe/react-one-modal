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

const Modal = forwardRef((props, ref) => {
  let {
    className = '', // className for modal container
    pageClassName = '',
    pageAttributes = {},
    size = 999, // the number of pages to preserve in the stack before start dropping out old pages
    overlayColor, // default #00000099, also it can be set by css variable --modal-color-overlay
    backgroundColor, // default 'white', also it can be set by css variable --modal-color-bg
    floating,
    bottom,
    callback = () => {}, // callback after a control function (push/pop/show/hide... etc). The first argument is a string of the name of the function that is called. When new content is pushed, the second argument is the content itself.
    animation: animationType = props.bottom
      ? 'slide-bottom'
      : props.floating
      ? 'zoom-in'
      : 'slide', // choose from [ false | 'slide' | 'slide-bottom' | 'zoom-in' ]
    children, // if existed, add them as the first page
    ...attributes // pass the reset to modal container
  } = props
  const [, forceUpdate] = useReducer((x) => x + 1, 0)
  const pagesArr = useRef([]) // useRef instead of useState to have up-to-date value for pages array, and push new pages to the existed array directly
  const [isHidden, setHidden] = useState(false)
  const animation = useRef({
    type: animationType,
    setType: (type) => {
      // Internal state
      animationType = animation.current.type // preserve the old value to use when resume
      animation.current.type = type // current value

      // HTML element state
      if (type) {
        modal.current.dataset.animation = type
        modal.current.removeAttribute('data-animation-pause')
      } else {
        modal.current.setAttribute('data-animation-pause', '')
      }
    },
    pause: (timeout) => {
      // if timeout is not passed, pause indefinitely
      animation.current.type = false
      modal.current.setAttribute('data-animation-pause', '')
      timeout && setTimeout(animation.current.resume, timeout)
    },
    resume: () => {
      animation.current.type = animationType
      modal.current.removeAttribute('data-animation-pause')
    }
  })

  const modal = useRef(null)

  const push = (content, options = {}) => {
    const {
      popLast = false,
      animation: animationType = animation.current.type
    } = options

    // pause if the animation is already active, but options.animation is false for this instance
    if (!animationType && !!animation.current.type) animation.current.pause(250)

    pagesArr.current.push(
      <div
        key={Math.random()} // since the key is set only on push, random value should be fine
        className={styles.page + ' ' + pageClassName}
        {...pageAttributes}
      >
        {content}
      </div>
    )
    forceUpdate()
    callback('push', options, content)

    if (pagesArr.current.length > size)
      if (animationType)
        setTimeout(() => {
          pagesArr.current.shift()
          forceUpdate()
        }, 250)
      else {
        pagesArr.current.shift()
        forceUpdate()
      }

    if (popLast && pagesArr.current.length > 1)
      if (animationType)
        setTimeout(() => {
          pagesArr.current.splice(pagesArr.current.length - 2, 1) // remove before last page
          forceUpdate()
        }, 250)
      else {
        pagesArr.current.splice(pagesArr.current.length - 2, 1) // remove before last page
        forceUpdate()
      }
  }

  const pop = (options = {}) => {
    const { animation: animationType = animation.current.type } = options

    if (!animationType) {
      pagesArr.current.pop()
      if (animation.current.type) animation.current.pause(250) // pause if animation is already active
      forceUpdate()
      callback('pop', options)
      return
    }

    /* transition */
    const len = modal.current.children?.length
    // select the page before last one (or last in case of one page)
    const page = modal.current.children[len > 1 ? len - 2 : 0]
    page.classList.add(styles['--back-transition'])
    setTimeout(() => {
      page.classList.remove(styles['--back-transition'])
      pagesArr.current.pop()
      forceUpdate()
      callback('pop', options)
    }, 250)

    // if last page, animate overlay hiding
    if (pagesArr.current.length <= 1) {
      page && modal.current.classList.add(styles['--out-transition'])
      setTimeout(() => {
        page &&
          modal.current.classList.remove(styles['--out-transition'])
      }, 250)
    }
  }

  const close = (options = {}) => {
    const { animation: animationType = animation.current.type } = options

    if (!animationType) {
      pagesArr.current.splice(0, pagesArr.current.length) // empty array while keeping reference
      if (animation.current.type) animation.current.pause(250) // pause if animation is already active
      forceUpdate()
      callback('close', options)
      return
    }

    /* transition */
    const page = modal.current.lastChild
    page?.classList.add(styles['--back-transition'])
    page && modal.current.classList.add(styles['--out-transition'])
    setTimeout(() => {
      page?.classList.remove(styles['--back-transition'])
      page && modal.current.classList.remove(styles['--out-transition'])
      pagesArr.current.splice(0, pagesArr.current.length)
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
    const page = modal.current.lastChild
    page?.classList.add(styles['--back-transition'])
    page && modal.current.classList.add(styles['--out-transition'])
    setTimeout(() => {
      page?.classList.remove(styles['--back-transition'])
      page && modal.current.classList.remove(styles['--out-transition'])
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
      if (!animationType && !!animation.current.type)
        animation.current.pause(250)

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
      className={styles.container + ' ' + className}
      data-animation={animationType}
      data-modal-type={
        (floating ? 'floating' : 'full') + (bottom ? ' bottom' : '')
      }
      ref={modal}
      style={{
        display: !pagesArr.current.length || isHidden ? 'none' : undefined,
        '--modal-color-overlay': overlayColor || undefined,
        '--modal-color-bg': backgroundColor || undefined,
        background:
          pagesArr.current.length > 1 && !floating
            ? 'var(--modal-color-bg)'
            : undefined
      }}
      {...attributes}
    >
      {pagesArr.current}
    </div>,
    document.body
  )
})

export default Modal

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
      push: (content, options) => this.push(key, content, options),
      pop: (options) => this.pop(key, options),
      close: (options) => this.close(key, options),
      transit: (content, options) => this.transit(key, content, options),
      hide: (options) => this.hide(key, options),
      show: (content, options) => this.show(key, content, options),
      animation: {
        getType: () =>
          this.modalRefs[key]?.current?.animation.current.type,
        setType: (type) =>
          this.modalRefs[key]?.current?.animation.current.setType(type),
        pause: (timeout) =>
          this.modalRefs[key]?.current?.animation.current.pause(timeout),
        resume: () =>
          this.modalRefs[key]?.current?.animation.current.resume()
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
   * @returns modal object with { push, pop, close, hide, show } functions
   */
  bindModal = (ref, key = 'default') => {
    this.modalRefs[key] = ref
    return this.useModal(key)
  }

  push = (key, content, options) =>
    this.modalRefs[key]?.current?.push(content, options)

  pop = (key, options) => this.modalRefs[key]?.current?.pop(options)
  close = (key, options) => this.modalRefs[key]?.current?.close(options)
  transit = (key, content, options) =>
    this.modalRefs[key]?.current?.push(content, {
      popLast: true,
      ...options
    })

  hide = (key, options) => this.modalRefs[key]?.current?.hide(options)
  show = (key, content, options) =>
    this.modalRefs[key]?.current?.show(content, options)
}

const modalState = new ModalState()

export const { useModal, bindModal } = modalState
