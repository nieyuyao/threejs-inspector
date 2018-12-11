export const blacklist = ["children", "parent"];
export const whitelist = ["translate", "position", "scale", "rotation"];
class MismatchConstructor {}

export default class InspectorProperties {
  constructor(inspector) {
    const THREE = inspector.instance.THREE;
    this.TransformBaseRef =
      typeof THREE.TransformBase === "function"
        ? THREE.TransformBase
        : MismatchConstructor;
    this.ObservablePointRef =
      typeof THREE.ObservablePoint === "function"
        ? THREE.ObservablePoint
        : MismatchConstructor;
  }

  all() {
    if (!window.$three) {
      return [];
    }
    const properties = [];
    for (const property in window.$three) {
      if (property[0] === "_" || blacklist.indexOf(property) !== -1) {
        continue;
      }
      properties.push(
        ...this.serialize(window.$three[property], [property], 3)
      );
    }
    properties.sort((a, b) => (a.path > b.path ? 1 : -1));
    return properties;
  }
  /* eslint-disable */
  set(path, value) {
    eval("$three." + path + " = " + JSON.stringify(value));
  }
  /* eslint-enable */

  serialize(value, path, depth) {
    depth--;
    if (depth < 0) {
      return [];
    }
    const type = typeof value;
    if (type === "undefined" || type === "function") {
      return [];
    } else if (
      type === "string" ||
      type === "number" ||
      type === "boolean" ||
      value === null
    ) {
      return [{ path: path.join("."), type, value }];
    } else if (type === "object") {
      if (value === null) {
        return [{ path: path.join("."), type, value }];
      }
      if (Array.isArray(value)) {
        return [{ path: path.join("."), type: "Array" }];
      }
      if (whitelist.indexOf(path[path.length - 1]) !== -1) {
        const properties = [];
        for (const property in value) {
          if (blacklist.indexOf(property) !== -1) {
            continue;
          }
          if (property[0] === "_") {
            continue;
          }
          properties.push(
            ...this.serialize(value[property], [...path, property], depth)
          );
        }
        if (properties.length !== 0) {
          return properties;
        }
      }
      // (typeof value.constructor ? (value.constructor.name || type) : type
      return [{ path: path.join("."), type: "Object" }];
    }
    return [
      {
        path: path.join("."),
        type:
          typeof value.constructor !== "undefined"
            ? value.constructor.name || type
            : type
      }
    ];
  }
}
