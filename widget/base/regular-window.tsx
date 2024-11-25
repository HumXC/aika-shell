import { Binding, GObject } from "astal";
import { Astal, ConstructProps, Gtk, astalify } from "astal/gtk3";
import { BindableChild } from "astal/gtk3/astalify";
import { EventBox, EventBoxProps } from "astal/gtk3/widget";
import GtkLayerShell from "gi://GtkLayerShell?version=0.1";
class RegularWindow extends astalify(Gtk.Window) {
    static {
        GObject.registerClass({ GTypeName: "RegularWindow" }, this);
    }

    constructor(props?: RegularWindowProps, ...children: Array<BindableChild>) {
        super({ children, ...props } as any);
        if (props?.setup) {
            props.setup(this);
        }
    }
}
export type RegularWindowProps = ConstructProps<RegularWindow, Gtk.Window.ConstructorProps> & {
    setup?: (self: RegularWindow) => void;
};

export default RegularWindow;
