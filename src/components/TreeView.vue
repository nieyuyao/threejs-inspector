<template>
  <div 
    class="treeview"
    :class="platformClass" 
    tabindex="1" 
    @keydown.right.prevent="navigateRight" 
    @keydown.left.prevent="navigateLeft" 
    @keydown.up.prevent="navigateUp" 
    @keydown.down.prevent="navigateDown">
    <div 
      v-for="row in rows" 
      :key="row.node.id" 
      :data-id="row.node.id" 
      :class="{'treeview-item-selected': selected && row.node.id === selected.id, 'treeview-item-found': row.node.found}" 
      class="treeview-item" 
      @mousedown="select(row.node)" 
      @mouseenter="highlight(row.node)"
      @dblclick="toggle(row.node)" 
      @mouseleave="highlight(false)">
      <div 
        :style="{width: (row.indent * 14) + 'px'}"
        class="treeview-indent" />
      <div class="treeview-toggle">
        <div 
          v-if="row.node.children && row.node.collapsed" 
          class="treeview-toggle-expand"
          @click="expand(row.node)"/>
        <div 
          v-if="row.node.children && !row.node.collapsed" 
          class="treeview-toggle-collapse" 
          @click="collapse(row.node)"/>
      </div>
      <div class="treeview-label" >{{ row.title }}</div>
    </div>
  </div>
</template>

<script>
import { filter, map, switchMap } from "rxjs/operators";
import latestInspector$ from "../services/latestInspector$";
import getPlatForm from "../utils.js"
export default {
  subscriptions() {
    const inspector$ = latestInspector$.pipe(
      filter(inspector => inspector !== null)
    );
    return {
      selected: inspector$.pipe(switchMap(inspector => inspector.selected$)),
      rows: inspector$.pipe(
        switchMap(inspector => inspector.tree$),
        map(this.flattenTree)
      ),
      select: latestInspector$.method("select"),
      expand: latestInspector$.method("expand"),
      toggle: latestInspector$.method("toggle"),
      collapse: latestInspector$.method("collapse"),
      highlight: latestInspector$.method("highlight"),
      platformClass: "platform-" + getPlatForm()
    };
  },
  methods: {
    flattenTree(tree) {
      const rows = [];
      if (Array.isArray(tree.children)) {
        for (const node of tree.children) {
          this.flattenNode(node, rows, 0);
        }
      }
      return rows;
    },
    flattenNode(node, rows, indent) {
      let title = node.type;
      if (
        typeof node.name !== "undefined" &&
        node.name !== null &&
        node.name !== ""
      ) {
        title = node.type + " [" + node.name + "]";
      }
      rows.push({ indent, node, title });
      indent++;
      if (!node.collapsed && node.children) {
        for (const subnode of node.children) {
          this.flattenNode(subnode, rows, indent);
        }
      }
    },
    navigateUp() {
      const index = this.findRowIndex(this.selected.id);
      if (index > 0) {
        this.select(this.rows[index - 1].node);
      }
    },
    navigateRight() {
      const index = this.findRowIndex(this.selected.id);
      const row = this.rows[index];
      if (row.node.collapsed) {
        this.expand(row.node);
      } else if (index < this.rows.length - 1) {
        this.select(this.rows[index + 1].node);
      }
    },

    navigateDown() {
      const index = this.findRowIndex(this.selected.id);
      if (index < this.rows.length - 1) {
        this.select(this.rows[index + 1].node);
      }
    },
    navigateLeft() {
      const index = this.findRowIndex(this.selected.id);
      const row = this.rows[index];
      if (!row.node.collapsed) {
        this.collapse(row.node);
      } else if (index > 0) {
        const parentIndex = this.findRowIndex(row.node.parent);
        this.select(this.rows[parentIndex].node);
      }
    },
    findRowIndex(id) {
      for (const i in this.rows) {
        if (this.rows[i].node.id === id) {
          return parseInt(i);
        }
      }
      return -1;
    }
  }
};
</script>

<style lang="scss">
.treeview {
  padding: 4px 0;
  &.platform-mac {
		font-family: Menlo, monospace;
	}
	&.platform-windows {
		font-family: Consolas, "Lucida Console", "Courier New", monospace;
	}
}

.treeview-item {
  position: relative;
  color: #5ba47a;
  padding: 1px;
  display: flex;
  user-select: none;
  .dark-mode & {
    color: #5db0d7;
  }
}

.treeview-toggle {
  position: relative;
  width: 12px;
  height: 12px;
}

.treeview-toggle-expand {
  border: 4px solid transparent;
  border-left-color: #6e6e6e;
  border-left-width: 6px;
  position: absolute;
  top: 2px;
  left: 4px;
  .dark-mode & {
    border-left-color: #bdc6cf;
  }
}

.treeview-toggle-collapse {
  border: 4px solid transparent;
  border-top-color: #6e6e6e;
  border-top-width: 6px;
  position: absolute;
  top: 3px;
  left: 2px;
  .dark-mode & {
    border-top-color: #bdc6cf;
  }
}

.treeview-item--hovered,
.treeview-item:hover:not(.treeview-item-selected) {
  &:before {
    content: "";
    position: absolute;
    z-index: -1;
    top: 0;
    left: 4px;
    right: 4px;
    bottom: 0;
    border-radius: 4px;
    background: #eaf1fb;
    .dark-mode & {
      background: #342e25;
    }
  }
}

.treeview-item-selected {
  background: #d4d4d4;
  .dark-mode.dark-mode & {
    background: #342e25;
  }
}

.treeview-item-found {
  &:after {
    content: "";
    position: absolute;
    z-index: -1;
    top: 0;
    left: 4px;
    right: 4px;
    bottom: 0;
    background: #ffff0070;
  }
}

.treeview:focus {
  outline: none;

  .treeview-item-selected {
    background: #3879d9;
    color: white;
    .dark-mode & {
      background: #c58532;
      color: #333;
    }

    .treeview-toggle-collapse {
      border-top-color: white;
      .dark-mode & {
        border-top-color: #333;
      }
    }
    .treeview-toggle-expand {
      border-left-color: white;
      .dark-mode & {
        border-left-color: #333;
      }
    }
  }
}
</style>
