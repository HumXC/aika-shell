import { bind } from "astal";
import { setHoverClassName } from "../utils";
import { EventIcon, Space } from "./base";
import WirePlumber from "gi://AstalWp";

export default function Volume({ size }: { size: number }) {
    if (!WirePlumber.get_default())
        return (
            <EventIcon
                css={"color: red;"}
                iconName={"error-app-symbolic"}
                size={size}
                padding={4}
                tooltipText={"Field to get WirePlumber instance"}
            ></EventIcon>
        );
    const wp = WirePlumber.get_default() as WirePlumber.Wp;

    return (
        <box>
            <Space space={2} />
            <EventIcon
                setup={(self) => setHoverClassName(self, "Icon")}
                iconName={bind(wp.defaultSpeaker, "volumeIcon")}
                size={size}
                padding={3}
                onScroll={(self, e) => {
                    let v = wp.defaultSpeaker.volume + 0.01 * (e.delta_y < 0 ? 1.0 : -1.0);
                    wp.defaultSpeaker.volume = Math.min(Math.max(v, 0), 1.5);
                    if (wp.defaultSpeaker.volume == 0) wp.defaultSpeaker.mute = true;
                    else wp.defaultSpeaker.mute = false;
                }}
                onClick={(self, e) => (wp.defaultSpeaker.mute = !wp.defaultSpeaker.mute)}
                tooltipText={bind(wp.defaultSpeaker, "volume").as(
                    (v) => (v * 100).toFixed(0) + "%"
                )}
            />
            <Space space={2} />
        </box>
    );
}
