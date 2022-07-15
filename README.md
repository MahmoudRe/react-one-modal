# react-advance-modal

> Animated modal with advanced functionality for React framework

[![NPM](https://img.shields.io/npm/v/react-advance-modal.svg)](https://www.npmjs.com/package/react-advance-modal)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![Size](https://img.shields.io/bundlephobia/minzip/react-advance-modal)](https://www.npmjs.com/package/react-advance-modal)

## Install

```bash
npm install --save react-advance-modal
```

## Usage

1. Create new instance of `Modal` anywhere in your view. This instance will appear on the bottom of `body` element but preserve React Context of its contents.

```jsx
import Modal from 'react-advance-modal'

const App = () => {
  ...

  return (
    <>
      ...

      <Modal floating />
    </>
  )
}
```

2. Create `ref` using `useRef` hook and bind it to the created `Modal` instance as follow:

```jsx
import { useRef } from 'react'
import Modal, { bindModal } from 'react-advance-modal'

const App = () => {
  const modalRef = useRef(null)
  const modal = bindModal(modalRef)
  ...

  return (
    <>
      ...

      <Modal ref={modalRef} floating />
    </>
  )
}
```

4. Now, using `modal` instance you can access the control functions of `Modal` and change animation of the bound Modal.

```jsx
import { useRef } from 'react'
import Modal, { bindModal } from 'react-advance-modal'

const App = () => {
  const modalRef = useRef(null)
  const modal = bindModal(modalRef)
  ...

  return (
    <>
      <button onClick={() => modal.show(<MyComponent />)}>
        Show floating modal
      </button>
      ...

      <Modal ref={modalRef} floating />
    </>
  )
}
```

5. Using `useModal` or `getModal`, you can access the `Modal` instance anywhere in your component tree.

```jsx
import { useModal } from 'react-advance-modal'

const MyComponent = () => {
  const modal = useModal()
  ...

  return (
    <>
      ...
      <button onClick={() => { modal.push(<MyComponentStep2 />) }}>
        Next Step
      </button>

      <button onClick={() => { modal.close() }}>
        Close
      </button>
    </>
  )
}
```

## API

### Modal props

```jsx
<Modal 
  ref={modalRef} 
  floating  // if present then a floating modal will be used
  
/>
```

### Control functions

After binding the `Modal` to a `ref` in parent component, you can access all functionalities to the bound `Modal` using `useModal` or `getModal` functions anywhere in your code as long the parent component is live.

```jsx
const modal = useModal()


```

## Examples

### Simple floating/bottom modal

```jsx
import React, { useRef } from 'react'
import Modal, { bindModal, useModal } from 'react-advance-modal'
import 'react-advance-modal/dist/index.css'

const App = () => {
  const modalRef = useRef(null)
  const modal = bindModal(modalRef) //binding without key

  const modalBottomRef = useRef(null)
  const modalBottom = bindModal(modalBottomRef, 'floating-bottom')

  return (
    <>
      <h1> Welcome to React Advance Modal </h1>
      <button onClick={() => modal.show(<FloatingModalContent />)}>
        Show floating modal
      </button>
      <button onClick={() => modalBottom.show(<FloatingModalContent />)}>
        Show floating bottom modal
      </button>

      <Modal ref={modalRef} floating />
      <Modal ref={modalBottomRef} floating bottom />
    </>
  )
}

const FloatingModalContent = () => {
  const modal = useModal()

  return (
    <div>
      <h1> Floating Modal Content </h1>
      
      // Modal content ...

      <button onClick={modal.close}> Close </button>
    </div>
  )
}

const FloatingBottomModalContent = () => {
  const modal = useModal('floating-bottom')

  return (
    <div>
      <h1> Floating Modal Content </h1>
      
      // Modal content ...

      <button onClick={modal.close}> Close </button>
    </div>
  )
}

```

### Multi-step full-page modal

```jsx
import React, { Component } from 'react'

import Modal, { bindModal, useModal } from 'react-advance-modal'
import 'react-advance-modal/dist/index.css'

const App = () => {
  const modalRef = useRef(null)
  const modal = bindModal(modalRef)

  return (
    <>
      <h1> Welcome to React Advance Modal </h1>
      <button onClick={() => modal.push(<FullPageModalStep1 />)}>
        Start multi-step modal
      </button>

      <Modal ref={modalRef} />
    </>
  )
}

const FullPageModalStep1 = () => {
  const modal = useModal('full-page')

  return (
    <div style={{ backgroundColor: '#6d9ce8', width: '100%', height: '100%' }}>
      <h2> Full Page Modal Content Step 1 </h2>
      
      // Content ...

      <button onClick={() => modal.push(<FullPageModalStep2 />)}>
        Got to step 2
      </button>
      <button onClick={modal.pop}> Close </button>
    </div>
  )
}

const FullPageModalStep2 = () => {
  const modal = useModal('full-page')

  return (
    <div style={{ backgroundColor: '#5dc294' }}>
      <h2> Full Page Modal Content Step 2 </h2>
      
      // Content ...

      <button onClick={() => modal.push(<FullPageModalLastStep />)} >
        Go to last
      </button>
      <button onClick={modal.pop}> Back </button>
      <button onClick={modal.close}> Close </button>
    </div>
  )
}

const FullPageModalLastStep = () => {
  const modal = useModal('full-page')

  return (
    <div style={{ backgroundColor: '#5dc294' }}>
      <h2> Full Page Modal Content Last Step </h2>
      
      // Content ...

      <button onClick={modal.pop}> Back </button>
      <button onClick={modal.close}> Close </button>
      <button onClick={() => {
        yourCallback();
        modal.close();
      }}> Done! </button>
    </div>
  )
}

```

## To Do

- Promisify all control functions (push/pop/close/show/hide) to resolve when animation is done.
- Notification style modal
- Auto load css when importing component, such that no need to import stylesheet by end user (check styled-components?)
- Write proper documentation

## License

MIT © [MahmoudRe](https://github.com/MahmoudRe) [Schuttelaar & Partners](https://github.com/schuttelaar)
