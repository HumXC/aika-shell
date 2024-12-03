import { Astal, Gdk, Gtk } from "astal/gtk3";
import GtkLayerShell from "gi://GtkLayerShell?version=0.1";
import { BindableChild } from "astal/gtk3/astalify";
import Hyprland from "gi://AstalHyprland";
import { getHyprloandOption } from "../../utils";
export default function PopupWindow({
    trigger,
    forward,
    keymode = Astal.Keymode.NONE,
    child,
    closing,
    namespace = "popup-window",
    ...children
}: {
    trigger: Gtk.Widget;
    forward: "top" | "bottom" | "left" | "right";
    keymode?: Astal.Keymode;
    child?: BindableChild;
    children?: Array<BindableChild>;
    closing?: (self: Astal.Window) => boolean;
    namespace?: string;
}) {
    const hypr = Hyprland.get_default();
    const gapsOption = getHyprloandOption("general:gaps_out", "custom");
    let gaps = [0, 0, 0, 0];
    if (gapsOption) gaps = gapsOption.split(" ").map(Number);
    const roundingOption = getHyprloandOption("decoration:rounding", "int");
    let rounding = "0";
    if (roundingOption) rounding = roundingOption;
    const scale = hypr.focusedMonitor.scale;

    const windowSetup = (self: Astal.Window) => {
        const triggerLocation = trigger.get_allocation();
        const widgetLocation = self.get_child()!.get_allocation();
        const windowWidth = hypr.focusedMonitor.width / scale;
        const windowHeight = hypr.focusedMonitor.height / scale;
        const [_, triggerX, triggerY] = trigger.get_window()!.get_origin();

        let anchors: GtkLayerShell.Edge[] = [];
        let offset = 0;
        const getWidthOffset = () => {
            offset = triggerX - widgetLocation.width / 2 + triggerLocation.width / 2;
            if (offset + widgetLocation.width > windowWidth) {
                offset = windowWidth - widgetLocation.width + 1;
            }
        };
        const getHeightOffset = () => {
            offset = triggerY - widgetLocation.height / 2 + triggerLocation.height / 2;
            if (offset + widgetLocation.height > windowHeight) {
                offset = windowHeight - widgetLocation.height + 1;
            }
        };
        switch (forward) {
            case "bottom":
                anchors.push(GtkLayerShell.Edge.TOP);
                anchors.push(GtkLayerShell.Edge.LEFT);
                getWidthOffset();
                break;
            case "top":
                anchors.push(GtkLayerShell.Edge.BOTTOM);
                anchors.push(GtkLayerShell.Edge.LEFT);
                getWidthOffset();
                break;
            case "right":
                anchors.push(GtkLayerShell.Edge.LEFT);
                anchors.push(GtkLayerShell.Edge.TOP);
                getHeightOffset();
                break;
            case "left":
                anchors.push(GtkLayerShell.Edge.RIGHT);
                anchors.push(GtkLayerShell.Edge.TOP);
                getHeightOffset();
                break;
        }
        GtkLayerShell.set_anchor(self, anchors[0], true);
        GtkLayerShell.set_anchor(self, anchors[1], true);
        if (offset < 0) offset = 0;
        GtkLayerShell.set_margin(self, anchors[2], offset);
        GtkLayerShell.set_namespace(self, namespace);
    };

    return (
        <window
            title={"PopupWindow"}
            setup={windowSetup}
            layer={Astal.Layer.TOP}
            keymode={keymode}
            exclusivity={Astal.Exclusivity.EXCLUSIVE}
            namespace={"popup-window"}
            onKeyPressEvent={(self, e) => {
                if (e.get_keyval()[1] === Gdk.KEY_Escape) {
                    self.close();
                    self.destroy();
                }
            }}
            css={"background: transparent;"}
        >
            <box
                setup={(self) => {
                    self.set_clip(
                        new Gdk.Rectangle({
                            x: 0,
                            y: 0,
                            width: 10,
                            height: self.get_screen().get_height(),
                        })
                    );
                }}
                className={"PopupWindow"}
                css={`
                    margin: ${gaps[0]}px ${gaps[1]}px ${gaps[2]}px ${gaps[3]}px;
                    border-radius: ${rounding}px;
                `}
            >
                {child}
                {children.children}
            </box>
        </window>
    );
}
