import { Astal, Gdk, Gtk, Widget } from "astal/gtk3";

export default function FloatMenu(trigger: Gtk.Widget) {
    return (
        <window
            setup={(self) => {
                const lo = trigger.get_allocation();
                self.move(1, 1);
                print(self.get_allocation().x);
            }}
            heightRequest={200}
            widthRequest={200}
            title="FloatingMenu"
            className={"FloatingMenu"}
            keymode={Astal.Keymode.ON_DEMAND}
            onKeyPressEvent={(self, e) => {
                if (e.get_keyval()[1] === Gdk.KEY_Escape) {
                    self.close();
                }
            }}
        ></window>
    );
}
