<template>
  <div :disabled="isDisabled">
    <b-form-input id="input-node-id" list="input-list-node-ids" v-model="nodeId"></b-form-input>
    <datalist id="input-list-node-ids">
      <option v-for="nodeIdItem in this.nodeIds" :key="nodeIdItem">{{ nodeIdItem }}</option>
    </datalist>
  </div>
</template>

<script>
import { BFormInput } from 'bootstrap-vue';
import { UbiiClientService } from '@tum-far/ubii-node-webbrowser';
import { DEFAULT_TOPICS, proto } from '@tum-far/ubii-msg-formats';
const CLIENT_STATE = proto.ubii.clients.Client.State;
export default {
  name: 'InputNodeId',
  components: {
    BFormInput
  },
  props: {
    value: {
      type: String,
      default: 'unset',
      required: true
    },
    isDisabled: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  data: () => {
    return {
      ubiiConnected: false,
      nodeIds: []
    };
  },
  mounted: async function() {
    UbiiClientService.instance.on(UbiiClientService.EVENTS.CONNECT, () => {
      this.onUbiiConnectionChange(true);
    });
    UbiiClientService.instance.on(UbiiClientService.EVENTS.DISCONNECT, () => {
      this.onUbiiConnectionChange(false);
    });
    await UbiiClientService.instance.waitForConnection();
    this.onUbiiConnectionChange(UbiiClientService.instance.isConnected());
  },
  beforeDestroy: function() {
    this.intervalUpdateNodeIds && clearInterval(this.intervalUpdateNodeIds);
  },
  methods: {
    onUbiiConnectionChange: function(connected) {
      if (connected === this.ubiiConnected) return;
      this.ubiiConnected = connected;
      if (connected) {
        this.intervalUpdateNodeIds = setInterval(this.updateNodeIDs, 1000);
        this.nodeId = UbiiClientService.instance.client.serverSpecification.id;
      } else {
        this.nodeId = 'unset';
        this.intervalUpdateNodeIds && clearInterval(this.intervalUpdateNodeIds);
      }
    },
    updateNodeIDs: async function() {
      let eligibleNodeIds = [];
      eligibleNodeIds.push(UbiiClientService.instance.client.serverSpecification.id);
      let clientListResponse = await UbiiClientService.instance.callService({
        topic: DEFAULT_TOPICS.SERVICES.CLIENT_GET_LIST
      });
      if (clientListResponse.clientList) {
        eligibleNodeIds.push(
          ...clientListResponse.clientList.elements
            .filter(client => client.state === CLIENT_STATE.ACTIVE)
            .map(client => client.id)
        );
      }
      this.nodeIds = eligibleNodeIds;
    }
  },
  computed: {
    nodeId: {
      get() {
        return this.value;
      },
      set(nodeId) {
        this.$emit('input', nodeId);
      }
    }
  }
};
</script>

<style scoped></style>