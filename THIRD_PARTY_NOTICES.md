# Third-Party Notices

Zhijuan Prompt Card is licensed under Apache-2.0. It depends on third-party open-source packages through npm.

## Runtime Dependencies

The extension runtime bundle uses:

| Package | License |
|---|---|
| React | MIT |
| React DOM | MIT |

## Build and Test Dependencies

Development, build, and test tooling includes packages under MIT, Apache-2.0, MPL-2.0, BSD-3-Clause, ISC, and 0BSD licenses.

Notable packages:

| Package family | License | Use |
|---|---|---|
| Vite | MIT | Build tooling |
| TypeScript | Apache-2.0 | Type checking |
| esbuild | MIT | Extension worker/content bundling |
| Playwright | Apache-2.0 | Browser verification |
| lightningcss | MPL-2.0 | CSS processing through the build toolchain |

The authoritative dependency graph and package versions are recorded in `package-lock.json`.

No GPL, AGPL, or LGPL packages are present in the current lockfile as of the 0.2.0 release check.
