import Modal, { useModal } from 'react-advance-modal'
import 'react-advance-modal/dist/index.css'

import FloatingModalContent from './components/FloatingModalContent';
import BottomModalContent from './components/BottomModalContent';
import FullPageModalContent from './components/FullPageModalContent';

const App = () => {
  const [modal, modalRef] = useModal()
  const [modalBottom, modalBottomRef] = useModal('bottom')
  const [modalFullPage, modalFullPageRef]  = useModal('full-page')
  const [modalBottomSheet, modalBottomSheetRef] = useModal('bottom-sheet')

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

      <Modal ref={modalRef} />
      <Modal ref={modalBottomRef} position='bottom' />
      <Modal ref={modalFullPageRef} type='full-page' />
      <Modal ref={modalBottomSheetRef} type='bottom-sheet' />
    </>
  )
}

export default App
