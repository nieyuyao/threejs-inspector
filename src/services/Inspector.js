import { ReplaySubject } from "rxjs";
import TypeDetection from "./TypeDetection";
import Outliner from "./InspectorOutliner";
import Properties from "./InspectorProperties";
import Gui from "./InspectorGui";
import Highlight from "./InspectorHighlight";
import runHooks from "./runHooks";

export default class Inspector {
  constructor(instance, emit) {
    //three实例
    this.instance = instance;
    //通信方法
    this.emit = emit;
    this.unpatched = {};
    this.hooks = {
      beforeRender: [],
      afterRender: []
    };
    this.enabled$ = new ReplaySubject(1);

    // Register types
    this.typeDetection = new TypeDetection();
    this.typeDetection.registerTypes("THREE.", instance.THREE, 2);
    window.console = console;

    // Register "plugins"
    this.gui = new Gui(this);
    this.outliner = new Outliner(this);
    this.properties = new Properties(this);
    this.highlight = new Highlight(this);
  }

  enable() {
    if (!this.unpatched.TargetRender) {
      this.patch("TargetRender");
    }
    this.enabled$.next(true);
  }

  disable() {
    for (const [renderer, renderMethod] of Object.entries(this.unpatched)) {
      this.instance.THREE[renderer].render = renderMethod;
    }
    this.unpatched = {};
    this.enabled$.next(false);
  }

  /**
   * Path the Renderer.render method to get a hold of the stage object(s)
   */
  patch(target) {
    if (this.unpatched[target]) {
      /* eslint-disable no-console */
      console.warn(target + " already patched");
      /* eslint-enable */
      return;
    }
    const Renderer = this.instance.THREE[target];
    if (Renderer && Renderer.render) {
      const renderMethod = Renderer.render;
      this.unpatched[target] = renderMethod;
      const self = this;
      Renderer.render = function(container, camera, ...args) {
        runHooks(self.hooks.beforeRender, container, camera, this);
        const result = renderMethod.apply(this, [container, camera, ...args]);
        runHooks(self.hooks.afterRender, container, camera, this);
        return result;
      };
    }
  }

  /**
   * @param {string} type 'beforeRender', 'afterRender'
   * @param {Function} callback
   * @param {number} ms
   * @return {Function} unregister
   */
  registerHook(type, callback, ms = 0) {
    const hook = {
      callback,
      throttle: ms,
      skip: false
    };
    this.hooks[type].push(hook);
    return () => {
      const index = this.hooks[type].indexOf(hook);
      if (index !== -1) {
        this.hooks[type].splice(index, 1);
      }
    };
  }
}
