
export const read = () => {
  return navigator.clipboard.read();
}

export const readText = () => {
  return navigator.clipboard.readText();
};

export const write = data => {
  return navigator.clipboard.write(data);
};

export const writeText = text => {
  return navigator.clipboard.writeText(text);
};

export const copyExecCommand = content => {
  // Put the text to copy into a <span>
  const span = document.createElement('span')
  span.textContent = content;
  // Preserve consecutive spaces and newlines
  span.style.whiteSpace = 'pre'
  span.style.userSelect = 'all'
  // Add the <span> to the page
  document.body.appendChild(span)
  // Make a selection object representing the range of text selected by the user
  const selection = window.getSelection()
  const range = window.document.createRange()
  selection.removeAllRanges()
  range.selectNode(span)
  selection.addRange(range)
  // Copy text to the clipboard
  let success = false
  try {
    success = window.document.execCommand('copy')
  } finally {
    // Cleanup
    selection.removeAllRanges()
    window.document.body.removeChild(span)
  }
  return success;
};

export const copy = async content => {
  try {
    await writeText(content);
  } catch(err) {
    await copyExecCommand(content);
  }
};
