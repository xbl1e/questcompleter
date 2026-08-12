## <img alt="contributing icon" src="./assets/readme/contributing.svg" height="24" style="vertical-align: middle;"> Contributing

> [!NOTE]
> We deeply value and appreciate all contributions to this repository! Every piece of code, bug report, and suggestion helps make the tool better. Open an issue first for major changes or new features. Small fixes (typos, minor bugs) can go directly to a Pull Request.

### <img alt="documentation icon" height="18" src="./assets/readme/documentation.svg" style="vertical-align: middle;">&nbsp;&nbsp;Ground Rules

- **Keep it minimal** — the design should be quiet, fast, and functional.
- **Vencord Best Practices** — adhere to standard Vencord plugin structures. Avoid massive `try...catch` blocks and use native Discord components (`findByProps`, `common.React`, etc.) wherever possible.
- **Respect the style** — use native Discord CSS variables and custom properties to match the client's look and feel. No hardcoded or clashing colors.
- **Native Integration** — patches should seamlessly hook into existing Discord components (like the Quest bar) rather than rendering floating overlays.

### <img alt="git-branch icon" height="18" src="./assets/readme/git-branch.svg" style="vertical-align: middle;">&nbsp;&nbsp;Development

1. Clone this repository into your Vencord `src/userplugins/` directory.
2. Run `pnpm build` in the Vencord root directory to compile the plugin.
3. Reload your Discord client to test changes.
