import { h, useState } from '../react.js';

/**
 * Copies text to the clipboard and says so for a moment. The Clipboard API
 * needs a secure context; elsewhere the click does nothing.
 */
export function CopyButton({ text, label = 'Copy', copiedLabel = 'Copied', className = 'button button-small', ...props }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable */ }
  };
  return h('button', { type: 'button', ...props, className, onClick: copy }, copied ? copiedLabel : label);
}
