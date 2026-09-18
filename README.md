# CONS302 Presentation Group Draw

A static, GitHub Pages-ready classroom lottery with a genetics and environment theme. No server, build, packages, ChatGPT sign-in, external fonts, APIs, analytics, or cloud database are needed.

## Publish at exactly cons302-presentation.github.io

GitHub requires the repository owner to be a user or organization named `cons302-presentation` and the repository name to be `cons302-presentation.github.io`.

1. Create a GitHub organization named `cons302-presentation`, if the name is available, or use an existing account/organization you control with that exact name. Do not rename your existing personal account merely to host this site.
2. Under that owner, create a public repository named `cons302-presentation.github.io`.
3. Extract the provided ZIP. Upload all files from this folder into the repository root. `index.html` must be at the top level, not inside another folder. Upload the actual files, not the ZIP.
4. Open repository **Settings → Pages**.
5. Set **Source: Deploy from a branch**, **Branch: main**, **Folder: / (root)**, and save.
6. Wait for the Pages deployment to finish, then use **Visit site**. No custom domain setting is needed.

Documentation:
- https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

If uploaded under a different owner, the default address follows that owner's username; the repository name alone cannot create the requested hostname.

## Use during class

1. Open `teacher.html` on the published site before sharing your screen.
2. Upload a UTF-8 CSV with `number`, `first_name`, and `preferred_name` columns, or use student numbers only. The included `roster-template.csv` is an example with fictional names. Set absent numbers and together/apart requests using student numbers.
3. Click **Check requests**, then **Save setup in this tab**.
4. Click **Open class screen**. A separate tab opens without copying the teacher tab's storage.
5. Keep the teacher tab open in the same browser. Project only the class tab.
6. Click **Draw presentation groups** on the class tab. Reveal the groups one at a time or all together.
7. Save the results as CSV or print the groups. Clear tab data in teacher setup when finished.

## Privacy and limits

- GitHub Pages cannot provide an authenticated private backend. The teacher form is publicly accessible as an empty tool; it has no login.
- Your imported CSV roster, entered requests and full draw are stored only in the teacher tab's `sessionStorage`, with an in-memory fallback if storage is unavailable. They are never committed to GitHub or transmitted to a server.
- Treat access to your browser profile as access to your local data. Browser session restoration may retain tab data. Use **Clear tab data** to remove the app's saved requests and draw after use.
- A browser-local BroadcastChannel passes only counts and revealed names, numbers and assignments to the class screen. It never sends the request lists or unrevealed members.
- The teacher tab must stay open. The class screen cannot generate or continue a draw without it.
- A class-screen URL shared with another computer cannot connect to your teacher tab; this app is intended for live projection from the instructor's computer.
- Refreshing either open tab restores its state when browser tab storage is available. Closing the teacher tab may lose the setup. Export final results before closing.
- No previously stored requests from the earlier hosted app are included or migrated. Enter your requests anew.
- Use the site over HTTPS. Opening the HTML directly as a local file is not supported because it uses JavaScript modules and same-origin tab communication.

## Group rules

Every present student appears once. There are always exactly eight nonempty groups, with at most six students per group (8–48 present students). For 42 students, balanced sizes are two groups of 6 and six groups of 5; for 43 students, three groups of 6 and five groups of 5. Fewer than 8 or more than 48 present students are rejected; absent students do not count toward these limits. The solver tries balanced sizes first and permits uneven sizes if required by the requests. Overlapping together sets merge. Everyone in an apart set must be in a different group. Inconsistent or infeasible requests are rejected; search timeouts are reported rather than silently ignoring requests.

With no requests, the roster is shuffled randomly. With requests, randomized search finds a valid arrangement; it is not a uniform sample of every valid partition.

## Files

- `index.html`, `board.js`: projected class screen
- `teacher.html`, `teacher.js`: local teacher setup
- `model.js`, `solver.js`: class rules and randomized grouping
- `csv.js`, `roster-template.csv`: CSV import and a fictional sample roster
- `shared.js`: public-state validation and CSV export
- `styles.css`, `favicon.svg`, `course-banner.png`: course theme
- `.nojekyll`: disable Jekyll processing

The published source and assets contain no real student data, request lists, account identifiers or credentials. The optional CSV template contains fictional names only.

## CSV roster format

```csv
number,first_name,preferred_name
1,Alexander,Alex
2,Samantha,Sam
3,Maya,Maya
4,Taylor,
```

- Export from Excel as **CSV UTF-8 (Comma delimited)**. Header aliases such as **Student Number**, **Real First Name**, and **Preferred Name** also work. Without a header, put number, real first name and preferred name in that order. Two-column number/first-name CSVs remain supported.
- Student numbers must be unique integers from 1 to 100. Numbering may have gaps; imported numbers are never reassigned. Duplicate first names are allowed because numbers identify students.
- Quoted commas, escaped quotes, accented letters and other Unicode names are supported. Empty names, duplicate numbers and malformed CSV are rejected without replacing the previous roster.
- Review the imported roster in the teacher tab, then save the setup. Use numbers for together/apart requests.
- The class screen displays each revealed student's **preferred name** beside their number. A blank preferred-name cell falls back to their real first name. Keeping the real first name in the third column also works. Result CSVs and printed groups use the same preferred/display names.
- Real first names remain in the teacher tab when a different preferred name is used. Only preferred/display names are sent to the class screen, and only when their groups are revealed. Absent students' names are not sent at all.
- Uploading a new roster is disabled once a draw is locked. Start a new draw to change it.
- Imported names survive a refresh of the teacher tab when session storage is available; **Clear tab data** removes them.
