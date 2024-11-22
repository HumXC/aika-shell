import ATray from "gi://AstalTray";
import { App, Astal, Gdk } from "astal/gtk3";
import { bind } from "astal";
export default function Tray({ height }: { height: number }) {
    const outerPadding = height / 8;
    const tray = ATray.get_default();
    return (
        <box
            className={"Tray"}
            spacing={outerPadding}
            heightRequest={height}
            css={`
                border-radius: 100px;
                padding: ${outerPadding}px ${outerPadding + outerPadding / 3}px;
            `}
        >
            {bind(tray, "items").as((items) =>
                items.map((item) => {
                    if (item.iconThemePath) App.add_icons(item.iconThemePath);
                    const menu = item.create_menu();
                    return (
                        <eventbox
                            className={"TrayItem"}
                            tooltipMarkup={bind(item, "tooltipMarkup")}
                            tooltipText={bind(item, "title")}
                            onDestroy={() => {
                                setTimeout(() => {
                                    menu?.destroy();
                                }, 100);
                            }}
                            onHover={(self) => (self.className = "TrayItem-hover")}
                            onHoverLost={(self) => (self.className = "TrayItem")}
                            onClickRelease={(self, e) => {
                                if (e.button === Astal.MouseButton.PRIMARY) item.activate(e.x, e.y);
                                if (e.button === Astal.MouseButton.SECONDARY) {
                                    menu?.popup_at_widget(
                                        self,
                                        Gdk.Gravity.SOUTH,
                                        Gdk.Gravity.NORTH,
                                        null
                                    );
                                }
                                self.className = "TrayItem";
                            }}
                            css={`
                                border-radius: 100px;
                            `}
                        >
                            <icon
                                className={"TrayIcon"}
                                css={`
                                    font-size: ${height - outerPadding * 3}px;
                                    margin: ${outerPadding / 2}px;
                                `}
                                gIcon={bind(item, "gicon")}
                            />
                        </eventbox>
                    );
                })
            )}
        </box>
    );
}
