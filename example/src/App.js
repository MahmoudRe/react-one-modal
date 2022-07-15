import React, { useRef } from 'react'

import Modal, { bindModal } from 'react-advance-modal'
import 'react-advance-modal/dist/index.css'

import FloatingModalContent from './components/FloatingModalContent';
import BottomModalContent from './components/BottomModalContent';
import FullPageModalContent from './components/FullPageModalContent';

const App = () => {
  const modalRef = useRef(null)
  const modalBottomRef = useRef(null)
  const modalFullPageRef = useRef(null)
  const modalBottomSheetRef = useRef(null)

  const modal = bindModal(modalRef)
  const modalBottom = bindModal(modalBottomRef, 'bottom')
  const modalFullPage = bindModal(modalFullPageRef, 'full-page')
  const modalBottomSheet = bindModal(modalBottomSheetRef, 'bottom-sheet')

  return (
    <>
      <h1> Welcome to React Advance Modal </h1>
      <button onClick={() => modal.show(<FloatingModalContent />)}>
        Show floating modal
      </button>
      <button onClick={() => modalBottom.show(<BottomModalContent />)}>
        Show floating bottom modal
      </button>
      <button onClick={() => modalFullPage.push(<FullPageModalContent modal={modalFullPage} className="full-page" />)}>
        Show full page modal
      </button>
      <button onClick={() => modalBottomSheet.show(<FullPageModalContent modal={modalBottomSheet} className="bottom-sheet" />)}>
        Show bottom sheet modal
      </button>

      <Modal ref={modalRef} floating />
      <Modal ref={modalBottomRef} floating bottom />
      <Modal ref={modalFullPageRef} />
      <Modal ref={modalBottomSheetRef} bottomSheet />
    </>
  )
}

export default App
