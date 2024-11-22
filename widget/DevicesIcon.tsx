import { setHoverClassName } from "../utils";
import NetworkIcon from "./NetworkIcon";
export default function DevicesIcon({}) {
    return (
        <eventbox setup={(self) => setHoverClassName("DevicesIcon", self)}>
            <NetworkIcon size={24} padding1={4} padding2={0} />
        </eventbox>
    );
}
