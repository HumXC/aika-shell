import { Astal, Gdk, Gtk } from "astal/gtk3";
import GtkLayerShell from "gi://GtkLayerShell?version=0.1";
import { BindableChild } from "astal/gtk3/astalify";
import { exec } from "astal";
import { getHyprloandOption } from "../../utils";
export default function PopupWindow({
    trigger,
    forward,
    keymode = Astal.Keymode.NONE,
    child,
    closing,
    ...children
}: {
    trigger: Gtk.Widget;
    forward: "top" | "bottom" | "left" | "right";
    keymode?: Astal.Keymode;
    child?: BindableChild;
    children?: Array<BindableChild>;
    closing?: (self: Astal.Window) => boolean;
}) {
    const gapsOption = getHyprloandOption("general:gaps_out", "custom");
    let gaps = [0, 0, 0, 0];
    if (gapsOption) gaps = gapsOption.split(" ").map(Number);
    const roundingOption: {
        option: string;
        int: number;
        set: boolean;
    } = JSON.parse(exec(["hyprctl", "-j", "getoption", "general:gaps_out"]));
    let rounding = 0;
    if (roundingOption.set) gaps = gapsOption.custom.split(" ").map(Number);
    const windowSetup = (self: Astal.Window) => {
        const triggerLocation = trigger.get_allocation();
        const widgetLocation = self.get_child()!.get_allocation();
        const windowWidth = self.get_screen().get_width();
        const windowHeight = self.get_screen().get_height();
        const [_, triggerX, triggerY] = trigger.get_window()!.get_origin();
        print(
            "triggerLocation",
            triggerLocation.x,
            triggerLocation.y,
            triggerLocation.width,
            triggerLocation.height
        );
        print(
            "widgetLocation",
            widgetLocation.x,
            widgetLocation.y,
            widgetLocation.width,
            widgetLocation.height
        );
        print("triggerX", triggerX, "triggerY", triggerY);
        print("windowWidth", windowWidth, "windowHeight", windowHeight);
        let anchors: GtkLayerShell.Edge[] = [];
        let offset = 0;
        const getWidthOffset = () => {
            offset = triggerX - widgetLocation.width / 2 + triggerLocation.width / 2;
            if (offset + widgetLocation.width > windowWidth) {
                print("offset overflow");
                offset = windowWidth - widgetLocation.width;
            }
        };
        const getHeightOffset = () => {
            offset = triggerY - widgetLocation.height / 2 + triggerLocation.height / 2;
            if (offset + widgetLocation.height > windowHeight) {
                print("offset overflow");
                offset = windowHeight - widgetLocation.height;
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
        GtkLayerShell.set_margin(self, anchors[2], offset);
        print("offset", offset);
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
                className={"PopupWindow"}
                css={`
                    margin: ${gaps[0]}px ${gaps[1]}px ${gaps[2]}px ${gaps[3]}px;
                `}
            >
                {child}
                {children.children}
            </box>
        </window>
    );
}
