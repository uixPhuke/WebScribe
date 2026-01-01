// alert("WebScribe is running");
document.addEventListener("mouseup", () => {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) return;

  const range = selection.getRangeAt(0);

  const mark = document.createElement("mark");
  mark.style.backgroundColor = "yellow";

  try {
    range.surroundContents(mark);
    selection.removeAllRanges();
  } catch {
    // Ignore invalid selections
  }
});
