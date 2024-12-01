import { AstalIO, bind, Binding, timeout, Variable } from "astal";
import { setHoverClassName } from "../utils";
import { EventIcon, Space } from "./base";
import WirePlumber from "gi://AstalWp";
import { Astal, Gtk } from "astal/gtk3";
import VolumeTooltip from "./volume-tooltip";
export default function VolumeIcon({
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
    if (!WirePlumber.get_default())
        return (
            <EventIcon
                css={"color: red;"}
                iconName={"error-app-symbolic"}
                size={size}
                padding={padding}
                tooltipText={"Field to get WirePlumber instance"}
            />
        );
    const wp = WirePlumber.get_default() as WirePlumber.Wp;
    const popupName = "volume-tooltip";
    let popup: Astal.Window | null = null;
    const setVolume = (v: number) => {
        wp.defaultSpeaker.volume = v;
        if (wp.defaultSpeaker.volume == 0) wp.defaultSpeaker.mute = true;
        else wp.defaultSpeaker.mute = false;
    };
    const onScroll = (delta_y: number) => {
        let v = wp.defaultSpeaker.volume + 0.01 * (delta_y < 0 ? 1.0 : -1.0);
        setVolume(Math.min(Math.max(v, 0), 1));
    };
    let closeTimer: AstalIO.Time | null = null;
    const closePopup = () => {
        if (popup === null) return;
        if (closeTimer) closeTimer.cancel();
        closeTimer = timeout(500, () => {
            if (onHover) return;
            popup?.close();
            popup = null;
        });
    };
    const makePopup = (t: Gtk.Widget) => {
        if (currentPopup) currentPopup.set(popupName);
        return VolumeTooltip({
            forward: "bottom",
            trigger: t,
            onHover: () => (onHover = true),
            onHoverLost: () => {
                onHover = false;
                closePopup();
            },
        });
    };
    let onHover = false;
    return (
        <box>
            <Space space={2} />
            <EventIcon
                setup={(self) => {
                    setHoverClassName(self, "Icon");
                    if (onlyIcon) return;
                    self.connect("hover", () => {
                        onHover = true;
                        if (!popup) popup = makePopup(self);
                    });
                    self.connect("hover-lost", () => {
                        onHover = false;
                        closePopup();
                    });
                    if (currentPopup) {
                        self.hook(bind(currentPopup), () => {
                            popup?.close();
                            popup = null;
                        });
                    }
                }}
                iconName={bind(wp.defaultSpeaker, "volumeIcon")}
                size={size}
                padding={3}
                onScroll={(self, e) => onScroll(e.delta_y)}
                onClick={(self, e) => {
                    if (e.button == Astal.MouseButton.PRIMARY) return;
                    wp.defaultSpeaker.mute = !wp.defaultSpeaker.mute;
                }}
            />
            <Space space={2} />
        </box>
    );
}
