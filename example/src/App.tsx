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
    <article className='w-full'>
      <header className='hero min-h-screen bg-base-200'>
        <div className='hero-overlay absolute overflow-hidden'>
          <div className='absolute md:w-2/5 md:h-2/5 w-60 h-60 top-[-20%] left-[-20%] opacity-70'>
            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 747.2 726.7'>
              <path
                fill='hsl(var(--in))'
                d='M539.8 137.6c98.3 69 183.5 124 203 198.4 19.3 74.4-27.1 168.2-93.8 245-66.8 76.8-153.8 136.6-254.2 144.9-100.6 8.2-214.7-35.1-292.7-122.5S-18.1 384.1 7.4 259.8C33 135.6 126.3 19 228.5 2.2c102.1-16.8 213.2 66.3 311.3 135.4z'
              ></path>
            </svg>
          </div>
          <div className='absolute md:w-2/5 md:h-2/5 w-60 h-60 bottom-[-15%] right-[-15%] opacity-70'>
            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 747.2 726.7'>
              <path
                fill='hsl(var(--a))'
                d='M539.8 137.6c98.3 69 183.5 124 203 198.4 19.3 74.4-27.1 168.2-93.8 245-66.8 76.8-153.8 136.6-254.2 144.9-100.6 8.2-214.7-35.1-292.7-122.5S-18.1 384.1 7.4 259.8C33 135.6 126.3 19 228.5 2.2c102.1-16.8 213.2 66.3 311.3 135.4z'
              ></path>
            </svg>
          </div>
        </div>
        <div className='hero-content text-center z-5'>
          <div className='max-w-lg'>
            <h1 className='text-2xl font-semibold'>Welcome to</h1>
            <h1 className='text-8xl font-bold'>One Modal</h1>
            <p className='py-6'>All-in-one solution for all your modal-needs!</p>
            <button className='btn btn-primary'>Get Started</button>
          </div>
        </div>
      </header>
      
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
    </article>
  )
}

export default App;
