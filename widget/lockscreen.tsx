import { AstalIO, bind, exec, execAsync, GLib, idle, timeout, Variable } from "astal";
import { Gdk, Gtk, Widget } from "astal/gtk3";
import Auth from "gi://AstalAuth";
import { Clock } from "./top-bar";
import { GetConfig } from "../configs";

function auth(password: string): Promise<void> {
    return new Promise((resolve, reject) => {
        Auth.Pam.authenticate(password, (_, task) => {
            try {
                Auth.Pam.authenticate_finish(task);
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    });
}
class LockScreenConfig {
    wallpaper: string = "";
}
export default function LockScreen() {
    let wallpaper = GetConfig(LockScreenConfig, "lockscreen").wallpaper;
    if (wallpaper !== "") {
        const allowImages = ["jpg", "jpeg", "png"];
        const ext = wallpaper.split(".").pop()?.toLowerCase();
        if (ext !== undefined && !allowImages.includes(ext)) {
            try {
                const images = exec(["ls", "-1", wallpaper])
                    .split("\n")
                    .filter((file) => {
                        const ext = file.split(".").pop()?.toLowerCase();
                        return ext !== undefined && allowImages.includes(ext);
                    });
                wallpaper += "/" + images[Math.floor(Math.random() * images.length)];
            } catch (error) {}
        }
    }
    let blurWallpaper = "";
    execAsync([
        "magick",
        wallpaper,
        "-resize",
        "10%",
        "-gaussian-blur",
        "18x6",
        "/tmp/lockscreen-blur.jpg",
    ])
        .then(() => (blurWallpaper = "/tmp/lockscreen-blur.jpg"))
        .catch((e) => {
            console.error(e);
        });
    const err = new Variable("");
    const inputState = new Variable(false);
    const animateDuration = 500;
    const background = (
        <box
            onDestroy={() => {
                if (blurWallpaper !== "") {
                    idle(() => execAsync(["rm", "-f", blurWallpaper]));
                }
            }}
            css={bind(inputState).as((s) => {
                if (s && blurWallpaper !== "")
                    return `
                background-image: url("${blurWallpaper}");
                background-size: cover;
                background-repeat: no-repeat;
                background-position: center;
            `;
                return `
                background-image: url("${wallpaper}");
                background-size: cover;
                background-repeat: no-repeat;
                background-position: center;
            `;
            })}
        >
            <revealer
                marginBottom={600}
                css={"text-shadow: 0 0 5px #000;"}
                transitionType={Gtk.RevealerTransitionType.CROSSFADE}
                setup={(self) => {
                    self.hook(bind(inputState), (_, t) => {
                        if (!t) self.transitionDuration = animateDuration / 2;
                        else self.transitionDuration = animateDuration * 1.5;
                    });
                }}
                revealChild={inputState().as((t) => {
                    return !t;
                })}
                hexpand={true}
                vexpand={true}
            >
                <Clock fontSize={128} fontWeight="normal" />
            </revealer>
        </box>
    );
    const entry = (
        <entry
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
    ) as Gtk.Entry;
    const inputPage = (
        <box
            className={"LockScreen"}
            css={"background-color: rgba(0, 0, 0, 0.5);"}
            hexpand={true}
            vexpand={true}
        >
            <box halign={Gtk.Align.CENTER} valign={Gtk.Align.CENTER} hexpand={true} vexpand={true}>
                <box vertical={true} spacing={20}>
                    <box
                        vexpand={false}
                        heightRequest={220}
                        widthRequest={220}
                        css={`
                            background-image: url("${GLib.get_home_dir()}/.face");
                            background-size: cover;
                            background-repeat: no-repeat;
                            background-position: center;
                            border-radius: 100%;
                            box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
                        `}
                    />
                    <label
                        label={GLib.get_user_name()}
                        css={"font-size: 30px;text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);"}
                    />
                    <box vertical={true}>
                        <overlay>
                            {entry}
                            <icon
                                icon={"arrow-right"}
                                heightRequest={24}
                                widthRequest={24}
                                halign={Gtk.Align.END}
                                marginEnd={6}
                            />
                        </overlay>
                        <label halign={Gtk.Align.CENTER} label={err()} />
                    </box>
                    <box heightRequest={20} />
                </box>
            </box>
        </box>
    );
    let stack: Widget.Stack = null as any;
    const window = new Gtk.Window({
        child: (
            <stack
                transitionDuration={animateDuration}
                transitionType={Gtk.StackTransitionType.SLIDE_DOWN}
                homogeneous={true}
                setup={(self) => {
                    stack = self;
                    idle(() => {
                        self.shown = "lockscreen";
                    });
                }}
            >
                <box name={"empty"} />
                <overlay
                    name={"lockscreen"}
                    className={"LockScreen"}
                    halign={Gtk.Align.FILL}
                    valign={Gtk.Align.FILL}
                >
                    {background}
                    <revealer
                        transitionDuration={animateDuration}
                        transitionType={Gtk.RevealerTransitionType.CROSSFADE}
                        revealChild={inputState()}
                    >
                        {inputPage}
                    </revealer>
                </overlay>
            </stack>
        ),
    });
    let revealing = false;
    let canReveal = true;
    let timer: AstalIO.Time | null = null;
    window.connect("key-press-event", (self, e) => {
        if (!canReveal) return;
        const doReveal = () => {
            revealing = true;
            if (timer) timer.cancel();

            let t = animateDuration;
            if (!inputState.get()) {
                t = animateDuration * 1.5; // 时钟的关闭时间是1.5倍于背景的打开时间
            }
            timer = timeout(t, () => {
                revealing = false;
            });
            idle(() => {
                entry.text = "";
                err.set("");
                if (inputState.get()) {
                    entry.editable = true;
                    entry.grab_focus();
                }
            });
        };
        if (canReveal && e.get_keyval()[1] === Gdk.KEY_Escape && inputState.get()) {
            doReveal();
            inputState.set(false);
        }
        if (canReveal && e.get_keyval()[1] === Gdk.KEY_Return && !inputState.get()) {
            doReveal();
            inputState.set(true);
        }
        if (!revealing && e.get_keyval()[1] === Gdk.KEY_Return && inputState.get()) {
            err.set("");
            const password = entry.text;
            if (password.length === 0) return;
            entry.editable = false;
            canReveal = false;
            auth(password)
                .then(() => {
                    stack.transitionType = Gtk.StackTransitionType.SLIDE_UP;
                    stack.shown = "empty";
                    timeout(animateDuration, () => self.destroy());
                })
                .catch((error) => {
                    err.set(error.message);
                    idle(() => {
                        entry.editable = true;
                        entry.grab_focus();
                        entry.select_region(0, -1);
                        canReveal = true;
                    });
                });
        }
    });
    const cssProvider = new Gtk.CssProvider();
    cssProvider.load_from_data("window { background: transparent;}");
    const context = window.get_style_context();
    context.add_provider(cssProvider, Gtk.STYLE_PROVIDER_PRIORITY_USER);
    return window;
}
