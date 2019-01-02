<template>
  <div class="renderers-panel" :class="platformClass">
    <div class="title">Inspector THREE List</div>
    <div class="three-item" v-for="three in threes" :key="three.id">
      <div class="three-detail">
        <span>THREE Instance</span>
				<div class="version">
					<label>version</label>
					{{three.version}}
				</div>
      </div>
      <div class="renderer-item" v-for="(renderer, k) in three.rendererList" :key="k">
				<div class="status">
					<label>status</label>
					{{renderer.status}}
				</div>
        <input type="radio" :id="'radio-' + k" @change="change(`${three.id}.${k}`, renderer)" :checked="isChecked(`${three.id}.${k}`)" hidden>
        <label :for="'radio-' + k" class="radio-label"></label>
				<span class="renderer-name">{{'Renderer [' + renderer.name + ']'}}</span>
      </div>
    </div>
  </div>
</template>
<script>
import { tap, map } from "rxjs/operators";
import { renderer$ } from "../services/latestInspector$";
import getPlatForm from "../utils.js";
let inspecting = "";
export default {
	name: "Threes",
  subscriptions() {
    return {
      threes: renderer$.pipe(
      	map(frame => frame.data),
				tap(data => {
					if (inspecting) {
						const indexs = inspecting.split(".");
						const threeIndex = indexs[0] || 0;
						const rendererIndex = indexs[1] || 0;
						data[threeIndex] ? data[threeIndex].rendererList[rendererIndex].status = "INJECTED..." : void 0;
					}
				}),
			)
    };
	},
	computed: {
		platformClass() {
			return "platform-" + getPlatForm();
		}
	},
	methods: {
		change(query, renderer) {
			renderer$.select(query);
			inspecting = query;
			renderer.status = "INJECTED...";
		},
		isChecked(query) {
			if (query === inspecting) {
				return true;
			}
			return false;
		}
	}
};
</script>
<style lang="scss" scoped>
$color: #56aa7a;
%common {
	padding: 2px;
	background-color: $color;
	background-clip: content-box;
}
.renderers-panel {
	height: 100%;
	padding-left: 10px;
  border-right: 1px solid #dadada;
  box-sizing: border-box;
  overflow-x: scroll;
	overflow-y: hidden;
	&.platform-mac {
		font-family: Menlo, monospace;
	}
	&.platform-windows {
		font-family: Consolas, "Lucida Console", "Courier New", monospace;
	}
}
.title {
	margin: 10px 0;
	font-size: 12px;
	font-weight: 200;
	color: $color;
}
.three-item {
	font-size: 12px;
	font-weight: 200;
	color: $color;
	.three-detail {
		margin: 10px 0;
		> div {
			margin: 6px 0;
			label {
				height: 12px;
				padding: 0px 4px;
				border-radius: 4px;
				color: #fff;
				background-color: #dadada;
			}
		}
	}
	.renderer-item {
		margin: 10px 0;
		> div {
			margin: 6px 0;
		}
		.status > label {
			height: 12px;
			padding: 0px 4px;
			border-radius: 4px;
			color: #fff;
			background-color: #dadada;
		}
		.radio-label {
			display: inline-block;
			width: 14px;
			height: 14px;
			margin: 0 6px 0 0;
			border: 1px solid $color;
			vertical-align: middle;
			border-radius: 50%;
			box-sizing: border-box;
			&:hover {
				@extend %common;
				box-shadow: 0 0 4px $color;
			}
		}
		.renderer-name {
			vertical-align: middle;
		}
	}
	input[type="radio"]:checked+.radio-label {
		@extend %common;
	}
}
</style>