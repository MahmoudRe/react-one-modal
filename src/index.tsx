import React, {
  useRef,
  useReducer,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  ReactNode,
  RefObject,
  MutableRefObject,
  ForwardedRef
} from 'react'
import { createPortal } from 'react-dom'
import styles from './style.module.css'
import { ModalAnimation, BottomSheetOptions, Modal, ModalOneTimeOptions, ModalProps } from './typings'
import { dragElement } from './bottom-sheet-drag'

export default forwardRef((props: ModalProps, ref: ForwardedRef<Modal>) => {
  const {
    className = '',
    classNameOverlay = '', // className for modal container/overlay
    attributes = {},
    size = 999, // the number of pages to preserve in the stack before start dropping out old pages
    colorOverlay, // default #00000099, also it can be set by css variable --modal-color-overlay
    colorBackground, // default 'white', also it can be set by css variable --modal-color-bg
    type = 'floating', // ['floating', 'full-page', 'bottom-sheet']
    bottomSheetOptions = {} as BottomSheetOptions,
    position = 'center', // ['top', 'center', 'bottom'], in case of floating type
    callback = (_) => {}, // callback after a control function (push/pop/show/hide... etc). The first argument is a string of the name of the function that is called. When new content is pushed, the second argument is the content itself.
    animation: animationProps = {},
    children, // if existed, add them as the first
    attributesOverlay // pass the reset to modal container/overlay
  } = props

  let {
    type: animationType = props.type == 'full-page'
      ? 'slide'
      : props.type == 'bottom-sheet' || props.position == 'bottom'
      ? 'slide-bottom'
      : 'zoom-in' // choose from [ false | 'slide' | 'slide-bottom' | 'zoom-in' ]
  } = animationProps

  const modalOverlayRef = useRef<HTMLDivElement>(null)
  const [, forceUpdate] = useReducer((x) => x + 1, 0)
  const modalsArr = useRef<ReactNode[]>([]) // useRef instead of useState to have up-to-date value for pages array, and push new pages to the existed array directly
  const [isHidden, setHidden] = useState(false)
  const animation: MutableRefObject<ModalAnimation> = useRef({
    get type() {
      return animationType
    },
    set type(type: ModalAnimation['type']) {
      animationType = type ? type : false // current value

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
      modalOverlayRef.current?.setAttribute('data-animation-pause', '')
      timeout && setTimeout(animation.current.resume, timeout)
    },
    resume: () => {
      modalOverlayRef.current?.removeAttribute('data-animation-pause')
    }
  })

  function push(content: ReactNode, options: ModalOneTimeOptions = {}) {
    const { popLast = false, animation: animationType = animation.current.type } = options

    // pause if the animation is already active, but options.animation is false for this instance
    if (!animationType && !!animation.current.type) animation.current.pause(250)

    modalsArr.current.push(
      <div
        key={Math.random()} // since the key is set only on push, random value should be fine
        className={styles.modal + ' ' + className}
        ref={(el) => {
          if (el && type === 'bottom-sheet' && bottomSheetOptions.drag) dragElement(el, bottomSheetOptions, pop)
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

  function pop(options: ModalOneTimeOptions = {}) {
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
    }, 500)

    // if last modal, animate overlay hiding
    if (modalsArr.current.length <= 1) {
      modal && modalOverlayRef.current?.classList.add(styles['--out-transition'])
      setTimeout(() => {
        modal && modalOverlayRef.current?.classList.remove(styles['--out-transition'])
      }, 250)
    }
  }

  function empty(options: ModalOneTimeOptions = {}) {
    const { animation: animationType = animation.current.type } = options

    if (!animationType) {
      modalsArr.current.splice(0, modalsArr.current.length) // empty array while keeping reference
      if (animation.current.type) animation.current.pause(250) // pause if animation is already active
      forceUpdate()
      callback('empty', options)
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
      callback('empty', options)
    }, 250)
  }

  function hide(options: ModalOneTimeOptions = {}) {
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

  function show(content: ReactNode, options: ModalOneTimeOptions = {}) {
    if (content) push(content, options)

    setHidden(false)
  }

  useImperativeHandle(ref, () => ({
    push,
    pop,
    empty,
    hide,
    show,
    animation: animation.current
  }))

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
        background: modalsArr.current.length > 1 && !(type == 'floating') ? 'var(--modal-color-bg)' : undefined
      }}
      {...attributesOverlay}
    >
      {modalsArr.current}
    </div>,
    document.body
  )
})

class ModalState {
  static modalRefs: {
    [key: string]: RefObject<Modal>
  } = {}

  static getModal = (key: string = 'default'): Modal => ({
    push: (content, options) => ModalState.modalRefs[key]?.current?.push(content, options),
    pop: (options) => ModalState.modalRefs[key]?.current?.pop(options),
    empty: (options) => ModalState.modalRefs[key]?.current?.empty(options),
    transit: (content, options) =>
      ModalState.modalRefs[key]?.current?.push(content, {
        popLast: true,
        ...options
      }),
    hide: (options) => ModalState.modalRefs[key]?.current?.hide(options),
    show: (content, options) => ModalState.modalRefs[key]?.current?.show(content, options),
    animation: {
      get type() {
        return ModalState.modalRefs[key]?.current?.animation.type ?? false
      },
      set type(type: ModalAnimation['type']) {
        if (ModalState.modalRefs[key]?.current) ModalState.modalRefs[key]!.current!.animation.type = type
      },
      pause: (timeout?: number) => ModalState.modalRefs[key]?.current?.animation.pause(timeout),
      resume: () => ModalState.modalRefs[key]?.current?.animation.resume()
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
   * @returns modal object with { push, pop, empty, hide, show } functions
   */
  static useModal = (key: string = 'default'): [Modal, RefObject<Modal> | undefined] => {
    if (!ModalState.modalRefs[key]) ModalState.modalRefs[key] = useRef<Modal>(null)

    return [ModalState.getModal(key), ModalState.modalRefs[key]]

    // We could here simply do `return this.modalRefs[key]?.current` and then all functionalities will be exposed.
    // However, at the start, ref is null and `this.modalRefs[key]?.current` is resolved to undefined.
    // Hence, when ref value is changed to an HTMLElement after the first render, there is no way .
    // That is way useRef() hook returns {current: VALUE} object such that "ref.current" refers to a mutable VALUE.
    // By using function closure, `this.modalRefs[key]?.current` is resolved when each of these function is called.
  }
}

export const { useModal, getModal } = ModalState
export { Modal, ModalOneTimeOptions, ModalProps, ModalAnimation, BottomSheetOptions }
