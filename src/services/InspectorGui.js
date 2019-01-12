import { Subject, ReplaySubject, fromEvent, merge, empty } from "rxjs";
import {
  map,
  distinctUntilChanged,
  shareReplay,
  withLatestFrom,
  tap,
  switchMap,
  debounceTime,
  combineLatest
} from "rxjs/operators";
import { parentElements, hideDom, showDom } from "../utils";
import Stats from "stats.js";
import OrbitControlsTool from "../aiders/OrbitControls";
export const overlay = {
  div: null,
  renderer: null,
  THREE: null,
  scene: null,
  camera: null,
  container: null
};
export default class InspectorGui {
  constructor(inspector) {
    this.stats = {
      ele: null,
      panel: 0,
      removeCallbackBefore: null,
      removeCallbackAfter: null
    };
    this.orbitControl = {
      ele: null,
      removeCallbackBefore: null,
      removeCallbackAfter: null
    };
    this.axes = {
      ele: null,
      removeCallbackAfter: null
    };
    this.inspector = inspector;
    //初始化调试需要的three场景
    if (!overlay.THREE) {
      this.initOverlay(inspector);
    }
    this.container = overlay.container;
    this.camera = overlay.camera;
    this.offset = {
      canvas: { x: 0, y: 0 },
      iframe: { x: 0, y: 0 }
    };
    this.size = {
      canvas: { width: 800, y: 600 },
      renderer: { width: 800, y: 600 }
    };

    inspector.registerHook(
      "beforeRender",
      this.updateRenderer.bind(this),
      5000
    );
    inspector.registerHook("beforeRender", this.render.bind(this));
    this.rightclick$ = new Subject();
    this.renderer$ = new ReplaySubject(1);

    const canvas$ = this.renderer$.pipe(
      map(renderer => renderer.domElement),
      distinctUntilChanged()
    );

    const iframe$ = canvas$.pipe(
      map(reference => {
        for (const canvas of document.querySelectorAll("canvas")) {
          if (canvas === reference) {
            return null; // canvas found in current frame
          }
        }
        for (const iframe of document.querySelectorAll("iframe")) {
          try {
            for (const canvas of iframe.contentDocument.querySelectorAll(
              "canvas"
            )) {
              if (canvas === reference) {
                return iframe;
              }
            }
          } catch (err) {
            // ignore cors errors
          }
        }
        return null;
      }),
      shareReplay(1)
    );

    const handleClick$ = canvas$.pipe(
      switchMap(canvas =>
        merge(
          fromEvent(canvas, "contextmenu").pipe(
            tap(event => {
              event.preventDefault();
            })
          ),
          fromEvent(canvas, "pointerdown", { capture: true }).pipe(
            withLatestFrom(iframe$, this.renderer$),
            tap(([event, iframe, renderer]) => {
              const mobSelectKey =
                event.pointerType === "touch" && event.altKey;
              //jQuery中对event增加了which属性 3代表鼠标右键
              if (event.which === 3 || mobSelectKey) {
                this.calculateOffset(canvas, iframe);
                const pixelRatio = renderer.getPixelRatio();
                const scale = {
                  x: this.resolution.x / pixelRatio,
                  y: this.resolution.y / pixelRatio
                };
                const x = (event.clientX - this.offset.canvas.x) * scale.x;
                const y = (event.clientY - this.offset.canvas.y) * scale.y;
                this.rightclick$.next({ x, y, event });
              }
            })
          )
        )
      )
    );

    const handleResize$ = fromEvent(window, "resize").pipe(
      debounceTime(100),
      tap(() => {
        overlay.renderer.setSize(window.innerWidth, window.innerHeight);
        overlay.renderer.domElement.style.width = window.innerWidth + "px";
        overlay.renderer.domElement.style.height = window.innerHeight + "px";
      }),
      switchMap(() =>
        iframe$.pipe(
          combineLatest(canvas$),
          tap(([iframe, canvas]) => {
            this.calculateOffset(canvas, iframe);
            this.updateCamera();
          })
        )
      )
    );

    const handleScroll$ = iframe$.pipe(
      combineLatest(canvas$),
      switchMap(([iframe, canvas]) => {
        const elements = [window]
          .concat(parentElements(iframe))
          .concat(parentElements(canvas));
        if (iframe) {
          elements.push(iframe.contentWindow);
        }
        return merge(
          ...elements.map(element => fromEvent(element, "scroll"))
        ).pipe(
          debounceTime(50),
          tap(() => {
            this.calculateOffset(canvas, iframe);
          })
        );
      })
    );

    this.subscription = inspector.enabled$
      .pipe(
        tap(() => {
          overlay.div.removeAttribute("style");
        }),
        switchMap(enabled => {
          if (enabled === false) {
            return empty();
          }
          return merge(
            handleResize$,
            handleScroll$,
            handleClick$,
            canvas$.pipe(
              combineLatest(iframe$),
              tap(([canvas, iframe]) => {
                this.calculateOffset(canvas, iframe);
              })
            )
          );
        })
      )
      .subscribe();
  }

