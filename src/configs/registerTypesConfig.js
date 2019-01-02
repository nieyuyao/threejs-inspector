/**
 * 需要注册的节点类型
 */
export default {
  rules: [
    {
      test: /Geometry$/
    },
    {
      test: /Mesh$/
    },
    {
      test: /Material$/
    },
    {
      test: /Camera$/
    },
    {
      test: /Light$/
    },
    {
      test: /(Skeleton|Points|Sprite|Group|Scene)/
    }
  ]
};
