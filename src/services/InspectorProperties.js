export const blacklist = ["children", "parent"];
const $collapse = Symbol("collapsed");
export default class InspectorProperties {
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
        ...this.serialize(window.$three[property], [property], property, 1)
      );
    }
    return properties;
  }
  /* eslint-disable */
  set(path, value) {
    eval("$three." + path + " = " + JSON.stringify(value));
  }
  toggleDetailView(path) {
    if (window.$three) {
      const node = this.recurPath(window.$three, path.split("."));
      node[$collapse] = !node[$collapse];
    }
  }
  /**
   * 根据path递归节点的属性
   * @param {节点} node
   * @param {属性路径} path
   */
  recurPath(node, pathes) {
    if (pathes.length === 1) {
      return node[pathes[0]];
    }
    const path = pathes.shift();
    node = node[path];
    return this.recurPath(node, pathes);
  }
  serialize(value, path, name, indent) {
    const type = typeof value;
    const properties = [];
    const property = {
      path: path.join("."),
      type,
      name,
      indent,
      children: false
    };
    switch (type) {
      case "undefined": {
        property.value = "undefined";
        property.collapsed = false;
        break;
      }
      case "symbol": {
        property.value = value;
        property.collapsed = false;
        break;
      }
      case "function": {
        property.value = "f()";
        property.collapsed = false;
        break;
      }
      case "string": {
        property.value = `"${value}"`;
        break;
      }
      case "number":
      case "boolean": {
        property.value = value;
        property.collapsed = false;
        break;
      }
      case "object": {
        if (value === null) {
          property.value = "null";
          property.collapsed = false;
        } else if (Array.isArray(value)) {
          property.value = `Array[${value.length}]`;
          property.collapsed = true;
          property.children = true;
          //如果需要展开数组
          if (value[$collapse] === false) {
            property.collapsed = false;
            properties.push(property);
            for (const property in value) {
              properties.push(
                ...this.serialize(value[property], [...path, property], property, indent + 1)
              );
            }
            break;
          }
          property[$collapse] = true;
        } else {
          property.value = "Object";
          property.collapsed = true;
          property.children = true;
          //如果需要展开对象
          if (value[$collapse] === false) {
            property.collapsed = false;
            properties.push(property);
            for (const property in value) {
              properties.push(
                ...this.serialize(value[property], [...path, property], property, indent + 1)
              );
            }
            break;
          }
          property[$collapse] = true;
        }
        break;
      }
    }
    if (properties.length === 0) {
      properties.push(property);
    }
    return properties;
  }
}
