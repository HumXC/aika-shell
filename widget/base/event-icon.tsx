import { Binding, GObject } from "astal";
import { Astal, ConstructProps, Gtk, astalify } from "astal/gtk3";
import { BindableChild } from "astal/gtk3/astalify";
import { EventBox, EventBoxProps } from "astal/gtk3/widget";
class EventIcon extends astalify(EventBox) {
    static {
        GObject.registerClass({ GTypeName: "EventIcon" }, this);
    }
    constructor(props?: EventIconProps, ...children: Array<BindableChild>) {
        super({ children, ...props } as any);
        let margin = props?.size! / 8;
        if (props?.padding! >= 0) margin = props?.padding!;
        this.add_child(
            Gtk.Builder.new(),
            <icon
                icon={props?.iconName}
                css={`
                    font-size: ${props?.size! - margin * 2}px;
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
        className?: string;
        padding?: number;
    };

export default EventIcon;
