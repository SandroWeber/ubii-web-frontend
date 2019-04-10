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
        <div class="edit-entry-row">
          <span class="key">
            Name:
          </span>
          <app-input 
            class="value"
            v-model="interfaceName"
          />
        </div>
        <div class="edit-entry-row">
          <span class="key">
            Message Format:
          </span>
          <app-input 
            class="value"
            v-model="interfaceMessageFormat"
          />
        </div>
        <div class="edit-entry-row">
          <a
            class="delete-link"
            @click="removeEntry"
          > 
            delete
          </a>
        </div>



      </div>
    </app-token>

  </div>
</template>

<script>
import { AppButton, AppToken, AppInput} from './../../appComponents/appComponents.js';

  export default { 
    name: 'InteractionMirrorInterfaceListToken',
    components: {
      AppButton: AppButton,
      AppToken: AppToken,
      AppInput: AppInput,
    },
    props: {
      value: Object,
      interfaceKey: String,
      code: String,
      editMode: Boolean,
      index: Number
    },
    methods:{
      removeEntry: function(){
        this.$emit('removeInterfaceEntry', this.index);
      }
    },
    computed: {
      localValue: {
        get() {
            return this.value
        },
        set(localValue) {
            this.$emit('input', localValue)
        }
      },
      isUnused: function(){
        return (this.code.includes(this.interfaceKey+"."+this.value.internalName) !== true);
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
            return this.localValue.internalName;
        },
        set(value) {
            this.localValue.internalName = value;
        }
      },
      interfaceMessageFormat: {
        get() {
            return this.localValue.messageFormat;
        },
        set(value) {
            this.localValue.messageFormat = value;
        }
      },
    }
  } 
</script> 

<style scoped lang="stylus"> 
  .interaction-mirror-interface-list-token
    order 1
    margin 5px

  .edit-entry-row
    display: flex
    flex-direction: row
    width: 30em
    margin: 0.5em

  .key
    width: 10em
    flex-grow: 0

  .value
    flex-grow: 1

  .tool-button
    height: 1.5em
    width: 1.5em

  .delete-link
    cursor pointer
    text-decoration underline
    &:hover
      color: lowContrastColor
</style>
