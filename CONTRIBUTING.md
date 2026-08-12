## <img alt="contributing icon" src="./assets/readme/contributing.svg" height="24" style="vertical-align: middle;"> Contributing

> [!NOTE]
> We deeply value and appreciate all contributions to this repository! Every piece of code, bug report, and suggestion helps make the tool better. Open an issue first for major changes or new features. Small fixes (typos, minor bugs) can go directly to a Pull Request.

### <img alt="git-branch icon" height="18" src="./assets/readme/git-branch.svg" style="vertical-align: middle;">&nbsp;&nbsp;Contribution Flow

1. **Fork** the repository and clone it locally.
2. **Branch**: Create a new branch (`feat/...` or `fix/...`).
3. **Develop**: Make your code changes.
4. **Validate**: Run `.\install.bat` to ensure everything builds correctly.
5. **PR**: Open a Pull Request with a clear description of the change.

### <img alt="documentation icon" height="18" src="./assets/readme/documentation.svg" style="vertical-align: middle;">&nbsp;&nbsp;Commit Style

Keep your commit messages strictly formatted without extra descriptions. Use the `(dev)` scope and include the version number at the end:

- **feat(dev):** new feature or addition (e.g. `feat(dev): add auto-claim 0.0.1`).
- **fix(dev):** bug fix or correction (e.g. `fix(dev): prevent rate limits 0.0.2`).
- **build(dev):** code improvement, refactors, or build changes (e.g. `build(dev): enforce strict typings 0.0.3`).

### <img alt="features icon" height="18" src="./assets/readme/features.svg" style="vertical-align: middle;">&nbsp;&nbsp;PR Checklist

- [ ] Builds successfully via `.\install.bat` without errors.
- [ ] Follows existing file structure and naming.
- [ ] The PR description clearly explains the changes.
