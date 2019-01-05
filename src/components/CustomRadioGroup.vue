<template>
  <div :class="['custom-radios', inlineStyle ? 'custom-radios-inline' : '']">
    <div v-for="(item, k) in data" :key="k" class="radio-item">
      <input type="radio" :value="item.value" :name="item.name" :id="'radio-' + (k + 1)" v-model="radio" :disabled="disabled" hidden>
      <label :for="'radio-' + (k + 1)" class="radio-label"></label>
      <span class="radio-name">{{item.type}}</span>
    </div>
  </div>
</template>
<script>
export default {
  name: "CustomRadioGroup",
  data() {
    return {
      radio: this.defaultCheked
    }
  },
  props: {
    data: {
      type: Array,
      default: function() {
        return [];
      }
    },
    defaultCheked: {
      type: Number,
      default: 0
    },
    inlineStyle: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  watch: {
    radio(val) {
      this.$emit("radios-change", val);
    }
  },
  methods: {
    closeAll() {
      this.radio = -1;
    },
    firstChoose(index) {
      this.radio = index;
    }
  }
};
</script>
<style lang="scss">
@import "./common.scss";
.custom-radios {
  margin: 6px 0;
  > div {
    margin: 0 6px;
  }
  .radio-item {
    display: flex;
    justify-content: left;
    align-items: center;
  }
  .radio-label {
    flex-shrink: 0;
    width: 12px;
    height: 12px;
    margin: 0 6px 0 0;
    border: 1px solid #56aa7a;
    border-radius: 6px;
    box-sizing: border-box;
    &:hover {
      box-shadow: 0 0 4px #56aa7a;
    }
  }
  &.custom-radios-inline {
    display: flex;
    justify-items: center;
    align-items: center;
  }
}
input[type="radio"]:checked + .radio-label {
  border: none;
  border-radius: 0;
  @include bgicon("../asset/radio-checked.png");
  &:hover {
    box-shadow: none;
  }
}
</style>


