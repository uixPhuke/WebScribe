
 // Helper functions
 

// Check if selection is already inside a <mark>
function isInsideHighlight(node) {
  while (node) {
    if (node.nodeType === 1 && node.tagName === "MARK") return true;
    node = node.parentNode;
  }
  return false;
}

// Check if the same text on the same URL is already saved
async function isDuplicate(text, url) {
  const result = await chrome.storage.local.get("highlights");
  const highlights = result.highlights || [];
  return highlights.some(h => h.text === text && h.url === url);
}


// Restore highlights on page load

async function restoreHighlights() {
  const result = await chrome.storage.local.get("highlights");
  const highlights = result.highlights || [];

  highlights
    .filter(h => h.url === location.href)
    .forEach(h => {
      const bodyHTML = document.body.innerHTML;

      if (bodyHTML.includes(h.text)) {
        document.body.innerHTML = bodyHTML.replace(
          h.text,
          `<mark style="background: yellow">${h.text}</mark>`
        );
      }
    });
}

// Restore when page loads
restoreHighlights();

//
 //Create new highlight
//
document.addEventListener("mouseup", async () => {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) return;

  const text = selection.toString().trim();
  if (!text) return;

  const range = selection.getRangeAt(0);

  // Ignore clicks inside an existing highlight
  if (isInsideHighlight(range.startContainer)) {
    selection.removeAllRanges();
    return;
  }

  // Prevent duplicate highlights
  if (await isDuplicate(text, location.href)) {
    selection.removeAllRanges();
    return;
  }

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
  createdAt: Date.now(),
  note: ""
};


  const result = await chrome.storage.local.get("highlights");
  const highlights = result.highlights || [];

  highlights.push(highlight);

  await chrome.storage.local.set({ highlights });
});
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "SCROLL_TO_TEXT") {
    const marks = document.querySelectorAll("mark");
    for (const mark of marks) {
      if (mark.innerText === message.text) {
        mark.scrollIntoView({ behavior: "smooth", block: "center" });
        mark.style.outline = "2px solid orange";
        setTimeout(() => (mark.style.outline = ""), 1500);
        break;
      }
    }
  }
});
