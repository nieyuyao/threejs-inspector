<template>
  <div class="stats-switch-component" :class="platformClass">
    <div class="stats-switch">
      <input type="checkbox" id="switch" @change="toggle($event.target.checked)" hidden>
      <label for="switch" class="switch-label"></label>
      <span class="switch-name">Stats</span>
    </div>
    <CustomRadioGroup
      ref="customRadioGroup"
      class="stats-custom-radios"
      :data="radios"
      :default-cheked="-1"
      :disabled="disabled"
      :inline-style="true"
      @radios-change="radiosChange"
    ></CustomRadioGroup>
  </div>
</template>
<script>
import getPlatForm from "../utils.js";
import connection from "../services/connection.js";
import CustomRadioGroup from "./CustomRadioGroup.vue";
export default {
  name: "StatsSwitch",
  components: {
    CustomRadioGroup
  },
  data() {
    return {
      radios: [
        {
          name: "stats",
          type: "FPS",
          value: 0
        },
        {
          name: "stats",
          type: "Ms",
          value: 1
        },
        {
          name: "stats",
          type: "Mb",
          value: 2
        }
      ],
      disabled: true
    };
  },
  methods: {
    toggle(checked) {
      this.disabled = !checked;
      !checked ? this.$refs.customRadioGroup.closeAll() : this.$refs.customRadioGroup.firstChoose(0);
      this.$emit("aider", this.$options.name, checked, 0);
    },
    radiosChange(value) {
      this.$emit("aider", this.$options.name, true, value);
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
.stats-switch-component {
  font-size: 12px;
  &.platform-mac {
    font-family: Menlo, monospace;
  }
  &.platform-windows {
    font-family: Consolas, "Lucida Console", "Courier New", monospace;
  }
}
.stats-switch {
  display: flex;
  justify-content: left;
  align-items: center;
  .switch-label {
    flex-shrink: 0;
    display: inline-block;
    margin-right: 6px;
    width: 15px;
    height: 15px;
    border: 1px solid #6e6e6e;
    border-radius: 4px;
    box-sizing: border-box;
    &:hover {
      box-shadow: 0 0 4px #666;
    }
  }
  .switch-name {
    color: #56aa7a;
  }
  input[type="checkbox"]:checked + .switch-label {
    border: none;
    border-radius: 0;
    @include bgicon("../asset/checkbox-checked.png");
    &:hover {
      box-shadow: none;
    }
  }
}
.stats-custom-radios {
  margin-left: 14px;
}
</style>


