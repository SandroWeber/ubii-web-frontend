<template>
  <div :id="cardId" style="padding: 0.5em 0.5em 0.5em">
    <b-card tag="article" bg-variant="dark" text-variant="white">
      <b-card-text style="font-size: small">
        {{ name }}
      </b-card-text>
      <!-- <div id="test" style="width:300px;height:200px;"/> -->
      <div :id="id" />
      <b-card-text style="font-size: small">
        {{ type }}
      </b-card-text>
    </b-card>
  </div>
</template>

<script>
// import Plotly from 'plotly.js-dist-min'
export default {
  props: {
    name: {
      type: String,
    },
    type: {
      type: String,
    },
  },
  data() {
    return {
      cardId: null,
      id: null,
      canvas: null,
      ctx: null,
    };
  },
  beforeMount() {
    this.cardId = "card-" + this._uid;
    this.id = "el-" + this._uid;
  },
  mounted() {
    // const types = ['double', 'bool', 'string', 'ubii.dataStructure.Vector2', 'ubii.dataStructure.Vector3', 'ubii.dataStructure.Vector4',
    //                 'ubii.dataStructure.Quaternion', 'ubii.dataStructure.Matrix3x2', 'ubii.dataStructure.Matrix4x4', 'ubii.dataStructure.Color',
    //                 'ubii.dataStructure.TouchEvent', 'ubii.dataStructure.TouchEventList', 'ubii.dataStructure.KeyEvent', 'ubii.dataStructure.MouseEvent',
    //                 'ubii.dataStructure.MyoEvent', 'ubii.dataStructure.Pose2D', 'ubii.dataStructure.Pose3D', 'ubii.dataStructure.Object2D',
    //                 'ubii.dataStructure.Object3D', 'ubii.dataStructure.Object2DList', 'ubii.dataStructure.Object3DList', 'int32',
    //                 'float', 'ubii.dataStructure.Int32List', 'ubii.dataStructure.FloatList', 'ubii.dataStructure.DoubleList', 'ubii.dataStructure.StringList',
    //                 'ubii.dataStructure.BoolList', 'ubii.dataStructure.Image2D', 'ubii.dataStructure.Image2DList', 'ubii.sessions.Session', 'ubii.processing.ProcessingModuleList']

    this.$nextTick(async () => {
      if (this.type == "double") {
        // console.log('double')
      } else if (this.type == "bool") {
        await this.createCanvas();
        await this.ubii_Bool();
      } else if (this.type == "ubii.dataStructure.Vector2") {
        await this.createCanvas();
        await this.ubii_Vector2();
      } else if (this.type == "bool") {
        // console.log('bool')
      }
    });
  },
  methods: {
    createCanvas: function () {
      this.canvas = document.createElement("canvas");
      this.canvas.width = 300;
      this.canvas.height = 200;
      const element = document.getElementById(this.id);
      element.appendChild(this.canvas);
      this.ctx = this.canvas.getContext("2d");
    },
    ubii_Double: function () {},
    ubii_updateDouble: function (/* rdata */) {
      // console.log(/* rdata */)
    },
    ubii_Bool: function () {
      this.ctx.font = "30px Arial";
      this.ctx.fillStyle = "black";
      this.ctx.textAlign = "center";
      this.ctx.fillText("UnKnown", this.canvas.width / 2, this.canvas.height / 2);
    },
    ubii_updateBool: function (rdata) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.font = "30px Arial";
      this.ctx.fillStyle = rdata ? "green" : "red";
      this.ctx.textAlign = "center";
      this.ctx.fillText(
        rdata ? "True" : "False",
        this.canvas.width / 2,
        this.canvas.height / 2
      );
    },
    ubii_String: function () {},
    ubii_updateString: function (/* rdata */) {
      // console.log(/* rdata */)
    },
    ubii_Vector2: function () {
      var centerX = this.canvas.width / 2;
      var centerY = this.canvas.height / 2;
      var radius = 5;

      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
      this.ctx.fillStyle = "green";
      this.ctx.fill();
      this.ctx.lineWidth = 1;
      this.ctx.strokeStyle = "#003300";
      this.ctx.stroke();
    },
    ubii_updateVector2: function (rdata) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      var centerX = rdata.x * this.canvas.width;
      var centerY = rdata.y * this.canvas.height;
      var radius = 5;

      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
      this.ctx.fillStyle = "green";
      this.ctx.fill();
      this.ctx.lineWidth = 1;
      this.ctx.strokeStyle = "#003300";
      this.ctx.stroke();
    },
    ubii_Vector3: function () {},
    ubii_updateVector3: function (/* rdata */) {
      // console.log(/* rdata */)
    },
    ubii_Matrix3x2: function () {},
    ubii_updateMatrix3x2: function (/* rdata */) {
      // console.log(/* rdata */)
    },
    ubii_Matrix4x4: function () {},
    ubii_updateMatrix4x4: function (/* rdata */) {
      // console.log(/* rdata */)
    },
    ubii_Color: function () {},
    ubii_updateColor: function (/* rdata */) {
      // console.log(/* rdata */)
    },
    ubii_MouseEvent: function () {},
    ubii_updateMouseEvent: function (/* rdata */) {
      // console.log(/* rdata */)
    },
    ubii_Int32: function () {},
    ubii_updateInt32: function (/* rdata */) {
      // console.log(/* rdata */)
    },
    ubii_Float: function () {},
    ubii_updateFloat: function (/* rdata */) {
      // console.log(/* rdata */)
    },
    ubii_Int32List: function () {},
    ubii_updateInt32List: function (/* rdata */) {
      // console.log(/* rdata */)
    },
    ubii_FloatList: function () {},
    ubii_updateFloatList: function (/* rdata */) {
      // console.log(/* rdata */)
    },
    ubii_DoubleList: function () {},
    ubii_updateDoubleList: function (/* rdata */) {
      // console.log(/* rdata */)
    },
    ubii_StringList: function () {},
    ubii_updateStringList: function (/* rdata */) {
      // console.log(/* rdata */)
    },
    ubii_BoolList: function () {},
    ubii_updateBoolList: function (/* rdata */) {
      // console.log(/* rdata */)
    },
    ubii_Image2D: function () {},
    ubii_updateImage2D: function (/* rdata */) {
      // console.log(/* rdata */)
    },
    ubii_Image2DList: function () {},
    ubii_updateImage2DList: function (/* rdata */) {
      // console.log(/* rdata */)
    },
  },
};
</script>
