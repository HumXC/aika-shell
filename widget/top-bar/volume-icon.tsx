import { bind, Variable } from "astal";
import { setHoverClassName } from "../../utils";
import { EventIcon } from "../base";
import WirePlumber from "gi://AstalWp";
import { Astal, Gtk } from "astal/gtk3";
import VolumeTooltip from "./volume-tooltip";
import { SetupPopup, SetupTooltip } from "../tooltip";
import VolumePopup from "./volume-popup";
export default function VolumeIcon({
    size,
    padding = 2,
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
    const setVolume = (v: number) => {
        wp.defaultSpeaker.volume = v;
        if (wp.defaultSpeaker.volume == 0) wp.defaultSpeaker.mute = true;
        else wp.defaultSpeaker.mute = false;
    };
    const onScroll = (delta_y: number) => {
        let v = wp.defaultSpeaker.volume + 0.01 * (delta_y < 0 ? 1.0 : -1.0);
        setVolume(Math.min(Math.max(v, 0), 1));
    };
    return (
        <box
            css={`
                padding: 2px ${padding}px 0 ${padding}px;
            `}
            halign={Gtk.Align.CENTER}
            valign={Gtk.Align.CENTER}
        >
            <EventIcon
                halign={Gtk.Align.CENTER}
                valign={Gtk.Align.CENTER}
                useCssColor={false}
                iconSize={32}
                setup={(self) => {
                    setHoverClassName(self, "Icon");
                    if (onlyIcon) return;
                    SetupTooltip(
                        self,
                        VolumeTooltip,
                        "volume-tooltip",
                        "bottom",
                        currentPopup,
                        600
                    );
                    SetupPopup(self, VolumePopup, "volume-popup", "bottom", currentPopup);
                }}
                iconName={bind(wp.defaultSpeaker, "volumeIcon")}
                size={size - padding * 2}
                padding={0}
                onScroll={(self, e) => onScroll(e.delta_y)}
                onClick={(self, e) => {
                    if (e.button == Astal.MouseButton.PRIMARY)
                        wp.defaultSpeaker.mute = !wp.defaultSpeaker.mute;
                }}
            />
        </box>
    );
}
