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

    // Color picker
    const colors = document.createElement("div");
    colors.className = "colors";

    [
  "#fde047", // yellow
  "#86efac", // green
  "#93c5fd", // blue
  "#f9a8d4", // pink
  "#c4b5fd"  // purple
].forEach(c => {

      const dot = document.createElement("div");
      dot.className = "color";
      dot.style.backgroundColor = c;
      dot.title = c;


      dot.addEventListener("click", () => {
        chrome.storage.local.get("highlights", res => {
          const all = res.highlights || [];
          const index = all.findIndex(x => x.id === h.id);

          if (index !== -1) {
            all[index].color = c;

            chrome.storage.local.set({ highlights: all }, () => {
              chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
                chrome.tabs.sendMessage(tabs[0].id, {
                  type: "UPDATE_COLOR",
                  text: h.text,
                  color: c
                });
              });
            });
          }
        });
      });

      colors.appendChild(dot);
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
    container.appendChild(colors);     
    container.appendChild(textarea);
    list.appendChild(container);
  });
});
