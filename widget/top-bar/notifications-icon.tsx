import { bind, Variable } from "astal";
import { setHoverClassName } from "../../utils";
import { EventIcon } from "../base";
import Notifd from "gi://AstalNotifd";
import { Gdk, Gtk } from "astal/gtk3";
import { GetConfig, SaveConfig } from "../../configs";
import { SetupTooltip } from "../tooltip";
import NotificationTooltip from "./notifications-tooltip";
import NotifactionPopup from "../notification-popup";
export class Cfg {
    dontDisturb: boolean = false;
}
export default function NotificationsIcon({
    size,
    padding = 4,
    onlyIcon = false,
    currentPopup = null,
}: {
    size: number;
    padding?: number;
    onlyIcon?: boolean;
    currentPopup?: Variable<string> | null;
}) {
    const notifd = Notifd.get_default();
    const config = GetConfig(Cfg, "notifications-icon");
    const iconName = Variable("notifications-symbolic");
    const setIcon = () => {
        if (notifd.dontDisturb) {
            iconName.set("notifications-disabled-symbolic");
            return;
        }
        let urgency = -1;
        notifd.notifications.forEach((n) => {
            if (n.urgency > urgency) urgency = n.urgency;
        });
        switch (urgency) {
            case Notifd.Urgency.LOW:
                iconName.set("low-notif-symbolic");
                break;
            case Notifd.Urgency.NORMAL:
                iconName.set("normal-notif-symbolic");
                break;
            case Notifd.Urgency.CRITICAL:
                iconName.set("critical-notif-symbolic");
                break;
            default:
                iconName.set("notifications-symbolic");
        }
    };
    notifd.set_dont_disturb(config.dontDisturb);
    setIcon();
    return (
        <box
            css={`
                padding: 1px ${padding}px 0 ${padding}px;
            `}
            halign={Gtk.Align.CENTER}
            valign={Gtk.Align.CENTER}
            setup={(self) => {
                self.hook(bind(notifd, "notifications"), () => setIcon());
                self.hook(bind(notifd, "dontDisturb"), () => {
                    setIcon();
                    config.dontDisturb = notifd.dontDisturb;
                    SaveConfig();
                });
            }}
        >
            <EventIcon
                useCssColor={false}
                iconSize={64}
                padding={0}
                onButtonPressEvent={(self, e) => {
                    if (e.get_button()[1] === Gdk.BUTTON_SECONDARY) {
                    }
                    if (e.get_button()[1] === Gdk.BUTTON_MIDDLE) {
                        notifd.set_dont_disturb(!notifd.dontDisturb);
                    }
                }}
                setup={(self) => {
                    setHoverClassName(self, "NotificationIcon");
                    if (!onlyIcon)
                        SetupTooltip(
                            self,
                            NotificationTooltip,
                            "notifications-icon",
                            "bottom",
                            currentPopup
                        );
                }}
                iconName={iconName()}
                size={size - padding * 2}
                className={"NotificationIcon"}
            />
        </box>
    );
}
