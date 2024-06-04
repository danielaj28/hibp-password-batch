var crypto = require("crypto");
var axios = require("axios");
var fs = require("fs");

let rateLimit = 3;

function gethash(plaintext) {
  return crypto.createHash("sha1").update(plaintext).digest("hex");
}

function check() {
  if (items.length == 0) {
    console.log("DONE")
    return;
  }
  password = items.pop();
  let hash = gethash(password);
  //console.log(hash);
  let hashStart = hash.substring(0, 5);
  let hashEnd = hash.substring(5, hash.length);
  //console.log(hash, hashStart, hashEnd);

  //Get by range
  axios({
    method: "get",
    url: `https://api.pwnedpasswords.com/range/${hashStart}`,
  })
    .then(function (response) {
      switch (response.status) {
        case 200:
          //Check list
          //console.debug(response.data.split("\r\n"));
          let result = response.data
            .split("\r\n")
            .filter((a) => a.toLowerCase().startsWith(hashEnd.toLowerCase()));

          if (result.length == 0) {
            console.log(`😁   Safe: ${password}`);
          } else {
            console.log(`💀 Breach: ${password}`);
          }
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
check();
