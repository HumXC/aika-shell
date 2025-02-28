import { GObject } from "astal";
import { App, astalify, ConstructProps, Gdk, Gtk, Widget } from "astal/gtk4";
import Astal from "gi://Astal?version=4.0";

interface PopupWindowConstructorProps extends Astal.Window.ConstructorProps {
    namespaces: string;
}
class PopupWindow extends Astal.Window {
    static {
        GObject.registerClass(this);
    }
    constructor(properties?: Partial<PopupWindowConstructorProps>, ...args: any[]) {
        super(properties, ...args);
        this.visible = false;
    }
}
export type PopupWindowProps = ConstructProps<PopupWindow, PopupWindowConstructorProps>;
export default astalify<PopupWindow, PopupWindowConstructorProps>(PopupWindow);
