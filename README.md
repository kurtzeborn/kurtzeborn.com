# kurtzeborn.com

Family sites automatically deployed to GitHub Pages and Azure Static Web Apps.

**Live Sites:**
- https://kurtzeborn.net (Azure)
- https://kurtzeborn.github.io/kurtzeborn.com/ (GitHub Pages)

## How to Update the Sites

Make changes on the `master` branch and push - everything deploys automatically:

```bash
git add .
git commit -m "Your changes"
git push origin master
```

GitHub Actions will automatically:
- Deploy to GitHub Pages (gh-pages branch)
- Deploy to Azure Static Web Apps

Changes are live within a few minutes.

## Project Contents

### Motorcycle Runner (`game/`)
A browser-based endless runner game inspired by Chrome's T-Rex game. Built with vanilla JavaScript and HTML5 Canvas.

**Features:**
- Embeddable on any website with one line: `<script src="https://kurtzeborn.net/game/game-embed.js"></script>`
- Press SPACEBAR to launch game overlay
- Works on mobile and desktop

**Documentation:** See [game/README.md](game/README.md) and [game/CONTRIBUTING.md](game/CONTRIBUTING.md)

### Family Sites
- **kurtzeborn.com/** - Family domain landing page
- **scott.kurtzeborn.com/** - Personal profile and resume
