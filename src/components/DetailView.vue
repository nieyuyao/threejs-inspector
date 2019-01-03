<template>
  <div class="detailview" :class="platformClass">
    <div 
      v-for="field in fields" 
      :key="field.path"
      class="detailview-item">
      <div class="detailview-label" @click="toggleDetailView(field)">
        <span class="detailview-indent" :style="{width: field.indent * 6 + 'px'}"></span>
        <span class="detailview-toggle">
          <span :class="['toggle-collapse', !field.collapsed ? 'toggle-expand': '']" v-if="field.children"></span>
        </span>
        <span>{{ field.name }}</span>
      </div>
      <DetailValue 
        :field="field" 
        @change="setProperty(field.path, $event)"
      />
    </div>
  </div>
</template>

<script>
import { empty, interval } from "rxjs";
import { switchMap, merge } from "rxjs/operators";
import DetailValue from "./DetailValue.vue";
import latestInspector$ from "../services/latestInspector$.js";
import getPlatForm from "../utils.js"
const POLL_INTERVAL = 500;
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
      toggleDetailView: latestInspector$.method("toggleDetailView"),
      platformClass: "platform-" + getPlatForm()
    };
  }
};
</script>

<style lang="scss">
.detailview {
  padding: 4px 4px 4px 2px;
  &.platform-mac {
		font-family: Menlo, monospace;
	}
	&.platform-windows {
		font-family: Consolas, "Lucida Console", "Courier New", monospace;
	}
}
.detailview-item {
  display: flex;
  justify-content: left;
  margin-bottom: 2px;
}
.detailview-label {
  display: inline-block;
  padding-right: 4px;
  color: #56aa7a;
  font-size: 0;
  span  {
    font-size: 12px;
  }
  .detailview-indent {
    display: inline-block;
  }
  .detailview-toggle {
    position: relative;
    display: inline-block;
    width: 8px;
    height: 8px;
  }
  .toggle-collapse {
    position: absolute;
    top: 0px;
    left: 0px;
    border: 4px solid transparent;
    border-left-width: 6px;
    border-left-color: #6e6e6e;
    .dark-mode & {
      border-left-color: #bdc6cf;
    }
    &.toggle-expand {
      border: 4px solid transparent;
      border-top-width: 6px;
      border-top-color: #6e6e6e;
    }
  }
  &:after {
    content: ":";
    font-size: 12px;
    color: #000;
  }
  .dark-mode & {
    color: #35d4c7;
  }
}
</style>
