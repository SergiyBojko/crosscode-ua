const fs = require('fs');
const p = require('path');

extractStringsFromDir('assets');

function extractStringsFromDir(path) {
    fs.readdir(path, (err, files) => {
        for (const file of files) {
            let filePath = p.join(path, file);
            if(fs.lstatSync(filePath).isDirectory()) {
                console.log(`Dir ${filePath}`);
                extractStringsFromDir(filePath);
            } else {
                console.log(`File ${filePath}`);
                if(filePath.endsWith(".json")) {
                    processJsonFile(filePath)
                }
            }
        }
    })
}

function processJsonFile(path) {
    fs.readFile(path, (err, data) => {
        console.log(`Parsing file ${path}`);
        let json = JSON.parse(data);
        let out = processJson(json);
        if(out !== null) {
            let outPath = p.join('translation', path);
            fs.mkdirSync(p.parse(outPath).dir, {recursive: true})
            fs.writeFile(outPath, JSON.stringify(out, null, 1), (err) => {
            })
        }
    })
}

function processJson(value) {
    if(typeof value === 'object' && value !== null) {
        if(Array.isArray(value)) {
            var arr = value;
            var out = [];
            for(var i = 0; i < arr.length; i++) {
                var processed = processJson(arr[i]);
                if(processed !== null) {
                    out[i] = processed;
                }
            }
            if(out.length > 0) {
                return out;
            } else {
                return null;
            }
        } else {
            var json = value;
            var out = {};
            if(json.hasOwnProperty("ja_JP")) { // this is obj with text
                out["orig"] = json["en_US"];
                out["transl"] = json["de_DE"];
                return out
            } else { // container obj, ignore all primitives and process nested obj
                for (k in json) {
                    var key = k;
                    var processed = processJson(json[k])
                    if(processed !== null) {
                        out[key] = processed;
                    }
                }
            }
            if(Object.keys(out).length > 0) {
                return out;
            } else {
                return null;
            }
        }
    } else {
        return null;
    }

}