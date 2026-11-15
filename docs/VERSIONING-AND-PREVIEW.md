# Version numbers and integrated workspace views — 2.6.0

The normal app opens at `/`. Its permanent top bar contains Workspace, a subtle release number, and **Views** with the current device. Click Views to open or fold the compact screen-size controls. The button always remains visible. Choose Desktop, iPad or Phone; rotate the two device views. Escape closes the options and returns focus to Views. Small screens fold the options after selecting a size.

Desktop fills the available space. iPad uses 820×1180 and Phone 390×844; rotation swaps the dimensions. Both fit automatically to the available width and height, never scale above 100%, and show a quiet size/scale caption. The workspace scrolls inside its screen. No separate App exit button, hidden version-link navigation, or sideways outer canvas is required. The former `/preview` address redirects to the integrated app.

The shell contains one stable iframe loading `/workspace`. Device changes update its dimensions, not its URL or React key. That preserves authentication, open forms, inspection drafts and data saves while switching or folding. QR property/asset parameters and email auth callbacks pass through to the workspace. Auth callback credentials are removed from the outer address after being forwarded. The existing workspace code, Supabase tables and storage behavior are unchanged.

Version numbers come directly from package.json. MAJOR.MINOR.PATCH: major for breaking workflow/data changes; minor for compatible features; patch for fixes/polish. Update package.json and package-lock.json together, CHANGELOG.md, and the release tag.

Verification: 21 automated tests pass, including device geometry checks across small phone, laptop and large desktop canvases, plus production compilation and TypeScript. Browser tooling is unavailable in this environment; visual interaction, physical-device camera/keyboard behavior, and signed-in end-to-end QA remain pending. Device previews help review CSS layout; they do not replace physical-device checks.
