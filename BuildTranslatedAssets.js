const fs = require('fs');
const p = require('path');

pushTranslations('assets');

function pushTranslations(path) {

    fs.readdir(p.join('translation', path), (err, files) => {
        for (const file of files) {
            let filePath = p.join(path, file);
            if(fs.lstatSync(p.join('translation', filePath)).isDirectory()) {
                console.log(`Dir ${filePath}`);
                pushTranslations(filePath);
            } else {
                if(filePath.endsWith(".png") || filePath.match("lang")) {
                    copyFile(filePath)
                } else if(filePath.endsWith(".json")) {
                    pushTranslationsToFile(filePath)
                }
            }
        }
    })
}

function copyFile(filePath) {
    console.log(`Copying ${filePath}`);
    let translationFilePath = p.join('translation', filePath);
    let copyTo = p.join('build', filePath.replace("uk_UA.json", "de_DE.json"));
    fs.mkdirSync(p.parse(copyTo).dir, { recursive: true });
    fs.cp(translationFilePath,  copyTo, (err) => {});
}

function pushTranslationsToFile(filePath) {
    try {
        let translationFilePath = p.join('translation', filePath);
        let buildPath = p.join('build', filePath);
        let fileData = JSON.parse(fs.readFileSync(filePath));
        fs.mkdirSync(p.parse(buildPath).dir, { recursive: true })
        fs.readFile(translationFilePath, (err, data) => {
            let translation = JSON.parse(data);
            let stats = {total: 0, pushed: 0}
            pushTranslation(translation, fileData, stats);
            fs.writeFile(buildPath, escapeUnicode(JSON.stringify(fileData, replacer)), (err) => {
                if(err!==null) {
                    console.error(`Error: Failed to write ${buildPath} : ${err}`);
                }
            });
            console.log(`Pushed ${stats.pushed}/${stats.total} to ${buildPath}`);
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
                    if(translation.transl.toString().match(/[а-яА-ЯіїґІЇҐєЄ]/)?.length > 0) {
                        fileData.de_DE = translation.transl;
                    } else {
                        fileData.de_DE = translation.orig;
                    }
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
