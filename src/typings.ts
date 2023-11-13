import { KeyboardEvent, MouseEvent, ReactNode, HTMLAttributes, ClassAttributes } from 'react'

export interface Modal {
  push: (content: ReactNode, options?: ModalPushOneTimeOptions) => Promise<ModalSheet>
  pop: (options?: ModalPopOneTimeOptions) => Promise<ModalSheet>
  transit: (content: ReactNode, options?: ModalPushOneTimeOptions) => Promise<ModalSheet>
  empty: (options?: ModalOneTimeOptions) => Promise<ModalSheet[]>
  next: (options?: ModalOneTimeOptions) => Promise<ModalSheet>
  back: (options?: ModalOneTimeOptions) => Promise<ModalSheet>
  hide: (options?: ModalOneTimeOptions) => Promise<void>
  show: (content?: ReactNode, options?: ModalPushOneTimeOptions) => Promise<ModalSheet>
  animation: ModalAnimation
}

export interface ModalSheet {
  id: string
  state: 'previous' | 'active' | 'next' | 'previous-closed' | 'active-closed' | 'next-closed'
  content: ReactNode
  htmlElement: HTMLDivElement | null
  activeElement: Element | null
  props: ClassAttributes<HTMLDivElement>
}
export interface BottomSheetOptions {
  disableDrag?: boolean
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
  rootElement?: HTMLElement
  classNameSheet?: string
  className?: string
  colorBackgroundSheet?: string // default 'white', also it can be set by css variable --one-modal-color-bg
  colorBackground?: string // default #00000099, also it can be set by css variable --one-modal-color-overlay
  attributesSheet?: HTMLAttributes<HTMLDivElement>
  attributes?: HTMLAttributes<HTMLDivElement>
  children?: ReactNode
  onESC?: 'hide' | 'empty' | 'pop' | null | { (event: KeyboardEvent<HTMLDivElement>): void }
  onClickOverlay?: 'hide' | 'empty' | 'pop' | null | { (event: MouseEvent<HTMLDivElement>): void }
}

export interface ModalAnimation {
  disable: boolean
  type: 'slide' | 'slide-bottom' | 'zoom-in' | string
  pause: (timeout?: number) => void
  resume: (timeout?: number) => void
}

export interface ModalOneTimeOptions {
  animation?: true | ModalProps['animation']
  [key: string]: any // to allow this pattern: `onClick={modal.pop}` instead of `onClick={() => modal.pop()}`
}

export interface ModalPushOneTimeOptions extends ModalOneTimeOptions {
  last?: boolean
  silent?: boolean
  popLast?: boolean
  attributes?: HTMLAttributes<HTMLDivElement>
}

export interface ModalPopOneTimeOptions extends ModalOneTimeOptions {
  last?: boolean
}

export type ScrollPosition = 'top' | 'middle' | 'bottom' | 'no-scroll'
