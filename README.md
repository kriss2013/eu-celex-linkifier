# 🇪🇺 EU CELEX Linkifier

**EU CELEX Linkifier** is a lightweight Chrome extension that automatically detects references to EU legal documents (like _Directive 2013/34/EU_) in web pages and turns them into clickable links pointing to their official CELEX entries on EUR-Lex.

## ✨ Features

- 🔗 Detects and linkifies references to:
  - Directives (e.g., `Directive 2013/34/EU`)
  - Regulations (e.g., `Regulation (EU) 2020/852`)
  - Decisions (e.g., `Decision 2009/821/EC`)
  - Legacy references (e.g., `78/660/EEC`)
- 🧠 Automatically generates CELEX URIs (e.g., `32013L0034`)
- 🧪 Automatically run on following pages
  - https://eur-lex.europa.eu/legal-content/EN/*
  - https://eur-lex.europa.eu/eli/reg/*/*/oj/eng

## 📦 How to Install

1. Clone or download this repo
2. In Chrome, go to `chrome://extensions/`
3. Enable **Developer Mode**
4. Click **Load unpacked** and select this folder

## 🚧 Known Limitations

- Currently assumes most references point to **binding law** (Sector 3 CELEX)
- Does not validate CELEX codes (no lookup to check if they exist)

## 📘 Background

CELEX is the unique identifier used by EUR-Lex to track EU legal documents. This extension builds CELEX codes from natural references found in plain text, enabling quick access to the official sources.

## 🧑‍💻 Author

Built by chatGPT, under supervision of Kriss ;-) — feel free to fork, enhance, or contribute.

https://chatgpt.com/share/6877b47c-ae98-800f-b4ee-14cff28722ab
