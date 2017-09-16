<template>
  <div>
    <h1>TestComponent</h1>
    <input type="number" v-model.number="input1"/>
    <input type="button" v-on:click="loadData" value="Load data..." />
    <ul>
      <li v-for="item in test">{{ item.key }}: {{ item.value }}</li>
    </ul>
    <vue-simple-spinner v-if="displaySpinner" size="normal" message="Loading..."></vue-simple-spinner>

  </div>
</template>

<script>
  export default {
    name: 'test',
    data () {
      return {
        input1: 1,
        test: null,
        displaySpinner: true
      }
    },
    mounted: function () {
      console.log('Loading data!')
      this.loadData()
    },
    beforeRouteLeave (to, from, next) {
      if (this.input1 === 2) {
        console.log('Cannot leave with 2')
        next(false)
      } else {
        next()
      }
    },
    methods: {
      loadData: function () {
        this.test = null

        // Start displaying ajax spinner before fetching data
        this.displaySpinner = true

        this.fetchData().then((data) => {
          console.log('hiding spinner')
          this.test = data
          this.displaySpinner = false
        }, () => {
          console.log('FAILED')
          this.displaySpinner = false
        })
      },
      fetchData: function () {
        return new Promise((resolve, reject) => {
          if (this.input1 === 0) {
            reject()
          } else {
            console.log('Loaded via promise, this takes ' + this.input1 + ' seconds')
            setTimeout(function () {
              console.log('Got data')
              resolve(
                  [{'key': '1', 'value': 'een'}, {'key': '12', 'value': 'twaalf'}, {'key': '3', 'value': 'drie'}]
              )
            }, this.input1 * 1000)  // "resolve" is already a function, no need for another anonymous function here
          }
        })
      }

    }
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  h1, h2 {
    font-weight: bold;
  }
</style>
