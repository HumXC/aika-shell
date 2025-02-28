import { bind } from "astal";
import { Gdk, Gtk } from "astal/gtk4";
import AstalTray from "gi://AstalTray";
import { addClickController } from "../utils";
function makeItem(item: AstalTray.TrayItem): Gtk.Widget {
    return (
        <box
            canFocus={true}
            setup={(self) => {
                const setTooltipMarkup = (tooltipMarkup: string) => {
                    if (tooltipMarkup !== "") self.set_tooltip_markup(tooltipMarkup);
                    else self.set_tooltip_markup(null);
                };
                const setTooltip = (tooltip: string) => {
                    if (tooltip !== "") self.set_tooltip_text(tooltip);
                    else self.set_tooltip_text(item.title);
                };
                setTooltip(item.tooltip.title);
                setTooltipMarkup(item.tooltipMarkup);
                bind(item, "tooltipMarkup").subscribe((t) => setTooltipMarkup(t));
                bind(item, "tooltip").subscribe((t) => setTooltip(t.title));
                addClickController(self, "onRelease", (_, button, x, y) => {
                    if (button === Gdk.BUTTON_SECONDARY) {
                        (self.get_children()[1] as Gtk.Popover).popup();
                    }
                    if (button === Gdk.BUTTON_PRIMARY) item.activate(x, y);
                });
                // Gtk-WARNING **: 14:09:46.701: While adding page: duplicate child name in GtkStack: Group
                const menu = Gtk.PopoverMenu.new_from_model(item.menuModel);
                menu.insert_action_group("dbusmenu", item.actionGroup);
                menu.set_has_arrow(false);
                const rect = self.get_allocation();
                rect.height += 50; // TODO: 适配hyprland高度
                menu.set_pointing_to(rect);
                self.append(menu);
            }}
        >
            <image paintable={Gdk.Texture.new_for_pixbuf(item.iconPixbuf)} pixelSize={22} />
        </box>
    );
}
export default function Tray() {
    const tray = AstalTray.get_default();
    tray.items;
    return (
        <box spacing={6}>
            {bind(tray, "items").as((items) => items.map((item) => makeItem(item)))}
        </box>
    );
}
