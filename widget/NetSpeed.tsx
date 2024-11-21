import { bind, Variable } from "astal";
import NetworkSpeed from "../lib/NetworkSpeed";
import Space from "./Space";
import { Astal, Gdk, Gtk } from "astal/gtk3";

export default function NetSpeed({ height }: { height: number }) {
    const networkSpeed = new NetworkSpeed();
    const className = Variable("NetSpeed");
    const fontSize = height - height / 2.8;
    let menu: Gtk.Menu | null = null;
    return (
        <eventbox
            onHover={() => className.set("NetSpeed-hover")}
            onHoverLost={() => className.set("NetSpeed")}
            setup={(self) => {
                self.hook(networkSpeed, "iface-update", () => {
                    menu?.destroy();
                    menu = networkSpeed.createMenu();
                });
            }}
            tooltipText={bind(networkSpeed, "currentIFace").as((iface) => iface)}
            onClickRelease={(self, e) => {
                if (e.button === Astal.MouseButton.SECONDARY) {
                    let location = self.get_allocation();
                    let rect = new Gdk.Rectangle({
                        x: location.x,
                        y: location.y,
                        height: location.height,
                    });
                    menu?.popup_at_rect(
                        self.get_window()!,
                        rect,
                        Gdk.Gravity.SOUTH,
                        Gdk.Gravity.CENTER,
                        null
                    );
                }
            }}
        >
            <box
                onDestroy={() => networkSpeed.destroy()}
                className={className()}
                css={`
                    padding: 0 ${fontSize / 2}px;
                `}
            >
                <label
                    label={""}
                    css={`
                        font-size: ${fontSize}px;
                        padding: 1px 12px 0 0;
                    `}
                />
                <label
                    css={"font-size:" + (fontSize - 2) + "px;" + "padding: 2px 0 0 0;"}
                    label={bind(networkSpeed, "speed").as((speed) => speed.download)}
                />
                <Space space={8} />
                <label
                    label={""}
                    css={`
                        font-size: ${fontSize}px;
                        padding: 1px 12px 0 0;
                    `}
                />
                <label
                    css={"font-size:" + (fontSize - 2) + "px;" + "padding: 2px 0 0 0;"}
                    label={bind(networkSpeed, "speed").as((speed) => speed.upload)}
                />
            </box>
        </eventbox>
    );
}
