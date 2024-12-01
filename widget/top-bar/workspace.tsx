import { bind } from "astal";
import Hyprland from "gi://AstalHyprland";

export default function Workspace({ height }: { height: number }) {
    const hypr = Hyprland.get_default();
    const itemSize = Math.floor(height / 4) + 2;
    const padding = (height - itemSize) / 2;
    return (
        <box
            className={"Workspace"}
            css={`
                padding: 0 ${padding - itemSize / 2}px;
            `}
        >
            {bind(hypr, "workspaces").as((wss) =>
                wss
                    .sort((a, b) => a.id - b.id)
                    .map((ws) => (
                        <eventbox onClick={() => ws.focus()}>
                            <box
                                css={`
                                    padding: ${padding}px ${itemSize / 2}px;
                                `}
                            >
                                <box
                                    heightRequest={itemSize}
                                    widthRequest={bind(hypr, "focusedWorkspace").as((fw) =>
                                        ws === fw ? itemSize * 2 : itemSize
                                    )}
                                    className={bind(hypr, "focusedWorkspace").as((fw) =>
                                        ws === fw ? "Item-focused" : "Item"
                                    )}
                                />
                            </box>
                        </eventbox>
                    ))
            )}
        </box>
    );
}
