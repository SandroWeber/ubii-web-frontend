<template>
    <div class="side-bar-item"
         :class="{ selected: selected }"
         @click.exact="select()">

        <font-awesome-icon
                icon="info-circle"
                class="icon"
        />
      {{label}}
    </div>
</template>

<script>
  import { library } from '@fortawesome/fontawesome-svg-core'
  import { faInfoCircle } from '@fortawesome/free-solid-svg-icons'
  library.add(faInfoCircle);

  export default {
    name: 'SideBarItem',
    props: {
      id: {
        type: Number,
        required: true
      },
      label: {
        type: String,
        required: true
      },
      selected: {
        type: Boolean,
        required: true
      }
    },
    methods: {
      select: function() {
        this.$emit('select');
      },
    }
  };
</script>

<style scoped>
    .side-bar-item {
        background-color: #2D2A2E;
        padding: 0.5em 1em 0.5em 1em;
        display: flex;
        align-items: center;
    }

    .side-bar-item:hover {
        background-color: #403E41;
        cursor: pointer;
    }

    .icon {
        margin-right: 0.5em;
    }

    .selected {
        color: #DDD866;
    }
</style>