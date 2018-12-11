/* eslint-disable no-console */
/* global crypto */
const debug = true;

const uid = crypto.getRandomValues(new Uint16Array(3)).join("-");
let isDetected = false;
if (debug) {
  console.info("three.content", uid);
}

const globalHook = {
  reportDetection(recipient = {}) {
    /* global __THREE_INSPECTOR_GLOBAL_HOOK__ RECIPIENT */
    this.executeInContext(
      function() {
        __THREE_INSPECTOR_GLOBAL_HOOK__.reportDetection(window, RECIPIENT);
      }.toString(),
      {
        RECIPIENT: recipient
      }
    );
  },
  reportInstances(recipient) {
    /* global __THREE_INSPECTOR_GLOBAL_HOOK__ RECIPIENT */
    this.executeInContext(
      function() {
        __THREE_INSPECTOR_GLOBAL_HOOK__.reportInstances(RECIPIENT);
      }.toString(),
      {
        RECIPIENT: recipient
      }
    );
  },
  reportInspector(index, recipient) {
    /* global __THREE_INSPECTOR_GLOBAL_HOOK__ INDEX RECIPIENT */
    this.executeInContext(
      function() {
        __THREE_INSPECTOR_GLOBAL_HOOK__.reportInspector(INDEX, RECIPIENT);
      }.toString(),
      {
        INDEX: index,
        RECIPIENT: recipient
      }
    );
  },
  disable() {
    this.executeInContext(
      function() {
        __THREE_INSPECTOR_GLOBAL_HOOK__.disable();
      }.toString()
    );
  },

  /**
   * Execute the javascript inside the context of the page.
   * @param {String} code
   */
  executeInContext(code, variables = {}) {
    for (const constant in variables) {
      const value = JSON.stringify(variables[constant]);
      code = code.replace(new RegExp(constant, "g"), value);
    }
    const script = document.createElement("script");
    script.textContent = ";(" + code + ")(window)";
    document.documentElement.appendChild(script);
    script.parentNode.removeChild(script);
  }
};

(function() {
  /* global DEBUG, UID, INSPECTOR_SCRIPT_URL */
  function injectedScript(window) {
    // Private
    const uid = UID;
    const debug = DEBUG;
    function respond(response, data, recipient) {
      debug && console.log("respond", { response, data, recipient });
      window.postMessage(
        Object.assign(
          {
            response,
            data,
            _threeInspector: uid
          },
          recipient
        ),
        "*"
      );
    }

    function broadcast(command, recipient, data) {
      debug && console.log("broadcast", { command, recipient, data });
      window.postMessage(
        {
          broadcast: command,
          filter: recipient,
          data,
          _threeInspector: uid
        },
        "*"
      );
    }

    let threePanelId = -1;
    function emit(command, data) {
      debug && console.log("emit", { command, data });
      window.postMessage(
        {
          command,
          to: threePanelId,
          data,
          _threeInspector: uid
        },
        "*"
      );
    }
    const _instances = [];
    let InspectorPromise = false;
    // Public
    window.__THREE_INSPECTOR_GLOBAL_HOOK__ = {
      inspectors: [],
      register(instance) {
        const exists = _instances.find(
          existing => existing.THREE === instance.THREE
        );
        if (exists) {
          if (instance.THREE) {
            exists.THREE = instance.THREE;
          }
          return;
        }
        const i = _instances.push(Object.assign({ status: "IDLE" }, instance));
        broadcast(
          "DETECTED",
          { channel: "devtools_page" },
          {
            index: i - 1,
            version: instance.THREE.REVISION
          }
        );
      },

      reportInstances(recipient) {
        this.reportDetection(window, recipient);
        const data = _instances.map(instance => ({
          version: instance.THREE.REVISION,
          status: instance.status
        }));
        respond("INSTANCES", data, recipient);
      },

      //检查页面中的three.js
      reportDetection(globals, recipient) {
        if (globals.THREE) {
          // global variable
          this.register({ THREE: globals.THREE });
        } else {
          for (let i = 0; i < globals.frames.length; i++) {
            try {
              this.reportDetection(globals.frames[i], recipient);
            } catch (err) {
              if (err.code === 18 && err.name === "SecurityError") {
                // DOMException: Blocked a frame with origin "..." from accessing a cross-origin frame.
                return;
              }
              if (debug) {
                console.warn(err);
              }
            }
          }
        }
      },

      reportInspector(index, recipient) {
        if (!_instances[index]) {
          respond("ERROR", "OUT_OF_BOUNDS", recipient);
          return;
        }
        threePanelId = recipient.to;
        if (_instances[index].status !== "IDLE") {
          respond("INSPECTOR", _instances[index].inspector, recipient);
          return;
        }
        _instances[index].status = "LOADING";
        this.injectInspector()
          .then(Inspector => {
            this.inspectors.push(new Inspector(_instances[index], emit));
            _instances[index].inspector = this.inspectors.length - 1;
            _instances[index].status = "INJECTED";
            respond("INSPECTOR", _instances[index].inspector, recipient);
          })
          .catch(error => {
            respond("ERROR", error.message, recipient);
          });
      },
      /**
       * @returns {Promise}
       * 注入调试器
       */
      injectInspector() {
        if (InspectorPromise) {
          return InspectorPromise;
        }
        InspectorPromise = new Promise(resolve => {
          const script = window.document.createElement("script");
          script.src = INSPECTOR_SCRIPT_URL;
          const html = document.getElementsByTagName("html")[0];
          script.onload = () => {
            resolve(this.Inspector);
          };
          html.appendChild(script);
        });
        return InspectorPromise;
      },

      disable() {
        for (const inspector of this.inspectors) {
          inspector.disable();
        }
      }
    };
  }

  const code = injectedScript.toString();
  globalHook.executeInContext(code, {
    UID: uid,
    DEBUG: debug,
    INSPECTOR_SCRIPT_URL: chrome.extension.getURL("three.inspector.bundle.js") //获取注入的js的url
  });
})();
//与扩展建立连接，name为连接的名称
const port = chrome.runtime.connect({ name: "content_scripts" });
port.onMessage.addListener(message => {
  debug && console.log("port.onMessage", message);
  switch (message.command) {
    case "DETECT":
      globalHook.reportDetection({ to: message.from, id: message.id });
      break;
    case "INSTANCES":
      globalHook.reportInstances({ to: message.from, id: message.id });
      break;
    case "INSPECTOR":
      globalHook.reportInspector(message.data, {
        to: message.from,
        id: message.id
      });
      break;
    case "DISCONNECTED":
      globalHook.disable();
      break;
  }
});

window.onmessage = function(event) {
  debug && console.log("window.onmessage", event);
  if (typeof event.data === "object" && event.data._threeInspector === uid) {
    delete event.data._threeInspector;
    debug && console.log("port.postMessage", event.data);
    port.postMessage(event.data);
    if (event.data.response === "DETECTED") {
      isDetected = true;
    }
  }
};
//监听链接关闭
port.onDisconnect.addListener(() => {
  debug && console.log("onDisconnect");
  // Extension was restarted
  window.onmessage = null;
});
window.onload = function() {
  globalHook.reportDetection(); //检测THREE 如果未检测到，每隔1s检测一次
  setTimeout(() => {
    if (!isDetected) {
      globalHook.reportDetection();
    }
  }, 1000);
};
