
window.addEventListener('DOMContentLoaded', (event) => {
    let wasfalse = 1
    const gamepadAPI = {
        controller: {},
        turbo: true,
        connect: function (evt) {
            if (navigator.getGamepads()[0] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            } else if (navigator.getGamepads()[1] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            } else if (navigator.getGamepads()[2] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            } else if (navigator.getGamepads()[3] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            }
            for (let i = 0; i < gamepads.length; i++) {
                if (gamepads[i] === null) {
                    continue;
                }
                if (!gamepads[i].connected) {
                    continue;
                }
            }
        },
        disconnect: function (evt) {
            gamepadAPI.turbo = false;
            delete gamepadAPI.controller;
        },
        update: function () {
            gamepadAPI.controller = navigator.getGamepads()[0]
            gamepadAPI.buttonsCache = [];// clear the buttons cache
            for (var k = 0; k < gamepadAPI.buttonsStatus.length; k++) {// move the buttons status from the previous frame to the cache
                gamepadAPI.buttonsCache[k] = gamepadAPI.buttonsStatus[k];
            }
            gamepadAPI.buttonsStatus = [];// clear the buttons status
            var c = gamepadAPI.controller || {}; // get the gamepad object
            var pressed = [];
            if (c.buttons) {
                for (var b = 0, t = c.buttons.length; b < t; b++) {// loop through buttons and push the pressed ones to the array
                    if (c.buttons[b].pressed) {
                        console.log(c)
                        if (c.buttons[b].pressed == true && b == 9) {
                            if (wasfalse == 1) {
                                paused *= -1
                            }
                            wasfalse = 0
                        }
                        pressed.push(gamepadAPI.buttons[b]);
                    }else if(c.buttons[b].pressed == false  && b == 9){
                        wasfalse = 1
                    }
                }
            }
            var axes = [];
            if (c.axes) {
                for (var a = 0, x = c.axes.length; a < x; a++) {// loop through axes and push their values to the array
                    axes.push(c.axes[a].toFixed(2));
                }
            }
            gamepadAPI.axesStatus = axes;// assign received values
            gamepadAPI.buttonsStatus = pressed;
            // console.log(pressed); // return buttons for debugging purposes
            return pressed;
        },
        buttonPressed: function (button, hold) {
            var newPress = false;
            for (var i = 0, s = gamepadAPI.buttonsStatus.length; i < s; i++) {// loop through pressed buttons
                if (gamepadAPI.buttonsStatus[i] == button) {// if we found the button we're looking for...
                    newPress = true;// set the boolean variable to true
                    if (!hold) {// if we want to check the single press
                        for (var j = 0, p = gamepadAPI.buttonsCache.length; j < p; j++) {// loop through the cached states from the previous frame
                            if (gamepadAPI.buttonsCache[j] == button) { // if the button was already pressed, ignore new press
                                newPress = false;
                            }
                        }
                    }
                }
            }
            return newPress;
        },
        buttons: [
            'A', 'B', 'X', 'Y', 'LB', 'RB', 'Left-Trigger', 'Right-Trigger', 'Back', 'Start', 'Axis-Left', 'Axis-Right', 'DPad-Up', 'DPad-Down', 'DPad-Left', 'DPad-Right', "Power"
        ],
        buttonsCache: [],
        buttonsStatus: [],
        axesStatus: []
    };
    let canvas
    let canvas_context
    let keysPressed = {}
    let FLEX_engine
    let TIP_engine = {}
    let XS_engine
    let YS_engine
    class Point {
        constructor(x, y) {
            this.x = x
            this.y = y
            this.radius = 0
        }
        pointDistance(point) {
            return (new LineOP(this, point, "transparent", 0)).hypotenuse()
        }
    }
    class Line {
        constructor(x, y, x2, y2, color, width) {
            this.x1 = x
            this.y1 = y
            this.x2 = x2
            this.y2 = y2
            this.color = color
            this.width = width
        }
        hypotenuse() {
            let xdif = this.x1 - this.x2
            let ydif = this.y1 - this.y2
            let hypotenuse = (xdif * xdif) + (ydif * ydif)
            return Math.sqrt(hypotenuse)
        }
        draw() {
            let linewidthstorage = canvas_context.lineWidth
            canvas_context.strokeStyle = this.color
            canvas_context.lineWidth = this.width
            canvas_context.beginPath()
            canvas_context.moveTo(this.x1, this.y1)
            canvas_context.lineTo(this.x2, this.y2)
            canvas_context.stroke()
            canvas_context.lineWidth = linewidthstorage
        }
    }
    class LineOP {
        constructor(object, target, color, width) {
            this.object = object
            this.target = target
            this.color = color
            this.width = width
        }
        hypotenuse() {
            let xdif = this.object.x - this.target.x
            let ydif = this.object.y - this.target.y
            let hypotenuse = (xdif * xdif) + (ydif * ydif)
            return Math.sqrt(hypotenuse)
        }
        draw() {
            let linewidthstorage = canvas_context.lineWidth
            canvas_context.strokeStyle = this.color
            canvas_context.lineWidth = this.width
            canvas_context.beginPath()
            canvas_context.moveTo(this.object.x, this.object.y)
            canvas_context.lineTo(this.target.x, this.target.y)
            canvas_context.stroke()
            canvas_context.lineWidth = linewidthstorage
        }
    }
    class Triangle {
        constructor(x, y, color, length, fill = 0, strokeWidth = 0, leg1Ratio = 1, leg2Ratio = 1, heightRatio = 1) {
            this.x = x
            this.y = y
            this.color = color
            this.length = length
            this.x1 = this.x + this.length * leg1Ratio
            this.x2 = this.x - this.length * leg2Ratio
            this.tip = this.y - this.length * heightRatio
            this.accept1 = (this.y - this.tip) / (this.x1 - this.x)
            this.accept2 = (this.y - this.tip) / (this.x2 - this.x)
            this.fill = fill
            this.stroke = strokeWidth
        }
        draw() {
            canvas_context.strokeStyle = this.color
            canvas_context.stokeWidth = this.stroke
            canvas_context.beginPath()
            canvas_context.moveTo(this.x, this.y)
            canvas_context.lineTo(this.x1, this.y)
            canvas_context.lineTo(this.x, this.tip)
            canvas_context.lineTo(this.x2, this.y)
            canvas_context.lineTo(this.x, this.y)
            if (this.fill == 1) {
                canvas_context.fill()
            }
            canvas_context.stroke()
            canvas_context.closePath()
        }
        isPointInside(point) {
            if (point.x <= this.x1) {
                if (point.y >= this.tip) {
                    if (point.y <= this.y) {
                        if (point.x >= this.x2) {
                            this.accept1 = (this.y - this.tip) / (this.x1 - this.x)
                            this.accept2 = (this.y - this.tip) / (this.x2 - this.x)
                            this.basey = point.y - this.tip
                            this.basex = point.x - this.x
                            if (this.basex == 0) {
                                return true
                            }
                            this.slope = this.basey / this.basex
                            if (this.slope >= this.accept1) {
                                return true
                            } else if (this.slope <= this.accept2) {
                                return true
                            }
                        }
                    }
                }
            }
            return false
        }
    }
    class Rectangle {
        constructor(x, y, width, height, color, fill = 1, stroke = 0, strokeWidth = 1) {
            this.x = x
            this.y = y
            this.height = height
            this.width = width
            this.color = color
            this.xmom = 0
            this.ymom = 0
            this.stroke = stroke
            this.strokeWidth = strokeWidth
            this.fill = fill
        }
        draw() {
            canvas_context.fillStyle = this.color
            canvas_context.fillRect(this.x, this.y, this.width, this.height)
        }
        move() {
            this.x += this.xmom
            this.y += this.ymom
        }
        isPointInside(point) {
            if (point.x >= this.x) {
                if (point.y >= this.y) {
                    if (point.x <= this.x + this.width) {
                        if (point.y <= this.y + this.height) {
                            return true
                        }
                    }
                }
            }
            return false
        }
        doesPerimeterTouch(point) {
            if (point.x + point.radius >= this.x) {
                if (point.y + point.radius >= this.y) {
                    if (point.x - point.radius <= this.x + this.width) {
                        if (point.y - point.radius <= this.y + this.height) {
                            return true
                        }
                    }
                }
            }
            return false
        }
    }
    class Circle {
        constructor(x, y, radius, color, xmom = 0, ymom = 0, friction = 1, reflect = 0, strokeWidth = 0, strokeColor = "transparent") {
            this.x = x
            this.y = y
            this.radius = radius
            this.color = color
            this.xmom = xmom
            this.ymom = ymom
            this.friction = friction
            this.reflect = reflect
            this.strokeWidth = strokeWidth
            this.strokeColor = strokeColor
        }
        draw() {
            canvas_context.lineWidth = this.strokeWidth
            canvas_context.strokeStyle = this.color
            canvas_context.beginPath();
            if (this.radius > 0) {
                canvas_context.arc(this.x, this.y, this.radius, 0, (Math.PI * 2), true)
                canvas_context.fillStyle = this.color
                canvas_context.fill()
                canvas_context.stroke();
            } else {
                console.log("The circle is below a radius of 0, and has not been drawn. The circle is:", this)
            }
        }
        move() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            if (this == player.body) {
                canvas_context.translate(-this.xmom, -this.ymom)
            }
            this.x += this.xmom
            this.y += this.ymom
        }
        unmove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x -= this.xmom
            this.y -= this.ymom
        }
        frictiveMove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x += this.xmom
            this.y += this.ymom
            this.xmom *= this.friction
            this.ymom *= this.friction
        }
        frictiveunMove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.xmom /= this.friction
            this.ymom /= this.friction
            this.x -= this.xmom
            this.y -= this.ymom
        }
        isPointInside(point) {
            this.areaY = point.y - this.y
            this.areaX = point.x - this.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= (this.radius * this.radius)) {
                return true
            }
            return false
        }
        doesPerimeterTouch(point) {
            this.areaY = point.y - this.y
            this.areaX = point.x - this.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= ((this.radius + point.radius) * (this.radius + point.radius))) {
                return true
            }
            return false
        }
    } class Polygon {
        constructor(x, y, size, color, sides = 3, xmom = 0, ymom = 0, angle = 0, reflect = 0) {
            if (sides < 2) {
                sides = 2
            }
            this.reflect = reflect
            this.xmom = xmom
            this.ymom = ymom
            this.body = new Circle(x, y, size - (size * .293), "transparent")
            this.nodes = []
            this.angle = angle
            this.size = size
            this.color = color
            this.angleIncrement = (Math.PI * 2) / sides
            this.sides = sides
            this.spin = -.000071
            for (let t = 0; t < sides; t++) {
                let node = new Circle(this.body.x + (this.size * (Math.cos(this.angle))), this.body.y + (this.size * (Math.sin(this.angle))), 0, "transparent")
                this.nodes.push(node)
                this.angle += this.angleIncrement
            }
        }
        isPointInside(point) { // rough approximation
            this.body.radius = this.size - (this.size * .293)
            if (this.sides <= 2) {
                return false
            }
            this.areaY = point.y - this.body.y
            this.areaX = point.x - this.body.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= (this.body.radius * this.body.radius)) {
                return true
            }
            return false
        }
        move() {
            if (this.reflect == 1) {
                if (this.body.x > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.body.y > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.body.x < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.body.y < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.body.x += this.xmom
            this.body.y += this.ymom
        }
        draw() {
            this.nodes = []
            this.angleIncrement = (Math.PI * 2) / this.sides
            this.angle += this.spin
            this.body.radius = this.size - (this.size * .293)
            for (let t = 0; t < this.sides; t++) {
                let node = new Circle(this.body.x + (this.size * (Math.cos(this.angle))), this.body.y + (this.size * (Math.sin(this.angle))), 0, "transparent")
                this.nodes.push(node)
                this.angle += this.angleIncrement
            }
        }
    }
    class Shape {
        constructor(shapes) {
            this.shapes = shapes
        }
        isPointInside(point) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (this.shapes[t].isPointInside(point)) {
                    return true
                }
            }
            return false
        }
        doesPerimeterTouch(point) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (this.shapes[t].doesPerimeterTouch(point)) {
                    return true
                }
            }
            return false
        }
        isInsideOf(box) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (box.isPointInside(this.shapes[t])) {
                    return true
                }
            }
            return false
        }
        push(object) {
            this.shapes.push(object)
        }
    }
    class Spring {
        constructor(x, y, radius, color, body = 0, length = 1, gravity = 0, width = 5) {
            if (body == 0) {
                this.body = new Circle(x, y, radius, color)
                this.anchor = new Circle(x, y, radius, color)
                this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", width)
                this.length = length
            } else {
                this.body = body
                this.anchor = new Circle(x, y, radius, color)
                this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", width)
                this.length = length
            }
            this.gravity = gravity
            this.width = width
        }
        balance() {
            this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", this.width)
            if (this.beam.hypotenuse() < this.length) {
                if (this.body != gorpler.body) {
                    this.body.xmom += (this.body.x - this.anchor.x) / this.length
                    this.body.ymom += (this.body.y - this.anchor.y) / this.length
                } else {

                    this.body.xmom += ((this.body.x - this.anchor.x) / this.length) * .25
                    this.body.ymom += ((this.body.y - this.anchor.y) / this.length) * .25
                }
                this.anchor.xmom -= (this.body.x - this.anchor.x) / this.length
                this.anchor.ymom -= (this.body.y - this.anchor.y) / this.length
            } else {
                if (this.body != gorpler.body) {
                    this.body.xmom -= ((this.body.x - this.anchor.x) / this.length)
                    this.body.ymom -= ((this.body.y - this.anchor.y) / this.length)
                } else {
                    this.body.xmom -= ((this.body.x - this.anchor.x) / this.length) * .25
                    this.body.ymom -= ((this.body.y - this.anchor.y) / this.length) * .25
                }
                this.anchor.xmom += (this.body.x - this.anchor.x) / this.length
                this.anchor.ymom += (this.body.y - this.anchor.y) / this.length
            }
            let xmomentumaverage = (this.body.xmom + this.anchor.xmom) / 2
            let ymomentumaverage = (this.body.ymom + this.anchor.ymom) / 2
            if (this.body != gorpler.body) {
                this.body.xmom = ((this.body.xmom * 1) + (xmomentumaverage * 1)) / 2
                this.body.ymom = ((this.body.ymom * 1) + (ymomentumaverage * 1)) / 2
            }
            this.anchor.xmom = (this.anchor.xmom + xmomentumaverage) / 2
            this.anchor.ymom = (this.anchor.ymom + ymomentumaverage) / 2
            if (gorpler.leglock + gorpler.bodywet + gorpler.armlock >= 1) {
                this.body.xmom *= .98
                this.body.ymom *= .98
                this.anchor.xmom *= .98
                this.anchor.ymom *= .98
            } else {
                this.body.xmom *= .999
                this.body.ymom *= .999
                this.anchor.xmom *= .999
                this.anchor.ymom *= .999
            }
        }
        draw() {
            this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", this.width)
            this.beam.draw()
            this.body.draw()
            this.anchor.draw()
        }
        move() {
            this.anchor.ymom += this.gravity
            this.anchor.move()
        }

    }
    class Color {
        constructor(baseColor, red = -1, green = -1, blue = -1, alpha = 1) {
            this.hue = baseColor
            if (red != -1 && green != -1 && blue != -1) {
                this.r = red
                this.g = green
                this.b = blue
                if (alpha != 1) {
                    if (alpha < 1) {
                        this.alpha = alpha
                    } else {
                        this.alpha = alpha / 255
                        if (this.alpha > 1) {
                            this.alpha = 1
                        }
                    }
                }
                if (this.r > 255) {
                    this.r = 255
                }
                if (this.g > 255) {
                    this.g = 255
                }
                if (this.b > 255) {
                    this.b = 255
                }
                if (this.r < 0) {
                    this.r = 0
                }
                if (this.g < 0) {
                    this.g = 0
                }
                if (this.b < 0) {
                    this.b = 0
                }
            } else {
                this.r = 0
                this.g = 0
                this.b = 0
            }
        }
        normalize() {
            if (this.r > 255) {
                this.r = 255
            }
            if (this.g > 255) {
                this.g = 255
            }
            if (this.b > 255) {
                this.b = 255
            }
            if (this.r < 0) {
                this.r = 0
            }
            if (this.g < 0) {
                this.g = 0
            }
            if (this.b < 0) {
                this.b = 0
            }
        }
        randomLight() {
            var letters = '0123456789ABCDEF';
            var hash = '#';
            for (var i = 0; i < 6; i++) {
                hash += letters[(Math.floor(Math.random() * 12) + 4)];
            }
            var color = new Color(hash, 55 + Math.random() * 200, 55 + Math.random() * 200, 55 + Math.random() * 200)
            return color;
        }
        randomDark() {
            var letters = '0123456789ABCDEF';
            var hash = '#';
            for (var i = 0; i < 6; i++) {
                hash += letters[(Math.floor(Math.random() * 12))];
            }
            var color = new Color(hash, Math.random() * 200, Math.random() * 200, Math.random() * 200)
            return color;
        }
        random() {
            var letters = '0123456789ABCDEF';
            var hash = '#';
            for (var i = 0; i < 6; i++) {
                hash += letters[(Math.floor(Math.random() * 16))];
            }
            var color = new Color(hash, Math.random() * 255, Math.random() * 255, Math.random() * 255)
            return color;
        }
    }
    class Softbody { //buggy, spins in place
        constructor(x, y, radius, color, members = 10, memberLength = 5, force = 10, gravity = 0) {
            this.springs = []
            this.pin = new Circle(x, y, radius, color)
            this.spring = new Spring(x, y, radius, color, this.pin, memberLength, gravity)
            this.springs.push(this.spring)
            for (let k = 0; k < members; k++) {
                this.spring = new Spring(x, y, radius, color, this.spring.anchor, memberLength, gravity)
                if (k < members - 1) {
                    this.springs.push(this.spring)
                } else {
                    this.spring.anchor = this.pin
                    this.springs.push(this.spring)
                }
            }
            this.forceConstant = force
            this.centroid = new Point(0, 0)
        }
        circularize() {
            this.xpoint = 0
            this.ypoint = 0
            for (let s = 0; s < this.springs.length; s++) {
                this.xpoint += (this.springs[s].anchor.x / this.springs.length)
                this.ypoint += (this.springs[s].anchor.y / this.springs.length)
            }
            this.centroid.x = this.xpoint
            this.centroid.y = this.ypoint
            this.angle = 0
            this.angleIncrement = (Math.PI * 2) / this.springs.length
            for (let t = 0; t < this.springs.length; t++) {
                this.springs[t].body.x = this.centroid.x + (Math.cos(this.angle) * this.forceConstant)
                this.springs[t].body.y = this.centroid.y + (Math.sin(this.angle) * this.forceConstant)
                this.angle += this.angleIncrement
            }
        }
        balance() {
            for (let s = this.springs.length - 1; s >= 0; s--) {
                this.springs[s].balance()
            }
            this.xpoint = 0
            this.ypoint = 0
            for (let s = 0; s < this.springs.length; s++) {
                this.xpoint += (this.springs[s].anchor.x / this.springs.length)
                this.ypoint += (this.springs[s].anchor.y / this.springs.length)
            }
            this.centroid.x = this.xpoint
            this.centroid.y = this.ypoint
            for (let s = 0; s < this.springs.length; s++) {
                this.link = new Line(this.centroid.x, this.centroid.y, this.springs[s].anchor.x, this.springs[s].anchor.y, 0, "transparent")
                if (this.link.hypotenuse() != 0) {
                    this.springs[s].anchor.xmom += (((this.springs[s].anchor.x - this.centroid.x) / (this.link.hypotenuse()))) * this.forceConstant
                    this.springs[s].anchor.ymom += (((this.springs[s].anchor.y - this.centroid.y) / (this.link.hypotenuse()))) * this.forceConstant
                }
            }
            for (let s = 0; s < this.springs.length; s++) {
                this.springs[s].move()
            }
            for (let s = 0; s < this.springs.length; s++) {
                this.springs[s].draw()
            }
        }
    }
    class Observer {
        constructor(x, y, radius, color, range = 100, rays = 10, angle = (Math.PI * .125)) {
            this.body = new Circle(x, y, radius, color)
            this.color = color
            this.ray = []
            this.rayrange = range
            this.globalangle = Math.PI
            this.gapangle = angle
            this.currentangle = 0
            this.obstacles = []
            this.raymake = rays
        }
        beam() {
            this.currentangle = this.gapangle / 2
            for (let k = 0; k < this.raymake; k++) {
                this.currentangle += (this.gapangle / Math.ceil(this.raymake / 2))
                let ray = new Circle(this.body.x, this.body.y, 1, "white", (((Math.cos(this.globalangle + this.currentangle)))), (((Math.sin(this.globalangle + this.currentangle)))))
                ray.collided = 0
                ray.lifespan = this.rayrange - 1
                this.ray.push(ray)
            }
            for (let f = 0; f < this.rayrange; f++) {
                for (let t = 0; t < this.ray.length; t++) {
                    if (this.ray[t].collided < 1) {
                        this.ray[t].move()
                        for (let q = 0; q < this.obstacles.length; q++) {
                            if (this.obstacles[q].isPointInside(this.ray[t])) {
                                this.ray[t].collided = 1
                            }
                        }
                    }
                }
            }
        }
        draw() {
            this.beam()
            this.body.draw()
            canvas_context.lineWidth = 1
            canvas_context.fillStyle = this.color
            canvas_context.strokeStyle = this.color
            canvas_context.beginPath()
            canvas_context.moveTo(this.body.x, this.body.y)
            for (let y = 0; y < this.ray.length; y++) {
                canvas_context.lineTo(this.ray[y].x, this.ray[y].y)
                canvas_context.lineTo(this.body.x, this.body.y)
            }
            canvas_context.stroke()
            canvas_context.fill()
            this.ray = []
        }
    }
    function setUp(canvas_pass, style = "#000000") {
        canvas = canvas_pass
        canvas_context = canvas.getContext('2d');
        canvas.style.background = style
        window.setInterval(function () {
            main()
        }, 9)
        document.addEventListener('keydown', (event) => {
            keysPressed[event.key] = true;
        });
        document.addEventListener('keyup', (event) => {
            delete keysPressed[event.key];
        });
        
        window.addEventListener('pointerdown', e => {
            FLEX_engine = canvas.getBoundingClientRect();
            XS_engine = e.clientX - FLEX_engine.left;
            YS_engine = e.clientY - FLEX_engine.top;
            TIP_engine.x = XS_engine
            TIP_engine.y = YS_engine
            TIP_engine.body = TIP_engine


            if(keysPressed[' ']){
                player.control(TIP_engine)
            }

            player.skillsAdapter(TIP_engine)
            window.addEventListener('pointermove', continued_stimuli);
        });

        window.addEventListener('pointermove', continued_stimuli);
        window.addEventListener('contextmenu', e => {  
            e.preventDefault();
            FLEX_engine = canvas.getBoundingClientRect();
            XS_engine = e.clientX - FLEX_engine.left;
            YS_engine = e.clientY - FLEX_engine.top;
            TIP_engine.x = XS_engine
            TIP_engine.y = YS_engine
            TIP_engine.body = TIP_engine


            player.control(TIP_engine)

            return false
        });
        window.addEventListener('pointerup', e => {
            // window.removeEventListener("pointermove", continued_stimuli);
        })
        function continued_stimuli(e) {
            FLEX_engine = canvas.getBoundingClientRect();
            XS_engine = e.clientX - FLEX_engine.left;
            YS_engine = e.clientY - FLEX_engine.top;
            TIP_engine.x = XS_engine
            TIP_engine.y = YS_engine
            TIP_engine.body = TIP_engine
        }
    }
    function gamepad_control(object, speed = 1) { // basic control for objects using the controler
        // console.log(gamepadAPI.axesStatus[1] * gamepadAPI.axesStatus[0])
        if (typeof object.body != 'undefined') {
            if (typeof (gamepadAPI.axesStatus[1]) != 'undefined') {
                if (typeof (gamepadAPI.axesStatus[0]) != 'undefined') {
                    object.body.xmom += (gamepadAPI.axesStatus[2] * speed)
                    object.body.ymom += (gamepadAPI.axesStatus[1] * speed)
                }
            }
        } else if (typeof object != 'undefined') {
            if (typeof (gamepadAPI.axesStatus[1]) != 'undefined') {
                if (typeof (gamepadAPI.axesStatus[0]) != 'undefined') {
                    object.xmom += (gamepadAPI.axesStatus[0] * speed)
                    object.ymom += (gamepadAPI.axesStatus[1] * speed)
                }
            }
        }
    }
    function gamepad_controlleg(object, speed = 1) { // basic control for objects using the controler
        // console.log(gamepadAPI.axesStatus[1] * gamepadAPI.axesStatus[0])
        if (typeof object.body != 'undefined') {
            if (typeof (gamepadAPI.axesStatus[3]) != 'undefined') {
                if (typeof (gamepadAPI.axesStatus[2]) != 'undefined') {
                    object.body.xmom += (gamepadAPI.axesStatus[3] * speed)
                    object.body.ymom += (gamepadAPI.axesStatus[2] * speed)
                }
            }
        } else if (typeof object != 'undefined') {
            if (typeof (gamepadAPI.axesStatus[3]) != 'undefined') {
                if (typeof (gamepadAPI.axesStatus[2]) != 'undefined') {
                    object.xmom += (gamepadAPI.axesStatus[2] * speed)
                    object.ymom += (gamepadAPI.axesStatus[3] * speed)
                }
            }
        }
    }
    function control(object, speed = 1) { // basic control for objects
        if (typeof object.body != 'undefined') {
            if (keysPressed['w']) {
                object.body.y -= speed * gamepadAPI.axesStatus[0]
            }
            if (keysPressed['d']) {
                object.body.x += speed
            }
            if (keysPressed['s']) {
                object.body.y += speed
            }
            if (keysPressed['a']) {
                object.body.x -= speed
            }
        } else if (typeof object != 'undefined') {
            if (keysPressed['w']) {
                object.y -= speed
            }
            if (keysPressed['d']) {
                object.x += speed
            }
            if (keysPressed['s']) {
                object.y += speed
            }
            if (keysPressed['a']) {
                object.x -= speed
            }
        }
    }
    function getRandomLightColor() { // random color that will be visible on  black background
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[(Math.floor(Math.random() * 12) + 4)];
        }
        return color;
    }
    function getRandomColor() { // random color
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[(Math.floor(Math.random() * 16) + 0)];
        }
        return color;
    }
    function getRandomDarkColor() {// color that will be visible on a black background
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[(Math.floor(Math.random() * 12))];
        }
        return color;
    }
    function castBetween(from, to, granularity = 10, radius = 1) { //creates a sort of beam hitbox between two points, with a granularity (number of members over distance), with a radius defined as well
        let limit = granularity
        let shape_array = []
        for (let t = 0; t < limit; t++) {
            let circ = new Circle((from.x * (t / limit)) + (to.x * ((limit - t) / limit)), (from.y * (t / limit)) + (to.y * ((limit - t) / limit)), radius, "white")
            shape_array.push(circ)
            circ.draw()
        }
        return (new Shape(shape_array))
    }

    let setup_canvas = document.getElementById('canvas') //getting canvas from document

    let dotsize = .1



    setUp(setup_canvas, "black") // setting up canvas refrences, starting timer. 

    class Gorpler {
        constructor(x, y) {
            this.body = new Circle(x, y, 10, "cyan")
            this.platforms = []
            this.arm = new Spring(x, y, 3, "yellow", this.body)
            this.arms = []
            this.arms.push(this.arm)
            this.leg = new Spring(x, y, 3, "red", this.body)
            this.legs = []
            this.legs.push(this.leg)
            this.leglock = 0
            this.armlock = 0
            this.pops = []
            this.dead = 0

            let floor = new Rectangle(x - 50, y + 50, 100, 10, "white")
            this.platforms.push(floor)


            let water = 0
            for (let t = 0; this.platforms.length < 16000; t++) {
                let floors = new Rectangle(Math.random() * 700, -6300 + Math.random() * 7000, 15, 15, "white")
                let wet = 0
                for (let k = 0; k < this.platforms.length; k++) {
                    let link = new LineOP(floors, this.platforms[k])
                    if (link.hypotenuse() < 80) {
                        wet = 1
                        water++
                    }
                }
                if (wet == 0) {
                    this.platforms.push(floors)
                }
                if (water > 1000) {
                    break
                }
            }

            for (let t = 0; t < 16; t++) {
                this.leg = new Spring(x + Math.random(), y + Math.random(), 3, "red", this.legs[t].anchor)
                if (t % 2 == 0) {
                    this.leg.anchor.color = "blue"
                }
                this.legs.push(this.leg)
            }
            for (let t = 0; t < 16; t++) {
                this.arm = new Spring(x + Math.random(), y + Math.random(), 3, "yellow", this.arms[t].anchor)
                if (t % 2 == 0) {
                    this.arm.anchor.color = "magenta"
                }
                this.arms.push(this.arm)
            }
        }
        pop() {
            let rotx = Math.random() * Math.PI * 2
            let roty = Math.random() * Math.PI * 2

            for (let g = 0; g < 70; g++) {
                let color = "Orange"

                const dot1 = new Circle(this.body.x, this.body.y, this.body.radius / 4, color, Math.cos(rotx) * 4, Math.sin(roty) * 4)
                this.pops.push(dot1)
                rotx += 2 * Math.PI / Math.random() * Math.PI * 2
                roty += 2 * Math.PI / Math.random() * Math.PI * 2
            }

        }
        popdraw() {
            for (let t = 0; t < this.pops.length; t++) {
                if (this.pops[t].radius < .1) {
                    this.pops.splice(t, 1)
                }
            }
            for (let t = 0; t < this.pops.length; t++) {
                this.pops[t].radius *= .99
                this.pops[t].move()
                this.pops[t].draw()
            }
            for (let t = 0; t < this.pops.length; t++) {
                if (this.pops[t].radius < .1) {
                    this.pops.splice(t, 1)
                }
            }
        }
        draw() {
            if (this.dead < 128) {
                this.arms[this.arms.length - 1].anchor.radius = 9
                this.legs[this.arms.length - 1].anchor.radius = 9
                if (this.dead == 0) {
                    this.body.move()
                }
                this.body.draw()
                this.leglock = 0
                this.armlock = 0

                this.popdraw()

                for (let t = 0; t < this.arms.length; t++) {

                    if (this.dead == 0) {
                        this.arms[t].balance()
                        this.legs[t].balance()
                    }
                }

                this.bodywet = 0
                for (let t = 0; t < this.platforms.length; t++) {
                    let link = new LineOP(this.body, this.platforms[t])
                    if (link.hypotenuse() < 750) {
                        this.platforms[t].draw()
                        if (this.platforms[t].doesPerimeterTouch(this.legs[this.legs.length - 1].anchor)) {
                            if (!gamepadAPI.buttonsStatus.includes('Right-Trigger')) {
                                this.leglock = 1
                            } else {
                                this.leglock = 0
                            }
                        }
                        if (this.platforms[t].doesPerimeterTouch(this.arms[this.arms.length - 1].anchor)) {
                            if (!gamepadAPI.buttonsStatus.includes('Left-Trigger')) {
                                this.armlock = 1
                            } else {
                                this.armlock = 0
                            }
                        }
                        if (this.platforms[t].doesPerimeterTouch(this.body)) {
                            this.bodywet = 1
                        }
                    }
                }


                if (this.bodywet == 0) {
                    this.body.xmom *= .8
                    this.body.ymom *= .8
                    this.body.ymom += .5
                } else {
                    this.body.xmom *= .9
                    this.body.ymom *= .9
                    if (this.body.ymom > 0) {
                        this.body.ymom = 0
                    }
                }

                if (this.leglock != 0) {
                    this.legs[this.arms.length - 1].anchor.xmom *= .00001
                    this.legs[this.arms.length - 1].anchor.ymom *= .00001
                } else {
                    this.legs[this.arms.length - 1].anchor.xmom *= .99
                    this.legs[this.arms.length - 1].anchor.ymom *= .99
                    if (this.bodywet != 0 || this.armlock == 1) {
                        gamepad_controlleg(this.legs[this.arms.length - 1].anchor, 2.8)
                    }
                }
                if (this.armlock != 0) {
                    this.arms[this.arms.length - 1].anchor.xmom *= .00001
                    this.arms[this.arms.length - 1].anchor.ymom *= .00001
                } else {
                    this.arms[this.arms.length - 1].anchor.xmom *= .99
                    this.arms[this.arms.length - 1].anchor.ymom *= .99
                    if (this.bodywet != 0 || this.leglock == 1) {
                        gamepad_control(this.arms[this.arms.length - 1].anchor, 2.8)
                    }
                }

                for (let t = 0; t < this.arms.length; t++) {
                    if (this.dead == 0) {
                        this.arms[t].move()
                        this.legs[t].move()
                    }
                    this.arms[t].draw()
                    this.legs[t].draw()
                }

                if (this.dead == 0) {
                    canvas_context.font = "12px arial"
                    canvas_context.fillStyle = "blue"
                    canvas_context.fillText('R', this.legs[this.legs.length - 1].anchor.x - 4, this.legs[this.arms.length - 1].anchor.y + 4)
                    canvas_context.fillStyle = "blue"
                    canvas_context.fillText('L', this.arms[this.arms.length - 1].anchor.x - 4, this.arms[this.arms.length - 1].anchor.y + 4)
                }
            } else {

                canvas_context.font = "40px arial"
                canvas_context.fillStyle = "white"
                canvas_context.fillText('Roasted', this.legs[this.legs.length - 1].anchor.x - 4, this.legs[this.legs.length - 1].anchor.y + 4)
                for (let t = 0; t < this.platforms.length; t++) {
                    let link = new LineOP(this.body, this.platforms[t])
                    if (link.hypotenuse() < 750) {
                        this.platforms[t].draw()
                    }
                }
            }
        }
        death() {
            this.armlock = 0
            this.leglock = 0
            if (this.dead < 128) {
                if (this.dead % 8 == 0) {
                    this.pop()
                    this.arms.splice(this.arms.length - 1)
                    this.legs.splice(this.legs.length - 1)
                    if (this.legs.length === 0) {
                        this.body.radius = 0
                    }
                }
                this.dead++
            }
        }

    }
    canvas_context.fillStyle = "white"
    let splat = 0
    let gorpler = new Gorpler(350, 350)
    let lava = new Rectangle(-10000, 710, 20000, 7200, "#FFF90095")
    let lava2 = new Rectangle(-10000, 720, 20000, 7200, "#FF110095")
    let paused = 1
    let pauser = 0

    class Base{
        constructor(x,y, radius, color){
            this.body = new Circle(x, y, radius, color)
        }
        draw(){
            this.body.draw()
        }

    }
    
    let base1 = new Base(360, 1000, 300, "red")
    let base2 = new Base(360, -1000, 300, "blue")
    let rock1 = new Circle(85, 1000, 10, "orange")
    let rock2 = new Circle(85, -1000, 10, "white")
    let rock3 = new Circle(635, 1000, 10, "orange")
    let rock4 = new Circle(635, -1000, 10, "white")

    let path = new LineOP(base1.body, base2.body, "#FFAA55", 550)
    
    class Trap{
        constructor(from,to){

            this.body = new Circle(from.x, from.y, 5, "green", 0 ,0)
            this.life = 1200
            this.body.x = this.body.x+(to.x-(canvas.width*.5))
            this.body.y = this.body.y+(to.y-(canvas.height*.5))

        }
        draw(){
            this.body.draw()
        }
        
    }

    class Pin{
        constructor(from, to){
            this.body = new Circle(from.x, from.y, 5, "purple", 0 ,0)
            this.life = 150
            this.end = new Circle(this.body.x, this.body.y, 2, "black")
            to.x = this.body.x+(to.x-(canvas.width*.5))
            to.y = this.body.y+(to.y-(canvas.height*.5))


            this.body.xmom = 0-(this.body.x-to.x)
            this.body.ymom = 0-(this.body.y-to.y)

            while(Math.sqrt(Math.abs(this.body.xmom*this.body.xmom)+Math.abs(this.body.ymom*this.body.ymom)) > 3){
                this.body.xmom *= 0.98
                this.body.ymom *= 0.98
                
            }
            while(Math.sqrt(Math.abs(this.body.xmom*this.body.xmom)+Math.abs(this.body.ymom*this.body.ymom)) < 3){
                this.body.xmom *= 1.02
                this.body.ymom *= 1.02
            }
        }
        draw(){
            this.end.x = this.body.x-(10*this.body.xmom)
            this.end.y = this.body.y-(10*this.body.ymom)
            this.link = new LineOP(this.end, this.body, "black", 4)
            this.link.draw()
            this.end.draw()
            this.body.draw()
        }
        move(){
            this.body.move()
        }


    }
    class Pincushion {
        constructor(x,y, color){
            this.body = new Circle(x,y, 10, color)
            this.movespeedbase = 3
            this.speedbonus = 0
            this.health = 250
            this.healthmax =this.health
            this.mana = 100
            this.manamax = this.mana
            this.moveto = {}
            this.moveto.x = this.body.x-1
            this.moveto.y = this.body.y
            this.traps = []
            this.spears = []
            this.speardamage = 160
            this.spearcooldown = 0
            this.speardrain = 200
            this.healcooldown = 0
            this.healdrain = 200
            this.trapdamage = 200
            this.trapcooldown = 0
            this.trapdrain = 300
            this.mps = .01
            this.hps = .1

        




        }
        cooldown(){
            this.spearcooldown--
            this.healcooldown--
            this.trapcooldown--
        }
        regen(){
            if(this.health > 0){
                this.mana+=this.mps
                this.health+=this.hps
                if(this.health > this.healthmax){
                    this.health = this.healthmax
                }
                if(this.mana > this.manamax){
                    this.mana = this.manamax
                }
                this.speedbonus*=.99
            }else{
                this.health = 0
            }
        }
        control(to){
            this.moveto.x = this.body.x+(to.x-(canvas.width*.5))
            this.moveto.y = this.body.y+(to.y-(canvas.height*.5))
        }
        drive(){
            this.body.xmom = 0-(this.body.x-this.moveto.x)
            this.body.ymom = 0-(this.body.y-this.moveto.y)

            while(Math.sqrt(Math.abs(this.body.xmom*this.body.xmom)+Math.abs(this.body.ymom*this.body.ymom))  > (this.movespeedbase+this.speedbonus)){
                this.body.xmom *= 0.98
                this.body.ymom *= 0.98
                
            }
            while(Math.sqrt(Math.abs(this.body.xmom*this.body.xmom)+Math.abs(this.body.ymom*this.body.ymom)) < (this.movespeedbase+this.speedbonus)){
                this.body.xmom *= 1.02
                this.body.ymom *= 1.02
            }
        }
        skillsAdapter(to){
            if(keysPressed['q']){
                this.spear(to)
            }
            if(keysPressed['w']){
                this.heal(to)
            }
            if(keysPressed['e']){
                this.trap(to)
            }


        }
        spear(to){
            if(this.mana > 20){
                if(this.spearcooldown <= 0){
                    let pin = new Pin(this.body, to)
                    this.spears.push(pin)
                    this.spearcooldown = this.speardrain
                }
            }

        }
        speardraw(){
            for(let t = 0;t<this.spears.length;t++){
                this.spears[t].move()
                this.spears[t].draw()
                this.spears[t].life--
            }
            for(let t = 0;t<this.spears.length;t++){
                if(this.spears[t].life<=0){
                    this.spears.splice(t,1)
                }
            }


        }
        trapdraw(){
            for(let t = 0;t<this.traps.length;t++){
                this.traps[t].draw()
                this.traps[t].life--
            }
            for(let t = 0;t<this.traps.length;t++){
                if(this.traps[t].life<=0){
                    this.traps.splice(t,1)
                }
            }


        }
        heal(){

            if(this.mana > 50){
                if(this.healcooldown <= 0){
                    this.health += 150
                    this.healcooldown = this.healdrain
                }
            }


        }
        trap(to){
            if(this.mana > 10){
                if(this.trapcooldown <= 0){
                    let trap = new Trap(this.body, to)
                    this.traps.push(trap)
                    // this.trapcooldown = this.trapdrain
                    console.log(trap)
                }
            }



        }
        draw(){
            this.regen()
            this.drive()
            let check = new LineOP(this.moveto, this.body)
            if(check.hypotenuse() > (.7*(this.movespeedbase+this.speedbonus))){
                this.body.move()
            }
            this.body.draw()
            this.healthbar = new Rectangle(this.body.x - this.body.radius, this.body.y - (this.body.radius*2), this.body.radius*2, this.body.radius*.25, "green")
            this.healthbar.width = (this.health/this.healthmax)*this.body.radius*2
            this.healthbar.draw()
            this.trapdraw()
            this.speardraw()
            this.cooldown()
            this.collide()
        }
        collide(){
            for(let t = 0;t<players.length;t++){
                if(this!= players[t]){
                    for(let k = 0;k<players[t].spears.length;k++){
                        if(players[t].spears[k].body.doesPerimeterTouch(this.body)){
                            this.health -= (players[t].speardamage - (players[t].spears[k].life))
                            players[t].spears[k].life = 0
                        }
                    }
                    for(let k = 0;k<players[t].traps.length;k++){
                        if(players[t].traps[k].body.doesPerimeterTouch(this.body)){
                            this.health -= (players[t].trapdamage)
                            this.speedbonus = -2.5
                            players[t].traps[k].life = 0
                        }
                    }
                }

            }

        }

    }


    let player = new Pincushion(360,360, "magenta")
    let enemy = new Pincushion(360,-500,"cyan")

    let players = []

    players.push(player)
    players.push(enemy)
    function main() {
        gamepadAPI.update()
        if (paused == -1) {
        } else {
            canvas_context.clearRect(-10000, -10000, canvas.width * 100, canvas.height * 100)  // refreshes the image
            canvas_context.fillStyle = "white"
            path.draw()
            base1.draw()
            base2.draw()
            rock1.draw()
            rock2.draw()
            castBetween(rock1, rock2, 15, 100)
            castBetween(rock3, rock4, 14, 100)
            for(let t = 0;t<players.length;t++){
                players[t].draw()
            }
        }
    }
})