import React, { useRef } from 'react'

import Modal, { bindModal, useModal } from 'react-advance-modal'
import 'react-advance-modal/dist/index.css'

const App = () => {
  const modalRef = useRef(null)
  const modalBottomRef = useRef(null)
  const modalFullPageRef = useRef(null)

  const modal = bindModal(modalRef)
  const modalBottom = bindModal(modalBottomRef, 'bottom')
  const modalFullPage = bindModal(modalFullPageRef, 'full-page')

  return (
    <>
      <h1> Welcome to React Advance Modal </h1>
      <button onClick={() => modal.show(<FloatingModalContent />)}>
        Show floating modal
      </button>
      <button onClick={() => modalBottom.show(<BottomModalContent />)}>
        Show floating bottom modal
      </button>
      <button onClick={() => modalFullPage.push(<FullPageModalStep1 />)}>
        Show full page modal
      </button>

      <Modal ref={modalRef} floating />
      <Modal ref={modalBottomRef} floating bottom />
      <Modal ref={modalFullPageRef} />
    </>
  )
}

const FloatingModalContent = () => {
  const modal = useModal()

  return (
    <div>
      <h1> Floating Modal Content </h1>
      <p>
        Lorem ipsum dolor sit amet, ea vix essent diceret, vidit abhorreant sed
        at, duo consul numquam at.
      </p>
      <button onClick={modal.pop}> Close </button>
    </div>
  )
}

const BottomModalContent = () => {
  const modal = useModal('bottom')

  return (
    <div>
      <h1> Floating Modal Content </h1>
      <p>
        Lorem ipsum dolor sit amet, ea vix essent diceret, vidit abhorreant sed
        at, duo consul numquam at.
      </p>
      <button onClick={modal.pop}> Close </button>
    </div>
  )
}

const FullPageModalStep1 = () => {
  const modal = useModal('full-page')

  return (
    <div style={{ backgroundColor: '#6d9ce8', width: '100%', height: '100%' }}>
      <h2> Full Page Modal Content Step 1 </h2>
      <h3> What is Lorem Ipsum? </h3>
      <p>
        Lorem Ipsum is simply dummy text of the printing and typesetting
        industry. Lorem Ipsum has been the industry's standard dummy text ever
        since the 1500s, when an unknown printer took a galley of type and
        scrambled it to make a type specimen book. It has survived not only five
        centuries, but also the leap into electronic typesetting, remaining
        essentially unchanged. It was popularised in the 1960s with the release
        of Letraset sheets containing Lorem Ipsum passages, and more recently
        with desktop publishing software like Aldus PageMaker including versions
        of Lorem Ipsum.
      </p>
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
      <h3> Why do we use it? </h3>
      <p>
        It is a long established fact that a reader will be distracted by the
        readable content of a page when looking at its layout. The point of
        using Lorem Ipsum is that it has a more-or-less normal distribution of
        letters, as opposed to using 'Content here, content here', making it
        look like readable English. Many desktop publishing packages and web
        page editors now use Lorem Ipsum as their default model text, and a
        search for 'lorem ipsum' will uncover many web sites still in their
        infancy. Various versions have evolved over the years, sometimes by
        accident, sometimes on purpose (injected humour and the like).
      </p>
      <button
        onClick={() =>
          modal.push(
            <>
              <div> Last step! </div>
              <button onClick={modal.pop}> Back </button>
              <button onClick={modal.close}> Close </button>
            </>
          )
        }
      >
        Got to last
      </button>
      <button onClick={modal.pop}> Back </button>
      <button onClick={modal.close}> Close </button>
    </div>
  )
}

export default App
