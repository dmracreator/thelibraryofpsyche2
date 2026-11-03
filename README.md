# The Library of Psyche

A responsive, standalone website for Dani’s romantic reading life. No installation or build step is needed.

## Publish on GitHub Pages

1. Create a GitHub repository, then upload the contents of this folder into its root. `index.html` must be at the root, alongside `styles.css`, `script.js`, and `assets/`.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**. Choose your main branch and **/(root)**, then save.
4. GitHub will display the website address when deployment finishes. Relative asset paths work with repository-based Pages addresses.

## Fonts — action required for an exact brand match

The requested font files were not supplied. The CSS is already configured for Nourd, New Icon Script, and Biro Script Plus, with readable system fallbacks so the website works immediately. Font files are deliberately not bundled without web-use rights.

Add your licensed webfont files to `assets/fonts/` using these names:

- `nourd.woff2`
- `new-icon-script.woff2`
- `biro-script-plus.woff2`

Use a regular-weight Nourd file. If your licence provides another webfont format, update the `@font-face` paths and format values at the top of `styles.css`. Access to a font in a design app does not necessarily include self-hosted webfont rights; check the licence supplied with your files.

## Update your content

- Edit text, contact details, links, and series descriptions in `index.html`.
- Replace the four PNGs in `assets/` with your own final images, keeping the filenames or updating their paths and descriptions in `index.html`.
- Current portfolio images are the four supplied visual concepts, clearly labelled as concepts on the page. Check ownership or permission for all photography within those concepts before publishing publicly.
- Update the `width` and `height` attributes if replacement images have different dimensions.
- All six brand colours are defined at the top of `styles.css`.
- The contact link opens the visitor’s email app. There is no form service, tracking, cookie banner, or mailing-list integration.
- The site does not invent past clients, testimonials, audience statistics, or affiliate memberships. Add verified details as they become available.

## Preview locally

Open `index.html` in a browser, or run `python3 -m http.server 4173` from this folder and visit http://localhost:4173.

## Brand reference

Palette: #f6f5f3, #8b3a3b, #3a3a3a, #ffedf3, #656565, and deep burgundy #5d2526. Use the supplied LP image as the favicon.

Workshop photographs were cleaned with the built-in image editor to remove social-media overlays. Prompt: remove only superimposed text and UI; preserve people, objects, setting, lighting, and real-world signage.

## Add books to your reading shelf

1. Open `edit-shelf.html` in your browser (double-click it, or visit your site’s `/edit-shelf.html` address).
2. Add the title, author, optional finish month, your own review, and an optional affiliate URL.
3. Choose a cover photo from your computer, or enter an image URL or a path such as `assets/covers/my-book.jpg`. Chosen photos are embedded in the exported file, so no separate image upload is needed. For a local path, upload that image separately. Use small web-friendly images you have permission to use.
4. Click **Add to my shelf**. Use **Edit** or **Remove** to revise entries. New books appear first.
5. Click **Download books.js**, then replace the repository’s `books.js` with your downloaded file and commit the change. Your public shelf updates after GitHub Pages deploys.
6. Keep a downloaded backup. Your browser draft is local to that browser/device and is not a cloud account. Use **Import a saved books.js** to move your shelf to another device or restore a backup. An existing browser draft takes priority over the published data until you import a newer copy.

The editor is an unlinked utility, not an authenticated admin area. Visitors cannot publish changes to your repository through it. Only uploaded data is public; browser drafts stay on the device. Never put private notes or secrets in the published shelf file. The public shelf starts empty because no finished-book list, personal reviews, or affiliate URLs have been supplied. Affiliate buttons appear only when a valid link is provided and are labelled individually.
