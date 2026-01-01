const list = document.getElementById("list");

chrome.storage.local.get("highlights", result => {
  const highlights = result.highlights || [];

  if (!highlights.length) {
    list.innerHTML = `<div class="empty">No highlights yet</div>`;
    return;
  }

  highlights.forEach(h => {
    const div = document.createElement("div");
    div.className = "highlight";
    div.textContent = h.text;

    div.addEventListener("click", () => {
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: "SCROLL_TO_TEXT",
          text: h.text
        });
      });
    });

    list.appendChild(div);
  });
});
