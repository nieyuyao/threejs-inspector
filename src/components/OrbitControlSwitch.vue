<template>
  <div class="orbit-control-component" :class="platformClass">
    <div class="orbit-control-switch">
      <input type="checkbox" id="orbit-control" @change="toggle($event.target.checked)" hidden>
      <label for="orbit-control" class="orbit-control-label"></label>
      <span class="orbit-control-name">Orbit Controls</span>
    </div>
    <!-- <CustomRadioGroup
      ref="customRadioGroup"
      class="orbit-control-custom-radios"
      :data="radios"
      :default-cheked="-1"
      :disabled="disabled"
      :inline-style="true"
      @radios-change="radiosChange"
    ></CustomRadioGroup> -->
  </div>
</template>
<script>
import getPlatForm from "../utils.js";
import connection from "../services/connection.js";
// import CustomRadioGroup from "./CustomRadioGroup.vue";
export default {
  name: "OrbitControlSwitch",
  components: {
    // CustomRadioGroup
  },
  data() {
    return {
      radios: [],
      disabled: true
    };
  },
  methods: {
    toggle(checked) {
      this.$emit("aider", this.$options.name, checked);
    }
  },
  computed: {
    platformClass() {
      return "platform-" + getPlatForm();
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
.orbit-control-component {
  font-size: 12px;
  &.platform-mac {
    font-family: Menlo, monospace;
  }
  &.platform-windows {
    font-family: Consolas, "Lucida Console", "Courier New", monospace;
  }
}
.orbit-control-switch {
  display: flex;
  justify-content: left;
  align-items: center;
  .orbit-control-label {
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
  .orbit-control-name {
    color: #56aa7a;
  }
  input[type="checkbox"]:checked + .orbit-control-label {
    border: none;
    border-radius: 0;
    @include bgicon("../asset/checkbox-checked.png");
    &:hover {
      box-shadow: none;
    }
  }
}
.orbit-control-custom-radios {
  margin-left: 14px;
}
</style>


