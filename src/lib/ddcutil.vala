namespace DDCUtil {
    struct EDID {
        string mfg_id;
        string model;
        int product_code;
        int? binary_serial_number;
        int? serial_number;
        int manufacture_year;
        int manufacture_week;
    }

    struct DDCMonitor {
        EDID edid;
        string i2c_bus;
        string drm_connector;
        string vcp_version;
    }
}