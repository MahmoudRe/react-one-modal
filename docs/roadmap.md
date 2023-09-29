# One Modal - Roadmap

## To Do List

- [ ] Notification style modal (auto hide with optional close button)
- [ ] Confirm style modal (Two bottom with callback + auto close)
- [ ] Windows mode (part of Dialog mode), z-index is updated when focus moves between windows (modal-sheets) to be the highest on the focused window (modal).
- [ ] Write proper documentation
- [ ] Drawer style (generalization of bottom-sheet mode)
- [ ] Push array of items, push through children
- [ ] none-reactive `open` attribute for default open/close when modal is mounted (with no animation).
- [ ] check if animation has ended or cancelled
- [ ] animation API (open, close, between)
- [ ] changing animation when modal open causes animation replay
- [ ] set mutation observer on the parent element to add inert for element that is added to DOM dynamically while modal is open
- [ ] fix onESC pressed when focus on body!
- [x] store list of ids of inert cased modals (first modal closes removing inert that needed by another modal that has opened after the first one!)
- [ ] force update after changing disable attribute in animation.current
- [ ] when `highestOpenedModal` closes modal underneath, the modal underneath should close silent with focus.stop() and focus.remain() and figuring out where focus was previously
- [ ] check for an element with autofocus before setting the focus on the first element
- [ ] if no focusable element existed, focus the modal element itself! (think about the case of local modal which hide element that is focusable, clicking `Tab` and `Tab`+`Shift` should return the focus on the area of interaction)
- [ ] consider only tabbable element when setting the focus on first or last element in the modal. See this... <https://github.com/focus-trap/tabbable#more-details>. (Mostly keep the current way since it take care of all edge cases be attempting focus approach and only exclude element with tabindex="-1")
- [ ] fallback if inert isn't supported (this solution should be lighter than having a complete polyfill for the `inert`). The user of this library can opt-in to add polyfill for `inert` manually if he keen for unified user experience. (Think also about local modal functionality!)
- [ ] fix edge case where the first focusable element in modal might cause scroll (button after long paragraph!)