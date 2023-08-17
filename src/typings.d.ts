import { ReactNode, PropsWithChildren, MutableRefObject } from 'react'

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
  type: 'floating' | 'full-page' | 'bottom-sheet'
  bottomSheetOptions?: BottomSheetOptions
  position?: 'top' | 'center' | 'bottom'
  callback?: (name: string, option?: ControlFunctionOption, content?: ReactNode) => void
  animation: false | 'slide' | 'slide-bottom' | 'zoom-in'
  children?: ReactNode
  attributesOverlay: PropsWithChildren
}

export interface ControlFunctionCollection {
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

export interface ControlFunctionOption {
  animation?: ModalProps['animation']
  popLast?: boolean
}
