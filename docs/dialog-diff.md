# One Modal and `<dialog>` differences

The following cases are "To Do" list of behavior that One Modal doesn't match what `<dialog>` behave in that situation. These are tested in Chrome, need test in other browser or lookup specification:

- [ ] If any of the container elements of `<dialog>` has `display: none` style, the dialog won't show up.
  - One Modal always open regardless of any of its parent display style
  - [WIP] test for other cases like collapsed elements!
  - as for `opacity: 0` or `visibility: hidden` on a container of dialog, it will still open
- [ ] If nested `<dialog>` element is opened where the outer `<dialog>` is closed, it should set its state to open but not actually open until the outer `<dialog>` element is also opened. In this case the outer `<dialog>` will be on-top of the nested dialog element
  - One Modal always open regardless it is nested within a collapsible element or not.
- [ ] Visual order of `<dialog>` elements are defined by the time of opening and not their order in the DOM tree. So opening a dialog element will always be on top!
  - One modal will be effected by the order in DOM tree and z-index value. Visual order is determined like two nested modal are normal element each in its own stack-context. The higher z-index and position in DOM tree the higher visual order.
  - [WIP] Test the visual order if `dialog` or their container have different z-index.