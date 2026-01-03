const list = document.getElementById("list");
const searchInput = document.getElementById("search");

let ALL_HIGHLIGHTS = [];
let SELECTED = new Set();

/* Load highlights */
chrome.storage.local.get("highlights", result => {
  ALL_HIGHLIGHTS = result.highlights || [];
  renderHighlights(ALL_HIGHLIGHTS);
});

/* Render highlights */
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

    /* Actions row */
    const actions = document.createElement("div");
    actions.className = "actions";

    const copyBtn = iconBtn("📋");
    const deleteBtn = iconBtn("🗑️");
    const noteBtn = iconBtn(h.note ? "📝" : "➕");

    /* Copy */
    copyBtn.onclick = async () => {
      const content =
        `"${h.text}"\n` +
        (h.note ? `Note: ${h.note}\n` : "") +
        `Source: ${h.url}`;

      await navigator.clipboard.writeText(content);
      copyBtn.textContent = "✅";
      setTimeout(() => (copyBtn.textContent = "📋"), 700);
      pulse(container);
    };

    /* Delete */
    deleteBtn.onclick = () => {
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
    };

    actions.append(copyBtn, deleteBtn, noteBtn);

    /* Text */
    const textDiv = document.createElement("div");
    textDiv.className = "text";
    textDiv.textContent = h.text;

    textDiv.onclick = () => {
      chrome.tabs.query({}, tabs => {
        const tab = tabs.find(t => t.url === h.url);
        if (tab) {
          chrome.tabs.update(tab.id, { active: true }, () => {
            chrome.tabs.sendMessage(tab.id, {
              type: "SCROLL_TO_TEXT",
              text: h.text
            });
          });
        } else {
          chrome.tabs.create({ url: h.url }, tab => {
            const listener = (id, info) => {
              if (id === tab.id && info.status === "complete") {
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
    };

    /* Colors */
    const colors = document.createElement("div");
    colors.className = "colors";

    ["#fde047", "#86efac", "#93c5fd", "#f9a8d4", "#c4b5fd"].forEach(c => {
      const dot = document.createElement("div");
      dot.className = "color";
      dot.style.backgroundColor = c;
      dot.title = c;

      dot.onclick = () => {
        chrome.storage.local.get("highlights", res => {
          const all = res.highlights || [];
          const i = all.findIndex(x => x.id === h.id);
          if (i !== -1) {
            all[i].color = c;
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
      };

      colors.appendChild(dot);
    });

    /* Floating note panel */
const notePanel = document.createElement("div");
notePanel.className = "note-panel";
notePanel.style.display = "none";

const textarea = document.createElement("textarea");
textarea.placeholder = "Write a note…";
textarea.value = h.note || "";

/* ONLY OPEN IF NOTE HAS REAL CONTENT */
if (h.note && h.note.trim().length > 0) {
  notePanel.style.display = "block";
}

noteBtn.onclick = () => {
  notePanel.style.display =
    notePanel.style.display === "none" ? "block" : "none";
};

textarea.onchange = () => {
  chrome.storage.local.get("highlights", res => {
    const all = res.highlights || [];
    const i = all.findIndex(x => x.id === h.id);
    if (i !== -1) {
      all[i].note = textarea.value;
      chrome.storage.local.set({ highlights: all });
    }
  });
};

notePanel.appendChild(textarea);


    container.append(actions, textDiv, colors, notePanel);
    list.appendChild(container);
  });
}

/* Search */
searchInput.addEventListener("input", e => {
  const q = e.target.value.toLowerCase();
  renderHighlights(
    ALL_HIGHLIGHTS.filter(h =>
      h.text.toLowerCase().includes(q) ||
      (h.note && h.note.toLowerCase().includes(q)) ||
      h.url.toLowerCase().includes(q)
    )
  );
});

/* Helpers */
function iconBtn(txt) {
  const b = document.createElement("button");
  b.textContent = txt;
  b.className = "icon-btn";
  return b;
}

function pulse(el) {
  el.style.outline = "2px solid rgba(99,102,241,0.4)";
  setTimeout(() => (el.style.outline = ""), 500);
}
