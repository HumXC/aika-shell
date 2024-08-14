function formatSpeed(bytesPerSecond: number) {
    if (bytesPerSecond < 1e6) {
        return `${(bytesPerSecond / 1024).toFixed(2)} KB/s`;
    } else {
        return `${(bytesPerSecond / 1e6).toFixed(2)} MB/s`;
    }
}
class NetworkSpeedService extends Service {
    static {
        Service.register(
            this,
            {},
            {
                download_speed: ["string", "r"],
                upload_speed: ["string", "r"],
                download_speed_bytes: ["int", "r"],
                upload_speed_bytes: ["int", "r"],
            }
        );
    }
    #download_speed = "0 KB/s";
    #upload_speed = "0 KB/s";
    #download_speed_bytes = 0;
    #upload_speed_bytes = 0;

    #prev_data: { kernel: {} } | null = null;

    get download_speed() {
        return this.#download_speed;
    }
    get upload_speed() {
        return this.#upload_speed;
    }
    get download_speed_bytes() {
        return this.#download_speed_bytes;
    }
    get upload_speed_bytes() {
        return this.#upload_speed_bytes;
    }

    constructor() {
        super();
        setInterval(() => this.#onChange(), 1000);
        this.#onChange();
    }

    #onChange() {
        let current_data = JSON.parse(Utils.exec(`ifstat -j`));
        if (this.#prev_data === null) {
            this.#prev_data = current_data;
            return;
        }

        let totalRxBytes = 0;
        let totalTxBytes = 0;

        for (const iface of Object.keys(current_data.kernel)) {
            if (iface === "lo") continue; // 忽略 lo 接口
            const prev = this.#prev_data.kernel[iface];
            const current = current_data.kernel[iface];
            if (!prev || !current) continue;
            totalRxBytes += current.rx_bytes - prev.rx_bytes;
            totalTxBytes += current.tx_bytes - prev.tx_bytes;
        }
        this.#download_speed_bytes = totalRxBytes;
        this.#upload_speed_bytes = totalTxBytes;
        this.#download_speed = formatSpeed(totalRxBytes);
        this.#upload_speed = formatSpeed(totalTxBytes);
        this.#prev_data = current_data;

        this.emit("changed");
        this.notify("download_speed");
        this.notify("upload_speed");
        this.notify("download_speed_bytes");
        this.notify("upload_speed_bytes");
    }
}

// the singleton instance
const service = new NetworkSpeedService();

// export to use in other modules
export default service;
