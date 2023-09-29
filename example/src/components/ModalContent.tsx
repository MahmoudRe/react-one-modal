import { getModal, Modal } from 'react-advance-modal'

export default function ModalContentStep1({ modal }: { modal: Modal; className: string }) {
  return (
    <div className='w-full flex justify-center overflow-hidden'>
      <div className='container p-5 bg-base-100 rounded-t-lg overflow-hidden prose'>
        <div className='h-full overflow-auto'>
          <h2> Welcome in One Modal! </h2>
          <h3> What is Lorem Ipsum? </h3>
          <p>
            Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the
            industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and
            scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into
            electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of
            Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like
            Aldus PageMaker including versions of Lorem Ipsum.
          </p>
          <p>
            Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the
            industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and
            scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into
            electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of
            Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like
            Aldus PageMaker including versions of Lorem Ipsum.
          </p>
          <p>
            Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the
            industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and
            scrambled it to make a type specimen book. Lorem Ipsum has been the industry's standard dummy text ever
            since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen
            book. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer
            took a galley of type and scrambled it to make a type specimen book.
          </p>
        </div>

        <button className='btn btn-primary' onClick={() => modal.push(<ModalContentStep2 />)}>
          Got to step 2
        </button>
        <button className='btn ml-3' onClick={modal.pop}>
          Close
        </button>
      </div>
    </div>
  )
}

function ModalContentStep2() {
  const modal = getModal('full-page')

  return (
    <div className='page' style={{ backgroundColor: '#5dc294' }}>
      <h2> Full Page Modal Content Step 2 </h2>
      <h3> Why do we use it? </h3>
      <p>
        It is a long established fact that a reader will be distracted by the readable content of a page when looking at
        its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as
        opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing
        packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum'
        will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by
        accident, sometimes on purpose (injected humour and the like).
      </p>
      <button
        onClick={() =>
          modal.push(
            <>
              <div> Last step! </div>
              <button onClick={modal.pop}> Back </button>
              <button onClick={modal.empty}> Close </button>
            </>
          )
        }
      >
        Got to last
      </button>
      <button onClick={modal.pop}> Back </button>
      <button onClick={modal.empty}> Close </button>
    </div>
  )
}
