import { ReactNode, PropsWithChildren } from 'react'

export interface Modal {
  push: (content: ReactNode, options?: ModalOneTimeOptions) => void
  pop: (options?: ModalOneTimeOptions) => void
  transit?: (content: ReactNode, options?: ModalOneTimeOptions) => void
  empty: (options?: ModalOneTimeOptions) => void
  hide: (options?: ModalOneTimeOptions) => void
  show: (content: ReactNode, options?: ModalOneTimeOptions) => void
  animation: ModalAnimation
}
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
  callback?: (name: string, option?: ModalOneTimeOptions, content?: ReactNode) => any
  animation?: {
    type?: ModalAnimation['type']
  }
  children?: ReactNode
  attributesOverlay?: PropsWithChildren
}

export interface ModalAnimation {
  type: false | 'slide' | 'slide-bottom' | 'zoom-in'
  pause: (timeout?: number) => void
  resume: () => void
}

export interface ModalOneTimeOptions {
  animation?: ModalProps['animation']
  popLast?: boolean
  [key: string]: any // to allow this pattern: `onClick={modal.pop}` instead of `onClick={() => modal.pop()}`
}
