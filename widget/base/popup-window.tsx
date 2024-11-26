import { Astal, ConstructProps, Gdk, Gtk, astalify } from "astal/gtk3";
import Gtk30 from "gi://Gtk";
import GtkLayerShell from "gi://GtkLayerShell?version=0.1";
import { BindableChild } from "astal/gtk3/astalify";
import { bind } from "astal";

export default function PopupWindow({
    trigger,
    position,
    child,
    closing,
    ...children
}: {
    trigger: Gtk.Widget;
    position: "top" | "bottom";
    child?: BindableChild;
    children?: Array<BindableChild>;
    closing?: (self: Astal.Window) => boolean;
}) {
    const close = (self: Astal.Window) => {
        if (closing && !closing(self)) return;
        self.close();
        self.destroy();
    };
    // FIXME: 缩放下，位置计算有问题
    const windowSetup = (self: Astal.Window) => {
        const scaleFactor = self.get_scale_factor();
        print(scaleFactor);
        const setScaleFactor = (location: Gdk.Rectangle) => {
            location.x += 0 * scaleFactor;
            location.y += 0 * scaleFactor;
            location.height *= scaleFactor;
            location.width *= scaleFactor;
        };
        const triggerLocation = trigger.get_allocation();
        setScaleFactor(triggerLocation);
        const widgetLocation = self.get_child()!.get_allocation();
        setScaleFactor(widgetLocation);
        const windowWidth = self.get_screen().get_width() * scaleFactor;
        const windowHeight = self.get_screen().get_height() * scaleFactor;
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
        switch (position) {
            case "top":
                anchors.push(GtkLayerShell.Edge.TOP);
                anchors.push(GtkLayerShell.Edge.LEFT);
                offset = triggerX - widgetLocation.width / 2 + triggerLocation.width / 2;
                if (offset + widgetLocation.width > windowWidth) {
                    print("offset overflow");
                    offset = windowWidth - widgetLocation.width;
                }
                break;
            case "bottom":
                anchors.push(GtkLayerShell.Edge.BOTTOM);
                anchors.push(GtkLayerShell.Edge.LEFT);
                offset = triggerLocation.x - widgetLocation.width / 2 + triggerLocation.width / 2;
                if (offset + widgetLocation.width > windowWidth)
                    offset = windowWidth - widgetLocation.width;
                break;
            // TODO： Test the other positions
            // case "left":
            //     anchors.push(GtkLayerShell.Edge.LEFT);
            //     anchors.push(GtkLayerShell.Edge.TOP);
            //     offset = triggerLocation.y - widgetSize[1] / 2 + triggerLocation.height / 2;
            //     if (offset + widgetSize[1] > windowHeight) offset = windowHeight - widgetSize[1];
            //     break;
            // case "right":
            //     anchors.push(GtkLayerShell.Edge.RIGHT);
            //     anchors.push(GtkLayerShell.Edge.TOP);
            //     offset = triggerLocation.y - widgetSize[1] / 2 + triggerLocation.height / 2;
            //     if (offset + widgetSize[1] > windowHeight) offset = windowHeight - widgetSize[1];
            //     break;
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
            keymode={Astal.Keymode.ON_DEMAND}
            namespace={"popup-window"}
            onKeyPressEvent={(self, e) => {
                if (e.get_keyval()[1] === Gdk.KEY_Escape) {
                    self.close();
                    self.destroy();
                }
            }}
            css={"background: transparent;"}
        >
            <eventbox
                onHoverLost={(self, e) => {
                    close(self.parent as Astal.Window);
                }}
            >
                <box className={"PopupWindow"}>
                    {child}
                    {children.children}
                </box>
            </eventbox>
        </window>
    );
}
