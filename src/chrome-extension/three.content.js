/* eslint-disable no-console */
/* global crypto */
const debug = true;

const uid = crypto.getRandomValues(new Uint16Array(3)).join("-");
let isDetected = false;
if (debug) {
  console.info("three.content", uid);
}

const globalHook = {
  reportDetection() {
    /* global __THREE_INSPECTOR_GLOBAL_HOOK__ RECIPIENT */
    this.executeInContext(
      function() {
        __THREE_INSPECTOR_GLOBAL_HOOK__.reportDetection(window);
      }.toString()
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
  reportInspector(indexs, recipient) {
    /* global __THREE_INSPECTOR_GLOBAL_HOOK__ INDEX RECIPIENT */
    this.executeInContext(
      function() {
        __THREE_INSPECTOR_GLOBAL_HOOK__.reportInspector(INDEX, RECIPIENT);
      }.toString(),
      {
        INDEX: indexs,
        RECIPIENT: recipient
      }
    );
  },
  //如果devtools进入后台
  reportBackStage() {
    this.executeInContext(
      function() {
        __THREE_INSPECTOR_GLOBAL_HOOK__.reportBackStage();
      }.toString()
    );
  },
  //如果devtools进入后台
  reportFrontStage() {
    this.executeInContext(
      function() {
        __THREE_INSPECTOR_GLOBAL_HOOK__.reportFrontStage();
      }.toString()
    );
  },
  //如果devtools进入后台
  reportDisconnnect() {
    this.executeInContext(
      function() {
        __THREE_INSPECTOR_GLOBAL_HOOK__.reportDisconnnect();
      }.toString()
    );
  },
  disable() {
    this.executeInContext(
      function() {
        __THREE_INSPECTOR_GLOBAL_HOOK__.disable();
      }.toString()
    );
  },
  // registerStats() {
  //   this.executeInContext(
  //     function() {
  //       __THREE_INSPECTOR_GLOBAL_HOOK__.registerStats();
  //     }.toString()
  //   );
  // },
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
          filter: recipient, //通过filer标志发出的消息
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
      inspectors: {},
      inspecting: "",
      register() {
        //广播DETECTED
        broadcast("DETECTED", { channel: "devtools_page" });
      },
      reportInstances(recipient) {
        const data = _instances.map(instance => ({
          version: instance.THREE.REVISION,
          id: instance.id,
          rendererList: instance.THREE.$$RendererList.map(renderer => ({
            name: renderer.constructor.name,
            status: "IDLE"
          }))
        }));
        respond("INSTANCES", data, recipient);
      },
      //检查页面中的three.js
      reportDetection(globals) {
        _instances.splice(0, _instances.length);
        this.dectectInstance(globals);
        if (_instances.length > 0) {
          this.register();
        }
      },
      dectectInstance(globals) {
        if (globals.THREE && globals.THREE.$$RendererList) {
          //捕获到的THREE实例放到_instances中
          _instances.push({
            THREE: globals.THREE,
            id: _instances.length
          });
        }
        for (let i = 0; i < globals.frames.length; i++) {
          try {
            this.reportDetection(globals.frames[i]);
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
      },
      reportInspector(indexs, recipient) {
        const { threeIndex, rendererIndex } = indexs;
        const threeInstance = _instances[threeIndex];
        if (!threeInstance) {
          respond("ERROR", "THREE_INSTANCE_NOT_EXIT", recipient);
        }
        const rendererInstance =
          threeInstance.THREE.$$RendererList[rendererIndex];
        if (!rendererInstance) {
          respond("ERROR", "THREE_RENDERER_NOT_EXIT", recipient);
        }
        threePanelId = recipient.to;
        const sign = `$${threeIndex}$${rendererIndex}`;
        this.inspecting = sign;
        if (this.inspector && this.inspecting !== sign) {
          this.inspectors[this.inspecting].status = "IDLE";
        }
        if (rendererInstance.status && rendererInstance.status !== "IDLE") {
          respond("INSPECTOR", sign, recipient);
          return;
        }
        rendererInstance.status = "LOADING";
        this.injectInspector()
          .then(Inspector => {
            rendererInstance.THREE = threeInstance.THREE;
            rendererInstance.inspector = sign;
            this.inspectors[sign] = new Inspector(rendererInstance, emit);
            rendererInstance.status = "INJECTED";
            if (window.$three) {
              window.$three = null;
            }
            respond("INSPECTOR", sign, recipient);
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
          const script = document.createElement("script");
          script.src = INSPECTOR_SCRIPT_URL;
          const html = document.getElementsByTagName("html")[0];
          script.onload = () => {
            resolve(this.Inspector);
          };
          html.appendChild(script);
        });
        return InspectorPromise;
      },
      reportBackStage() {
        if (this.inspecting) {
          this.inspectors[this.inspecting].disable();
        }
      },
      reportFrontStage() {
        if (this.inspecting) {
          this.inspectors[this.inspecting].enable();
        }
      },
      reportDisconnnect() {
        emit("DISCONNECT");
      },
      disable() {
        Object.values(this.inspectors).forEach(inspector => {
          inspector.disable();
        });
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
    case "BACKSTAGE":
      globalHook.reportBackStage();
      break;
    case "FRONTSTAGE":
      globalHook.reportFrontStage();
      break;
    case "DISCONNECTED":
      globalHook.disable();
      break;
    // case "STATS_OPEN":
    //   globalHook.registerStats();
    //   break;
    // case "STATS_CLOSE":
    //   globalHook.abortStats();
    //   break;
  }
});

window.onmessage = function(event) {
  debug && console.log("window.onmessage", event);
  if (typeof event.data === "object" && event.data._threeInspector === uid) {
    delete event.data._threeInspector;
    debug && console.log("port.postMessage", event.data);
    port.postMessage(event.data);
    if (event.data.broadcast === "DETECTED") {
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
//监听页面卸载事件
window.onbeforeunload = function() {
  globalHook.reportDisconnnect();
};
