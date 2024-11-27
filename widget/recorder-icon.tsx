import { bind, GLib, timeout, Variable } from "astal";
import { EventIcon, Space } from "./base";
import wfRecorder from "../lib/wf-recorder";
import { formatDuration } from "../utils";
import { Gtk } from "astal/gtk3";
import Pango from "gi://Pango?version=1.0";

export const RecorderIcon = ({ height }: { height: number }) => {
    const wf = wfRecorder.get_default();
    const outerPadding = Math.floor(height / 6); // 4
    const borderSize = Math.floor(height / 12); //2
    const iconSize = height - 2 * outerPadding;
    const pointerSize = Math.floor(iconSize / 2);
    const white = "rgb(200, 200, 200)";
    const red = "rgb(255, 30, 30)";
    const pointerColor = Variable(white);
    return (
        <box
            visible={bind(wf, "isRecording")}
            className={"RecorderIcon"}
            hexpand={true}
            setup={(self) => {
                self.hook(bind(wf, "isRecording"), (self, isRecording) => {
                    if (isRecording) {
                        GLib.timeout_add(GLib.PRIORITY_LOW, 1000, () => {
                            if (!wf.isRecording) {
                                pointerColor.set("white");
                                return false;
                            }
                            pointerColor.set(pointerColor.get() === white ? red : white);
                            return true;
                        });
                    }
                });
            }}
        >
            <box
                css={`
                    padding: ${outerPadding}px;
                `}
            >
                <box
                    heightRequest={iconSize}
                    widthRequest={iconSize}
                    css={`
                        border: ${borderSize}px solid white;
                        border-radius: 50%;
                        padding: ${(iconSize - pointerSize - borderSize * 2) / 2}px;
                    `}
                >
                    <overlay>
                        <box
                            heightRequest={pointerSize}
                            widthRequest={pointerSize}
                            css={pointerColor().as(
                                (color) => `
                            background: ${color};
                            border-radius: 50%;
                            opacity: 0.8;
                        `
                            )}
                        />
                    </overlay>
                </box>
            </box>
            <label
                widthChars={0}
                css={`
                    font-size: ${height / 2}px;
                    padding: 1px ${outerPadding + 4}px 0 0;
                `}
                setup={(self) => {
                    self.hook(bind(wf, "duration"), (self, duration) => {
                        const txt = formatDuration(duration);
                        const layout = Pango.Layout.new(self.get_pango_context());
                        layout.set_text("  ", -1);
                        let [width, _] = layout.get_pixel_size();
                        self.widthRequest = width * (txt.length + 2);
                        self.label = txt;
                    });
                }}
            />
        </box>
    );
};
