Effortlessly complete all your Discord Quests on PC and Mobile without spending hours playing or streaming games. You can either install our background browser extension for automatic completion or run a quick, one-time script in your browser's Developer Console.

> [!CAUTION]
> Utilizing automation scripts or spoofing mechanisms carries potential risks regarding Discord's Terms of Service. Use responsibly.

## What's New in QuestPilot v4.9
![QuestPilot Preview](https://i.tank49.tech/blog/QuestPilot.png)
* **Achievement in Activity Support:** Complete `ACHIEVEMENT_IN_ACTIVITY` quests effortlessly without manual steps.
* **Unlimited Mode:** Complete multiple active quests simultaneously to maximize time efficiency.
* **One-by-One (OBO) Mode:** Sequential execution mode to complete quests safely one after another.
* **Interactive Dashboard:** Real-time visual metrics tracking active, queued, completed, failed and done quests.
---

## Choose Your Method

If you want to quickly complete a quest without installing an extension, you can execute this snippet in the browser console:

1. Open Discord in your Web Browser (or Kiwi Browser on Android).
2. Open the Developer Console (`F12` or `Ctrl + Shift + I` on PC).
3. Paste the following script and press **Enter**:
<details>
	<summary>Click to expand</summary>

```javascript
delete window.$;
let wpRequire = webpackChunkdiscord_app.push([[Symbol()], {}, r => r]);
webpackChunkdiscord_app.pop();

let ApplicationStreamingStore = Object.values(wpRequire.c).find(x => x?.exports?.A?.__proto__?.getStreamerActiveStreamMetadata).exports.A;
let RunningGameStore = Object.values(wpRequire.c).find(x => x?.exports?.Ay?.getRunningGames).exports.Ay;
let QuestsStore = Object.values(wpRequire.c).find(x => x?.exports?.A?.__proto__?.getQuest).exports.A;
let ChannelStore = Object.values(wpRequire.c).find(x => x?.exports?.A?.__proto__?.getAllThreadsForParent).exports.A;
let GuildChannelStore = Object.values(wpRequire.c).find(x => x?.exports?.Ay?.getSFWDefaultChannel).exports.Ay;
let FluxDispatcher = Object.values(wpRequire.c).find(x => x?.exports?.h?.__proto__?.flushWaitQueue).exports.h;
let api = Object.values(wpRequire.c).find(x => x?.exports?.Bo?.get).exports.Bo;

const supportedTasks = ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY", "WATCH_VIDEO_ON_MOBILE"]
let quests = [...QuestsStore.quests.values()].filter(x => x.userStatus?.enrolledAt && !x.userStatus?.completedAt && new Date(x.config.expiresAt).getTime() > Date.now() && supportedTasks.find(y => Object.keys((x.config.taskConfig ?? x.config.taskConfigV2).tasks).includes(y)))
let isApp = typeof DiscordNative !== "undefined"
if(quests.length === 0) {
    console.log("You don't have any uncompleted quests!")
} else {
    let doJob = function() {
        const quest = quests.pop()
        if(!quest) return

        const pid = Math.floor(Math.random() * 30000) + 1000

        const questName = quest.config.messages.questName;
        const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2;
        const taskName = supportedTasks.find(x => taskConfig.tasks[x] != null);
        const application = taskConfig.tasks[taskName].applications?.[0];
        const applicationId = application?.id;
        const applicationName = quest.config.messages.gameTitle;
        const secondsNeeded = taskConfig.tasks[taskName].target;
        let secondsDone = quest.userStatus?.progress?.[taskName]?.value ?? 0;

        if(taskName === "WATCH_VIDEO" || taskName === "WATCH_VIDEO_ON_MOBILE") {
            const maxFuture = 10, speed = 7, interval = 1
            const enrolledAt = new Date(quest.userStatus.enrolledAt).getTime()
            let completed = false
            let fn = async () => {          
                while(true) {
                    const maxAllowed = Math.floor((Date.now() - enrolledAt)/1000) + maxFuture
                    const diff = maxAllowed - secondsDone
                    const timestamp = secondsDone + speed
                    if(diff >= speed) {
                        const res = await api.post({url: `/quests/${quest.id}/video-progress`, body: {timestamp: Math.min(secondsNeeded, timestamp + Math.random())}})
                        completed = res.body.completed_at != null
                        secondsDone = Math.min(secondsNeeded, timestamp)
                    }
                    
                    if(timestamp >= secondsNeeded) {
                        break
                    }
                    await new Promise(resolve => setTimeout(resolve, interval * 1000))
                }
                if(!completed) {
                    await api.post({url: `/quests/${quest.id}/video-progress`, body: {timestamp: secondsNeeded}})
                }
                console.log("Quest completed!")
                doJob()
            }
            fn()
            console.log(`Spoofing video for ${questName}.`)
        } else if(taskName === "PLAY_ON_DESKTOP") {
            if(!isApp) {
                console.log("This no longer works in browser for non-video quests. Use the discord desktop app to complete the", questName, "quest!")
            } else {
                api.get({url: `/applications/public?application_ids=${applicationId}`}).then(res => {
                    const appData = res.body[0]
                    const exeName = appData.executables?.find(x => x.os === "win32")?.name?.replace(">","") ?? appData.name.replace(/[\/\\:*?"<>|]/g, "")
                    
                    const fakeGame = {
                        cmdLine: `C:\\Program Files\\${appData.name}\\${exeName}`,
                        exeName,
                        exePath: `c:/program files/${appData.name.toLowerCase()}/${exeName}`,
                        hidden: false,
                        isLauncher: false,
                        id: applicationId,
                        name: appData.name,
                        pid: pid,
                        pidPath: [pid],
                        processName: appData.name,
                        start: Date.now(),
                    }
                    const realGames = RunningGameStore.getRunningGames()
                    const fakeGames = [fakeGame]
                    const realGetRunningGames = RunningGameStore.getRunningGames
                    const realGetGameForPID = RunningGameStore.getGameForPID
                    RunningGameStore.getRunningGames = () => fakeGames
                    RunningGameStore.getGameForPID = (pid) => fakeGames.find(x => x.pid === pid)
                    FluxDispatcher.dispatch({type: "RUNNING_GAMES_CHANGE", removed: realGames, added: [fakeGame], games: fakeGames})
                    
                    let fn = data => {
                        let progress = quest.config.configVersion === 1 ? data.userStatus.streamProgressSeconds : Math.floor(data.userStatus.progress.PLAY_ON_DESKTOP.value)
                        console.log(`Quest progress: ${progress}/${secondsNeeded}`)
                        
                        if(progress >= secondsNeeded) {
                            console.log("Quest completed!")
                            
                            RunningGameStore.getRunningGames = realGetRunningGames
                            RunningGameStore.getGameForPID = realGetGameForPID
                            FluxDispatcher.dispatch({type: "RUNNING_GAMES_CHANGE", removed: [fakeGame], added: [], games: []})
                            FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn)
                            
                            doJob()
                        }
                    }
                    FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn)
                    
                    console.log(`Spoofed your game to ${applicationName}. Wait for ${Math.ceil((secondsNeeded - secondsDone) / 60)} more minutes.`)
                })
            }
        } else if(taskName === "STREAM_ON_DESKTOP") {
            if(!isApp) {
                console.log("This no longer works in browser for non-video quests. Use the discord desktop app to complete the", questName, "quest!")
            } else {
                let realFunc = ApplicationStreamingStore.getStreamerActiveStreamMetadata
                ApplicationStreamingStore.getStreamerActiveStreamMetadata = () => ({
                    id: applicationId,
                    pid,
                    sourceName: null
                })
                
                let fn = data => {
                    let progress = quest.config.configVersion === 1 ? data.userStatus.streamProgressSeconds : Math.floor(data.userStatus.progress.STREAM_ON_DESKTOP.value)
                    console.log(`Quest progress: ${progress}/${secondsNeeded}`)
                    
                    if(progress >= secondsNeeded) {
                        console.log("Quest completed!")
                        
                        ApplicationStreamingStore.getStreamerActiveStreamMetadata = realFunc
                        FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn)
                        
                        doJob()
                    }
                }
                FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn)
                
                console.log(`Spoofed your stream to ${applicationName}. Stream any window in vc for ${Math.ceil((secondsNeeded - secondsDone) / 60)} more minutes.`)
                console.log("Remember that you need at least 1 other person to be in the vc!")
            }
        } else if(taskName === "PLAY_ACTIVITY") {
            const channelId = ChannelStore.getSortedPrivateChannels()[0]?.id ?? Object.values(GuildChannelStore.getAllGuilds()).find(x => x != null && x.VOCAL.length > 0).VOCAL[0].channel.id
            const streamKey = `call:${channelId}:1`
            
            let fn = async () => {
                console.log("Completing quest", questName, "-", quest.config.messages.questName)
                
                while(true) {
                    const res = await api.post({url: `/quests/${quest.id}/heartbeat`, body: {stream_key: streamKey, terminal: false}})
                    const progress = res.body.progress.PLAY_ACTIVITY.value
                    console.log(`Quest progress: ${progress}/${secondsNeeded}`)
                    
                    await new Promise(resolve => setTimeout(resolve, 20 * 1000))
                    
                    if(progress >= secondsNeeded) {
                        await api.post({url: `/quests/${quest.id}/heartbeat`, body: {stream_key: streamKey, terminal: true}})
                        break
                    }
                }
                
                console.log("Quest completed!")
                doJob()
            }
            fn()
        }
    }
    doJob()
}

```
</details>

For a full hands-off experience with visual progress tracking and Unlimited speed modes, install the QuestPilot Browser Extension.

### Supported Quest Types

* **[NEW]** Achievement in Activity
* Watch Video on Desktop / Mobile
* Play on Desktop / PlayStation / Xbox
* Stream on Desktop

---

### Extension Installation Guide

#### Android (Mobile)

1. Download and install Kiwi Browser from [APKMirror](https://www.apkmirror.com/apk/geometry-ou/kiwi-browser-fast-quiet/) or [GitHub](https://github.com/kiwibrowser/src.next/releases).
2. Download the [QuestPilot v4.9](https://i.tank49.tech/blog/QuestPilot-4.9.zip) extention.
3. Open Kiwi Browser and navigate to `kiwi://extensions`.
4. Enable **Developer Mode**.
5. Tap `+ (from .zip/crx/.user.js)` and select the downloaded ZIP file.
6. Navigate to [Discord Quest](https://discord.com/quest-home)'s page and accept a quest.

#### Windows / Mac (PC)

1. Download the [QuestPilot v4.9](https://i.tank49.tech/blog/QuestPilot-4.9.zip) extension and extract the files.
2. Open any Chromium browser (Chrome, Edge, Brave, Arc) and go to `chrome://extensions`.
3. Enable **Developer Mode** in the top right corner.
4. Click **Load unpacked** and select the extracted extension folder.
5. Navigate to [Discord Quest](https://discord.com/quest-home)'s page and accept a quest.

> [!TIP]
> Compatible with `discord.com`, `canary.discord.com`, and `ptb.discord.com`.

---

## Important Notes

> [!CAUTION]
> You still need to manually accept a quest from the Quests page in Discord. Once accepted, the automation takes care of the rest.

> [!NOTE]
> The extension/script runs specifically on the Discord `/quest-home` page and remains inactive elsewhere.

> [!IMPORTANT]
> **iOS is NOT supported** as iOS browsers do not allow Chromium extension support or developer console execution.

> [!WARNING]
> For **Stream on Desktop** quests, make sure at least one other user is present in the voice channel to trigger progress.

---

## Credits

* **[TANK](https://tank49.tech/)** — QuestPilot architecture, UI dashboard & extension maintenance.

* **[Amia](https://github.com/aamiaa)** — Original quest automation concept & script logic.
* **[Etorix](https://github.com/EtorixDev/)** — Achievement in Activity automation logic.
