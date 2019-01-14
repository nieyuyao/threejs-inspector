<template>
  <div class="target-component">
    <div :class="{'target-btn': true, 'target-choosen': choosen}" @click="toggle">
		</div>
  </div>
</template>

<script>
import latestInspector$ from "../services/latestInspector$";
import { map } from 'rxjs/operators';
export default {
	name: "Target",
	data() {
		return {
			choosen: false
		}
	},
	subscriptions() {
		return {
			toggle: latestInspector$.pipe(
				map(inspector => () => {
					this.choosen = !this.choosen;
					inspector.aider(this.$options.name, this.choosen);
				})
			)
		}
	}
};
</script>

<style lang="scss">
@import "./common.scss";
.target-component {
	.target-btn {
		width: 16px;
		height: 16px;
		@include bgicon("../asset/no-target.png");
		&.target-choosen {
			@include bgicon("../asset/target.png");
		}
	}
}
</style>

