import { W as WebPlugin } from "./index-CwI9OFk1.js";
class GoogleAuthWeb extends WebPlugin {
  constructor() {
    super();
  }
  loadScript() {
    if (typeof document === "undefined") {
      return;
    }
    const scriptId = "gapi";
    const scriptEl = document === null || document === void 0 ? void 0 : document.getElementById(scriptId);
    if (scriptEl) {
      return;
    }
    const head = document.getElementsByTagName("head")[0];
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.defer = true;
    script.async = true;
    script.id = scriptId;
    script.onload = this.platformJsLoaded.bind(this);
    script.src = "https://apis.google.com/js/platform.js";
    head.appendChild(script);
  }
  initialize(_options = {
    clientId: "",
    scopes: [],
    grantOfflineAccess: false
  }) {
    var _a, _b;
    if (typeof window === "undefined") {
      return;
    }
    const metaClientId = (_a = document.getElementsByName("google-signin-client_id")[0]) === null || _a === void 0 ? void 0 : _a.content;
    const clientId = _options.clientId || metaClientId || "";
    if (!clientId) {
      console.warn("GoogleAuthPlugin - clientId is empty");
    }
    this.options = {
      clientId,
      grantOfflineAccess: (_b = _options.grantOfflineAccess) !== null && _b !== void 0 ? _b : false,
      scopes: _options.scopes || []
    };
    this.gapiLoaded = new Promise((resolve) => {
      window.gapiResolve = resolve;
      this.loadScript();
    });
    this.addUserChangeListener();
    return this.gapiLoaded;
  }
  platformJsLoaded() {
    gapi.load("auth2", () => {
      const clientConfig = {
        client_id: this.options.clientId,
        plugin_name: "CodetrixStudioCapacitorGoogleAuth"
      };
      if (this.options.scopes.length) {
        clientConfig.scope = this.options.scopes.join(" ");
      }
      gapi.auth2.init(clientConfig);
      window.gapiResolve();
    });
  }
  async signIn() {
    return new Promise(async (resolve, reject) => {
      var _a;
      try {
        let serverAuthCode;
        const needsOfflineAccess = (_a = this.options.grantOfflineAccess) !== null && _a !== void 0 ? _a : false;
        if (needsOfflineAccess) {
          const offlineAccessResponse = await gapi.auth2.getAuthInstance().grantOfflineAccess();
          serverAuthCode = offlineAccessResponse.code;
        } else {
          await gapi.auth2.getAuthInstance().signIn();
        }
        const googleUser = gapi.auth2.getAuthInstance().currentUser.get();
        if (needsOfflineAccess) {
          await googleUser.reloadAuthResponse();
        }
        const user = this.getUserFrom(googleUser);
        user.serverAuthCode = serverAuthCode;
        resolve(user);
      } catch (error) {
        reject(error);
      }
    });
  }
  async refresh() {
    const authResponse = await gapi.auth2.getAuthInstance().currentUser.get().reloadAuthResponse();
    return {
      accessToken: authResponse.access_token,
      idToken: authResponse.id_token,
      refreshToken: ""
    };
  }
  async signOut() {
    return gapi.auth2.getAuthInstance().signOut();
  }
  async addUserChangeListener() {
    await this.gapiLoaded;
    gapi.auth2.getAuthInstance().currentUser.listen((googleUser) => {
      this.notifyListeners("userChange", googleUser.isSignedIn() ? this.getUserFrom(googleUser) : null);
    });
  }
  getUserFrom(googleUser) {
    const user = {};
    const profile = googleUser.getBasicProfile();
    user.email = profile.getEmail();
    user.familyName = profile.getFamilyName();
    user.givenName = profile.getGivenName();
    user.id = profile.getId();
    user.imageUrl = profile.getImageUrl();
    user.name = profile.getName();
    const authResponse = googleUser.getAuthResponse(true);
    user.authentication = {
      accessToken: authResponse.access_token,
      idToken: authResponse.id_token,
      refreshToken: ""
    };
    return user;
  }
}
export {
  GoogleAuthWeb
};
