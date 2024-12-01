import { setHoverClassName } from "../../utils";
import BrightnessIcon from "../brightness-icon";
import NetworkIcon from "../network-icon";
import VolumeIcon from "../volume-icon";
import { Variable } from "astal";
export default function StatusIndicators({ size }: { size: number }) {
    const currentPopup = Variable("");
    return (
        <eventbox setup={(self) => setHoverClassName(self, "StatusIndicators")}>
            <box
                css={`
                    padding: 0 ${size / 6}px;
                `}
            >
                <VolumeIcon size={size - size / 6} currentPopup={currentPopup} />
                <BrightnessIcon size={size - size / 6} currentPopup={currentPopup} />
                <NetworkIcon size={size} padding1={size / 6} padding2={0} />
            </box>
        </eventbox>
    );
}
