import { AstalIO, bind, execAsync, GLib, idle, timeout, Variable } from "astal";
import { Gdk, Gtk, Widget } from "astal/gtk3";
import Auth from "gi://AstalAuth";
import { Clock } from "./top-bar";
import { GetConfig } from "../configs";
import { listDir, loadImage } from "../utils";
import { Image } from "./base";

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
const time = Variable("00:00").poll(1000, 'date +"%H:%M"');
class LockScreenConfig {
    wallpaper: string = "";
}
export default function LockScreen(monitor: Gdk.Monitor) {
    const wallpaper = new Variable("");
    const bluredWallpaper = new Variable("");
    let wallpaperConfig = GetConfig(LockScreenConfig, "lockscreen").wallpaper;
    if (wallpaperConfig !== "") {
        const images = listDir(wallpaperConfig, ["jpg", "jpeg", "png"]);
        wallpaper.set(images[Math.floor(Math.random() * images.length)]);
    }
    execAsync([
        "magick",
        wallpaper.get(),
        "-resize",
        "10%",
        "-gaussian-blur",
        "18x6",
        "/tmp/lockscreen-blur.jpg",
    ])
        .then(() => bluredWallpaper.set("/tmp/lockscreen-blur.jpg"))
        .catch((e) => {
            console.error(e);
        });
    const err = new Variable("");
    const isInput = new Variable(false);
    const animateDuration = 500;

    let entry: Gtk.Entry = null as any;
    const inputPage = (
        <box
            className={"LockScreen"}
            css={"background-color: rgba(0, 0, 0, 0.5);"}
            hexpand={true}
            vexpand={true}
        >
            <box halign={Gtk.Align.CENTER} valign={Gtk.Align.CENTER} hexpand={true} vexpand={true}>
                <box vertical={true}>
                    <box marginTop={12}>
                        <box hexpand={true} />
                        <box
                            heightRequest={200}
                            widthRequest={200}
                            css={`
                                background-image: url("/var/lib/AccountsService/icons/${GLib.get_user_name()}");
                                background-size: cover;
                                background-repeat: no-repeat;
                                background-position: center;
                                border-radius: 100%;
                                box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
                            `}
                        />
                        <box hexpand={true} />
                    </box>
                    <label
                        label={GLib.get_user_name()}
                        css={"font-size: 32px;text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);"}
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
                                css={"font-size: 16px;"}
                                halign={Gtk.Align.END}
                                marginEnd={12}
                                opacity={0.5}
                            />
                        </overlay>
                        <box hexpand={true} />
                    </box>
                    <label halign={Gtk.Align.CENTER} label={err()} />
                    <box heightRequest={200} />
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
                    {wallpaper((w) => {
                        if (w === "") return <box />;
                        return (
                            <Image
                                setup={(self) => {
                                    const { width, height } = monitor.get_geometry();
                                    const pixbuf = loadImage(w, width, height);
                                    self.pixbuf = pixbuf;
                                }}
                            />
                        );
                    })}

                    <revealer
                        transitionType={Gtk.RevealerTransitionType.CROSSFADE}
                        transitionDuration={animateDuration}
                        revealChild={isInput()}
                    >
                        {bluredWallpaper((w) => {
                            if (w === "") return <box />;
                            return (
                                <Image
                                    file={w}
                                    visible={isInput()}
                                    setup={(self) => {
                                        const { width, height } = monitor.get_geometry();
                                        const pixbuf = loadImage(w, width, height);
                                        self.pixbuf = pixbuf;
                                    }}
                                />
                            );
                        })}
                    </revealer>
                    <revealer
                        transitionType={Gtk.RevealerTransitionType.CROSSFADE}
                        transitionDuration={100}
                        revealChild={isInput()}
                    >
                        <box css={"background: rgba(0, 0, 0, 0.5);"} />
                    </revealer>
                    <revealer
                        marginBottom={600}
                        css={"text-shadow: 0 0 5px #000;"}
                        transitionType={Gtk.RevealerTransitionType.CROSSFADE}
                        setup={(self) => {
                            self.hook(bind(isInput), (_, t) => {
                                if (!t) self.transitionDuration = animateDuration / 2;
                                else self.transitionDuration = animateDuration * 1.5;
                            });
                        }}
                        revealChild={isInput().as((t) => !t)}
                        hexpand={true}
                        vexpand={true}
                    >
                        <Clock fontSize={128} fontWeight="normal" />
                    </revealer>
                    <revealer
                        transitionDuration={animateDuration}
                        transitionType={Gtk.RevealerTransitionType.CROSSFADE}
                        revealChild={isInput()}
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
            if (!isInput.get()) {
                t = animateDuration * 1.5; // 时钟的关闭时间是1.5倍于背景的打开时间
            }
            timer = timeout(t, () => {
                revealing = false;
            });
            idle(() => {
                entry.text = "";
                err.set("");
                if (isInput.get()) {
                    entry.editable = true;
                    entry.grab_focus();
                }
            });
        };
        if (canReveal && e.get_keyval()[1] === Gdk.KEY_Escape && isInput.get()) {
            doReveal();
            isInput.set(false);
        }
        if (canReveal && e.get_keyval()[1] === Gdk.KEY_Return && !isInput.get()) {
            doReveal();
            isInput.set(true);
        }
        if (!revealing && e.get_keyval()[1] === Gdk.KEY_Return && isInput.get()) {
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
