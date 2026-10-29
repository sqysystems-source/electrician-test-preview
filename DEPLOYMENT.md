# Applying the changed-files ZIP

1. Extract the ZIP into the existing project root. Paths such as `js/app.js`
   and `css/styles.css` match the original project. Overwrite those files.
2. **Delete these four obsolete files from your working tree/repository.** A ZIP
   overlay cannot delete old files for you:

   ```text
   firebase.json
   firestore.rules
   firestore.indexes.json
   js/firebase.js
   ```

   The same exact paths are provided in `DELETED_FILES.txt`. Do not deploy them.
3. Set real numbers/business details in `js/config.js` as described in README.
   Check WhatsApp/Viber registration, static no-JavaScript phone fallbacks,
   canonical/OG URLs, structured data, sitemap and robots domain.
4. Deploy as a static site. There is **no install command, build command,
   environment-variable configuration or backend deployment**.

   - **Vercel:** framework preset Other; leave Build and Install commands empty;
     serve the project root (do not add a nonexistent `dist` folder).
     `vercel.json` keeps security headers, removes old cross-origin dashboard
     permissions and remote SDK allowlists, and revalidates JS/CSS on each visit.
   - **Netlify:** no build command; publish directory is the project root.
     Existing `.html` links work without rewrites.
   - **GitHub Pages:** publish the project directory. Relative asset/page paths
     support a repository subdirectory. No build step is required; `404.html`
     is included. On arbitrary nested missing URLs, relative links on that 404
     may require adjusting to the deployment's base path.

5. Refresh the deployed page. During the first migration, use a hard refresh or
   clear the browser cache once: the previous deployment allowed scripts/styles
   to remain fresh for a day. New visits revalidate the updated assets.

## Confirm after deployment

- Fresh site storage starts in Greek. Switch to English, reload, then return to
  Greek; language, labels, errors and the message follow the current selection.
- Both forms open the configured WhatsApp recipient with an encoded message.
- On a phone with Viber installed, the Viber link opens the intended chat. Copy
  and paste the prepared message. Also test denied clipboard access and no app.
- Confirm real calls and all three mobile shortcuts with the client's numbers.
- No database/SDK requests occur in the Network panel; there are no account or
  dashboard prerequisites. No message is considered delivered by the website.

This source refactor does not change any previously deployed cloud project or
its stored data. Those existing external resources are outside the ZIP.
