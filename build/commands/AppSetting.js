"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const standalone_1 = require("@adonisjs/core/build/standalone");
class AppSetting extends standalone_1.BaseCommand {
    async run() { }
}
exports.default = AppSetting;
AppSetting.commandName = 'app:setting';
AppSetting.description = '';
AppSetting.settings = {
    loadApp: false,
    stayAlive: false,
};
//# sourceMappingURL=AppSetting.js.map