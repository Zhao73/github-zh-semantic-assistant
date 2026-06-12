# Release Checklist

1. Run `npm test`.
2. Run `npm run pack:zip`.
3. Load the extension in Chrome with `npm run install:chrome`.
4. Verify a GitHub repository page:
   - UI labels become Chinese.
   - Repository owner and name stay unchanged.
   - README translations keep package names, model names, product names, and code untouched.
   - `Alt+Shift+G` toggles the extension.
   - `Alt+Shift+T` translates the current page.
5. Upload `dist/github-zh-semantic-assistant.zip` to GitHub Releases or Chrome Web Store.

## Suggested GitHub Topics

`chrome-extension`, `github`, `translation`, `chinese`, `openai`, `llm`, `rag`, `developer-tools`
