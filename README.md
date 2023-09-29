# React One Modal

> Animated modal with advanced functionality for React framework

[![NPM](https://img.shields.io/npm/v/react-one-modal.svg)](https://www.npmjs.com/package/react-one-modal)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![Size](https://img.shields.io/bundlephobia/minzip/react-one-modal)](https://www.npmjs.com/package/react-one-modal)

## Why One Modal?

TL;DR:
The only modal you will ever need, truly the one modal for all your user cases!

- Easy to use API
- Manages its own state, no more passing `open` state around to open or close your modal xD. Modal instace is available everywhere with `getModal(key)` and `useModal()` hook.
- Accessibility out-of-the-box, with progressive enhancement like no other modals!
- Feature rich, while having small package size
- Awesome animation with high reliability!
- Reliable, doesn't matter how many modal are opened or closed concurrently. Nothing will break! a task queue manager handle all complicated siltation in global scope for all Modal instances.
- Bottom-Sheet mode, with drag enabled and snap to defined positions!
- Dialog mode, which make visualizing a Notification system trivial task.
- Window mode, make UI with floating windows all around with ease!
- First modal with stacking context: add as many step (modal-sheets) to your modal as you like, all come with awesome transitions!
- One Modals instance is aware of its stacking context (modal-sheets) and also aware of other Modal instance in the documents, such that it deliver accessible user interface even in complicated situation.

Nested modals!? but..
> Nested modals aren’t supported as we believe them to be poor user experiences.
>
> *source: [Bootstrap modal](https://getbootstrap.com/docs/5.3/components/modal/)*

One Modal takes different approach by making nested modal accessible and awesome user experience! While being in a stacked context by itself!

## Accessibility (A11y)

One Modal follow the [guidelines](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) defined by Web Accessibility Initiative - WAI as part of ARIA - W3C specification for an accessible modal, and state-of-the-art practices that has been used by newly introduced `<dialog>` element.

It uses it own [progressively enhanced focus management](/docs/focus.md) solution and helper attribute `aria-modal="true"` and `role="dialog"` to hide element from Accessibility DOM tree.

On Dialog mode: `aria-modal="false` and interaction with page elements is allowed, following the semantic that has been used by `<dialog>` element through `dialog.showModal()` and `dialog.show()`

Ability to pass `aria-x` (eg. `aria-labelledby`, `aria-describedby`, `aria-label`) attributes for modal-sheet html on `push`/`transit`/`show`. This can be added for all modal-sheets within a `Modal` instance by defining them in `attributesSheet` prop, or for a specific modal-sheet through passing `attributes` option when calling `push`/`transit`/`show`.

For more detail, please read [One Modal - Focus Management](/docs/focus.md).

## What is new?

- [x] Auto load css when importing component, no need to import stylesheet separably
- [x] All control functions (push/pop/close/show/hide) are using promises and resolve when animation is done
- [x] handle all errors using `setModalErrorHandler`
- [x] Enhanced accessibility!
- [x] handle concurrent push/pop (Promise chaining)
- [x] Move to TypeScript
- [x] Disable page scroll when modal is open
- [x] Add `back`, `next` control functions to traverse the stack while keeping all components live
- [x] Add `silent` option to `push`, to not update the active sheet when appending the given sheet
- [x] Add `last` option to `push`, to always append the given modal-sheet to last position in `silent` mode
- [x] Add `last` option to `pop`, to always pop the last sheet in stack
- [x] Close using ESC or clicking outside the modal (Optionally)
- [ ] Local modal, for part of the DOM tree [WIP]
- [ ] Dialog mode [WIP]
- [ ] Window mode,  where modal-sheets should behave like window that can be interact with, change focus from one to another to make it on top of all other elements, and support dragging [WIP]

## Getting Started

```bash
npm install --save react-one-modal
```

Then..

Create new instance of `Modal` on any component. This `Modal` instance will appear on the bottom of `body` element by default, and it preserves the React Context of its contents to where it has been defined.

```jsx
import Modal, { bindModal } from 'react-one-modal'

const App = () => {
  const [modal, modalRef] = bindModal('my-modal')
  ...

  return (
    <>
      <button onClick={() => modal.show(<MyComponent />)}>
        Show floating modal
      </button>
      ...

      <Modal ref={modalRef} />
    </>
  )
}
```

By using `bindModal`, you can bind this `Modal` instance to the given key in its argument (eg. `my-modal`) using the returned `ref` object. Then you can use `modal` to access the the functionality of the bounded `Modal` directly in this component.

To facilitate accessing your defined modals, One Modal does manage its own state. Calling `getModal(key)` on any component, gives access the bounded of `Modal` instance with the given key.

```jsx
import { useModal } from 'react-one-modal'

const MyComponent = () => {
  const modal = getModal('my-modal')
  ...

  return (
    <>
      ...
      <button onClick={() => { modal.push(<MyComponentStep2 />) }}>
        Next Step
      </button>

      <button onClick={() => { modal.empty() }}>
        Close
      </button>
    </>
  )
}
```

For use cases where a modal is needed for one-time use, an anonymous modal can be defined and used directly via `useModal` hook without binding it to any key.

```jsx
import Modal, { useModal } from 'react-one-modal'

const MyComponent = () => {
  const modal = getModal()
  const [confirmModal, confirmModalRef] = useModal()
  ...

  return (
    <>
      ...

      <Modal ref={confirmModalRef} >
        <p> Are you sure  </p>
        <button onClick={() => {
          // do some action!
          confirmModal.hide()
        }}>
          Confirm
        </button>
        <button onClick={() => { confirmModal.empty() }}>
          Close
        </button>
      </Modal>
    </>
  )
}
```

## API

See [One Modal - API](/docs/api.md)

## Examples

See [One Modal - Examples](/docs/examples.md)

## Roadmap

See [One Modal - Roadmap](/docs/roadmap.md)

## One Modal and `<dialog>` element

One Modal should be a replacement for `<dialog>` html element with regards to behavior and not API, it should mimic `<dialog>` even in edge cases or add statement otherwise. Please find the known differences in [behavior here](/docs/dialog-diff.md).

### Made with ❤️ at [Schuttelaar & Partners](https://github.com/schuttelaar)

MIT License © [MahmoudRe](https://github.com/MahmoudRe) @ [Schuttelaar & Partners](https://github.com/schuttelaar)
