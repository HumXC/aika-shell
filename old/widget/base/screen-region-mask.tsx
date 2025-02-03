import { Astal, Gdk } from "astal/gtk3";
import cairo from "gi://cairo?version=1.0";
import GtkLayerShell from "gi://GtkLayerShell?version=0.1";

export default function screenMask(
    rect: Gdk.Rectangle,
    borderWeight: number = 2,
    borderType: string = "solid",
    borderColor: string = "white",
    borderRadius: number = 0
) {
    const setup = (self: Astal.Window) => {
        GtkLayerShell.set_margin(self, GtkLayerShell.Edge.TOP, rect.y - borderWeight);
        GtkLayerShell.set_margin(self, GtkLayerShell.Edge.LEFT, rect.x - borderWeight);
        self.input_shape_combine_region(new cairo.Region());
    };
    return (
        <window
            setup={setup}
            anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.LEFT}
            exclusivity={Astal.Exclusivity.IGNORE}
            css={`
                background: transparent;
                border-radius: ${borderRadius}px;
                border: ${borderWeight}px ${borderType} ${borderColor};
            `}
        >
            <box
                heightRequest={rect.height + borderWeight * 2}
                widthRequest={rect.width + borderWeight * 2}
            />
        </window>
    );
}
