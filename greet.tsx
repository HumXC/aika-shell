#!/usr/bin/gjs -m
import { bind, Binding, exec, execAsync, Gio, idle, readFile, timeout, Variable } from "astal";
import { App, Astal, Gdk, Gtk, Widget } from "astal/gtk3";
import Greet from "gi://AstalGreet";
import { Image } from "./widget/base";
import { listDir, loadImage } from "./utils";
function getUsers() {
    const users: string[] = [];
    readFile("/etc/passwd")
        .split("\n")
        .forEach((line) => {
            const item = line.split(":");
            if (parseInt(item[2]) >= 1000 && item[0] !== "nobody") users.push(item[0]);
        });
    return users;
}
function getSessions(folders: string[]) {
    return exec(["find", ...folders, "-type", "f", "-o", "-type", "l", "-name", "*.desktop"])
        .split("\n")
        .map((d) => Gio.DesktopAppInfo.new_from_filename(d));
}
async function login(user: string, passwd: string, session: string, env: string[]) {
    return new Promise<Error | null>((resolve) => {
        const s = Sessions.find((s) => s.get_name() === session)!;
        Greet.login_with_env(user, passwd, s.get_executable(), env, (_, res) => {
            try {
                Greet.login_with_env_finish(res);
                resolve(null);
            } catch (e: any) {
                resolve(e);
            }
        });
    });
}
type Option = {
    defaultUser: string;
    defaultSession: string;
    defaultMonitor: number;
    wallpaperDir: string;
    test: boolean;
    env: string[];
    sessionDirs: string[];
};
function parseArgs(args: string[]): Option {
    function get<T extends string | number>(
        i: number,
        flag: string,
        defaultValue: T
    ): [value: T, index: number] {
        if (args[i] === flag) {
            if (typeof defaultValue === "number") {
                return [parseFloat(args[i + 1]) as T, i + 1];
            } else {
                return [args[i + 1] as T, i + 1];
            }
        }
        return [defaultValue, i];
    }
    const result: Option = {
        defaultUser: "",
        defaultSession: "",
        defaultMonitor: 0,
        wallpaperDir: "/home/greeter/wallpaper",
        test: false,
        sessionDirs: [],
        env: [],
    };
    for (let i = 0; i < args.length; i++) {
        [result.defaultUser, i] = get(i, "-u", result.defaultUser);
        [result.defaultSession, i] = get(i, "-s", result.defaultSession);
        [result.defaultMonitor, i] = get(i, "-m", result.defaultMonitor);
        [result.wallpaperDir, i] = get(i, "-w", result.wallpaperDir);
        if (args[i] === "-test") result.test = true;
        if (args[i] === "-e") {
            result.env.push(args[i + 1]);
            i++;
        }
        if (args[i] === "-d") {
            result.sessionDirs.push(args[i + 1]);
            i++;
        }
    }
    if (result.sessionDirs.length === 0)
        result.sessionDirs.push("/usr/share/xsessions", "/usr/share/wayland-sessions");
    return result;
}
// ags run greeter.tsx -a -test -a -s -a <USER> -a <CMD>
// aika-greet -u <DEFAULT_USER> -e <NAME=value> -test -w <WALLPAPER_DIR> -m <MONITOR> -s <DEFAULT_SESSION>
const User = Variable("");
const Session = Variable("");
const Monitor = Variable(0);
const OPTION = parseArgs(ARGV);
print(JSON.stringify(OPTION, null, 2));
const Sessions = getSessions(OPTION.sessionDirs);
print(Sessions.map((s) => "Session: " + s.get_name()).join("\n"));
const Users = getUsers();
print(Users.map((u) => "User: " + u).join("\n"));
print(OPTION.env.map((e) => "Env: " + e).join("\n"));
Users.forEach((u) => {
    if (u === OPTION.defaultUser) User.set(u);
});
if (User.get() === "") User.set(Users[0] ? Users[0] : "");
Sessions.forEach((s) => {
    if (s.get_name() === OPTION.defaultSession) Session.set(s.get_name());
});
if (Session.get() === "") Session.set(Sessions[0]?.get_name() ? Sessions[0]?.get_name() : "");
if (OPTION.defaultMonitor !== 0) Monitor.set(OPTION.defaultMonitor);

