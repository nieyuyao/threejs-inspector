const isMac = (function() {
  return /macintosh|mac os x/i.test(navigator.userAgent);
})();

const isWindows = (function() {
  return /windows|win32/i.test(navigator.userAgent);
})();

export default function getPlatForm() {
  if (isMac) {
    return "mac";
  }
  if (isWindows) {
    return "windows";
  }
  return "";
}
export function parentElements(element) {
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
export function hideDom(dom) {
  dom.style.display = "none";
}
export function showDom(dom, display = "block") {
  dom.style.display = display;
}
export function isSupportPassive() {
  let passiveSupported = false;
  try {
    const options = Object.defineProperty({}, "passive", {
      get() {
        passiveSupported = true;
        return passiveSupported;
      }
    });
    window.addEventListener("test", null, options);
  } catch (err) {
    /* eslint-disable no-console */
    console.error(err);
    /* eslint-enable no-console */
  }
  return passiveSupported;
}
export function debounce(bounceTime = 100, fn) {
  let start = 0;
  return function(...args) {
    const end = +new Date();
    if (end - start >= bounceTime) {
      fn(...args);
      start = end;
    }
  };
}

export function threePolyFill(THREE) {
  if (THREE) {
    return;
  }
  (function(THREE) {
    const { Material, Color } = THREE;
    if (!Material || !Color) {
      return;
    }
    /**
     * @author mrdoob / http://mrdoob.com/
     * @author alteredq / http://alteredqualia.com/
     */
    function PointsMaterial(parameters) {
      Material.call(this);

      this.type = "PointsMaterial";

      this.color = new Color(0xffffff);

      this.map = null;

      this.size = 1;
      this.sizeAttenuation = true;

      this.lights = false;

      this.setValues(parameters);
    }

    PointsMaterial.prototype = Object.create(Material.prototype);
    PointsMaterial.prototype.constructor = PointsMaterial;

    PointsMaterial.prototype.isPointsMaterial = true;

    PointsMaterial.prototype.copy = function(source) {
      Material.prototype.copy.call(this, source);

      this.color.copy(source.color);

      this.map = source.map;

      this.size = source.size;
      this.sizeAttenuation = source.sizeAttenuation;

      return this;
    };

    THREE.PointsMaterial = PointsMaterial;
  })(THREE);
}
