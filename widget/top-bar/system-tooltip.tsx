import { Astal, Gtk, Widget } from "astal/gtk3";
import PopupWindow from "../base/popup-window";
import SystemIcon from "./system-icon";
import { bind, Binding, exec, execAsync, GLib, interval, Variable } from "astal";
import { Space } from "../base";
import { GetConfig } from "../../configs";
import { formatBytes } from "../../utils";
class Cfg {
    disks: Array<{ dev: string; name: string }> = [{ dev: "/dev/sda1", name: "sda1" }];
    cpuName: string = "CPU";
}
function LevelBar({
    icon,
    iconMargin = "10px",
    value,
    label1,
    label2,
    label3,
    onDestroy,
}: {
    icon: string | Binding<string>;
    value: Binding<number> | number;
    iconMargin?: string;
    label1: string | Binding<string>;
    label2: string | Binding<string>;
    label3: string | Binding<string>;
    onDestroy?: (self: Widget.Box) => void;
}) {
    return (
        <box onDestroy={(self) => onDestroy?.(self)}>
            <box halign={Gtk.Align.CENTER} valign={Gtk.Align.END}>
                <icon
                    icon={icon}
                    iconSize={64}
                    css={`
                        font-size: 32px;
                        margin: ${iconMargin};
                    `}
                />
            </box>
            <box vertical={true} hexpand={true} valign={Gtk.Align.END}>
                <box halign={Gtk.Align.FILL}>
                    <label
                        label={label1}
                        css={`
                            font-size: 14px;
                        `}
                        halign={Gtk.Align.START}
                    />
                    <label
                        label={label2}
                        css={`
                            font-size: 14px;
                        `}
                        hexpand={true}
                        halign={Gtk.Align.END}
                    />
                </box>
                <levelbar maxValue={1} value={value} />
                <Space space={14} useVertical={true} />
            </box>
            <Space space={10} />
            <label
                widthRequest={30}
                valign={Gtk.Align.END}
                xalign={1}
                label={label3}
                css={`
                    font-size: 16px;
                    margin-bottom: 10px;
                `}
            />
        </box>
    );
}
function Disk({ device, name }: { device: string; name: string }) {
    const info = Variable({
        size: "...",
        used: "...",
        usedPercent: "..%",
    });
    if (name === "") name = device.split("/").pop() || "Unknown";
    execAsync(["lsblk", "-nd", "-o", "SIZE,FSUSED,FSUSE%", device])
        .then((result) => {
            const inf = result.split(" ").filter((s) => s.length > 0);
            info.set({
                size: inf[0] || "...",
                used: inf[1] || "...",
                usedPercent: inf[2] || "..%",
            });
        })
        .catch((e) => console.error(e));

    return (
        <LevelBar
            icon={"drive-harddisk-symbolic"}
            label1={name}
            label2={bind(info).as((info) => `${info.size} / ${info.used}`)}
            label3={bind(info).as((info) => info.usedPercent)}
            value={bind(info).as((info) => Number(info.usedPercent.replace("%", "")) / 100)}
        />
    );
}
function CPU({ name }: { name: string | null }) {
    const info = Variable({
        mhz: 0,
        maxmhz: 1,
    }).poll(1000, ["lscpu", "-e=MHZ,CPU,MAXMHZ", "-J"], (out, _) => {
        const data: Array<{
            mhz: number;
            cpu: number;
            maxmhz: number;
        }> = JSON.parse(out)["cpus"];
        const maxmhz = data[0].maxmhz;
        const totalFrequency = data.reduce((total, core) => {
            total += core.mhz;
            return total;
        }, 0);
        return {
            mhz: totalFrequency / data.length,
            maxmhz: maxmhz,
        };
    });
    const usage = Variable(0).poll(1000, ["vmstat", "1", "2"], (out, _) => {
        const result = out
            .split("\n")[3]
            .split(" ")
            .filter((s) => s.length > 0);
        return Number(result[13]);
    });
    return (
        <LevelBar
            onDestroy={(self) => {
                info.stopPoll();
                usage.stopPoll();
            }}
            icon={"am-cpu-symbolic"}
            label1={name || "CPU"}
            label2={info(
                (info) =>
                    `${(info.mhz / 1000).toFixed(1)}GHz / ${(info.maxmhz / 1000).toFixed(1)} GHz`
            )}
            label3={usage((u) => `${u}%`)}
            value={usage((u) => u / 100)}
        />
    );
}
function Memory() {
    const info = Variable({
        memoryTotal: 1,
        memoryUsed: 0,
        memoryUsedPercent: 0,
        swapTotal: 1,
        swapUsed: 0,
        swapUsedPercent: 0,
    }).poll(1000, ["free"], (out, _) => {
        const lines = out.split("\n");
        const memInfo = lines[1].split(" ").filter((s) => s.length > 0);
        const swapInfo = lines[2].split(" ").filter((s) => s.length > 0);
        const result = {
            memoryTotal: Number(memInfo[1]) * 1024,
            memoryUsed: Number(memInfo[2]) * 1024,
            swapTotal: Number(swapInfo[1]) * 1024,
            swapUsed: Number(swapInfo[2]) * 1024,
            memoryUsedPercent: 0,
            swapUsedPercent: 0,
        };
        result.memoryUsedPercent = result.memoryUsed / result.memoryTotal;
        result.swapUsedPercent = result.swapUsed / result.swapTotal;
        return result;
    });
    return (
        <LevelBar
            iconMargin="13px 10px 7px 10px"
            icon={"am-memory-symbolic"}
            label1={"Memory"}
            label2={info(
                (i) =>
                    `${formatBytes(i.memoryUsed).join(" ")} / ${formatBytes(i.memoryTotal).join(
                        " "
                    )}`
            )}
            label3={info((i) => (i.memoryUsedPercent * 100).toFixed(0) + "%")}
            value={info((i) => i.memoryUsedPercent)}
        />
    );
}
export default function SystemTooltip({
    forward,
    trigger,
    onHover = () => {},
    onHoverLost = () => {},
}: {
    forward: "bottom" | "top" | "left" | "right";
    trigger: Gtk.Widget;
    onHover?: (self: Astal.Window, event: Astal.HoverEvent) => void;
    onHoverLost?: (self: Astal.Window, event: Astal.HoverEvent) => void;
}) {
    const config = GetConfig(Cfg, "system-tooltip");
    return (
        <PopupWindow forward={forward} trigger={trigger}>
            <eventbox
                onHover={(self, e) => onHover(self.parent as Astal.Window, e)}
                onHoverLost={(self, e) => onHoverLost(self.parent as Astal.Window, e)}
            >
                <box
                    className={"SystemTooltip"}
                    vertical={true}
                    hexpand={true}
                    marginTop={30}
                    marginBottom={30}
                    css={`
                        padding: 20px;
                    `}
                    halign={Gtk.Align.FILL}
                >
                    <box halign={Gtk.Align.CENTER} valign={Gtk.Align.BASELINE}>
                        <SystemIcon size={86} onlyIcon={true} />
                        <label
                            label={GLib.get_host_name() + " "}
                            css={`
                                font-size: 48px;
                                margin-left: 16px;
                                margin-top: 14px;
                            `}
                        />
                    </box>
                    <Space space={20} useVertical={true} />
                    <box
                        vertical={true}
                        halign={Gtk.Align.FILL}
                        marginStart={10}
                        marginEnd={10}
                        widthRequest={250}
                    >
                        <CPU name={config.cpuName} />
                        <Memory />
                        {config.disks.map((disk) => (
                            <Disk device={disk.dev} name={disk.name} />
                        ))}
                    </box>
                </box>
            </eventbox>
        </PopupWindow>
    ) as Astal.Window;
}
