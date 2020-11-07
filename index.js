//Load testing ensures that the software performs to render high user satisfaction
//here we are gonna perform a load testing with a specific scenario

import http from "k6/http"; //http is imported for creating virtual request to the browser
import { Rate } from "k6/metrics";
import { check } from "k6";
const myFailRate = new Rate("failed requests");
const checking = new Rate("check");
const uriD = JSON.parse(open("./i.json"));
export let options = {
  scenarios: {
    passing: {
      executor: "ramping-arrival-rate",
      startTime: "1s",
      gracefulStop: "0.8s",
      preAllocatedVUs: 500,
      stages: [
        { target: 8, duration: "3s" },
        { target: 10, duration: "10s" },
        { target: 20, duration: "15s" },
        { target: 100, duration: "3s" },
      ],
      startRate: 20,
      //   vus: 100,
      //   iterations: 200,
      //   maxDuration: "30s",
    },
    // failing: {
    //   executor: "ramping-arrival-rate",
    //   startTime: "1s",
    //   gracefulStop: "0.8s",
    //   preAllocatedVUs: 1000,
    //   stages: [
    //     { target: 10, duration: "3s" },
    //     { target: 100, duration: "10s" },
    //     { target: 200, duration: "15s" },
    //     { target: 100, duration: "3s" },
    //   ],
    //   startRate: 20,
    //   //   vus: 100,
    //   //   iterations: 200,
    //   //   maxDuration: "30s",
    // },
  },
  //   duration: "3s",
  //   vus: 100,
  thresholds: {
    check: [
      { threshold: "rate > 0.95", abortOnFail: true, delayAbortEval: "1m" },
    ],
    //these are the constraints for our test to get pass
    "failed requests": ["rate>0.9"], //the rate at which the reponse must occur
    http_req_duration: ["p(99)<400", "p(75)<300", "p(50)<200"], //constrain for response time
  },
};
let token = false;

const requestGET = (name, url, payload, params) => {
  const nameS = "is working [" + name + "]";
  const nameT = "is within time[" + name + "]";

  const req = http.get(url, JSON.stringify(payload), params);

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
    "http://allcaretesting.sbnasoftware.com/API/api/Login/userlogin?Username=SUPERADMIN&Password=SUPERADMINSUPERADMINa%241&AgencyCode=SUPERADMIN&role=&type=webApp",
    {},
    params
  );
  token = "Bearer " + req.json().tokenString;
  return token;
};

export default function() {
  let token = login();

  //t   he main heart where we place out test code , so that it can be accesed by virtual users
  var params = {
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
      // "Bearer eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3VzZXJkYXRhIjoiMCIsInVuaXF1ZV9uYW1lIjoiU1VQRVJBRE1JTiIsIm5hbWVpZCI6IlNVUEVSQURNSU4iLCJyb2xlIjoiU1VQRVJBRE1JTiIsIm5iZiI6MTYwNDY1NDI5MywiZXhwIjoxNjA1MDE0MjkzLCJpYXQiOjE2MDQ2NTQyOTN9.PZWFykEhrjGL_B1d9OExGvpBX8h6SszSxOCVu7ws7m9iPw8lSvUacXEuWKyU30t-JlnDE52D623R4vZGyVL4EQ",
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
  const url =
    "http://allcaretesting.sbnasoftware.com/API/api/Agency/GetAgencyListFilterNew";
  uriD.forEach((element) => {
    if (element.method == "POST") {
      requestPOST(element.name, element.url, element.payload, params);
    }
    if (element.method == "GET") {
      requestGET(element.name, element.url, element.payload, params);
    }
  });

  //   requestPOST(uriD[14].name, uriD[14].url, uriD[14].payload, params);

  //   var res = http.post(
  //     "http://allcaretesting.sbnasoftware.com/API/api/Agency/GetAgencyListFilterNew",
  //     payload,
  //     params
  //   );
  //   console.log(res.status);
  // console.log(res.body);
  //creating a get request from the broser and storing it in the response object
  // console.log(c); //accesing the response time from response object
  //   const name = "vis";
  //   check(res, {
  //     [name]: (r) => r.status == 200,
  //     "is achiving target [GetAgencyListFilterNew]": (r) =>
  //       res.timings.duration < 30000,
  //   });

  //  console.log(`vu ${__VU},iter ${__ITER}`)//Execution context variables helps to know about the current virtual user and his itreating count
  //  console.log(`${c}`)//printing the response time
}
