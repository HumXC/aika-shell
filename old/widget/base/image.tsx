import { GObject } from "astal";
import { ConstructProps, Gtk, astalify } from "astal/gtk3";
import { BindableChild } from "astal/gtk3/astalify";
class Image extends astalify(Gtk.Image) {
    static {
        GObject.registerClass({ GTypeName: "Image" }, this);
    }

    constructor(props?: ImageProps, ...children: Array<BindableChild>) {
        super({ children, ...props } as any);
    }
}
export type ImageProps = ConstructProps<Image, Gtk.Image.ConstructorProps>;

export default Image;
