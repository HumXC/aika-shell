import { Binding, GObject } from "astal";
import { Astal, ConstructProps, Gtk, astalify } from "astal/gtk3";
import { BindableChild } from "astal/gtk3/astalify";
import { EventBox, EventBoxProps } from "astal/gtk3/widget";
class RegularWindow extends astalify(Gtk.Window) {
    static {
        GObject.registerClass({ GTypeName: "RegularWindow" }, this);
    }
    constructor(props?: RegularWindowProps, ...children: Array<BindableChild>) {
        super({ children, ...props } as any);
    }
}
export type RegularWindowProps = ConstructProps<RegularWindow, Astal>;

export default RegularWindow;
