import Modal, { getModal, useModal } from 'react-advance-modal'
import Radio from './Radio'
import { useRef } from 'react'

const FloatingModalContent = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const modal = getModal()
  const [confirmModal, confirmModalRef] = useModal()

  return (
    <div className='container bg-base-100 p-5 prose' ref={containerRef}>
      <h2> Floating Modal Content </h2>
      <p>
        Lorem ipsum dolor sit amet, ea vix essent diceret, vidit abhorreant sed at, duo consul numquam at. Lorem ipsum
        dolor sit amet, ea vix essent diceret, vidit abhorreant sed at, duo consul numquam at.
      </p>
      <div className='flex flex-col gap-4'>
        <input type='text' name='test' className='input input-bordered' />
        <input type='text' name='test' className='input input-bordered' />
        <input type='radio' name='test' className='radio' />
        <input type='checkbox' name='test' className='checkbox' />
        <form className='join'>
          <Radio name='animation' value='false' onChange={() => modal.animation.disable = true} />
          <Radio name='animation' value='zoom-in' onChange={() => modal.animation.type = "zoom-in"}/>
          <Radio name='animation' value='slide' onChange={() => modal.animation.type = "slide"}/>
          <Radio name='animation' value='slide-bottom' onChange={() => {modal.animation.type = "slide-bottom"}}/>
        </form>
      </div>

      <div className='flex gap-3 flex-wrap my-10'>
        <button className='btn btn-primary block ' onClick={() => modal.show(<FloatingModalContent />)}>
          Show Modal
        </button>
        <button className='btn btn-primary block' onClick={() => modal.transit(<FloatingModalContent />)}>
          Transit Modal
        </button>
        <button className='btn btn-primary block' onClick={() => {
          modal.push(<FloatingModalContent />).then(() => console.log('done push'))
          modal.pop().then(() => console.log('done pop'))
          modal.push(<FloatingModalContent />).then(() => console.log('done push'))
          modal.push(<FloatingModalContent />).then(() => console.log('done push'))
          modal.push(<FloatingModalContent />).then(() => console.log('done push'))
          modal.pop().then(() => console.log('done pop'))
          modal.pop().then(() => console.log('done pop'))
          modal.pop().then(() => console.log('done pop'))
          modal.push(<FloatingModalContent />).then(() => console.log('done push'))
          modal.pop().then(() => console.log('done pop'))
          modal.hide().then(() => console.log('done hide'))
          modal.show().then(() => console.log('done show'))
          modal.show().then(() => console.log('done show'))
          confirmModal.show().then(() => console.log('done show confirm'))
          confirmModal.pop().then(() => console.log('done pop confirm'))
          confirmModal.hide().then(() => console.log('done hide confirm'))
          modal.push(<FloatingModalContent />).then(() => console.log('done push'))
          modal.hide().then(() => console.log('done hide'))
          }}>
          Party test!
        </button>
        <button className='btn btn-primary block' onClick={() => modal.push(<FloatingModalContent />)}>
          Push Modal
        </button>
        <button className='btn btn-primary block' onClick={() => modal.pop()}>
          Pop Modal
        </button>
        <button className='btn btn-primary block' onClick={() => modal.hide().then(() => console.log('done hide'))}>
          Hide Modal
        </button>
        <button className='btn btn-primary block' onClick={() => modal.empty()}>
          Empty Modal
        </button>
      </div>

      <button className='btn btn-sm btn-secondary mt-3' onClick={() => confirmModal.show()}>
        Empty
      </button>

      <Modal
        ref={confirmModalRef}
        onESC={'hide'}
        // rootElement={containerRef.current ?? undefined}
      >
        <div className='container bg-base-100 p-4'>
          <p>Are you sure you want to empty this stack of modals?</p>
          <button
            className='btn btn-sm btn-warning mt-3 mr-5'
            onClick={() => {
              confirmModal.hide()
              modal.empty()
            }}
          >
            Confirm
          </button>
          <button className='btn btn-sm bg-base-100 mt-3' onClick={confirmModal.hide}>
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default FloatingModalContent
