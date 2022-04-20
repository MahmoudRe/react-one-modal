# react-advance-modal

> Animated modal with advanced functionality for React framework

[![NPM](https://img.shields.io/npm/v/react-advance-modal.svg)](https://www.npmjs.com/package/react-advance-modal) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save react-advance-modal
```

## Usage examples
### Simple floating/bottom modal

```jsx
import React, { Component } from 'react'

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

## License

MIT © [MahmoudRe](https://github.com/MahmoudRe) [Schuttelaar & Partners](https://github.com/schuttelaar)
