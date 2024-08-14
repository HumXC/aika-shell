const entry = App.configDir + "/main.ts";
const outdir = "/tmp/ags/js";
const css = `/tmp/ags-style.css`;
const scss = `${App.configDir}/style.scss`;
Utils.exec(`sassc ${scss} ${css}`);
try {
    // prettier-ignore
    await Utils.execAsync([
        "bun", "build", entry,
        "--outdir", outdir,
        "--external", "resource://*",
        "--external", "gi://*"
    ]);
    await import(`file://${outdir}/main.js`);
} catch (error) {
    console.error(error);
}

export {};
