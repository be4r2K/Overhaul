import { W as WebPlugin } from "./index-CwI9OFk1.js";
class NativeSettingsWeb extends WebPlugin {
  /**
   * Open iOS & Android settings.
   * Not implemented for web!
   */
  async open() {
    return new Promise((_resolve, reject) => {
      reject(new Error("Not implemented for web."));
    });
  }
  /**
   * Open android settings.
   * Not implemented for web!
   */
  async openAndroid() {
    return new Promise((_resolve, reject) => {
      reject(new Error("Not implemented for web."));
    });
  }
  /**
   * Open iOS settings.
   * Not implemented for web!
   */
  async openIOS() {
    return new Promise((_resolve, reject) => {
      reject(new Error("Not implemented for web."));
    });
  }
}
export {
  NativeSettingsWeb
};
