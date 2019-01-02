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
    overlay.scene = new overlay.THREE.Scene();
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
    overlay.renderer = new overlay.THREE.WebGLRenderer(renderOptions);
    //create three camera and set position of camera
    const camera = new overlay.THREE.OrthographicCamera(
      -width / 2,
      width / 2,
      height / 2,
      -height / 2,
      0.1,
      1000
    );
    camera.position.set(0, 0, 500);
    camera.lookAt(0, 0, 0);
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
}

function parentElements(element) {
  if (element === null) {
    return [];
  }
  const elements = [];
  while (element.parentElement) {
    elements.push(element.parentElement);
    element = element.parentElement;
  }
  return elements;
}
