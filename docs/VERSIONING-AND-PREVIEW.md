# Version numbers and device previews

The small version below the Juggle logo comes directly from package.json. Click it to open `/preview`, then select Desktop, iPad or Phone. Rotate switches portrait/landscape. The preview uses the live app in one iframe; resizing does not reload it. Changes made there save normally. The outer canvas scrolls if the chosen device is wider than your screen. Use App to return to the normal interface.

Versioning: MAJOR.MINOR.PATCH. Major is a breaking workflow/data change; minor is a compatible new feature; patch is a fix or polish. Bump package.json and package-lock.json together with npm version, update CHANGELOG.md and tag the release. This feature is 2.5.0.

Preview dimensions check CSS layout, not physical camera, keyboard or device behavior. Physical-device QA remains necessary.
