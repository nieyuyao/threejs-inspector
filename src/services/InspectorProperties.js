export const blacklist = ["children", "parent"];

export default class InspectorProperties {
  constructor() {
  }

  all() {
    if (!window.$three) {
      return [];
    }
    const properties = [];
    for (const property in window.$three) {
      if (blacklist.indexOf(property) !== -1) {
        continue;
      }
      properties.push(
        ...this.serialize(window.$three[property], [property], property)
      );
    }
    return properties;
  }
  /* eslint-disable */
  set(path, value) {
    eval("$three." + path + " = " + JSON.stringify(value));
  }
  /* eslint-enable */
  serialize(value, path, name) {
    const type = typeof value;
    const property = [];
    switch (type) {
      case "undefined": {
        property.push({
          path: path.join("."),
          type,
          name,
          value: "undefined",
          collapsed: false,
          indent: 1
        });
        break;
      }
      case "symbol": {
        property.push({
          path: path.join("."),
          type,
          name,
          value,
          expandable: false,
          collapsed: false,
          indent: 1
        });
        break;
      }
      case "function": {
        property.push({
          path: path.join("."),
          name,
          type,
          value: "function",
          expandable: false,
          collapsed: false,
          indent: 1
        });
        break;
      }
      case "string":
      case "number":
      case "boolean": {
        property.push({
          path: path.join("."),
          type,
          name,
          value: value === "" ? "\"\"" : value,
          expandable: false,
          collapsed: false,
          indent: 1
        });
        break;
      }
      case "object": {
        if (value === null) {
          property.push({
            path: path.join("."),
            type,
            name,
            value,
            expandable: false,
            collapsed: false,
            indent: 1
          });
        } else if (Array.isArray(value)) {
          property.push({
            path: path.join("."),
            type,
            name,
            value: `Array[${value.length}]`,
            expandable: true,
            collapsed: true,
            indent: 1
          });
        } else {
          property.push({
            path: path.join("."),
            type,
            name,
            value: "Object",
            expandable: true,
            collapsed: true,
            indent: 1
          });
        }
        break;
      }
    }
    return property;
  }
}
