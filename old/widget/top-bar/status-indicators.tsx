import { setHoverClassName } from "../../utils";
import BrightnessIcon from "./brightness-icon";
import NetworkIcon from "./network-icon";
import VolumeIcon from "./volume-icon";
import { Variable } from "astal";
export default function StatusIndicators({
    size,
    currentPopup = null,
}: {
    size: number;
    currentPopup: Variable<string> | null;
}) {
    if (currentPopup === null) currentPopup = Variable("");
    return (
        <eventbox setup={(self) => setHoverClassName(self, "StatusIndicators")}>
            <box
                css={`
                    padding: 0 ${size / 3}px;
                `}
                spacing={size / 6}
            >
                <VolumeIcon size={size - size / 6} currentPopup={currentPopup} />
                <BrightnessIcon size={size - size / 6} currentPopup={currentPopup} />
                <NetworkIcon size={size - size / 6} currentPopup={currentPopup} />
            </box>
        </eventbox>
    );
}
