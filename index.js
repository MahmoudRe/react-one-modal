import {
  useRef,
  useReducer,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { createPortal } from 'react-dom';
import './index.css';

const AdvanceModal = forwardRef((props, ref) => {
  const {
    className = '', //className for modal container
    pageClassName = '',
    pageAttributes = {},
    size = 999, // the number of pages to preserve in the stack before start dropping out old pages
    overlayColor, //default #00000099, also it can be set by css variable --modal-color-overlay
    backgroundColor, //default 'white', also it can be set by css variable --modal-color-bg
    floating,
    bottom,
    animation: animationType = props.bottom
      ? 'slide-bottom'
      : props.floating
      ? 'zoom-in'
      : 'slide', // choose from [ false | 'slide' | 'slide-bottom' | 'zoom-in' ]
    children, //if existed, add them as the first page
    ...attributes //pass the reset to modal container
  } = props;
  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  const pagesArr = useRef([]); //useRef instead of useState to have up-to-date value for pages array, and push new pages to the existed array directly
  const [isHidden, setHidden] = useState(false);
  const animation = useRef({
    type: animationType,
    setType: (type) => {
      animation.current.type = type;
    },
    pause: (timeout) => {
      //if timeout is not passed, pause indefinitely
      advanceModal.current?.classList.add('--no-animation');
      timeout && setTimeout(animation.current.resume, timeout);
    },
    resume: () => advanceModal.current?.classList.remove('--no-animation'),
  });

  const advanceModal = useRef(null);

  const push = (content, options = {}) => {
    const {
      popLast = false,
      animation: animationType = animation.current.type,
    } = options;

    if (!animationType) animation.current.pause(250);

    pagesArr.current.push(
      <div
        key={Math.random()} //since the key is set only on push, random value should be fine
        className={
          'advance-modal__page ' +
          `--${animationType}-animation ` +
          pageClassName
        }
        {...pageAttributes}
      >
        {content}
      </div>
    );
    forceUpdate();

    if (pagesArr.current.length > size)
      if (animationType)
        setTimeout(() => {
          pagesArr.current.shift();
          forceUpdate();
        }, 250);
      else {
        pagesArr.current.shift();
        forceUpdate();
      }

    if (popLast && pagesArr.current.length > 1)
      setTimeout(() => {
        pagesArr.current.splice(pagesArr.current.length - 2, 1); //remove before last page
        forceUpdate();
      }, 250);
  };

  const pop = (options = {}) => {
    const { animation: animationType = animation.current.type } = options;

    if (!animationType) {
      animation.current.pause(250);
      pagesArr.current.pop();
      forceUpdate();
      return;
    }

    /* transition */
    let len = advanceModal.current.children?.length;
    // select the page before last one (or last in case of one page)
    let page = advanceModal.current.children[len > 1 ? len - 2 : 0];
    page?.classList.add('--back-animation');
    setTimeout(() => {
      page?.classList.remove('--back-animation');
      pagesArr.current.pop();
      forceUpdate();
    }, 250);

    // if last page, animate overlay hiding
    if (pagesArr.current.length === 0) {
      page &&
        animationType &&
        advanceModal.current.classList.add('--out-animation');
      setTimeout(() => {
        page && advanceModal.current.classList.remove('--out-animation');
      }, 250);
    }
  };

  const close = (options = {}) => {
    const { animation: animationType = animation.current.type } = options;

    if (!animationType) {
      //empty array while keeping reference
      pagesArr.current.splice(0, pagesArr.current.length);
      animation.current.pause(250);
      forceUpdate();
      return;
    }

    /* transition */
    let page = advanceModal.current.lastChild;
    page?.classList.add('--back-animation');
    page && advanceModal.current.classList.add('--out-animation');
    setTimeout(() => {
      page?.classList.remove('--back-animation');
      page && advanceModal.current.classList.remove('--out-animation');
      pagesArr.current.splice(0, pagesArr.current.length);
      forceUpdate();
    }, 250);
  };

  const hide = (options = {}) => {
    const { animation: animationType = animation.current.type } = options;

    if (!animationType) {
      animation.current.pause(250);
      setHidden(true);
      return;
    }

    /* transition */
    let page = advanceModal.current.lastChild;
    page?.classList.add('--back-animation');
    page && advanceModal.current.classList.add('--out-animation');
    setTimeout(() => {
      page?.classList.remove('--back-animation');
      page && advanceModal.current.classList.remove('--out-animation');
      setHidden(true);
    }, 250);
  };

  const show = (arg0, options = {}) => {
    let { animation: animationType = animation.current.type } = options;

    if (arg0 && arg0.animation)
      //then arg0 is options
      animationType = arg0.animation;

    if (!animationType) {
      animation.current.pause(250);
    }

    setHidden(false);
    if (arg0 && !arg0.animation) return push(arg0, options);
  };

  useImperativeHandle(ref, () => ({ push, pop, close, hide, show, animation }));

  useEffect(() => {
    if (children) push(children);
  }, []);

  return createPortal(
    <div
      className={
        'advance-modal ' +
        (floating ? 'advance-modal--floating ' : '') +
        (bottom ? 'advance-modal--bottom ' : '') +
        className
      }
      ref={advanceModal}
      style={{
        display: !pagesArr.current.length || isHidden ? 'none' : undefined,
        '--modal-color-overlay': overlayColor ? overlayColor : undefined,
        '--modal-color-bg': backgroundColor ? backgroundColor : undefined,
        background:
          pagesArr.current.length > 1 && !floating
            ? 'var(--modal-color-bg)'
            : undefined,
      }}
      {...attributes}
    >
      {pagesArr.current}
    </div>,
    document.body
  );
});

export default AdvanceModal;

class ModalState {
  advanceModalRef = {};

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
          this.advanceModalRef[key]?.current?.animation.current.type,
        setType: (type) =>
          this.advanceModalRef[key]?.current?.animation.current.setType(type),
        pause: (timeout) =>
          this.advanceModalRef[key]?.current?.animation.current.pause(timeout),
        resume: () =>
          this.advanceModalRef[key]?.current?.animation.current.resume(),
      },
    };

    // We could here simply do `return this.advanceModalRef[key]?.current` and then all functionalities will be exposed.
    // However, at the start, ref is null and `this.advanceModalRef[key]?.current` is resolved to undefined.
    // Hence, when ref value is changed to an HTMLElement after the first render, there is no way .
    // That is way useRef() hook returns {current: VALUE} object such that "ref.current" refers to a mutable VALUE.
    // By using function closure, `this.advanceModalRef[key]?.current` is resolved when each of these function is called.
  };

  /**
   * Bind a AdvanceModal instance given its ref, with a given key.
   * If a key isn't passed, its value would be 'default'.
   *
   * Although the HTMLElement of the modal is located at the bottom of the <body> tag,
   * it inherits the context from the component in which it's declared.
   *
   * @param {React.MutableRefObject<HTMLElement>} ref react ref object for AdvanceModal instance.
   * @param {string} key
   * @returns modal object with { push, pop, close, hide, show } functions
   */
  bindModal = (ref, key = 'default') => {
    this.advanceModalRef[key] = ref;
    return this.useModal(key);
  };

  push = (key, content, options) =>
    this.advanceModalRef[key]?.current?.push(content, options);
  pop = (key, options) => this.advanceModalRef[key]?.current?.pop(options);
  close = (key, options) => this.advanceModalRef[key]?.current?.close(options);
  transit = (key, content, options) =>
    this.advanceModalRef[key]?.current?.push(content, {
      popLast: true,
      ...options,
    });
  hide = (key, options) => this.advanceModalRef[key]?.current?.hide(options);
  show = (key, content, options) =>
    this.advanceModalRef[key]?.current?.show(content, options);
}

const modalState = new ModalState();

export const { useModal, bindModal } = modalState;
