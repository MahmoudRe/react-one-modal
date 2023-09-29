import Modal, { ModalProps, bindModal, setModalErrorHandler } from 'react-advance-modal'

import FloatingModalContent from './components/FloatingModalContent'
import { useState } from 'react'
import Radio from './components/Radio'
import ModalContentStep1 from './components/ModalContent'

setModalErrorHandler((err) => {
  console.warn('My error handler: ' + err.message)
})

function App() {
  const [type, setType] = useState<ModalProps['type']>('floating')
  const [position, setPosition] = useState<ModalProps['position']>('center')
  const [stackSize, setStackSize] = useState<ModalProps['stackSize']>()
  const [dialogMode, setDialogMode] = useState<boolean>()
  const [onESC, setOnESC] = useState<ModalProps['onESC']>('hide')
  const [onClickOverlay, setOnClickOverlay] = useState<ModalProps['onClickOverlay']>()

  const [modal, modalRef] = bindModal()
  const [bottomSheet, bottomSheetRef] = bindModal('bottom-sheet')
  const [globalConfirmModal, globalConfirmModalRef] = bindModal('global-confirm')

  return (
    <article className='w-full'>
      <header className='hero min-h-screen bg-base-200'>
        <div className='hero-overlay absolute overflow-hidden'>
          <div className='absolute md:w-1/2 md:h-1/2 w-72 h-72 top-[-20%] left-[-20%] opacity-70 animate-[blob_15s_ease_infinite]'>
            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 747.2 726.7'>
              <path
                fill='hsl(var(--in))'
                d='M539.8 137.6c98.3 69 183.5 124 203 198.4 19.3 74.4-27.1 168.2-93.8 245-66.8 76.8-153.8 136.6-254.2 144.9-100.6 8.2-214.7-35.1-292.7-122.5S-18.1 384.1 7.4 259.8C33 135.6 126.3 19 228.5 2.2c102.1-16.8 213.2 66.3 311.3 135.4z'
              ></path>
            </svg>
          </div>
          <div className='absolute md:w-2/5 md:h-2/5 w-60 h-60 bottom-[-20%] right-[-15%] opacity-70 animate-[blob_20s_ease-in-out_infinite]'>
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

      <main className='min-h-screen grid items-center mx-10 max-w-screen mt-12'>
        <div className='flex flex-col w-full lg:flex-row'>
          <div className='grid flex-grow place-items-center'>
            <div className='prose'>
            <h2 className='text-5xl font-bold'>Customize your modal!</h2>
              <h4>Type: </h4>
              <form className='md:join md:block flex gap-2 flex-wrap'>
                <Radio name='type' value='floating' onChange={() => setType('floating')} defaultChecked />
                <Radio name='type' value='full-page' onChange={() => setType('full-page')} />
                <Radio name='type' value='bottom-sheet' onChange={() => setType('bottom-sheet')} />
              </form>
              {type === 'floating' && (
                <>
                  <h4>Position: </h4>
                  <form className='md:join md:block flex gap-2 flex-wrap'>
                    <Radio name='position' value='top' onChange={() => setPosition('top')} />
                    <Radio name='position' value='center' onChange={() => setPosition('center')} defaultChecked />
                    <Radio name='position' value='bottom' onChange={() => setPosition('bottom')} />
                  </form>
                </>
              )}
              <h4>Animation: </h4>
              <form className='md:join md:block flex gap-2 flex-wrap'>
                <Radio name='animation' value='false' onChange={() => (modal.animation.disable = true)} />
                <Radio
                  name='animation'
                  value='zoom-in'
                  onChange={() => (modal.animation.type = 'zoom-in')}
                  defaultChecked={type === 'floating'}
                />
                <Radio
                  name='animation'
                  value='slide'
                  onChange={() => (modal.animation.type = 'slide')}
                  defaultChecked={type === 'full-page'}
                />
                <Radio
                  name='animation'
                  value='slide-bottom'
                  onChange={() => (modal.animation.type = 'slide-bottom')}
                  defaultChecked={type === 'bottom-sheet'}
                />
              </form>
              <h4>On ESC button: </h4>
              <form className='md:join md:block flex gap-2 flex-wrap'>
                <Radio name='onESC' value='null' onChange={() => setOnESC(null)} />
                <Radio name='onESC' value='hide' onChange={() => setOnESC('hide')} defaultChecked />
                <Radio name='onESC' value='empty' onChange={() => setOnESC('empty')} />
                <Radio name='onESC' value='pop' onChange={() => setOnESC('pop')} />
                <Radio
                  name='onESC'
                  value='[Custom callback]'
                  onChange={() => setOnESC(() => () => alert('ESC is pressed! Your custom callback!'))}
                />
              </form>
              <h4>On click overlay: </h4>
              <form className='md:join md:block flex gap-2 flex-wrap'>
                <Radio name='onClickOverlay' value='null' onChange={() => setOnClickOverlay(null)} defaultChecked />
                <Radio name='onClickOverlay' value='hide' onChange={() => setOnClickOverlay('hide')} />
                <Radio name='onClickOverlay' value='empty' onChange={() => setOnClickOverlay('empty')} />
                <Radio name='onClickOverlay' value='pop' onChange={() => setOnClickOverlay('pop')} />
                <Radio
                  name='onClickOverlay'
                  value='[Custom callback]'
                  onChange={() =>
                    setOnClickOverlay(() => () => alert('A click on overlay is detected! Your custom callback!'))
                  }
                />
              </form>
              <h4>Stack size: </h4>
              <input
                type='number'
                placeholder='999'
                className='input input-bordered max-w-xs'
                min={1}
                value={stackSize}
                onChange={(e) => setStackSize(parseInt(e.target.value))}
              />
              <div className='form-control w-52'>
                <label className='cursor-pointer label'>
                  <h4>Dialog mode: </h4>
                  <input
                    type='checkbox'
                    className='cursor-pointer toggle toggle-accent mt-4'
                    onChange={(e) => setDialogMode(e.target.checked)}
                    defaultChecked={dialogMode}
                  />
                </label>
              </div>
            </div>
          </div>
          <div className='hidden lg:grid flex-grow place-items-center mt-22'>
            <div className='mockup-phone'>
              <div className='camera'></div>
              <div className='display'>
                <div className='artboard artboard-demo phone-1 p-5 py-20'>
                  <div className='container prose'>
                    <h2>Some content on mobile</h2>
                    <p>
                      Lorem ipsum dolor sit amet consectetur adipisicing elit. Dicta praesentium vel sequi at laborum
                      voluptas placeat, officia earum repudiandae a illo iste, eveniet id quam, sed laboriosam officiis
                      ad pariatur!
                    </p>
                    <h4>mailing list: </h4>
                    <input type='text' className='input input-bordered max-w-xs' />
                    <button className='btn btn-outline mt-10'>Submit</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className='flex flex-wrap w-full justify-center gap-2 my-10'>
          <button className='btn btn-primary ' onClick={() => modal.show()}>
            Show
          </button>
          <button className='btn btn-primary' onClick={() => modal.transit(<FloatingModalContent />)}>
            Transit
          </button>
          <button className='btn btn-primary' onClick={() => modal.push(<FloatingModalContent />)}>
            Push
          </button>
          <button className='btn btn-primary' onClick={() => modal.pop()}>
            Pop
          </button>
          <button className='btn btn-primary' onClick={() => modal.empty()}>
            Empty
          </button>
          <button className='btn btn-primary' onClick={() => modal.next()}>
            Next
          </button>
          <button className='btn btn-primary' onClick={() => modal.back()}>
            Back
          </button>
          <button className='btn btn-primary' onClick={() => bottomSheet.show()}>
            Show bottom-sheet
          </button>
        </div>
      </main>

      <Modal
        ref={modalRef}
        type={type}
        position={position}
        stackSize={stackSize}
        onESC={onESC}
        onClickOverlay={onClickOverlay}
        // rootElement={document.querySelector<HTMLElement>('.mockup-phone .display .artboard') ?? undefined}
      >
        <FloatingModalContent />
      </Modal>

      <Modal
        ref={bottomSheetRef}
        type={'bottom-sheet'}
        onESC={onESC}
        onClickOverlay={onClickOverlay}
        // rootElement={document.querySelector<HTMLElement>('.mockup-phone .display .artboard') ?? undefined}
      >
        <ModalContentStep1 modal={bottomSheet} className='page' />
      </Modal>

      <Modal
        ref={globalConfirmModalRef}
        onESC={'hide'}
        // rootElement={containerRef.current ?? undefined}
      >
        <div className='container bg-base-100 p-4'>
          <p>Are you sure you want to empty this stack of modals?</p>
          <button
            className='btn btn-sm btn-warning mt-3 mr-5'
            onClick={() => {
              modal.empty()
            }}
          >
            Confirm
          </button>
          <button className='btn btn-sm bg-base-100 mt-3' onClick={globalConfirmModal.hide}>
            Cancel
          </button>
        </div>
      </Modal>
    </article>
  )
}

export default App
