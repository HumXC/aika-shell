import { bind, exec, execAsync, GLib, GObject, property, register, signal } from "astal";
import Hyprland from "gi://AstalHyprland?version=0.1";

function get_icon(value: number) {
    const icons = {
        80: "high",
        50: "medium",
        25: "low",
        0: "off",
    };
    const icon = [80, 50, 25, 0].find((threshold) => {
        return threshold <= value;
    });
    // @ts-ignore
    return `display-brightness-${icons[icon]}-symbolic`;
}
class VCP {
    model: string = "";
    mccsVersion: string = "";
    features: Map<number, { code: string; name: string; values: Map<string, string> }>[] = [];
    // Command: ddcutil capabilities
    constructor(capabilities: string) {
        const lines = capabilities.trim().split("\n");
        let currentFeature: any = null;

        lines.forEach((line) => {
            let trimmed = line.trim();

            if (trimmed.startsWith("Model:")) {
                this.model = trimmed.split(":")[1].trim();
            } else if (trimmed.startsWith("MCCS version:")) {
                this.mccsVersion = trimmed.split(":")[1].trim();
            } else if (trimmed.startsWith("Feature:")) {
                const [featureCode, featureName] = trimmed.split(" (");
                currentFeature = {
                    code: featureCode.split(" ")[1],
                    name: featureName.slice(0, -1),
                    values: {},
                };
                this.features.push(currentFeature);
            } else if (trimmed.startsWith("Values:")) {
                currentFeature.values = {};
            } else if (currentFeature && trimmed.includes(":")) {
                const [valueCode, valueName] = trimmed.split(":");
                currentFeature.values[valueCode.trim()] = valueName.trim();
            }
        });
    }
}
type DDCMonitor = {
    edid: {
        mfg_id: string;
        model: string;
        product_code: number;
        binary_serial_number: number | null;
        serial_number: number | null;
        manufacture_year: number;
        manufacture_week: number;
    };
    i2c_bus: string;
    drm_connector: string;
    vcp_version: string;
};

async function detectDisplays(): Promise<DDCMonitor[]> {
    const lines = (await execAsync(["ddcutil", "detect"])).trim().split("\n");
    const displays: Array<DDCMonitor> = [];
    let i = -1;
    for (const line of lines) {
        let trimmed = line.trim();
        if (trimmed.startsWith("Invalid display")) {
            continue;
        }
        if (trimmed.startsWith("Display")) {
            i++;
            displays.push({
                edid: {
                    mfg_id: "",
                    model: "",
                    product_code: 0,
                    binary_serial_number: null,
                    serial_number: null,
                    manufacture_year: 0,
                    manufacture_week: 0,
                },
                i2c_bus: "",
                drm_connector: "",
                vcp_version: "",
            });
        } else if (trimmed.startsWith("I2C bus:")) {
            displays[i].i2c_bus = trimmed.split(":")[1].trim();
        } else if (trimmed.startsWith("DRM connector:")) {
            displays[i].drm_connector = trimmed.split(":")[1].trim();
        } else if (trimmed.startsWith("Mfg id:")) {
            displays[i].edid.mfg_id = trimmed.split(":")[1].trim();
        } else if (trimmed.startsWith("Model:")) {
            displays[i].edid.model = trimmed.split(":")[1].trim();
        } else if (trimmed.startsWith("Product code:")) {
            displays[i].edid.product_code = parseInt(trimmed.split(":")[1].trim().split(" ")[0]);
        } else if (trimmed.startsWith("Serial number:")) {
            displays[i].edid.serial_number = parseInt(trimmed.split(":")[1].trim()) || null;
        } else if (trimmed.startsWith("Binary serial number:")) {
            displays[i].edid.binary_serial_number = parseInt(
                trimmed.split(":")[1].trim().split(" ")[0]
            );
        } else if (trimmed.startsWith("Manufacture year:")) {
            const parts = trimmed.split(":")[1].trim().split(",  Week: ");
            displays[i].edid.manufacture_year = parseInt(parts[0]);
            displays[i].edid.manufacture_week = parseInt(trimmed.split(":")[2].trim());
        } else if (trimmed.startsWith("VCP version:")) {
            displays[i].vcp_version = trimmed.split(":")[1].trim();
        }
    }
    return displays;
}
function fetchLight(i2cBus: string): { light: number; max: number } {
    let result = {
        light: 0,
        max: 0,
    };
    const cvp = 10;
    const regex = /current value\s*=\s*(\d+)\s*,\s*max value\s*=\s*(\d+)/;
    const output = exec(["ddcutil", "getvcp", cvp.toString(), "-b", i2cBus.split("-").pop()!]);
    const match = output.match(regex);
    if (match) {
        result.light = parseInt(match[1], 10);
        result.max = parseInt(match[2], 10);
    }
    return result;
}
const i2cLock = new GLib.RecMutex();
async function putLight(i2cBus: string, light: number) {
    i2cLock.lock();
    const cvp = 10;
    await execAsync([
        "ddcutil",
        "setvcp",
        cvp.toString(),
        light.toString(),
        "-b",
        i2cBus.split("-").pop()!,
    ])
        .catch((err) =>
            console.error(
                "ddcutil setvcp failed for display:",
                i2cBus,
                "light:",
                light,
                "error:",
                err
            )
        )
        .finally(() => i2cLock.unlock());
}
@register()
export class Monitor extends GObject.Object {
    info: DDCMonitor | null = null;
    @property(Number) declare brightness: number;
    @property() declare iconName: string;
    @signal(Number) declare brightnessChanged: (brightness: number) => void;
    #maxBrightness: number = 0;
    constructor() {
        super();
        this.brightness = 100;
        this.iconName = get_icon(this.brightness);
    }
    init(info: DDCMonitor) {
        this.info = info;
        let lock = false;
        const { light, max } = fetchLight(info.i2c_bus);
        this.brightness = light;
        this.#maxBrightness = max;
        this.iconName = get_icon(this.brightness);
        this.connect("notify::brightness", async () => {
            let value = this.brightness;
            if (value < 0) value = 0;
            if (value > 100) value = 100;
            if (value !== this.brightness) {
                this.brightness = value;
                return;
            }
            this.iconName = get_icon(this.brightness);
            if (lock) return;
            lock = true;
            for (let light = -1; light != this.brightness; ) {
                light = this.brightness;
                const val = Math.floor((light / 100) * this.#maxBrightness);
                await putLight(this.info!.i2c_bus, val);
                this.brightnessChanged(val);
            }
            lock = false;
        });
    }
}
@register()
class DDCBrightness extends GObject.Object {
    @property() declare monitors: Array<Monitor>;

    async setup() {
        this.monitors = Hyprland.get_default().monitors.map(() => new Monitor());
        detectDisplays().then((displays) => {
            displays.forEach((display, index) => {
                this.monitors[index].init(display);
            });
        });
    }
    constructor() {
        super();
        this.setup();
        bind(Hyprland.get_default(), "monitors").subscribe(() => this.setup());
    }
}
const defaultDDCBrightness = new DDCBrightness();
function get_default(): DDCBrightness {
    return defaultDDCBrightness;
}

export default {
    get_default,
    Monitor,
};
