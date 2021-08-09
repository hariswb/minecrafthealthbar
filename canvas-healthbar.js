Vue.component("canvas-healthbar", {
  data: function () {
    return {
      canvasWidth: 550,
      timestamp: 0,
      interval: 200,
      animate: true,
      color: { bg: "#1d2333", border: "white" },
    };
  },
  template: "<canvas id='healthbar'></canvas>",
  mounted: function () {
    console.log();
    this.canvasWidth = document.getElementById(this.$parent.$el.id).offsetWidth;

    const buffer = document.createElement("canvas");
    buffer.width = 550;
    buffer.height = 120;

    const bufferCtx = buffer.getContext("2d");

    let canvas = this.$el;
    const scale = this.canvasWidth / 550 > 1 ? 1 : this.canvasWidth / 550;

    canvas.width = 550 * scale;
    canvas.height = 120 * scale;
    let canvasCtx = canvas.getContext("2d");

    const leftMob = new Image();
    const rightMob = new Image();

    leftMob.src = this.$parent.sprite;
    rightMob.src = this.$parent.sprite;
    canvasCtx.scale(scale, scale);
    this.startDrawing(buffer, bufferCtx, canvas, canvasCtx, leftMob, rightMob);

    let _this = this;
    let debounceResize = debounce(function () {
      _this.canvasContainer = document.getElementById(
        _this.$parent.$el.id
      ).offsetWidth;
      _this.canvasWidth = _this.canvasContainer;
      _this.$nextTick(() => {
        _this.handleResize();
      });
    }, 250);
    window.addEventListener("resize", debounceResize);
  },
  methods: {
    calculateWidth: function () {
      this.canvasWidth = this.$refs.canvasContainer.clientWidth;
    },
    handleResize: function () {
      const canvas = this.$el;
      const scale = this.canvasWidth > 550 ? 1 : this.canvasWidth / 550;

      canvas.width = 550 * scale;
      canvas.height = 120 * scale;

      canvasCtx = canvas.getContext("2d");
      canvasCtx.scale(scale, scale);
    },
    startDrawing: function (
      buffer,
      bufferCtx,
      canvas,
      canvasCtx,
      leftMob,
      rightMob
    ) {
      let draw = () => {
        bufferCtx.clearRect(0, 0, canvas.width, canvas.height);
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

        bufferCtx.save();
        canvasCtx.save();
        //Bg
        bufferCtx.fillStyle = this.color.bg;
        bufferCtx.fillRect(0, 0, 550, 120);

        //Mob Data
        focusMobValue = this.$parent.value;
        leftMobData = this.$parent[this.$parent.bossSelect].min;
        rightMobData = this.$parent[this.$parent.bossSelect].max;
        //Health

        const health = {
          max: rightMobData.health,
          min: leftMobData.health,
        };

        if (focusMobValue > rightMobData) {
          health.value = rightMobData.health;
        } else {
          health.value = focusMobValue;
        }

        //DRAW MOVING BLOCKS
        const bar = {
          x: 75,
          y: 30,
          width: 400,
          height: 40,
        };
        const blockDim = { row: 8, col: 5, num: 20 };
        const tail = { offset: 3, effect: true };

        //Border & Icons
        bufferCtx.fillStyle = this.color.border;
        partRow = bar.height / blockDim.row;
        partCol = bar.width / blockDim.num / blockDim.col;
        // Icons movement
        const lShift = Math.floor(((this.timestamp % 3) + 1) / 3) * 5;

        const rShift = Math.floor(((this.timestamp % 3) + 1) / 3) * 5;
        //Border
        bufferCtx.fillStyle = this.color.border;
        bufferCtx.fillRect(
          bar.x - 40 + lShift,
          bar.y,
          bar.width + 80 - 2 * rShift,
          40
        );
        bufferCtx.fillStyle = this.color.border;
        bufferCtx.fillRect(
          bar.x - 40 - partRow + lShift,
          bar.y + partRow,
          bar.width + 90 - 2 * rShift,
          40 - partRow * 2
        );

        //Icons
        bufferCtx.font = "16px" + " " + this.$parent.font;
        const leftMobText =
          leftMobData.name + " " + "(" + leftMobData.health.toString() + ")";

        bufferCtx.fillText(
          leftMobText,
          bar.x - 40,
          bar.y + bar.height + 4 * partRow
        );

        const rightMobText =
          "(" + rightMobData.health.toString() + ")" + " " + rightMobData.name;
        const rightMobWidth = bufferCtx.measureText(rightMobText).width;
        bufferCtx.fillText(
          rightMobText,
          bar.x + bar.width + 40 - rightMobWidth,

          bar.y + bar.height + 4 * partRow
        );
        console.log();
        bufferCtx.drawImage(
          leftMob,
          leftMobData.spriteX * 16,
          leftMobData.spriteY * 16,
          15,
          15,
          bar.x - 40 + lShift,
          bar.y + partRow,
          30,
          30
        );

        bufferCtx.drawImage(
          rightMob,
          rightMobData.spriteX * 16,
          rightMobData.spriteY * 16,
          15,
          15,
          bar.x + bar.width + partRow * 2 - rShift,
          bar.y + partRow,
          30,
          30
        );

        //BLOCKS PARTICLES
        const shownBlockNum =
          health.value <= health.max
            ? Math.ceil((health.value / health.max) * blockDim.num)
            : blockDim.num;

        for (let i = shownBlockNum; i > 0; i--) {
          const color = {
            r: 255 - (shownBlockNum - i) * 10,
            g: 250 - (shownBlockNum - i) * 20,
            b: 0,
          };

          const fill =
            shownBlockNum - this.timestamp > i
              ? this.animate
                ? { r: 255, g: 255, b: 255 }
                : color
              : color;

          block(bufferCtx, i, shownBlockNum, bar, blockDim, fill, tail);
        }
        //MASK

        const maskWidth =
          health.value <= health.max
            ? ((health.max - health.value) / health.max) * bar.width
            : 0;
        const maskX = bar.width - maskWidth;
        bufferCtx.fillStyle = "white";
        bufferCtx.fillRect(bar.x + maskX, bar.y, maskWidth, bar.height);
        //Border
        bufferCtx.lineWidth = partRow;
        bufferCtx.strokeStyle = "white";
        bufferCtx.beginPath();
        bufferCtx.moveTo(bar.x, bar.y + partRow / 2);
        bufferCtx.lineTo(bar.x + bar.width, bar.y + partRow / 2);
        bufferCtx.moveTo(bar.x, bar.y + bar.height - partRow / 2);
        bufferCtx.lineTo(bar.x + bar.width, bar.y + bar.height - partRow / 2);
        bufferCtx.closePath();

        bufferCtx.stroke();
        //
        //Draw buffer to canvas
        canvasCtx.drawImage(buffer, 0, 0);

        bufferCtx.restore();
        canvasCtx.restore();
        //TIMEFRAME RECURSIVE
        if (this.timestamp < shownBlockNum - 1) {
          setTimeout(draw, this.interval);
          this.timestamp += 1;
          if (shownBlockNum - this.timestamp == 2) {
            this.animate = false;
          }
        } else {
          setTimeout(draw, this.interval);
          this.timestamp = 0;
        }
      };
      function block(
        ctx,
        blockOrder,
        shownBlockNum,
        bar,
        blockDim,
        fill,
        tail
      ) {
        const blockHeight = bar.height;
        const blockWidth = bar.width / blockDim.num;

        const rowNum = blockDim.row;
        const colNum = blockDim.col;

        const partRow = blockHeight / rowNum;
        const partCol = blockWidth / colNum;

        const blockPos = bar.width - blockOrder * blockWidth;

        //Block Particles
        for (let row = 0; row < rowNum; row++) {
          const xPos = Math.floor(Math.random() * tail.offset);

          const newCol = blockOrder == 1 ? colNum : colNum + tail.offset - 1;

          for (let col = 0; col < newCol; col++) {
            if (xPos + col < newCol) {
              ctx.fillStyle =
                "rgb(" + fill.r + "," + fill.g + "," + fill.b + ")";
              ctx.fillRect(
                blockPos +
                  bar.x +
                  (xPos + col) * partCol -
                  (blockDim.num - shownBlockNum) * blockWidth,
                bar.y + row * partRow,
                partCol,
                partRow
              );
            }
          }
        }
      }
      draw();
    },
  },
});
