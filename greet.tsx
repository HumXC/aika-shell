#!/usr/bin/gjs -m
import {
    bind,
    Binding,
    exec,
    execAsync,
    Gio,
    GLib,
    idle,
    readFile,
    timeout,
    Variable,
} from "astal";
import { App, Astal, Gdk, Gtk, Widget } from "astal/gtk3";
import Greet from "gi://AstalGreet";
import { Image } from "./widget/base";
import { listDir, loadImage } from "./utils";
import cairo from "gi://cairo?version=1.0";
import GdkPixbuf from "gi://GdkPixbuf?version=2.0";
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
    icons: `${SRC}/assets/icons`,
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
    let entry: Widget.Entry = null as any;
    const err = Variable("");
    const isDone = Variable(true);
    const isAuth = Variable(false);

    return (
        <window
            onDestroy={() => {
                execAsync(["rm", bluredWallpaperFile]);
                App.quit();
            }}
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
                    else if (!isInput.get() && OPTION.test) self.close();
                }
                if (e.get_keyval()[1] === Gdk.KEY_Return) {
                    if (!isInput.get()) isInput.set(true);
                    else {
                        err.set("");
                        if (OPTION.test) {
                            if (entry.get_text() === "test") {
                                isDone.set(true);
                                timeout(dration, () => self.close());
                            } else {
                                err.set("Invalid password. 'test' is the correct password.");
                                entry.grab_focus();
                                entry.select_region(0, -1);
                            }
                        } else {
                            isAuth.set(true);
                            login(User.get(), entry.get_text(), Session.get(), OPTION.env)
                                .then((e) => {
                                    if (e) {
                                        console.error(e);
                                        err.set(e.message);
                                        entry.grab_focus();
                                        entry.select_region(0, -1);
                                    } else {
                                        isDone.set(true);
                                        timeout(dration, () => self.close());
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
            <overlay valign={Gtk.Align.FILL}>
                <Background background={wallpaper()} />
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
                <stack
                    halign={Gtk.Align.START}
                    valign={Gtk.Align.FILL}
                    transitionType={Gtk.StackTransitionType.OVER_RIGHT_LEFT}
                    transitionDuration={dration}
                    shown={isInput((i) => (i ? "inputPage" : "empty"))}
                >
                    <box name={"empty"} />
                    <box name={"inputPage"}>
                        {(() => {
                            const [w, ent] = InputPage(err);
                            entry = ent;
                            return w;
                        })()}
                    </box>
                </stack>
                <revealer
                    revealChild={true}
                    receivesDefault={true}
                    transitionType={Gtk.RevealerTransitionType.CROSSFADE}
                    transitionDuration={0}
                    visible={true}
                    setup={(self) => {
                        self.hook(bind(isDone), (_, v) => {
                            if (v) {
                                self.transitionDuration = 0;
                                self.revealChild = false;
                                self.visible = true;
                                self.transitionDuration = dration;
                                idle(() => (self.revealChild = true));
                            } else {
                                self.transitionDuration = 0;
                                self.revealChild = true;
                                self.visible = true;
                                self.transitionDuration = dration * 2;
                                idle(() => (self.revealChild = false));
                                timeout(dration * 2, () => (self.visible = false));
                            }
                        });
                    }}
                >
                    <box css={"background: black;"} />
                </revealer>
            </overlay>
        </window>
    );
}
function Background({
    background,
    visible = true,
}: {
    visible?: boolean | Binding<boolean | undefined>;
    background: string | Binding<string | undefined>;
}) {
    return (
        <box
            hexpand={true}
            vexpand={true}
            visible={visible}
            setup={(self) => {
                const set = (file: string) => {
                    if (file === "") return;
                    self.css = `
                        background-image: url("${file}");
                        background-size: cover;
                        background-repeat: no-repeat;
                        background-position: center;`;
                };
                if (typeof background === "string") set(background);
                else {
                    self.hook(bind(background), (_, v) => set(v));
                    set(background.get()!);
                }
            }}
            // @ts-ignore
            onDraw={(self: Widget.Box, cr: any) => {
                // cr.setSourceRGB(255, 0, 0);
                // cr.rectangle(10, 10, 100, 100);
                // cr.paint();
            }}
        />
    );
}

function ArrowButton({
    direction,
    onClick = (self: Widget.EventBox, e: Astal.ClickEvent) => {},
    valign = Gtk.Align.CENTER,
    halign = Gtk.Align.CENTER,
}: {
    direction: "left" | "right";
    onClick?: (self: Widget.EventBox, e: Astal.ClickEvent) => void;
    valign?: Gtk.Align | Binding<Gtk.Align | undefined> | undefined;
    halign?: Gtk.Align | Binding<Gtk.Align | undefined> | undefined;
}) {
    let box: Widget.Icon = null as any;
    const css = (color: string) => {
        return `
            background-color: ${color};
            border-radius: 50%;
            transition: background-color 0.2s ease-in-out;
            font-size: 16px;
        `;
    };
    return (
        <box halign={halign} valign={valign} hexpand={true} vexpand={true}>
            <eventbox
                onHover={(self) => {
                    box.css = css("rgba(255, 255, 255, 0.2)");
                }}
                onHoverLost={(self) => {
                    box.css = css("rgba(255, 255, 255, 0.1)");
                }}
                onClick={(self, e) => onClick(self, e)}
            >
                <icon
                    icon={direction === "left" ? "go-previous-symbolic" : "go-next-symbolic"}
                    widthRequest={32}
                    heightRequest={32}
                    opacity={0.8}
                    css={css("rgba(255, 255, 255, 0.1)")}
                    setup={(self) => (box = self)}
                />
            </eventbox>
        </box>
    );
}
function InputPage(err: Variable<string>): [Gtk.Widget, Widget.Entry] {
    let entry: Widget.Entry = null as any;
    const w = (
        <centerbox
            hexpand={true}
            vexpand={true}
            vertical={true}
            halign={Gtk.Align.FILL}
            valign={Gtk.Align.FILL}
            css={`
                background: rgba(0, 0, 0, 1);
                padding: 30px;
            `}
        >
            <box vexpand={true} />
            <box vertical={true} halign={Gtk.Align.CENTER} hexpand={true}>
                <box marginTop={12} spacing={16}>
                    <box hexpand={true} />
                    <icon
                        heightRequest={200}
                        widthRequest={200}
                        iconSize={16}
                        setup={(self) => {
                            const css = (user: string | null = null) => {
                                return (
                                    `
                                    background-size: cover;
                                    background-repeat: no-repeat;
                                    background-position: center;
                                    border-radius: 100%;
                                    font-size: 200px;
                                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);` +
                                    (user
                                        ? `background-image: url("/var/lib/AccountsService/icons/${user}");`
                                        : "")
                                );
                            };
                            const set = (u: string) => {
                                self.icon = "folder-image-people";
                                if (
                                    Gio.File.new_for_path(
                                        `/var/lib/AccountsService/icons/${u}`
                                    ).query_exists(null)
                                ) {
                                    self.css = css(u);
                                    self.pixbuf = GdkPixbuf.Pixbuf.new(
                                        GdkPixbuf.Colorspace.RGB,
                                        true,
                                        8,
                                        1,
                                        1
                                    );
                                    self.pixbuf.fill(0);
                                } else {
                                    self.css = css();
                                    self.icon = "people";
                                }
                            };
                            self.hook(bind(User), (_, u) => set(u));
                            set(User.get());
                        }}
                    />
                    <box hexpand={true} />
                </box>

                <box valign={Gtk.Align.CENTER} halign={Gtk.Align.CENTER}>
                    <ArrowButton
                        direction="left"
                        halign={Gtk.Align.END}
                        onClick={(self, e) => {
                            const index = Users.indexOf(User.get()) - 1;
                            if (index < 0) User.set(Users[Users.length - 1]);
                            else User.set(Users[index]);
                        }}
                    />
                    <label label={User()} css={"font-size: 32px;"} widthRequest={180} />
                    <ArrowButton
                        direction="right"
                        halign={Gtk.Align.START}
                        onClick={(self, e) => {
                            const index = Users.indexOf(User.get()) + 1;
                            if (index === Users.length) User.set(Users[0]);
                            else User.set(Users[index]);
                        }}
                    />
                </box>
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
            </box>
            <box
                valign={Gtk.Align.FILL}
                halign={Gtk.Align.CENTER}
                vexpand={true}
                hexpand={true}
                marginBottom={20}
                vertical={true}
            >
                <label
                    marginTop={20}
                    label={err()}
                    css={"font-size: 16px;"}
                    wrap={true}
                    maxWidthChars={30}
                />
                <box vexpand={true} />
                <SessionSelector selected={Session} sessions={Sessions} />
            </box>
        </centerbox>
    );
    return [w, entry];
}
function SessionSelector({
    sessions,
    selected,
}: {
    sessions: Gio.DesktopAppInfo[];
    selected: Variable<string>;
}) {
    const labelCss = (isShow: boolean) => {
        return `
            font-size: 16px;
            color: ${isShow ? "rgba(255, 255, 255, 0.6)" : "rgba(255, 255, 255, 0.3)"};
            transition: color 0.2s ease-in-out;
        `;
    };
    return (
        <box spacing={8} vertical={true} halign={Gtk.Align.CENTER}>
            <box spacing={8} halign={Gtk.Align.CENTER}>
                <eventbox
                    valign={Gtk.Align.BASELINE}
                    onHover={(self) => ((self.get_child() as Widget.Label).css = labelCss(true))}
                    onHoverLost={(self) =>
                        ((self.get_child() as Widget.Label).css = labelCss(false))
                    }
                    onClick={(self, e) => {
                        let index =
                            sessions.findIndex((session) => session.get_name() === selected.get()) -
                            1;
                        if (index === -1) index = sessions.length - 1;
                        selected.set(sessions[index].get_name());
                    }}
                >
                    <label css={labelCss(false)} valign={Gtk.Align.BASELINE} label={"<"} />
                </eventbox>

                <label
                    label={selected()}
                    opacity={0.8}
                    css={"font-size: 20px;"}
                    valign={Gtk.Align.BASELINE}
                />
                <eventbox
                    valign={Gtk.Align.BASELINE}
                    onHover={(self) => ((self.get_child() as Widget.Label).css = labelCss(true))}
                    onHoverLost={(self) =>
                        ((self.get_child() as Widget.Label).css = labelCss(false))
                    }
                    onClick={(self, e) => {
                        let index =
                            sessions.findIndex((session) => session.get_name() === selected.get()) +
                            1;
                        if (index === sessions.length) index = 0;
                        selected.set(sessions[index].get_name());
                    }}
                >
                    <label css={labelCss(false)} label={">"} valign={Gtk.Align.BASELINE} />
                </eventbox>
            </box>
            <label
                opacity={0.5}
                css={"font-size: 14px;"}
                wrap={true}
                maxWidthChars={40}
                label={selected(
                    (s) =>
                        sessions.find((session) => session.get_name() === s)?.get_description() ||
                        ""
                )}
            />
        </box>
    );
}
