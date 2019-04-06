<template>
  <div
    class="interaction-mirror-interface-list-token"
  >
    <app-token
      :class="computedClassList"
      :text="tokenText"
      :useFixedCornerRadius="editMode"
    >
      <div
        v-if="editMode"
      >
        <div class="key-value-pair">
          <span class="key">
            Name:
          </span>
          <app-input 
            class="value"
            v-model="interfaceName"
          />
        </div>
        <div class="key-value-pair">
          <span class="key">
            Message Format:
          </span>
          <app-input 
            class="value"
            v-model="interfaceMessageFormat"
          />
        </div>
      </div>
    </app-token>

  </div>
</template>

<script>
import { AppToken, AppInput} from './../../appComponents/appComponents.js';

  export default { 
    name: 'InteractionMirrorInterfaceListToken',
    components: {
      AppToken: AppToken,
      AppInput: AppInput
    },
    props: {
      interface: Object,
      interfaceKey: String,
      code: String,
      editMode: Boolean,
    },
    computed: {
      isUnused: function(){
        return (this.code.includes(this.interfaceKey+"."+this.interface.internalName) !== true);
      },
      computedClassList: function(){
        return {
          "orange-accent": !this.editMode && this.isUnused
        }
      },
      tokenText: function(){
        if(this.editMode){
          return "";
        }else{
          return this.interfaceName;
        }
      },
      interfaceName: {
        get() {
            return this.interface.internalName;
        },
        set(value) {
            this.interface.internalName = value;

            //this.$emit('input', this.interaction);
        }
      },
      interfaceMessageFormat: {
        get() {
            return this.interface.messageFormat;
        },
        set(value) {
            this.interface.messageFormat = value;

            //this.$emit('input', this.interaction);
        }
      },
    }
  } 
</script> 

<style scoped lang="stylus"> 
  .interaction-mirror-interface-list-token
    order 1
    margin 5px

  .key-value-pair
    display: flex
    flex-direction: row
    width: 30em
    margin: 0.5em

  .key
    width: 10em
    flex-grow: 0

  .value
    flex-grow: 1
</style>
