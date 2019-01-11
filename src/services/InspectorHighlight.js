import { overlay } from "./InspectorGui";

export default class InspectorHighlight {
  constructor(inspector) {
    this.gui = inspector.gui;
    this.inspector = inspector;
    const THREE = overlay.THREE;
    const plane = new THREE.PlaneBufferGeometry(100, 100);
    const material = new THREE.MeshBasicMaterial({
      color: 0x007eff,
      transparent: true,
      opacity: 0.6
    });
    this.cube = new THREE.Mesh(plane, material);
    this.cube.width = 100;
    this.cube.height = 100;
    this.gui.container.add(this.cube);
    const pointsGeometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([0, 0, -0.8]);
    const scales = new Float32Array([2.0]);
    pointsGeometry.addAttribute(
      "position",
      new THREE.BufferAttribute(vertices, 3)
    );
    pointsGeometry.addAttribute("scale", new THREE.BufferAttribute(scales, 1));
    const pointsMaterial = new THREE.PointsMaterial({
      size: 5,
      color: 0x007eff,
      opacity: 1
    });
    const points = new THREE.Points(pointsGeometry, pointsMaterial);
    this.points = points;
    this.gui.container.add(this.points);
    inspector.registerHook("afterRender", this.update.bind(this));
  }

  update(container, camera) {
    const { cube, points, gui, inspector } = this;
    const node = InspectorHighlight.node;
    if (node && node.parent) {
      cube.visible = true;
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
        const cubePos = centerNdcPos.unproject(gui.camera);
        cube.position.set(cubePos.x, cubePos.y, cubePos.z);
        const distance = rangeBoxPos.distanceTo(cubePos);
        cube.scale.set(
          (2 * distance) / cube.width,
          (2 * distance) / cube.height,
          1
        );
        //更新宽高
        const cameraPos = gui.camera.position;
        points.position.set(
          cubePos.x + cameraPos.x / 3,
          cubePos.y + cameraPos.y / 3,
          cubePos.z + cameraPos.z / 3
        );
      }
    } else {
      cube.visible = false;
      points.visible = false;
    }
  }
}

InspectorHighlight.node = false;
