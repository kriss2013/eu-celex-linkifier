// content.js — MVP version using a state machine to track legal type context

let celexMap = {};
let patterns = [];

// Load CELEX map and regex patterns from config
async function loadConfig() {
  const [mapRes, patRes] = await Promise.all([
    fetch(chrome.runtime.getURL("celex-map.json")),
    fetch(chrome.runtime.getURL("patterns.json"))
  ]);
  celexMap = await mapRes.json();
  patterns = await patRes.json();
  console.log("🗺️ Loaded", Object.keys(celexMap).length, "CELEX map entries");
  console.log("📐 Loaded", patterns.length, "regex patterns");
}

function normalizeYear(y) {
  const yy = parseInt(y);
  return yy < 100 ? (yy > 30 ? `19${yy}` : `20${yy}`) : `${yy}`;
}

function buildCelex(year, type, number) {
  const celex = `3${normalizeYear(year)}${type}${String(number).padStart(4, "0")}`;
  return `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:${celex}`;
}

function getMappedCelex(refKey) {
  const clean = refKey.replace(/\s+/g, '').toUpperCase();
  return celexMap[clean] ? `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:${celexMap[clean]}` : null;
}

function processTextNode(textNode, state) {
  let text = textNode.nodeValue;
  let replaced = false;

  const keywords = {
    'Regulation': 'R',
    'Regulations': 'R',
    'Directive': 'L',
    'Directives': 'L',
    'Decision': 'D',
    'Decisions': 'D'
  };

  // Detect context first
  for (const k in keywords) {
    if (text.includes(k)) {
      console.log("🧭 Switching context to:", k);
      state.currentType = keywords[k];
    }
  }

  for (const rule of patterns) {
    const regex = new RegExp(rule.pattern, "gi");
    text = text.replace(regex, (match, ...groups) => {
      const refKey = groups.slice(0, 3).join('/').replace(/\s+/g, '').toUpperCase();
      let celex = getMappedCelex(refKey);

      const effectiveType = rule.type || state.currentType;

      if (!celex && effectiveType && groups.length >= 2) {
        let yearRaw, numberRaw;

        console.log("🧪 Captured groups:", groups);
        console.log("🧭 Rule groupOrder:", rule.groupOrder);
        if (rule.groupOrder?.length >= 2) {
          const idxYear = rule.groupOrder.findIndex(x => x === "year");
          const idxNumber = rule.groupOrder.findIndex(x => x === "number");
          yearRaw = groups[idxYear];
          numberRaw = groups[idxNumber];
        } else {
          // fallback assumption
          yearRaw = groups[0];
          numberRaw = groups[1];
        }
        console.log("year: ",yearRaw);
        console.log("number: ",numberRaw);

        if (/^\d{2,4}$/.test(yearRaw) && /^\d+$/.test(numberRaw)) {
          celex = buildCelex(yearRaw, effectiveType, numberRaw);
          console.log(`📦 Guessed CELEX: ${celex} (type: ${effectiveType}, year: ${yearRaw}, number: ${numberRaw})`);
        } else {
          console.warn("🚫 Invalid CELEX parts:", yearRaw, numberRaw);
        }
      }

      if (celex) {
        console.log(`🔗 Matched ${match} → ${celex}`);
        replaced = true;
        return `<a href="${celex}" target="_blank" rel="noopener noreferrer">${match}</a>`;
      }

      return match;
    });
  }

  if (replaced) {
    const span = document.createElement("span");
    span.innerHTML = text;
    textNode.parentNode.replaceChild(span, textNode);
  }
}

function walkDOMWithState() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
  const state = { currentType: null };
  let node;
  while ((node = walker.nextNode())) {
    const parent = node.parentNode;
    const isHidden = parent && (
      parent.offsetParent === null ||
      window.getComputedStyle(parent).display === 'none' ||
      window.getComputedStyle(parent).visibility === 'hidden' ||
      parent.classList.contains('hidden')
    );
    if (!isHidden && node.nodeValue.match(/\d{2,4}\/\d{1,4}/)) {
      processTextNode(node, state);
    }
  }
}

loadConfig().then(() => walkDOMWithState());
