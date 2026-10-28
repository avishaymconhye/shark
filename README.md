# SHARK

An UNTAMED game nobody wants to win.

Android app for chasing late payers. Clients climb a ladder the longer they are late; the one on top is The Clam.
Arcade pixel sprites, riso inks, everything stored on the phone.

## Install it on your phone

Every push to `main` builds a signed APK on GitHub (Actions tab, about 6 minutes).

1. Open the repository's **Releases**, then **latest**, and download `SHARK-<version>-build<n>.apk`.
2. Open the file on the phone and allow installing from that source when asked. If Play Protect warns, tap
   **More details > Install anyway**.
3. A newer build installs over the old one and keeps all data, because every build is signed with the same key.

The build needs one repository secret, `KEYSTORE_PASSWORD` (Settings > Secrets and variables > Actions).
It unlocks `android/app/shark-release.jks.enc`. Keep that password safe: without it, a new build cannot update the
installed app and would have to be installed fresh.

## How it works

- **The ladder.** Ranked by days late (oldest unpaid debt first). Fish size follows the amount owed.
  Rank 1 is The Clam.
- **Tap a fish** for the details: what they owe, since when, each debt, and the PAID! button.
- **PAID!** clears everything they owe, plays the coin moment and moves them to Off the hook. Undo is on the toast.
- **Part paid** on a single debt lowers its balance. Paying the last of it counts as PAID.
- **Image** makes a 1080 x 1350 poster with their title, name, amount and dates, ready to share.
- **Currencies.** MUR, EUR and USD. Totals are kept per currency. Optional rates in Settings are only used to size
  the fish.
- **Off the hook** (coin button) lists clients who paid, with how long each took. Put one back on the ladder from there.
- **Backup** in Settings shares a JSON file; **Restore** reads it back.

## Files

- `www/` the app itself (HTML, CSS, JavaScript). Fonts are bundled, so it works offline.
  - `js/sprites.js` pixel art, logo and fin drawing
  - `js/core.js` storage, money, dates, ladder ranking, sound and haptics
  - `js/app.js` screens, sheets and actions
  - `js/export.js` the shareable image
- `android/` the Android Studio project (Capacitor 8). App id `mu.untamed.shark`, separate from Pilotfish.
