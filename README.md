# kurtzeborn.com

![net](https://img.shields.io/github/actions/workflow/status/kurtzeborn/kurtzeborn.com/deploy-kurtzeborn-net_gh-pages.yml?label=net)
![com/org](https://img.shields.io/github/actions/workflow/status/kurtzeborn/kurtzeborn.com/azure-static-web-apps-green-bush-07b3b521e.yml?label=com/org)
![scott](https://img.shields.io/github/actions/workflow/status/kurtzeborn/kurtzeborn.com/azure-static-web-apps-mango-mud-0289f001e.yml?label=scott)

Family sites automatically deployed to GitHub Pages and Azure Static Web Apps.

## Live Sites

| Site | Hosting | Description |
|------|---------|-------------|
| [kurtzeborn.net](https://kurtzeborn.net) | GitHub Pages | Source code landing page |
| [kurtzeborn.com](https://kurtzeborn.com) | Azure Static Web App | Family domain landing page (.com & .org) |
| [scott.kurtzeborn.com](https://scott.kurtzeborn.com) | Azure Static Web App | Personal profile and resume |

## Project Structure

```
kurtzeborn.com/
├── kurtzeborn.net/
├── kurtzeborn.com/    
├── scott.kurtzeborn.com/
└── .github/workflows/
```

## How to Update

Make changes on the `main` branch and push.  GitHub Actions will automatically deploy to the appropriate hosting platforms. Changes are live within a few minutes.
