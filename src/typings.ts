import { ReactNode, PropsWithChildren } from 'react'

export interface BottomSheetOptions {
  drag: boolean
  positions: number[]
  startPosition: number
  closePosition: number
  swipeThreshold: number
  dynamicHeight: number
  closeByDragDown: boolean
  headerSelector: string
}

export interface ModalProps {
  className?: string
  classNameOverlay?: string
  attributes?: {}
  size?: number
  colorOverlay?: string // default #00000099, also it can be set by css variable --modal-color-overlay
  colorBackground?: string // default 'white', also it can be set by css variable --modal-color-bg
  type?: 'floating' | 'full-page' | 'bottom-sheet'
  bottomSheetOptions?: BottomSheetOptions
  position?: 'top' | 'center' | 'bottom'
  callback?: (name: string, option?: ModalControlFunctionsOption, content?: ReactNode) => void
  animation?: {
    type?: AnimationControlFunctions["type"]
  }
  children?: ReactNode
  attributesOverlay?: PropsWithChildren
}

export interface AnimationControlFunctions {
  type: false | 'slide' | 'slide-bottom' | 'zoom-in'
  pause: (timeout?: number) => void
  resume: () => void
}

export interface ModalControlFunctions {
  push: (content: ReactNode, options?: ModalControlFunctionsOption) => void
  pop: (options?: ModalControlFunctionsOption) => void
  transit?: (content: ReactNode, options?: ModalControlFunctionsOption) => void
  close: (options?: ModalControlFunctionsOption) => void
  hide: (options?: ModalControlFunctionsOption) => void
  show: (content: ReactNode, options?: ModalControlFunctionsOption) => void
  animation: AnimationControlFunctions
}

export interface ModalControlFunctionsOption {
  animation?: ModalProps['animation']
  popLast?: boolean
  [key: string]: any      // to allow this pattern: `onClick={modal.pop}` instead of `onClick={() => modal.pop()}`
}
