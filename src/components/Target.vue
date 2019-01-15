<template>
  <div class="target-component">
    <div :class="{'target-btn': true, 'target-choosen': choosen}" @click="toggle"></div>
  </div>
</template>

<script>
import latestInspector$ from "../services/latestInspector$";
import { map, filter } from "rxjs/operators";
let holdChoosen = false;
export default {
  name: "Target",
  data() {
    return {
      choosen: holdChoosen
    };
  },
  subscriptions() {
    return {
      toggle: latestInspector$.pipe(
        filter(inspector => inspector !== null),
        map(inspector => () => {
					this.choosen = !this.choosen;
					holdChoosen = this.choosen;
          inspector.aider(this.$options.name, this.choosen);
        })
      )
    };
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

