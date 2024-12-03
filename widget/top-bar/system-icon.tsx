import { Variable } from "astal";
import { EventIcon } from "../base";
import { SetupTooltip } from "../tooltip";
import SystemTooltip from "./system-tooltip";

export default function SystemIcon({
    size,
    padding = 6,
    onlyIcon = false,
    currentPopup = null,
}: {
    size: number;
    padding?: number;
    onlyIcon?: boolean;
    currentPopup?: Variable<string> | null;
}) {
    return (
        <EventIcon
            iconName="nix-snowflake-colours"
            size={size}
            padding={padding}
            setup={(self) => {
                if (!onlyIcon)
                    SetupTooltip(self, SystemTooltip, "system-tooltip", "bottom", currentPopup);
            }}
        />
    );
}
