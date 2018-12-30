import { ReplaySubject } from "rxjs";
import TypeDetection from "./TypeDetection";
import Outliner from "./InspectorOutliner";
import Properties from "./InspectorProperties";
import Gui from "./InspectorGui";
import Highlight from "./InspectorHighlight";
import runHooks from "./runHooks";

export default class Inspector {
  /**
   * 构造函数
   * @param {renderer实例} instance
   * @param {通信方法} emit
   */
  constructor(instance, emit) {
    //Renderer实例
    this.instance = instance;
    this.emit = emit;
    this.patched = null;
    this.hooks = {
      beforeRender: [],
      afterRender: []
    };
    this.enabled$ = new ReplaySubject(1);
    // Register types
    this.typeDetection = new TypeDetection();
    this.typeDetection.registerTypes(instance.THREE);
    // Register "plugins"
    this.gui = new Gui(this);
    this.outliner = new Outliner(this);
    this.properties = new Properties(this);
    this.highlight = new Highlight(this);
  }

  enable() {
    this.patch();
    this.enabled$.next(true);
  }

  disable() {
    if (!this.patched) {
      return;
    }
    this.instance.render = this.patched;
    this.patched = null;
    this.enabled$.next(false);
  }

  /**
   * Path the Renderer.render method to get a hold of the stage object(s)
   */
  patch() {
    const Renderer = this.instance;
    if (Renderer.render) {
      const renderMethod = Renderer.render;
      this.patched = renderMethod;
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