  get resolution() {
    return {
      x: this.size.renderer.width / this.size.canvas.width,
      y: this.size.renderer.height / this.size.canvas.height
    };
  }

  /*eslint-disable class-methods-use-this */
  initOverlay(inspector) {
    overlay.THREE = inspector.instance.THREE;
    const THREE = overlay.THREE;
    overlay.div = document.createElement("div");
    overlay.div.id = "three-inspector-overlay";
    const style = document.createElement("style");
    style.textContent = `
      #three-inspector-overlay {
        position: fixed;
        z-index: 9999999999;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        overflow: hidden;
      }
      #three-inspector-overlay canvas {
        position: absolute;
        top: 0;
        left: 0;
      }
      `;
    overlay.div.appendChild(style);
    document.body.appendChild(overlay.div);
    const canvas = document.createElement("canvas");
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    overlay.div.appendChild(canvas);
    overlay.scene = new THREE.Scene();
    const renderOptions = {
      canvas,
      pixelRatio: window.devicePixelRatio,
      alpha: true,
      antialias: false,
      preserveDrawingBuffer: false,
      precision: "lowp",
      maxLights: 8,
      name: "three-inspector-renderer"
    };
    overlay.renderer = new THREE.WebGLRenderer(renderOptions);
    //create three camera and set position of camera
    const camera = new THREE.OrthographicCamera(
      -width / 2,
      width / 2,
      height / 2,
      -height / 2,
      0.1,
      1000
    );
    camera.position.set(0, 0, 500);
    // camera.lookAt(0, 0, 0);
    //兼容较低版本three.js，looAt方法应传入向量
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    overlay.camera = camera;
    //create three group
    overlay.container = new overlay.THREE.Group();
    overlay.scene.add(overlay.container);
  }

