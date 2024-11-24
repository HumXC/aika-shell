import { Variable } from "astal";

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
                font-weight: bold;
            `}
        />
    );
}
