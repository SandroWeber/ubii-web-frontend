<template>
    <div>
        <div class="side-bar-item-top" v-on:click="collapse" v-bind:id="'item-'+title">
            <span class="icon" v-bind:class="{ rotated: rotated }">

            <font-awesome-icon
                icon="chevron-up"
                size="xs"
             /></span>
            {{title}}
            <b-badge v-if="this.$props.content != null" class="badge" variant="primary">{{this.$props.content.length}}</b-badge>
        </div>
        <b-collapse visible :id="title" class="collapseable-content"><slot></slot></b-collapse>
        <b-tooltip v-bind:target="'item-'+title" placement="right">{{desc}}</b-tooltip>
    </div>
</template>

<script>
  import Vue from 'vue'
  import BootstrapVue from 'bootstrap-vue'
  import 'bootstrap/dist/css/bootstrap.css'
  import 'bootstrap-vue/dist/bootstrap-vue.css'
  import { BCollapse, BTooltip, BBadge } from 'bootstrap-vue'

  import { library } from '@fortawesome/fontawesome-svg-core'
  import { faChevronUp } from '@fortawesome/free-solid-svg-icons'
  library.add(faChevronUp);

  Vue.use(BootstrapVue);

  export default {
    name: 'SideBarItem',
    components : {
      'b-collapse': BCollapse,
      'b-tooltip': BTooltip,
      'b-badge': BBadge
    },
    props: {
      title: String,
      desc: String,
      content: Array
    },
    data: function(){
      return {
        rotated: false,
      }
    },
    methods: {
      collapse: function() {
        this.rotated = !this.rotated;
        this.$root.$emit('bv::toggle::collapse', this.$props.title)
      }
    }
  };
</script>

<style scoped>
    .side-bar-item-top {
        cursor: pointer;
        padding: 0.5em 1em 0.5em 1em;
        background-color: #939293;
        padding-left: 50px;
        position: relative;
        display: flex;
        align-items: center;
    }

    .side-bar-item-top:hover {
        background-color: #B6B5B5;
    }

    .collapseable-content {
        padding: 0;
    }

    .icon {
        position: absolute;
        left: 18px;
        transition: transform 0.3s ease-in-out;
    }

    .rotated {
        transform: rotate(180deg);
    }

    .badge {
        margin-left: 15px;
    }
</style>