# One Modal - API

## Modal props

The specified values are actually the default value of each attribute

```jsx
<Modal
  ref={modalRef}
  type="floating" // ['floating', 'full-page', 'bottom-sheet']
  bottomSheetOptions = {} // in case of 'modal-sheet' type, see Bottom sheet options bellow
  position = 'center' // in case of floating typ, ['top', 'center', 'bottom'],
  stackSize = {999} // the number of pages to preserve in the stack before start dropping out old pages
  animation = {{
    disable: false,
    type: 'slide' | 'slide-bottom' | 'zoom-in' // 'slide' | 'slide-bottom' | 'zoom-in'
  }}
  rootElement = {document.body} // HTMLElement where this modal will be appended to
  classNameSheet = ''
  className = '' // className for modal (ie. container/overlay)
  colorBackgroundSheet = 'white' // this also it can be set by css variable --omodal-sheet-color-bg
  colorBackground = '#00000099' // this also it can be set by css variable --omodal-color-bg
  attributesSheet = {}
  attributes = {} // pass the reset to modal container/overlay
  onESC = {null}, // null | hide | empty | pop
  onClickOverlay = {null} // null | hide | empty | pop
>
  // If a component exist here (children), then it is pushed to the modal on mount
<Modal>
```

### Bottom-sheet options

```jsx
<Modal
  ref={modalRef}
  type = 'bottom-sheet'
  bottomSheetOptions = {{
    positions = [50, 70],   // array of positions, where each position indicate the percentage of the screen that a snap should occur
    startPosition = positions[0],
    closePosition = Math.max(positions[0] / 2, 20),
    swipeThreshold = 15,
    dynamicHeight = false,
    closeByDragDown = false,
    headerSelector = '.bottom-sheet-header'
  }} // 
>
</Modal>
```

## Modal control

```jsx
const modal = getModal('some-key')
// or 
const [modal, modalRef] = bindModal('some-key')
// or
const [modal, modalRef] = useModal()
```

### Basics

```jsx
modal.show() // or modal.open()
modal.hide() // or modal.close()
```

### Adding elements dynamically

```jsx
modal.show(<Component />) // add the component and open the modal after that
modal.push(<Component />) // add the component and don't open the modal if closed
modal.pop()
modal.empty()
```

### Navigating existing elements

```jsx
modal.next()
modal.back()
```

### Adding element dynamically, while navigating existing elements

```jsx
modal.push(<Component />, {silent: true}) // add the component to next element and don't change the active modal-sheet
modal.push(<Component />, {last: true}) // add the component and don't change the active element
modal.pop() // pop the active modal-sheet
modal.pop({last: true}) // pop the last modal-sheet
```

### Controlling animation dynamically

```jsx
modal.animation.pause(250)  // pause animation for 250ms
modal.animation.pause()     // pause animation indefinitely
modal.animation.resume()    // resume animation
modal.animation.resume(250) // resume animation for 250ms and disable it again

modal.animation.type // get current animation type
modal.animation.type = 'slide' // change the animation type to 'slide'
```
