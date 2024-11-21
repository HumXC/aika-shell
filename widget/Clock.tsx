import { App, Astal, Gtk, Gdk, Widget } from "astal/gtk3";
import { Variable } from "astal";
import astalify, { type ConstructProps, type BindableChild } from "astal/gtk3/astalify";

export default function Clock({ fontSize }: { fontSize: number }) {
    const time = Variable("").poll(1000, "date");
    return (
        <label
            onDestroy={() => time.stopPoll()}
            className={"Clock"}
            tooltipText={time()}
            label={time().as((t) => {
                if (t === "") return "";
                return t.split(" ")[4].substring(0, 5);
            })}
            css={`
                font-size: ${fontSize}px;
            `}
        />
    );
}
