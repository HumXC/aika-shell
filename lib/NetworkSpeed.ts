import { exec } from "astal";
import { GObject, register, property, GLib, signal } from "astal/gobject";
import { Gtk } from "astal/gtk3";
function formatBytes(bytes: number) {
    if (bytes < 1e6) {
        return `${(bytes / 1024).toFixed(2)} KB`;
    } else {
        return `${(bytes / 1e6).toFixed(2)} MB`;
    }
}
@register()
class NetworkSpeed extends GObject.Object {
    @property(Object) declare speed: {
        download: string;
        upload: string;
    };
    @property(Object) declare iface: string[];
    @signal(Object) declare ifaceUpdate: (iface: string[]) => void;
    @property(String) declare currentIFace: string;

    private intervalId: GLib.Source;

    // TODO
    getBytes(iface: string): {
        download: string;
        upload: string;
    } {
        let result = {
            download: "0 KB",
            upload: "0 KB",
        };
        return result;
    }
    prev_data: { kernel: any } | null = null;
    constructor() {
        super();
        this.speed = {
            download: "0 KB/s",
            upload: "0 KB/s",
        };
        this.iface = [];
        this.currentIFace = "All";
        this.intervalId = setInterval(() => this.interval(), 1000);
    }
    destroy(): void {
        clearInterval(this.intervalId);
    }
    createMenu() {
        const menu = new Gtk.Menu();
        const all = new Gtk.MenuItem({ label: "All Interfaces" });
        all.connect("activate", () => {
            this.currentIFace = "All";
        });
        menu.add(all);
        for (const iface of this.iface) {
            const item = new Gtk.MenuItem({ label: iface });
            item.connect("activate", () => {
                this.currentIFace = iface;
            });
            menu.add(item);
        }
        menu.show_all();
        return menu;
    }
    interval() {
        const current_data = JSON.parse(exec(`ifstat -j`));
        if (this.prev_data === null) {
            this.prev_data = current_data;
            return;
        }
        let totalRxBytes = 0;
        let totalTxBytes = 0;
        const ifaceList = [];
        for (const iface of Object.keys(current_data.kernel)) {
            if (iface === "lo") continue; // 忽略 lo 接口
            ifaceList.push(iface);
            if (this.currentIFace === "All" || this.currentIFace === iface) {
                const prev = this.prev_data.kernel[iface];
                const current = current_data.kernel[iface];
                if (!prev || !current) continue;
                totalRxBytes += current.rx_bytes - prev.rx_bytes;
                totalTxBytes += current.tx_bytes - prev.tx_bytes;
            }
        }
        this.speed = {
            download: formatBytes(totalRxBytes) + "/s",
            upload: formatBytes(totalTxBytes) + "/s",
        };
        if (this.iface.length !== ifaceList.length) {
            this.iface = ifaceList;
            this.ifaceUpdate(ifaceList);
        } else {
            for (let i = 0; i < ifaceList.length; i++) {
                if (this.iface[i] !== ifaceList[i]) {
                    this.iface = ifaceList;
                    this.ifaceUpdate(ifaceList);
                    break;
                }
            }
        }

        this.prev_data = current_data;
    }
}

export default NetworkSpeed;