const Wallpapers = listDir(OPTION.wallpaperDir, [".jpg", ".jpeg", ".png"]);
print("Find wallpapers number: " + Wallpapers.length);

App.start({
    icons: `${SRC}/icons`,
    main() {
        App.get_monitors().map((_, index) => Greeter(index));
    },
});
const time = Variable("00:00").poll(1000, 'date +"%H:%M"');

function Greeter(monitor: number) {
    const isInput = Variable(false);
    const dration = 400;
    const wallpaper = Variable("");
    const bluredWallpaper = Variable("");
    if (Wallpapers.length > 0) {
        const settingWallpaper = Wallpapers.filter((w) => {
            const i = w.split("/").pop()?.split(".").shift();
            return i && parseInt(i) === monitor;
        });
        if (settingWallpaper.length > 0) {
            wallpaper.set(settingWallpaper[0]);
        } else {
            wallpaper.set(Wallpapers[Math.floor(Math.random() * Wallpapers.length)]);
        }
    }
    const bluredWallpaperFile = `${OPTION.wallpaperDir}/greet-blur-${monitor}.jpg`;
    if (wallpaper.get() !== "")
        execAsync([
            "magick",
            wallpaper.get(),
            "-resize",
            "10%",
            "-gaussian-blur",
            "18x6",
            bluredWallpaperFile,
        ])
            .then(() => bluredWallpaper.set(bluredWallpaperFile))
            .catch((e) => {
                console.error(e);
            });
    let entry: Gtk.Entry = null as any;
    let err: Widget.Label = null as any;
    const isDone = Variable(true);
    const isAuth = Variable(false);

    return (
        <window
            onDestroy={() => execAsync(["rm", bluredWallpaperFile])}
            monitor={monitor}
            keymode={Astal.Keymode.EXCLUSIVE}
            anchor={
                Astal.WindowAnchor.LEFT |
                Astal.WindowAnchor.TOP |
                Astal.WindowAnchor.RIGHT |
                Astal.WindowAnchor.BOTTOM
            }
            css={`
                color: white;
                background: black;
            `}
            onKeyPressEvent={(self, e) => {
                if (isDone.get() || isAuth.get()) return;
                if (e.get_keyval()[1] === Gdk.KEY_Escape) {
                    if (isInput.get()) isInput.set(false);
                    else if (!isInput.get() && OPTION.test) App.quit();
                }
                if (e.get_keyval()[1] === Gdk.KEY_Return) {
                    if (!isInput.get()) isInput.set(true);
                    else {
                        err.set_text("");
                        if (OPTION.test) {
                            if (entry.get_text() === "test") {
                                isDone.set(true);
                                timeout(dration, () => App.quit());
                            } else {
                                err.set_text("Invalid password. 'test' is the correct password.");
                                entry.grab_focus();
                                entry.select_region(0, -1);
                            }
                        } else {
                            isAuth.set(true);
                            login(User.get(), entry.get_text(), Session.get(), OPTION.env)
                                .then((e) => {
                                    if (e) {
                                        console.error(e);
                                        err.set_text(e.message);
                                        entry.grab_focus();
                                        entry.select_region(0, -1);
                                    } else {
                                        isDone.set(true);
                                        timeout(dration, () => App.quit());
                                    }
                                })
                                .finally(() => isAuth.set(false));
                        }
                    }
                }
            }}
            setup={(self) => {
                self.hook(bind(isInput), (_, v) => {
                    if (v)
                        timeout(dration, () => {
                            if (isInput.get()) entry.grab_focus();
                        });
                });
                idle(() => isDone.set(false));
            }}
        >
            <overlay halign={Gtk.Align.FILL} valign={Gtk.Align.FILL}>
                <Background monitor={monitor} background={wallpaper()} />
                <revealer
                    transitionType={Gtk.RevealerTransitionType.CROSSFADE}
                    transitionDuration={dration}
                    revealChild={isInput()}
                >
                    <Background monitor={monitor} background={bluredWallpaper()} />
                </revealer>
                <revealer
                    transitionType={Gtk.RevealerTransitionType.CROSSFADE}
                    transitionDuration={100}
                    revealChild={isInput()}
                >
                    <box css={"background: rgba(0, 0, 0, 0.5);"} />
                </revealer>

                <revealer
                    transitionType={Gtk.RevealerTransitionType.CROSSFADE}
                    transitionDuration={dration * 5}
                    setup={(self) => {
                        idle(() => (self.revealChild = true));
                        self.hook(bind(isInput), (_, v) => {
                            self.transitionDuration = v ? dration / 3 : dration;
                            self.revealChild = !v;
                        });
                    }}
                    halign={Gtk.Align.CENTER}
                    valign={Gtk.Align.START}
                >
                    <label
                        label={time()}
                        css={"font-size: 128px; text-shadow: 0 0 5px #000;"}
                        marginTop={220}
                    />
                </revealer>
                <revealer
                    transitionType={Gtk.RevealerTransitionType.CROSSFADE}
                    transitionDuration={dration}
                    revealChild={isInput()}
                    halign={Gtk.Align.FILL}
                    valign={Gtk.Align.FILL}
                >
                    <box
                        hexpand={true}
                        vexpand={true}
                        vertical={true}
                        halign={Gtk.Align.CENTER}
                        valign={Gtk.Align.CENTER}
                    >
                        <box marginTop={12}>
                            <box hexpand={true} />
                            <box
                                heightRequest={200}
                                widthRequest={200}
                                css={User(
                                    (u) => `
                                    background-image: url("/var/lib/AccountsService/icons/${u}");
                                    background-size: cover;
                                    background-repeat: no-repeat;
                                    background-position: center;
                                    border-radius: 100%;
                                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
                                    `
                                )}
                            />
                            <box hexpand={true} />
                        </box>
                        <label
                            label={User()}
                            css={`
                                font-size: ${32}px;
                            `}
                        />
                        <box>
                            <box hexpand={true} />
                            <overlay marginTop={50}>
                                <entry
                                    setup={(self) => (entry = self)}
                                    widthRequest={300}
                                    visibility={false}
                                    css={`
                                        border-radius: 20px;
                                        background-color: rgba(0, 0, 0, 0.3);
                                        border: 1px solid rgba(255, 255, 255, 0.5);
                                        box-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
                                        padding-left: 12px;
                                        padding-right: 30px;
                                        color: white;
                                    `}
                                />
                                <icon
                                    icon={"builder-move-right-symbolic"}
                                    css={`
                                        font-size: 16px;
                                    `}
                                    halign={Gtk.Align.END}
                                    marginEnd={12}
                                    opacity={0.5}
                                />
                            </overlay>
                            <box hexpand={true} />
                        </box>

                        <label
                            marginTop={20}
                            setup={(self) => (err = self)}
                            css={"font-size: 16px;"}
                        />
                        <box heightRequest={200} />
                    </box>
                </revealer>
                <revealer
                    receivesDefault={false}
                    transitionType={Gtk.RevealerTransitionType.CROSSFADE}
                    transitionDuration={dration}
                    revealChild={isDone()}
                >
                    <box css={"background: black;"} />
                </revealer>
            </overlay>
        </window>
    );
}
function Background({
    monitor,
    background,
    visible = true,
}: {
    monitor: number;
    visible?: boolean | Binding<boolean | undefined>;
    background: string | Binding<string | undefined>;
}) {
    return (
        <Image
            visible={visible}
            setup={(self) => {
                const set = (file: string) => {
                    if (file === "") return;
                    print(`Set wallpaper ${file} for monitor ${monitor}`);
                    const { width, height } = self
                        .get_display()
                        .get_monitor(monitor)!
                        .get_geometry();
                    const pixbuf = loadImage(file, width, height);
                    self.pixbuf = pixbuf;
                };
                if (typeof background === "string") set(background);
                else {
                    self.hook(bind(background), (_, v) => set(v));
                    set(background.get()!);
                }
            }}
        />
    );
}
