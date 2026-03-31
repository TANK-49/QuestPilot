# QuestPilot

Automatically completes Discord Quests the moment you accept them — no buttons, no babysitting.

> [!IMPORTANT]
> You still need to manually accept a quest from the Quests page. QuestPilot takes over from there.

> Original script by [Amia](https://github.com/aamiaa) — [Complete Recent Discord Quest](https://gist.github.com/aamiaa/204cd9d42013ded9faf646fae7f89fbb)  
> Extended and maintained as a browser extension by [TANK](https://github.com/TANK)

---

## How It Works

Once installed, the extension runs silently in the background. Navigate to your Quests page, accept a quest, and it handles the rest automatically.

Supported quest types:
- Watch Video / Watch Video on Mobile
- Play on Desktop
- Stream on Desktop
- Play Activity

---

## 🛠️ Installation

### For Android (Mobile)

1. Download and install Kiwi Browser from the [APKMirror](https://www.apkmirror.com/apk/geometry-ou/kiwi-browser-fast-quiet/) or [GitHub](https://github.com/kiwibrowser/src.next/releases).
2. Download this repository as a `.zip` file.
3. Open Kiwi Browser and navigate to `kiwi://extensions`.
4. Enable **Developer Mode**.
5. Tap `+ (from .zip/crx/.user.js)` and select the downloaded zip file.
6. Go to `discord.com/quest-home`.
7. Accept a Quest.

### For Windows (Desktop)

1. Download this repository and extract the files.
2. Open any Chromium browser (Chrome, Edge, Arc, Brave) and go to `chrome://extensions`.
3. Enable **Developer Mode** in the top right corner.
4. Click **Load unpacked** and select the folder containing the extension files.
5. Navigate to your Discord Quests page.
6. Accept a Quest.

> [!TIP]
> Works on `discord.com`, `canary.discord.com`, and `ptb.discord.com` — whichever you use daily.

---

## Notes

> [!NOTE]
> QuestPilot only activates on `/quest-home` pages. It does absolutely nothing anywhere else on Discord.

> [!WARNING]
> For **Stream on Desktop** quests, you need at least one other person in the voice channel or the quest won't progress.

> [!CAUTION]
> Using automation tools may violate Discord's Terms of Service. Use this at your own risk.

---

## License

This project is licensed under the **GNU General Public License v3.0** — see [LICENSE](./LICENSE) for details.

---

## Credits

- **[Amia](https://github.com/aamiaa)** — original quest automation script
- **TANK** — browser extension wrapper and maintenance
