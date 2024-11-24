import { exec, execAsync, GObject, property, register } from "astal";

const icons = {
    80: "high",
    50: "medium",
    25: "low",
    0: "off",
};
function get_icon(value: number) {
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
class Display {
    edid: {
        mfg_id: string;
        model: string;
        product_code: number;
        binary_serial_number: number | null;
        serial_number: number | null;
        manufacture_year: number;
        manufacture_week: number;
    } = {
        mfg_id: "",
        model: "",
        product_code: 0,
        serial_number: 0,
        manufacture_year: 0,
        manufacture_week: 0,
        binary_serial_number: 0,
    };
    i2c_bus: string = "";
    drm_connector: string = "";
    vcp_version: string = "";
}
class Detect {
    display: Map<string, {}> = new Map();
    // Command: ddcutil detect
    constructor(detect: string) {
        const lines = detect.trim().split("\n");
        let currentDisplay = new Display();
        for (const line of lines) {
            let trimmed = line.trim();
            if (trimmed.startsWith("Invalid display")) {
                return;
            }
            if (trimmed.startsWith("Display")) {
                currentDisplay = new Display();
                const displayId = trimmed.split(" ")[1];
                this.display.set(displayId, currentDisplay);
            } else if (trimmed.startsWith("I2C bus:")) {
                currentDisplay.i2c_bus = trimmed.split(":")[1].trim();
            } else if (trimmed.startsWith("DRM connector:")) {
                currentDisplay.drm_connector = trimmed.split(":")[1].trim();
            } else if (trimmed.startsWith("Mfg id:")) {
                currentDisplay.edid.mfg_id = trimmed.split(":")[1].trim();
            } else if (trimmed.startsWith("Model:")) {
                currentDisplay.edid.model = trimmed.split(":")[1].trim();
            } else if (trimmed.startsWith("Product code:")) {
                currentDisplay.edid.product_code = parseInt(
                    trimmed.split(":")[1].trim().split(" ")[0]
                );
            } else if (trimmed.startsWith("Serial number:")) {
                currentDisplay.edid.serial_number = parseInt(trimmed.split(":")[1].trim()) || null;
            } else if (trimmed.startsWith("Binary serial number:")) {
                currentDisplay.edid.binary_serial_number = parseInt(
                    trimmed.split(":")[1].trim().split(" ")[0]
                );
            } else if (trimmed.startsWith("Manufacture year:")) {
                const parts = trimmed.split(":")[1].trim().split(",  Week: ");
                currentDisplay.edid.manufacture_year = parseInt(parts[0]);
                currentDisplay.edid.manufacture_week = parseInt(trimmed.split(":")[2].trim());
            } else if (trimmed.startsWith("VCP version:")) {
                currentDisplay.vcp_version = trimmed.split(":")[1].trim();
            }
        }
    }
}
async function fetchLight(displayID: number): Promise<{ light: number; max: number }> {
    let result = {
        light: 0,
        max: 0,
    };
    const cvp = 10;
    const regex = /current value\s*=\s*(\d+)\s*,\s*max value\s*=\s*(\d+)/;
    const output = await execAsync(`ddcutil getvcp ${cvp} --display=${displayID}`);
    const match = output.match(regex);
    if (match) {
        result.light = parseInt(match[1], 10);
        result.max = parseInt(match[2], 10);
    }
    return result;
}
async function putLight(displayID: number, light: number) {
    const cvp = 10;
    await execAsync(`ddcutil setvcp ${cvp} ${light} --display=${displayID}`).catch((err) =>
        console.error(
            "ddcutil setvcp failed for displayID:",
            displayID,
            "light:",
            light,
            "error:",
            err
        )
    );
}
@register()
class DDCBrightness extends GObject.Object {
    @property(Number) declare light: number;
    @property(String) declare iconName: string;
    #displayMaxBrightness = 100;
    #lock = false;
    constructor() {
        super();
        this.#displayMaxBrightness = 100;
        this.iconName = get_icon(100);
        fetchLight(1).then(({ light, max }) => {
            this.#displayMaxBrightness = max;
            this.light = Math.floor((light / max) * 100);
            this.iconName = get_icon(this.light);

            this.connect("notify::light", async () => {
                let value = this.light;
                if (value < 0) value = 0;
                if (value > 100) value = 100;
                if (value !== this.light) {
                    this.light = value;
                    return;
                }
                this.iconName = get_icon(this.light);

                if (this.#lock) return;
                this.#lock = true;
                for (let light = -1; light != this.light; ) {
                    light = this.light;
                    const val = Math.floor((light / 100) * this.#displayMaxBrightness);
                    await putLight(1, val);
                }
                this.#lock = false;
            });
        });
    }
}
export default DDCBrightness;
