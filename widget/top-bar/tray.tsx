import ATray from "gi://AstalTray";
import { App, Astal, Gdk } from "astal/gtk3";
import { bind } from "astal";
import { GetConfig } from "../../configs";
class Config {
    icon: {
        [key: string]: {
            size: number;
            margin: string;
        };
    } = {
        example: {
            size: 32,
            margin: "0px",
        },
    };
    order: string[] = ["example"];
}
export default function Tray({ height }: { height: number }) {
    const config = GetConfig(Config, "tray");
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
            {bind(tray, "items").as((items) => {
                const sorted: ATray.TrayItem[] = [];
                config.order.forEach((id) => {
                    const item = items.find((i) => i.id === id);
                    if (item) sorted.push(item);
                });
                items.forEach((item) => {
                    if (!sorted.includes(item)) sorted.push(item);
                });
                return sorted.map((item) => {
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
                            <overlay
                                overlay={
                                    <icon
                                        css={`
                                            font-size: ${height - outerPadding * 3}px;
                                            margin: ${outerPadding / 2}px;
                                        `}
                                        setup={(self) => {
                                            console.log("Tray icon setup:", item.id);
                                            if (config.icon[item.id]) {
                                                self.css = `
                                                    font-size: ${config.icon[item.id].size}px;
                                                    margin: ${config.icon[item.id].margin};`;
                                            }
                                        }}
                                        gIcon={bind(item, "gicon")}
                                    />
                                }
                            >
                                <box
                                    className={"TrayIcon"}
                                    heightRequest={height - outerPadding * 2}
                                    widthRequest={height - outerPadding * 2}
                                />
                            </overlay>
                        </eventbox>
                    );
                });
            })}
        </box>
    );
}
