import { KeyboardEvent, MouseEvent, ReactNode, HTMLAttributes } from 'react'

export interface Modal {
  push: (content: ReactNode, options?: ModalPushOneTimeOptions) => Promise<ModalSheet>
  pop: (options?: ModalOneTimeOptions) => Promise<ModalSheet>
  transit: (content: ReactNode, options?: ModalPushOneTimeOptions) => Promise<ModalSheet>
  empty: (options?: ModalOneTimeOptions) => Promise<ModalSheet[]>
  hide: (options?: ModalOneTimeOptions) => Promise<void>
  show: (content?: ReactNode, options?: ModalPushOneTimeOptions) => Promise<ModalSheet>
  animation: ModalAnimation
}

export interface ModalSheet {
  reactNode: ReactNode
  htmlElement: HTMLDivElement | null
  activeElement: Element | null
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
  allowBodyScroll?: boolean
  className?: string
  classNameOverlay?: string
  colorBackground?: string // default 'white', also it can be set by css variable --one-modal-color-bg
  colorBackgroundOverlay?: string // default #00000099, also it can be set by css variable --one-modal-color-overlay
  attributes?: HTMLAttributes<HTMLDivElement>
  attributesOverlay?: HTMLAttributes<HTMLDivElement>
  children?: ReactNode
  onESC?: 'hide' | 'empty' | 'pop' | null | { (event: KeyboardEvent<HTMLDivElement>): void }
  onClickOverlay?: 'hide' | 'empty' | 'pop' | null | { (event: MouseEvent<HTMLDivElement>): void }
}

export interface ModalAnimation {
  disable: boolean
  type: 'slide' | 'slide-bottom' | 'zoom-in'
  pause: (timeout?: number) => void
  resume: (timeout?: number) => void
}

export interface ModalOneTimeOptions {
  animation?: true | ModalProps['animation']
  [key: string]: any // to allow this pattern: `onClick={modal.pop}` instead of `onClick={() => modal.pop()}`
}

export interface ModalPushOneTimeOptions extends ModalOneTimeOptions {
  popLast?: boolean
  attributes?: HTMLAttributes<HTMLDivElement>
}

export type ScrollPosition = 'top' | 'middle' | 'bottom' | 'no-scroll'
