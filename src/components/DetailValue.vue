<template>
  <div>
    <span 
      v-if="field.type === 'number' || field.type === 'string'" 
      class="detailvalue-input" 
      contenteditable="true" 
      @focus="onFocus"
      @blur="onBlur"
      @keydown="keydown"
      v-html="fieldValue">
    </span>
    <label
      v-else-if="field.type === 'boolean'"
      class="detailvalue-label">
      <input 
        v-model="field.value" 
        type="checkbox" 
        @change="toggle()"
      >
      {{ field.value }}
    </label>
    <span v-else :style="{'font-style': field.type === 'function' ? 'italic' : 'normal'}">{{ field.value }}</span>
  </div>
</template>

<script>
export default {
  name: "DetailValue",
  props: {
    field: { type: Object, required: true }
  },
  data: () => ({
    isEdit: false,
    fieldValue: undefined
  }),
  watch: {
    field(newField) {
      this.field = newField;
      if (!this.isEdit) {
        this.fieldValue = this.field.value;
      }
    }
  },
  methods: {
    onFocus() {
      this.isEdit = true;
      if (this.isEdit && this.fieldValue === undefined) {
        this.fieldValue = this.field.value;
      }
    },
    onBlur(e) {
      const oldValue = this.fieldValue;
      this.fieldValue = e.target.innerText;
      this.isEdit = false;
      if (oldValue !== this.fieldValue) {
        this.sentNewValue(this.fieldValue);
      }
    },
    toggle() {
      this.sentNewValue(this.field.value);
    },
    keydown(e) {
      if (e.key === "Enter") {
        e.preventDefault();
        this.sentNewValue(e.target.innerText);
      } else if (this.field.type !== "number") {
        return;
      }
      let value = parseFloat(e.target.innerText, 10);
      let update = false;
      let size = 1;
      if (e.altKey) {
        size = 0.1;
      } else if (e.shiftKey) {
        size = 10;
      }
      switch (e.key) {
        case "ArrowUp":
          update = !isNaN(value);
          value += size;
          break;
        case "ArrowDown":
          update = !isNaN(value);
          value -= size;
          break;
      }
      if (update) {
        e.target.innerText = value;
        this.sentNewValue(value);
      }
    },
    sentNewValue(value) {
      let newValue;
      const isNumber = parseFloat(value, 10);
      const isNullOrNaN =
        typeof value === "string"
          ? value.match(/^(\\null|\\NaN|\\undefined)$/)
          : false;
      if (!isNaN(isNumber)) {
        // is number
        newValue = isNumber;
      } else if (isNullOrNaN) {
        // is null or NaN or undefined sent not like string
        switch (value) {
          case "\\null":
            newValue = null;
            break;
          case "\\NaN":
            newValue = NaN;
            break;
          case "\\undefined":
            newValue = undefined;
            break;
        }
      } else {
        // is just string
        newValue = value;
      }
      this.fieldValue = newValue;
      this.$emit("change", newValue);
    }
  }
};
</script>

<style lang="scss">
.detailvalue-input {
  display: block;
  min-width: 50px;
  border: none;
  box-sizing: border-box;
}
.detailvalue-label {
  position: relative;
  padding-left: 12px;
}
.detailvalue-label input {
  position: absolute;
  top: -2px;
  left: -6px;
}
</style>
