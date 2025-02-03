import { Binding, GObject } from "astal";
import { Astal, ConstructProps, Gdk, Gtk, astalify } from "astal/gtk3";
import { BindableChild } from "astal/gtk3/astalify";
import { EventBox, EventBoxProps } from "astal/gtk3/widget";
class EventIcon extends astalify(EventBox) {
    static {
        GObject.registerClass({ GTypeName: "EventIcon" }, this);
    }
    constructor(props?: EventIconProps, ...children: Array<BindableChild>) {
        super({ children, ...props } as any);
        if (props === undefined) return;
        let margin = Math.floor(props.size! / 8);
        if (props.padding! >= 0) margin = props?.padding!;
        let fontSize = props.size! - margin * 2;
        if (props.useCssColor === undefined) props.useCssColor = true;
        if (props.iconSize === undefined) (props.iconSize as unknown as number) = props.size;
        this.add_child(
            Gtk.Builder.new(),
            <icon
                setup={(self) => {
                    if (props.useCssColor) {
                        if (typeof props.iconName === "string") self.icon = props.iconName;
                        else {
                            self.icon = props.iconName.get();
                            self.hook(props.iconName, (_, v) => {
                                self.icon = v;
                            });
                        }
                    } else {
                        let theme = Gtk.IconTheme.get_default();
                        if (typeof props.iconName === "string") {
                            let icon = theme.lookup_icon(props.iconName, props.iconSize!, 0);
                            self.gIcon = icon?.load_icon()!;
                        } else {
                            let icon = theme.lookup_icon(props.iconName.get(), props.iconSize!, 0);
                            self.gIcon = icon?.load_icon()!;
                            self.hook(props.iconName, (_, v) => {
                                let icon = theme.lookup_icon(v, props.iconSize!, 0);
                                self.gIcon = icon?.load_icon()!;
                            });
                        }
                    }
                }}
                iconSize={props.iconSize}
                pixelSize={props.iconSize}
                halign={Gtk.Align.CENTER}
                valign={Gtk.Align.CENTER}
                css={`
                    font-size: ${fontSize}px;
                    margin: ${margin}px;
                `}
            />,
            null
        );
    }
}
export type EventIconProps = EventBoxProps &
    ConstructProps<EventIcon, Astal.EventBox.ConstructorProps> & {
        iconName: string | Binding<string>;
        size: number;
        useCssColor?: boolean;
        iconSize?: 16 | 22 | 24 | 32 | 64 | 256;
        className?: string;
        padding?: number;
    };

export default EventIcon;
