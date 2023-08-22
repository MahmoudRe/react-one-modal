import React, { ReactNode, PropsWithChildren } from 'react'

export interface Modal {
  push: (content: ReactNode, options?: ModalOneTimeOptions) => Promise<[ReactNode, HTMLDivElementRef]>
  pop: (options?: ModalOneTimeOptions) => Promise<[ReactNode, HTMLDivElementRef]>
  transit: (content: ReactNode, options?: ModalOneTimeOptions) => Promise<[ReactNode, HTMLDivElementRef]>
  empty: (options?: ModalOneTimeOptions) => Promise<[ReactNode, HTMLDivElementRef][]>
  hide: (options?: ModalOneTimeOptions) => Promise<void>
  show: (content: ReactNode, options?: ModalOneTimeOptions) => Promise<[ReactNode, HTMLDivElementRef]>
  animation: ModalAnimation
}

export interface HTMLDivElementRef {
  current: HTMLDivElement | null
}
export interface BottomSheetOptions {
  drag?: boolean
  positions?: number[]
  startPosition?: number
  closePosition?: number
  swipeThreshold?: number
  dynamicHeight?: number
  closeByDragDown?: boolean
  headerSelector?: string
}

export interface ModalProps {
  type?: 'floating' | 'full-page' | 'bottom-sheet'
  position?: 'top' | 'center' | 'bottom'
  bottomSheetOptions?: BottomSheetOptions
  stackSize?: number
  animation?:
    | false
    | {
        disable?: ModalAnimation['disable']
        type?: ModalAnimation['type']
      }
  className?: string
  classNameOverlay?: string
  colorBackground?: string // default 'white', also it can be set by css variable --modal-color-bg
  colorBackgroundOverlay?: string // default #00000099, also it can be set by css variable --modal-color-overlay
  attributes?: {}
  attributesOverlay?: PropsWithChildren
  children?: ReactNode
  onESC?: 'hide' | 'empty' | 'pop' | null | { (event: KeyboardEvent): void }
  onClickOverlay?: 'hide' | 'empty' | 'pop' | null | { (event: MouseEvent): void }
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
