const list = document.getElementById("list");
const searchInput = document.getElementById("search");
const exportBtn = document.getElementById("exportDocx");
let SELECTED = new Set();


let ALL_HIGHLIGHTS = [];

/*
 * Load highlights
*/
chrome.storage.local.get("highlights", result => {
  ALL_HIGHLIGHTS = result.highlights || [];
  renderHighlights(ALL_HIGHLIGHTS);
});

/* Render highlights
*/
function renderHighlights(highlights) {
  list.innerHTML = "";

  if (!highlights.length) {
    list.innerHTML = `<div class="empty">No highlights found</div>`;
    return;
  }

  highlights.forEach(h => {
    const container = document.createElement("div");
    container.className = "highlight";
    container.style.backgroundColor = h.color || "#fde047";

//check
    const checkbox = document.createElement("input");
checkbox.type = "checkbox";
checkbox.style.marginRight = "6px";

checkbox.addEventListener("change", () => {
  checkbox.checked ? SELECTED.add(h.id) : SELECTED.delete(h.id);
});

    /******** Text ********/

    const textDiv = document.createElement("div");
    textDiv.className = "text";
    textDiv.textContent = h.text;

    textDiv.addEventListener("click", () => {
      chrome.tabs.query({}, tabs => {
        const existingTab = tabs.find(t => t.url === h.url);

        if (existingTab) {
          chrome.tabs.update(existingTab.id, { active: true }, () => {
            chrome.tabs.sendMessage(existingTab.id, {
              type: "SCROLL_TO_TEXT",
              text: h.text
            });
          });
        } else {
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

    /******** Copy ********/
    const copyBtn = document.createElement("button");
    copyBtn.textContent = "📋";
    styleIcon(copyBtn);

    copyBtn.addEventListener("click", async () => {
      const content =
        `"${h.text}"\n` +
        (h.note ? `Note: ${h.note}\n` : "") +
        `Source: ${h.url}`;

      await navigator.clipboard.writeText(content);
      copyBtn.textContent = "✅";
      setTimeout(() => (copyBtn.textContent = "📋"), 800);
    });

    /******** Delete ********/
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑️";
    styleIcon(deleteBtn);

    deleteBtn.addEventListener("click", () => {
      chrome.storage.local.get("highlights", res => {
        const updated = (res.highlights || []).filter(x => x.id !== h.id);

        chrome.storage.local.set({ highlights: updated }, () => {
          chrome.tabs.query({}, tabs => {
            const tab = tabs.find(t => t.url === h.url);
            if (tab) {
              chrome.tabs.sendMessage(tab.id, {
                type: "DELETE_HIGHLIGHT",
                text: h.text
              });
            }
          });

          ALL_HIGHLIGHTS = updated;
          renderHighlights(updated);
        });
      });
    });

    /******** Color picker ********/
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
              chrome.tabs.query({}, tabs => {
                const tab = tabs.find(t => t.url === h.url);
                if (tab) {
                  chrome.tabs.sendMessage(tab.id, {
                    type: "UPDATE_COLOR",
                    text: h.text,
                    color: c
                  });
                }
              });

              ALL_HIGHLIGHTS = all;
              renderHighlights(all);
            });
          }
        });
      });

      colors.appendChild(dot);
    });

    /******** Notes ********/
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

    /******** Append ********/
    container.appendChild(checkbox);
    container.appendChild(copyBtn);
    container.appendChild(deleteBtn);
    container.appendChild(textDiv);
    container.appendChild(colors);
    container.appendChild(textarea);

    list.appendChild(container);
  });
}

/*
 * Search
*/
searchInput.addEventListener("input", e => {
  const q = e.target.value.toLowerCase();

  const filtered = ALL_HIGHLIGHTS.filter(h =>
    h.text.toLowerCase().includes(q) ||
    (h.note && h.note.toLowerCase().includes(q)) ||
    h.url.toLowerCase().includes(q)
  );

  renderHighlights(filtered);
});

/*
 * Helpers
*/
function styleIcon(btn) {
  btn.style.border = "none";
  btn.style.background = "transparent";
  btn.style.cursor = "pointer";
  btn.style.marginRight = "6px";
}


//export logic
exportBtn.addEventListener("click", () => {
  const selected = ALL_HIGHLIGHTS.filter(h => SELECTED.has(h.id));

  if (!selected.length) {
    alert("Select at least one highlight");
    return;
  }

  const html = `
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial; }
        h2 { margin-bottom: 4px; }
        p { margin: 6px 0; }
        .note { color: #555; font-style: italic; }
        hr { margin: 12px 0; }
      </style>
    </head>
    <body>
      ${selected
        .map(
          h => `
          <h2>${escapeHtml(h.text)}</h2>
          ${h.note ? `<p class="note">Note: ${escapeHtml(h.note)}</p>` : ""}
          <p>Source: ${h.url}</p>
          <hr/>
        `
        )
        .join("")}
    </body>
    </html>
  `;

  const blob = new Blob(
    [
      `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:w="urn:schemas-microsoft-com:office:word"
            xmlns="http://www.w3.org/TR/REC-html40">
      ${html}
      </html>
      `
    ],
    { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }
  );

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "WebScribe-Highlights.docx";
  a.click();
  URL.revokeObjectURL(url);
});

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
