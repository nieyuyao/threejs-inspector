<template>
    <div class="status-component" :class="platformClass">
        <input type="checkbox" id="switch" @change="toggle($event.target.checked)" hidden>
        <label for="switch" class="switch-label"></label>
        <span class="switch-name">Stats</span>
    </div>
</template>
<script>
import getPlatForm from "../utils.js";
import connection from "../services/connection.js";
export default {
    name: "StatsSwitch",
    methods: {
      toggle(checked) {
				this.$emit("aider", this.$options.name, checked);
      }
    },
    computed: {
			platformClass() {
				return "platform-" + getPlatForm();
		}
	},
}
</script>
<style scoped lang="scss">
%common {
	padding: 2px;
	background-color: #6e6e6e;
	background-clip: content-box;
}
.status-component {
	font-size: 12px;
	&.platform-mac {
		font-family: Menlo, monospace;
	}
	&.platform-windows {
		font-family: Consolas, "Lucida Console", "Courier New", monospace;
	}
}
.switch-label {
	display: inline-block;
	width: 14px;
	height: 14px;
	border: 1px solid #6e6e6e;
	border-radius: 50%;
	vertical-align: middle;
	box-sizing: border-box;
	&:hover {
		@extend %common;
		box-shadow: 0 0 4px #6666;
	}
}
.switch-name {
	color: #56aa7a;
	vertical-align: middle;
}
input[type="checkbox"]:checked + .switch-label {
	@extend %common;
}
</style>


