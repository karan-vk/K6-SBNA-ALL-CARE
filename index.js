import http from "k6/http";
import { Rate } from "k6/metrics";
import { check, sleep } from "k6";
const myFailRate = new Rate("failed requests");
const checking = new Rate("check");
const uriD = JSON.parse(open("./dat.json"));
export let options = {
    scenarios: {
        conastant_load: {
            executor: "constant-vus",
            vus: 10,
            duration: "1m",
        },
        fixed_load_increase: {
            executor: "per-vu-iterations",
            vus: 25,
            iterations: 20,
            maxDuration: "1m",
        },
        exponential_increase: {
            executor: "ramping-vus",
            startVUs: 0,
            stages: [
                { duration: "5s", target: 10 },
                { duration: "5s", target: 20 },
                { duration: "5s", target: 5 },
                { duration: "5s", target: 0 },
            ],
            gracefulRampDown: "4s",
        },
        spike: {
            executor: "ramping-arrival-rate",
            startRate: 2,
            timeUnit: "1s",
            preAllocatedVUs: 100,
            maxVUs: 500,
            stages: [
                { target: 50, duration: "10s" },
                { target: 0, duration: "25s" },
            ],
        },
    },

    thresholds: {
        check: [
            { threshold: "rate > 0.95", abortOnFail: true, delayAbortEval: "1m" },
        ],

        "failed requests": ["rate>0.9"],
        http_req_duration: ["p(99)<4000", "p(75)<3000", "p(50)<2000"],
    },
};
let token = false;

const requestGET = (name, url, payload, params) => {
    const nameS = "is working [" + name + "]";
    const nameT = "is within time[" + name + "]";

    const req = http.get(url, JSON.stringify(payload), params);
    sleep(1);

    checking.add(req.status == 200);
    check(req, {
        [nameS]: (r) => r.status == 200,
        [nameT]: (r) => r.timings.duration < 30000,
    });
};
const requestPOST = (name, url, payload, params) => {
    const nameS = "is working [" + name + "]";
    const nameT = "is within time[" + name + "]";

    const req = http.post(url, JSON.stringify(payload), params);
    sleep(1);
    checking.add(req.status == 200);
    check(req, {
        [nameS]: (r) => r.status == 200,
        [nameT]: (r) => r.timings.duration < 30000,
    });
};

const login = () => {
    var params = {
        headers: {
            "Content-Type": "application/json",
            Referer: "http://allcaretesting.sbnasoftware.com/csp",
            "Accept-Encoding": "gzip, deflate",
            "Accept-Language": "en-US,en;q=0.9",
            "X-Powered-By": "ASP.NET",
            Host: "allcaretesting.sbnasoftware.com",
            Connection: "keep-alive",
            Pragma: "no-cache",
            "Cache-Control": "no-cache",
            Accept: "application/json, text/plain, */*",
        },
    };
    const req = http.post(
        "https://allcaretesting.sbnasoftware.com/API/api/Login/userlogin?Username=SUPERADMIN&Password=SUPERADMINSUPERADMINa%241&AgencyCode=SUPERADMIN&role=&type=webApp", {},
        params
    );

    token = "Bearer " + JSON.stringify(req.json().tokenString);
    return token;
};

export default function() {
    let token = login();

    var params = {
        headers: {
            "Content-Type": "application/json",
            Authorization: token,

            Referer: "http://allcaretesting.sbnasoftware.com/csp",
            "Accept-Encoding": "gzip, deflate",
            "Accept-Language": "en-US,en;q=0.9",
        },
    };
    var payload = JSON.stringify({
        AgencyFilter: 1,
        SearchColumn: "AgencyName",
        SearchText: "",
        agencyId: 0,
        companyFilter: 0,
        currentpageno: 1,
        field: "AgencyName",
        matchCase: false,
        operator: "startswith",
        orderColumn: "AgencyName",
        orderType: "asc",
        pageitem: 10,
        type: "",
        value: "",
    });

    uriD.forEach((element) => {
        if (element.method == "POST") {
            requestPOST(element.name, element.url, element.payload, params);
        }
        if (element.method == "GET") {
            requestGET(element.name, element.url, element.payload, params);
        }
    });
}