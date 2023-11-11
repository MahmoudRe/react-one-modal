import { useRef, RefObject } from 'react'
import { ModalAnimation, Modal } from './typings'

export default class ModalsManager {
  static modalRefs: {
    [key: string]: RefObject<Modal>
  } = {}

  static errorHandler: ((e: Error) => any) | null = null // to suppress all errors in production
  static _promiseChain: Promise<any> = Promise.resolve() // chain concurrent call of control function

  // TO DO: handle errors as one error in the chain will stop rest of the chain
  static _putInQueue = (taskFn: () => Promise<any>) => {
    ModalsManager._promiseChain = ModalsManager._promiseChain
      .then(async () => {
        await new Promise((resolve) => setTimeout(() => resolve(null), 10)) // keep 10ms gap between tasks to allow useEffect to run on next render and properly finalis transition
        return taskFn()
      })
      .catch((err: Error) => {
        return err // this.promiseChain shouldn't stop, error will be re-thrown only in the returned instance
      })

    return ModalsManager._promiseChain.then((e) => {
      if (e instanceof Error) {
        if (typeof ModalsManager.errorHandler === 'function') ModalsManager.errorHandler(e)
        else {
          console.warn('One Modal Error: ' + e.message)
          throw e
        }
      } else return e
    })
  }

  static setModalErrorHandler = (errorHandler: ((e: Error) => any) | null) => {
    ModalsManager.errorHandler = errorHandler
  }

  /**
   * Promisify modalRef retrieval from modalRefs object, and reject promise on fail.
   *
   * @param {string} keyOrRef
   * @returns {Modal} modalRef if existed, otherwise throw error
   */
  static _getModal = (keyOrRef: string | RefObject<Modal>): Modal => {
    const modalRef = typeof keyOrRef === 'string' ? ModalsManager.modalRefs[keyOrRef]?.current : keyOrRef.current
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
    if (typeof keyOrRef === 'string' && !ModalsManager.modalRefs[keyOrRef])
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
      push: (...args) => ModalsManager._putInQueue(() => ModalsManager._getModal(keyOrRef).push(...args)),
      pop: (...args) => ModalsManager._putInQueue(() => ModalsManager._getModal(keyOrRef).pop(...args)),
      empty: (...args) => ModalsManager._putInQueue(() => ModalsManager._getModal(keyOrRef).empty(...args)),
      transit: (...args) => ModalsManager._putInQueue(() => ModalsManager._getModal(keyOrRef).transit(...args)),
      next: (...args) => ModalsManager._putInQueue(() => ModalsManager._getModal(keyOrRef).next(...args)),
      back: (...args) => ModalsManager._putInQueue(() => ModalsManager._getModal(keyOrRef).back(...args)),
      hide: (...args) => ModalsManager._putInQueue(() => ModalsManager._getModal(keyOrRef).hide(...args)),
      show: (...args) => ModalsManager._putInQueue(() => ModalsManager._getModal(keyOrRef).show(...args)),
      animation: {
        get disable() {
          return ModalsManager._getModal(keyOrRef).animation.disable
        },
        set disable(bool: ModalAnimation['disable']) {
          ModalsManager._getModal(keyOrRef).animation.disable = bool
        },
        get type() {
          return ModalsManager._getModal(keyOrRef).animation.type ?? 'slide'
        },
        set type(type: ModalAnimation['type']) {
          ModalsManager._getModal(keyOrRef).animation.type = type
        },
        pause: (...args) => ModalsManager._getModal(keyOrRef).animation.pause(...args),
        resume: (...args) => ModalsManager._getModal(keyOrRef).animation.resume(...args)
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
    if (!ModalsManager.modalRefs[key]) ModalsManager.modalRefs[key] = newModalRef

    return [ModalsManager.getModal(key), ModalsManager.modalRefs[key]]
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
    return [ModalsManager.getModal(newModalRef), newModalRef]
  }
}
