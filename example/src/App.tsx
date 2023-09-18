import Modal, { ModalProps, bindModal } from 'react-advance-modal'

import FloatingModalContent from './components/FloatingModalContent'
import { useState } from 'react'
import Radio from './components/Radio'

function App() {
  const [type, setType] = useState<ModalProps['type']>('floating')
  const [position, setPosition] = useState<ModalProps['position']>('center')
  const [animation, setAnimation] = useState<ModalProps['animation']>()
  const [stackSize, setStackSize] = useState<ModalProps['stackSize']>()
  const [allowBodyScroll, setAllowBodyScroll] = useState<ModalProps['allowBodyScroll']>()
  const [onESC, setOnESC] = useState<ModalProps['onESC']>('hide')
  const [onClickOverlay, setOnClickOverlay] = useState<ModalProps['onClickOverlay']>()

  const [modal, modalRef] = bindModal()

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

      <main className='min-h-screen grid items-center md:grid-cols-2 mx-10'>
        <div className='prose'>
          <h2 className='text-3xl mt-12'>Customize your modal!</h2>
          <h4>Type: </h4>
          <form className='join'>
            <Radio name='type' value='floating' onChange={() => setType('floating')} defaultChecked />
            <Radio name='type' value='full-page' onChange={() => setType('full-page')} />
            <Radio name='type' value='bottom-sheet' onChange={() => setType('bottom-sheet')} />
          </form>
          {type === 'floating' && (
            <>
              <h4>Position: </h4>
              <form className='join'>
                <Radio name='position' value='top' onChange={() => setPosition('top')} />
                <Radio name='position' value='center' onChange={() => setPosition('center')} defaultChecked />
                <Radio name='position' value='bottom' onChange={() => setPosition('bottom')} />
              </form>
            </>
          )}
          <h4>Animation: </h4>
          <form className='join'>
            <Radio name='animation' value='false' onChange={() => setAnimation(false)} />
            <Radio
              name='animation'
              value='zoom-in'
              onChange={() => setAnimation({ type: 'zoom-in' })}
              defaultChecked={type === 'floating'}
            />
            <Radio
              name='animation'
              value='slide'
              onChange={() => setAnimation({ type: 'slide' })}
              defaultChecked={type === 'full-page'}
            />
            <Radio
              name='animation'
              value='slide-bottom'
              onChange={() => setAnimation({ type: 'slide-bottom' })}
              defaultChecked={type === 'bottom-sheet'}
            />
          </form>
          <h4>On ESC button: </h4>
          <form className='join'>
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
          <form className='join'>
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
              <h4>Allow body scroll: </h4>
              <input
                type='checkbox'
                className='cursor-pointer toggle toggle-accent mt-4'
                onChange={(e) => setAllowBodyScroll(e.target.checked)}
              />
            </label>
          </div>
          <div className='flex gap-3'>
            <button className='btn btn-primary block mt-10 mb-10' onClick={() => modal.show(<FloatingModalContent />)}>
              Show Modal
            </button>
            <button className='btn btn-primary block mt-10 mb-10' onClick={() => modal.push(<FloatingModalContent />)}>
              Push Modal
            </button>
            <button className='btn btn-primary block mt-10 mb-10' onClick={() => modal.pop()}>
              Pop Modal
            </button>
            <button className='btn btn-primary block mt-10 mb-10' onClick={() => modal.empty()}>
              Empty Modal
            </button>
          </div>
        </div>
      </main>

      <Modal
        ref={modalRef}
        type={type}
        position={position}
        animation={animation}
        stackSize={stackSize}
        allowBodyScroll={allowBodyScroll}
        onESC={onESC}
        onClickOverlay={onClickOverlay}
      />
    </article>
  )
}

export default App
