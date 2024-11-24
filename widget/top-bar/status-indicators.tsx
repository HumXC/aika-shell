import { setHoverClassName } from "../../utils";
import BrightnessIcon from "../brightness-icon";
import NetworkIcon from "../network-icon";
import PopupWindow from "../popup-window";
import { Gtk } from "astal/gtk3";
export default function StatusIndicators({ size }: { size: number }) {
    return (
        <eventbox
            setup={(self) => setHoverClassName(self, "StatusIndicators")}
            onClick={(self, e) => {
                const w = PopupWindow(self);
            }}
        >
            <box
                css={`
                    padding: 0 ${size / 6}px;
                `}
            >
                <BrightnessIcon size={size - size / 6} />
                <NetworkIcon size={size} padding1={size / 6} padding2={0} />
            </box>
        </eventbox>
    );
}
