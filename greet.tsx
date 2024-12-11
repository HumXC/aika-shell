#!/usr/bin/gjs -m
import { bind, exec, execAsync, Gio, GLib, idle, timeout, Variable } from "astal";
import { App, Astal, Gdk, Gtk, Widget } from "astal/gtk3";
import Greet from "gi://AstalGreet";
// ags run greeter.tsx -a -test -a -s -a <USER> -a <CMD>
// aika-greet -s HumXC Hyprland
const User = Variable("");
const Session = new Map<string, string>();
let WALLPAPER_DIR = "/home/greeter/wallpaper";
let MONITOR = 0;
let TEST = false;
for (let i = 0; i < ARGV.length; i++) {
    if (ARGV[i] === "-test") {
        TEST = true;
        continue;
    }
    if (ARGV[i] === "-m") {
        MONITOR = parseInt(ARGV[i + 1]);
        i++;
        continue;
    }
    if (ARGV[i] === "-w") {
        WALLPAPER_DIR = ARGV[i + 1];
        i++;
        continue;
    }
    if (ARGV[i] === "-s") {
        Session.set(ARGV[i + 1], ARGV[i + 2]);
        i += 2;
        continue;
    }
}
if (Session.size === 0) {
    console.error("No session found.");
    App.quit();
}
User.set(Session.entries().next().value![0]);
const wallpapers = listDir(WALLPAPER_DIR, [".jpg", ".jpeg", ".png"]);
App.start({
    icons: `${SRC}/icons`,
    main() {
        App.get_monitors().map((_, index) => Greeter(index, index === MONITOR, wallpapers));
    },
});
const time = Variable("00:00").poll(1000, 'date +"%H:%M"');
function Greeter(monitor: number, main: boolean = true, wallpapers: string[]) {
    const isInput = Variable(false);
    const isMain = Variable(main); // 多屏幕场景使用
    const dration = 400;
    const wallpaper = Variable("");
    const bluredWallpaper = Variable("");
    if (wallpapers.length > 0) {
        const settingWallpaper = wallpapers.filter((w) => {
            const i = w.split("/").pop()?.split(".").shift();
            return i && parseInt(i) === monitor;
        });
        if (settingWallpaper.length > 0) {
            wallpaper.set(settingWallpaper[0]);
        } else {
            wallpaper.set(wallpapers[Math.floor(Math.random() * wallpapers.length)]);
        }
    }
    if (wallpaper.get() !== "")
        execAsync([
            "magick",
            wallpaper.get(),
            "-resize",
            "10%",
            "-gaussian-blur",
            "18x6",
            "/tmp/greet-blur.jpg",
        ])
            .then(() => bluredWallpaper.set("/tmp/greet-blur.jpg"))
            .catch((e) => {
                console.error(e);
            });
    let entry: Gtk.Entry = null as any;
    let err: Widget.Label = null as any;
    const isDone = Variable(true);
    return (
        <window
            monitor={monitor}
            keymode={Astal.Keymode.EXCLUSIVE}
            anchor={
                Astal.WindowAnchor.LEFT |
                Astal.WindowAnchor.TOP |
                Astal.WindowAnchor.RIGHT |
                Astal.WindowAnchor.BOTTOM
            }
            onKeyPressEvent={(self, e) => {
                if (isDone.get()) return;
                if (e.get_keyval()[1] === Gdk.KEY_Escape) {
                    if (isInput.get()) isInput.set(false);
                    else if (!isInput.get() && TEST) App.quit();
                }
                if (e.get_keyval()[1] === Gdk.KEY_Return) {
                    if (!isInput.get()) isInput.set(true);
                    else {
                        err.set_text("");
                        const session = Session.entries().next().value!;
                        if (TEST) {
                            if (entry.get_text() === "test") {
                                isDone.set(true);
                                timeout(dration, () => App.quit());
                            } else {
                                err.set_text("Invalid password. 'test' is the correct password.");
                                entry.grab_focus();
                                entry.select_region(0, -1);
                            }
                        } else
                            Greet.login(session[0], entry.get_text(), session[1], (_, res) => {
                                try {
                                    Greet.login_finish(res);
                                    isDone.set(true);
                                    timeout(dration, () => App.quit());
                                } catch (e: any) {
                                    err.set_text(e.message);
                                    entry.grab_focus();
                                    entry.select_region(0, -1);
                                }
                            });
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
                <box
                    css={wallpaper(
                        (w) => `
                                background-image: url("${w}");
                                background-size: cover;
                                background-repeat: no-repeat;
                                background-position: center;
                            `
                    )}
                    hexpand={true}
                    vexpand={true}
                />
                <revealer
                    transitionType={Gtk.RevealerTransitionType.CROSSFADE}
                    transitionDuration={dration}
                    revealChild={isInput()}
                >
                    <box
                        css={bluredWallpaper(
                            (w) => `
                                background-image: url("${w}");
                                background-size: cover;
                                background-repeat: no-repeat;
                                background-position: center;
                            `
                        )}
                        visible={isInput()}
                    />
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
                        css={"font-size: 128px;text-shadow: 0 0 5px #000;"}
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
                                    background-image: url("/home/${u}/.face");
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
                        <label label={User()} css={"font-size: 32px;"} />
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
                                    `}
                                />
                                <icon
                                    icon={"arrow-right"}
                                    heightRequest={24}
                                    widthRequest={24}
                                    halign={Gtk.Align.END}
                                    marginEnd={6}
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
function listDir(folder: string, allowedFile: Array<string>): Array<string> {
    const files: Array<string> = [];
    const cmd = ["find", folder];
    cmd.push("-type", "f");
    allowedFile.forEach((file) => cmd.push("-iname", "*" + file, "-o"));
    cmd.pop();
    files.push(...exec(cmd).split("\n"));
    return files;
}
