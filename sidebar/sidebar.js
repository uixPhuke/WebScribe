const list = document.getElementById("list");

chrome.storage.local.get("highlights", result => {
  const highlights = result.highlights || [];

  if (!highlights.length) {
    list.innerHTML = `<div class="empty">No highlights yet</div>`;
    return;
  }

  highlights.forEach(h => {
    const container = document.createElement("div");
    container.className = "highlight";

    const textDiv = document.createElement("div");
    textDiv.className = "text";
    textDiv.textContent = h.text;

    textDiv.addEventListener("click", () => {
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: "SCROLL_TO_TEXT",
          text: h.text
        });
      });
    });

    const textarea = document.createElement("textarea");
    textarea.placeholder = "Add a note…";
    textarea.value = h.note || "";

    textarea.addEventListener("change", () => {
      chrome.storage.local.get("highlights", res => {
        const all = res.highlights || [];
        const index = all.findIndex(x => x.id === h.id);
        if (index !== -1) {
          all[index].note = textarea.value;
          chrome.storage.local.set({ highlights: all });
        }
      });
    });

    container.appendChild(textDiv);
    container.appendChild(textarea);
    list.appendChild(container);
  });
});
