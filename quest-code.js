(function () {
    'use strict';

    if (typeof window.DiscordNative === 'undefined') {
        window.DiscordNative = {
            nativeModules: {
                requireModule: (moduleName) => {
                    const moduleExports = {
                        discord_utils: {
                            getDiscordUtils: () => ({
                                GetWindowFullscreenTypeByPid: () => 0
                            })
                        }
                    };
                    return moduleExports[moduleName] || {};
                }
            },
            process: {
                platform: 'win32'
            },
            os: {
                platform: 'win32',
                release: '10.0.0'
            },
            app: {
                getVersion: () => '1.0.0',
                getReleaseChannel: () => 'stable'
            },
            remoteApp: {
                getVersion: () => '1.0.0'
            }
        };
    }

    if (window.DiscordNative && !window.DiscordNative.nativeModules) {
        window.DiscordNative.nativeModules = {
            requireModule: (moduleName) => {
                const moduleExports = {
                    discord_utils: {
                        getDiscordUtils: () => ({
                            GetWindowFullscreenTypeByPid: () => 0
                        })
                    }
                };
                return moduleExports[moduleName] || {};
            }
        };
    }

    let isRunning = false;

    function waitForWebpack(callback, maxAttempts = 100, attempt = 0) {
        if (attempt >= maxAttempts) {
            console.error('Failed to load webpack after', maxAttempts, 'attempts');
            setTimeout(() => waitForWebpack(callback, 100, 0), 5000);
            return;
        }

        if (typeof window.webpackChunkdiscord_app === 'undefined') {
            setTimeout(() => waitForWebpack(callback, maxAttempts, attempt + 1), 100);
            return;
        }

        let wpRequire;
        try {
            delete window.$;
            wpRequire = window.webpackChunkdiscord_app.push([[Symbol()], {}, r => r]);
            window.webpackChunkdiscord_app.pop();

            if (!wpRequire || !wpRequire.c || Object.keys(wpRequire.c).length === 0) {
                setTimeout(() => waitForWebpack(callback, maxAttempts, attempt + 1), 100);
                return;
            }

            const moduleCount = Object.keys(wpRequire.c).length;
            if (moduleCount < 10) {
                setTimeout(() => waitForWebpack(callback, maxAttempts, attempt + 1), 100);
                return;
            }

            console.log('Webpack loaded with', moduleCount, 'modules');
        } catch (error) {
            console.error('Error accessing webpack:', error);
            setTimeout(() => waitForWebpack(callback, maxAttempts, attempt + 1), 100);
            return;
        }

        callback(wpRequire);
    }

    function runQuestCode(wpRequire) {
        if (isRunning) {
            console.log('Quest automation already running');
            return;
        }

        try {
            let ApplicationStreamingStore = Object.values(wpRequire.c).find(x => x?.exports?.A?.__proto__?.getStreamerActiveStreamMetadata)?.exports?.A;
            let RunningGameStore = Object.values(wpRequire.c).find(x => x?.exports?.Ay?.getRunningGames)?.exports?.Ay;
            let QuestsStore = Object.values(wpRequire.c).find(x => x?.exports?.A?.__proto__?.getQuest)?.exports?.A;
            let ChannelStore = Object.values(wpRequire.c).find(x => x?.exports?.A?.__proto__?.getAllThreadsForParent)?.exports?.A;
            let GuildChannelStore = Object.values(wpRequire.c).find(x => x?.exports?.Ay?.getSFWDefaultChannel)?.exports?.Ay;
            let FluxDispatcher = Object.values(wpRequire.c).find(x => x?.exports?.h?.__proto__?.flushWaitQueue)?.exports?.h;
            let api = Object.values(wpRequire.c).find(x => x?.exports?.Bo?.get)?.exports?.Bo;

            if (!ApplicationStreamingStore || !RunningGameStore || !QuestsStore || !ChannelStore || !GuildChannelStore || !FluxDispatcher || !api) {
                console.error('Failed to load required stores. Retrying in 2 seconds...');
                setTimeout(() => {
                    isRunning = false;
                    waitForWebpack(runQuestCode);
                }, 2000);
                return;
            }

            const supportedTasks = ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY", "WATCH_VIDEO_ON_MOBILE"];

            function processQuests() {
                let quests = [...QuestsStore.quests.values()].filter(x => x.userStatus?.enrolledAt && !x.userStatus?.completedAt && new Date(x.config.expiresAt).getTime() > Date.now() && supportedTasks.find(y => Object.keys((x.config.taskConfig ?? x.config.taskConfigV2).tasks).includes(y)));

                if (quests.length === 0) {
                    console.log("No uncompleted quests found");
                    isRunning = false;
                    return;
                }

                isRunning = true;

                let doJob = function () {
                    const quest = quests.pop();
                    if (!quest) {
                        isRunning = false;
                        return;
                    }

                    const pid = Math.floor(Math.random() * 30000) + 1000;

                    const applicationId = quest.config.application.id;
                    const applicationName = quest.config.application.name;
                    const questName = quest.config.messages.questName;
                    const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2;
                    const taskName = supportedTasks.find(x => taskConfig.tasks[x] != null);
                    const secondsNeeded = taskConfig.tasks[taskName].target;
                    let secondsDone = quest.userStatus?.progress?.[taskName]?.value ?? 0;

                    if (taskName === "WATCH_VIDEO" || taskName === "WATCH_VIDEO_ON_MOBILE") {
                        const maxFuture = 10, speed = 7, interval = 1;
                        const enrolledAt = new Date(quest.userStatus.enrolledAt).getTime();
                        let completed = false;
                        let fn = async () => {
                            while (true) {
                                const maxAllowed = Math.floor((Date.now() - enrolledAt) / 1000) + maxFuture;
                                const diff = maxAllowed - secondsDone;
                                const timestamp = secondsDone + speed;
                                if (diff >= speed) {
                                    const res = await api.post({ url: `/quests/${quest.id}/video-progress`, body: { timestamp: Math.min(secondsNeeded, timestamp + Math.random()) } });
                                    completed = res.body.completed_at != null;
                                    secondsDone = Math.min(secondsNeeded, timestamp);
                                }

                                if (timestamp >= secondsNeeded) {
                                    break;
                                }
                                await new Promise(resolve => setTimeout(resolve, interval * 1000));
                            }
                            if (!completed) {
                                await api.post({ url: `/quests/${quest.id}/video-progress`, body: { timestamp: secondsNeeded } });
                            }
                            console.log("Quest completed!");
                            doJob();
                        };
                        fn();
                        console.log('Spoofing video for', questName);
                    } else if (taskName === "PLAY_ON_DESKTOP") {
                        api.get({ url: `/applications/public?application_ids=${applicationId}` }).then(res => {
                            const appData = res.body[0];
                            const exeName = appData.executables?.find(x => x.os === "win32")?.name?.replace(">", "") ?? appData.name.replace(/[\/\\:*?"<>|]/g, "");

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
                            };
                            const realGames = RunningGameStore.getRunningGames();
                            const fakeGames = [fakeGame];
                            const realGetRunningGames = RunningGameStore.getRunningGames;
                            const realGetGameForPID = RunningGameStore.getGameForPID;
                            RunningGameStore.getRunningGames = () => fakeGames;
                            RunningGameStore.getGameForPID = (pid) => fakeGames.find(x => x.pid === pid);
                            FluxDispatcher.dispatch({ type: "RUNNING_GAMES_CHANGE", removed: realGames, added: [fakeGame], games: fakeGames });

                            let fn = data => {
                                let progress = quest.config.configVersion === 1 ? data.userStatus.streamProgressSeconds : Math.floor(data.userStatus.progress.PLAY_ON_DESKTOP.value);
                                console.log('Quest progress:', progress + '/' + secondsNeeded);

                                if (progress >= secondsNeeded) {
                                    console.log("Quest completed!");

                                    RunningGameStore.getRunningGames = realGetRunningGames;
                                    RunningGameStore.getGameForPID = realGetGameForPID;
                                    FluxDispatcher.dispatch({ type: "RUNNING_GAMES_CHANGE", removed: [fakeGame], added: [], games: [] });
                                    FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);

                                    doJob();
                                }
                            };
                            FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);

                            console.log('Spoofed your game to', applicationName + '. Wait for', Math.ceil((secondsNeeded - secondsDone) / 60), 'more minutes.');
                        }).catch(error => {
                            console.error('Failed to fetch application data:', error);
                            console.log('Retrying quest...');
                            setTimeout(() => doJob(), 2000);
                        });
                    } else if (taskName === "STREAM_ON_DESKTOP") {
                        let realFunc = ApplicationStreamingStore.getStreamerActiveStreamMetadata;
                        ApplicationStreamingStore.getStreamerActiveStreamMetadata = () => ({
                            id: applicationId,
                            pid,
                            sourceName: null
                        });

                        let fn = data => {
                            let progress = quest.config.configVersion === 1 ? data.userStatus.streamProgressSeconds : Math.floor(data.userStatus.progress.STREAM_ON_DESKTOP.value);
                            console.log('Quest progress:', progress + '/' + secondsNeeded);

                            if (progress >= secondsNeeded) {
                                console.log("Quest completed!");

                                ApplicationStreamingStore.getStreamerActiveStreamMetadata = realFunc;
                                FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);

                                doJob();
                            }
                        };
                        FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);

                        console.log('Spoofed your stream to', applicationName + '. Stream any window in vc for', Math.ceil((secondsNeeded - secondsDone) / 60), 'more minutes.');
                        console.log("Remember that you need at least 1 other person to be in the vc!");
                    } else if (taskName === "PLAY_ACTIVITY") {
                        const channelId = ChannelStore.getSortedPrivateChannels()[0]?.id ?? Object.values(GuildChannelStore.getAllGuilds()).find(x => x != null && x.VOCAL.length > 0).VOCAL[0].channel.id;
                        const streamKey = `call:${channelId}:1`;

                        let fn = async () => {
                            console.log("Completing quest", questName, "-", quest.config.messages.questName);

                            while (true) {
                                try {
                                    const res = await api.post({ url: `/quests/${quest.id}/heartbeat`, body: { stream_key: streamKey, terminal: false } });
                                    const progress = res.body.progress.PLAY_ACTIVITY.value;
                                    console.log('Quest progress:', progress + '/' + secondsNeeded);

                                    await new Promise(resolve => setTimeout(resolve, 20 * 1000));

                                    if (progress >= secondsNeeded) {
                                        await api.post({ url: `/quests/${quest.id}/heartbeat`, body: { stream_key: streamKey, terminal: true } });
                                        break;
                                    }
                                } catch (error) {
                                    console.error('Heartbeat failed, retrying...', error);
                                    await new Promise(resolve => setTimeout(resolve, 2000));
                                }
                            }

                            console.log("Quest completed!");
                            doJob();
                        };
                        fn();
                    }
                };
                doJob();
            }

            if (FluxDispatcher) {
                FluxDispatcher.subscribe("QUESTS_CLAIM_REWARD_SUCCESS", () => {
                    console.log('Quest accepted! Starting automation...');
                    setTimeout(processQuests, 1000);
                });

                FluxDispatcher.subscribe("QUESTS_ENROLL_SUCCESS", () => {
                    console.log('Quest enrolled! Starting automation...');
                    setTimeout(processQuests, 1000);
                });
            }

            processQuests();
        } catch (error) {
            console.error('Error running quest code:', error);
            console.log('Retrying in 2 seconds...');
            setTimeout(() => {
                isRunning = false;
                waitForWebpack(runQuestCode);
            }, 2000);
        }
    }

    waitForWebpack(runQuestCode);
})();