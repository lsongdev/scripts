# No-build Preact components

Import `html`, hooks and standard components from `./index.js`. The shared
`react.js` entry owns the HTM/Preact runtime; consumers must not import another copy.
It serves Preact, its hooks and HTM from copies beside it (`preact.js`,
`preact-hooks.js`, `htm.js`), pinned in `package.json` and generated from the
npm packages when this package is packed, so pages work offline and nothing
loads from a CDN. In a checkout, run `npm run vendor` first.
Styles are provided separately by the sibling `stylesheets` library.

## Button

`Button({ type = 'button', variant = 'normal', className, text, children, ...nativeProps })`

- `type` accepts native `button`, `submit`, `reset`. The default does not submit forms.
- `variant` selects the CSS variant (`primary`, `secondary`, etc.); `size` is `small` or `large`.
- Legacy `type="primary"` remains a visual variant and uses native `type="button"`.
- Native events, disabled, name/value, form, title, data and ARIA attributes are forwarded.
- `text` remains supported; otherwise use children. No app-specific loading policy.

## Link, Panel and List

Use `Link` for anchors (`to` alias or native `href`, plus native props).
`Panel` accepts title/header/footer slots and children; native root props are forwarded.
`List` and `ListItem` support children, native props and the existing content slots.
Load `panel.css` and `list.css` from stylesheets for their standard structure.

## RangeField

`RangeField({ id, label, value, defaultValue, formatValue = String, className, inputClassName, ...inputProps })`

Uses a native range inside its label. Pass controlled `value` and `onInput`, or
`defaultValue` for an uncontrolled input. Controlled values show an output formatted
by `formatValue`. Native min/max/step/disabled/ARIA and events are forwarded.
`className` styles the field; `inputClassName` styles the range. Load `range.css`.
The default input accessible name is label; override with `aria-label` if label is a VNode.

## Dialog

`Dialog({ open, onClose, onCancel, title, footer, closeLabel = 'Close', closeOnBackdrop = true, className, children, ...dialogProps })`

Controlled native modal built on `dom/dialog.js`: set `open`, and set it false in `onClose`,
which also runs for Escape, any `[data-dialog-close]` button and a backdrop click (a press
that starts and ends outside the dialog). Focus returns to where it was when the dialog closes.
With `title` or `footer`, content goes into the `.dialog-header`, `.dialog-body` and
`.dialog-footer` slots of `dialog.css`, with a close button; otherwise children fill the dialog.
`onCancel` may prevent the native Escape dismissal. Unrendering an open dialog closes it.

`openDialog(render)` renders `render(close)` in the application's `DialogHost` until `close()`
is called, for dialogs opened from event handlers or after an async step.

## Feedback

- `Alert({ variant, error, children })`: `variant` is `info` (default), `success`, `warning`
  or `danger`; an `error` without children shows its message as a danger alert. Renders
  nothing when given neither. `alert.css`.
- `Badge({ variant, dot, children })`: `variant` is `info`, `success`, `warning` or `danger`;
  `dot` adds a `.badge-dot`. `badge.css`.
- `Spinner()`, `Loading({ children = 'Loading…' })`: `spinner.css`. `Empty({ children })`: `utils.css`.
- `toast(message, variant)` shows a message in the application's `Toaster`; `variant` is
  `info`, `success` or `danger`. The stack is a manual popover so it shows above modal
  dialogs. `toast.css`.

## Forms

- `Field({ label, hint, error, required, children })` labels a control; `error` replaces the hint.
- `Check({ label, ...inputProps })` is a checkbox (or `type="radio"`) with its label.
- `ListInput({ values, onChange, placeholder, inputClassName, removeLabel })` edits a list of
  strings, keeping one empty row to type in.

All three use `field.css`.

## Layout and content

- `PageHeader({ title, subtitle, actions, back })`: `back` is `{ href, label }`, a return
  link at the far right of the title row that stays there on narrow screens. `page.css`.
- `Sidebar({ brand, href, mark, items, footer, collapsible, storageKey, menuClassName })`: side navigation over one menu
  tree. Links are `{ href, title, icon, badge, active, items }`; groups are
  `{ id, title, icon, items, open }` and render as `<li class="menu-group">` with a
  `.menu-heading` (icon and label, sized like a link) and a list of their own. `collapsible` makes headings disclosure buttons (groups start open
  unless `open: false`; the group holding the active link opens). Its toggle collapses it to
  icons on wide screens, where each group is one icon (its `icon`, or its first link's) whose
  links open in a panel beside the sidebar on hover, click or Enter; on narrow screens it
  opens as a menu, closing again on a link or Escape. `storageKey` remembers (in
  `localStorage`) whether it is collapsed to icons and which groups are open. `menuClassName` adds classes to the menu list for an application's own look. `sidebar.css` and
  `menu.css`.
- `Navbar({ brand, href, mark, items, children })`: top navigation; items are
  `{ href, title, active }`, children trail on the right. `navbar.css`.
- `FormSection({ title, description, children })`: a titled `fieldset` of fields. `field.css`.
- `Tabs({ tabs, active, onChange })`: `tabs` are `[id, label]` pairs or `{ id, label }`
  objects; the current tab has `aria-selected="true"`. `tabs.css`.
- `Table({ framed = true, children })`: a `.table` in a `.table-scroll` container, which scrolls
  sideways on narrow screens instead of wrapping cells; `framed` draws a border (use `false`
  inside a card). `table.css`.
- `KeyValue({ items })`: a definition list from `[label, value]` pairs, skipping empty
  values. `key-value.css`.
- `Terminal({ load, css, connect, readOnly, options, onError })`: xterm.js in a
  `.terminal-frame`, fitted to it. `load` resolves to `{ Terminal, FitAddon }` from the app's
  copy of xterm and `css` is its xterm.css URL (added to the document or the shadow root it
  renders in). `connect(term)` attaches the session and returns a function that detaches it;
  remount with a new `key` to reconnect. `log.css`.
- `LogView({ lines, follow, empty, ansi, renderLine, lineKey })`: `lines` are strings or
  `{ text, stream, className, key }` objects; `stream: 'stderr'` marks a line. Follows new
  lines while scrolled to the end. `ansi` renders terminal colours (`text/ansi.js`);
  `renderLine(line, i)` draws structured entries. It does not fetch: feed it from polling or
  from `useLineStream`. `log.css`.

## Live lines

`useLineStream(source, { max })` (`hooks/line-stream.js`) follows a source and returns
`{ lines, status, error, clear }`, batching lines per frame and keeping the newest `max`.
Sources: `sseLines(url, { event, parse, endEvent, errorEvent })`, `webSocketLines(url, { parse })`
and `fetchLines(url, { parse, init })`; `parse(text)` turns a message or line into a line, an
array of them or null. Any `{ key, open(sink) }` object is a source too, for another transport
or protocol.

## Actions

- `CopyButton({ text, label, copiedLabel })` copies to the clipboard (secure contexts only).
- `ConfirmButton({ label, title, description, checkbox, confirmLabel, cancelLabel, danger, onConfirm })`
  asks in a dialog before running `onConfirm(checked)`; a rejected promise shows its error in
  the dialog.

Every component takes English default labels; pass the label props to translate them.
