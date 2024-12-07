import { Astal, Gdk, Gtk } from "astal/gtk3";
import Notifd from "gi://AstalNotifd";
import Hyprland from "gi://AstalHyprland";
import { getHyprloandOption, lookUpIcon } from "../utils";
import { timeout } from "astal";
import GdkPixbuf from "gi://GdkPixbuf?version=2.0";
import Pango from "gi://Pango?version=1.0";

function Notification({
    n,
    gaps,
    rounding,
}: {
    n: Notifd.Notification;
    gaps: number[];
    rounding: string;
}) {
    return (
        <box
            setup={(self) => {
                timeout(3000, () => {
                    self.destroy();
                });
            }}
            css={`
                margin: ${gaps[0]}px ${gaps[1]}px ${gaps[2]}px ${gaps[3]}px;
                border-radius: ${rounding}px;
            `}
            className={"PopupWindow"}
            heightRequest={100}
            widthRequest={300}
            valign={Gtk.Align.FILL}
        >
            <box className={"PopupWindowItem"} vertical={true}>
                <box vexpand={true}>
                    <box
                        heightRequest={50}
                        widthRequest={50}
                        setup={(self) => {
                            const theme = Gtk.IconTheme.get_default();
                            let icon =
                                n.image ||
                                theme.lookup_icon(n.appIcon, 256, 0)?.get_filename() ||
                                theme
                                    .lookup_icon("applications-system-symbolic", 256, 0)
                                    ?.get_filename() ||
                                "";
                            self.css = `
                            border-radius: 50px;
                            background-image: url("${icon}");
                            background-size: 100%;  
                            background-repeat: no-repeat;
                            background-position: center;
                        `;
                        }}
                    ></box>
                    <box vertical={true} halign={Gtk.Align.START} marginStart={20}>
                        <box>
                            <label
                                label={n.summary}
                                hexpand={true}
                                css={"font-size: 16px;"}
                                halign={Gtk.Align.START}
                                wrap={true}
                                wrapMode={Pango.WrapMode.CHAR}
                            />
                            <label
                                label={n.appName}
                                hexpand={true}
                                css={"font-size: 12px; color: #888;"}
                                halign={Gtk.Align.START}
                            />
                        </box>
                        <label label={n.body} wrap={true} hexpand={true} halign={Gtk.Align.START} />
                    </box>
                </box>
                <levelbar maxValue={100} value={100} />
            </box>
        </box>
    );
}
export default function NotifactionPopup({ notificationID: id }: { notificationID: number }) {
    const notifd = Notifd.get_default();
    const gapsOption = getHyprloandOption("general:gaps_out", "custom");
    let gaps = [0, 0, 0, 0];
    if (gapsOption) gaps = gapsOption.split(" ").map(Number);
    const roundingOption = getHyprloandOption("decoration:rounding", "int");
    let rounding = "0";
    if (roundingOption) rounding = roundingOption;
    return (
        <window
            title={"NotificationPopup"}
            namespace={"popup-window"}
            layer={Astal.Layer.TOP}
            anchor={Astal.WindowAnchor.RIGHT | Astal.WindowAnchor.TOP}
            css={"background: transparent;"}
            exclusivity={Astal.Exclusivity.NORMAL}
        >
            <box
                setup={(self) => {
                    self.connect("remove", () => {
                        if (self.get_children().length === 0) self.parent.destroy();
                    });
                    self.hook(notifd, "notified", (_, id) => {
                        if (notifd.dontDisturb) return;
                        self.add(Notification({ n: notifd.get_notification(id), gaps, rounding }));
                    });
                }}
                vertical={true}
            >
                <Notification n={notifd.get_notification(id)} gaps={gaps} rounding={rounding} />
            </box>
        </window>
    );
}
