const fs = require('fs');
const p = require('path');


pushTranslations('assets/data/enemies');

function pushTranslations(path) {

    fs.readdir(p.join('translation', path), (err, files) => {
        for (const file of files) {
            let filePath = p.join(path, file);
            if(fs.lstatSync(filePath).isDirectory()) {
                console.log(`Dir ${filePath}`);
                pushTranslations(filePath);
            } else {
                if(filePath.endsWith(".json")) {
                    pushTranslationsToFile(filePath)
                }
            }
        }
    })
}

function pushTranslationsToFile(filePath) {
    try {
        let translationFilePath = p.join('translation', filePath);
        let fileData = JSON.parse(fs.readFileSync(filePath));
        fs.readFile(translationFilePath, (err, data) => {
            console.log(`Pushing ${translationFilePath} to ${filePath}`);
            let translation = JSON.parse(data);
            let stats = {total: 0, pushed: 0}
            pushTranslation(translation, fileData, stats)
            fs.writeFile(filePath, escapeUnicode(JSON.stringify(fileData, replacer)), (err) => {
                if(err!==null) {
                    console.error(`Error: Failed to write ${filePath} : ${err}`);
                }
            });
            console.log(`Pushed ${stats.pushed}/${stats.total} to ${filePath}`);
        })
    } catch(err) {
        console.error(`Error: Failed to process ${filePath}. Error: ${err}`)
    }
}

function pushTranslation(translation, fileData, stats) {
    if(typeof translation === 'object' && translation !== null) {
        if (Array.isArray(translation)) {
            for (let i = 0; i < translation.length; i++) {
                pushTranslation(translation[i], fileData[i], stats);
            }
        } else {
            if(translation.hasOwnProperty("transl")) {
                stats.total++;
                if(fileData.en_US === translation.orig) {
                    fileData.de_DE = translation.transl;
                    stats.pushed++;
                } else {
                    console.error(`Error: Actual ${fileData.en_US} and expected ${translation.orig} values mismatch!`)
                }
            } else {
                for(k in translation) {
                    pushTranslation(translation[k], fileData[k], stats)
                }
            }
        }
    }
}

function escapeUnicode(str) {
    str = str.replace(/[\u007F-\uFFFF]/g, function(chr) {
        let hex = chr.charCodeAt(0).toString(16);
        return '\\u' + ('0000' + hex).slice(-4);
    });
    str = str.replace(/\//g, "\\\/");
    return str;
}

const replacer = (key, val) => {
    if (typeof val === 'number') {
        let abs = Math.abs(val)
        if(abs >= 1e20 || abs <= 1e-5 && abs !== 0) {
            return JSON.rawJSON(val.toExponential(1))
        }
    }
    return val;
}
