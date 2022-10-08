"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.INJECT_DIR = void 0;
/**
 * Preload file that will be executed in the renderer process.
 * Note: This needs to be attached **prior to imports**, as imports
 * would delay the attachment till after the event has been raised.
 */
document.addEventListener('DOMContentLoaded', () => {
    injectScripts(); // eslint-disable-line @typescript-eslint/no-use-before-define
});
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const electron_1 = require("electron");
// Do *NOT* add 3rd-party imports here in preload (except for webpack `externals` like electron).
// They will work during development, but break in the prod build :-/ .
// Electron doc isn't explicit about that, so maybe *we*'re doing something wrong.
// At any rate, that's what we have now. If you want an import here, go ahead, but
// verify that apps built with a non-devbuild nativefier (installed from tarball) work.
// Recipe to monkey around this, assuming you git-cloned nativefier in /opt/nativefier/ :
// cd /opt/nativefier/ && rm -f nativefier-43.1.0.tgz && npm run build && npm pack && mkdir -p ~/n4310/ && cd ~/n4310/ \
//    && rm -rf ./* && npm i /opt/nativefier/nativefier-43.1.0.tgz && ./node_modules/.bin/nativefier 'google.com'
// See https://github.com/nativefier/nativefier/issues/1175
// and https://www.electronjs.org/docs/api/browser-window#new-browserwindowoptions / preload
const log = console; // since we can't have `loglevel` here in preload
exports.INJECT_DIR = path.join(__dirname, '..', 'inject');
/**
 * Patches window.Notification to:
 * - set a callback on a new Notification
 * - set a callback for clicks on notifications
 * @param createCallback
 * @param clickCallback
 */
function setNotificationCallback(createCallback, clickCallback) {
    const OldNotify = window.Notification;
    const newNotify = function (title, opt) {
        createCallback(title, opt);
        const instance = new OldNotify(title, opt);
        instance.addEventListener('click', clickCallback);
        return instance;
    };
    newNotify.requestPermission = OldNotify.requestPermission.bind(OldNotify);
    Object.defineProperty(newNotify, 'permission', {
        get: () => OldNotify.permission,
    });
    // @ts-expect-error TypeScript says its not compatible, but it works?
    window.Notification = newNotify;
}
function injectScripts() {
    const needToInject = fs.existsSync(exports.INJECT_DIR);
    if (!needToInject) {
        return;
    }
    // Dynamically require scripts
    try {
        const jsFiles = fs
            .readdirSync(exports.INJECT_DIR, { withFileTypes: true })
            .filter((injectFile) => injectFile.isFile() && injectFile.name.endsWith('.js'))
            .map((jsFileStat) => path.join('..', 'inject', jsFileStat.name));
        for (const jsFile of jsFiles) {
            log.debug('Injecting JS file', jsFile);
            require(jsFile);
        }
    }
    catch (err) {
        log.error('Error encoutered injecting JS files', err);
    }
}
function notifyNotificationCreate(title, opt) {
    electron_1.ipcRenderer.send('notification', title, opt);
}
function notifyNotificationClick() {
    electron_1.ipcRenderer.send('notification-click');
}
// @ts-expect-error TypeScript thinks these are incompatible but they aren't
setNotificationCallback(notifyNotificationCreate, notifyNotificationClick);
electron_1.ipcRenderer.on('params', (event, message) => {
    log.debug('ipcRenderer.params', { event, message });
    const appArgs = JSON.parse(message);
    log.info('nativefier.json', appArgs);
});
electron_1.ipcRenderer.on('debug', (event, message) => {
    log.debug('ipcRenderer.debug', { event, message });
});
//# sourceMappingURL=preload.js.map