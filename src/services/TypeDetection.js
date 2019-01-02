import typesConfig from "../configs/registerTypesConfig";
export default class TypeDetection {
  constructor() {
    this.constructors = [];
    this.names = [];
  }
  /**
   * 检查节点的类型
   * @param {node} node Three.js中的物体
   */
  detectType(node) {
    //如果节点没有构造函数
    if (!node.constructor) {
      return "Unknown";
    }
    const index = this.constructors.indexOf(node.constructor);
    if (index === -1) {
      return this.resolveType(node);
    }
    return this.names[index];
  }
  /**
   * 解析节点类型
   * @param {String} name 构造函数名称
   * @param {node} node
   */
  resolveType(node) {
    const { constructors, names } = this;
    for (const i in constructors) {
      if (node instanceof constructors[i]) {
        return names[i];
      }
      const prototypeConstructor = constructors[i].prototype.constructor;
      const j = constructors.indexOf(prototypeConstructor);
      if (node instanceof prototypeConstructor && j > -1) {
        return names[j];
      }
    }
    return "";
  }
  registerTypes(object) {
    for (const prop in object) {
      if (typeof object[prop] === "function" && isRegisterType(prop)) {
        this.constructors.push(object[prop]);
        this.names.push(prop);
      }
    }
  }
}
function isRegisterType(prop) {
  for (const rule of typesConfig.rules) {
    if (rule.test.test(prop)) {
      return true;
    }
  }
  return false;
}
