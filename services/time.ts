class TimeService extends Service {
    static {
        Service.register(
            this,
            {},
            {
                year: ["string", "r"],
                month: ["string", "r"],
                weekday: ["string", "r"],
                day: ["string", "r"],
                hours: ["string", "r"],
                minutes: ["string", "r"],
                seconds: ["string", "r"],
            }
        );
    }
    #now = new Date();
    #year = "";
    #month = "";
    #weekday = "";
    #day = "";
    #hours = "";
    #minutes = "";
    #seconds = "";

    get year() {
        return this.#year;
    }

    get month() {
        return this.#month;
    }

    get day() {
        return this.#day;
    }

    get hours() {
        return this.#hours;
    }

    get minutes() {
        return this.#minutes;
    }

    get weekday() {
        return this.#weekday;
    }
    get seconds() {
        return this.#seconds;
    }
    constructor() {
        super();
        setInterval(() => this.#onChange(), 1000);
        this.#onChange();
    }

    #onChange() {
        this.#now = new Date();
        this.#year = String(this.#now.getFullYear());
        this.#month = String(this.#now.getMonth() + 1).padStart(2, "0");
        this.#weekday = this.#now.toLocaleDateString("zh-CN", { weekday: "long" });
        this.#day = String(this.#now.getDate()).padStart(2, "0");
        this.#hours = String(this.#now.getHours()).padStart(2, "0");
        this.#minutes = String(this.#now.getMinutes()).padStart(2, "0");
        this.#seconds = String(this.#now.getSeconds()).padStart(2, "0");
        this.emit("changed");
        this.notify("year");
        this.notify("month");
        this.notify("weekday");
        this.notify("day");
        this.notify("hours");
        this.notify("minutes");
        this.notify("seconds");
    }
}

// the singleton instance
const service = new TimeService();

// export to use in other modules
export default service;
