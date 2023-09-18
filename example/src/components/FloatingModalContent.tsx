import Modal, { getModal, useModal } from 'react-advance-modal'
import Radio from './Radio'

const FloatingModalContent = () => {
  const modal = getModal()
  const [confirmModal, confirmModalRef] = useModal()

  return (
    <div className='container bg-base-100 p-5 prose'>
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
          <Radio name='animation' value='false' />
          <Radio name='animation' value='zoom-in' />
          <Radio name='animation' value='slide' />
          <Radio name='animation' value='slide-bottom' />
        </form>
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

      <button
        className='btn btn-sm btn-secondary mt-3'
        onClick={() =>
          confirmModal.show(
            <div className='container bg-base-100 p-4'>
              <p>Are you sure you want to empty this stack of modals?</p>
              <button
                className='btn btn-sm btn-warning mt-3 mr-5'
                onClick={() => {
                  confirmModal.pop()
                  modal.empty()
                }}
              >
                Confirm
              </button>
              <button className='btn btn-sm bg-base-100 mt-3' onClick={confirmModal.pop}>
                Cancel
              </button>
            </div>
          )
        }
      >
        Empty
      </button>

      <Modal ref={confirmModalRef} onESC={'empty'} />
    </div>
  )
}

export default FloatingModalContent
