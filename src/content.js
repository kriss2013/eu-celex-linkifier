async function loadPatterns() {
  try {
    const response = await fetch(chrome.runtime.getURL("patterns.json"));
    const patterns = await response.json();
    console.log("✅ Loaded patterns:", patterns);
    return patterns;
  } catch (error) {
    console.error("❌ Failed to load patterns.json:", error);
    return [];
  }
}

function normalizeYear(yearStr) {
  const year = parseInt(yearStr);
  return year < 100 ? (year > 30 ? `19${year}` : `20${year}`) : `${year}`;
}

function buildCelex(yearRaw, typeLetter, number) {
  const year = normalizeYear(yearRaw);
  console.log(`🔗 normalized year: ${year}`);
  const celex = `3${year}${typeLetter}${number.padStart(4, "0")}`;
  const url = `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:${celex}`;
  console.log(`🔗 Built CELEX URL: ${url}`);
  return url;
}


function linkify(textNode, patterns) {
  let text = textNode.nodeValue;
  let replaced = false;

  for (const rule of patterns) {
    const regex = new RegExp(rule.pattern, "gi");
    if (regex.test(text)) {
      console.log(`🔍 Match found with pattern: ${rule.name}`);
    }
    text = text.replace(regex, (match, ...groups) => {
      const year = groups[1];
      const number = groups[2];
      const url = buildCelex(year, rule.type, number);
      replaced = true;
      return `<a href="${url}" target="_blank">${match}</a>`;
    });
  }

  if (replaced) {
    const span = document.createElement("span");
    span.innerHTML = text;
    textNode.parentNode.replaceChild(span, textNode);
    console.log("✅ Replaced text node with linked span:", span);
  }
}

function walkDOMAndLinkify(patterns) {
  console.log("🚶 Walking DOM to find matches...");
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
  let node;
  while ((node = walker.nextNode())) {
    const parent = node.parentNode;
    const isHidden = parent && (
      parent.offsetParent === null ||                     // hidden via layout
      window.getComputedStyle(parent).display === 'none' ||  // display: none
      window.getComputedStyle(parent).visibility === 'hidden' || // visibility: hidden
      parent.classList.contains('hidden')                // class-based
    );

    if (!isHidden && node.nodeValue.match(/\d{4}\/\d{1,4}/)) {
      linkify(node, patterns);
    }
  }
  console.log("✅ DOM walk complete");
}

loadPatterns().then(patterns => walkDOMAndLinkify(patterns));