# kurtzeborn.com

Source code for my family site hosted on GitHub Pages.

**Live Site:** https://kurtzeborn.github.io/kurtzeborn.com/

## Repository Structure

- **`master` branch** - Source code and development
  - `game/` - Motorcycle Runner game
  - `scott.kurtzeborn.com/` - Personal profile site
  
- **`gh-pages` branch** - Published website (auto-deployed to GitHub Pages)
  - `index.html` - Landing page
  - `game/` - Published game
  - `scott.kurtzeborn.com/` - Published profile

## How to Update the Site

### 1. Make Changes on Master Branch

Edit files in the `master` branch as usual:

```bash
# Make your changes to game/ or scott.kurtzeborn.com/
git add .
git commit -m "Your commit message"
git push origin master
```

### 2. Update GitHub Pages

After pushing changes to `master`, update the `gh-pages` branch:

```bash
# Switch to gh-pages branch
git checkout gh-pages

# Pull the updated files from master
git checkout master -- game scott.kurtzeborn.com

# Commit and push
git add .
git commit -m "Update site from master"
git push origin gh-pages

# Switch back to master
git checkout master
```

The site will automatically update at https://kurtzeborn.github.io/kurtzeborn.com/ within a few minutes.

### 3. Update Landing Page (Optional)

If you need to modify the landing page (`index.html`):

```bash
# Switch to gh-pages branch
git checkout gh-pages

# Edit index.html
# ... make your changes ...

git add index.html
git commit -m "Update landing page"
git push origin gh-pages

# Switch back to master
git checkout master
```

## Project Contents

### Motorcycle Runner (`game/`)
A browser-based endless runner game inspired by Chrome's T-Rex game. Built with vanilla JavaScript and HTML5 Canvas.

- **Play:** https://kurtzeborn.github.io/kurtzeborn.com/game/
- **Documentation:** See `game/README.md` and `game/CONTRIBUTING.md`

### Scott's Profile (`scott.kurtzeborn.com/`)
Personal profile site with resume and contact information.

- **View:** https://kurtzeborn.github.io/kurtzeborn.com/scott.kurtzeborn.com/

## Quick Reference

```bash
# View current branch
git branch

# Switch branches
git checkout master       # Source code
git checkout gh-pages     # Published site

# Update published site from source
git checkout gh-pages && git checkout master -- game scott.kurtzeborn.com && git add . && git commit -m "Sync from master" && git push && git checkout master
```
