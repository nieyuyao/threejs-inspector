import { overlay } from "./InspectorGui";

export default class InspectorHighlight {
  constructor(inspector) {
    this.gui = inspector.gui;
    this.inspector = inspector;
    const plane = new overlay.THREE.PlaneBufferGeometry(100, 100);
    const material = new overlay.THREE.MeshBasicMaterial({
      color: 0x007eff,
      transparent: true,
      opacity: 0.6
    });
    this.box = new overlay.THREE.Mesh(plane, material);
    this.box.width = 100;
    this.box.height = 100;
    this.gui.container.add(this.box);
    const pointsGeometry = new overlay.THREE.BufferGeometry();
    const vertices = new Float32Array([0, 0, -0.8]);
    const scales = new Float32Array([1.0]);
    pointsGeometry.addAttribute(
      "position",
      new overlay.THREE.BufferAttribute(vertices, 3)
    );
    pointsGeometry.addAttribute(
      "scale",
      new overlay.THREE.BufferAttribute(scales, 1)
    );
    const pointsMaterial = new overlay.THREE.PointsMaterial({
      size: 5,
      color: 0x007eff,
      opacity: 1
    });
    const points = new overlay.THREE.Points(pointsGeometry, pointsMaterial);
    this.points = points;
    this.gui.container.add(this.points);
    inspector.registerHook("afterRender", this.update.bind(this));
  }

  update(container, camera) {
    const { box, points, gui, inspector } = this;
    const node = InspectorHighlight.node;
    if (node && node.parent) {
      box.visible = true;
      points.visible = true;
      const { geometry } = node;
      //
      const centerPos = node.position.clone(); //node位置
      const rangePos = node.position.clone(); //node上边缘位置
      //
      const centerNdcPos = centerPos.project(camera); //node的ndc位置
      centerNdcPos.z = 0;
      if (geometry && geometry.computeBoundingSphere) {
        geometry.computeBoundingSphere();
        const maxScale = Math.max.apply(this, [
          node.scale.x,
          node.scale.y,
          node.scale.z
        ]);
        const radius = geometry.boundingSphere.radius * maxScale;
        const up = camera.up.clone();
        rangePos.add(up.multiplyScalar(radius));
        const rangeNdcPos = rangePos.project(camera);
        rangeNdcPos.z = 0;
        //
        let size;
        if (inspector.instance && inspector.instance.THREE) {
          size = inspector.instance.getSize();
        } else {
          size = {
            width: window.innerWidth,
            height: window.innerHeight
          };
        }
        //
        const sw = size.width;
        const sh = size.height;
        const ww = window.innerWidth;
        const wh = window.innerHeight;
        //
        centerNdcPos.x = (((1 + centerNdcPos.x) * sw) / 2 - ww / 2) / (ww / 2);
        centerNdcPos.y = (wh / 2 - ((1 - centerNdcPos.y) * sh) / 2) / (wh / 2);
        //
        rangeNdcPos.x = (((1 + rangeNdcPos.x) * sw) / 2 - ww / 2) / (ww / 2);
        rangeNdcPos.y = (wh / 2 - ((1 - rangeNdcPos.y) * sh) / 2) / (wh / 2);
        //
        const rangeBoxPos = rangeNdcPos.unproject(gui.camera);
        const boxPos = centerNdcPos.unproject(gui.camera);
        box.position.set(boxPos.x, boxPos.y, boxPos.z);
        const distance = rangeBoxPos.distanceTo(boxPos);
        box.scale.set(
          (2 * distance) / box.width,
          (2 * distance) / box.height,
          1
        );
        //更新宽高
        const cameraPos = gui.camera.position;
        points.position.set(
          boxPos.x + cameraPos.x / 3,
          boxPos.y + cameraPos.y / 3,
          boxPos.z + cameraPos.z / 3
        );
      }
    } else {
      box.visible = false;
      points.visible = false;
    }
  }
}

InspectorHighlight.node = false;
