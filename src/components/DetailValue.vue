<template>
  <div>
    <!-- 数字或者字符串类型 -->
    <div 
      v-if="field.type === 'number' || field.type === 'string'" 
      :class="['detailvalue-input', feildClass(field.type)]"
      contenteditable="true" 
      @focus="onFocus"
      @blur="onBlur"
      @keydown="keydown"
      v-html="fieldValue">
    </div>
    <!-- 布尔值类型 -->
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
    <!-- 其他类型 -->
    <span v-else :class="['field-other-types', feildClass(field.type)]">{{ field.value }}</span>
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
    },
    feildClass(val) {
      return "type-" + val;
    }
  }
};
</script>

<style lang="scss">
.colon {
  color: #313941;
}
.detailvalue-input {
  display: block;
  min-width: 50px;
  border: none;
  box-sizing: border-box;
  &.type-string {
    color: #b42e24;
  }
  &.type-number {
    color: #1027a3;
  }
}
.detailvalue-label {
  position: relative;
  padding-left: 12px;
  color: #1027a3;
}
.detailvalue-label input {
  position: absolute;
  top: -2px;
  left: -6px;
}
.field-other-types {
  &.type-function {
    font-style: italic;
    // color: #9d278c;
    color: #1027a3;
  }
  &.type-object {
    color: #313941;
  }
}
</style>
