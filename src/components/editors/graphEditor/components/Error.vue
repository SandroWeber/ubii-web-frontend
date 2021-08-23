<template>
<div/>
</template>

<script>
  export default {
    props: ['alert', 'msg'],
    methods: {
      showToast() {
        // Use a shorter name for this.$createElement
        const h = this.$createElement
        // Create the message
        const vNodesMsg = h(
          'p',
          { class: ['text-center', 'mb-0'] },
          [
            h('b-spinner', { props: { type: 'grow', small: true } }),
            ` ${this.msg} `
          ]
        )
        // Create the title
        const vNodesTitle = h(
          'div',
          { class: ['d-flex', 'flex-grow-1', 'align-items-baseline', 'mr-2'] },
          [
            h('strong', { class: 'mr-2' }, 'An Error occurred.')
          ]
        )
        // Pass the VNodes as an array for message and title
        this.$bvToast.toast([vNodesMsg], {
          title: [vNodesTitle],
          toaster: 'b-toaster-top-center',
          solid: true,
          variant: 'danger'
        })
      }
    },
    watch: { 
        alert: function() {
            this.showToast()
        }
    }
 }
</script>