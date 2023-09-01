import Modal, { useModal } from 'react-advance-modal'

import FloatingModalContent from './components/FloatingModalContent'
import BottomModalContent from './components/BottomModalContent'
import FullPageModalContent from './components/FullPageModalContent'

import './App.css';

function App() {
  const [modal, modalRef] = useModal()
  const [modalBottom, modalBottomRef] = useModal('bottom')
  const [modalFullPage, modalFullPageRef] = useModal('full-page')
  const [modalBottomSheet, modalBottomSheetRef] = useModal('bottom-sheet')

  return (
    <>
      <div> Welcome to </div>
      <h1> React One Modal </h1>

      <button onClick={() => modal.show(<FloatingModalContent />)}>Show floating modal</button>
      <button onClick={() => modalBottom.show(<BottomModalContent />)}>Show floating bottom modal</button>
      <button onClick={() => modalFullPage.push(<FullPageModalContent modal={modalFullPage} className='full-page' />)}>
        Show full page modal
      </button>
      <button
        onClick={() =>
          modalBottomSheet.show(<FullPageModalContent modal={modalBottomSheet} className='bottom-sheet' />)
        }
      >
        Show bottom sheet modal
      </button>

      <Modal ref={modalRef} />
      <Modal ref={modalBottomRef} position='bottom' />
      <Modal ref={modalFullPageRef} type='full-page' />
      <Modal ref={modalBottomSheetRef} type='floating' />
    </>
  );
}

export default App;
