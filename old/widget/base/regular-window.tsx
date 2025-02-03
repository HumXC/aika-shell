import { GObject } from "astal";
import { ConstructProps, Gtk, astalify } from "astal/gtk3";
import { BindableChild } from "astal/gtk3/astalify";
class RegularWindow extends astalify(Gtk.Window) {
    static {
        GObject.registerClass({ GTypeName: "RegularWindow" }, this);
    }

    constructor(props?: RegularWindowProps, ...children: Array<BindableChild>) {
        super({ children, ...props } as any);
    }
}
export type RegularWindowProps = ConstructProps<RegularWindow, Gtk.Window.ConstructorProps> & {
    setup?: (self: RegularWindow) => void;
};

export default RegularWindow;