  render() {
    if (overlay.renderer) {
      const { scene, camera } = overlay;
      overlay.renderer.render(scene, camera);
    }
  }
  /* eslint */
  updateRenderer(container, camrea, renderer) {
    this.renderer = renderer;
    this.renderer$.next(renderer);
  }
  //计算canvas的位置和大小
  calculateOffset(canvas, iframe) {
    const bounds = canvas.getBoundingClientRect();
    this.offset.canvas.x = bounds.left;
    this.offset.canvas.y = bounds.top;
    this.size.canvas.width = bounds.width;
    this.size.canvas.height = bounds.height;
    this.size.renderer.width = this.renderer.width;
    this.size.renderer.height = this.renderer.height;

    if (iframe) {
      const iframeBounds = iframe.getBoundingClientRect();
      this.offset.iframe.x = iframeBounds.left;
      this.offset.iframe.y = iframeBounds.top;
    } else {
      this.offset.iframe.x = 0;
      this.offset.iframe.y = 0;
    }
    this.container.position.x = this.offset.iframe.x + this.offset.canvas.x;
    this.container.position.y = this.offset.iframe.y + this.offset.canvas.y;
  }
  //更新相机
  updateCamera() {
    const { camera } = this;
    camera.left = -window.innerWidth / 2;
    camera.right = window.innerWidth / 2;
    camera.top = window.innerHeight / 2;
    camera.bottom = -window.innerHeight / 2;
    camera.updateProjectionMatrix();
  }
  /**
   * 辅助功能
   * @param {Stirng} name 辅助功能的名称
   * @param {Boolean} status 是否开启
   * @param {Number} index 功能模式索引
   * @param {Object} extra 额外参数
   */
  aider(name, status = false, index = 0, extra = {}) {
    const _name = `${name}_${status}`;
    switch (_name) {
      case "StatsSwitch_true":
        this.setStatsPanel(index, extra);
        this.openStats();
        break;
      case "StatsSwitch_false":
        this.closeStats();
        break;
      case "OrbitControlSwitch_true":
        this.openOrbitControl(extra);
        break;
      case "OrbitControlSwitch_false":
        this.closeOrbitControl();
        break;
      case "AxesHelperSwitch_true":
        this.openAxesHelper(extra);
        break;
      case "AxesHelperSwitch_false":
        this.closeAxesHelper();
        break;
    }
  }
  //开启帧率显示
  openStats() {
    const { stats, inspector } = this;
    if (!stats.ele) {
      stats.ele = new Stats();
      const { ele } = stats;
      ele.dom.style.position = "absolute";
      ele.dom.style.top = "0px";
      ele.dom.style.left = "0px";
      overlay.div.appendChild(ele.dom);
    }
    stats.ele.showPanel(stats.panel);
    showDom(stats.ele.dom);
    if (stats.removeCallbackAfter) {
      return;
    }
    stats.removeCallbackBefore = inspector.registerHook("beforeRender", () => {
      stats.ele.begin();
    });
    stats.removeCallbackAfter = inspector.registerHook("afterRender", () => {
      stats.ele.end();
    });
  }
  //关闭帧率显示
  closeStats() {
    const { stats } = this;
    if (stats.ele) {
      const { ele } = stats;
      hideDom(ele.dom);
      if (stats.removeCallbackBefore) {
        stats.removeCallbackBefore();
        stats.removeCallbackBefore = null;
      }
      if (stats.removeCallbackAfter) {
        stats.removeCallbackAfter();
        stats.removeCallbackAfter = null;
      }
    }
  }
  //设置开启帧率的那个显示模式
  setStatsPanel(index) {
    this.stats.panel = index;
  }
  //打开轨道控制器
  openOrbitControl() {
    const { orbitControl, inspector } = this;
    if (!orbitControl.ele) {
      const OrbitControls = OrbitControlsTool(inspector.instance.THREE);
      orbitControl.removeCallbackAfter = inspector.registerHook(
        "afterRender",
        (container, camera) => {
          if (!orbitControl.ele) {
            orbitControl.ele = new OrbitControls(camera);
          }
          orbitControl.ele.update();
        }
      );
    } else {
      orbitControl.ele.enabled = true;
      orbitControl.removeCallbackAfter = inspector.registerHook(
        "afterRender",
        () => {
          orbitControl.ele.update();
        }
      );
    }
  }
  //关闭轨道控制器
  closeOrbitControl() {
    const { orbitControl } = this;
    if (orbitControl.ele) {
      orbitControl.ele.enabled = false;
      if (orbitControl.removeCallbackAfter) {
        orbitControl.removeCallbackAfter();
        orbitControl.removeCallbackAfter = null;
      }
    }
  }
  //开启坐标轴显示
  openAxesHelper(extra) {
    const { THREE } = this.inspector.instance;
    if (!THREE.AxesHelper) {
      /* eslint-disable */
      const { BufferGeometry, Float32BufferAttribute, LineBasicMaterial, LineSegments } = THREE;
      THREE.AxesHelper = function(size) {
        size = size || 1;
        var vertices = [
          0, 0, 0,	size, 0, 0,
          0, 0, 0,	0, size, 0,
          0, 0, 0,	0, 0, size
        ];
        var colors = [
          1, 0, 0, 1, 0.6, 0,
          0, 1, 0, 0.6, 1, 0,
          0, 0, 1, 0, 0.6, 1
        ];
        var geometry = new BufferGeometry();
        geometry.addAttribute("position", new Float32BufferAttribute(vertices, 3));
        geometry.addAttribute("color", new Float32BufferAttribute(colors, 3));

        var material = new LineBasicMaterial({vertexColors: 2});
        LineSegments.call(this, geometry, material);
      }
      THREE.AxesHelper.prototype = Object.create(LineSegments.prototype);
      THREE.AxesHelper.prototype.constructor = THREE.AxesHelper;
      this.openAxesHelper();
      /* eslint-enable */
    } else {
      const { axes, inspector } = this;
      const name = "$axesHelper";
      if (!axes.ele) {
        const axesHelper = new THREE.AxesHelper(extra.size);
        axesHelper.name = name;
        axes.ele = axesHelper;
        axes.removeCallbackAfter = inspector.registerHook(
          "afterRender",
          container => {
            if (container.getObjectByName && !container.getObjectByName(name)) {
              container.add(axesHelper);
            }
          }
        );
      } else {
        axes.removeCallbackAfter = inspector.registerHook(
          "afterRender",
          container => {
            if (typeof container.getObjectByName === "function") {
              const axesHelper = container.getObjectByName(name);
              if (axesHelper.size === extra.size) {
                axesHelper.size = extra.size;
              }
              if (axesHelper && !axesHelper.visible) {
                axesHelper.visible = true;
              }
            }
          }
        );
      }
    }
  }
  //关闭坐标显示
  closeAxesHelper() {
    const { axes } = this;
    if (axes.ele) {
      if (axes.removeCallbackAfter) {
        axes.removeCallbackAfter();
        axes.removeCallbackAfter = null;
        axes.ele.visible = false;
      }
    }
  }
}
