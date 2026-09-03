# No-build Preact components

Import `html`, hooks and standard components from `./index.js`. The shared
`react.js` entry owns the HTM/Preact runtime; consumers must not import another copy.
Styles are provided separately by the sibling `stylesheets` library.

## Button

`Button({ type = 'button', variant = 'normal', className, text, children, ...nativeProps })`

- `type` accepts native `button`, `submit`, `reset`. The default does not submit forms.
- `variant` selects the CSS variant (`primary`, `secondary`, etc.).
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

`Dialog({ open, onClose, onCancel, className, children, ...dialogProps })`

Controlled native modal dialog: set `open`, and set it false in `onClose` (including Escape).
`onCancel` may prevent the native Escape dismissal when a workflow requires it.
Use `aria-labelledby` or `aria-label`; compose native forms and header/body/footer slots
with `.dialog-header`, `.dialog-body`, `.dialog-footer` from `dialog.css`.
Native dialog handles focus containment and return; no custom overlay/focus trap.
