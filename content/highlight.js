document.addEventListener("mouseup", async () => {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) return;

  const text = selection.toString().trim();
  if (!text) return;

  const range = selection.getRangeAt(0);
  const mark = document.createElement("mark");
  mark.style.backgroundColor = "yellow";

  try {
    range.surroundContents(mark);
    selection.removeAllRanges();
  } catch {
    return;
  }

  const highlight = {
    id: crypto.randomUUID(),
    text,
    url: location.href,
    createdAt: Date.now()
  };

  const result = await chrome.storage.local.get("highlights");
  const highlights = result.highlights || [];

  highlights.push(highlight);

  await chrome.storage.local.set({ highlights });
});
