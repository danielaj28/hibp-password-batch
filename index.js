var crypto = require("crypto");
var axios = require("axios");
var fs = require("fs");

let rateLimit = 0;
let [checked, total, safe, breach] = [0, 0, 0, 0];
let breached = [];

function gethash(plaintext) {
  return crypto.createHash("sha1").update(plaintext).digest("hex");
}

function check() {
  if (items.length == 0) {
    if (breached == 0) {
      console.log("👏  No breached passwords  👏");
    } else {
      console.log("☠️  Breached passwords below  ☠️");
      breached.forEach((breachedPassword) => {
        console.log(`☠️  ${breachedPassword}`);
      });
    }
    return;
  }

  stats();

  password = items.pop();
  let hash = gethash(password);
  let hashStart = hash.substring(0, 5);
  let hashEnd = hash.substring(5, hash.length);

  //Get by range
  axios({
    method: "get",
    url: `https://api.pwnedpasswords.com/range/${hashStart}`,
  })
    .then(function (response) {
      switch (response.status) {
        case 200:
          //Check list
          let result = response.data
            .split("\r\n")
            .filter((a) => a.toLowerCase().startsWith(hashEnd.toLowerCase()));

          if (result.length == 0) {
            safe++;
          } else {
            breached.push(password);
            breach++;
          }
          checked++;
          setTimeout(check, rateLimit * 1000);

          //Return result
          break;
        case 429:
          console.log("🐌 Rate Limit");
          rateLimit += 1;
          items.push(password);
          setTimeout(check, rateLimit * 1000);
          break;
        default:
          console.log(`${response.status} ${responses.statusText}`);
      }
    })
    .catch((e) => {
      console.debug(e);
    });
}

let items = fs.readFileSync("./items.txt").toString().split("\r\n");
total = items.length;
check();

function stats() {
  let donePercent = 100;
  let completedPercent = Math.ceil((checked / total) * 100);
  let progressBar = "";
  for (let i = 0; i < completedPercent; i++) {
    progressBar += "#";
  }
  for (let i = 0; i < 100 - completedPercent; i++) {
    progressBar += "-";
  }
  console.clear();
  console.log(`[${progressBar}] ${checked}/${total} ☠️  ${breach}`);
}
