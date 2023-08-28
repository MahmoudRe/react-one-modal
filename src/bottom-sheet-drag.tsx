import { BottomSheetOptions, ScrollPosition } from './typings'
import { getScrollPosition } from './utils'

export function dragElement(el: HTMLElement, options: BottomSheetOptions, closeModal: Function) {
  let yDiff = 0,
    yPrev = 0,
    scrollPosition: ScrollPosition = 'top'

  let {
    positions = [50, 90],
    startPosition: currPosition = positions[0],
    closePosition = Math.max(positions[0] / 2, 20),
    swipeThreshold = 15,
    dynamicHeight = false,
    closeByDragDown = true,
    headerSelector
  } = options

  // sort positions ASC just in case
  positions.sort((a, b) => a - b)
  const highestPosition = positions[positions.length - 1]
  const highestPositionPx = (highestPosition * window.innerHeight) / 100

  //set position of initial open
  el.style.setProperty('--bottom-sheet-height', (dynamicHeight ? currPosition : highestPosition) + '%')
  el.style.setProperty('--bottom-sheet-top', 'calc(100% - ' + currPosition + '%)')

  // set up event listener for the start of the drag
  let headerElement = document.querySelector<HTMLElement>(headerSelector as string)
  if (headerElement) {
    headerElement.onmousedown = dragStart
    headerElement.ontouchstart = dragStart
  } else {
    el.onmousedown = dragStart
    el.ontouchstart = dragStart
  }

  function dragStart(ev: MouseEvent | TouchEvent | any) {
    scrollPosition = getScrollPosition(ev.target, el)

    // get the mouse cursor position at startup:
    yPrev = ev.clientY || ev.touches[0].clientY
    document.onmouseup = dragEnd
    document.ontouchend = dragEnd

    // call a function whenever the cursor moves:
    document.onmousemove = dragMove
    document.addEventListener('touchmove', dragMoveTouch, { passive: false })

    el.style.transition = 'none'
  }

  function dragMoveTouch(ev: TouchEvent) {
    document.removeEventListener('touchmove', dragMoveTouch, false)

    // calculate the new cursor position:
    yDiff = yPrev - ev.touches[0].clientY // if yDiff is positive, direction is up, and vise versa
    yPrev = ev.touches[0].clientY

    // enable scrolling in these situation
    if (
      // (yDiff > 0 && currPosition === highestPosition && scrollPosition === 'top') || // Natural feel, TODO fix: jitter effect
      (yDiff > 0 && currPosition === highestPosition && scrollPosition !== 'no-scroll') || //on drag up
      (yDiff < 0 && currPosition === highestPosition && scrollPosition === 'bottom') || //on drag down
      scrollPosition === 'middle'
    )
      return

    // prevent scrolling if we didn't react the top nor nested elements is scrolled
    ev.preventDefault()
    document.addEventListener('touchmove', dragMove, { passive: false })
  }

  function dragMove(ev: MouseEvent | TouchEvent | any) {
    ev.preventDefault()

    // calculate the new cursor position:
    yDiff = yPrev - (ev.clientY || ev.touches[0].clientY) // if yDiff is positive, direction is up, and vise versa
    yPrev = ev.clientY || ev.touches[0].clientY

    // delay height change according to drag direction to prevent flickering at bottom of sheet
    if (yDiff > 0) {
      // drag up: decrease height later
      el.style.setProperty('--bottom-sheet-top', el.offsetTop - yDiff + 'px')

      const currentPositionPx = window.innerHeight - el.offsetTop - yDiff
      if (dynamicHeight || currentPositionPx > highestPositionPx)
        el.style.setProperty('--bottom-sheet-height', 'calc(100% - ' + (el.offsetTop - yDiff) + 'px)')
    } else {
      // drag down: increase the height first
      if (dynamicHeight) el.style.setProperty('--bottom-sheet-height', 'calc(100% - ' + (el.offsetTop - yDiff) + 'px)')
      el.style.setProperty('--bottom-sheet-top', el.offsetTop - yDiff + 'px')
    }
  }

  function dragEnd() {
    // stop moving when mouse button is released:
    document.onmouseup = null
    document.ontouchend = null
    document.onmousemove = null
    document.removeEventListener('touchmove', dragMove as EventListener, false)
    el.style.transition = ''

    let nextPosition = currPosition
    let currFloatingPos = 100 - (parseInt(getComputedStyle(el).top) / window.innerHeight) * 100 // get percentage of the top, then (100 - *) to get percentage from the bottom

    // swipe up
    if (yDiff > swipeThreshold && scrollPosition === 'top') {
      nextPosition = positions[Math.min(positions.length - 1, positions.indexOf(currPosition) + 1)]
    }
    // swipe down
    else if (yDiff < -1 * swipeThreshold && scrollPosition === 'top') {
      nextPosition = positions[Math.max(0, positions.indexOf(currPosition) - 1)]
      if (closeByDragDown && positions.indexOf(currPosition) === 0) {
        closeModal()
        return
      }
    }
    // close bellow closing position
    else if (currFloatingPos < closePosition && closeByDragDown) {
      closeModal()
      return
    }
    // drag up/down
    else {
      nextPosition = positions.reduce(
        (acc, pos) => (Math.abs(acc - currFloatingPos) < Math.abs(pos - currFloatingPos) ? acc : pos),
        currPosition
      )
    }

    currPosition = nextPosition
    el.style.setProperty('--bottom-sheet-top', 'calc(100% - ' + nextPosition + '%)')
    el.style.setProperty('--bottom-sheet-height', (dynamicHeight ? nextPosition : highestPosition) + '%')
  }
}
