<template>
    <div class="list-item"
         :class="{ selected: selected, normal: normal }"
         @click.exact="select()">

        <font-awesome-icon
                icon="info-circle"
                class="icon"
                v-if="list_item == 1"
        />
        <font-awesome-icon
                icon="list-alt"
                class="icon"
                v-if="list_item == 2"
        />
        <slot></slot>
    </div>
</template>

<script>
  import { library } from '@fortawesome/fontawesome-svg-core'
  import { faInfoCircle, faListAlt } from '@fortawesome/free-solid-svg-icons'
  library.add(faInfoCircle, faListAlt);

  export default {
    name: 'ListItem',
    props: {
      id: {
        required: true
      },
      selected: {
        type: Boolean,
        required: true
      },
      normal: {
        type: Boolean
      },
      list_item: {
        type: Number
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
    .list-item {
        background-color: #2D2A2E;
        padding: 0.5em 1em 0.5em 1em;
        display: flex;
        align-items: center;
    }

    .normal:hover {
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