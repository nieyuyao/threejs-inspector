<template>
  <div class="axes-helper-component" :class="platformClass">
    <div class="axes-helper-switch">
      <input type="checkbox" id="axes-helper" @change="toggle($event.target.checked)" hidden>
      <label for="axes-helper" class="axes-helper-label"></label>
      <span class="axes-helper-name">Axes Helper</span>
    </div>
    <!-- <div class="size-input-wrapper">
      size: 
      <input type="number" v-model.number.lazy="size" min="0">
    </div> -->
  </div>
</template>
<script>
import getPlatForm from "../utils.js";
import connection from "../services/connection.js";
export default {
  name: "AxesHelperSwitch",
  data() {
    return {
      // size: 2000,
      checked: false
    }
  },
  computed: {
    platformClass() {
      return "platform-" + getPlatForm();
    }
  },
  watch: {
    // size(newVal, oldVal) {
    //   if (oldVal !== newVal && this.checked) {
    //     this.$emit("aider", this.$options.name, true, 0, {
    //       size: newVal
    //     });
    //   }
    // }
  },
  methods: {
    toggle(checked) {
      this.checked = checked;
      this.$emit("aider", this.$options.name, checked, 0, {
        size: 2000
      });
    }
  }
};
</script>
<style scoped lang="scss">
@import "./common.scss";
%common {
  padding: 2px;
  background-color: #6e6e6e;
  background-clip: content-box;
}
.axes-helper-component {
  font-size: 12px;
  &.platform-mac {
    font-family: Menlo, monospace;
  }
  &.platform-windows {
    font-family: Consolas, "Lucida Console", "Courier New", monospace;
  }
}
.axes-helper-switch {
  display: flex;
  justify-content: left;
  align-items: center;
  .axes-helper-label {
    flex-shrink: 0;
    display: inline-block;
    margin-right: 6px;
    width: 13px;
    height: 13px;
    border: 1px solid #6e6e6e;
    border-radius: 4px;
    box-sizing: border-box;
    &:hover {
      box-shadow: 0 0 4px #666;
    }
  }
  .axes-helper-name {
    position: relative;
    color: #56aa7a;
    &:hover::after {
      content: "开启坐标轴显示";
      display: inline-block;
      position: absolute;
      left: 100%;
      padding: 0 4px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 700;
      white-space: nowrap;
      color: #fff;
      background-color: #f59a1f;
    }
  }
  input[type="checkbox"]:checked + .axes-helper-label {
    border: none;
    border-radius: 0;
    @include bgicon("../asset/checkbox-checked.png");
    &:hover {
      box-shadow: none;
    }
  }
}
.size-input-wrapper {
    margin: 6px 0 6px 20px;
    > input {
      width: 120px;
      border: 1px solid #64b587;
      border-radius: 2px;
      outline: none;
    }
  }
</style>


