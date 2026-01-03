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
    container.style.backgroundColor = h.color || "#fde047";


    const textDiv = document.createElement("div");
    textDiv.className = "text";
    textDiv.textContent = h.text;
//delete operation
    const deleteBtn = document.createElement("button");
deleteBtn.textContent = "🗑️";
deleteBtn.style.border = "none";
deleteBtn.style.background = "transparent";
deleteBtn.style.cursor = "pointer";
deleteBtn.style.float = "right";

//copy option
const copyBtn = document.createElement("button");
copyBtn.textContent = "📋";
copyBtn.style.border = "none";
copyBtn.style.background = "transparent";
copyBtn.style.cursor = "pointer";
copyBtn.style.marginRight = "6px";

//func copy

copyBtn.addEventListener("click", async () => {
  const content = [
    `"${h.text}"`,
    h.note ? `\nNote: ${h.note}` : "",
    `\nSource: ${h.url}`
  ].join("");

  await navigator.clipboard.writeText(content);

  copyBtn.textContent = "✅";
  setTimeout(() => (copyBtn.textContent = "📋"), 800);
});

    textDiv.addEventListener("click", () => {
  chrome.tabs.query({}, tabs => {
    const existingTab = tabs.find(t => t.url === h.url);

    if (existingTab) {
      // Switch to existing tab
      chrome.tabs.update(existingTab.id, { active: true }, () => {
        chrome.tabs.sendMessage(existingTab.id, {
          type: "SCROLL_TO_TEXT",
          text: h.text
        });
      });
    } else {
      // Open new tab and scroll after load
      chrome.tabs.create({ url: h.url }, tab => {
        const listener = (tabId, info) => {
          if (tabId === tab.id && info.status === "complete") {
            chrome.tabs.sendMessage(tab.id, {
              type: "SCROLL_TO_TEXT",
              text: h.text
            });
            chrome.tabs.onUpdated.removeListener(listener);
          }
        };

        chrome.tabs.onUpdated.addListener(listener);
      });
    }
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

    //delete
deleteBtn.addEventListener("click", () => {
  chrome.storage.local.get("highlights", res => {
    const all = res.highlights || [];
    const updated = all.filter(x => x.id !== h.id);

    chrome.storage.local.set({ highlights: updated }, () => {
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: "DELETE_HIGHLIGHT",
          text: h.text
        });
      });

      container.remove(); // remove from sidebar instantly
    });
  });
});

    container.appendChild(copyBtn);
container.appendChild(deleteBtn);
container.appendChild(textDiv);
container.appendChild(colors);
container.appendChild(textarea);
    list.appendChild(container);
  });
});
