import { BottomSheetOptions } from "./typings"

export function dragElement(el: HTMLElement, options: BottomSheetOptions, closeModal: Function) {
  let yDiff = 0,
    yPrev = 0,
    scrollEnd = true

  let {
    positions = [50, 100],
    startPosition: currPosition = positions[0],
    closePosition = positions[0] / 2,
    swipeThreshold = 10,
    dynamicHeight = true,
    closeByDragDown = true,
    headerSelector = ''
  } = options

  // sort positions ASC just in case
  positions.sort((a, b) => a - b)

  //set position of initial open
  if (dynamicHeight) el.style.height = currPosition + '%'
  else el.style.height = positions[positions.length - 1] + '%'
  el.style.top = 'calc(100% - ' + currPosition + '%)'

  // set up event listener for the start of the drag
  let headerElement = document.querySelector<HTMLElement>(headerSelector)
  if (headerElement) {
    headerElement.onmousedown = dragStart
    headerElement.ontouchstart = dragStart
  } else {
    el.onmousedown = dragStart
    el.ontouchstart = dragStart
  }

  function isScrollEnd(element: HTMLElement): boolean {
    if (element === el || element.parentElement === el) return element.scrollTop === 0

    if (element?.scrollTop === 0) return isScrollEnd(element.parentElement as HTMLElement)

    return false
  }

  function dragStart(ev: MouseEvent | TouchEvent | any) {
    scrollEnd = isScrollEnd(ev.target as HTMLElement)

    // get the mouse cursor position at startup:
    yPrev = ev.clientY || ev.touches[0].clientY
    document.onmouseup = dragEnd
    document.ontouchend = dragEnd

    // call a function whenever the cursor moves:
    document.onmousemove = dragMove
    document.addEventListener('touchmove', dragMove, { passive: false })

    el.style.transition = 'none'
  }

  function dragMove(ev: MouseEvent | TouchEvent | any) {
    // calculate the new cursor position:
    yDiff = yPrev - (ev.clientY || ev.touches[0].clientY)
    yPrev = ev.clientY || ev.touches[0].clientY

    // set the element's new position
    if (el.offsetTop - yDiff > positions[positions.length - 1] && scrollEnd) {
      // prevent scrolling if we didn't react the top nor nested elements is scrolled
      ev.preventDefault()

      // delay height change according to scroll direction to prevent flickering at bottom of sheet
      if (yDiff > 0) {
        // scroll up: decrease height later
        el.style.top = el.offsetTop - yDiff + 'px'
        if (dynamicHeight)
          el.style.height = 'calc(100% - ' + (el.offsetTop - yDiff) + 'px)'
      } else {
        // scroll down: increase the height first
        if (dynamicHeight)
          el.style.height = 'calc(100% - ' + (el.offsetTop - yDiff) + 'px)'
        el.style.top = el.offsetTop - yDiff + 'px'
      }
    } else {
      // enable scroll + prevent drag down after reaching top
      scrollEnd = false
    }
  }

  function dragEnd() {
    // stop moving when mouse button is released:
    document.onmouseup = null
    document.ontouchend = null
    document.onmousemove = null
    document.removeEventListener('touchmove', dragMove as EventListener, false)
    el.style.transition = 'all .25s cubic-bezier(0, 0.3, 0.15, 1)'

    let nextPosition = currPosition
    let currFloatingPos = 100 - (parseInt(el.style.top) / window.innerHeight) * 100 // get percentage of the top, then (100 - *) to get percentage from the bottom

    // swipe up
    if (yDiff > swipeThreshold && scrollEnd) {
      nextPosition =
        positions[Math.min(positions.length - 1, positions.indexOf(currPosition) + 1)]
    }
    // swipe down
    else if (yDiff < -1 * swipeThreshold && scrollEnd) {
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
        (acc, pos) =>
          Math.abs(acc - currFloatingPos) < Math.abs(pos - currFloatingPos) ? acc : pos,
        currPosition
      )
    }

    if (dynamicHeight && parseInt(el.style.top) < nextPosition)
      el.style.transition += ', height .25s cubic-bezier(0, 0.3, 0.15, 1) .1s'

    currPosition = nextPosition
    el.style.top = 'calc(100% - ' + nextPosition + '%)'

    if (dynamicHeight) el.style.height = nextPosition + '%'
  }
}
