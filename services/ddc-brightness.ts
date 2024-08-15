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
                this.display[displayId] = currentDisplay;
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
function getLight(displayID: number): { light: number; max: number } {
    let result = {
        light: 0,
        max: 0,
    };
    const cvp = 10;
    const regex = /current value\s*=\s*(\d+)\s*,\s*max value\s*=\s*(\d+)/;
    const output = Utils.exec(`ddcutil getvcp ${cvp} --display=${displayID}`);
    const match = output.match(regex);
    if (match) {
        result.light = parseInt(match[1], 10);
        result.max = parseInt(match[2], 10);
    }
    return result;
}
function setLight(displayID: number, light: number) {
    const cvp = 10;
    Utils.exec(`ddcutil setvcp ${cvp} ${light} --display=${displayID}`);
}
class DDCBrightness extends Service {
    static {
        Service.register(
            this,
            {},
            {
                light: ["int", "rw"],
                icon_name: ["string", "r"],
            }
        );
    }
    #display_max_brightness = 0;
    #light = 0; // 0-100
    #icon_name = get_icon(100);
    get light() {
        return this.#light;
    }
    set light(value: number) {
        if (value < 0) value = 0;
        if (value > 100) value = 100;
        const val = Math.floor((value / 100) * this.#display_max_brightness);
        setLight(1, val);
        this.#light = value;
        this.#icon_name = get_icon(this.#light);
        this.emit("changed");
        this.notify("light");
        this.notify("icon_name");
    }

    get icon_name() {
        return this.#icon_name;
    }
    constructor() {
        super();
        const { light, max } = getLight(1);
        this.#light = Math.floor((light / max) * 100);
        this.#display_max_brightness = max;
        this.#icon_name = get_icon(this.#light);
        this.emit("changed");
        this.notify("light");
        this.notify("icon_name");
    }
}

// the singleton instance
const service = new DDCBrightness();

// export to use in other modules
export default service;
