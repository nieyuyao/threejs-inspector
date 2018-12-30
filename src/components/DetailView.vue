<template>
  <div class="detailview" :class="platformClass">
    <div 
      v-for="field in fields" 
      :key="field.path"
      class="detailview-item">
      <div class="detailview-label">{{ field.path }}</div>
      <DetailValue 
        :field="field" 
        @change="setProperty(field.path, $event)"/>
    </div>
  </div>
</template>

<script>
import { empty, interval } from "rxjs";
import { switchMap, merge } from "rxjs/operators";
import DetailValue from "./DetailValue.vue";
import latestInspector$ from "../services/latestInspector$.js";
import getPlatForm from "../utils.js"
const POLL_INTERVAL = 567; // Weird interval to be sure to be out of sync with a looping animation.

export default {
  components: { DetailValue },

  subscriptions() {
    return {
      fields: latestInspector$.pipe(
        switchMap(inspector => {
          if (inspector === null) {
            return empty();
          }
          return interval(POLL_INTERVAL).pipe(
            merge(inspector.selected$),
            switchMap(() => inspector.call("properties.all"))
          );
        })
      ),
      setProperty: latestInspector$.method("setProperty"),
      platformClass: "platform-" + getPlatForm()
    };
  }
};
</script>

<style lang="scss">
.detailview {
  padding: 4px;
  &.platform-mac {
		font-family: Menlo, monospace;
	}
	&.platform-windows {
		font-family: Consolas, "Lucida Console", "Courier New", monospace;
	}
}

.detailview-item {
  display: flex;
  margin-bottom: 2px;
}

.detailview-label {
  display: inline-block;
  color: #5ba47a;
  padding-right: 5px;
  &:after {
    content: ":";
    color: #000;
  }
  .dark-mode & {
    color: #35d4c7;
  }
}
</style>
