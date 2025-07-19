// content.js — Clean version without external patterns.json

let celexMap = {};

async function loadConfig() {
  const res = await fetch(chrome.runtime.getURL("celex-map.json"));
  celexMap = await res.json();
  console.log("🗺️ Loaded", Object.keys(celexMap).length, "CELEX map entries");
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

function tokenize(text) {
  return text.match(/(\d{2,4}\/\d{1,4}|\w+|No|[()\s]+)/g) || [];
}

function isTypeKeyword(token) {
  const map = {
    'Directive': 'L',
    'Directives': 'L',
    'Regulation': 'R',
    'Regulations': 'R',
    'Decision': 'D',
    'Decisions': 'D'
  };
  return map[token] || null;
}

function processTextNodeWithParser(textNode, state) {
  const text = textNode.nodeValue;
  const tokens = tokenize(text);
  const resultHTML = [];


  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    const newType = isTypeKeyword(token);
    if (newType) {
      state.currentType = newType;
      resultHTML.push(token);
      continue;
    }

    let year, number, matched = false;
    let combined = "";

    if (token === "No") {
      let j = i + 1;
      // Skip spaces
      while (tokens[j] && /^\s+$/.test(tokens[j])) j++;

      if (tokens[j] && /^\d{1,4}\/\d{2,4}$/.test(tokens[j])) {
        const [num, yr] = tokens[j].split("/");
        number = num;
        year = normalizeYear(yr);
        combined = token + " " + tokens[j];
        i = j; // advance i to skip the number
        matched = true;
      }
    }


    // Match 94/22 or 2013/34
    if (!matched && /^\d{2,4}\/\d{1,4}$/.test(token)) {
      const [yr, num] = token.split("/");
      year = normalizeYear(yr);
      number = num;
      combined = token;
      matched = true;
    }

    if (matched && state.currentType && /^\d+$/.test(number) && /^\d+$/.test(year)) {
      const refKey = `${year}/${number}`;
      let celex = getMappedCelex(refKey);
      if (!celex) {
        celex = buildCelex(year, state.currentType, number);
      }
      const safe = combined.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const link = `<a href="${celex}" target="_blank" rel="noopener noreferrer">${safe}</a>`;
      resultHTML.push(link);
    } else if (!matched) {
      resultHTML.push(token);
    }
  }

  const span = document.createElement("span");
  span.innerHTML = resultHTML.join("");
  textNode.parentNode.replaceChild(span, textNode);
}

function walkDOMWithParser() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
  const nodes = [];

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
      nodes.push(node);
    }
  }

  const state = { currentType: null };
  for (const node of nodes) {
    if (!document.body.contains(node)) continue;
    processTextNodeWithParser(node, state);
  }
}

loadConfig().then(() => walkDOMWithParser());
