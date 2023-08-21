import { ReactNode, PropsWithChildren } from 'react'

export interface Modal {
  push: (content: ReactNode, options?: ModalOneTimeOptions) => Promise<[ReactNode, HTMLDivElementRef]>
  pop: (options?: ModalOneTimeOptions) => Promise<[ReactNode, HTMLDivElementRef]>
  transit: (content: ReactNode, options?: ModalOneTimeOptions) => void
  empty: (options?: ModalOneTimeOptions) => void
  hide: (options?: ModalOneTimeOptions) => void
  show: (content: ReactNode, options?: ModalOneTimeOptions) => void
  animation: ModalAnimation
}

export interface HTMLDivElementRef {
  current: HTMLDivElement | null
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
  animation?:
    | false
    | {
        disable?: ModalAnimation['disable']
        type?: ModalAnimation['type']
      }
  children?: ReactNode
  attributesOverlay?: PropsWithChildren
}

export interface ModalAnimation {
  disable: boolean
  type: 'slide' | 'slide-bottom' | 'zoom-in'
  pause: (timeout?: number) => void
  resume: (timeout?: number) => void
}

export interface ModalOneTimeOptions {
  animation?: true | ModalProps['animation']
  popLast?: boolean
  [key: string]: any // to allow this pattern: `onClick={modal.pop}` instead of `onClick={() => modal.pop()}`
}
