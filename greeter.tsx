#!/usr/bin/gjs -m
import { bind, exec, GLib, idle, timeout, Variable } from "astal";
import { App, Astal, Gdk, Gtk } from "astal/gtk3";
import Greet from "gi://AstalGreet";
// ags run greeter.tsx -a -test
const users: string[] = [];
exec(["getent", "passwd"])
    .split("\n")
    .forEach((line) => {
        const args = line.split(":");
        const user = args[0];
        const uid = parseInt(args[2]);
        if (uid >= 1000 && user !== "nobody") users.push(user);
    });
var User = Variable(users[0]);
let WALLPAPER_DIR = "/home/greeter/wallpapers";
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
    if (i === ARGV.length - 1) {
        User.set(ARGV[i]);
    }
}
print(ARGV);
// Greet.login("username", "password", "compositor", (_, res) => {
//     try {
//         Greet.login_finish(res);
//     } catch (err) {
//         printerr(err);
//     }
// });

App.start({
    icons: `${SRC}/icons`,
    main() {
        App.get_monitors().map((monitor, index) => Greeter(monitor, index === MONITOR));
    },
});
const time = Variable("00:00").poll(1000, 'date +"%H:%M"');
function Greeter(monitor: Gdk.Monitor, main: boolean = true) {
    const isInput = Variable(false);
    const isMain = Variable(main);
    const dration = 400;
    let entry: Gtk.Entry = null as any;
    return (
        <window
            gdkmonitor={monitor}
            keymode={Astal.Keymode.EXCLUSIVE}
            anchor={
                Astal.WindowAnchor.LEFT |
                Astal.WindowAnchor.TOP |
                Astal.WindowAnchor.RIGHT |
                Astal.WindowAnchor.BOTTOM
            }
            onKeyPressEvent={(self, e) => {
                if (e.get_keyval()[1] === Gdk.KEY_Escape) {
                    if (isInput.get()) isInput.set(false);
                    else if (!isInput.get() && TEST) App.quit();
                }
                if (e.get_keyval()[1] === Gdk.KEY_Return) {
                    if (!isInput.get()) isInput.set(true);
                }
            }}
            setup={(self) => {
                self.hook(bind(isInput), (_, v) => {
                    if (v)
                        timeout(dration, () => {
                            if (isInput.get()) entry.grab_focus();
                        });
                });
            }}
        >
            <overlay halign={Gtk.Align.FILL} valign={Gtk.Align.FILL}>
                <box
                    css={User(
                        (u) => `
                                background-image: url("/home/${u}/.face");
                                background-size: cover;
                                background-repeat: no-repeat;
                                background-position: center;
                            `
                    )}
                    hexpand={true}
                    vexpand={true}
                />
                <box
                    css={User(
                        (u) => `
                                background-image: url("/home/${u}/.face");
                                background-size: cover;
                                background-repeat: no-repeat;
                                background-position: center;
                            `
                    )}
                    visible={isInput()}
                />
                <box css={"background: rgba(0, 0, 0, 0.5);"} visible={isInput()} />
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
                    <label label={time()} css={"font-size: 128px;"} marginTop={220} />
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

                        <box heightRequest={200} />
                    </box>
                </revealer>
            </overlay>
        </window>
    );
}
