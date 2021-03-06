
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
                        // ////console.log(c)
                        if (c.buttons[b].pressed == true && b == 9) {
                            if (wasfalse == 1) {
                                paused *= -1
                            }
                            wasfalse = 0
                        }
                        pressed.push(gamepadAPI.buttons[b]);
                    } else if (c.buttons[b].pressed == false && b == 9) {
                        wasfalse = 1
                    }
                }
            }
            var axes = [];
            if (c.axes) {
                for (var a = 0, x = c.axes.length; a < x; a++) {// loop through axes and push their values to the array
                    axes.push(parseFloat(c.axes[a].toFixed(2), 10));
                }
            }
            gamepadAPI.axesStatus = axes;// assign received values
            gamepadAPI.buttonsStatus = pressed;
            // ////console.log(pressed); // return buttons for debugging purposes
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
        angle() {
            return Math.atan2(this.object.y - this.target.y, this.object.x - this.target.x)
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
                // ////console.log("The circle is below a radius of 0, and has not been drawn. The circle is:", this)
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
            if (this == players[0].body) {
                canvas_context.translate(-this.xmom, -this.ymom)
            }
            this.x += this.xmom
            this.y += this.ymom
        }
        unmove() {
            let messup = 1.0
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
            if (this == players[0].body) {
                canvas_context.translate(this.xmom * messup, this.ymom * messup)
            }
            this.x -= this.xmom * messup
            this.y -= this.ymom * messup
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
        draw() {
            for (let t = 0; t < this.shapes.length; t++) {
                this.shapes[t].draw()
            }
        }
        move() {
            for (let t = 0; t < this.shapes.length; t++) {
                this.shapes[t].move()
            }
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


            if (keysPressed[' ']) {
                players[0].control(TIP_engine)
            }


            if (selected == 0) {
                if (gasman.isPointInside(TIP_engine)) {
                    selected++
                    players[0] = new Gasbag(360, 360, "magenta")
                    players[0].base = base1
                    let tower = new Tower(players[0].body.x - 110, players[0].body.y - 170, players[0])
                    players[0].army.push(tower)
                }
                if (pingirl.isPointInside(TIP_engine)) {
                    selected++
                    players[0] = new Pincushion(360, 360, "magenta")
                    players[0].base = base1
                    let tower = new Tower(players[0].body.x - 110, players[0].body.y - 170, players[0])
                    players[0].army.push(tower)
                }
                if (blindmonk.isPointInside(TIP_engine)) {
                    selected++
                    players[0] = new Blindmonk(360, 360, "magenta")
                    players[0].base = base1
                    let tower = new Tower(players[0].body.x - 110, players[0].body.y - 170, players[0])
                    players[0].army.push(tower)
                }
                if (robofister.isPointInside(TIP_engine)) {
                    selected++
                    players[0] = new Robofister(360, 360, "magenta")
                    players[0].base = base1
                    let tower = new Tower(players[0].body.x - 110, players[0].body.y - 170, players[0])
                    players[0].army.push(tower)
                }
                if (aliensquid.isPointInside(TIP_engine)) {
                    selected++
                    players[0] = new Aliensquid(360, 360, "magenta")
                    players[0].base = base1
                    let tower = new Tower(players[0].body.x - 110, players[0].body.y - 170, players[0])
                    players[0].army.push(tower)
                }
                if (foxghost.isPointInside(TIP_engine)) {
                    selected++
                    players[0] = new Foxghost(360, 360, "magenta")
                    players[0].base = base1
                    let tower = new Tower(players[0].body.x - 110, players[0].body.y - 170, players[0])
                    players[0].army.push(tower)
                }
                if (demontaur.isPointInside(TIP_engine)) {
                    selected++
                    players[0] = new Demontaur(360, 360, "magenta")
                    players[0].base = base1
                    let tower = new Tower(players[0].body.x - 110, players[0].body.y - 170, players[0])
                    players[0].army.push(tower)
                }
                if (inventrix.isPointInside(TIP_engine)) {
                    selected++
                    players[0] = new Inventrix(360, 360, "magenta")
                    players[0].base = base1
                    let tower = new Tower(players[0].body.x - 110, players[0].body.y - 170, players[0])
                    players[0].army.push(tower)
                }
                if (artsassin.isPointInside(TIP_engine)) {
                    selected++
                    players[0] = new Artsassin(360, 360, "magenta")
                    players[0].base = base1
                    let tower = new Tower(players[0].body.x - 110, players[0].body.y - 170, players[0])
                    players[0].army.push(tower)
                }


            } else if (selected == 1) {
                if (gasman.isPointInside(TIP_engine)) {
                    selected++
                    players[1] = new Gasbag(360, -500, "cyan")
                    players[1].base = base2
                    let tower = new Tower(players[1].body.x + 110, players[1].body.y + 170, players[1])
                    players[1].army.push(tower)
                }
                if (pingirl.isPointInside(TIP_engine)) {
                    selected++
                    players[1] = new Pincushion(360, -500, "cyan")
                    players[1].base = base2
                    let tower = new Tower(players[1].body.x + 110, players[1].body.y + 170, players[1])
                    players[1].army.push(tower)
                }
                if (blindmonk.isPointInside(TIP_engine)) {
                    selected++
                    players[1] = new Blindmonk(360, -500, "cyan")
                    players[1].base = base2
                    let tower = new Tower(players[1].body.x + 110, players[1].body.y + 170, players[1])
                    players[1].army.push(tower)
                }
                if (robofister.isPointInside(TIP_engine)) {
                    selected++
                    players[1] = new Robofister(360, -500, "cyan")
                    players[1].base = base2
                    let tower = new Tower(players[1].body.x + 110, players[1].body.y + 170, players[1])
                    players[1].army.push(tower)
                }
                if (aliensquid.isPointInside(TIP_engine)) {
                    selected++
                    players[1] = new Aliensquid(360, -500, "cyan")
                    players[1].base = base2
                    let tower = new Tower(players[1].body.x + 110, players[1].body.y + 170, players[1])
                    players[1].army.push(tower)
                }
                if (foxghost.isPointInside(TIP_engine)) {
                    selected++
                    players[1] = new Foxghost(360, -500, "cyan")
                    players[1].base = base2
                    let tower = new Tower(players[1].body.x + 110, players[1].body.y + 170, players[1])
                    players[1].army.push(tower)
                }
                if (demontaur.isPointInside(TIP_engine)) {
                    selected++
                    players[1] = new Demontaur(360, -500, "cyan")
                    players[1].base = base2
                    let tower = new Tower(players[1].body.x + 110, players[1].body.y + 170, players[1])
                    players[1].army.push(tower)
                }
                if (inventrix.isPointInside(TIP_engine)) {
                    selected++
                    players[1] = new Inventrix(360, -500, "cyan")
                    players[1].base = base2
                    let tower = new Tower(players[1].body.x + 110, players[1].body.y + 170, players[1])
                    players[1].army.push(tower)
                }
                if (artsassin.isPointInside(TIP_engine)) {
                    selected++
                    players[1] = new Artsassin(360, -500, "cyan")
                    players[1].base = base2
                    let tower = new Tower(players[1].body.x + 110, players[1].body.y + 170, players[1])
                    players[1].army.push(tower)
                }
            }


            if (players[0].locked <= 0) {
                players[0].skillsAdapter(TIP_engine)
            }
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


            players[0].control(TIP_engine)

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
        // ////console.log(gamepadAPI.axesStatus[1] * gamepadAPI.axesStatus[0])
        if (typeof object.moveto != 'undefined') {
            if (typeof (gamepadAPI.axesStatus[1]) != 'undefined') {
                if (typeof (gamepadAPI.axesStatus[0]) != 'undefined') {
                    let mover = {}
                    mover.x = object.moveto.x
                    mover.y = object.moveto.y
                    mover.x += (gamepadAPI.axesStatus[0] * speed * 2.01)
                    mover.y += (gamepadAPI.axesStatus[1] * speed * 2.01)
                    if (!beam1.isPointInside(mover) && !beam2.isPointInside(mover) && !base1.body.isPointInside(mover) && !base2.body.isPointInside(mover)) {
                        object.moveto.x += (gamepadAPI.axesStatus[0] * speed)
                        object.moveto.y += (gamepadAPI.axesStatus[1] * speed)
                    }
                }
            }
        } else if (typeof object != 'undefined') {
            if (typeof (gamepadAPI.axesStatus[1]) != 'undefined') {
                if (typeof (gamepadAPI.axesStatus[0]) != 'undefined') {
                    object.moveto.x += (gamepadAPI.axesStatus[0] * speed)
                    object.moveto.y += (gamepadAPI.axesStatus[1] * speed)
                }
            }
        }
    }
    let angles = {}
    angles.right = 0
    angles.left = 0
    function gamepad_angles() {
        if (Math.abs(gamepadAPI.axesStatus[1]) + Math.abs(gamepadAPI.axesStatus[0]) > 0.1) {
            if (isNaN(angles.right)) {
                angles.right = 0
            } else {
                angles.right = Math.atan2(gamepadAPI.axesStatus[1], gamepadAPI.axesStatus[0])
            }
        }
        if (Math.abs(gamepadAPI.axesStatus[2]) + Math.abs(gamepadAPI.axesStatus[3]) > 0.1) {
            if (isNaN(angles.left)) {
                angles.left = 0
            } else {
                angles.left = Math.atan2(gamepadAPI.axesStatus[3], gamepadAPI.axesStatus[2])
            }
        }


        return angles

    }
    function gamepad_controlleg(object, speed = 1) { // basic control for objects using the controler
        // ////console.log(gamepadAPI.axesStatus[1] * gamepadAPI.axesStatus[0])
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
    function getRandomDarkGreen() {// color that will be visible on a black background
        var letters = '0123456789ABCDEF';
        var color = '#00';
        for (var i = 0; i < 2; i++) {
            color += "3"//letters[(Math.floor(Math.random() * 3))];
        }
        color += "00"
        return color;
    }
    function castBetween(from, to, granularity = 10, radius = 1) { //creates a sort of beam hitbox between two points, with a granularity (number of members over distance), with a radius defined as well
        let limit = granularity
        let shape_array = []
        for (let t = 0; t < limit; t++) {
            let circ = new Circle((from.x * (t / limit)) + (to.x * ((limit - t) / limit)), (from.y * (t / limit)) + (to.y * ((limit - t) / limit)), radius, getRandomDarkGreen())
            shape_array.push(circ)
            circ.draw()
        }
        return (new Shape(shape_array))
    }

    let setup_canvas = document.getElementById('canvas') //getting canvas from document

    setUp(setup_canvas, "black") // setting up canvas refrences, starting timer. 

    let dotsize = .1



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

    class Base {
        constructor(x, y, radius, color) {
            this.body = new Circle(x, y, radius, color)
        }
        draw() {
            this.body.draw()
        }

    }

    let base1 = new Base(360, 1000, 300, "red")
    let base2 = new Base(360, -1000, 300, "blue")
    let rock1 = new Circle(80, 1000, 10, "orange")
    let rock2 = new Circle(80, -1000, 10, "white")
    let rock3 = new Circle(640, 1000, 10, "orange")
    let rock4 = new Circle(640, -1000, 10, "white")

    let path = new LineOP(base1.body, base2.body, "#FFAA55", 550)

    class Trap {
        constructor(from, to, owner) {

            this.life = 1200
            if (owner == players[0]) {
                this.body = new Circle(to.x, to.y, 5, "magenta", 0, 0)
                this.body2 = new Circle(to.x, to.y, 4, "yellow", 0, 0)
                this.body3 = new Circle(to.x, to.y, 3, "magenta", 0, 0)
                this.body4 = new Circle(to.x, to.y, 2, "yellow", 0, 0)
                this.body5 = new Circle(to.x, to.y, 1, "magenta", 0, 0)
            } else {
                this.body = new Circle(to.x, to.y, 5, "cyan", 0, 0)
                this.body2 = new Circle(to.x, to.y, 4, "black", 0, 0)
                this.body3 = new Circle(to.x, to.y, 3, "cyan", 0, 0)
                this.body4 = new Circle(to.x, to.y, 2, "black", 0, 0)
                this.body5 = new Circle(to.x, to.y, 1, "cyan", 0, 0)
            }

        }
        draw() {
            this.body.draw()
            this.body2.draw()
            this.body3.draw()
            this.body4.draw()
            this.body5.draw()
        }

    }
    class EnergySlam {
        constructor(from, to, owner) {

            this.life = 75
            this.body = castBetween(from, to, 12, 10)

        }
        draw() {
            this.body.draw()
        }
        move() {
            this.body.move()
        }

    }
    class Rootbeam {
        constructor(from, to, owner) {

            this.life = 4
            this.body = castBetween(from, to, 350, 2.2)

        }
        draw() {
            this.body.draw()
        }
        move() {
            this.body.move()
        }

    }
    class EnergyBlast {
        constructor(from, to, owner) {

            this.life = 12
            if (owner == players[0]) {
                this.body = new Circle(to.x, to.y, 30, "purple", 0, 0)
                this.body2 = new Circle(to.x, to.y, 24, "magenta", 0, 0)
                this.body3 = new Circle(to.x, to.y, 18, "purple", 0, 0)
                this.body4 = new Circle(to.x, to.y, 12, "magenta", 0, 0)
                this.body5 = new Circle(to.x, to.y, 6, "purple", 0, 0)
            } else {
                this.body = new Circle(to.x, to.y, 30, "magenta", 0, 0)
                this.body2 = new Circle(to.x, to.y, 24, "purple", 0, 0)
                this.body3 = new Circle(to.x, to.y, 18, "magenta", 0, 0)
                this.body4 = new Circle(to.x, to.y, 12, "purple", 0, 0)
                this.body5 = new Circle(to.x, to.y, 6, "magenta", 0, 0)
            }

        }
        draw() {
            this.body.draw()
            this.body2.draw()
            this.body3.draw()
            this.body4.draw()
            this.body5.draw()
        }
        move() {

        }

    }
    class EnergyBeam {
        constructor(from, to, owner) {

            this.life = .3
            this.body = castBetween(from, to, 40, 1)

        }
        draw() {
            this.body.draw()
        }
        move() {
            this.body.move()
        }

    }
    class Slam {
        constructor(from, to, owner) {

            this.life = 5
            this.body = new Circle(from.x, from.y, 50, "#AA660088")

        }
        draw() {
            this.body.draw()
        }
        move() {
            this.body.move()
        }

    }
    class RoboSlam {
        constructor(from, to, owner) {

            this.life = 5
            this.body = new Circle(from.x, from.y, 100, "#00AAFF88")

        }
        draw() {
            this.body.draw()
        }
        move() {
            this.body.move()
        }

    }

    class Pin {
        constructor(from, to, owner) {
            this.body = new Circle(from.x, from.y, 5, "purple", 0, 0)
            this.life = 100
            this.end = new Circle(this.body.x, this.body.y, 2, "black")
            this.shaft = new Shape([])
            if (owner == players[0]) {
                to.x = this.body.x + (to.x - (canvas.width * .5))
                to.y = this.body.y + (to.y - (canvas.height * .5))
                this.body.color = "#00ff00"
            } else {
                this.body.color = "#FF0000"
            }


            this.body.xmom = 0 - (this.body.x - to.x)
            this.body.ymom = 0 - (this.body.y - to.y)
            let k = 0

            // if(Math.sqrt(Math.abs(this.body.xmom*this.body.xmom)+Math.abs(this.body.ymom*this.body.ymom)) != 0){
            while (Math.sqrt(Math.abs(this.body.xmom * this.body.xmom) + Math.abs(this.body.ymom * this.body.ymom)) > 4.5) {
                this.body.xmom *= 0.98
                this.body.ymom *= 0.98

                k++
                if (k > 1000) {
                    break
                }
            }
            k = 0
            while (Math.sqrt(Math.abs(this.body.xmom * this.body.xmom) + Math.abs(this.body.ymom * this.body.ymom)) < 4.5) {
                this.body.xmom *= 1.02
                this.body.ymom *= 1.02

                k++
                if (k > 1000) {
                    break
                }
            }
            // }
        }
        draw() {
            this.end.x = this.body.x - (10 * this.body.xmom)
            this.end.y = this.body.y - (10 * this.body.ymom)
            this.link = new LineOP(this.end, this.body, "black", 4)

            this.shaft = castBetween(this.end, this.body)
            // this.link.draw()
            this.end.draw()
            this.body.draw()
        }
        move() {
            this.body.move()
        }


    }


    class Blastbeam {
        constructor(from, to, owner) {
            this.body = new Circle(from.x, from.y, 8, "purple", 0, 0)
            this.life = 75
            this.life1 = 1
            this.life2 = 1
            this.engage = 0
            this.angle = Math.atan2(from.y - to.y, from.x - to.x)
            this.end = new Circle(this.body.x, this.body.y, 2, "black")
            this.shaft = new Shape([])
            this.body1 = {}
            this.body2 = {}
            if (owner == players[0]) {
                to.x = this.body.x + (to.x - (canvas.width * .5))
                to.y = this.body.y + (to.y - (canvas.height * .5))
                // this.body.color = "#00ff00"
            } else {
                // this.body.color = "#FF0000"
            }


            this.body.xmom = 0 - (this.body.x - to.x)
            this.body.ymom = 0 - (this.body.y - to.y)
            let k = 0

            // if(Math.sqrt(Math.abs(this.body.xmom*this.body.xmom)+Math.abs(this.body.ymom*this.body.ymom)) != 0){
            while (Math.sqrt(Math.abs(this.body.xmom * this.body.xmom) + Math.abs(this.body.ymom * this.body.ymom)) > 4) {
                this.body.xmom *= 0.98
                this.body.ymom *= 0.98

                k++
                if (k > 1000) {
                    break
                }
            }
            k = 0
            while (Math.sqrt(Math.abs(this.body.xmom * this.body.xmom) + Math.abs(this.body.ymom * this.body.ymom)) < 4) {
                this.body.xmom *= 1.02
                this.body.ymom *= 1.02

                k++
                if (k > 1000) {
                    break
                }
            }
            // }
        }
        draw() {
            // this.end.x = this.body.x - (10 * this.body.xmom)
            // this.end.y = this.body.y - (10 * this.body.ymom)
            // this.link = new LineOP(this.end, this.body, "black", 4)

            // this.shaft = castBetween(this.end, this.body)
            // this.link.draw()
            if (this.engage == 0) {
                // this.end.draw()
                this.body.draw()
            } else {

                if (this.life1 == 1) {

                    this.body1.draw()
                }
                if (this.life2 == 1) {

                    this.body2.draw()
                }

            }
            if (Math.round(this.life) == 0) {
                if (this.engage == 0) {
                    this.life += 50
                }
                this.engage = 1
                this.body1 = new Circle(this.body.x, this.body.y, 5, "purple")
                this.body1.xmom = this.body.ymom
                this.body1.ymom = -this.body.xmom
                this.body2 = new Circle(this.body.x, this.body.y, 5, "purple")
                this.body2.xmom = -this.body.ymom
                this.body2.ymom = this.body.xmom
            }
        }
        move() {
            if (this.engage == 0) {
                this.body.move()
            } else {
                this.body.x = 1000000
                this.body.y = 1000000
                this.end.x = 1000001
                this.end.y = 1000002
                if (this.life1 == 1) {
                    this.body1.move()
                }
                if (this.life2 == 1) {
                    this.body2.move()
                }
            }
        }
    }

    class Orb {
        constructor(from, to, owner) {
            this.body = new Circle(from.x, from.y, 5, "purple", 0, 0)
            this.life = 70
            if (owner == players[0]) {
                to.x = this.body.x + (to.x - (canvas.width * .5))
                to.y = this.body.y + (to.y - (canvas.height * .5))
                this.body.color = "#00ff00"
            } else {
                this.body.color = "#FF0000"
            }


            this.body.xmom = 0 - (this.body.x - to.x)
            this.body.ymom = 0 - (this.body.y - to.y)

            let k = 0
            // if(Math.sqrt(Math.abs(this.body.xmom*this.body.xmom)+Math.abs(this.body.ymom*this.body.ymom)) != 0){
            while (Math.sqrt(Math.abs(this.body.xmom * this.body.xmom) + Math.abs(this.body.ymom * this.body.ymom)) > 5.5) {
                this.body.xmom *= 0.98
                this.body.ymom *= 0.98
                k++
                if (k > 1000) {
                    break
                }

            }
            k = 0
            while (Math.sqrt(Math.abs(this.body.xmom * this.body.xmom) + Math.abs(this.body.ymom * this.body.ymom)) < 5.5) {
                this.body.xmom *= 1.02
                this.body.ymom *= 1.02

                k++
                if (k > 1000) {
                    break
                }
            }
            // }
        }
        draw() {
            this.body.draw()
        }
        move() {
            this.body.move()
        }


    }
    class MissileOrb {
        constructor(from, to, owner) {
            this.body = new Circle(from.x, from.y, 4.25, "purple", 0, 0)
            this.life = 35
            if (owner == players[0]) {
                to.x = this.body.x + (to.x - (canvas.width * .5))
                to.y = this.body.y + (to.y - (canvas.height * .5))
                this.body.color = "black"
            } else {
                this.body.color = "black"
            }

            this.touch = new Circle(to.x, to.y, 25, "red")

            //console.log(this.body)

            this.body.xmom = 0 - (this.body.x - this.touch.x)
            this.body.ymom = 0 - (this.body.y - this.touch.y)

            let k = 0
            // if(Math.sqrt(Math.abs(this.body.xmom*this.body.xmom)+Math.abs(this.body.ymom*this.body.ymom)) != 0){
            while (Math.sqrt(Math.abs(this.body.xmom * this.body.xmom) + Math.abs(this.body.ymom * this.body.ymom)) > 8.5) {
                this.body.xmom *= 0.98
                this.body.ymom *= 0.98
                k++
                if (k > 1000) {
                    break
                }

            }
            k = 0
            while (Math.sqrt(Math.abs(this.body.xmom * this.body.xmom) + Math.abs(this.body.ymom * this.body.ymom)) < 8.5) {
                this.body.xmom *= 1.02
                this.body.ymom *= 1.02

                k++
                if (k > 1000) {
                    break
                }
            }
            // }
        }
        draw() {
            this.body.draw()
            // this.touch.draw()
        }
        move() {
            this.body.move()
        }
        unmove() {
            this.body.unmove()
        }


    }
    class PullOrb {
        constructor(from, to, owner) {
            this.body = new Circle(from.x, from.y, 10, "purple", 0, 0)
            this.life = 70
            if (owner == players[0]) {
                to.x = this.body.x + (to.x - (canvas.width * .5))
                to.y = this.body.y + (to.y - (canvas.height * .5))
                this.body.color = "pink"
            } else {
                this.body.color = "pink"
            }


            this.lobe = new Circle(0, 0, 4, 'magenta')
            this.lobe2 = new Circle(0, 0, 4, 'magenta')
            this.base = new Circle(0, 0, 4, 'magenta')
            this.body.xmom = 0 - (this.body.x - to.x)
            this.body.ymom = 0 - (this.body.y - to.y)

            let k = 0
            // if(Math.sqrt(Math.abs(this.body.xmom*this.body.xmom)+Math.abs(this.body.ymom*this.body.ymom)) != 0){
            while (Math.sqrt(Math.abs(this.body.xmom * this.body.xmom) + Math.abs(this.body.ymom * this.body.ymom)) > 2.5) {
                this.body.xmom *= 0.98
                this.body.ymom *= 0.98
                k++
                if (k > 1000) {
                    break
                }

            }
            k = 0
            while (Math.sqrt(Math.abs(this.body.xmom * this.body.xmom) + Math.abs(this.body.ymom * this.body.ymom)) < 2.5) {
                this.body.xmom *= 1.02
                this.body.ymom *= 1.02

                k++
                if (k > 1000) {
                    break
                }
            }
            // }
        }
        draw() {
            this.lobe.x = this.body.x + 4
            this.lobe.y = this.body.y - 5
            this.lobe2.x = this.body.x - 4
            this.lobe2.y = this.body.y - 5
            this.base.x = this.body.x
            this.base.y = this.body.y + 2
            let link = new LineOP(this.lobe, this.base, "magenta", 10)
            let link2 = new LineOP(this.lobe2, this.base, "magenta", 10)
            link.draw()
            link2.draw()
            this.lobe.draw()
            this.lobe2.draw()
            this.base.draw()
        }
        move() {
            this.body.move()
        }


    }


    class Firespin {
        constructor(from, to, owner, angle) {
            this.body = new Circle(from.x, from.y, 3, "purple", 0, 0)
            this.life = 70
            if (owner == players[0]) {
                to.x = this.body.x + (to.x - (canvas.width * .5))
                to.y = this.body.y + (to.y - (canvas.height * .5))
                this.body.color = "cyan"
            } else {
                this.body.color = "red"
            }

            this.spin = .1
            this.range = 50
            this.active = 0
            this.speed = 3

            this.angle = angle
            this.owner = owner
            this.rotdis = this.owner.body.radius * 2

            this.movereducer = 0

            this.body.xmom = 0 - (this.body.x - to.x)
            this.body.ymom = 0 - (this.body.y - to.y)

            let k = 0
            // if(Math.sqrt(Math.abs(this.body.xmom*this.body.xmom)+Math.abs(this.body.ymom*this.body.ymom)) != 0){
            while (Math.sqrt(Math.abs(this.body.xmom * this.body.xmom) + Math.abs(this.body.ymom * this.body.ymom)) > 5.5) {
                this.body.xmom *= 0.98
                this.body.ymom *= 0.98
                k++
                if (k > 1000) {
                    break
                }

            }
            k = 0
            while (Math.sqrt(Math.abs(this.body.xmom * this.body.xmom) + Math.abs(this.body.ymom * this.body.ymom)) < 5.5) {
                this.body.xmom *= 1.02
                this.body.ymom *= 1.02

                k++
                if (k > 1000) {
                    break
                }
            }
            // }
        }
        draw() {
            this.body.draw()
        }
        move() {
            if (this.active < 1) {
                this.body.x = this.owner.body.x + (Math.cos(this.angle) * this.rotdis)
                this.body.y = this.owner.body.y + (Math.sin(this.angle) * this.rotdis)
                this.angle += this.spin
                this.activate()
            } else {
                this.normalize()
                this.body.move()
                if (this.target.doesPerimeterTouch(this.body)) {
                    this.body.color = "transparent"
                }
            }
        }
        normalize() {
            this.movereducer -= .1
            let k = 0

            this.body.xmom = 0 - (this.body.x - this.target.x)
            this.body.ymom = 0 - (this.body.y - this.target.y)

            while (Math.sqrt(Math.abs(this.body.xmom * this.body.xmom) + Math.abs(this.body.ymom * this.body.ymom)) > this.speed - this.movereducer) {
                this.body.xmom *= 0.98
                this.body.ymom *= 0.98
                k++
                if (k > 1000) {
                    break
                }

            }
            k = 0
            while (Math.sqrt(Math.abs(this.body.xmom * this.body.xmom) + Math.abs(this.body.ymom * this.body.ymom)) < this.speed - this.movereducer) {
                this.body.xmom *= 1.02
                this.body.ymom *= 1.02

                k++
                if (k > 1000) {
                    break
                }
            }
        }
        activate() {

            for (let t = 0; t < players.length; t++) {
                if (players[t] != this.owner) {
                    for (let k = 0; k < players[t].army.length; k++) {
                        let link = new LineOP(this.body, players[t].army[k].body)
                        if (link.hypotenuse() < this.range) {
                            this.target = players[t].army[k].body
                            this.active = 1
                        }
                        let link2 = new LineOP(this.body, players[t].body)
                        if (link2.hypotenuse() <= this.range) {
                            this.target = players[t].body
                            this.active = 1
                        }
                    }
                }
            }
        }
    }

    class Fireorb {
        constructor(from, to, owner) {
            this.body = new Circle(from.x, from.y, 9, "purple", 0, 0)
            this.lifemax = 100
            this.movereducer = 0
            this.speed = 6
            this.owner = owner
            this.life = this.lifemax
            if (owner == players[0]) {
                to.x = this.body.x + (to.x - (canvas.width * .5))
                to.y = this.body.y + (to.y - (canvas.height * .5))
                this.body.color = "#00AAFF"
            } else {
                this.body.color = "#00FFAA"
            }
            this.body.xmom = 0 - (this.body.x - to.x)
            this.body.ymom = 0 - (this.body.y - to.y)
            let k = 0
            while (Math.sqrt(Math.abs(this.body.xmom * this.body.xmom) + Math.abs(this.body.ymom * this.body.ymom)) > this.speed) {
                this.body.xmom *= 0.98
                this.body.ymom *= 0.98
                k++
                if (k > 1000) {
                    break
                }

            }
            k = 0
            while (Math.sqrt(Math.abs(this.body.xmom * this.body.xmom) + Math.abs(this.body.ymom * this.body.ymom)) < this.speed) {
                this.body.xmom *= 1.02
                this.body.ymom *= 1.02

                k++
                if (k > 1000) {
                    break
                }
            }
        }
        draw() {
            this.body.draw()
        }
        normalize() {
            let k = 0
            while (Math.sqrt(Math.abs(this.body.xmom * this.body.xmom) + Math.abs(this.body.ymom * this.body.ymom)) > this.speed - this.movereducer) {
                this.body.xmom *= 0.98
                this.body.ymom *= 0.98
                k++
                if (k > 1000) {
                    break
                }
            }
            k = 0
            while (Math.sqrt(Math.abs(this.body.xmom * this.body.xmom) + Math.abs(this.body.ymom * this.body.ymom)) < this.speed - this.movereducer) {
                this.body.xmom *= 1.02
                this.body.ymom *= 1.02
                k++
                if (k > 1000) {
                    break
                }
            }
        }
        move() {
            if (this.life < this.lifemax * .55) {
                this.body.xmom = 0 - (this.body.x - this.owner.body.x)
                this.body.ymom = 0 - (this.body.y - this.owner.body.y)
                this.movereducer -= this.speed / (this.lifemax)
                this.normalize()
                this.body.move()
                if (this.body.doesPerimeterTouch(this.owner.body)) {
                    this.life = 0
                }
            } else {
                this.movereducer += this.speed / (this.lifemax)
                this.normalize()
                this.body.move()
            }
        }
    }

    class Canisterorb {
        constructor(from, to, owner) {
            this.body = new Circle(from.x, from.y, 9, "purple", 0, 0)
            this.lifemax = 100
            this.movereducer = 0
            this.speed = 8
            this.owner = owner
            this.life = this.lifemax
            this.delay = 0
            this.smack = 1
            this.range = this.owner.canisterrange
            if (owner == players[0]) {
                to.x = this.body.x + (to.x - (canvas.width * .5))
                to.y = this.body.y + (to.y - (canvas.height * .5))
                this.body.color = "#885555"
            } else {
                this.body.color = "#555588"
            }
            this.to = to
            this.to.radius = 10
            // this.to.body = to // remove this if you swap in an object with a body
            this.body.xmom = 0 - (this.body.x - this.to.body.x)
            this.body.ymom = 0 - (this.body.y - this.to.body.y)
            let k = 0
            while (Math.sqrt(Math.abs(this.body.xmom * this.body.xmom) + Math.abs(this.body.ymom * this.body.ymom)) > this.speed) {
                this.body.xmom *= 0.98
                this.body.ymom *= 0.98
                k++
                if (k > 1000) {
                    break
                }

            }
            k = 0
            while (Math.sqrt(Math.abs(this.body.xmom * this.body.xmom) + Math.abs(this.body.ymom * this.body.ymom)) < this.speed) {
                this.body.xmom *= 1.02
                this.body.ymom *= 1.02

                k++
                if (k > 1000) {
                    break
                }
            }

            this.targets = [this.to]
        }
        draw() {
            this.body.draw()
        }
        changeTargets() {
            if (this.body.doesPerimeterTouch(this.to.body)) {
                this.to.health -= this.owner.cannisterdamage*this.smack
                if(this.to.health <= 0){
                    this.smack+=1
                }
                let wet = 0
                for (let t = 0; t < players.length; t++) {
                    if (players[t] != this.owner) {
                        for (let k = 0; k < players[t].army.length; k++) {
                            let link = new LineOP(this.body, players[t].army[k].body)
                            if (link.hypotenuse() < this.range) {
                                if (this.to != players[t].army[k]) {
                                    if (!this.targets.includes(players[t].army[k])) {
                                        this.targets.push(players[t].army[k])
                                        this.to = players[t].army[k]
                                        wet = 1
                                        break
                                    }
                                }
                            }
                        }
                    }
                }
                for (let t = 0; t < players.length; t++) {
                    if (players[t] != this.owner) {
                        let link = new LineOP(this.body, players[t].body)
                        if (link.hypotenuse() < this.range) {
                            if (this.to != players[t]) {
                                if (!this.targets.includes(players[t])) {
                                    this.targets.push(players[t])
                                    this.to = players[t]
                                    wet = 1
                                    break
                                }
                            }
                        }
                    }
                }

                if (wet == 1) {
                    this.life += 100
                    let link = new LineOP(this.body, this.to.body)
                    this.speed = link.hypotenuse() / 40
                    this.delay = 0
                } else {
                    this.life = 0
                }
                if(this.targets.length > 4){
                    this.life = 0
                }
            }




        }
        normalize() {

            this.changeTargets()
            this.body.xmom = 0 - (this.body.x - this.to.body.x)
            this.body.ymom = 0 - (this.body.y - this.to.body.y)
            this.movereducer = 0
            let k = 0
            while (Math.sqrt(Math.abs(this.body.xmom * this.body.xmom) + Math.abs(this.body.ymom * this.body.ymom)) > this.speed - this.movereducer) {
                this.body.xmom *= 0.98
                this.body.ymom *= 0.98
                k++
                if (k > 1000) {
                    break
                }
            }
            k = 0
            while (Math.sqrt(Math.abs(this.body.xmom * this.body.xmom) + Math.abs(this.body.ymom * this.body.ymom)) < this.speed - this.movereducer) {
                this.body.xmom *= 1.02
                this.body.ymom *= 1.02
                k++
                if (k > 1000) {
                    break
                }
            }
        }
        move() {
            this.normalize()
            if (this.delay <= 0) {
                this.body.move()
            } else {
                this.delay--
            }

        }
    }

    class Hook {
        constructor(from, to, owner) {
            this.body = new Circle(from.x, from.y, 9, "purple", 0, 0)
            this.life = 30
            if (owner == players[0]) {
                to.x = this.body.x + (to.x - (canvas.width * .5))
                to.y = this.body.y + (to.y - (canvas.height * .5))
                this.body.color = "#00ff00"
            } else {
                this.body.color = "#FF0000"
            }

            this.owner = owner

            this.body.xmom = 0 - (this.body.x - to.x)
            this.body.ymom = 0 - (this.body.y - to.y)

            let k = 0
            // if(Math.sqrt(Math.abs(this.body.xmom*this.body.xmom)+Math.abs(this.body.ymom*this.body.ymom)) != 0){
            while (Math.sqrt(Math.abs(this.body.xmom * this.body.xmom) + Math.abs(this.body.ymom * this.body.ymom)) > 8.5) {
                this.body.xmom *= 0.98
                this.body.ymom *= 0.98
                k++
                if (k > 1000) {
                    break
                }

            }
            k = 0
            while (Math.sqrt(Math.abs(this.body.xmom * this.body.xmom) + Math.abs(this.body.ymom * this.body.ymom)) < 8.5) {
                this.body.xmom *= 1.02
                this.body.ymom *= 1.02

                k++
                if (k > 1000) {
                    break
                }
            }
            // }
        }
        draw() {
            this.link = new LineOP(this.body, this.owner.body, this.body.color, 2)
            this.link.draw()
            this.body.draw()
        }
        move() {
            this.body.move()
        }


    }

    class Stunorb {
        constructor(from, to, owner) {
            this.body = new Circle(from.x, from.y, 9, "purple", 0, 0)
            this.life = 54
            if (owner == players[0]) {
                to.x = this.body.x + (to.x - (canvas.width * .5))
                to.y = this.body.y + (to.y - (canvas.height * .5))
                this.body.color = "Blue"
            } else {
                this.body.color = "Blue"
            }

            this.owner = owner

            this.body.xmom = 0 - (this.body.x - to.x)
            this.body.ymom = 0 - (this.body.y - to.y)

            let k = 0
            // if(Math.sqrt(Math.abs(this.body.xmom*this.body.xmom)+Math.abs(this.body.ymom*this.body.ymom)) != 0){
            while (Math.sqrt(Math.abs(this.body.xmom * this.body.xmom) + Math.abs(this.body.ymom * this.body.ymom)) > 2.5) {
                this.body.xmom *= 0.98
                this.body.ymom *= 0.98
                k++
                if (k > 1000) {
                    break
                }

            }
            k = 0
            while (Math.sqrt(Math.abs(this.body.xmom * this.body.xmom) + Math.abs(this.body.ymom * this.body.ymom)) < 2.5) {
                this.body.xmom *= 1.02
                this.body.ymom *= 1.02

                k++
                if (k > 1000) {
                    break
                }
            }
            // }
        }
        draw() {
            // this.link = new LineOP(this.body, this.owner.body, this.body.color, 2)
            // this.link.draw()
            this.body.draw()
        }
        move() {
            this.body.move()
        }


    }
    class Pincushion {
        constructor(x, y, color) {

            this.speedboost = 0
            this.dashtarget = {}
            this.locked = 0
            this.gold = 500
            this.goldvalue = 300
            this.body = new Circle(x, y, 10, color)
            this.movespeedbase = 1
            this.trapdrop = -.99
            this.speedbonus = 0
            this.health = 500
            this.healthmax = this.health
            this.mana = 300
            this.manamax = this.mana
            this.moveto = {}
            this.moveto.x = this.body.x - 1.01
            this.moveto.y = this.body.y
            this.traps = []
            this.spears = []
            this.spearcost = 29
            this.speardamage = 210
            this.spearcooldown = 0
            this.speardrain = 180
            this.healcooldown = 0
            this.healdrain = 120
            this.healcost = 50
            this.trapdamage = 40
            this.trapcooldown = 0
            this.trapdrain = 280
            this.trapcost = 30
            this.mps = .1
            this.hps = .15
            this.traprange = 100
            this.healpower = 150
            this.army = []
            this.spawner = 0
            this.spawnpoint = new Point(this.body.x, this.body.y)
            this.gasbag = 0
            this.blindmonk = 0
            this.robofister = 0
            this.pincushion = 1
            this.aliensquid = 0
            this.basicrate = 50
            this.basictimer = 0
            this.basicrange = 78
            this.basictarget = {}
            this.basicdamage = 55
        }
        marshal() {
            if (this.spawner % 1000 == 20) {
                let minion = new Mob(this.base.body.x, this.base.body.y, this)
                this.army.push(minion)
            }
            if (this.spawner % 1000 == 40) {
                let minion = new Mob(this.base.body.x, this.base.body.y, this)
                this.army.push(minion)
            }
            if (this.spawner % 1000 == 60) {
                let minion = new Mob(this.base.body.x, this.base.body.y, this)
                this.army.push(minion)
            }
            if (this.spawner % 1000 == 80) {
                let minion = new Mob(this.base.body.x, this.base.body.y, this)
                this.army.push(minion)
            }
            if (this.spawner % 1000 == 100) {
                let minion = new Mob(this.base.body.x, this.base.body.y, this)
                this.army.push(minion)
            }
            this.spawner++
            this.command()
            this.burial()
        }
        command() {
            for (let t = 0; t < this.army.length; t++) {
                this.army[t].drawbar()
            }
            for (let t = 0; t < this.army.length; t++) {
                this.army[t].draw()
            }
            for (let t = 0; t < this.army.length; t++) {
                this.army[t].drawbar()
            }
        }
        burial() {
            for (let t = 0; t < this.army.length; t++) {
                if (this.army[t].health <= 0) {
                    this.army.splice(t, 1)
                }
            }
            for (let t = 0; t < this.army.length; t++) {
                this.army[t].drawbar()
            }

        }
        cooldown() {
            this.spearcooldown--
            this.healcooldown--
            this.trapcooldown--
        }
        regen() {
            this.marshal()
            if (this.health > 0) {
                this.mana += this.mps
                this.health += this.hps
                if (this.health > this.healthmax) {
                    this.health = this.healthmax
                }
                if (this.mana > this.manamax) {
                    this.mana = this.manamax
                }
            } else {
                if (this == players[0]) {
                    canvas_context.translate(this.body.x - this.spawnpoint.x, this.body.y - this.spawnpoint.y)
                }
                this.health = this.healthmax
                this.mana = this.manamax
                this.body.y = this.spawnpoint.y
                this.body.x = this.spawnpoint.x
                this.moveto.x = this.body.x + 1
                this.moveto.y = this.body.y + 1
                this.speedbonus = 0
            }
            this.speedbonus *= .997
        }
        control(to) {
            if (this.locked <= 0) {
                if (this == players[0]) {
                    this.moveto.x = this.body.x + (to.x - (canvas.width * .5))
                    this.moveto.y = this.body.y + (to.y - (canvas.height * .5))
                } else {
                    this.moveto.x = to.x
                    this.moveto.y = to.y
                }
            }
            if (this.body.doesPerimeterTouch(this.dashtarget)) {
                this.locked = 0
            }
            if (Math.round(this.locked) == 0) {
                this.speedbonus = 0
            }
        }
        drive() {
            if (typeof this.speedbonus == "undefined") {
                this.speedbonus = 0
            }
            if (this.locked <= 0 || this.locked == this.lockholder) {
                this.body.xmom = 0 - (this.body.x - this.moveto.x)
                this.body.ymom = 0 - (this.body.y - this.moveto.y)

                // if(Math.sqrt(Math.abs(this.body.xmom*this.body.xmom)+Math.abs(this.body.ymom*this.body.ymom)) != 0){
                let k = 0
                while (Math.sqrt(Math.abs(this.body.xmom * this.body.xmom) + Math.abs(this.body.ymom * this.body.ymom)) > (this.movespeedbase + this.speedbonus)) {
                    this.body.xmom *= 0.98
                    this.body.ymom *= 0.98
                    if (k == 10000) {
                        break
                    }
                }
                k = 0
                while (Math.sqrt(Math.abs(this.body.xmom * this.body.xmom) + Math.abs(this.body.ymom * this.body.ymom)) < (this.movespeedbase + this.speedbonus)) {
                    this.body.xmom *= 1.02
                    this.body.ymom *= 1.02
                    if (k == 10000) {
                        break
                    }
                }
            }
            if (this.body.doesPerimeterTouch(this.dashtarget)) {
                this.locked = 0
            }
            if (Math.round(this.locked) == 0) {
                this.speedbonus = 0
            }
        }
        gamepadSkillsAdapter(to) {

            let towards = new Point(0, 0)
            towards.x = (Math.cos(gamepad_angles().left) * 100) + 360
            towards.y = (Math.sin(gamepad_angles().left) * 100) + 360

            let link = new LineOP(this.body, towards)
            link.draw()

            if (gamepadAPI.buttonsStatus.includes('Left-Trigger')) {
                this.spear(towards)
            }
            if (gamepadAPI.buttonsStatus.includes('Right-Trigger')) {
                this.trap(towards)
            }
            if (gamepadAPI.buttonsStatus.includes('RB')) {
                this.heal()
            }
        }
        skillsAdapter(to) {
            if (this == players[0]) {
                if (keysPressed['q']) {
                    this.spear(to)
                }
                if (keysPressed['w']) {
                    this.heal()
                }
                if (keysPressed['e']) {
                    this.trap(to)
                }
            } else {
                let fuzz = {}
                fuzz.x = ((Math.random() - .5) * 10) + players[0].body.x
                fuzz.y = ((Math.random() - .5) * 10) + players[0].body.y
                if (Math.random() < .01) {
                    // let wet = 0
                    // for(let t =0;t<players.length;t++){
                    //     if(lthis != players[t]){
                    //     let link = new LineOp(this.body, players[t].body)
                    //     if(link.hypotenuse() < 730){
                    //         wet = 1
                    //     }
                    // }
                    // }
                    // if(wet == 1){
                    this.spear(fuzz)
                    // }
                }

                if (this.mana > this.healcost + Math.max(this.spearcost, this.trapcost)) {
                    if (Math.random() < .003) {
                        if (this.health < this.maxhealth - this.healpower) {
                            this.heal()
                        }
                    }
                }
                fuzz.x = ((Math.random() - .5) * 100) + this.body.x
                fuzz.y = ((Math.random() - .5) * 100) + this.body.y
                if (!beam1.isPointInside(fuzz) && !beam2.isPointInside(fuzz)) {
                    if (Math.random() < .005) {
                        this.trap(fuzz)
                    }
                }
            }

        }
        spear(to) {
            if (this.mana > this.spearcost) {
                if (this.spearcooldown <= 0) {
                    let pin = new Pin(this.body, to, this)
                    this.spears.push(pin)
                    this.spearcooldown = this.speardrain
                    this.mana -= this.spearcost
                }
            }

        }
        speardraw() {
            for (let t = 0; t < this.spears.length; t++) {
                this.spears[t].move()
                this.spears[t].draw()
                this.spears[t].life--
            }
            for (let t = 0; t < this.spears.length; t++) {
                if (this.spears[t].life <= 0) {
                    this.spears.splice(t, 1)
                }
            }


        }
        trapdraw() {
            for (let t = 0; t < this.traps.length; t++) {
                this.traps[t].draw()
                this.traps[t].life--
            }
            for (let t = 0; t < this.traps.length; t++) {
                if (this.traps[t].life <= 0) {
                    this.traps.splice(t, 1)
                }
            }


        }
        heal() {

            if (this.mana > this.healcost) {
                if (this.healcooldown <= 0) {
                    this.health += this.healpower
                    this.healcooldown = this.healdrain
                    this.mana -= this.healcost
                }
            }


        }
        trap(to) {
            if (this == players[0]) {
                to.x = this.body.x + (to.x - (canvas.width * .5))
                to.y = this.body.y + (to.y - (canvas.height * .5))
            }
            let trap = new Trap(this.body, to, this)
            let wet = 0
            for (let t = 0; t < players.length; t++) {
                if (players[t].body.doesPerimeterTouch(trap.body)) {
                    wet = 1
                }
            }
            if (this.trapcooldown <= 0) {
                let link = new LineOP(this.body, to)
                if (link.hypotenuse() < this.traprange) {
                    if (this.mana >= this.trapcost) {
                    } else {
                        wet = 1
                    }
                } else {
                    wet = 1
                }
            } else {
                wet = 1
            }
            if (wet == 0) {

                this.traps.push(trap)
                this.mana -= this.trapcost
                this.trapcooldown = this.trapdrain
            }



        }
        draw() {

            if (this == players[0]) {
                canvas_context.fillStyle = "gold"
                canvas_context.font = "20px arial"
                canvas_context.fillText(`${this.gold}`, this.body.x - 340, this.body.y - 340)
            }

            if (this == players[0]) {
                let towards = new Point(0, 0)
                if (players[0].pincushion == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 100) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 100) + this.body.y
                } else if (players[0].gasbag == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 50) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 50) + this.body.y
                } else if (players[0].blindmonk == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 100) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 100) + this.body.y
                } else if (players[0].robofister == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 200) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 200) + this.body.y
                } else if (players[0].foxghost == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 120) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 120) + this.body.y
                } else if (players[0].aliensquid == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 120) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 120) + this.body.y
                }

                let link = new LineOP(this.body, towards, "white", 1)
                link.draw()
            }

            this.regen()
            this.drive()
            this.locked--
            let check = new LineOP(this.moveto, this.body)
            if (check.hypotenuse() > (.7 * (this.movespeedbase + this.speedbonus))) {
                this.body.move()
            } else if (this.locked > 0) {
                this.body.move()
            }
            this.trapdraw()

            if (keysPressed['e']) {
                if (this == players[0]) {
                    let circ = new Circle(this.body.x, this.body.y, this.traprange, "black")
                    canvas_context.strokeStyle = circ.color
                    canvas_context.beginPath()
                    canvas_context.arc(circ.x, circ.y, circ.radius, 0, Math.PI * 2, true)
                    canvas_context.stroke()
                    canvas_context.closePath()
                }
            }
            this.body.draw()
            this.basic()
            this.healthbar = new Rectangle(this.body.x - this.body.radius, this.body.y - (this.body.radius * 2), this.body.radius * 2, this.body.radius * .25, "green")
            this.healthbar.width = (this.health / this.healthmax) * this.body.radius * 2
            this.manabar = new Rectangle(this.body.x - this.body.radius, this.body.y - (this.body.radius * 1.6), this.body.radius * 2, this.body.radius * .25, "blue")
            this.manabar.width = (this.mana / this.manamax) * this.body.radius * 2
            this.healthbar.draw()
            this.manabar.draw()
            this.speardraw()
            this.cooldown()
            this.collide()
        }
        basic() {
            this.basictimer++
            let min = this.basicrange
            this.basictarget = {}
            for (let t = 0; t < players.length; t++) {
                if (players[t] != this) {
                    for (let k = 0; k < players[t].army.length; k++) {
                        let link = new LineOP(this.body, players[t].army[k].body)
                        if (link.hypotenuse() <= min) {
                            min = link.hypotenuse()
                            this.basictarget = players[t].army[k]
                        }
                        let link2 = new LineOP(this.body, players[t].body)
                        if (link2.hypotenuse() <= this.basicrange) {
                            this.basictarget = players[t]
                        }
                    }
                }
            }

            this.basicAttack()
        }
        basicAttack() {
            if (this.basictarget.health > 0) {
                if (this.basictimer % this.basicrate == 0) {
                    this.basictarget.health -= this.basicdamage
                }
                if (this.basictimer % this.basicrate <= 9) {
                    let link = new LineOP(this.body, this.basictarget.body, "black", 4)
                    link.draw()
                }
            }
        }
        collide() {
            for (let t = 0; t < players.length; t++) {
                if (this != players[t]) {
                    if (players[t].gasbag == 1) {
                        for (let k = 0; k < players[t].gasses.length; k++) {
                            if (players[t].gasses[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].gasdamage)
                            }
                        }
                        for (let k = 0; k < players[t].glues.length; k++) {
                            if (players[t].glues[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].gluedamage)
                                this.speedbonus = players[t].gluedrop
                            }
                        }
                    } else if (players[t].pincushion == 1) {
                        for (let k = 0; k < players[t].spears.length; k++) {
                            if (players[t].spears[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].speardamage - (players[t].spears[k].life))
                                players[t].spears[k].life = 0
                            } else if (players[t].spears[k].shaft.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].speardamage - (players[t].spears[k].life))
                                players[t].spears[k].life = 0
                            }
                        }
                        for (let k = 0; k < players[t].traps.length; k++) {
                            if (players[t].traps[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].trapdamage)
                                this.speedbonus = players[t].trapdrop
                                players[t].traps[k].life = 0
                            }
                        }
                    } else if (players[t].blindmonk == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                this.speedbonus = players[t].slamdrop
                            }
                        }
                        for (let k = 0; k < players[t].orblist.length; k++) {
                            if (players[t].orblist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].orbdamage)
                                players[t].dashtarget.x = this.body.x
                                players[t].dashtarget.y = this.body.y
                                players[t].dashstate = 1
                                players[t].orblist[k].life = 0
                            }
                        }
                    } else if (players[t].robofister == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                this.speedbonus = players[t].slamdrop
                            }
                        }
                        for (let k = 0; k < players[t].hooklist.length; k++) {
                            if (players[t].hooklist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].hookdamage)
                                this.dashtarget.x = players[t].body.x
                                this.dashtarget.y = players[t].body.y
                                this.moveto.x = players[t].body.x
                                this.moveto.y = players[t].body.y
                                this.moveto.radius = players[t].body.radius
                                this.speedbonus = 7
                                let link = new LineOP(this.body, this.dashtarget)
                                let hookdot = (link.hypotenuse()) / (this.movespeedbase + this.speedbonus)
                                this.locked = Math.round(hookdot)
                                ////console.log(this.locked)
                                this.lockholder = Math.round(hookdot)
                                players[t].hooklist[k].life = 0
                                ////console.log(this)
                            }
                        }
                    } else if (players[t].aliensquid == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                this.speedbonus = players[t].slamdrop
                            }
                        }
                        for (let k = 0; k < players[t].spears.length; k++) {
                            if (players[t].spears[k].engage == 0) {
                                if (players[t].spears[k].body.doesPerimeterTouch(this.body)) {
                                    this.health -= players[t].speardamage
                                    players[t].spears[k].life = 0
                                }
                            } else {
                                if (players[t].spears[k].body1.doesPerimeterTouch(this.body)) {
                                    if (players[t].spears[k].life1 != 0) {
                                        this.health -= players[t].speardamage
                                        players[t].spears[k].life1 = 0
                                    }
                                }
                                if (players[t].spears[k].body2.doesPerimeterTouch(this.body)) {
                                    if (players[t].spears[k].life2 != 0) {
                                        this.health -= players[t].speardamage
                                        players[t].spears[k].life2 = 0
                                    }
                                }
                            }
                        }
                    } else if (players[t].foxghost == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                players[t].slamdamage = 0
                                players[t].theftcount++
                                if (players[t].theftcount >= 9) {
                                    players[t].theftcount = 0
                                    players[t].health += players[t].theftbonus
                                }
                            }
                        }
                        for (let k = 0; k < players[t].orblist.length; k++) {
                            if (players[t].orblist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].orbdamage)
                                players[t].theftcount++
                                if (players[t].theftcount >= 9) {
                                    players[t].theftcount = 0
                                    players[t].health += players[t].theftbonus
                                }
                            }
                        }
                        for (let k = 0; k < players[t].hooklist.length; k++) {
                            if (players[t].hooklist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].hookdamage)
                                this.dashtarget.x = players[t].body.x
                                this.dashtarget.y = players[t].body.y
                                this.moveto.x = players[t].body.x
                                this.moveto.y = players[t].body.y
                                this.moveto.radius = players[t].body.radius
                                this.speedbonus = 7
                                let link = new LineOP(this.body, this.dashtarget)
                                let hookdot = ((link.hypotenuse()) / (this.movespeedbase + this.speedbonus)) * 2
                                this.speedbonus = -.4
                                this.locked = Math.round(hookdot)
                                this.lockholder = Math.round(hookdot)
                                players[t].hooklist[k].life = 0
                                players[t].theftcount++
                                if (players[t].theftcount >= 9) {
                                    players[t].theftcount = 0
                                    players[t].health += players[t].theftbonus
                                }
                            }
                        }
                    } else if (players[t].demontaur == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                players[t].health += (players[t].slamdamage) * .2
                            }
                        }
                        for (let k = 0; k < players[t].orblist.length; k++) {
                            if (players[t].orblist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].orbdamage)
                            }
                        }
                    } else if (players[t].inventrix == 1) {
                        for (let k = 0; k < players[t].hooklist.length; k++) {
                            if (players[t].hooklist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].hookdamage)
                                this.dashtarget.x = players[t].body.x
                                this.dashtarget.y = players[t].body.y
                                this.moveto.x = players[t].body.x
                                this.moveto.y = players[t].body.y
                                this.moveto.radius = players[t].body.radius
                                this.speedbonus = (-1 * (this.movespeedbase + this.speedboost)) + .0000001
                                let hookdot = 200
                                this.locked = Math.round(hookdot)
                                this.lockholder = Math.round(hookdot)
                                players[t].hooklist[k].life = 0
                            }
                        }
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                players[t].health += (players[t].slamdamage) * .2
                            }
                        }
                        for (let k = 0; k < players[t].orblist.length; k++) {
                            if (players[t].orblist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].orbdamage)
                                players[t].orblist[k].life = 0
                            }
                        }
                    }else if (players[t].artsassin == 1) {
                        for (let k = 0; k < players[t].spears.length; k++) {
                                if (players[t].spears[k].body.doesPerimeterTouch(this.body)) {
                                    this.health -= players[t].speardamage
                                    
                                this.speedbonus = (-1 * (this.movespeedbase + this.speedboost)) + .0000001
                                let hookdot = 200
                                this.locked = Math.round(hookdot)
                                this.lockholder = Math.round(hookdot)
                                }
                        }
                        for (let k = 0; k < players[t].traps.length; k++) {
                            if (players[t].traps[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].trapdamage)
                                this.speedbonus = (-1 * (this.movespeedbase + this.speedboost)) + .0000001
                                let hookdot = 200
                                this.locked = Math.round(hookdot)
                                this.lockholder = Math.round(hookdot)
                                players[t].traps[k].life = 0
                            }
                        }
                    }
                }
            }


        }

    }

    class Aliensquid {
        constructor(x, y, color) {

            this.slamcost = 25
            this.slamdamage = 5
            this.slamcooldown = 0
            this.slamdrain = 300
            this.slams = []
            this.slamdrop = 0
            this.speedboost = 0
            this.dashtarget = {}
            this.locked = 0
            this.gold = 500
            this.goldvalue = 300
            this.body = new Circle(x, y, 10, color)
            this.movespeedbase = 1
            this.trapdrop = -.99
            this.speedbonus = 0
            this.health = 425
            this.healthmax = this.health
            this.mana = 600
            this.manamax = this.mana
            this.moveto = {}
            this.moveto.x = this.body.x - 1.01
            this.moveto.y = this.body.y
            this.traps = []
            this.spears = []
            this.spearcost = 29
            this.speardamage = 50
            this.spearcooldown = 0
            this.speardrain = 180
            this.healcooldown = 0
            this.healdrain = 120
            this.healcost = 50
            this.trapdamage = 40
            this.trapcooldown = 0
            this.trapdrain = 280
            this.trapcost = 30
            this.mps = .3
            this.hps = .25
            this.traprange = 100
            this.healpower = 150
            this.healrange = 150
            this.army = []
            this.spawner = 0
            this.spawnpoint = new Point(this.body.x, this.body.y)
            this.gasbag = 0
            this.blindmonk = 0
            this.robofister = 0
            this.pincushion = 0
            this.aliensquid = 1
            this.ulttimer = 0
            this.ultcost = 100
            this.ultcooldown = 0
            this.ultdrain = 950
            this.ulttime = 150
            this.ultrange = 180
            this.basicrate = 100
            this.basictimer = 0
            this.basicrange = 100
            this.basictarget = {}
            this.basicdamage = 100
        }
        marshal() {
            if (this.spawner % 1000 == 20) {
                let minion = new Mob(this.base.body.x, this.base.body.y, this)
                this.army.push(minion)
            }
            if (this.spawner % 1000 == 40) {
                let minion = new Mob(this.base.body.x, this.base.body.y, this)
                this.army.push(minion)
            }
            if (this.spawner % 1000 == 60) {
                let minion = new Mob(this.base.body.x, this.base.body.y, this)
                this.army.push(minion)
            }
            if (this.spawner % 1000 == 80) {
                let minion = new Mob(this.base.body.x, this.base.body.y, this)
                this.army.push(minion)
            }
            if (this.spawner % 1000 == 100) {
                let minion = new Mob(this.base.body.x, this.base.body.y, this)
                this.army.push(minion)
            }
            this.spawner++
            this.command()
            this.burial()
        }
        command() {
            for (let t = 0; t < this.army.length; t++) {
                this.army[t].drawbar()
            }
            for (let t = 0; t < this.army.length; t++) {
                this.army[t].draw()
            }
            for (let t = 0; t < this.army.length; t++) {
                this.army[t].drawbar()
            }
        }
        burial() {
            for (let t = 0; t < this.army.length; t++) {
                if (this.army[t].health <= 0) {
                    this.army.splice(t, 1)
                }
            }
            for (let t = 0; t < this.army.length; t++) {
                this.army[t].drawbar()
            }

        }
        cooldown() {
            this.spearcooldown--
            this.healcooldown--
            this.slamcooldown--
            this.ulttimer--
            this.ultcooldown--
        }
        regen() {
            this.marshal()
            if (this.health > 0) {
                this.mana += this.mps
                this.health += this.hps
                if (this.health > this.healthmax) {
                    this.health = this.healthmax
                }
                if (this.mana > this.manamax) {
                    this.mana = this.manamax
                }
            } else {
                if (this == players[0]) {
                    canvas_context.translate(this.body.x - this.spawnpoint.x, this.body.y - this.spawnpoint.y)
                }
                this.health = this.healthmax
                this.mana = this.manamax
                this.body.y = this.spawnpoint.y
                this.body.x = this.spawnpoint.x
                this.moveto.x = this.body.x + 1
                this.moveto.y = this.body.y + 1
                this.speedbonus = 0
            }
            this.speedbonus *= .997
        }

        control(to) {
            if (this.locked <= 0) {
                if (this == players[0]) {
                    this.moveto.x = this.body.x + (to.x - (canvas.width * .5))
                    this.moveto.y = this.body.y + (to.y - (canvas.height * .5))
                } else {
                    this.moveto.x = to.x
                    this.moveto.y = to.y
                }
            }
            if (this.body.doesPerimeterTouch(this.dashtarget)) {
                this.locked = 0
            }
            if (Math.round(this.locked) == 0) {
                this.speedbonus = 0
            }
        }
        drive() {
            if (typeof this.speedbonus == "undefined") {
                this.speedbonus = 0
            }
            if (this.locked <= 0 || this.locked == this.lockholder) {
                this.body.xmom = 0 - (this.body.x - this.moveto.x)
                this.body.ymom = 0 - (this.body.y - this.moveto.y)

                // if(Math.sqrt(Math.abs(this.body.xmom*this.body.xmom)+Math.abs(this.body.ymom*this.body.ymom)) != 0){
                let k = 0
                while (Math.sqrt(Math.abs(this.body.xmom * this.body.xmom) + Math.abs(this.body.ymom * this.body.ymom)) > (this.movespeedbase + this.speedbonus)) {
                    this.body.xmom *= 0.98
                    this.body.ymom *= 0.98
                    if (k == 10000) {
                        break
                    }
                }
                k = 0
                while (Math.sqrt(Math.abs(this.body.xmom * this.body.xmom) + Math.abs(this.body.ymom * this.body.ymom)) < (this.movespeedbase + this.speedbonus)) {
                    this.body.xmom *= 1.02
                    this.body.ymom *= 1.02
                    if (k == 10000) {
                        break
                    }
                }
            }
            if (this.body.doesPerimeterTouch(this.dashtarget)) {
                this.locked = 0
            }
            if (Math.round(this.locked) == 0) {
                this.speedbonus = 0
            }
        }
        gamepadSkillsAdapter(to) {

            let towards = new Point(0, 0)
            towards.x = (Math.cos(gamepad_angles().left) * this.healrange) + 360
            towards.y = (Math.sin(gamepad_angles().left) * this.healrange) + 360

            let link = new LineOP(this.body, towards)
            link.draw()

            if (gamepadAPI.buttonsStatus.includes('Left-Trigger')) {
                this.spear(towards)
            }
            if (gamepadAPI.buttonsStatus.includes('Right-Trigger')) {
                towards.x = (Math.cos(gamepad_angles().left) * 100) + this.body.x
                towards.y = (Math.sin(gamepad_angles().left) * 100) + this.body.y
                this.slam(towards)
            }
            if (gamepadAPI.buttonsStatus.includes('RB')) {
                towards.x = (Math.cos(gamepad_angles().left) * this.healrange) + this.body.x
                towards.y = (Math.sin(gamepad_angles().left) * this.healrange) + this.body.y
                this.heal(towards)
            }
            if (gamepadAPI.buttonsStatus.includes('LB')) {
                this.ulting(towards)
            }
        }
        skillsAdapter(to) {
            if (this == players[0]) {
                if (keysPressed['q']) {
                    this.spear(to)
                }
                if (keysPressed['w']) {
                    this.heal(to)
                }
                if (keysPressed['e']) {
                    this.slam(to)
                }
                if (keysPressed['r']) {
                    this.ulting(to)
                }
            } else {
                this.ulting()
                let fuzz = {}
                fuzz.x = ((Math.random() - .5) * 10) + players[0].body.x
                fuzz.y = ((Math.random() - .5) * 10) + players[0].body.y
                if (Math.random() < .01) {
                    // let wet = 0
                    // for(let t =0;t<players.length;t++){
                    //     if(lthis != players[t]){
                    //     let link = new LineOp(this.body, players[t].body)
                    //     if(link.hypotenuse() < 730){
                    //         wet = 1
                    //     }
                    // }
                    // }
                    // if(wet == 1){
                    this.spear(fuzz)
                    // }
                }
                let angler = 0
                for (let t = 0; t < players.length; t++) {
                    if (this != players[t]) {
                        angler = Math.atan2(this.body.y - players[t].body.y, this.body.x - players[t].body.x) + Math.PI
                    }
                }

                fuzz.x = (Math.cos(angler) * this.ultrange) + this.body.x
                fuzz.y = (Math.sin(angler) * this.ultrange) + this.body.y

                // if (this.mana > this.healcost + Math.max(this.spearcost, this.trapcost)) {
                if (Math.random() < .003) {
                    // if (this.health < this.maxhealth - this.healpower) {
                    this.heal(fuzz)
                    // }
                }
                // }
                fuzz.x = ((Math.random() - .5) * 100) + this.body.x
                fuzz.y = ((Math.random() - .5) * 100) + this.body.y
                if (!beam1.isPointInside(fuzz) && !beam2.isPointInside(fuzz)) {
                    if (Math.random() < .005) {
                        this.slam(fuzz)
                    }
                }
            }

        }
        spear(to) {
            if (this.mana > this.spearcost) {
                if (this.spearcooldown <= 0) {
                    let pin = new Blastbeam(this.body, to, this)
                    this.spears.push(pin)
                    this.spearcooldown = this.speardrain
                    this.mana -= this.spearcost
                }
            }

        }
        speardraw() {
            for (let t = 0; t < this.spears.length; t++) {
                this.spears[t].move()
                this.spears[t].draw()
                this.spears[t].life--
            }
            for (let t = 0; t < this.spears.length; t++) {
                if (this.spears[t].life <= 0) {
                    if (this.spears[t].engage != 0) {
                        this.spears.splice(t, 1)
                    }
                }
            }


        }

        slam(to) {
            if (this.mana >= this.slamcost) {
                if (this.slamcooldown <= 0) {
                    let pin = new EnergySlam(this.body, to, this)
                    this.slams.push(pin)
                    this.slamcooldown = this.slamdrain
                    this.mana -= this.slamcost
                }
            }

        }
        slamdraw() {
            for (let t = 0; t < this.slams.length; t++) {
                this.slams[t].move()
                this.slams[t].draw()
                this.slams[t].life -= .2
            }
            for (let t = 0; t < this.slams.length; t++) {
                if (this.slams[t].life <= 0) {
                    this.slams.splice(t, 1)
                }
            }

        }
        heal(to) {
            if (this.mana >= this.healcost) {
                if (this.healcooldown <= 0) {
                    let pin = new EnergyBlast(this.body, to, this)
                    this.slams.push(pin)
                    this.healcooldown = this.healdrain
                    this.mana -= this.healcost
                }
            }
        }
        trap(to) {
            if (this == players[0]) {
                to.x = this.body.x + (to.x - (canvas.width * .5))
                to.y = this.body.y + (to.y - (canvas.height * .5))
            }
            let trap = new Trap(this.body, to, this)
            let wet = 0
            for (let t = 0; t < players.length; t++) {
                if (players[t].body.doesPerimeterTouch(trap.body)) {
                    wet = 1
                }
            }
            if (this.trapcooldown <= 0) {
                let link = new LineOP(this.body, to)
                if (link.hypotenuse() < this.traprange) {
                    if (this.mana >= this.trapcost) {
                    } else {
                        wet = 1
                    }
                } else {
                    wet = 1
                }
            } else {
                wet = 1
            }
            if (wet == 0) {

                this.traps.push(trap)
                this.mana -= this.trapcost
                this.trapcooldown = this.trapdrain
            }



        }
        firing() {
            if (this.ulttimer > 0) {

                let towards = new Point(0, 0)
                if (this == players[0]) {
                    towards.x = (Math.cos(gamepad_angles().left) * this.ultrange) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * this.ultrange) + this.body.y
                } else {
                    let angler = 0
                    for (let t = 0; t < players.length; t++) {
                        if (this != players[t]) {
                            angler = Math.atan2(this.body.y - players[t].body.y, this.body.x - players[t].body.x) + Math.PI
                        }
                    }

                    towards.x = (Math.cos(angler) * this.ultrange) + this.body.x
                    towards.y = (Math.sin(angler) * this.ultrange) + this.body.y

                }

                let pin = new EnergyBeam(this.body, towards, this)
                let link = new LineOP(this.body, towards, "purple", 6)
                link.draw()

                this.slams.push(pin)
            }


        }
        ulting(to) {
            if (this.mana >= this.ultcost) {
                if (this.ultcooldown <= 0) {
                    this.ulttimer = this.ulttime
                    this.mana -= this.ultcost
                    this.ultcooldown = this.ultdrain
                }
            }
        }
        draw() {

            if (this == players[0]) {
                canvas_context.fillStyle = "gold"
                canvas_context.font = "20px arial"
                canvas_context.fillText(`${this.gold}`, this.body.x - 340, this.body.y - 340)
            }


            if (this == players[0]) {
                let towards = new Point(0, 0)
                if (players[0].pincushion == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 100) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 100) + this.body.y
                } else if (players[0].gasbag == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 50) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 50) + this.body.y
                } else if (players[0].blindmonk == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 100) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 100) + this.body.y
                } else if (players[0].robofister == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 200) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 200) + this.body.y
                } else if (players[0].foxghost == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 120) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 120) + this.body.y
                } else if (players[0].aliensquid == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 120) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 120) + this.body.y
                }

                let link = new LineOP(this.body, towards, "white", 1)
                link.draw()
            }

            this.slamdraw()

            if (this == players[0]) {
                let towards = new Point(0, 0)
                towards.x = (Math.cos(gamepad_angles().left) * this.healrange) + this.body.x
                towards.y = (Math.sin(gamepad_angles().left) * this.healrange) + this.body.y

                let link = new LineOP(this.body, towards, "white", 1)
                link.draw()
            }

            this.regen()
            this.drive()
            this.locked--
            let check = new LineOP(this.moveto, this.body)
            if (check.hypotenuse() > (.7 * (this.movespeedbase + this.speedbonus))) {
                this.body.move()
            } else if (this.locked > 0) {
                this.body.move()
            }
            this.firing()
            if (keysPressed['e']) {
                if (this == players[0]) {
                    let circ = new Circle(this.body.x, this.body.y, this.traprange, "black")
                    canvas_context.strokeStyle = circ.color
                    canvas_context.beginPath()
                    canvas_context.arc(circ.x, circ.y, circ.radius, 0, Math.PI * 2, true)
                    canvas_context.stroke()
                    canvas_context.closePath()
                }
            }
            this.body.draw()
            this.basic()
            this.healthbar = new Rectangle(this.body.x - this.body.radius, this.body.y - (this.body.radius * 2), this.body.radius * 2, this.body.radius * .25, "green")
            this.healthbar.width = (this.health / this.healthmax) * this.body.radius * 2
            this.manabar = new Rectangle(this.body.x - this.body.radius, this.body.y - (this.body.radius * 1.6), this.body.radius * 2, this.body.radius * .25, "blue")
            this.manabar.width = (this.mana / this.manamax) * this.body.radius * 2
            this.healthbar.draw()
            this.manabar.draw()
            this.speardraw()
            this.cooldown()
            this.collide()
        }
        basic() {
            this.basictimer++
            let min = this.basicrange
            this.basictarget = {}
            for (let t = 0; t < players.length; t++) {
                if (players[t] != this) {
                    for (let k = 0; k < players[t].army.length; k++) {
                        let link = new LineOP(this.body, players[t].army[k].body)
                        if (link.hypotenuse() <= min) {
                            min = link.hypotenuse()
                            this.basictarget = players[t].army[k]
                        }
                        let link2 = new LineOP(this.body, players[t].body)
                        if (link2.hypotenuse() <= this.basicrange) {
                            this.basictarget = players[t]
                        }
                    }
                }
            }

            this.basicAttack()
        }
        basicAttack() {
            if (this.basictarget.health > 0) {
                if (this.basictimer % this.basicrate == 0) {
                    this.basictarget.health -= this.basicdamage
                }
                if (this.basictimer % this.basicrate <= 9) {
                    let link = new LineOP(this.body, this.basictarget.body, "black", 4)
                    link.draw()
                }
            }
        }
        collide() {
            for (let t = 0; t < players.length; t++) {
                if (this != players[t]) {
                    if (players[t].gasbag == 1) {
                        for (let k = 0; k < players[t].gasses.length; k++) {
                            if (players[t].gasses[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].gasdamage)
                            }
                        }
                        for (let k = 0; k < players[t].glues.length; k++) {
                            if (players[t].glues[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].gluedamage)
                                this.speedbonus = players[t].gluedrop
                            }
                        }
                    } else if (players[t].pincushion == 1) {
                        for (let k = 0; k < players[t].spears.length; k++) {
                            if (players[t].spears[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].speardamage - (players[t].spears[k].life))
                                players[t].spears[k].life = 0
                            } else if (players[t].spears[k].shaft.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].speardamage - (players[t].spears[k].life))
                                players[t].spears[k].life = 0
                            }
                        }
                        for (let k = 0; k < players[t].traps.length; k++) {
                            if (players[t].traps[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].trapdamage)
                                this.speedbonus = players[t].trapdrop
                                players[t].traps[k].life = 0
                            }
                        }
                    } else if (players[t].blindmonk == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                this.speedbonus = players[t].slamdrop
                            }
                        }
                        for (let k = 0; k < players[t].orblist.length; k++) {
                            if (players[t].orblist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].orbdamage)
                                players[t].dashtarget.x = this.body.x
                                players[t].dashtarget.y = this.body.y
                                players[t].dashstate = 1
                                players[t].orblist[k].life = 0
                            }
                        }
                    } else if (players[t].robofister == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                this.speedbonus = players[t].slamdrop
                            }
                        }
                        for (let k = 0; k < players[t].hooklist.length; k++) {
                            if (players[t].hooklist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].hookdamage)
                                this.dashtarget.x = players[t].body.x
                                this.dashtarget.y = players[t].body.y
                                this.moveto.x = players[t].body.x
                                this.moveto.y = players[t].body.y
                                this.moveto.radius = players[t].body.radius
                                this.speedbonus = 7
                                let link = new LineOP(this.body, this.dashtarget)
                                let hookdot = (link.hypotenuse()) / (this.movespeedbase + this.speedbonus)
                                this.locked = Math.round(hookdot)
                                this.lockholder = Math.round(hookdot)
                                players[t].hooklist[k].life = 0
                                ////console.log(this)
                            }
                        }
                    } else if (players[t].aliensquid == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                this.speedbonus = players[t].slamdrop
                            }
                        }
                        for (let k = 0; k < players[t].spears.length; k++) {
                            if (players[t].spears[k].engage == 0) {
                                if (players[t].spears[k].body.doesPerimeterTouch(this.body)) {
                                    this.health -= players[t].speardamage
                                    players[t].spears[k].life = 0
                                }
                            } else {
                                if (players[t].spears[k].body1.doesPerimeterTouch(this.body)) {
                                    if (players[t].spears[k].life1 != 0) {
                                        this.health -= players[t].speardamage
                                        players[t].spears[k].life1 = 0
                                    }
                                }
                                if (players[t].spears[k].body2.doesPerimeterTouch(this.body)) {
                                    if (players[t].spears[k].life2 != 0) {
                                        this.health -= players[t].speardamage
                                        players[t].spears[k].life2 = 0
                                    }
                                }
                            }
                        }
                    } else if (players[t].foxghost == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                players[t].slamdamage = 0
                                players[t].theftcount++
                                if (players[t].theftcount >= 9) {
                                    players[t].theftcount = 0
                                    players[t].health += players[t].theftbonus
                                }
                            }
                        }
                        for (let k = 0; k < players[t].orblist.length; k++) {
                            if (players[t].orblist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].orbdamage)
                                players[t].theftcount++
                                if (players[t].theftcount >= 9) {
                                    players[t].theftcount = 0
                                    players[t].health += players[t].theftbonus
                                }
                            }
                        }
                        for (let k = 0; k < players[t].hooklist.length; k++) {
                            if (players[t].hooklist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].hookdamage)
                                this.dashtarget.x = players[t].body.x
                                this.dashtarget.y = players[t].body.y
                                this.moveto.x = players[t].body.x
                                this.moveto.y = players[t].body.y
                                this.moveto.radius = players[t].body.radius
                                this.speedbonus = 7
                                let link = new LineOP(this.body, this.dashtarget)
                                let hookdot = ((link.hypotenuse()) / (this.movespeedbase + this.speedbonus)) * 2
                                this.speedbonus = -.4
                                this.locked = Math.round(hookdot)
                                this.lockholder = Math.round(hookdot)
                                players[t].hooklist[k].life = 0
                                players[t].theftcount++
                                if (players[t].theftcount >= 9) {
                                    players[t].theftcount = 0
                                    players[t].health += players[t].theftbonus
                                }
                            }
                        }
                    } else if (players[t].demontaur == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                players[t].health += (players[t].slamdamage) * .2
                            }
                        }
                        for (let k = 0; k < players[t].orblist.length; k++) {
                            if (players[t].orblist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].orbdamage)
                            }
                        }
                    } else if (players[t].inventrix == 1) {
                        for (let k = 0; k < players[t].hooklist.length; k++) {
                            if (players[t].hooklist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].hookdamage)
                                this.dashtarget.x = players[t].body.x
                                this.dashtarget.y = players[t].body.y
                                this.moveto.x = players[t].body.x
                                this.moveto.y = players[t].body.y
                                this.moveto.radius = players[t].body.radius
                                this.speedbonus = (-1 * (this.movespeedbase + this.speedboost)) + .0000001
                                let hookdot = 200
                                this.locked = Math.round(hookdot)
                                this.lockholder = Math.round(hookdot)
                                players[t].hooklist[k].life = 0
                            }
                        }
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                players[t].health += (players[t].slamdamage) * .2
                            }
                        }
                        for (let k = 0; k < players[t].orblist.length; k++) {
                            if (players[t].orblist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].orbdamage)
                                players[t].orblist[k].life = 0
                            }
                        }
                    }else if (players[t].artsassin == 1) {
                        for (let k = 0; k < players[t].spears.length; k++) {
                                if (players[t].spears[k].body.doesPerimeterTouch(this.body)) {
                                    this.health -= players[t].speardamage
                                    
                                this.speedbonus = (-1 * (this.movespeedbase + this.speedboost)) + .0000001
                                let hookdot = 200
                                this.locked = Math.round(hookdot)
                                this.lockholder = Math.round(hookdot)
                                }
                        }
                        for (let k = 0; k < players[t].traps.length; k++) {
                            if (players[t].traps[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].trapdamage)
                                this.speedbonus = (-1 * (this.movespeedbase + this.speedboost)) + .0000001
                                let hookdot = 200
                                this.locked = Math.round(hookdot)
                                this.lockholder = Math.round(hookdot)
                                players[t].traps[k].life = 0
                            }
                        }
                    }
                }
            }


        }

    }

    class Mob {
        constructor(x, y, player) {
            this.body = new Circle(x + (Math.random()), y + (Math.random()), 10, player.base.body.color)
            this.moveto = {}
            this.target = {}
            this.range = 25
            this.player = player
            this.health = 400
            this.maxhealth = this.health
            this.melee = .5
            this.goldvalue = 20
            this.movespeed = .999
            this.healthbar = new Rectangle(this.body.x - this.body.radius, this.body.y - (this.body.radius * 2), this.body.radius * 2, this.body.radius * .25, "#00ff00")

            for (let t = 0; t < players.length; t++) {
                if (players[t] != this.player) {
                    this.target = players[t].base
                }
            }
        }
        aggro() {


            let wet = 1

            for (let t = 0; t < players.length; t++) {
                if (players[t] != this.player) {
                    if (players[t].army.includes(this.target)) {
                        this.wet = 0
                    }
                }
            }
            if (wet == 1) {
                for (let t = 0; t < players.length; t++) {
                    if (players[t] != this.player) {
                        this.target = players[t].base
                    }
                }
            }
            for (let t = 0; t < players.length; t++) {
                if (players[t] != this.player) {
                    for (let k = 0; k < players[t].army.length; k++) {
                        let link = new LineOP(this.body, players[t].army[k].body)
                        let link2 = new LineOP(this.target.body, this.body)
                        if (link.hypotenuse() < link2.hypotenuse()) {
                            this.target = players[t].army[k]
                        }
                    }
                }
            }
            for (let t = 0; t < players.length; t++) {
                if (players[t] != this.player) {
                    let link = new LineOP(this.body, players[t].body)
                    let link2 = new LineOP(this.target.body, this.body)
                    if (link.hypotenuse() < link2.hypotenuse()) {
                        this.target = players[t]
                    }
                }
            }
        }
        move() {
            let link = new LineOP(this.target.body, this.body)
            if (link.hypotenuse() < (this.range + this.target.body.radius) + (this.body.radius) && this.target.tower == 1) {
                let dummy = this.target.health
                this.target.health -= this.melee

                let link = new LineOP(this.body, this.target.body, this.body.color, 2)
                link.draw()



                if (dummy > this.target.health) {
                    if (this.target.activeshield > 0) {
                        if (this.target.activeshield >= dummy - this.target.health) {
                            this.target.activeshield -= dummy - this.target.health
                            this.target.health = dummy
                        } else {
                            this.target.health += this.target.activeshield
                            this.target.activeshield = 0
                        }
                    }
                }
                if (this.speedbonus > 0) {
                    this.speedbonus *= .5
                }

            } else if (link.hypotenuse() > this.range) {
                let xvec = (this.target.body.x - this.body.x)
                let yvec = (this.target.body.y - this.body.y)
                let k = 0
                while (Math.abs(xvec) + Math.abs(yvec) > this.movespeed) {
                    xvec *= .99
                    yvec *= .99
                    k++
                    if (k > 10000) {
                        break
                    }
                }
                while (Math.abs(xvec) + Math.abs(yvec) < this.movespeed) {
                    xvec *= 1.05
                    yvec *= 1.05
                    k++
                    if (k > 10000) {
                        break
                    }
                }
                this.body.x += xvec
                this.body.y += yvec
            } else if (link.hypotenuse() < (this.range + (this.body.radius * 2))) {
                let dummy = this.target.health
                this.target.health -= this.melee

                let link = new LineOP(this.body, this.target.body, this.body.color, 2)
                link.draw()



                if (dummy > this.target.health) {
                    if (this.target.activeshield > 0) {
                        if (this.target.activeshield >= dummy - this.target.health) {
                            this.target.activeshield -= dummy - this.target.health
                            this.target.health = dummy
                        } else {
                            this.target.health += this.target.activeshield
                            this.target.activeshield = 0
                        }
                    }
                }
                if (this.speedbonus > 0) {
                    this.speedbonus *= .5
                }
            }
        }
        repel() {

            for (let t = 0; t < players.length; t++) {
                for (let k = 0; k < players[t].army.length; k++) {
                    if (players[t].army[k] != this) {
                        if (players[t].army[k].body.doesPerimeterTouch(this.body)) {
                            const distance = ((new LineOP(this.body, players[t].army[k].body)).hypotenuse()) - (players[t].army[k].body.radius + this.body.radius)
                            const angleRadians = Math.atan2(players[t].army[k].body.y - this.body.y, players[t].army[k].body.x - this.body.x);
                            if (this.tower != 1) {
                                this.body.x += (Math.cos(angleRadians) * distance) / 2
                                this.body.y += (Math.sin(angleRadians) * distance) / 2
                            }
                            if (players[t].army[k].tower != 1) {
                                if (players[t].locked <= 0) {
                                    players[t].army[k].body.x -= (Math.cos(angleRadians) * distance) / 2
                                    players[t].army[k].body.y -= (Math.sin(angleRadians) * distance) / 2
                                }
                            }
                        }
                    }
                }
            }
            for (let t = 0; t < players.length; t++) {
                if (players[t].body.doesPerimeterTouch(this.body)) {
                    const distance = ((new LineOP(this.body, players[t].body)).hypotenuse()) - (players[t].body.radius + this.body.radius)
                    const angleRadians = Math.atan2(players[t].body.y - this.body.y, players[t].body.x - this.body.x);
                    if (this.tower != 1) {
                        this.body.x += (Math.cos(angleRadians) * distance) / 2
                        this.body.y += (Math.sin(angleRadians) * distance) / 2
                    }
                }
            }
        }
        draw() {
            this.aggro()
            this.repel()
            this.move()
            this.collide()
            this.healthbar = new Rectangle(this.body.x - this.body.radius, this.body.y - (this.body.radius * 2), this.body.radius * 2, this.body.radius * .25, "#00ff00")
            this.healthbar.width = (this.health / this.maxhealth) * this.body.radius * 2
            this.healthbar.draw()
            this.body.draw()
            this.healthbar.draw()

            // ////console.log(this.healthbar)

        }
        collide() {

            ///mobs


            for (let t = 0; t < players.length; t++) {
                if (this.player != players[t]) {
                    if (players[t].pincushion == 1) {
                        for (let k = 0; k < players[t].spears.length; k++) {
                            if (players[t].spears[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].speardamage - (players[t].spears[k].life))
                                players[t].spears[k].life = 0
                            } else if (players[t].spears[k].shaft.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].speardamage - (players[t].spears[k].life))
                                players[t].spears[k].life = 0
                            }
                        }
                        for (let k = 0; k < players[t].traps.length; k++) {
                            if (players[t].traps[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].trapdamage)
                                this.movespeed *= .1
                                players[t].traps[k].life = 0
                            }
                        }
                    } else if (players[t].gasbag == 1) {
                        for (let k = 0; k < players[t].gasses.length; k++) {
                            if (players[t].gasses[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].gasdamage)
                            }
                        }
                        for (let k = 0; k < players[t].glues.length; k++) {
                            if (players[t].glues[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].gluedamage)
                                this.movespeed *= .99
                            }
                        }
                    } else if (players[t].blindmonk == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                this.movespeed *= .95
                            }
                        }
                        for (let k = 0; k < players[t].orblist.length; k++) {
                            if (players[t].orblist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].orbdamage)
                                players[t].dashtarget.x = this.body.x
                                players[t].dashtarget.y = this.body.y
                                players[t].dashstate = 1
                                players[t].orblist[k].life = 0
                            }
                        }
                    } else if (players[t].robofister == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                this.speedbonus = players[t].slamdrop
                            }
                        }
                        for (let k = 0; k < players[t].hooklist.length; k++) {
                            if (players[t].hooklist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].hookdamage)
                                this.body.x = players[t].body.x
                                this.body.y = players[t].body.y
                                // this.target = players[t]
                                // this.speedbonus = 7
                                // let link = new LineOP(this.body, this.dashtarget)
                                // let hookdot = (link.hypotenuse()) / (this.movespeedbase + this.speedbonus)
                                // this.locked = Math.round(hookdot)
                                // this.lockholder = Math.round(hookdot)
                                players[t].hooklist[k].life = 0
                                // ////console.log(this)
                            }
                        }
                    } else if (players[t].aliensquid == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                this.speedbonus = players[t].slamdrop
                            }
                        }
                        for (let k = 0; k < players[t].spears.length; k++) {
                            if (players[t].spears[k].engage == 0) {
                                if (players[t].spears[k].body.doesPerimeterTouch(this.body)) {
                                    this.health -= players[t].speardamage
                                    players[t].spears[k].life = 0
                                }
                            } else {
                                if (players[t].spears[k].body1.doesPerimeterTouch(this.body)) {
                                    if (players[t].spears[k].life1 != 0) {
                                        this.health -= players[t].speardamage
                                        players[t].spears[k].life1 = 0
                                    }
                                }
                                if (players[t].spears[k].body2.doesPerimeterTouch(this.body)) {
                                    if (players[t].spears[k].life2 != 0) {
                                        this.health -= players[t].speardamage
                                        players[t].spears[k].life2 = 0
                                    }
                                }
                            }
                        }
                    } else if (players[t].foxghost == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                players[t].slamdamage = 0
                                players[t].theftcount++
                                if (players[t].theftcount >= 9) {
                                    players[t].theftcount = 0
                                    players[t].health += players[t].theftbonus
                                }
                            }
                        }
                        for (let k = 0; k < players[t].orblist.length; k++) {
                            if (players[t].orblist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].orbdamage)
                                players[t].theftcount++
                                if (players[t].theftcount >= 9) {
                                    players[t].theftcount = 0
                                    players[t].health += players[t].theftbonus
                                }
                            }
                        }
                        for (let k = 0; k < players[t].hooklist.length; k++) {
                            if (players[t].hooklist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].hookdamage)
                                players[t].hooklist[k].life = 0
                                players[t].theftcount++
                                if (players[t].theftcount >= 9) {
                                    players[t].theftcount = 0
                                    players[t].health += players[t].theftbonus
                                }
                            }
                        }
                    } else if (players[t].demontaur == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                players[t].health += (players[t].slamdamage) * .2
                            }
                        }
                        for (let k = 0; k < players[t].orblist.length; k++) {
                            if (players[t].orblist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].orbdamage)
                            }
                        }
                    } else if (players[t].inventrix == 1) {
                        for (let k = 0; k < players[t].hooklist.length; k++) {
                            if (players[t].hooklist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].hookdamage)
                                this.movespeed = .00001
                                players[t].hooklist[k].life = 0
                            }
                        }
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                players[t].health += (players[t].slamdamage) * .2
                            }
                        }
                        for (let k = 0; k < players[t].orblist.length; k++) {
                            if (players[t].orblist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].orbdamage)
                                players[t].orblist[k].life = 0
                            }
                        }
                    }else if (players[t].artsassin == 1) {
                        for (let k = 0; k < players[t].spears.length; k++) {
                                if (players[t].spears[k].body.doesPerimeterTouch(this.body)) {
                                    this.health -= players[t].speardamage
                                }
                        }
                        for (let k = 0; k < players[t].traps.length; k++) {
                            if (players[t].traps[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].trapdamage)
                                this.movespeed *= .1
                                players[t].traps[k].life = 0
                            }
                        }

                    }
                    if (this.health <= 0) {
                        players[t].gold += this.goldvalue
                        break
                    }

                    if (this.health <= 0) {
                        players[t].gold += this.goldvalue
                        break
                    }
                }

            }

        }
        drawbar() {
            this.healthbar = new Rectangle(this.body.x - this.body.radius, this.body.y - (this.body.radius * 2), this.body.radius * 2, this.body.radius * .25, "#00ff00")
            this.healthbar.width = (this.health / this.maxhealth) * this.body.radius * 2
            this.healthbar.draw()
        }


    }

    class Tower {
        constructor(x, y, player) {
            this.body = new Circle(x + (Math.random()), y + (Math.random()), 50, player.base.body.color)
            this.moveto = {}
            this.target = {}
            this.range = 300
            this.player = player
            this.health = 16000
            this.tower = 1
            this.maxhealth = this.health
            this.melee = 100
            this.attackspeed = 100
            this.counter = 0
            this.goldvalue = 300
            this.movespeed = .00000000000000001
            this.healthbar = new Rectangle(this.body.x - this.body.radius, this.body.y - (this.body.radius * 2), this.body.radius * 2, this.body.radius * .25, "#00ff00")

            for (let t = 0; t < players.length; t++) {
                if (players[t] != this.player) {
                    this.target = players[t].base
                }
            }
        }
        aggro() {


            let wet = 1

            for (let t = 0; t < players.length; t++) {
                if (players[t] != this.player) {
                    if (players[t].army.includes(this.target)) {
                        this.wet = 0
                    }
                }
            }
            if (wet == 1) {
                for (let t = 0; t < players.length; t++) {
                    if (players[t] != this.player) {
                        this.target = players[t].base
                    }
                }
            }
            for (let t = 0; t < players.length; t++) {
                if (players[t] != this.player) {
                    for (let k = 0; k < players[t].army.length; k++) {
                        let link = new LineOP(this.body, players[t].army[k].body)
                        let link2 = new LineOP(this.target.body, this.body)
                        if (link.hypotenuse() < link2.hypotenuse()) {
                            this.target = players[t].army[k]
                        }
                    }
                }
            }
            for (let t = 0; t < players.length; t++) {
                if (players[t] != this.player) {
                    let link = new LineOP(this.body, players[t].body)
                    let link2 = new LineOP(this.target.body, this.body)
                    if (link.hypotenuse() < link2.hypotenuse()) {
                        this.target = players[t]
                    }
                }
            }
        }
        move() {
            let link = new LineOP(this.target.body, this.body)
            if (link.hypotenuse() > this.range) {
                let xvec = (this.target.body.x - this.body.x)
                let yvec = (this.target.body.y - this.body.y)
                let k = 0
                while (Math.abs(xvec) + Math.abs(yvec) > this.movespeed) {
                    xvec *= .99
                    yvec *= .99
                    k++
                    if (k > 10000) {
                        break
                    }
                }
                while (Math.abs(xvec) + Math.abs(yvec) < this.movespeed) {
                    xvec *= 1.05
                    yvec *= 1.05
                    k++
                    if (k > 10000) {
                        break
                    }
                }
                this.body.x += xvec
                this.body.y += yvec
            } else if (link.hypotenuse() < (this.range + (this.body.radius * 2))) {
                this.counter++
                if (this.counter % this.attackspeed == 0) {
                    let dummy = this.target.health
                    this.target.health -= this.melee


                    if (dummy > this.target.health) {
                        if (this.target.activeshield > 0) {
                            if (this.target.activeshield >= dummy - this.target.health) {
                                this.target.activeshield -= dummy - this.target.health
                                this.target.health = dummy
                            } else {
                                this.target.health += this.target.activeshield
                                this.target.activeshield = 0
                            }
                        }
                    }
                    let link = new LineOP(this.body, this.target.body, this.body.color, 5)
                    link.draw()
                } else if (this.counter % this.attackspeed >= (this.attackspeed - 10)) {
                    let link = new LineOP(this.body, this.target.body, this.body.color, 5)
                    link.draw()
                }
            }
        }
        repel() {

            for (let t = 0; t < players.length; t++) {
                for (let k = 0; k < players[t].army.length; k++) {
                    if (players[t].army[k] != this) {
                        if (players[t].army[k].body.doesPerimeterTouch(this.body)) {
                            const distance = ((new LineOP(this.body, players[t].army[k].body)).hypotenuse()) - (players[t].army[k].body.radius + this.body.radius)
                            const angleRadians = Math.atan2(players[t].army[k].body.y - this.body.y, players[t].army[k].body.x - this.body.x);
                            // this.body.x += (Math.cos(angleRadians) * distance) / 2
                            // this.body.y += (Math.sin(angleRadians) * distance) / 2
                            players[t].army[k].body.x -= (Math.cos(angleRadians) * distance) / 2
                            players[t].army[k].body.y -= (Math.sin(angleRadians) * distance) / 2
                        }
                    }
                }
            }
            for (let t = 0; t < players.length; t++) {
                if (players[t].body.doesPerimeterTouch(this.body)) {
                    const distance = ((new LineOP(this.body, players[t].body)).hypotenuse()) - (players[t].body.radius + this.body.radius)
                    const angleRadians = Math.atan2(players[t].body.y - this.body.y, players[t].body.x - this.body.x);
                    if (players[t].locked <= 0) {
                        players[t].moveto.x -= (Math.cos(angleRadians) * distance) * 1.01
                        players[t].moveto.y -= (Math.sin(angleRadians) * distance) * 1.01
                    }
                    // if(players[t] == players[0]){
                    //     canvas_context.translate((Math.cos(angleRadians) * distance) / 2, (Math.sin(angleRadians) * distance) / 2)     
                    // } 
                    // players[t].body.unmove()
                    // players[t].body.xmom = 0
                    // players[t].body.ymom = 0
                    // if(this.body.isPointInside(players[t].moveto)){

                    // players[t].body.x -= .001
                    // players[t].control(players[t].body)
                    // players[t].drive()
                    // players[t].body.x += .001

                    // }
                    // players[t].body.x -= .001
                    // players[t].control(players[t].body)
                    // players[t].drive()
                    // players[t].body.x += .001
                }
            }
        }
        draw() {
            this.aggro()
            this.repel()
            this.move()
            this.collide()
            this.healthbar = new Rectangle(this.body.x - this.body.radius, this.body.y - (this.body.radius * 2), this.body.radius * 2, this.body.radius * .25, "#00ff00")
            this.healthbar.width = (this.health / this.maxhealth) * this.body.radius * 2
            this.healthbar.draw()
            this.body.draw()
            this.healthbar.draw()

            // ////console.log(this.healthbar)

        }
        collide() {
            //tower



            for (let t = 0; t < players.length; t++) {
                if (this.player != players[t]) {
                    if (players[t].pincushion == 1) {
                        for (let k = 0; k < players[t].spears.length; k++) {
                            if (players[t].spears[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].speardamage - (players[t].spears[k].life))
                                players[t].spears[k].life = 0
                            } else if (players[t].spears[k].shaft.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].speardamage - (players[t].spears[k].life))
                                players[t].spears[k].life = 0
                            }
                        }
                        for (let k = 0; k < players[t].traps.length; k++) {
                            if (players[t].traps[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].trapdamage)
                                this.movespeed *= .1
                                players[t].traps[k].life = 0
                            }
                        }
                    } else if (players[t].gasbag == 1) {
                        for (let k = 0; k < players[t].gasses.length; k++) {
                            if (players[t].gasses[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].gasdamage)
                            }
                        }
                        for (let k = 0; k < players[t].glues.length; k++) {
                            if (players[t].glues[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].gluedamage)
                                this.movespeed *= .99
                            }
                        }
                    } else if (players[t].blindmonk == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                this.movespeed *= .5
                            }
                        }
                        for (let k = 0; k < players[t].orblist.length; k++) {
                            if (players[t].orblist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].orbdamage)
                                // players[t].dashtarget = players[t].body
                                // players[t].dashstate = -1
                                players[t].orblist[k].life = 0
                            }
                        }
                    } else if (players[t].robofister == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                this.speedbonus = players[t].slamdrop
                            }
                        }
                        for (let k = 0; k < players[t].hooklist.length; k++) {
                            if (players[t].hooklist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].hookdamage)
                                // this.dashtarget.x = players[t].body.x 
                                // this.dashtarget.y = players[t].body.y 
                                // this.moveto.x = players[t].body.x 
                                // this.moveto.y = players[t].body.y 
                                // this.moveto.radius = players[t].body.radius
                                // this.speedbonus = 7
                                // let link = new LineOP(this.body, this.dashtarget)
                                // let hookdot = (link.hypotenuse()) / (this.movespeedbase + this.speedbonus)
                                // this.locked = Math.round(hookdot)
                                // this.lockholder = Math.round(hookdot)
                                players[t].hooklist[k].life = 0
                                // ////console.log(this)
                            }
                        }
                    } else if (players[t].aliensquid == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                this.speedbonus = players[t].slamdrop
                            }
                        }
                        for (let k = 0; k < players[t].spears.length; k++) {
                            if (players[t].spears[k].engage == 0) {
                                if (players[t].spears[k].body.doesPerimeterTouch(this.body)) {
                                    this.health -= players[t].speardamage
                                    players[t].spears[k].life = 0
                                }
                            } else {
                                if (players[t].spears[k].body1.doesPerimeterTouch(this.body)) {
                                    if (players[t].spears[k].life1 != 0) {
                                        this.health -= players[t].speardamage
                                        players[t].spears[k].life1 = 0
                                    }
                                }
                                if (players[t].spears[k].body2.doesPerimeterTouch(this.body)) {
                                    if (players[t].spears[k].life2 != 0) {
                                        this.health -= players[t].speardamage
                                        players[t].spears[k].life2 = 0
                                    }
                                }
                            }
                        }
                    } else if (players[t].foxghost == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                players[t].slamdamage = 0
                                players[t].theftcount++
                                if (players[t].theftcount >= 9) {
                                    players[t].theftcount = 0
                                    players[t].health += players[t].theftbonus
                                }
                            }
                        }
                        for (let k = 0; k < players[t].orblist.length; k++) {
                            if (players[t].orblist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].orbdamage)
                                players[t].theftcount++
                                if (players[t].theftcount >= 9) {
                                    players[t].theftcount = 0
                                    players[t].health += players[t].theftbonus
                                }
                            }
                        }
                        for (let k = 0; k < players[t].hooklist.length; k++) {
                            if (players[t].hooklist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].hookdamage)
                                players[t].hooklist[k].life = 0
                                players[t].theftcount++
                                if (players[t].theftcount >= 9) {
                                    players[t].theftcount = 0
                                    players[t].health += players[t].theftbonus
                                }
                            }
                        }
                    } else if (players[t].demontaur == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                players[t].health += (players[t].slamdamage) * .2
                            }
                        }
                        for (let k = 0; k < players[t].orblist.length; k++) {
                            if (players[t].orblist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].orbdamage)
                            }
                        }
                    } else if (players[t].inventrix == 1) {
                        for (let k = 0; k < players[t].hooklist.length; k++) {
                            if (players[t].hooklist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].hookdamage)
                                players[t].hooklist[k].life = 0
                            }
                        }
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                players[t].health += (players[t].slamdamage) * .2
                            }
                        }
                        for (let k = 0; k < players[t].orblist.length; k++) {
                            if (players[t].orblist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].orbdamage)
                                players[t].orblist[k].life = 0
                            }
                        }
                    }else if (players[t].artsassin == 1) {
                        for (let k = 0; k < players[t].spears.length; k++) {
                                if (players[t].spears[k].body.doesPerimeterTouch(this.body)) {
                                    this.health -= players[t].speardamage
                                }
                        }
                        for (let k = 0; k < players[t].traps.length; k++) {
                            if (players[t].traps[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].trapdamage)
                                this.movespeed *= .1
                                players[t].traps[k].life = 0
                            }
                        }

                    }
                    if (this.health <= 0) {
                        players[t].gold += this.goldvalue
                        break
                    }
                }

            }

        }
        drawbar() {
            this.healthbar = new Rectangle(this.body.x - this.body.radius, this.body.y - (this.body.radius * 2), this.body.radius * 2, this.body.radius * .25, "#00ff00")
            this.healthbar.width = (this.health / this.maxhealth) * this.body.radius * 2
            this.healthbar.draw()
        }


    }

    class Gas {
        constructor(from, to, owner) {
            if (owner == players[0]) {
                this.r = 255
                this.g = 0
                this.b = 255
            } else {
                this.r = 0
                this.g = 255
                this.b = 255
            }
            this.life = 0.3
            this.body = new Circle(from.x, from.y, 30, `rgb(${this.r},${this.g},${this.b}, ${this.life})`)

        }
        draw() {
            this.life -= .001
            this.body.radius -= .05
            this.body.draw()
            this.body.color = `rgb(${this.r},${this.g},${this.b}, ${this.life})`
        }

        move() {
        }


    }

    class Glue {
        constructor(from, to, owner) {

            this.life = 500
            if (owner == players[0]) {
                this.body = new Circle(to.x, to.y, 30, "magenta", 0, 0)
                this.body2 = new Circle(to.x, to.y, 25, "yellow", 0, 0)
                this.body3 = new Circle(to.x, to.y, 20, "magenta", 0, 0)
                this.body4 = new Circle(to.x, to.y, 15, "yellow", 0, 0)
                this.body5 = new Circle(to.x, to.y, 10, "magenta", 0, 0)
            } else {
                this.body = new Circle(to.x, to.y, 30, "cyan", 0, 0)
                this.body2 = new Circle(to.x, to.y, 25, "yellow", 0, 0)
                this.body3 = new Circle(to.x, to.y, 20, "cyan", 0, 0)
                this.body4 = new Circle(to.x, to.y, 15, "yellow", 0, 0)
                this.body5 = new Circle(to.x, to.y, 10, "cyan", 0, 0)
            }

        }
        draw() {
            this.body.draw()
            this.body2.draw()
            this.body3.draw()
            this.body4.draw()
            this.body5.draw()
        }

    }

    class Gasbag {
        constructor(x, y, color) {
            this.speedboost = 0
            this.dashtarget = {}
            this.locked = 0
            this.gold = 500
            this.goldvalue = 300
            this.ult = 0
            this.gason = -1
            this.body = new Circle(x, y, 10, color)
            this.movespeedbase = 1
            this.gluedrop = -.5
            this.speedbonus = 0
            this.health = 550
            this.healthmax = this.health
            this.mana = 300
            this.manamax = this.mana
            this.moveto = {}
            this.moveto.x = this.body.x - 1.01
            this.moveto.y = this.body.y
            this.glues = []
            this.gasses = []
            this.gascost = 10
            this.gasdamage = .2
            this.gascooldown = 0
            this.gasdrain = 25
            this.flipcooldown = 0
            this.flipdrain = 120
            this.flipcost = 50
            this.gluedamage = 0
            this.gluecooldown = 0
            this.gluedrain = 280
            this.gluecost = 30
            this.mps = .1
            this.hps = .15
            this.gluerange = 75
            this.flippower = 150
            this.fliprange = 50
            this.army = []
            this.spawner = 0
            this.spawnpoint = new Point(this.body.x, this.body.y)
            this.gasbag = 1
            this.aliensquid = 0
            this.robofister = 0
            this.pincushion = 0
            this.blindmonk = 0
            this.ultcost = 25
            this.ultcooldown = 0
            this.ultdrain = 1000
            this.ultrun = 0
            this.basicrate = 40
            this.basictimer = 0
            this.basicrange = 28
            this.basictarget = {}
            this.basicdamage = 45
        }
        marshal() {
            if (this.spawner % 1000 == 20) {
                let minion = new Mob(this.base.body.x, this.base.body.y, this)
                this.army.push(minion)
            }
            if (this.spawner % 1000 == 40) {
                let minion = new Mob(this.base.body.x, this.base.body.y, this)
                this.army.push(minion)
            }
            if (this.spawner % 1000 == 60) {
                let minion = new Mob(this.base.body.x, this.base.body.y, this)
                this.army.push(minion)
            }
            if (this.spawner % 1000 == 80) {
                let minion = new Mob(this.base.body.x, this.base.body.y, this)
                this.army.push(minion)
            }
            if (this.spawner % 1000 == 100) {
                let minion = new Mob(this.base.body.x, this.base.body.y, this)
                this.army.push(minion)
            }
            this.spawner++
            this.burial()
            this.command()
            this.burial()
        }
        command() {
            for (let t = 0; t < this.army.length; t++) {
                this.army[t].drawbar()
            }
            for (let t = 0; t < this.army.length; t++) {
                this.army[t].draw()
            }
            for (let t = 0; t < this.army.length; t++) {
                this.army[t].drawbar()
            }
        }
        burial() {
            for (let t = 0; t < this.army.length; t++) {
                if (this.army[t].health <= 0) {
                    this.army.splice(t, 1)
                }
            }
            for (let t = 0; t < this.army.length; t++) {
                this.army[t].drawbar()
            }

        }
        cooldown() {
            this.gascooldown--
            this.flipcooldown--
            this.gluecooldown--
            this.ultrun--
            this.ultcooldown--
        }
        regen() {
            if (this.ultrun > 0) {
                this.ult = 1
            } else {
                this.ult = 0
            }
            this.marshal()
            if (this.health > 0) {
                if (this.ult == 1) {
                    this.mana += this.mps
                    this.health += this.hps
                    this.mana += this.mps
                    this.health += this.hps
                    this.movespeedbase = 1.8
                } else {
                    this.movespeedbase = 1
                }
                this.mana += this.mps
                this.health += this.hps
                if (this.health > this.healthmax) {
                    this.health = this.healthmax
                }
                if (this.mana > this.manamax) {
                    this.mana = this.manamax
                }
            } else {
                this.ult = 0
                this.ultrun = 0
                if (this == players[0]) {
                    canvas_context.translate(this.body.x - this.spawnpoint.x, this.body.y - this.spawnpoint.y)
                }
                this.health = this.healthmax
                this.mana = this.manamax
                this.body.y = this.spawnpoint.y
                this.body.x = this.spawnpoint.x
                this.moveto.x = this.body.x + 1
                this.moveto.y = this.body.y + 1
                this.speedbonus = 0
            }
            this.speedbonus *= .999
        }

        control(to) {
            if (this.locked <= 0) {
                if (this == players[0]) {
                    this.moveto.x = this.body.x + (to.x - (canvas.width * .5))
                    this.moveto.y = this.body.y + (to.y - (canvas.height * .5))
                } else {
                    this.moveto.x = to.x
                    this.moveto.y = to.y
                }
            }
            if (this.body.doesPerimeterTouch(this.dashtarget)) {
                this.locked = 0
            }
            if (Math.round(this.locked) == 0) {
                this.speedbonus = 0
            }
        }
        drive() {
            if (typeof this.speedbonus == "undefined") {
                this.speedbonus = 0
            }
            if (this.locked <= 0 || this.locked == this.lockholder) {
                this.body.xmom = 0 - (this.body.x - this.moveto.x)
                this.body.ymom = 0 - (this.body.y - this.moveto.y)

                // if(Math.sqrt(Math.abs(this.body.xmom*this.body.xmom)+Math.abs(this.body.ymom*this.body.ymom)) != 0){
                let k = 0
                while (Math.sqrt(Math.abs(this.body.xmom * this.body.xmom) + Math.abs(this.body.ymom * this.body.ymom)) > (this.movespeedbase + this.speedbonus)) {
                    this.body.xmom *= 0.98
                    this.body.ymom *= 0.98
                    if (k == 10000) {
                        break
                    }
                }
                k = 0
                while (Math.sqrt(Math.abs(this.body.xmom * this.body.xmom) + Math.abs(this.body.ymom * this.body.ymom)) < (this.movespeedbase + this.speedbonus)) {
                    this.body.xmom *= 1.02
                    this.body.ymom *= 1.02
                    if (k == 10000) {
                        break
                    }
                }
            }
            if (this.body.doesPerimeterTouch(this.dashtarget)) {
                this.locked = 0
            }
            if (Math.round(this.locked) == 0) {
                this.speedbonus = 0
            }
        }
        gamepadSkillsAdapter(to) {

            let towards = new Point(0, 0)
            towards.x = (Math.cos(gamepad_angles().left) * 100) + 360
            towards.y = (Math.sin(gamepad_angles().left) * 100) + 360

            let link = new LineOP(this.body, towards)
            link.draw()

            if (gamepadAPI.buttonsStatus.includes('Left-Trigger')) {
                this.gason *= -1
            }
            if (this.gason == 1) {
                this.gas(towards)
            }
            if (gamepadAPI.buttonsStatus.includes('Right-Trigger')) {
                towards.x = (Math.cos(gamepad_angles().left) * this.gluerange) + 360
                towards.y = (Math.sin(gamepad_angles().left) * this.gluerange) + 360
                this.glue(towards)
            }
            if (gamepadAPI.buttonsStatus.includes('RB')) {

                towards.x = (Math.cos(gamepad_angles().left) * this.fliprange) + this.body.x
                towards.y = (Math.sin(gamepad_angles().left) * this.fliprange) + this.body.y
                this.flip(towards)
            }
            if (gamepadAPI.buttonsStatus.includes('LB')) {
                this.ulting(towards)
            }
        }
        gastest() {
            if (this.gason == 1) {
                this.gas(this.body)
            }
        }
        skillsAdapter(to) {
            if (this == players[0]) {
                if (keysPressed['q']) {
                    // this.gas(to)
                    this.gason *= -1
                }
                if (keysPressed['w']) {
                    this.flip(to)
                }
                if (keysPressed['e']) {
                    this.glue(to)
                }
                if (keysPressed['r']) {
                    this.ulting(to)
                }
            } else {
                let fuzz = {}
                fuzz.x = ((Math.random() - .5) * 10) + players[0].body.x
                fuzz.y = ((Math.random() - .5) * 10) + players[0].body.y
                this.ulting(fuzz)
                if (Math.random() < .01) {
                    // let wet = 0
                    // for(let t =0;t<players.length;t++){
                    //     if(lthis != players[t]){
                    //     let link = new LineOp(this.body, players[t].body)
                    //     if(link.hypotenuse() < 730){
                    //         wet = 1
                    //     }
                    // }
                    // }
                    // if(wet == 1){
                    // this.gas(fuzz)

                    this.gason *= -1
                    // }
                }
                if (this.mana < this.gascost * 10) {
                    this.gason = -1
                }

                if (this.mana > this.flipcost + Math.max(this.gascost, this.gluecost)) {
                    if (Math.random() < .003) {
                        if (this.health < this.maxhealth - this.flippower) {
                            this.flip()
                        }
                    }
                }
                fuzz.x = ((Math.random() - .5) * this.gluerange * .7) + this.body.x
                fuzz.y = ((Math.random() - .5) * this.gluerange * .7) + this.body.y
                if (!beam1.isPointInside(fuzz) && !beam2.isPointInside(fuzz)) {
                    if (Math.random() < .005) {
                        this.glue(fuzz)
                    }
                }
            }

        }
        gas(to) {
            if (this.mana >= this.gascost) {
                if (this.gascooldown <= 0) {
                    let pin = new Gas(this.body, to, this)
                    this.gasses.push(pin)
                    this.gascooldown = this.gasdrain
                    this.mana -= this.gascost
                }
            }

        }
        ulting(to) {
            if (this.mana >= this.ultcost) {
                if (this.ultcooldown <= 0) {
                    this.ultcooldown = this.ultdrain
                    this.mana -= this.ultcost
                    this.ult = 1
                    this.ultrun = 400
                }
            }

        }
        gasdraw() {
            this.gastest()
            for (let t = 0; t < this.gasses.length; t++) {
                this.gasses[t].move()
                this.gasses[t].draw()
                // this.gasses[t].life--
            }
            for (let t = 0; t < this.gasses.length; t++) {
                if (this.gasses[t].life <= 0) {
                    this.gasses.splice(t, 1)
                }
            }


        }
        gluedraw() {
            for (let t = 0; t < this.glues.length; t++) {
                this.glues[t].draw()
                this.glues[t].life--
            }
            for (let t = 0; t < this.glues.length; t++) {
                if (this.glues[t].life <= 0) {
                    this.glues.splice(t, 1)
                }
            }


        }
        flip(to) {
            if (this.mana > this.flipcost) {
                if (this.flipcooldown <= 0) {
                    let hitbox = new Circle(to.x, to.y, 10, "black")
                    for (let t = 0; t < players.length; t++) {
                        if (this != players[t]) {
                            if (players[t].body.doesPerimeterTouch(hitbox)) {
                                players[t].health -= this.flippower
                                this.flipcooldown = this.flipdrain
                                this.mana -= this.flipcost
                                players[t].moveto.x = (1 * (this.body.x - hitbox.x)) + this.body.x
                                players[t].moveto.y = (1 * (this.body.y - hitbox.y)) + this.body.y
                                let landingbox = new Circle((1 * (this.body.x - hitbox.x)) + this.body.x, (1 * (this.body.y - hitbox.y)) + this.body.y, 10, "red")
                                let k = 0
                                while (!landingbox.doesPerimeterTouch(players[t].body)) {
                                    players[t].drive()
                                    players[t].body.move()
                                    k++
                                    if (k > 1000) {
                                        break
                                    }
                                }
                                break
                            } else {
                                for (let k = 0; k < players[t].army.length; k++) {
                                    if (players[t].army[k].body.doesPerimeterTouch(hitbox)) {
                                        players[t].army[k].body.x = (1 * (this.body.x - hitbox.x)) + this.body.x
                                        players[t].army[k].body.y = (1 * (this.body.y - hitbox.y)) + this.body.y
                                        players[t].army[k].health -= this.flippower
                                        this.flipcooldown = this.flipdrain
                                        this.mana -= this.flipcost
                                        break
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        glue(to) {
            if (this == players[0]) {
                to.x = this.body.x + (to.x - (canvas.width * .5))
                to.y = this.body.y + (to.y - (canvas.height * .5))
            }
            let glue = new Glue(this.body, to, this)
            let wet = 0
            for (let t = 0; t < players.length; t++) {
                if (players[t].body.doesPerimeterTouch(glue.body)) {
                    wet = 1
                }
            }
            if (this.gluecooldown <= 0) {
                let link = new LineOP(this.body, to)
                if (link.hypotenuse() < this.gluerange) {
                    if (this.mana >= this.gluecost) {
                    } else {
                        wet = 1
                    }
                } else {
                    wet = 1
                }
            } else {
                wet = 1
            }
            if (wet == 0) {

                this.glues.push(glue)
                this.mana -= this.gluecost
                this.gluecooldown = this.gluedrain
            }



        }
        gluedrawstager() {
            this.gluedraw()
        }
        draw() {
            if (this == players[0]) {
                canvas_context.fillStyle = "gold"
                canvas_context.font = "20px arial"
                canvas_context.fillText(`${this.gold}`, this.body.x - 340, this.body.y - 340)
            }

            if (this == players[0]) {
                let towards = new Point(0, 0)
                if (players[0].pincushion == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 100) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 100) + this.body.y
                } else if (players[0].gasbag == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 50) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 50) + this.body.y
                } else if (players[0].blindmonk == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 100) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 100) + this.body.y
                } else if (players[0].robofister == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 200) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 200) + this.body.y
                } else if (players[0].foxghost == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 120) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 120) + this.body.y
                } else if (players[0].aliensquid == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 120) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 120) + this.body.y
                }

                let link = new LineOP(this.body, towards, "white", 1)
                link.draw()
            }

            this.regen()
            this.drive()
            this.locked--
            let check = new LineOP(this.moveto, this.body)
            if (check.hypotenuse() > (.7 * (this.movespeedbase + this.speedbonus))) {
                this.body.move()
            } else if (this.locked > 0) {
                this.body.move()
            }

            if (keysPressed['e']) {
                if (this == players[0]) {
                    let circ = new Circle(this.body.x, this.body.y, this.gluerange, "black")
                    canvas_context.strokeStyle = circ.color
                    canvas_context.beginPath()
                    canvas_context.arc(circ.x, circ.y, circ.radius, 0, Math.PI * 2, true)
                    canvas_context.stroke()
                    canvas_context.closePath()
                }
            }
            this.body.draw()
            this.basic()
            this.healthbar = new Rectangle(this.body.x - this.body.radius, this.body.y - (this.body.radius * 2), this.body.radius * 2, this.body.radius * .25, "green")
            this.healthbar.width = (this.health / this.healthmax) * this.body.radius * 2
            this.manabar = new Rectangle(this.body.x - this.body.radius, this.body.y - (this.body.radius * 1.6), this.body.radius * 2, this.body.radius * .25, "blue")
            this.manabar.width = (this.mana / this.manamax) * this.body.radius * 2
            this.healthbar.draw()
            this.manabar.draw()
            this.gasdraw()
            this.cooldown()
            this.collide()
        }
        basic() {
            this.basictimer++
            let min = this.basicrange
            this.basictarget = {}
            for (let t = 0; t < players.length; t++) {
                if (players[t] != this) {
                    for (let k = 0; k < players[t].army.length; k++) {
                        let link = new LineOP(this.body, players[t].army[k].body)
                        if (link.hypotenuse() <= min) {
                            min = link.hypotenuse()
                            this.basictarget = players[t].army[k]
                        }
                        let link2 = new LineOP(this.body, players[t].body)
                        if (link2.hypotenuse() <= this.basicrange) {
                            this.basictarget = players[t]
                        }
                    }
                }
            }

            this.basicAttack()
        }
        basicAttack() {
            if (this.basictarget.health > 0) {
                if (this.basictimer % this.basicrate == 0) {
                    this.basictarget.health -= this.basicdamage
                }
                if (this.basictimer % this.basicrate <= 9) {
                    let link = new LineOP(this.body, this.basictarget.body, "black", 4)
                    link.draw()
                }
            }
        }
        collide() {
            for (let t = 0; t < players.length; t++) {
                if (this != players[t]) {
                    if (players[t].gasbag == 1) {
                        for (let k = 0; k < players[t].gasses.length; k++) {
                            if (players[t].gasses[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].gasdamage)
                            }
                        }
                        for (let k = 0; k < players[t].glues.length; k++) {
                            if (players[t].glues[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].gluedamage)
                                this.speedbonus = players[t].gluedrop
                            }
                        }
                    } else if (players[t].pincushion == 1) {
                        for (let k = 0; k < players[t].spears.length; k++) {
                            if (players[t].spears[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].speardamage - (players[t].spears[k].life))
                                players[t].spears[k].life = 0
                            } else if (players[t].spears[k].shaft.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].speardamage - (players[t].spears[k].life))
                                players[t].spears[k].life = 0
                            }
                        }
                        for (let k = 0; k < players[t].traps.length; k++) {
                            if (players[t].traps[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].trapdamage)
                                this.speedbonus = players[t].trapdrop
                                players[t].traps[k].life = 0
                            }
                        }
                    } else if (players[t].blindmonk == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                this.speedbonus = players[t].slamdrop
                            }
                        }
                        for (let k = 0; k < players[t].orblist.length; k++) {
                            if (players[t].orblist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].orbdamage)
                                players[t].dashtarget.x = this.body.x
                                players[t].dashtarget.y = this.body.y
                                players[t].dashstate = 1
                                players[t].orblist[k].life = 0
                            }
                        }
                    } else if (players[t].robofister == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                this.speedbonus = players[t].slamdrop
                            }
                        }
                        for (let k = 0; k < players[t].hooklist.length; k++) {
                            if (players[t].hooklist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].hookdamage)
                                this.dashtarget.x = players[t].body.x
                                this.dashtarget.y = players[t].body.y
                                this.moveto.x = players[t].body.x
                                this.moveto.y = players[t].body.y
                                this.moveto.radius = players[t].body.radius
                                this.speedbonus = 7
                                let link = new LineOP(this.body, this.dashtarget)
                                let hookdot = (link.hypotenuse()) / (this.movespeedbase + this.speedbonus)
                                this.locked = Math.round(hookdot)
                                this.lockholder = Math.round(hookdot)
                                players[t].hooklist[k].life = 0
                                ////console.log(this)
                            }
                        }
                    } else if (players[t].aliensquid == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                this.speedbonus = players[t].slamdrop
                            }
                        }
                        for (let k = 0; k < players[t].spears.length; k++) {
                            if (players[t].spears[k].engage == 0) {
                                if (players[t].spears[k].body.doesPerimeterTouch(this.body)) {
                                    this.health -= players[t].speardamage
                                    players[t].spears[k].life = 0
                                }
                            } else {
                                if (players[t].spears[k].body1.doesPerimeterTouch(this.body)) {
                                    if (players[t].spears[k].life1 != 0) {
                                        this.health -= players[t].speardamage
                                        players[t].spears[k].life1 = 0
                                    }
                                }
                                if (players[t].spears[k].body2.doesPerimeterTouch(this.body)) {
                                    if (players[t].spears[k].life2 != 0) {
                                        this.health -= players[t].speardamage
                                        players[t].spears[k].life2 = 0
                                    }
                                }
                            }
                        }
                    } else if (players[t].foxghost == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                players[t].slamdamage = 0
                                players[t].theftcount++
                                if (players[t].theftcount >= 9) {
                                    players[t].theftcount = 0
                                    players[t].health += players[t].theftbonus
                                }
                            }
                        }
                        for (let k = 0; k < players[t].orblist.length; k++) {
                            if (players[t].orblist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].orbdamage)
                                players[t].theftcount++
                                if (players[t].theftcount >= 9) {
                                    players[t].theftcount = 0
                                    players[t].health += players[t].theftbonus
                                }
                            }
                        }
                        for (let k = 0; k < players[t].hooklist.length; k++) {
                            if (players[t].hooklist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].hookdamage)
                                this.dashtarget.x = players[t].body.x
                                this.dashtarget.y = players[t].body.y
                                this.moveto.x = players[t].body.x
                                this.moveto.y = players[t].body.y
                                this.moveto.radius = players[t].body.radius
                                this.speedbonus = 7
                                let link = new LineOP(this.body, this.dashtarget)
                                let hookdot = ((link.hypotenuse()) / (this.movespeedbase + this.speedbonus)) * 2
                                this.speedbonus = -.4
                                this.locked = Math.round(hookdot)
                                this.lockholder = Math.round(hookdot)
                                players[t].hooklist[k].life = 0
                                players[t].theftcount++
                                if (players[t].theftcount >= 9) {
                                    players[t].theftcount = 0
                                    players[t].health += players[t].theftbonus
                                }
                            }
                        }
                    } else if (players[t].demontaur == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                players[t].health += (players[t].slamdamage) * .2
                            }
                        }
                        for (let k = 0; k < players[t].orblist.length; k++) {
                            if (players[t].orblist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].orbdamage)
                            }
                        }
                    } else if (players[t].inventrix == 1) {
                        for (let k = 0; k < players[t].hooklist.length; k++) {
                            if (players[t].hooklist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].hookdamage)
                                this.dashtarget.x = players[t].body.x
                                this.dashtarget.y = players[t].body.y
                                this.moveto.x = players[t].body.x
                                this.moveto.y = players[t].body.y
                                this.moveto.radius = players[t].body.radius
                                this.speedbonus = (-1 * (this.movespeedbase + this.speedboost)) + .0000001
                                let hookdot = 200
                                this.locked = Math.round(hookdot)
                                this.lockholder = Math.round(hookdot)
                                players[t].hooklist[k].life = 0
                            }
                        }
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                players[t].health += (players[t].slamdamage) * .2
                            }
                        }
                        for (let k = 0; k < players[t].orblist.length; k++) {
                            if (players[t].orblist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].orbdamage)
                                players[t].orblist[k].life = 0
                            }
                        }
                    }else if (players[t].artsassin == 1) {
                        for (let k = 0; k < players[t].spears.length; k++) {
                                if (players[t].spears[k].body.doesPerimeterTouch(this.body)) {
                                    this.health -= players[t].speardamage
                                    
                                this.speedbonus = (-1 * (this.movespeedbase + this.speedboost)) + .0000001
                                let hookdot = 200
                                this.locked = Math.round(hookdot)
                                this.lockholder = Math.round(hookdot)
                                }
                        }
                        for (let k = 0; k < players[t].traps.length; k++) {
                            if (players[t].traps[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].trapdamage)
                                this.speedbonus = (-1 * (this.movespeedbase + this.speedboost)) + .0000001
                                let hookdot = 200
                                this.locked = Math.round(hookdot)
                                this.lockholder = Math.round(hookdot)
                                players[t].traps[k].life = 0
                            }
                        }
                    }
                    if (this.health <= 0) {
                        players[t].gold += this.goldvalue
                        break
                    }
                }
            }

        }

    }




    class Blindmonk {
        constructor(x, y, color) {
            this.aliensquid = 0
            this.speedboost = 0
            this.gold = 500
            this.goldvalue = 300
            this.lockholder = -1
            this.ult = 0
            this.body = new Circle(x, y, 10, color)
            this.movespeedbase = 1
            this.slamdrop = -.8
            this.speedbonus = 0
            this.shieldcost = 30
            this.shieldpower = 150
            this.shieldtimer = 100
            this.shielddrain = 140
            this.shieldcooldown = 0
            this.shieldstate = 0
            this.health = 950
            this.healthmax = this.health
            this.mana = 100
            this.manamax = this.mana
            this.moveto = {}
            this.moveto.x = this.body.x - 1.01
            this.moveto.y = this.body.y
            this.moveto.radius = this.body.radius
            this.dashtarget = {}
            this.dashtarget.x = this.body.x
            this.dashtarget.y = this.body.y
            this.dashtarget.radius = 0
            this.slamcost = 40
            this.dashstate = -1
            this.mps = .5
            this.hps = .15
            this.gluerange = 75
            this.flippower = 150
            this.fliprange = 50
            this.slams = []
            this.orblist = []
            this.locked = 0
            this.orbcost = 25
            this.orbcooldown = 0
            this.orbdamage = 60
            this.orbdrain = 200
            this.slamdamage = 10
            this.slamcooldown = 0
            this.slamdrain = 300
            this.army = []
            this.spawner = 0
            this.spawnpoint = new Point(this.body.x, this.body.y)
            this.blindmonk = 1
            this.robofister = 0
            this.pincushion = 0
            this.gasbag = 0
            this.ultcost = 25
            this.ultcooldown = 0
            this.ultdrain = 1000
            this.ultrun = 0
            this.basicrate = 30
            this.basictimer = 0
            this.basicrange = 25
            this.basictarget = {}
            this.basicdamage = 45

        }
        marshal() {
            if (this.spawner % 1000 == 20) {
                let minion = new Mob(this.base.body.x, this.base.body.y, this)
                this.army.push(minion)
            }
            if (this.spawner % 1000 == 40) {
                let minion = new Mob(this.base.body.x, this.base.body.y, this)
                this.army.push(minion)
            }
            if (this.spawner % 1000 == 60) {
                let minion = new Mob(this.base.body.x, this.base.body.y, this)
                this.army.push(minion)
            }
            if (this.spawner % 1000 == 80) {
                let minion = new Mob(this.base.body.x, this.base.body.y, this)
                this.army.push(minion)
            }
            if (this.spawner % 1000 == 100) {
                let minion = new Mob(this.base.body.x, this.base.body.y, this)
                this.army.push(minion)
            }
            this.spawner++
            this.burial()
            this.command()
            this.burial()
        }
        command() {
            for (let t = 0; t < this.army.length; t++) {
                this.army[t].drawbar()
            }
            for (let t = 0; t < this.army.length; t++) {
                this.army[t].draw()
            }
            for (let t = 0; t < this.army.length; t++) {
                this.army[t].drawbar()
            }
        }
        burial() {
            for (let t = 0; t < this.army.length; t++) {
                if (this.army[t].health <= 0) {
                    this.army.splice(t, 1)
                }
            }
            for (let t = 0; t < this.army.length; t++) {
                this.army[t].drawbar()
            }

        }
        cooldown() {
            this.slamcooldown--
            this.shieldcooldown--
            this.orbcooldown--
            this.ultcooldown--
            if (this.orbcooldown <= 0) {
                this.dashstate = -1
            }
        }
        regen() {
            if (this.ultrun > 0) {
                this.ult = 1
            } else {
                this.ult = 0
            }
            this.marshal()
            if (this.health > 0) {
                if (this.ult == 1) {
                    this.mana += this.mps
                    this.health += this.hps
                    this.mana += this.mps
                    this.health += this.hps
                    this.movespeedbase = 1.8
                } else {
                    this.movespeedbase = 1
                }
                this.mana += this.mps
                this.health += this.hps
                if (this.health > this.healthmax) {
                    this.health = this.healthmax
                }
                if (this.mana > this.manamax) {
                    this.mana = this.manamax
                }
            } else {
                this.ult = 0
                this.ultrun = 0
                if (this == players[0]) {
                    canvas_context.translate(this.body.x - this.spawnpoint.x, this.body.y - this.spawnpoint.y)
                }
                this.health = this.healthmax
                this.mana = this.manamax
                this.body.y = this.spawnpoint.y
                this.body.x = this.spawnpoint.x
                this.moveto.x = this.body.x + 1
                this.moveto.y = this.body.y + 1
                this.speedbonus = 0
            }
            this.speedbonus *= .999
        }
        control(to) {
            if (this.locked <= 0) {
                if (this == players[0]) {
                    this.moveto.x = this.body.x + (to.x - (canvas.width * .5))
                    this.moveto.y = this.body.y + (to.y - (canvas.height * .5))
                } else {
                    this.moveto.x = to.x
                    this.moveto.y = to.y
                }
            }
            if (this.body.doesPerimeterTouch(this.dashtarget)) {
                this.locked = 0
            }
            if (Math.round(this.locked) == 0) {
                this.speedbonus = 0
            }
        }
        drive() {
            if (typeof this.speedbonus == "undefined") {
                this.speedbonus = 0
            }
            if (this.locked <= 0 || this.locked == this.lockholder) {
                this.body.xmom = 0 - (this.body.x - this.moveto.x)
                this.body.ymom = 0 - (this.body.y - this.moveto.y)

                // if(Math.sqrt(Math.abs(this.body.xmom*this.body.xmom)+Math.abs(this.body.ymom*this.body.ymom)) != 0){
                let k = 0
                while (Math.sqrt(Math.abs(this.body.xmom * this.body.xmom) + Math.abs(this.body.ymom * this.body.ymom)) > (this.movespeedbase + this.speedbonus)) {
                    this.body.xmom *= 0.98
                    this.body.ymom *= 0.98
                    if (k == 10000) {
                        break
                    }
                }
                k = 0
                while (Math.sqrt(Math.abs(this.body.xmom * this.body.xmom) + Math.abs(this.body.ymom * this.body.ymom)) < (this.movespeedbase + this.speedbonus)) {
                    this.body.xmom *= 1.02
                    this.body.ymom *= 1.02
                    if (k == 10000) {
                        break
                    }
                }
            }
            if (this.body.doesPerimeterTouch(this.dashtarget)) {
                this.locked = 0
            }
            if (Math.round(this.locked) == 0) {
                this.speedbonus = 0
            }
        }
        gamepadSkillsAdapter(to) {

            let towards = new Point(0, 0)
            towards.x = (Math.cos(gamepad_angles().left) * 100) + 360
            towards.y = (Math.sin(gamepad_angles().left) * 100) + 360

            let link = new LineOP(this.body, towards)
            link.draw()

            if (gamepadAPI.buttonsStatus.includes('Left-Trigger')) {
                this.orbs(towards)
            }
            if (gamepadAPI.buttonsStatus.includes('Right-Trigger')) {
                towards.x = (Math.cos(gamepad_angles().left) * this.gluerange) + 360
                towards.y = (Math.sin(gamepad_angles().left) * this.gluerange) + 360
                this.shielder(towards)
            }
            if (gamepadAPI.buttonsStatus.includes('RB')) {

                towards.x = (Math.cos(gamepad_angles().left) * this.fliprange) + this.body.x
                towards.y = (Math.sin(gamepad_angles().left) * this.fliprange) + this.body.y
                this.slam(towards)
            }
            if (gamepadAPI.buttonsStatus.includes('LB')) {
                this.ulting(towards)
            }
        }
        skillsAdapter(to) {
            if (this == players[0]) {
                if (keysPressed['q']) {
                    this.orbs(to)
                }
                if (keysPressed['w']) {
                    this.shielder(to)
                }
                if (keysPressed['e']) {
                    this.slam(to)
                }
                if (keysPressed['r']) {
                    this.ulting(to)
                }
            } else {
                let fuzz = {}
                fuzz.x = ((Math.random() - .5) * 10) + players[0].body.x
                fuzz.y = ((Math.random() - .5) * 10) + players[0].body.y
                this.ulting(fuzz)
                this.slam(fuzz)

                if (this.mana > this.flipcost + Math.max(this.gascost, this.gluecost)) {
                    if (Math.random() < .003) {
                        if (this.health < this.maxhealth - this.flippower) {
                            this.shielder(fuzz)
                        }
                    }
                }
                // fuzz.x = ((Math.random() - .5) * this.gluerange * .7) + this.body.x
                // fuzz.y = ((Math.random() - .5) * this.gluerange * .7) + this.body.y
                if (!beam1.isPointInside(fuzz) && !beam2.isPointInside(fuzz)) {
                    if (Math.random() < .005) {
                        this.orbs(fuzz)
                    } else if (this.health > this.healthmax * .5) {
                        if (this.dashstate == 0) {
                            this.orbs(fuzz)
                        }
                    }
                }
            }

        }
        slam(to) {
            if (this.mana >= this.slamcost) {
                if (this.slamcooldown <= 0) {
                    let pin = new Slam(this.body, to, this)
                    this.slams.push(pin)
                    this.slamcooldown = this.slamdrain
                    this.mana -= this.slamcost
                }
            }

        }
        slamdraw() {
            for (let t = 0; t < this.slams.length; t++) {
                this.slams[t].move()
                this.slams[t].draw()
                this.slams[t].life -= .2
            }
            for (let t = 0; t < this.slams.length; t++) {
                if (this.slams[t].life <= 0) {
                    this.slams.splice(t, 1)
                }
            }

        }
        ulting(to) {
            if (this.mana >= this.ultcost) {
                if (this.ultcooldown <= 0) {

                }
            }
        }
        shielder(to) {
            if (this.mana >= this.shieldcost) {
                if (this.shieldcooldown <= 0) {
                    this.activeshield = this.shieldpower
                    this.shieldcooldown = this.shielddrain
                }
            }
        }
        orbs(to) {

            if (this.orbcooldown <= 0) {
                if (this.dashstate == -1) {
                    if (this.mana > this.orbcost) {
                        if (this.orbcooldown <= 0) {
                            let pin = new Orb(this.body, to, this)
                            this.orblist.push(pin)
                            this.mana -= this.orbcost
                            this.orbcooldown = this.orbdrain
                            this.dashstate = 0
                        }
                    }
                }
            }
            if (this.dashstate == 1) {


                // this.moveto = this.dashtarget


                this.moveto.x = this.dashtarget.x
                this.moveto.y = this.dashtarget.y
                this.moveto.radius = this.dashtarget.radius
                this.speedbonus = 7
                this.mana -= this.orbcost
                let link = new LineOP(this.body, this.dashtarget)
                this.locked = (link.hypotenuse()) / (this.movespeedbase + this.speedbonus)
                this.lockholder = this.locked
                this.dashstate = 0
            }
        }
        orbdraw() {
            for (let t = 0; t < this.orblist.length; t++) {
                this.orblist[t].move()
                this.orblist[t].draw()
                this.orblist[t].life -= 1
            }
            for (let t = 0; t < this.orblist.length; t++) {
                if (this.orblist[t].life <= 0) {
                    this.orblist.splice(t, 1)
                }
            }
        }
        draw() {
            if (this == players[0]) {
                canvas_context.fillStyle = "gold"
                canvas_context.font = "20px arial"
                canvas_context.fillText(`${this.gold}`, this.body.x - 340, this.body.y - 340)
            }

            if (this == players[0]) {
                let towards = new Point(0, 0)
                if (players[0].pincushion == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 100) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 100) + this.body.y
                } else if (players[0].gasbag == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 50) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 50) + this.body.y
                } else if (players[0].blindmonk == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 100) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 100) + this.body.y
                } else if (players[0].robofister == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 200) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 200) + this.body.y
                } else if (players[0].foxghost == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 120) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 120) + this.body.y
                } else if (players[0].aliensquid == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 120) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 120) + this.body.y
                }

                let link = new LineOP(this.body, towards, "white", 1)
                link.draw()
            }

            this.regen()
            this.drive()
            this.locked--
            let check = new LineOP(this.moveto, this.body)
            if (check.hypotenuse() > (.7 * (this.movespeedbase + this.speedbonus))) {
                this.body.move()
            } else if (this.locked > 0) {
                this.body.move()
            }

            if (keysPressed['e']) {
                if (this == players[0]) {
                    let circ = new Circle(this.body.x, this.body.y, this.gluerange, "black")
                    canvas_context.strokeStyle = circ.color
                    canvas_context.beginPath()
                    canvas_context.arc(circ.x, circ.y, circ.radius, 0, Math.PI * 2, true)
                    canvas_context.stroke()
                    canvas_context.closePath()
                }
            }
            this.body.draw()
            this.basic()
            if (this.activeshield > 0) {
                let shield = new Circle(this.body.x, this.body.y, (this.activeshield * .020), "yellow")
                shield.draw()
            }
            this.healthbar = new Rectangle(this.body.x - this.body.radius, this.body.y - (this.body.radius * 2), this.body.radius * 2, this.body.radius * .25, "green")
            this.healthbar.width = (this.health / this.healthmax) * this.body.radius * 2
            this.manabar = new Rectangle(this.body.x - this.body.radius, this.body.y - (this.body.radius * 1.6), this.body.radius * 2, this.body.radius * .25, "red")
            this.manabar.width = (this.mana / this.manamax) * this.body.radius * 2
            this.healthbar.draw()
            this.manabar.draw()
            this.slamdraw()
            this.orbdraw()
            this.cooldown()
            this.collide()
        }
        basic() {
            this.basictimer++
            let min = this.basicrange
            this.basictarget = {}
            for (let t = 0; t < players.length; t++) {
                if (players[t] != this) {
                    for (let k = 0; k < players[t].army.length; k++) {
                        let link = new LineOP(this.body, players[t].army[k].body)
                        if (link.hypotenuse() <= min) {
                            min = link.hypotenuse()
                            this.basictarget = players[t].army[k]
                        }
                        let link2 = new LineOP(this.body, players[t].body)
                        if (link2.hypotenuse() <= this.basicrange) {
                            this.basictarget = players[t]
                        }
                    }
                }
            }

            this.basicAttack()
        }
        basicAttack() {
            if (this.basictarget.health > 0) {
                if (this.basictimer % this.basicrate == 0) {
                    this.basictarget.health -= this.basicdamage
                }
                if (this.basictimer % this.basicrate <= 9) {
                    let link = new LineOP(this.body, this.basictarget.body, "black", 4)
                    link.draw()
                }
            }
        }
        collide() {
            let dummy = this.health
            for (let t = 0; t < players.length; t++) {
                if (this != players[t]) {
                    if (players[t].gasbag == 1) {
                        for (let k = 0; k < players[t].gasses.length; k++) {
                            if (players[t].gasses[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].gasdamage)
                            }
                        }
                        for (let k = 0; k < players[t].glues.length; k++) {
                            if (players[t].glues[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].gluedamage)
                                this.speedbonus = players[t].gluedrop
                            }
                        }
                    } else if (players[t].pincushion == 1) {
                        for (let k = 0; k < players[t].spears.length; k++) {
                            if (players[t].spears[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].speardamage - (players[t].spears[k].life))
                                players[t].spears[k].life = 0
                            } else if (players[t].spears[k].shaft.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].speardamage - (players[t].spears[k].life))
                                players[t].spears[k].life = 0
                            }
                        }
                        for (let k = 0; k < players[t].traps.length; k++) {
                            if (players[t].traps[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].trapdamage)
                                this.speedbonus = players[t].trapdrop
                                players[t].traps[k].life = 0
                            }
                        }
                    } else if (players[t].blindmonk == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                this.speedbonus = players[t].slamdrop
                            }
                        }
                        for (let k = 0; k < players[t].orblist.length; k++) {
                            if (players[t].orblist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].orbdamage)
                                players[t].dashtarget.x = this.body.x
                                players[t].dashtarget.y = this.body.y
                                players[t].dashstate = 1
                                players[t].orblist[k].life = 0
                            }
                        }
                    } else if (players[t].robofister == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                this.speedbonus = players[t].slamdrop
                            }
                        }
                        for (let k = 0; k < players[t].hooklist.length; k++) {
                            if (players[t].hooklist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].hookdamage)
                                this.dashtarget.x = players[t].body.x
                                this.dashtarget.y = players[t].body.y
                                this.moveto.x = players[t].body.x
                                this.moveto.y = players[t].body.y
                                this.moveto.radius = players[t].body.radius
                                this.speedbonus = 7
                                let link = new LineOP(this.body, this.dashtarget)
                                let hookdot = (link.hypotenuse()) / (this.movespeedbase + this.speedbonus)
                                this.locked = Math.round(hookdot)
                                this.lockholder = Math.round(hookdot)
                                players[t].hooklist[k].life = 0
                                ////console.log(this)
                            }
                        }
                    } else if (players[t].aliensquid == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                this.speedbonus = players[t].slamdrop
                            }
                        }
                        for (let k = 0; k < players[t].spears.length; k++) {
                            if (players[t].spears[k].engage == 0) {
                                if (players[t].spears[k].body.doesPerimeterTouch(this.body)) {
                                    this.health -= players[t].speardamage
                                    players[t].spears[k].life = 0
                                }
                            } else {
                                if (players[t].spears[k].body1.doesPerimeterTouch(this.body)) {
                                    if (players[t].spears[k].life1 != 0) {
                                        this.health -= players[t].speardamage
                                        players[t].spears[k].life1 = 0
                                    }
                                }
                                if (players[t].spears[k].body2.doesPerimeterTouch(this.body)) {
                                    if (players[t].spears[k].life2 != 0) {
                                        this.health -= players[t].speardamage
                                        players[t].spears[k].life2 = 0
                                    }
                                }
                            }
                        }
                    } else if (players[t].foxghost == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                players[t].slamdamage = 0
                                players[t].theftcount++
                                if (players[t].theftcount >= 9) {
                                    players[t].theftcount = 0
                                    players[t].health += players[t].theftbonus
                                }
                            }
                        }
                        for (let k = 0; k < players[t].orblist.length; k++) {
                            if (players[t].orblist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].orbdamage)
                                players[t].theftcount++
                                if (players[t].theftcount >= 9) {
                                    players[t].theftcount = 0
                                    players[t].health += players[t].theftbonus
                                }
                            }
                        }
                        for (let k = 0; k < players[t].hooklist.length; k++) {
                            if (players[t].hooklist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].hookdamage)
                                this.dashtarget.x = players[t].body.x
                                this.dashtarget.y = players[t].body.y
                                this.moveto.x = players[t].body.x
                                this.moveto.y = players[t].body.y
                                this.moveto.radius = players[t].body.radius
                                this.speedbonus = 7
                                let link = new LineOP(this.body, this.dashtarget)
                                let hookdot = ((link.hypotenuse()) / (this.movespeedbase + this.speedbonus)) * 2
                                this.speedbonus = -.4
                                this.locked = Math.round(hookdot)
                                this.lockholder = Math.round(hookdot)
                                players[t].hooklist[k].life = 0
                                players[t].theftcount++
                                if (players[t].theftcount >= 9) {
                                    players[t].theftcount = 0
                                    players[t].health += players[t].theftbonus
                                }
                            }
                        }
                    } else if (players[t].demontaur == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                players[t].health += (players[t].slamdamage) * .2
                            }
                        }
                        for (let k = 0; k < players[t].orblist.length; k++) {
                            if (players[t].orblist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].orbdamage)
                            }
                        }
                    } else if (players[t].inventrix == 1) {
                        for (let k = 0; k < players[t].hooklist.length; k++) {
                            if (players[t].hooklist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].hookdamage)
                                this.dashtarget.x = players[t].body.x
                                this.dashtarget.y = players[t].body.y
                                this.moveto.x = players[t].body.x
                                this.moveto.y = players[t].body.y
                                this.moveto.radius = players[t].body.radius
                                this.speedbonus = (-1 * (this.movespeedbase + this.speedboost)) + .0000001
                                let hookdot = 200
                                this.locked = Math.round(hookdot)
                                this.lockholder = Math.round(hookdot)
                                players[t].hooklist[k].life = 0
                            }
                        }
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                players[t].health += (players[t].slamdamage) * .2
                            }
                        }
                        for (let k = 0; k < players[t].orblist.length; k++) {
                            if (players[t].orblist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].orbdamage)
                                players[t].orblist[k].life = 0
                            }
                        }
                    }else if (players[t].artsassin == 1) {
                        for (let k = 0; k < players[t].spears.length; k++) {
                                if (players[t].spears[k].body.doesPerimeterTouch(this.body)) {
                                    this.health -= players[t].speardamage
                                    
                                this.speedbonus = (-1 * (this.movespeedbase + this.speedboost)) + .0000001
                                let hookdot = 200
                                this.locked = Math.round(hookdot)
                                this.lockholder = Math.round(hookdot)
                                }
                        }
                        for (let k = 0; k < players[t].traps.length; k++) {
                            if (players[t].traps[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].trapdamage)
                                this.speedbonus = (-1 * (this.movespeedbase + this.speedboost)) + .0000001
                                let hookdot = 200
                                this.locked = Math.round(hookdot)
                                this.lockholder = Math.round(hookdot)
                                players[t].traps[k].life = 0
                            }
                        }
                    }
                    if (this.health <= 0) {
                        players[t].gold += this.goldvalue
                        break
                    }
                }
            }


            if (dummy > this.health) {
                if (this.activeshield > 0) {
                    if (this.activeshield >= dummy - this.health) {
                        this.activeshield -= dummy - this.health
                        this.health = dummy
                    } else {
                        this.health += this.activeshield
                        this.activeshield = 0
                    }
                }
            }
        }

    }

    class Foxghost {
        constructor(x, y, color) {
            this.aliensquid = 0
            this.speedboost = 0
            this.theftcount = 0
            this.theftbonus = 10
            this.gold = 500
            this.goldvalue = 300
            this.lockholder = -1
            this.ult = 0
            this.body = new Circle(x, y, 10, color)
            this.movespeedbase = 1
            this.slamdrop = -.8
            this.speedbonus = 0
            this.shieldcost = 30
            this.shieldpower = 150
            this.shieldtimer = 100
            this.shielddrain = 140
            this.shieldcooldown = 0
            this.shieldstate = 0
            this.health = 950
            this.healthmax = this.health
            this.mana = 400
            this.manamax = this.mana
            this.moveto = {}
            this.moveto.x = this.body.x - 1.01
            this.moveto.y = this.body.y
            this.moveto.radius = this.body.radius
            this.dashtarget = {}
            this.dashtarget.x = this.body.x
            this.dashtarget.y = this.body.y
            this.dashtarget.radius = 0
            this.slamcost = 40
            this.dashstate = -1
            this.mps = .2
            this.hps = .15
            this.gluerange = 75
            this.flippower = 150
            this.fliprange = 50
            this.slams = []
            this.orblist = []
            this.locked = 0
            this.orbcost = 70
            this.orbcooldown = 0
            this.orbdamage = 26
            this.orbdrain = 200
            this.slamdamage = 190
            this.slamcooldown = 0
            this.slamdrain = 300
            this.army = []
            this.spawner = 0
            this.spawnpoint = new Point(this.body.x, this.body.y)
            this.blindmonk = 0
            this.foxghost = 1
            this.robofister = 0
            this.pincushion = 0
            this.gasbag = 0
            this.ultcost = 100
            this.ultcooldown = 0
            this.ultdrain = 1000
            this.ultrun = 0
            this.basicrate = 80
            this.basictimer = 0
            this.basicrange = 90
            this.basictarget = {}
            this.basicdamage = 90
            this.dashrange = 99

            this.hooklist = []
            this.hookcost = 55
            this.hookcooldown = 0
            this.hookdamage = 120
            this.hookdrain = 180

        }
        marshal() {
            if (this.spawner % 1000 == 20) {
                let minion = new Mob(this.base.body.x, this.base.body.y, this)
                this.army.push(minion)
            }
            if (this.spawner % 1000 == 40) {
                let minion = new Mob(this.base.body.x, this.base.body.y, this)
                this.army.push(minion)
            }
            if (this.spawner % 1000 == 60) {
                let minion = new Mob(this.base.body.x, this.base.body.y, this)
                this.army.push(minion)
            }
            if (this.spawner % 1000 == 80) {
                let minion = new Mob(this.base.body.x, this.base.body.y, this)
                this.army.push(minion)
            }
            if (this.spawner % 1000 == 100) {
                let minion = new Mob(this.base.body.x, this.base.body.y, this)
                this.army.push(minion)
            }
            this.spawner++
            this.burial()
            this.command()
            this.burial()
        }
        command() {
            for (let t = 0; t < this.army.length; t++) {
                this.army[t].drawbar()
            }
            for (let t = 0; t < this.army.length; t++) {
                this.army[t].draw()
            }
            for (let t = 0; t < this.army.length; t++) {
                this.army[t].drawbar()
            }
        }
        burial() {
            for (let t = 0; t < this.army.length; t++) {
                if (this.army[t].health <= 0) {
                    this.army.splice(t, 1)
                }
            }
            for (let t = 0; t < this.army.length; t++) {
                this.army[t].drawbar()
            }

        }
        cooldown() {
            this.slamcooldown--
            this.shieldcooldown--
            this.orbcooldown--
            this.ultcooldown--
            this.ulttimer--
            this.hookcooldown--
            if (this.orbcooldown <= 0) {
                this.dashstate = -1
            }
        }
        regen() {
            if (this.ultrun > 0) {
                this.ult = 1
            } else {
                this.ult = 0
            }
            this.marshal()
            if (this.health > 0) {
                if (this.ult == 1) {
                    this.mana += this.mps
                    this.health += this.hps
                    this.mana += this.mps
                    this.health += this.hps
                    this.movespeedbase = 1.8
                } else {
                    this.movespeedbase = 1
                }
                this.mana += this.mps
                this.health += this.hps
                if (this.health > this.healthmax) {
                    this.health = this.healthmax
                }
                if (this.mana > this.manamax) {
                    this.mana = this.manamax
                }
            } else {
                this.ult = 0
                this.ultrun = 0
                if (this == players[0]) {
                    canvas_context.translate(this.body.x - this.spawnpoint.x, this.body.y - this.spawnpoint.y)
                }
                this.health = this.healthmax
                this.mana = this.manamax
                this.body.y = this.spawnpoint.y
                this.body.x = this.spawnpoint.x
                this.moveto.x = this.body.x + 1
                this.moveto.y = this.body.y + 1
                this.speedbonus = 0
            }
            this.speedbonus *= .999
        }
        control(to) {
            if (this.locked <= 0) {
                if (this == players[0]) {
                    this.moveto.x = this.body.x + (to.x - (canvas.width * .5))
                    this.moveto.y = this.body.y + (to.y - (canvas.height * .5))
                } else {
                    this.moveto.x = to.x
                    this.moveto.y = to.y
                }
            }
            if (this.body.doesPerimeterTouch(this.dashtarget)) {
                this.locked = 0
            }
            if (Math.round(this.locked) == 0) {
                this.speedbonus = 0
            }
        }
        drive() {
            if (typeof this.speedbonus == "undefined") {
                this.speedbonus = 0
            }
            if (this.locked <= 0 || this.locked == this.lockholder) {
                this.body.xmom = 0 - (this.body.x - this.moveto.x)
                this.body.ymom = 0 - (this.body.y - this.moveto.y)

                // if(Math.sqrt(Math.abs(this.body.xmom*this.body.xmom)+Math.abs(this.body.ymom*this.body.ymom)) != 0){
                let k = 0
                while (Math.sqrt(Math.abs(this.body.xmom * this.body.xmom) + Math.abs(this.body.ymom * this.body.ymom)) > (this.movespeedbase + this.speedbonus)) {
                    this.body.xmom *= 0.98
                    this.body.ymom *= 0.98
                    if (k == 10000) {
                        break
                    }
                }
                k = 0
                while (Math.sqrt(Math.abs(this.body.xmom * this.body.xmom) + Math.abs(this.body.ymom * this.body.ymom)) < (this.movespeedbase + this.speedbonus)) {
                    this.body.xmom *= 1.02
                    this.body.ymom *= 1.02
                    if (k == 10000) {
                        break
                    }
                }
            }
            if (this.body.doesPerimeterTouch(this.dashtarget)) {
                this.locked = 0
            }
            if (Math.round(this.locked) == 0) {
                this.speedbonus = 0
            }
        }
        gamepadSkillsAdapter(to) {

            let towards = new Point(0, 0)
            towards.x = (Math.cos(gamepad_angles().left) * 100) + 360
            towards.y = (Math.sin(gamepad_angles().left) * 100) + 360

            let link = new LineOP(this.body, towards)
            link.draw()

            if (gamepadAPI.buttonsStatus.includes('Left-Trigger')) {
                this.orbs(towards)
            }
            if (gamepadAPI.buttonsStatus.includes('Right-Trigger')) {
                towards.x = (Math.cos(gamepad_angles().left) * this.gluerange) + 360
                towards.y = (Math.sin(gamepad_angles().left) * this.gluerange) + 360
                this.hooks(towards)
            }
            if (gamepadAPI.buttonsStatus.includes('RB')) {

                towards.x = (Math.cos(gamepad_angles().left) * this.fliprange) + this.body.x
                towards.y = (Math.sin(gamepad_angles().left) * this.fliprange) + this.body.y
                this.slam(towards)
            }
            if (gamepadAPI.buttonsStatus.includes('LB')) {
                towards.x = (Math.cos(gamepad_angles().left) * this.dashrange) + this.body.x
                towards.y = (Math.sin(gamepad_angles().left) * this.dashrange) + this.body.y
                this.ultdash(towards)
            }
        }
        skillsAdapter(to) {
            if (this == players[0]) {
                if (keysPressed['q']) {
                    this.orbs(to)
                }
                if (keysPressed['w']) {
                    this.hooks(to)
                }
                if (keysPressed['e']) {
                    this.slam(to)
                }
                if (keysPressed['r']) {
                    this.ultdash(to)
                }
            } else {
                let fuzz = {}
                fuzz.x = ((Math.random() - .5) * 10) + players[0].body.x
                fuzz.y = ((Math.random() - .5) * 10) + players[0].body.y
                this.ultdash(fuzz)
                this.slam(fuzz)

                // if (Math.random() < .003) {
                this.hooks(fuzz)
                // }
                // fuzz.x = ((Math.random() - .5) * this.gluerange * .7) + this.body.x
                // fuzz.y = ((Math.random() - .5) * this.gluerange * .7) + this.body.y
                if (!beam1.isPointInside(fuzz) && !beam2.isPointInside(fuzz)) {
                    if (Math.random() < .005) {
                        this.orbs(fuzz)
                    } else if (this.health > this.healthmax * .5) {
                        if (this.dashstate == 0) {
                            this.orbs(fuzz)
                        }
                    }
                }
            }

        }

        hooks(to) {
            if (this.hookcooldown <= 0) {
                if (this.mana > this.hookcost) {
                    if (this.hookcooldown <= 0) {
                        let pin = new PullOrb(this.body, to, this)
                        this.hooklist.push(pin)
                        this.mana -= this.hookcost
                        this.hookcooldown = this.hookdrain
                    }
                }
            }
        }
        hookdraw() {
            for (let t = 0; t < this.hooklist.length; t++) {
                this.hooklist[t].move()
                this.hooklist[t].draw()
                this.hooklist[t].life -= 1
            }
            for (let t = 0; t < this.hooklist.length; t++) {
                if (this.hooklist[t].life <= 0) {
                    this.hooklist.splice(t, 1)
                }
            }
        }
        slam(to) {
            if (this.mana >= this.slamcost) {
                if (this.slamcooldown <= 0) {
                    for (let t = 0; t < 3; t++) {
                        let pin = new Firespin(this.body, to, this, Math.PI * .66 * t)
                        this.slams.push(pin)
                    }
                    this.slamcooldown = this.slamdrain
                    this.mana -= this.slamcost
                }
            }

        }
        slamdraw() {
            for (let t = 0; t < this.slams.length; t++) {
                this.slams[t].move()
                this.slams[t].draw()
                this.slams[t].life -= .2
            }
            for (let t = 0; t < this.slams.length; t++) {
                if (this.slams[t].life <= 0) {
                    this.slams.splice(t, 1)
                }
            }

        }
        ulting(to) {
            if (this.mana >= this.ultcost) {
                if (this.ultcooldown <= 0) {

                }
            }
        }
        shielder(to) {
            if (this.mana >= this.shieldcost) {
                if (this.shieldcooldown <= 0) {
                    this.activeshield = this.shieldpower
                    this.shieldcooldown = this.shielddrain
                }
            }
        }
        orbs(to) {

            if (this.orbcooldown <= 0) {
                if (this.dashstate == -1) {
                    if (this.mana > this.orbcost) {
                        if (this.orbcooldown <= 0) {
                            let pin = new Orb(this.body, to, this)
                            this.orblist.push(pin)
                            this.mana -= this.orbcost
                            this.orbcooldown = this.orbdrain
                            this.dashstate = 0
                        }
                    }
                }
            }
            if (this.dashstate == 1) {
                this.moveto.x = this.dashtarget.x
                this.moveto.y = this.dashtarget.y
                this.moveto.radius = this.dashtarget.radius
                this.speedbonus = 7
                this.mana -= this.orbcost
                let link = new LineOP(this.body, this.dashtarget)
                this.locked = (link.hypotenuse()) / (this.movespeedbase + this.speedbonus)
                this.lockholder = this.locked
                this.dashstate = 0
            }
        }
        ultdash(to) {
            let link = new LineOP(this.body, to)
            if (link.hypotenuse() <= this.dashrange) {
                if (this.ultcooldown <= 0) {
                    if (this.mana >= this.ultcost) {
                        this.dashtate = 2
                        this.ulttimer = 100
                        this.dashtarget.x = to.x
                        this.dashtarget.y = to.y
                        this.moveto.x = this.dashtarget.x
                        this.moveto.y = this.dashtarget.y
                        this.moveto.radius = this.dashtarget.radius
                        this.speedbonus = 10
                        this.mana -= this.ultcost
                        this.ultcooldown = this.ultdrain
                        let link = new LineOP(this.body, this.dashtarget)
                        this.locked = (link.hypotenuse()) / (this.movespeedbase + this.speedbonus)
                        this.lockholder = this.locked
                    }
                }
                if (this.ulttimer < 70) {
                    if (this.dashtate > 0) {
                        if (this.ultcooldown >= this.ultcooldown * .8) {
                            this.dashtate--
                            this.ulttimer = 100
                            this.dashtarget.x = to.x
                            this.dashtarget.y = to.y
                            this.moveto.x = this.dashtarget.x
                            this.moveto.y = this.dashtarget.y
                            this.moveto.radius = this.dashtarget.radius
                            this.speedbonus = 10
                            let link = new LineOP(this.body, this.dashtarget)
                            this.locked = (link.hypotenuse()) / (this.movespeedbase + this.speedbonus)
                            this.lockholder = this.locked
                        }
                    }
                }
            }
        }
        orbs(to) {

            if (this.orbcooldown <= 0) {
                if (this.mana > this.orbcost) {
                    if (this.orbcooldown <= 0) {
                        let pin = new Fireorb(this.body, to, this)
                        this.orblist.push(pin)
                        this.mana -= this.orbcost
                        this.orbcooldown = this.orbdrain
                        this.dashstate = 0
                    }
                }
            }
        }
        orbdraw() {
            for (let t = 0; t < this.orblist.length; t++) {
                this.orblist[t].move()
                this.orblist[t].draw()
                this.orblist[t].life -= 1
            }
            for (let t = 0; t < this.orblist.length; t++) {
                if (this.orblist[t].life <= 0) {
                    this.orblist.splice(t, 1)
                }
            }
        }
        draw() {
            if (this == players[0]) {
                canvas_context.fillStyle = "gold"
                canvas_context.font = "20px arial"
                canvas_context.fillText(`${this.gold}`, this.body.x - 340, this.body.y - 340)
            }

            if (this == players[0]) {
                let towards = new Point(0, 0)
                if (players[0].pincushion == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 100) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 100) + this.body.y
                } else if (players[0].gasbag == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 50) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 50) + this.body.y
                } else if (players[0].blindmonk == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 100) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 100) + this.body.y
                } else if (players[0].robofister == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 200) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 200) + this.body.y
                } else if (players[0].foxghost == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 120) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 120) + this.body.y
                } else if (players[0].aliensquid == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 120) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 120) + this.body.y
                }


                let link = new LineOP(this.body, towards, "white", 1)
                link.draw()
            }

            this.regen()
            this.drive()
            this.locked--
            let check = new LineOP(this.moveto, this.body)
            if (check.hypotenuse() > (.7 * (this.movespeedbase + this.speedbonus))) {
                this.body.move()
            } else if (this.locked > 0) {
                this.body.move()
            }

            if (keysPressed['e']) {
                if (this == players[0]) {
                    let circ = new Circle(this.body.x, this.body.y, this.gluerange, "black")
                    canvas_context.strokeStyle = circ.color
                    canvas_context.beginPath()
                    canvas_context.arc(circ.x, circ.y, circ.radius, 0, Math.PI * 2, true)
                    canvas_context.stroke()
                    canvas_context.closePath()
                }
            }
            this.body.draw()
            this.basic()
            if (this.activeshield > 0) {
                let shield = new Circle(this.body.x, this.body.y, (this.activeshield * .020), "yellow")
                shield.draw()
            }
            this.healthbar = new Rectangle(this.body.x - this.body.radius, this.body.y - (this.body.radius * 2), this.body.radius * 2, this.body.radius * .25, "green")
            this.healthbar.width = (this.health / this.healthmax) * this.body.radius * 2
            this.manabar = new Rectangle(this.body.x - this.body.radius, this.body.y - (this.body.radius * 1.6), this.body.radius * 2, this.body.radius * .25, "blue")
            this.manabar.width = (this.mana / this.manamax) * this.body.radius * 2
            this.healthbar.draw()
            this.manabar.draw()
            this.slamdraw()
            this.hookdraw()
            this.orbdraw()
            this.cooldown()
            this.collide()
        }
        basic() {
            this.basictimer++
            let min = this.basicrange
            this.basictarget = {}
            for (let t = 0; t < players.length; t++) {
                if (players[t] != this) {
                    for (let k = 0; k < players[t].army.length; k++) {
                        let link = new LineOP(this.body, players[t].army[k].body)
                        if (link.hypotenuse() <= min) {
                            min = link.hypotenuse()
                            this.basictarget = players[t].army[k]
                        }
                        let link2 = new LineOP(this.body, players[t].body)
                        if (link2.hypotenuse() <= this.basicrange) {
                            this.basictarget = players[t]
                        }
                    }
                }
            }

            this.basicAttack()
        }
        basicAttack() {
            if (this.basictarget.health > 0) {
                if (this.basictimer % this.basicrate == 0) {
                    this.basictarget.health -= this.basicdamage
                }
                if (this.basictimer % this.basicrate <= 9) {
                    let link = new LineOP(this.body, this.basictarget.body, "black", 4)
                    link.draw()
                }
            }
        }
        collide() {
            let dummy = this.health
            for (let t = 0; t < players.length; t++) {
                if (this != players[t]) {
                    if (players[t].gasbag == 1) {
                        for (let k = 0; k < players[t].gasses.length; k++) {
                            if (players[t].gasses[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].gasdamage)
                            }
                        }
                        for (let k = 0; k < players[t].glues.length; k++) {
                            if (players[t].glues[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].gluedamage)
                                this.speedbonus = players[t].gluedrop
                            }
                        }
                    } else if (players[t].pincushion == 1) {
                        for (let k = 0; k < players[t].spears.length; k++) {
                            if (players[t].spears[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].speardamage - (players[t].spears[k].life))
                                players[t].spears[k].life = 0
                            } else if (players[t].spears[k].shaft.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].speardamage - (players[t].spears[k].life))
                                players[t].spears[k].life = 0
                            }
                        }
                        for (let k = 0; k < players[t].traps.length; k++) {
                            if (players[t].traps[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].trapdamage)
                                this.speedbonus = players[t].trapdrop
                                players[t].traps[k].life = 0
                            }
                        }
                    } else if (players[t].blindmonk == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                this.speedbonus = players[t].slamdrop
                            }
                        }
                        for (let k = 0; k < players[t].orblist.length; k++) {
                            if (players[t].orblist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].orbdamage)
                                players[t].dashtarget.x = this.body.x
                                players[t].dashtarget.y = this.body.y
                                players[t].dashstate = 1
                                players[t].orblist[k].life = 0
                            }
                        }
                    } else if (players[t].robofister == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                this.speedbonus = players[t].slamdrop
                            }
                        }
                        for (let k = 0; k < players[t].hooklist.length; k++) {
                            if (players[t].hooklist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].hookdamage)
                                this.dashtarget.x = players[t].body.x
                                this.dashtarget.y = players[t].body.y
                                this.moveto.x = players[t].body.x
                                this.moveto.y = players[t].body.y
                                this.moveto.radius = players[t].body.radius
                                this.speedbonus = 7
                                let link = new LineOP(this.body, this.dashtarget)
                                let hookdot = (link.hypotenuse()) / (this.movespeedbase + this.speedbonus)
                                this.locked = Math.round(hookdot)
                                this.lockholder = Math.round(hookdot)
                                players[t].hooklist[k].life = 0
                            }
                        }
                    } else if (players[t].aliensquid == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                this.speedbonus = players[t].slamdrop
                            }
                        }
                        for (let k = 0; k < players[t].spears.length; k++) {
                            if (players[t].spears[k].engage == 0) {
                                if (players[t].spears[k].body.doesPerimeterTouch(this.body)) {
                                    this.health -= players[t].speardamage
                                    players[t].spears[k].life = 0
                                }
                            } else {
                                if (players[t].spears[k].body1.doesPerimeterTouch(this.body)) {
                                    if (players[t].spears[k].life1 != 0) {
                                        this.health -= players[t].speardamage
                                        players[t].spears[k].life1 = 0
                                    }
                                }
                                if (players[t].spears[k].body2.doesPerimeterTouch(this.body)) {
                                    if (players[t].spears[k].life2 != 0) {
                                        this.health -= players[t].speardamage
                                        players[t].spears[k].life2 = 0
                                    }
                                }
                            }
                        }
                    } else if (players[t].foxghost == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                players[t].slamdamage = 0
                                players[t].theftcount++
                                if (players[t].theftcount >= 9) {
                                    players[t].theftcount = 0
                                    players[t].health += players[t].theftbonus
                                }
                            }
                        }
                        for (let k = 0; k < players[t].orblist.length; k++) {
                            if (players[t].orblist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].orbdamage)
                                players[t].theftcount++
                                if (players[t].theftcount >= 9) {
                                    players[t].theftcount = 0
                                    players[t].health += players[t].theftbonus
                                }
                            }
                        }
                        for (let k = 0; k < players[t].hooklist.length; k++) {
                            if (players[t].hooklist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].hookdamage)
                                this.dashtarget.x = players[t].body.x
                                this.dashtarget.y = players[t].body.y
                                this.moveto.x = players[t].body.x
                                this.moveto.y = players[t].body.y
                                this.moveto.radius = players[t].body.radius
                                this.speedbonus = 7
                                let link = new LineOP(this.body, this.dashtarget)
                                let hookdot = ((link.hypotenuse()) / (this.movespeedbase + this.speedbonus)) * 2
                                this.speedbonus = -.4
                                this.locked = Math.round(hookdot)
                                this.lockholder = Math.round(hookdot)
                                players[t].hooklist[k].life = 0
                                players[t].theftcount++
                                if (players[t].theftcount >= 9) {
                                    players[t].theftcount = 0
                                    players[t].health += players[t].theftbonus
                                }
                            }
                        }
                    } else if (players[t].demontaur == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                players[t].health += (players[t].slamdamage) * .2
                            }
                        }
                        for (let k = 0; k < players[t].orblist.length; k++) {
                            if (players[t].orblist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].orbdamage)
                            }
                        }
                    } else if (players[t].inventrix == 1) {
                        for (let k = 0; k < players[t].hooklist.length; k++) {
                            if (players[t].hooklist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].hookdamage)
                                this.dashtarget.x = players[t].body.x
                                this.dashtarget.y = players[t].body.y
                                this.moveto.x = players[t].body.x
                                this.moveto.y = players[t].body.y
                                this.moveto.radius = players[t].body.radius
                                this.speedbonus = (-1 * (this.movespeedbase + this.speedboost)) + .0000001
                                let hookdot = 200
                                this.locked = Math.round(hookdot)
                                this.lockholder = Math.round(hookdot)
                                players[t].hooklist[k].life = 0
                            }
                        }
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                players[t].health += (players[t].slamdamage) * .2
                            }
                        }
                        for (let k = 0; k < players[t].orblist.length; k++) {
                            if (players[t].orblist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].orbdamage)
                                players[t].orblist[k].life = 0
                            }
                        }
                    }else if (players[t].artsassin == 1) {
                        for (let k = 0; k < players[t].spears.length; k++) {
                                if (players[t].spears[k].body.doesPerimeterTouch(this.body)) {
                                    this.health -= players[t].speardamage
                                    
                                this.speedbonus = (-1 * (this.movespeedbase + this.speedboost)) + .0000001
                                let hookdot = 200
                                this.locked = Math.round(hookdot)
                                this.lockholder = Math.round(hookdot)
                                }
                        }
                        for (let k = 0; k < players[t].traps.length; k++) {
                            if (players[t].traps[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].trapdamage)
                                this.speedbonus = (-1 * (this.movespeedbase + this.speedboost)) + .0000001
                                let hookdot = 200
                                this.locked = Math.round(hookdot)
                                this.lockholder = Math.round(hookdot)
                                players[t].traps[k].life = 0
                            }
                        }
                    }
                    if (this.health <= 0) {
                        players[t].gold += this.goldvalue
                        break
                    }
                }
            }


            if (dummy > this.health) {
                if (this.activeshield > 0) {
                    if (this.activeshield >= dummy - this.health) {
                        this.activeshield -= dummy - this.health
                        this.health = dummy
                    } else {
                        this.health += this.activeshield
                        this.activeshield = 0
                    }
                }
            }
        }

    }

    class Artsassin {
        constructor(x, y, color) {
            this.spears = []
            this.speardamage = 70
            this.cannisterdamage = 200
            this.aliensquid = 0
            this.speedboost = 0
            this.theftcount = 0
            this.theftbonus = 10
            this.gold = 500
            this.goldvalue = 300
            this.lockholder = -1
            this.ult = 0
            this.body = new Circle(x, y, 10, color)
            this.movespeedbase = 1
            this.slamdrop = -.8
            this.speedbonus = 0
            this.shieldcost = 30
            this.shieldpower = 150
            this.shieldtimer = 100
            this.shielddrain = 140
            this.shieldcooldown = 0
            this.shieldstate = 0
            this.health = 950
            this.healthmax = this.health
            this.mana = 400
            this.manamax = this.mana
            this.moveto = {}
            this.moveto.x = this.body.x - 1.01
            this.moveto.y = this.body.y
            this.moveto.radius = this.body.radius
            this.dashtarget = {}
            this.dashtarget.x = this.body.x
            this.dashtarget.y = this.body.y
            this.dashtarget.radius = 0
            this.slamcost = 40
            this.dashstate = -1
            this.mps = .2
            this.hps = .15
            this.gluerange = 75
            this.flippower = 150
            this.fliprange = 50
            this.slams = []
            this.orblist = []
            this.locked = 0
            this.orbcost = 70
            this.orbcooldown = 0
            this.orbdamage = 26
            this.orbdrain = 200
            this.slamdamage = 190
            this.slamcooldown = 0
            this.slamdrain = 300
            this.army = []
            this.spawner = 0
            this.spawnpoint = new Point(this.body.x, this.body.y)
            this.blindmonk = 0
            this.foxghost = 0
            this.trapdamage = 140
            this.artsassin = 1
            this.robofister = 0
            this.pincushion = 0
            this.gasbag = 0
            this.ultcost = 100
            this.ultcooldown = 0
            this.ultdrain = 1000
            this.ultrun = 0
            this.basicrate = 80
            this.basictimer = 0
            this.basicrange = 90
            this.basictarget = {}
            this.basicdamage = 90
            this.dashrange = 99
            this.canisterrange = 220
            this.hooklist = []
            this.hookcost = 55
            this.hookcooldown = 0
            this.hookdamage = 120
            this.hookdrain = 180
            this.trapcooldown = 0
            this.trapdrain = 100
            this.traprange = 100
            this.trapcost = 40
            this.traps = []

        }

        trapdraw() {
            for (let t = 0; t < this.traps.length; t++) {
                this.traps[t].draw()
                this.traps[t].life--
            }
            for (let t = 0; t < this.traps.length; t++) {
                if (this.traps[t].life <= 0) {
                    this.traps.splice(t, 1)
                }
            }


        }
        marshal() {
            if (this.spawner % 1000 == 20) {
                let minion = new Mob(this.base.body.x, this.base.body.y, this)
                this.army.push(minion)
            }
            if (this.spawner % 1000 == 40) {
                let minion = new Mob(this.base.body.x, this.base.body.y, this)
                this.army.push(minion)
            }
            if (this.spawner % 1000 == 60) {
                let minion = new Mob(this.base.body.x, this.base.body.y, this)
                this.army.push(minion)
            }
            if (this.spawner % 1000 == 80) {
                let minion = new Mob(this.base.body.x, this.base.body.y, this)
                this.army.push(minion)
            }
            if (this.spawner % 1000 == 100) {
                let minion = new Mob(this.base.body.x, this.base.body.y, this)
                this.army.push(minion)
            }
            this.spawner++
            this.burial()
            this.command()
            this.burial()
        }
        command() {
            for (let t = 0; t < this.army.length; t++) {
                this.army[t].drawbar()
            }
            for (let t = 0; t < this.army.length; t++) {
                this.army[t].draw()
            }
            for (let t = 0; t < this.army.length; t++) {
                this.army[t].drawbar()
            }
        }
        burial() {
            for (let t = 0; t < this.army.length; t++) {
                if (this.army[t].health <= 0) {
                    this.army.splice(t, 1)
                }
            }
            for (let t = 0; t < this.army.length; t++) {
                this.army[t].drawbar()
            }

        }

        trap(to) {
            // if (this == players[0]) {
            //     to.x = this.body.x + (to.x - (canvas.width * .5))
            //     to.y = this.body.y + (to.y - (canvas.height * .5))
            // }
            let trap = new Trap(this.body, to, this)
            let wet = 0
            for (let t = 0; t < players.length; t++) {
                if (players[t].body.doesPerimeterTouch(trap.body)) {
                    wet = 1
                }
            }
            if (this.trapcooldown <= 0) {
                let link = new LineOP(this.body, to)
                if (link.hypotenuse() < this.traprange) {
                    if (this.mana >= this.trapcost) {
                    } else {
                        wet = 1
                    }
                } else {
                    wet = 1
                }
            } else {
                wet = 1
            }
            if (wet == 0) {

                this.traps.push(trap)
                this.mana -= this.trapcost
                this.trapcooldown = this.trapdrain
            }



        }
        cooldown() {
            this.slamcooldown--
            this.shieldcooldown--
            this.orbcooldown--
            this.ultcooldown--
            this.ulttimer--
            this.hookcooldown--
            this.trapcooldown--
            if(this.spearcooldown > 0){
                this.spearcooldown--
            }
            if (this.orbcooldown <= 0) {
                this.dashstate = -1
            }
        }
        regen() {
            if (this.ultrun > 0) {
                this.ult = 1
            } else {
                this.ult = 0
            }
            this.marshal()
            if (this.health > 0) {
                if (this.ult == 1) {
                    this.mana += this.mps
                    this.health += this.hps
                    this.mana += this.mps
                    this.health += this.hps
                    this.movespeedbase = 1.8
                } else {
                    this.movespeedbase = 1
                }
                this.mana += this.mps
                this.health += this.hps
                if (this.health > this.healthmax) {
                    this.health = this.healthmax
                }
                if (this.mana > this.manamax) {
                    this.mana = this.manamax
                }
            } else {
                this.ult = 0
                this.ultrun = 0
                if (this == players[0]) {
                    canvas_context.translate(this.body.x - this.spawnpoint.x, this.body.y - this.spawnpoint.y)
                }
                this.health = this.healthmax
                this.mana = this.manamax
                this.body.y = this.spawnpoint.y
                this.body.x = this.spawnpoint.x
                this.moveto.x = this.body.x + 1
                this.moveto.y = this.body.y + 1
                this.speedbonus = 0
            }
            this.speedbonus *= .999
        }
        control(to) {
            if (this.locked <= 0) {
                if (this == players[0]) {
                    this.moveto.x = this.body.x + (to.x - (canvas.width * .5))
                    this.moveto.y = this.body.y + (to.y - (canvas.height * .5))
                } else {
                    this.moveto.x = to.x
                    this.moveto.y = to.y
                }
            }
            if (this.body.doesPerimeterTouch(this.dashtarget)) {
                this.locked = 0
            }
            if (Math.round(this.locked) == 0) {
                this.speedbonus = 0
            }
        }
        drive() {
            if (typeof this.speedbonus == "undefined") {
                this.speedbonus = 0
            }
            if (this.locked <= 0 || this.locked == this.lockholder) {
                this.body.xmom = 0 - (this.body.x - this.moveto.x)
                this.body.ymom = 0 - (this.body.y - this.moveto.y)

                // if(Math.sqrt(Math.abs(this.body.xmom*this.body.xmom)+Math.abs(this.body.ymom*this.body.ymom)) != 0){
                let k = 0
                while (Math.sqrt(Math.abs(this.body.xmom * this.body.xmom) + Math.abs(this.body.ymom * this.body.ymom)) > (this.movespeedbase + this.speedbonus)) {
                    this.body.xmom *= 0.98
                    this.body.ymom *= 0.98
                    if (k == 10000) {
                        break
                    }
                }
                k = 0
                while (Math.sqrt(Math.abs(this.body.xmom * this.body.xmom) + Math.abs(this.body.ymom * this.body.ymom)) < (this.movespeedbase + this.speedbonus)) {
                    this.body.xmom *= 1.02
                    this.body.ymom *= 1.02
                    if (k == 10000) {
                        break
                    }
                }
            }
            if (this.body.doesPerimeterTouch(this.dashtarget)) {
                this.locked = 0
            }
            if (Math.round(this.locked) == 0) {
                this.speedbonus = 0
            }
        }
        gamepadSkillsAdapter(to) {

            let towards = new Point(0, 0)
            towards.x = (Math.cos(gamepad_angles().left) * 100) + 360
            towards.y = (Math.sin(gamepad_angles().left) * 100) + 360

            let link = new LineOP(this.body, towards)
            link.draw()

            if (gamepadAPI.buttonsStatus.includes('Left-Trigger')) {
                this.orbs(towards)
            }
            if (gamepadAPI.buttonsStatus.includes('Right-Trigger')) {
                if(typeof this.rootshotrange == "undefined"){
                    this.rootshotrange = 700
                }
                towards.x = (Math.cos(gamepad_angles().left) * this.rootshotrange) + this.body.x
                towards.y = (Math.sin(gamepad_angles().left) * this.rootshotrange) + this.body.y
                this.spear(towards)
            }
            if (gamepadAPI.buttonsStatus.includes('RB')) {

                towards.x = (Math.cos(gamepad_angles().left) * this.traprange) + this.body.x
                towards.y = (Math.sin(gamepad_angles().left) * this.traprange) + this.body.y
                this.trap(towards)
            }
            if (gamepadAPI.buttonsStatus.includes('LB')) {
                towards.x = (Math.cos(gamepad_angles().left) * this.dashrange) + this.body.x
                towards.y = (Math.sin(gamepad_angles().left) * this.dashrange) + this.body.y
                // this.ultdash(towards)
            }
        }

        spear(to) {

            if(typeof this.spearcost == "undefined"){
                this.spearcost = 40
            }
            if(typeof this.spearcooldown == "undefined"){
                this.spearcooldown = 0
            }
            if(typeof this.speardrain == "undefined"){
                this.speardrain = 450
            }
            if(typeof this.spears == "undefined"){
                this.spears = []
            }


            if (this.mana > this.spearcost) {
                if (this.spearcooldown <= 0) {
                    let pin = new Rootbeam(this.body, to, this)
                    this.spears.push(pin)
                    this.spearcooldown = this.speardrain
                    this.mana -= this.spearcost
                }
            }

        }

        speardraw() {

            if(typeof this.spears == "undefined"){
                this.spears = []
            }

            for (let t = 0; t < this.spears.length; t++) {
                this.spears[t].move()
                this.spears[t].draw()
                this.spears[t].life--
            }
            for (let t = 0; t < this.spears.length; t++) {
                if (this.spears[t].life <= 0) {
                    this.spears.splice(t, 1)
                }
            }


        }
        skillsAdapter(to) {
            if (this == players[0]) {
                if (keysPressed['q']) {
                    this.orbs(to)
                }
                if (keysPressed['w']) {
                    this.trap(to)
                }
                if (keysPressed['e']) {
                    this.spear(to)
                }
                if (keysPressed['r']) {
                    // this.ultdash(to)
                }
            } else {
                let fuzz = {}
                fuzz.x = ((Math.random() - .5) * 50) + players[0].body.x
                fuzz.y = ((Math.random() - .5) * 50) + players[0].body.y
                // this.ultdash(fuzz)
                this.spear(fuzz)

                // if (Math.random() < .003) {
                this.orbs(fuzz)
                // }
                fuzz.x = ((Math.random() - .5) * this.traprange * .7) + this.body.x
                fuzz.y = ((Math.random() - .5) * this.traprange * .7) + this.body.y
                // if (!beam1.isPointInside(fuzz) && !beam2.isPointInside(fuzz)) {
                //     if (Math.random() < .005) {
                //         this.orbs(fuzz)
                //     } else if (this.health > this.healthmax * .5) {
                //         if (this.dashstate == 0) {
                //             this.orbs(fuzz)
                //         }
                //     }
                // }
                this.trap(fuzz)
            }

        }

        hooks(to) {
            if (this.hookcooldown <= 0) {
                if (this.mana > this.hookcost) {
                    if (this.hookcooldown <= 0) {
                        let pin = new PullOrb(this.body, to, this)
                        this.hooklist.push(pin)
                        this.mana -= this.hookcost
                        this.hookcooldown = this.hookdrain
                    }
                }
            }
        }
        hookdraw() {
            for (let t = 0; t < this.hooklist.length; t++) {
                this.hooklist[t].move()
                this.hooklist[t].draw()
                this.hooklist[t].life -= 1
            }
            for (let t = 0; t < this.hooklist.length; t++) {
                if (this.hooklist[t].life <= 0) {
                    this.hooklist.splice(t, 1)
                }
            }
        }
        slam(to) {
            if (this.mana >= this.slamcost) {
                if (this.slamcooldown <= 0) {
                    for (let t = 0; t < 3; t++) {
                        let pin = new Firespin(this.body, to, this, Math.PI * .66 * t)
                        this.slams.push(pin)
                    }
                    this.slamcooldown = this.slamdrain
                    this.mana -= this.slamcost
                }
            }

        }
        slamdraw() {
            for (let t = 0; t < this.slams.length; t++) {
                this.slams[t].move()
                this.slams[t].draw()
                this.slams[t].life -= .2
            }
            for (let t = 0; t < this.slams.length; t++) {
                if (this.slams[t].life <= 0) {
                    this.slams.splice(t, 1)
                }
            }

        }
        ulting(to) {
            if (this.mana >= this.ultcost) {
                if (this.ultcooldown <= 0) {

                }
            }
        }
        shielder(to) {
            if (this.mana >= this.shieldcost) {
                if (this.shieldcooldown <= 0) {
                    this.activeshield = this.shieldpower
                    this.shieldcooldown = this.shielddrain
                }
            }
        }
        orbs(to) {

            if (this.orbcooldown <= 0) {
                if (this.dashstate == -1) {
                    if (this.mana > this.orbcost) {
                        if (this.orbcooldown <= 0) {
                            let pin = new Orb(this.body, to, this)
                            this.orblist.push(pin)
                            this.mana -= this.orbcost
                            this.orbcooldown = this.orbdrain
                            this.dashstate = 0
                        }
                    }
                }
            }
            if (this.dashstate == 1) {
                this.moveto.x = this.dashtarget.x
                this.moveto.y = this.dashtarget.y
                this.moveto.radius = this.dashtarget.radius
                this.speedbonus = 7
                this.mana -= this.orbcost
                let link = new LineOP(this.body, this.dashtarget)
                this.locked = (link.hypotenuse()) / (this.movespeedbase + this.speedbonus)
                this.lockholder = this.locked
                this.dashstate = 0
            }
        }
        ultdash(to) {
            let link = new LineOP(this.body, to)
            if (link.hypotenuse() <= this.dashrange) {
                if (this.ultcooldown <= 0) {
                    if (this.mana >= this.ultcost) {
                        this.dashtate = 2
                        this.ulttimer = 100
                        this.dashtarget.x = to.x
                        this.dashtarget.y = to.y
                        this.moveto.x = this.dashtarget.x
                        this.moveto.y = this.dashtarget.y
                        this.moveto.radius = this.dashtarget.radius
                        this.speedbonus = 10
                        this.mana -= this.ultcost
                        this.ultcooldown = this.ultdrain
                        let link = new LineOP(this.body, this.dashtarget)
                        this.locked = (link.hypotenuse()) / (this.movespeedbase + this.speedbonus)
                        this.lockholder = this.locked
                    }
                }
                if (this.ulttimer < 70) {
                    if (this.dashtate > 0) {
                        if (this.ultcooldown >= this.ultcooldown * .8) {
                            this.dashtate--
                            this.ulttimer = 100
                            this.dashtarget.x = to.x
                            this.dashtarget.y = to.y
                            this.moveto.x = this.dashtarget.x
                            this.moveto.y = this.dashtarget.y
                            this.moveto.radius = this.dashtarget.radius
                            this.speedbonus = 10
                            let link = new LineOP(this.body, this.dashtarget)
                            this.locked = (link.hypotenuse()) / (this.movespeedbase + this.speedbonus)
                            this.lockholder = this.locked
                        }
                    }
                }
            }
        }
        orbs(to) {

            if (this.orbcooldown <= 0) {
                if (this.mana > this.orbcost) {
                    if (this.orbcooldown <= 0) {
                        
                        let stooge = {}
                        let wet = 0
                        for (let t = 0; t < players.length; t++) {
                            if (players[t] != this) {
                                for (let k = 0; k < players[t].army.length; k++) {
                                    let link = new LineOP(this.body, players[t].army[k].body)
                                    if (link.hypotenuse() < this.canisterrange) {
                                        if (stooge != players[t].army[k]) {
                                            // if (!this.targets.includes(players[t].army[k])) {
                                                // this.targets.push(players[t].army[k])
                                                stooge = players[t].army[k]
                                                wet = 1
                                                break
                                            // }
                                        }
                                    }
                                }
                            }
                        }
                        for (let t = 0; t < players.length; t++) {
                            if (players[t] != this) {
                                let link = new LineOP(this.body, players[t].body)
                                if (link.hypotenuse() < this.canisterrange) {
                                    if (stooge != players[t]) {
                                        // if (!this.targets.includes(players[t])) {
                                            // this.targets.push(players[t])
                                            stooge = players[t]
                                            wet = 1
                                            break
                                        // }
                                    }
                                }
                            }
                        }

                        
                        if(wet == 1){
                            let pin = new Canisterorb(this.body, stooge, this)
                            this.orblist.push(pin)
                            this.mana -= this.orbcost
                            this.orbcooldown = this.orbdrain
                        }
                    }
                }
            }
        }
        orbdraw() {
            for (let t = 0; t < this.orblist.length; t++) {
                this.orblist[t].move()
                this.orblist[t].draw()
                this.orblist[t].life -= 1
            }
            for (let t = 0; t < this.orblist.length; t++) {
                if (this.orblist[t].life <= 0) {
                    this.orblist.splice(t, 1)
                }
            }
        }
        draw() {
            if (this == players[0]) {
                canvas_context.fillStyle = "gold"
                canvas_context.font = "20px arial"
                canvas_context.fillText(`${this.gold}`, this.body.x - 340, this.body.y - 340)
            }

            if (this == players[0]) {
                let towards = new Point(0, 0)
                if (players[0].pincushion == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 100) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 100) + this.body.y
                } else if (players[0].gasbag == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 50) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 50) + this.body.y
                } else if (players[0].blindmonk == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 100) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 100) + this.body.y
                } else if (players[0].robofister == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 200) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 200) + this.body.y
                } else if (players[0].foxghost == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 120) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 120) + this.body.y
                } else if (players[0].aliensquid == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 120) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 120) + this.body.y
                }else if (players[0].artsassin == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 244) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 244) + this.body.y
                }


                let link = new LineOP(this.body, towards, "white", 1)
                link.draw()
            }

            this.regen()
            this.drive()
            this.locked--
            let check = new LineOP(this.moveto, this.body)
            if (check.hypotenuse() > (.7 * (this.movespeedbase + this.speedbonus))) {
                this.body.move()
            } else if (this.locked > 0) {
                this.body.move()
            }

            if (keysPressed['e']) {
                if (this == players[0]) {
                    let circ = new Circle(this.body.x, this.body.y, this.gluerange, "black")
                    canvas_context.strokeStyle = circ.color
                    canvas_context.beginPath()
                    canvas_context.arc(circ.x, circ.y, circ.radius, 0, Math.PI * 2, true)
                    canvas_context.stroke()
                    canvas_context.closePath()
                }
            }
            this.body.draw()
            this.basic()
            if (this.activeshield > 0) {
                let shield = new Circle(this.body.x, this.body.y, (this.activeshield * .020), "yellow")
                shield.draw()
            }
            this.healthbar = new Rectangle(this.body.x - this.body.radius, this.body.y - (this.body.radius * 2), this.body.radius * 2, this.body.radius * .25, "green")
            this.healthbar.width = (this.health / this.healthmax) * this.body.radius * 2
            this.manabar = new Rectangle(this.body.x - this.body.radius, this.body.y - (this.body.radius * 1.6), this.body.radius * 2, this.body.radius * .25, "blue")
            this.manabar.width = (this.mana / this.manamax) * this.body.radius * 2
            this.healthbar.draw()
            this.manabar.draw()
            this.slamdraw()
            this.hookdraw()
            this.speardraw()
            this.trapdraw()
            this.orbdraw()
            this.cooldown()
            this.collide()
        }
        basic() {
            this.basictimer++
            let min = this.basicrange
            this.basictarget = {}
            for (let t = 0; t < players.length; t++) {
                if (players[t] != this) {
                    for (let k = 0; k < players[t].army.length; k++) {
                        let link = new LineOP(this.body, players[t].army[k].body)
                        if (link.hypotenuse() <= min) {
                            min = link.hypotenuse()
                            this.basictarget = players[t].army[k]
                        }
                        let link2 = new LineOP(this.body, players[t].body)
                        if (link2.hypotenuse() <= this.basicrange) {
                            this.basictarget = players[t]
                        }
                    }
                }
            }

            this.basicAttack()
        }
        basicAttack() {
            if (this.basictarget.health > 0) {
                if (this.basictimer % this.basicrate == 0) {
                    this.basictarget.health -= this.basicdamage
                }
                if (this.basictimer % this.basicrate <= 9) {
                    let link = new LineOP(this.body, this.basictarget.body, "black", 4)
                    link.draw()
                }
            }
        }
        collide() {
            let dummy = this.health
            for (let t = 0; t < players.length; t++) {
                if (this != players[t]) {
                    if (players[t].gasbag == 1) {
                        for (let k = 0; k < players[t].gasses.length; k++) {
                            if (players[t].gasses[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].gasdamage)
                            }
                        }
                        for (let k = 0; k < players[t].glues.length; k++) {
                            if (players[t].glues[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].gluedamage)
                                this.speedbonus = players[t].gluedrop
                            }
                        }
                    } else if (players[t].pincushion == 1) {
                        for (let k = 0; k < players[t].spears.length; k++) {
                            if (players[t].spears[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].speardamage - (players[t].spears[k].life))
                                players[t].spears[k].life = 0
                            } else if (players[t].spears[k].shaft.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].speardamage - (players[t].spears[k].life))
                                players[t].spears[k].life = 0
                            }
                        }
                        for (let k = 0; k < players[t].traps.length; k++) {
                            if (players[t].traps[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].trapdamage)
                                this.speedbonus = players[t].trapdrop
                                players[t].traps[k].life = 0
                            }
                        }
                    } else if (players[t].blindmonk == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                this.speedbonus = players[t].slamdrop
                            }
                        }
                        for (let k = 0; k < players[t].orblist.length; k++) {
                            if (players[t].orblist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].orbdamage)
                                players[t].dashtarget.x = this.body.x
                                players[t].dashtarget.y = this.body.y
                                players[t].dashstate = 1
                                players[t].orblist[k].life = 0
                            }
                        }
                    } else if (players[t].robofister == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                this.speedbonus = players[t].slamdrop
                            }
                        }
                        for (let k = 0; k < players[t].hooklist.length; k++) {
                            if (players[t].hooklist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].hookdamage)
                                this.dashtarget.x = players[t].body.x
                                this.dashtarget.y = players[t].body.y
                                this.moveto.x = players[t].body.x
                                this.moveto.y = players[t].body.y
                                this.moveto.radius = players[t].body.radius
                                this.speedbonus = 7
                                let link = new LineOP(this.body, this.dashtarget)
                                let hookdot = (link.hypotenuse()) / (this.movespeedbase + this.speedbonus)
                                this.locked = Math.round(hookdot)
                                this.lockholder = Math.round(hookdot)
                                players[t].hooklist[k].life = 0
                            }
                        }
                    } else if (players[t].aliensquid == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                this.speedbonus = players[t].slamdrop
                            }
                        }
                        for (let k = 0; k < players[t].spears.length; k++) {
                            if (players[t].spears[k].engage == 0) {
                                if (players[t].spears[k].body.doesPerimeterTouch(this.body)) {
                                    this.health -= players[t].speardamage
                                    players[t].spears[k].life = 0
                                }
                            } else {
                                if (players[t].spears[k].body1.doesPerimeterTouch(this.body)) {
                                    if (players[t].spears[k].life1 != 0) {
                                        this.health -= players[t].speardamage
                                        players[t].spears[k].life1 = 0
                                    }
                                }
                                if (players[t].spears[k].body2.doesPerimeterTouch(this.body)) {
                                    if (players[t].spears[k].life2 != 0) {
                                        this.health -= players[t].speardamage
                                        players[t].spears[k].life2 = 0
                                    }
                                }
                            }
                        }
                    } else if (players[t].foxghost == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                players[t].slamdamage = 0
                                players[t].theftcount++
                                if (players[t].theftcount >= 9) {
                                    players[t].theftcount = 0
                                    players[t].health += players[t].theftbonus
                                }
                            }
                        }
                        for (let k = 0; k < players[t].orblist.length; k++) {
                            if (players[t].orblist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].orbdamage)
                                players[t].theftcount++
                                if (players[t].theftcount >= 9) {
                                    players[t].theftcount = 0
                                    players[t].health += players[t].theftbonus
                                }
                            }
                        }
                        for (let k = 0; k < players[t].hooklist.length; k++) {
                            if (players[t].hooklist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].hookdamage)
                                this.dashtarget.x = players[t].body.x
                                this.dashtarget.y = players[t].body.y
                                this.moveto.x = players[t].body.x
                                this.moveto.y = players[t].body.y
                                this.moveto.radius = players[t].body.radius
                                this.speedbonus = 7
                                let link = new LineOP(this.body, this.dashtarget)
                                let hookdot = ((link.hypotenuse()) / (this.movespeedbase + this.speedbonus)) * 2
                                this.speedbonus = -.4
                                this.locked = Math.round(hookdot)
                                this.lockholder = Math.round(hookdot)
                                players[t].hooklist[k].life = 0
                                players[t].theftcount++
                                if (players[t].theftcount >= 9) {
                                    players[t].theftcount = 0
                                    players[t].health += players[t].theftbonus
                                }
                            }
                        }
                    } else if (players[t].demontaur == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                players[t].health += (players[t].slamdamage) * .2
                            }
                        }
                        for (let k = 0; k < players[t].orblist.length; k++) {
                            if (players[t].orblist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].orbdamage)
                            }
                        }
                    } else if (players[t].inventrix == 1) {
                        for (let k = 0; k < players[t].hooklist.length; k++) {
                            if (players[t].hooklist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].hookdamage)
                                this.dashtarget.x = players[t].body.x
                                this.dashtarget.y = players[t].body.y
                                this.moveto.x = players[t].body.x
                                this.moveto.y = players[t].body.y
                                this.moveto.radius = players[t].body.radius
                                this.speedbonus = (-1 * (this.movespeedbase + this.speedboost)) + .0000001
                                let hookdot = 200
                                this.locked = Math.round(hookdot)
                                this.lockholder = Math.round(hookdot)
                                players[t].hooklist[k].life = 0
                            }
                        }
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                players[t].health += (players[t].slamdamage) * .2
                            }
                        }
                        for (let k = 0; k < players[t].orblist.length; k++) {
                            if (players[t].orblist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].orbdamage)
                                players[t].orblist[k].life = 0
                            }
                        }
                    }else if (players[t].artsassin == 1) {
                        for (let k = 0; k < players[t].spears.length; k++) {
                                if (players[t].spears[k].body.doesPerimeterTouch(this.body)) {
                                    this.health -= players[t].speardamage
                                    
                                this.speedbonus = (-1 * (this.movespeedbase + this.speedboost)) + .0000001
                                let hookdot = 200
                                this.locked = Math.round(hookdot)
                                this.lockholder = Math.round(hookdot)
                                }
                        }
                        for (let k = 0; k < players[t].traps.length; k++) {
                            if (players[t].traps[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].trapdamage)
                                this.speedbonus = (-1 * (this.movespeedbase + this.speedboost)) + .0000001
                                let hookdot = 200
                                this.locked = Math.round(hookdot)
                                this.lockholder = Math.round(hookdot)
                                players[t].traps[k].life = 0
                            }
                        }
                    }
                    if (this.health <= 0) {
                        players[t].gold += this.goldvalue
                        break
                    }
                }
            }


            if (dummy > this.health) {
                if (this.activeshield > 0) {
                    if (this.activeshield >= dummy - this.health) {
                        this.activeshield -= dummy - this.health
                        this.health = dummy
                    } else {
                        this.health += this.activeshield
                        this.activeshield = 0
                    }
                }
            }
        }

    }

    class Demontaur {
        constructor(x, y, color) {
            this.speedboost = 0
            this.theftcount = 0
            this.theftbonus = 10
            this.gold = 500
            this.goldvalue = 300
            this.lockholder = -1
            this.ult = 0
            this.body = new Circle(x, y, 10, color)
            this.movespeedbase = 1
            this.slamdrop = -.8
            this.speedbonus = 0
            this.shieldcost = 30
            this.shieldpower = 150
            this.shieldtimer = 100
            this.shielddrain = 140
            this.shieldcooldown = 0
            this.shieldstate = 0
            this.health = 1150
            this.healthmax = this.health
            this.mana = 400
            this.manamax = this.mana
            this.moveto = {}
            this.moveto.x = this.body.x - 1.01
            this.moveto.y = this.body.y
            this.moveto.radius = this.body.radius
            this.dashtarget = {}
            this.dashtarget.x = this.body.x
            this.dashtarget.y = this.body.y
            this.dashtarget.radius = 0
            this.slamcost = 40
            this.dashstate = -1
            this.mps = .09
            this.hps = .25
            this.gluerange = 75
            this.flippower = 150
            this.fliprange = 50
            this.slams = []
            this.orblist = []
            this.locked = 0
            this.orbcost = 15
            this.orbcooldown = 0
            this.orbdamage = 14
            this.orbdrain = 50
            this.slamdamage = 1
            this.slamcooldown = 0
            this.slamdrain = 300
            this.army = []
            this.spawner = 0
            this.spawnpoint = new Point(this.body.x, this.body.y)
            this.blindmonk = 0
            this.foxghost = 0
            this.demontaur = 1
            this.robofister = 0
            this.pincushion = 0
            this.aliensquid = 0
            this.gasbag = 0
            this.ultcost = 100
            this.ultcooldown = 0
            this.ultdrain = 1000
            this.ultrun = 0
            this.basicrate = 10
            this.basictimer = 0
            this.basicrange = 25
            this.basictarget = {}
            this.basicdamage = 30
            this.dashrange = 199
            this.dashcooldown = 0

            this.hooklist = []
            this.hookcost = 55
            this.hookcooldown = 0
            this.hookdamage = 120
            this.hookdrain = 180

        }
        marshal() {
            if (this.spawner % 1000 == 20) {
                let minion = new Mob(this.base.body.x, this.base.body.y, this)
                this.army.push(minion)
            }
            if (this.spawner % 1000 == 40) {
                let minion = new Mob(this.base.body.x, this.base.body.y, this)
                this.army.push(minion)
            }
            if (this.spawner % 1000 == 60) {
                let minion = new Mob(this.base.body.x, this.base.body.y, this)
                this.army.push(minion)
            }
            if (this.spawner % 1000 == 80) {
                let minion = new Mob(this.base.body.x, this.base.body.y, this)
                this.army.push(minion)
            }
            if (this.spawner % 1000 == 100) {
                let minion = new Mob(this.base.body.x, this.base.body.y, this)
                this.army.push(minion)
            }
            this.spawner++
            this.burial()
            this.command()
            this.burial()
        }
        command() {
            for (let t = 0; t < this.army.length; t++) {
                this.army[t].drawbar()
            }
            for (let t = 0; t < this.army.length; t++) {
                this.army[t].draw()
            }
            for (let t = 0; t < this.army.length; t++) {
                this.army[t].drawbar()
            }
        }
        burial() {
            for (let t = 0; t < this.army.length; t++) {
                if (this.army[t].health <= 0) {
                    this.army.splice(t, 1)
                }
            }
            for (let t = 0; t < this.army.length; t++) {
                this.army[t].drawbar()
            }

        }
        cooldown() {
            this.slamcooldown--
            this.shieldcooldown--
            this.orbcooldown--
            this.ultcooldown--
            this.ulttimer--
            this.dashcooldown--
            this.hookcooldown--
            if (this.dashcooldown <= 0) {
                this.dashstate = -1
            }
        }
        regen() {
            if (this.ultrun > 0) {
                this.ult = 1
            } else {
                this.ult = 0
            }
            this.marshal()
            if (this.health > 0) {
                if (this.ult == 1) {
                    this.mana += this.mps
                    this.health += this.hps
                    this.mana += this.mps
                    this.health += this.hps
                    this.movespeedbase = 1.8
                } else {
                    this.movespeedbase = 1
                }
                this.mana += this.mps
                this.health += this.hps
                if (this.health > this.healthmax) {
                    this.health = this.healthmax
                }
                if (this.mana > this.manamax) {
                    this.mana = this.manamax
                }
            } else {
                this.ult = 0
                this.ultrun = 0
                if (this == players[0]) {
                    canvas_context.translate(this.body.x - this.spawnpoint.x, this.body.y - this.spawnpoint.y)
                }
                this.health = this.healthmax
                this.mana = this.manamax
                this.body.y = this.spawnpoint.y
                this.body.x = this.spawnpoint.x
                this.moveto.x = this.body.x + 1
                this.moveto.y = this.body.y + 1
                this.speedbonus = 0
            }
            this.speedbonus *= .999
        }
        control(to) {
            if (this.locked <= 0) {
                if (this == players[0]) {
                    this.moveto.x = this.body.x + (to.x - (canvas.width * .5))
                    this.moveto.y = this.body.y + (to.y - (canvas.height * .5))
                } else {
                    this.moveto.x = to.x
                    this.moveto.y = to.y
                }
            }
            if (this.body.doesPerimeterTouch(this.dashtarget)) {
                this.locked = 0
            }
            if (Math.round(this.locked) == 0) {
                this.speedbonus = 0
            }
        }
        drive() {
            if (typeof this.speedbonus == "undefined") {
                this.speedbonus = 0
            }
            if (this.locked <= 0 || this.locked == this.lockholder) {
                this.body.xmom = 0 - (this.body.x - this.moveto.x)
                this.body.ymom = 0 - (this.body.y - this.moveto.y)

                // if(Math.sqrt(Math.abs(this.body.xmom*this.body.xmom)+Math.abs(this.body.ymom*this.body.ymom)) != 0){
                let k = 0
                while (Math.sqrt(Math.abs(this.body.xmom * this.body.xmom) + Math.abs(this.body.ymom * this.body.ymom)) > (this.movespeedbase + this.speedbonus + this.speedboost)) {
                    this.body.xmom *= 0.98
                    this.body.ymom *= 0.98
                    if (k == 10000) {
                        break
                    }
                }
                k = 0
                while (Math.sqrt(Math.abs(this.body.xmom * this.body.xmom) + Math.abs(this.body.ymom * this.body.ymom)) < (this.movespeedbase + this.speedbonus + this.speedboost)) {
                    this.body.xmom *= 1.02
                    this.body.ymom *= 1.02
                    if (k == 10000) {
                        break
                    }
                }
            }
            if (this.body.doesPerimeterTouch(this.dashtarget)) {
                this.locked = 0
            }
            if (Math.round(this.locked) == 0) {
                this.speedbonus = 0
            }
        }
        gamepadSkillsAdapter(to) {

            let towards = new Point(0, 0)
            towards.x = (Math.cos(gamepad_angles().left) * 100) + 360
            towards.y = (Math.sin(gamepad_angles().left) * 100) + 360

            let link = new LineOP(this.body, towards)
            link.draw()

            if (gamepadAPI.buttonsStatus.includes('Left-Trigger')) {
                this.dashslam(towards)
            }
            if (gamepadAPI.buttonsStatus.includes('Right-Trigger')) {
                towards.x = (Math.cos(gamepad_angles().left) * this.gluerange) + 360
                towards.y = (Math.sin(gamepad_angles().left) * this.gluerange) + 360
                this.slash(towards)
            }
            if (gamepadAPI.buttonsStatus.includes('RB')) {

                towards.x = (Math.cos(gamepad_angles().left) * this.fliprange) + this.body.x
                towards.y = (Math.sin(gamepad_angles().left) * this.fliprange) + this.body.y
                this.aura(towards)
            }
            if (gamepadAPI.buttonsStatus.includes('LB')) {
                towards.x = (Math.cos(gamepad_angles().left) * this.dashrange) + this.body.x
                towards.y = (Math.sin(gamepad_angles().left) * this.dashrange) + this.body.y
                this.ultdash(towards)
            }
        }
        skillsAdapter(to) {
            if (this == players[0]) {
                if (keysPressed['q']) {
                    this.dashslam(to)
                }
                if (keysPressed['w']) {
                    this.aura(to)
                }
                if (keysPressed['e']) {
                    this.slash(to)
                }
                if (keysPressed['r']) {
                    this.ultdash(to)
                }
            } else {
                let fuzz = {}
                fuzz.x = ((Math.random() - .5) * 10) + players[0].body.x
                fuzz.y = ((Math.random() - .5) * 10) + players[0].body.y
                this.ultdash(fuzz)
                this.dashslam(fuzz)

                if (Math.random() < .003) {
                    this.slash(fuzz)
                }
                // fuzz.x = ((Math.random() - .5) * this.gluerange * .7) + this.body.x
                // // fuzz.y = ((Math.random() - .5) * this.gluerange * .7) + this.body.y
                // if (!beam1.isPointInside(fuzz) && !beam2.isPointInside(fuzz)) {
                //     if (Math.random() < .005) {
                this.aura(fuzz)
                //     } else if (this.health > this.healthmax * .5) {
                //         if (this.dashstate == 0) {
                //             this.orbs(fuzz)
                //         }
                //     }
                // }
            }

        }
        slash() {

            if (typeof this.orbrange == "undefined") {
                this.orbrange = 55

            }
            if (this.orbcooldown <= 0) {
                if (this.mana >= this.orbcost) {
                    let circ = new Circle(this.body.x, this.body.y, this.orbrange, "#66666688")
                    circ.life = 10
                    circ.body = circ
                    this.orblist[0] = circ
                    this.orbcooldown = this.orbdrain
                    this.mana -= this.orbcost
                }
            }


        }
        dashslam() {

            if (typeof this.dashdrain == "undefined") {
                this.dashdrain = 240
            }
            if (typeof this.dashcost == "undefined") {
                this.dashcost = 60
            }
            if (typeof this.empowered == "undefined") {
                this.empowered = 0
            }
            if (this.dashcooldown <= 0) {
                if (this.mana >= this.dashcost) {
                    this.speedboost = 1
                    this.empowered = 1

                    this.dashcooldown = this.dashdrain
                    this.mana -= this.dashcost
                }
            }


        }
        aura() {
            if (this.speedboost < 4) {
                this.speedboost *= 1.003
            } else {
                this.speedboost = 0
                this.empowered = 0
            }
            if (typeof this.auratimer == "undefined") {
                this.auratimer = 0

            }
            if (typeof this.aurarange == "undefined") {
                this.aurarange = 80

            }
            if (keysPressed['e'] || gamepadAPI.buttonsStatus.includes('RB')) {
                if (this.hookcooldown <= 0) {
                    if (this.mana > this.hookcost) {
                        this.auratimer = 300
                        this.mana -= this.hookcost
                        this.hookcooldown = this.hookdrain
                    }
                }
            }
            if (this.auratimer > 0) {
                this.auratimer--
                let circ = new Circle(this.body.x, this.body.y, this.aurarange, "00ffaa88")
                canvas_context.strokeStyle = circ.color
                canvas_context.beginPath()
                canvas_context.arc(circ.x, circ.y, circ.radius, 0, Math.PI * 2, true)
                canvas_context.stroke()
                canvas_context.closePath()

                let innercirc = new Circle(this.body.x, this.body.y, this.aurarange, "#00ffaa88")
                canvas_context.strokeStyle = innercirc.color
                canvas_context.beginPath()
                canvas_context.arc(innercirc.x, innercirc.y, innercirc.radius, 0, Math.PI * 2, true)
                canvas_context.stroke()
                canvas_context.fill()
                canvas_context.closePath()
                innercirc.body = innercirc
                this.slams[0] = innercirc


            } else {

                this.slams = []
            }


        }

        hooks(to) {
            if (this.hookcooldown <= 0) {
                if (this.mana > this.hookcost) {
                    if (this.hookcooldown <= 0) {
                        let pin = new PullOrb(this.body, to, this)
                        this.hooklist.push(pin)
                        this.mana -= this.hookcost
                        this.hookcooldown = this.hookdrain
                    }
                }
            }
        }
        hookdraw() {
            for (let t = 0; t < this.hooklist.length; t++) {
                this.hooklist[t].move()
                this.hooklist[t].draw()
                this.hooklist[t].life -= 1
            }
            for (let t = 0; t < this.hooklist.length; t++) {
                if (this.hooklist[t].life <= 0) {
                    this.hooklist.splice(t, 1)
                }
            }
        }
        slam(to) {
            if (this.mana >= this.slamcost) {
                if (this.slamcooldown <= 0) {
                    for (let t = 0; t < 3; t++) {
                        let pin = new Firespin(this.body, to, this, Math.PI * .66 * t)
                        this.slams.push(pin)
                    }
                    this.slamcooldown = this.slamdrain
                    this.mana -= this.slamcost
                }
            }

        }
        slamdraw() {
            for (let t = 0; t < this.slams.length; t++) {
                this.slams[t].move()
                this.slams[t].draw()
                this.slams[t].life -= .2
            }
            for (let t = 0; t < this.slams.length; t++) {
                if (this.slams[t].life <= 0) {
                    this.slams.splice(t, 1)
                }
            }

        }
        ulting(to) {
            if (this.mana >= this.ultcost) {
                if (this.ultcooldown <= 0) {

                }
            }
        }
        shielder(to) {
            if (this.mana >= this.shieldcost) {
                if (this.shieldcooldown <= 0) {
                    this.activeshield = this.shieldpower
                    this.shieldcooldown = this.shielddrain
                }
            }
        }
        orbs(to) {

            if (this.orbcooldown <= 0) {
                if (this.dashstate == -1) {
                    if (this.mana > this.orbcost) {
                        if (this.orbcooldown <= 0) {
                            let pin = new Orb(this.body, to, this)
                            this.orblist.push(pin)
                            this.mana -= this.orbcost
                            this.orbcooldown = this.orbdrain
                            this.dashstate = 0
                        }
                    }
                }
            }
            if (this.dashstate == 1) {
                this.moveto.x = this.dashtarget.x
                this.moveto.y = this.dashtarget.y
                this.moveto.radius = this.dashtarget.radius
                this.speedbonus = 7
                this.mana -= this.orbcost
                let link = new LineOP(this.body, this.dashtarget)
                this.locked = (link.hypotenuse()) / (this.movespeedbase + this.speedbonus)
                this.lockholder = this.locked
                this.dashstate = 0
            }
        }
        ultdash(to) {
            let link = new LineOP(this.body, to)
            if (link.hypotenuse() <= this.dashrange) {
                if (this.ultcooldown <= 0) {
                    if (this.mana >= this.ultcost) {
                        this.dashtate = 2
                        this.ulttimer = 100
                        this.empowered = 1
                        this.dashtarget.x = to.x
                        this.dashtarget.y = to.y
                        this.moveto.x = this.dashtarget.x
                        this.moveto.y = this.dashtarget.y
                        this.moveto.radius = this.dashtarget.radius
                        this.speedbonus = 10
                        this.mana -= this.ultcost
                        this.ultcooldown = this.ultdrain
                        let link = new LineOP(this.body, this.dashtarget)
                        this.locked = (link.hypotenuse()) / (this.movespeedbase + this.speedbonus)
                        this.lockholder = this.locked
                    }
                }
            }
        }
        orbs(to) {

            if (this.orbcooldown <= 0) {
                if (this.mana > this.orbcost) {
                    if (this.orbcooldown <= 0) {
                        let pin = new Fireorb(this.body, to, this)
                        this.orblist.push(pin)
                        this.mana -= this.orbcost
                        this.orbcooldown = this.orbdrain
                        this.dashstate = 0
                    }
                }
            }
        }
        orbdraw() {
            for (let t = 0; t < this.orblist.length; t++) {
                this.orblist[t].move()
                this.orblist[t].draw()
                this.orblist[t].life -= 1
            }
            for (let t = 0; t < this.orblist.length; t++) {
                if (this.orblist[t].life <= 0) {
                    this.orblist.splice(t, 1)
                }
            }
        }
        draw() {
            if (this == players[0]) {
                canvas_context.fillStyle = "gold"
                canvas_context.font = "20px arial"
                canvas_context.fillText(`${this.gold}`, this.body.x - 340, this.body.y - 340)
            }

            if (this == players[0]) {
                let towards = new Point(0, 0)
                if (players[0].pincushion == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 100) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 100) + this.body.y
                } else if (players[0].gasbag == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 50) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 50) + this.body.y
                } else if (players[0].blindmonk == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 100) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 100) + this.body.y
                } else if (players[0].robofister == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 200) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 200) + this.body.y
                } else if (players[0].foxghost == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 120) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 120) + this.body.y
                } else if (players[0].aliensquid == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 120) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 120) + this.body.y
                } else if (players[0].demontaur == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 30) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 30) + this.body.y
                }


                let link = new LineOP(this.body, towards, "white", 1)
                link.draw()
            }

            this.aura()
            this.regen()
            this.drive()
            this.locked--
            let check = new LineOP(this.moveto, this.body)
            if (check.hypotenuse() > (.7 * (this.movespeedbase + this.speedbonus))) {
                this.body.move()
            } else if (this.locked > 0) {
                this.body.move()
            }

            if (keysPressed['e']) {
                if (this == players[0]) {
                    let circ = new Circle(this.body.x, this.body.y, this.gluerange, "black")
                    canvas_context.strokeStyle = circ.color
                    canvas_context.beginPath()
                    canvas_context.arc(circ.x, circ.y, circ.radius, 0, Math.PI * 2, true)
                    canvas_context.stroke()
                    canvas_context.closePath()
                }
            }
            this.body.draw()
            this.basic()
            if (this.activeshield > 0) {
                let shield = new Circle(this.body.x, this.body.y, (this.activeshield * .020), "yellow")
                shield.draw()
            }
            this.healthbar = new Rectangle(this.body.x - this.body.radius, this.body.y - (this.body.radius * 2), this.body.radius * 2, this.body.radius * .25, "green")
            this.healthbar.width = (this.health / this.healthmax) * this.body.radius * 2
            this.manabar = new Rectangle(this.body.x - this.body.radius, this.body.y - (this.body.radius * 1.6), this.body.radius * 2, this.body.radius * .25, "blue")
            this.manabar.width = (this.mana / this.manamax) * this.body.radius * 2
            this.healthbar.draw()
            this.manabar.draw()
            this.slamdraw()
            this.hookdraw()
            this.orbdraw()
            this.cooldown()
            this.collide()
        }
        basic() {
            this.basictimer++
            let min = this.basicrange
            this.basictarget = {}
            for (let t = 0; t < players.length; t++) {
                if (players[t] != this) {
                    for (let k = 0; k < players[t].army.length; k++) {
                        let link = new LineOP(this.body, players[t].army[k].body)
                        if (link.hypotenuse() <= min) {
                            min = link.hypotenuse()
                            this.basictarget = players[t].army[k]
                        }
                        let link2 = new LineOP(this.body, players[t].body)
                        if (link2.hypotenuse() <= this.basicrange) {
                            this.basictarget = players[t]
                        }
                    }
                }
            }

            this.basicAttack()
        }
        basicAttack() {
            if (this.basictarget.health > 0) {
                if (this.basictimer % this.basicrate == 0) {
                    this.basictarget.health -= this.basicdamage
                    if (this.empowered == 1) {

                        this.basictarget.body.xmom = ((this.basictarget.body.x - this.body.x) / 6) * this.speedboost
                        this.basictarget.body.ymom = ((this.basictarget.body.y - this.body.y) / 6) * this.speedboost
                        for (let t = 0; t < 3; t++) {
                            this.basictarget.body.move()
                            this.basictarget.health -= this.basicdamage
                        }
                        this.speedboost = 0
                    }

                }
                if (this.basictimer % this.basicrate <= 9) {
                    let link = new LineOP(this.body, this.basictarget.body, "black", 4)
                    link.draw()
                }
            }
        }
        collide() {
            let dummy = this.health
            for (let t = 0; t < players.length; t++) {
                if (this != players[t]) {
                    if (players[t].gasbag == 1) {
                        for (let k = 0; k < players[t].gasses.length; k++) {
                            if (players[t].gasses[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].gasdamage)
                            }
                        }
                        for (let k = 0; k < players[t].glues.length; k++) {
                            if (players[t].glues[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].gluedamage)
                                this.speedbonus = players[t].gluedrop
                            }
                        }
                    } else if (players[t].pincushion == 1) {
                        for (let k = 0; k < players[t].spears.length; k++) {
                            if (players[t].spears[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].speardamage - (players[t].spears[k].life))
                                players[t].spears[k].life = 0
                            } else if (players[t].spears[k].shaft.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].speardamage - (players[t].spears[k].life))
                                players[t].spears[k].life = 0
                            }
                        }
                        for (let k = 0; k < players[t].traps.length; k++) {
                            if (players[t].traps[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].trapdamage)
                                this.speedbonus = players[t].trapdrop
                                players[t].traps[k].life = 0
                            }
                        }
                    } else if (players[t].blindmonk == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                this.speedbonus = players[t].slamdrop
                            }
                        }
                        for (let k = 0; k < players[t].orblist.length; k++) {
                            if (players[t].orblist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].orbdamage)
                                players[t].dashtarget.x = this.body.x
                                players[t].dashtarget.y = this.body.y
                                players[t].dashstate = 1
                                players[t].orblist[k].life = 0
                            }
                        }
                    } else if (players[t].robofister == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                this.speedbonus = players[t].slamdrop
                            }
                        }
                        for (let k = 0; k < players[t].hooklist.length; k++) {
                            if (players[t].hooklist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].hookdamage)
                                this.dashtarget.x = players[t].body.x
                                this.dashtarget.y = players[t].body.y
                                this.moveto.x = players[t].body.x
                                this.moveto.y = players[t].body.y
                                this.moveto.radius = players[t].body.radius
                                this.speedbonus = 7
                                let link = new LineOP(this.body, this.dashtarget)
                                let hookdot = (link.hypotenuse()) / (this.movespeedbase + this.speedbonus)
                                this.locked = Math.round(hookdot)
                                this.lockholder = Math.round(hookdot)
                                players[t].hooklist[k].life = 0
                            }
                        }
                    } else if (players[t].aliensquid == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                this.speedbonus = players[t].slamdrop
                            }
                        }
                        for (let k = 0; k < players[t].spears.length; k++) {
                            if (players[t].spears[k].engage == 0) {
                                if (players[t].spears[k].body.doesPerimeterTouch(this.body)) {
                                    this.health -= players[t].speardamage
                                    players[t].spears[k].life = 0
                                }
                            } else {
                                if (players[t].spears[k].body1.doesPerimeterTouch(this.body)) {
                                    if (players[t].spears[k].life1 != 0) {
                                        this.health -= players[t].speardamage
                                        players[t].spears[k].life1 = 0
                                    }
                                }
                                if (players[t].spears[k].body2.doesPerimeterTouch(this.body)) {
                                    if (players[t].spears[k].life2 != 0) {
                                        this.health -= players[t].speardamage
                                        players[t].spears[k].life2 = 0
                                    }
                                }
                            }
                        }
                    } else if (players[t].foxghost == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                players[t].slamdamage = 0
                                players[t].theftcount++
                                if (players[t].theftcount >= 9) {
                                    players[t].theftcount = 0
                                    players[t].health += players[t].theftbonus
                                }
                            }
                        }
                        for (let k = 0; k < players[t].orblist.length; k++) {
                            if (players[t].orblist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].orbdamage)
                                players[t].theftcount++
                                if (players[t].theftcount >= 9) {
                                    players[t].theftcount = 0
                                    players[t].health += players[t].theftbonus
                                }
                            }
                        }
                        for (let k = 0; k < players[t].hooklist.length; k++) {
                            if (players[t].hooklist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].hookdamage)
                                this.dashtarget.x = players[t].body.x
                                this.dashtarget.y = players[t].body.y
                                this.moveto.x = players[t].body.x
                                this.moveto.y = players[t].body.y
                                this.moveto.radius = players[t].body.radius
                                this.speedbonus = 7
                                let link = new LineOP(this.body, this.dashtarget)
                                let hookdot = ((link.hypotenuse()) / (this.movespeedbase + this.speedbonus)) * 2
                                this.speedbonus = -.4
                                this.locked = Math.round(hookdot)
                                this.lockholder = Math.round(hookdot)
                                players[t].hooklist[k].life = 0
                                players[t].theftcount++
                                if (players[t].theftcount >= 9) {
                                    players[t].theftcount = 0
                                    players[t].health += players[t].theftbonus
                                }
                            }
                        }
                    } else if (players[t].demontaur == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                players[t].health += (players[t].slamdamage) * .2
                            }
                        }
                        for (let k = 0; k < players[t].orblist.length; k++) {
                            if (players[t].orblist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].orbdamage)
                            }
                        }
                    } else if (players[t].inventrix == 1) {
                        for (let k = 0; k < players[t].hooklist.length; k++) {
                            if (players[t].hooklist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].hookdamage)
                                this.dashtarget.x = players[t].body.x
                                this.dashtarget.y = players[t].body.y
                                this.moveto.x = players[t].body.x
                                this.moveto.y = players[t].body.y
                                this.moveto.radius = players[t].body.radius
                                this.speedbonus = (-1 * (this.movespeedbase + this.speedboost)) + .0000001
                                let hookdot = 200
                                this.locked = Math.round(hookdot)
                                this.lockholder = Math.round(hookdot)
                                players[t].hooklist[k].life = 0
                            }
                        }
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                players[t].health += (players[t].slamdamage) * .2
                            }
                        }
                        for (let k = 0; k < players[t].orblist.length; k++) {
                            if (players[t].orblist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].orbdamage)
                                players[t].orblist[k].life = 0
                            }
                        }
                    }else if (players[t].artsassin == 1) {
                        for (let k = 0; k < players[t].spears.length; k++) {
                                if (players[t].spears[k].body.doesPerimeterTouch(this.body)) {
                                    this.health -= players[t].speardamage
                                    
                                this.speedbonus = (-1 * (this.movespeedbase + this.speedboost)) + .0000001
                                let hookdot = 200
                                this.locked = Math.round(hookdot)
                                this.lockholder = Math.round(hookdot)
                                }
                        }
                        for (let k = 0; k < players[t].traps.length; k++) {
                            if (players[t].traps[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].trapdamage)
                                this.speedbonus = (-1 * (this.movespeedbase + this.speedboost)) + .0000001
                                let hookdot = 200
                                this.locked = Math.round(hookdot)
                                this.lockholder = Math.round(hookdot)
                                players[t].traps[k].life = 0
                            }
                        }
                    }
                    if (this.health <= 0) {
                        players[t].gold += this.goldvalue
                        break
                    }
                }
            }


            if (dummy > this.health) {
                if (this.activeshield > 0) {
                    if (this.activeshield >= dummy - this.health) {
                        this.activeshield -= dummy - this.health
                        this.health = dummy
                    } else {
                        this.health += this.activeshield
                        this.activeshield = 0
                    }
                }
            }
        }

    }


    class Inventrix {
        constructor(x, y, color) {
            this.turretrange = 55
            this.speedboost = 0
            this.theftcount = 0
            this.theftbonus = 10
            this.gold = 500
            this.goldvalue = 300
            this.lockholder = -1
            this.ult = 0
            this.body = new Circle(x, y, 10, color)
            this.movespeedbase = 1
            this.slamdrop = -.8
            this.speedbonus = 0
            this.shieldcost = 30
            this.shieldpower = 150
            this.shieldtimer = 100
            this.shielddrain = 140
            this.shieldcooldown = 0
            this.shieldstate = 0
            this.health = 800
            this.healthmax = this.health
            this.mana = 400
            this.manamax = this.mana
            this.moveto = {}
            this.moveto.x = this.body.x - 1.01
            this.moveto.y = this.body.y
            this.moveto.radius = this.body.radius
            this.dashtarget = {}
            this.dashtarget.x = this.body.x
            this.dashtarget.y = this.body.y
            this.dashtarget.radius = 0
            this.slamcost = 40
            this.dashstate = -1
            this.mps = .2
            this.hps = .45
            this.gluerange = 75
            this.flippower = 150
            this.fliprange = 50
            this.slams = []
            this.orblist = []
            this.locked = 0
            this.orbcost = 15
            this.orbcooldown = 0
            this.orbdamage = 60
            this.orbdrain = 240
            this.slamdamage = 1
            this.slamcooldown = 0
            this.slamdrain = 300
            this.army = []
            this.spawner = 0
            this.spawnpoint = new Point(this.body.x, this.body.y)
            this.blindmonk = 0
            this.foxghost = 0
            this.demontaur = 0
            this.inventrix = 1
            this.robofister = 0
            this.pincushion = 0
            this.aliensquid = 0
            this.gasbag = 0
            this.ultcost = 100
            this.ultcooldown = 0
            this.ultdrain = 1000
            this.ultrun = 0
            this.basicrate = 55
            this.basictimer = 0
            this.basicrange = 80
            this.basictarget = {}
            this.basicdamage = 55
            this.dashrange = 199
            this.dashcooldown = 0
            this.axes = []
            this.hooklist = []
            this.hookcost = 55
            this.hookcooldown = 0
            this.hookdamage = 120
            this.hookdrain = 180
            this.towers = 1

        }
        marshal() {
            if (this.spawner % 1000 == 20) {
                let minion = new Mob(this.base.body.x, this.base.body.y, this)
                this.army.push(minion)
            }
            if (this.spawner % 1000 == 40) {
                let minion = new Mob(this.base.body.x, this.base.body.y, this)
                this.army.push(minion)
            }
            if (this.spawner % 1000 == 60) {
                let minion = new Mob(this.base.body.x, this.base.body.y, this)
                this.army.push(minion)
            }
            if (this.spawner % 1000 == 80) {
                let minion = new Mob(this.base.body.x, this.base.body.y, this)
                this.army.push(minion)
            }
            if (this.spawner % 1000 == 100) {
                let minion = new Mob(this.base.body.x, this.base.body.y, this)
                this.army.push(minion)
            }
            this.spawner++
            this.burial()
            this.command()
            this.burial()
        }
        command() {
            for (let t = 0; t < this.army.length; t++) {
                this.army[t].drawbar()
            }
            for (let t = 0; t < this.army.length; t++) {
                this.army[t].draw()
            }
            for (let t = 0; t < this.army.length; t++) {
                this.army[t].drawbar()
            }
        }
        burial() {
            for (let t = 0; t < this.army.length; t++) {
                if (this.army[t].health <= 0) {
                    if (this.army[t].tower == 1) {
                        this.towers--
                    }
                    this.army.splice(t, 1)
                }
            }
            for (let t = 0; t < this.army.length; t++) {
                this.army[t].drawbar()
            }

        }
        cooldown() {
            this.slamcooldown--
            this.shieldcooldown--
            this.orbcooldown--
            this.ultcooldown--
            this.ulttimer--
            this.dashcooldown--
            this.hookcooldown--
            if (this.dashcooldown <= 0) {
                this.dashstate = -1
            }
        }
        regen() {
            this.marshal()
            if (this.health > 0) {

                this.movespeedbase = 1

                this.mana += this.mps
                this.health += this.hps
                if (this.health > this.healthmax) {
                    this.health = this.healthmax
                }
                if (this.mana > this.manamax) {
                    this.mana = this.manamax
                }
            } else {
                if (this == players[0]) {
                    canvas_context.translate(this.body.x - this.spawnpoint.x, this.body.y - this.spawnpoint.y)
                }
                this.health = this.healthmax
                this.mana = this.manamax
                this.body.y = this.spawnpoint.y
                this.body.x = this.spawnpoint.x
                this.moveto.x = this.body.x + 1
                this.moveto.y = this.body.y + 1
                this.speedbonus = 0
            }
            this.speedbonus *= .999
        }
        control(to) {
            if (this.locked <= 0) {
                if (this == players[0]) {
                    this.moveto.x = this.body.x + (to.x - (canvas.width * .5))
                    this.moveto.y = this.body.y + (to.y - (canvas.height * .5))
                } else {
                    this.moveto.x = to.x
                    this.moveto.y = to.y
                }
            }
            if (this.body.doesPerimeterTouch(this.dashtarget)) {
                this.locked = 0
            }
            if (Math.round(this.locked) == 0) {
                this.speedbonus = 0
            }
        }
        drive() {
            if (typeof this.speedbonus == "undefined") {
                this.speedbonus = 0
            }
            if (this.locked <= 0 || this.locked == this.lockholder) {
                this.body.xmom = 0 - (this.body.x - this.moveto.x)
                this.body.ymom = 0 - (this.body.y - this.moveto.y)

                // if(Math.sqrt(Math.abs(this.body.xmom*this.body.xmom)+Math.abs(this.body.ymom*this.body.ymom)) != 0){
                let k = 0
                while (Math.sqrt(Math.abs(this.body.xmom * this.body.xmom) + Math.abs(this.body.ymom * this.body.ymom)) > (this.movespeedbase + this.speedbonus + this.speedboost)) {
                    this.body.xmom *= 0.98
                    this.body.ymom *= 0.98
                    if (k == 10000) {
                        break
                    }
                }
                k = 0
                while (Math.sqrt(Math.abs(this.body.xmom * this.body.xmom) + Math.abs(this.body.ymom * this.body.ymom)) < (this.movespeedbase + this.speedbonus + this.speedboost)) {
                    this.body.xmom *= 1.02
                    this.body.ymom *= 1.02
                    if (k == 10000) {
                        break
                    }
                }
            }
            if (this.body.doesPerimeterTouch(this.dashtarget)) {
                this.locked = 0
            }
            if (Math.round(this.locked) == 0) {
                this.speedbonus = 0
            }
        }
        gamepadSkillsAdapter(to) {

            let towards = new Point(0, 0)
            towards.x = (Math.cos(gamepad_angles().left) * 100) + 360
            towards.y = (Math.sin(gamepad_angles().left) * 100) + 360

            let link = new LineOP(this.body, towards)
            link.draw()

            if (gamepadAPI.buttonsStatus.includes('Left-Trigger')) {
                this.hooks(towards)
            }
            if (gamepadAPI.buttonsStatus.includes('Right-Trigger')) {
                towards.x = (Math.cos(gamepad_angles().left) * this.gluerange) + this.body.x
                towards.y = (Math.sin(gamepad_angles().left) * this.gluerange) + this.body.x
                this.orbs(towards)
            }
            if (gamepadAPI.buttonsStatus.includes('RB')) {

                towards.x = (Math.cos(gamepad_angles().left) * this.fliprange) + this.body.x
                towards.y = (Math.sin(gamepad_angles().left) * this.fliprange) + this.body.y
                this.slam(towards)
            }
            if (gamepadAPI.buttonsStatus.includes('LB')) {
                this.ulting()
            }
        }
        skillsAdapter(to) {
            if (this == players[0]) {
                if (keysPressed['q']) {
                    this.hooks(to)
                }
                if (keysPressed['w']) {
                    this.orbs(to)
                }
                if (keysPressed['e']) {
                    this.slam(to)
                }
                if (keysPressed['r']) {
                    this.ulting()
                }
            } else {
                let fuzz = {}
                fuzz.x = ((Math.random() - .5) * 10) + players[0].body.x
                fuzz.y = ((Math.random() - .5) * 10) + players[0].body.y
                this.ulting()
                fuzz.x = ((Math.random() - .5) * this.turretrange * .7) + this.body.x
                fuzz.y = ((Math.random() - .5) * this.turretrange * .7) + this.body.y
                this.slam(fuzz)

                if (Math.random() < .003) {
                    // this.orbs(fuzz)
                }

                if (typeof this.turretrange == "undefined") {
                    this.turretrange = 55
                }
                // fuzz.x = ((Math.random() - .5) * this.turretrange * .7) + this.body.x
                // fuzz.y = ((Math.random() - .5) * this.turretrange * .7) + this.body.y
                // if (!beam1.isPointInside(fuzz) && !beam2.isPointInside(fuzz)) {
                //     if (Math.random() < .005) {
                fuzz.x = ((Math.random() - .5) * 10) + players[0].body.x
                fuzz.y = ((Math.random() - .5) * 10) + players[0].body.y
                this.hooks(fuzz)
                //     } else if (this.health > this.healthmax * .5) {
                //         if (this.dashstate == 0) {
                this.orbs(fuzz)
                //         }
                //     }
                // }
            }

        }
        slash() {

            if (typeof this.orbrange == "undefined") {
                this.orbrange = 55

            }
            if (this.orbcooldown <= 0) {
                if (this.mana >= this.orbcost) {
                    let circ = new Circle(this.body.x, this.body.y, this.orbrange, "#66666688")
                    circ.life = 10
                    circ.body = circ
                    this.orblist[0] = circ
                    this.orbcooldown = this.orbdrain
                    this.mana -= this.orbcost
                }
            }


        }
        dashslam() {

            if (typeof this.dashdrain == "undefined") {
                this.dashdrain = 240
            }
            if (typeof this.dashcost == "undefined") {
                this.dashcost = 60
            }
            if (typeof this.empowered == "undefined") {
                this.empowered = 0
            }
            if (this.dashcooldown <= 0) {
                if (this.mana >= this.dashcost) {
                    this.speedboost = 1
                    this.empowered = 1

                    this.dashcooldown = this.dashdrain
                    this.mana -= this.dashcost
                }
            }


        }
        aura() {
            if (typeof this.auratimer == "undefined") {
                this.auratimer = 0

            }
            if (typeof this.aurarange == "undefined") {
                this.aurarange = 80

            }
        }

        hooks(to) {
            if (this.hookcooldown <= 0) {
                if (this.mana > this.hookcost) {
                    if (this.hookcooldown <= 0) {
                        let pin = new Stunorb(this.body, to, this)
                        if (this.ult > 0) {
                            this.ult = 0
                            pin.body.radius *= 1.5
                        }
                        this.hooklist.push(pin)
                        this.mana -= this.hookcost
                        this.hookcooldown = this.hookdrain
                    }
                }
            }
        }
        hookdraw() {
            for (let t = 0; t < this.hooklist.length; t++) {
                this.hooklist[t].move()
                this.hooklist[t].draw()
                this.hooklist[t].life -= 1
            }
            for (let t = 0; t < this.hooklist.length; t++) {
                if (this.hooklist[t].life <= 0) {
                    this.hooklist.splice(t, 1)
                }
            }
        }
        slam(to) {

            if (typeof this.turretrange == "undefined") {
                this.turretrange = 55

            }
            if (this.mana >= this.slamcost) {
                if (this.slamcooldown <= 0) {

                    if (this == players[0]) {
                        if (to.x == TIP_engine.x && to.y == TIP_engine.y) {
                            to.x += (this.body.x - 360)
                            to.y += (this.body.y - 360)
                        }
                    }
                    let link = new LineOP(this.body, to)
                    let linkhyp = link.hypotenuse()
                    if (linkhyp <= this.turretrange) {
                        let pin = new Mob(to.x, to.y, this)
                        //console.log(to)
                        pin.melee = 1.1
                        pin.movespeed = .00001
                        pin.range *= 3
                        pin.health *= 2
                        pin.maxhealth *= 2
                        if (this.ult > 0) {
                            this.ult = 0
                            pin.melee = 2.2
                            pin.movespeed = .00001
                            pin.range *= 3
                            pin.health *= 2
                            pin.maxhealth *= 2
                            pin.body.radius *= 1.5
                        }
                        pin.tower = 1
                        if (this == players[0]) {
                            pin.body.color = "#AA5555"
                        } else {
                            pin.body.color = "#5555AA"
                        }
                        // console.log(this.towers)
                        if (this.towers < 4) {
                            this.army.push(pin)
                            this.towers++
                        } else {
                            let punter = 1
                            for (let t = 0; t < this.army.length; t++) {
                                if (this.army[t].tower == 1) {
                                    if (punter == 0) {
                                        this.army.splice(t, 1)
                                        this.army.push(pin)
                                        break
                                    }
                                    punter--
                                }
                            }
                        }
                        this.slamcooldown = this.slamdrain
                        this.mana -= this.slamcost
                    }
                }
            }

        }
        slamdraw() {
            for (let t = 0; t < this.slams.length; t++) {
                this.slams[t].move()
                this.slams[t].draw()
                this.slams[t].life -= .2
            }
            for (let t = 0; t < this.slams.length; t++) {
                if (this.slams[t].life <= 0) {
                    this.slams.splice(t, 1)
                }
            }

        }
        ulting(to) {
            if (this.mana >= this.ultcost) {
                if (this.ultcooldown <= 0) {
                    this.ult = 1
                    this.ultcooldown = this.ultdrain
                    this.mana -= this.ultcost
                }
            }
        }
        shielder(to) {
            if (this.mana >= this.shieldcost) {
                if (this.shieldcooldown <= 0) {
                    this.activeshield = this.shieldpower
                    this.shieldcooldown = this.shielddrain
                }
            }
        }
        orbs(to) {


            if (this.orbcooldown <= 0) {
                if (this.mana > this.orbcost) {
                    if (this.orbcooldown <= 0) {
                        // //console.log(to)

                        if (typeof (gamepadAPI.axesStatus[2]) != 'undefined') {
                            if (typeof (gamepadAPI.axesStatus[3]) != 'undefined') {


                                // to.x = (Math.cos(gamepad_angles().left) * this.gluerange) +  this.body.x
                                // to.y = (Math.sin(gamepad_angles().left) * this.gluerange) +  this.body.x

                                if (Math.abs(gamepadAPI.axesStatus[2]) + Math.abs(gamepadAPI.axesStatus[3]) >= .1) {
                                    let point1 = new Point(gamepadAPI.axesStatus[2], 0)
                                    let point2 = new Point(0, gamepadAPI.axesStatus[3])

                                    to.x = this.body.x + gamepadAPI.axesStatus[2] * this.gluerange
                                    to.y = this.body.y + gamepadAPI.axesStatus[3] * this.gluerange
                                    let link = new LineOP(point1, point2)
                                    to.x = this.body.x + ((to.x - this.body.x) * link.hypotenuse())
                                    to.y = this.body.y + ((to.y - this.body.y) * link.hypotenuse())
                                    this.axes[0] = gamepadAPI.axesStatus[2]
                                    this.axes[1] = gamepadAPI.axesStatus[3]

                                } else {
                                    let point1 = new Point(this.axes[0], 0)
                                    let point2 = new Point(0, this.axes[1])

                                    to.x = this.body.x + this.axes[0] * this.gluerange
                                    to.y = this.body.y + this.axes[1] * this.gluerange
                                    let link = new LineOP(point1, point2)
                                    to.x = this.body.x + ((to.x - this.body.x) * link.hypotenuse())
                                    to.y = this.body.y + ((to.y - this.body.y) * link.hypotenuse())

                                }



                                // //console.log(to)
                            }
                        }


                        let angle = (new LineOP(to, this.body)).angle()
                        let ratio = (new LineOP(this.body, to)).hypotenuse() / (this.gluerange * 1.41)
                        // ratio-=.5
                        angle -= (ratio * (Math.PI / 1.5))


                        this.bodyholder = new Circle(this.body.x, this.body.y, 10, "transparent")

                        if (this.ult > 0) {
                            this.ult = 0
                            for (let k = 0; k < 5; k++) {
                                let angle = (new LineOP(to, this.body)).angle()
                                let ratio = (new LineOP(this.body, to)).hypotenuse() / (this.gluerange * 1.41)
                                // ratio-=.5
                                angle -= (ratio * (Math.PI / 1.5))


                                this.bodyholder = new Circle(this.body.x, this.body.y, 10, "transparent")
                                for (let t = 0; t < 5; t++) {
                                    let point = new Point(this.bodyholder.x - (this.body.x - 360) + (Math.cos(angle) * 100), this.bodyholder.y - (this.body.y - 360) + (Math.sin(angle) * 100))
                                    angle += ((ratio * (Math.PI / 1.5))) / 2
                                    let pin = new MissileOrb(this.bodyholder, point, this)
                                    for (let g = 0; g < k; g++) {
                                        pin.body.unmove()
                                    }
                                    this.orblist.push(pin)
                                }
                            }
                        } else {

                            for (let t = 0; t < 5; t++) {
                                let point = new Point(this.bodyholder.x - (this.body.x - 360) + (Math.cos(angle) * 100), this.bodyholder.y - (this.body.y - 360) + (Math.sin(angle) * 100))
                                angle += ((ratio * (Math.PI / 1.5))) / 2
                                let pin = new MissileOrb(this.bodyholder, point, this)
                                for (let k = 0; k < 3; k++) {
                                    pin.unmove()
                                }

                                this.orblist.push(pin)
                            }
                        }
                        this.mana -= this.orbcost
                        this.orbcooldown = this.orbdrain
                    }
                }
            }
        }
        ultdash(to) {
            let link = new LineOP(this.body, to)
            if (link.hypotenuse() <= this.dashrange) {
                if (this.ultcooldown <= 0) {
                    if (this.mana >= this.ultcost) {
                        this.dashtate = 2
                        this.ulttimer = 100
                        this.empowered = 1
                        this.dashtarget.x = to.x
                        this.dashtarget.y = to.y
                        this.moveto.x = this.dashtarget.x
                        this.moveto.y = this.dashtarget.y
                        this.moveto.radius = this.dashtarget.radius
                        this.speedbonus = 10
                        this.mana -= this.ultcost
                        this.ultcooldown = this.ultdrain
                        let link = new LineOP(this.body, this.dashtarget)
                        this.locked = (link.hypotenuse()) / (this.movespeedbase + this.speedbonus)
                        this.lockholder = this.locked
                    }
                }
            }
        }
        // orbs(to) {

        //     if (this.orbcooldown <= 0) {
        //         if (this.mana > this.orbcost) {
        //             if (this.orbcooldown <= 0) {
        //                 let pin = new Fireorb(this.body, to, this)
        //                 this.orblist.push(pin)
        //                 this.mana -= this.orbcost
        //                 this.orbcooldown = this.orbdrain
        //                 this.dashstate = 0
        //             }
        //         }
        //     }
        // }
        orbdraw() {
            for (let t = 0; t < this.orblist.length; t++) {
                this.orblist[t].move()
                this.orblist[t].draw()
                this.orblist[t].life -= 1
            }
            for (let t = 0; t < this.orblist.length; t++) {
                if (this.orblist[t].life <= 0) {
                    this.orblist.splice(t, 5)
                }
            }
        }
        draw() {
            // //console.log(this.ult)
            if (this == players[0]) {
                canvas_context.fillStyle = "gold"
                canvas_context.font = "20px arial"
                canvas_context.fillText(`${this.gold}`, this.body.x - 340, this.body.y - 340)
            }

            if (this == players[0]) {
                let towards = new Point(0, 0)
                if (players[0].pincushion == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 100) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 100) + this.body.y
                } else if (players[0].gasbag == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 50) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 50) + this.body.y
                } else if (players[0].blindmonk == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 100) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 100) + this.body.y
                } else if (players[0].robofister == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 200) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 200) + this.body.y
                } else if (players[0].foxghost == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 120) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 120) + this.body.y
                } else if (players[0].aliensquid == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 120) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 120) + this.body.y
                } else if (players[0].demontaur == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 30) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 30) + this.body.y
                } else if (players[0].inventrix == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 80) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 80) + this.body.y
                }


                let link = new LineOP(this.body, towards, "white", 1)
                link.draw()
            }

            this.aura()
            this.regen()
            this.drive()
            this.locked--
            let check = new LineOP(this.moveto, this.body)
            if (check.hypotenuse() > (.7 * (this.movespeedbase + this.speedbonus))) {
                this.body.move()
            } else if (this.locked > 0) {
                this.body.move()
            }

            if (keysPressed['e']) {
                if (this == players[0]) {
                    let circ = new Circle(this.body.x, this.body.y, this.turretrange, "black")
                    canvas_context.strokeStyle = circ.color
                    canvas_context.beginPath()
                    canvas_context.arc(circ.x, circ.y, circ.radius, 0, Math.PI * 2, true)
                    canvas_context.stroke()
                    canvas_context.closePath()
                }
            }
            this.body.draw()
            this.basic()
            if (this.activeshield > 0) {
                let shield = new Circle(this.body.x, this.body.y, (this.activeshield * .020), "yellow")
                shield.draw()
            }
            this.healthbar = new Rectangle(this.body.x - this.body.radius, this.body.y - (this.body.radius * 2), this.body.radius * 2, this.body.radius * .25, "green")
            this.healthbar.width = (this.health / this.healthmax) * this.body.radius * 2
            this.manabar = new Rectangle(this.body.x - this.body.radius, this.body.y - (this.body.radius * 1.6), this.body.radius * 2, this.body.radius * .25, "blue")
            this.manabar.width = (this.mana / this.manamax) * this.body.radius * 2
            this.healthbar.draw()
            this.manabar.draw()
            this.slamdraw()
            this.hookdraw()
            this.orbdraw()
            this.cooldown()
            this.collide()
        }
        basic() {
            this.basictimer++
            let min = this.basicrange
            this.basictarget = {}
            for (let t = 0; t < players.length; t++) {
                if (players[t] != this) {
                    for (let k = 0; k < players[t].army.length; k++) {
                        let link = new LineOP(this.body, players[t].army[k].body)
                        if (link.hypotenuse() <= min) {
                            min = link.hypotenuse()
                            this.basictarget = players[t].army[k]
                        }
                        let link2 = new LineOP(this.body, players[t].body)
                        if (link2.hypotenuse() <= this.basicrange) {
                            this.basictarget = players[t]
                        }
                    }
                }
            }

            this.basicAttack()
        }
        basicAttack() {
            if (this.basictarget.health > 0) {
                if (this.basictimer % this.basicrate == 0) {
                    this.basictarget.health -= this.basicdamage
                    if (this.empowered == 1) {

                        this.basictarget.body.xmom = ((this.basictarget.body.x - this.body.x) / 6) * this.speedboost
                        this.basictarget.body.ymom = ((this.basictarget.body.y - this.body.y) / 6) * this.speedboost
                        for (let t = 0; t < 3; t++) {
                            this.basictarget.body.move()
                            this.basictarget.health -= this.basicdamage
                        }
                        this.speedboost = 0
                    }

                }
                if (this.basictimer % this.basicrate <= 9) {
                    let link = new LineOP(this.body, this.basictarget.body, "black", 4)
                    link.draw()
                }
            }
        }
        collide() {
            let dummy = this.health
            for (let t = 0; t < players.length; t++) {
                if (this != players[t]) {
                    if (players[t].gasbag == 1) {
                        for (let k = 0; k < players[t].gasses.length; k++) {
                            if (players[t].gasses[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].gasdamage)
                            }
                        }
                        for (let k = 0; k < players[t].glues.length; k++) {
                            if (players[t].glues[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].gluedamage)
                                this.speedbonus = players[t].gluedrop
                            }
                        }
                    } else if (players[t].pincushion == 1) {
                        for (let k = 0; k < players[t].spears.length; k++) {
                            if (players[t].spears[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].speardamage - (players[t].spears[k].life))
                                players[t].spears[k].life = 0
                            } else if (players[t].spears[k].shaft.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].speardamage - (players[t].spears[k].life))
                                players[t].spears[k].life = 0
                            }
                        }
                        for (let k = 0; k < players[t].traps.length; k++) {
                            if (players[t].traps[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].trapdamage)
                                this.speedbonus = players[t].trapdrop
                                players[t].traps[k].life = 0
                            }
                        }
                    } else if (players[t].blindmonk == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                this.speedbonus = players[t].slamdrop
                            }
                        }
                        for (let k = 0; k < players[t].orblist.length; k++) {
                            if (players[t].orblist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].orbdamage)
                                players[t].dashtarget.x = this.body.x
                                players[t].dashtarget.y = this.body.y
                                players[t].dashstate = 1
                                players[t].orblist[k].life = 0
                            }
                        }
                    } else if (players[t].robofister == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                this.speedbonus = players[t].slamdrop
                            }
                        }
                        for (let k = 0; k < players[t].hooklist.length; k++) {
                            if (players[t].hooklist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].hookdamage)
                                this.dashtarget.x = players[t].body.x
                                this.dashtarget.y = players[t].body.y
                                this.moveto.x = players[t].body.x
                                this.moveto.y = players[t].body.y
                                this.moveto.radius = players[t].body.radius
                                this.speedbonus = 7
                                let link = new LineOP(this.body, this.dashtarget)
                                let hookdot = (link.hypotenuse()) / (this.movespeedbase + this.speedbonus)
                                this.locked = Math.round(hookdot)
                                this.lockholder = Math.round(hookdot)
                                players[t].hooklist[k].life = 0
                            }
                        }
                    } else if (players[t].aliensquid == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                this.speedbonus = players[t].slamdrop
                            }
                        }
                        for (let k = 0; k < players[t].spears.length; k++) {
                            if (players[t].spears[k].engage == 0) {
                                if (players[t].spears[k].body.doesPerimeterTouch(this.body)) {
                                    this.health -= players[t].speardamage
                                    players[t].spears[k].life = 0
                                }
                            } else {
                                if (players[t].spears[k].body1.doesPerimeterTouch(this.body)) {
                                    if (players[t].spears[k].life1 != 0) {
                                        this.health -= players[t].speardamage
                                        players[t].spears[k].life1 = 0
                                    }
                                }
                                if (players[t].spears[k].body2.doesPerimeterTouch(this.body)) {
                                    if (players[t].spears[k].life2 != 0) {
                                        this.health -= players[t].speardamage
                                        players[t].spears[k].life2 = 0
                                    }
                                }
                            }
                        }
                    } else if (players[t].foxghost == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                players[t].slamdamage = 0
                                players[t].theftcount++
                                if (players[t].theftcount >= 9) {
                                    players[t].theftcount = 0
                                    players[t].health += players[t].theftbonus
                                }
                            }
                        }
                        for (let k = 0; k < players[t].orblist.length; k++) {
                            if (players[t].orblist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].orbdamage)
                                players[t].theftcount++
                                if (players[t].theftcount >= 9) {
                                    players[t].theftcount = 0
                                    players[t].health += players[t].theftbonus
                                }
                            }
                        }
                        for (let k = 0; k < players[t].hooklist.length; k++) {
                            if (players[t].hooklist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].hookdamage)
                                this.dashtarget.x = players[t].body.x
                                this.dashtarget.y = players[t].body.y
                                this.moveto.x = players[t].body.x
                                this.moveto.y = players[t].body.y
                                this.moveto.radius = players[t].body.radius
                                this.speedbonus = 7
                                let link = new LineOP(this.body, this.dashtarget)
                                let hookdot = ((link.hypotenuse()) / (this.movespeedbase + this.speedbonus)) * 2
                                this.speedbonus = -.4
                                this.locked = Math.round(hookdot)
                                this.lockholder = Math.round(hookdot)
                                players[t].hooklist[k].life = 0
                                players[t].theftcount++
                                if (players[t].theftcount >= 9) {
                                    players[t].theftcount = 0
                                    players[t].health += players[t].theftbonus
                                }
                            }
                        }
                    } else if (players[t].demontaur == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                players[t].health += (players[t].slamdamage) * .2
                            }
                        }
                        for (let k = 0; k < players[t].orblist.length; k++) {
                            if (players[t].orblist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].orbdamage)
                            }
                        }
                    } else if (players[t].inventrix == 1) {
                        for (let k = 0; k < players[t].hooklist.length; k++) {
                            if (players[t].hooklist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].hookdamage)
                                this.dashtarget.x = players[t].body.x
                                this.dashtarget.y = players[t].body.y
                                this.moveto.x = players[t].body.x
                                this.moveto.y = players[t].body.y
                                this.moveto.radius = players[t].body.radius
                                this.speedbonus = (-1 * (this.movespeedbase + this.speedboost)) + .0000001
                                let hookdot = 200
                                this.locked = Math.round(hookdot)
                                this.lockholder = Math.round(hookdot)
                                players[t].hooklist[k].life = 0
                            }
                        }
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                players[t].health += (players[t].slamdamage) * .2
                            }
                        }
                        for (let k = 0; k < players[t].orblist.length; k++) {
                            if (players[t].orblist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].orbdamage)
                            }
                        }
                    }else if (players[t].artsassin == 1) {
                        for (let k = 0; k < players[t].spears.length; k++) {
                                if (players[t].spears[k].body.doesPerimeterTouch(this.body)) {
                                    this.health -= players[t].speardamage
                                    
                                this.speedbonus = (-1 * (this.movespeedbase + this.speedboost)) + .0000001
                                let hookdot = 200
                                this.locked = Math.round(hookdot)
                                this.lockholder = Math.round(hookdot)
                                }
                        }
                        for (let k = 0; k < players[t].traps.length; k++) {
                            if (players[t].traps[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].trapdamage)
                                this.speedbonus = (-1 * (this.movespeedbase + this.speedboost)) + .0000001
                                let hookdot = 200
                                this.locked = Math.round(hookdot)
                                this.lockholder = Math.round(hookdot)
                                players[t].traps[k].life = 0
                            }
                        }
                    }
                    if (this.health <= 0) {
                        players[t].gold += this.goldvalue
                        break
                    }
                }
            }


            if (dummy > this.health) {
                if (this.activeshield > 0) {
                    if (this.activeshield >= dummy - this.health) {
                        this.activeshield -= dummy - this.health
                        this.health = dummy
                    } else {
                        this.health += this.activeshield
                        this.activeshield = 0
                    }
                }
            }
        }

    }

    class Robofister {
        constructor(x, y, color) {
            this.gold = 500
            this.goldvalue = 300
            this.lockholder = -1
            this.ult = 0
            this.body = new Circle(x, y, 10, color)
            this.movespeedbase = 1
            this.slamdrop = -.8
            this.speedbonus = 0
            this.shieldcost = 30
            this.shieldpower = 150
            this.shieldtimer = 100
            this.shielddrain = 140
            this.shieldcooldown = 0
            this.shieldstate = 0
            this.health = 650
            this.healthmax = this.health
            this.mana = 100
            this.manamax = this.mana
            this.moveto = {}
            this.moveto.x = this.body.x - 1.01
            this.moveto.y = this.body.y
            this.moveto.radius = this.body.radius
            this.dashtarget = {}
            this.dashtarget.x = this.body.x
            this.dashtarget.y = this.body.y
            this.dashtarget.radius = 0
            this.slamcost = 40
            this.dashstate = -1
            this.mps = .5
            this.hps = .15
            this.gluerange = 75
            this.flippower = 150
            this.fliprange = 50
            this.slams = []
            this.hooklist = []
            this.locked = 0
            this.hookcost = 25
            this.hookcooldown = 0
            this.hookdamage = 50
            this.hookdrain = 200
            this.slamdamage = 10
            this.slamcooldown = 0
            this.slamdrain = 300
            this.army = []
            this.spawner = 0
            this.spawnpoint = new Point(this.body.x, this.body.y)
            this.blindmonk = 0
            this.pincushion = 0
            this.gasbag = 0
            this.robofister = 1
            this.aliensquid = 0
            this.ultcost = 25
            this.ultcooldown = 0
            this.ultdrain = 1000
            this.speedboost = 0
            this.ultrun = 0
            this.basicrate = 60
            this.basictimer = 0
            this.basicrange = 26
            this.basictarget = {}
            this.basicdamage = 95
        }
        marshal() {
            if (this.spawner % 1000 == 20) {
                let minion = new Mob(this.base.body.x, this.base.body.y, this)
                this.army.push(minion)
            }
            if (this.spawner % 1000 == 40) {
                let minion = new Mob(this.base.body.x, this.base.body.y, this)
                this.army.push(minion)
            }
            if (this.spawner % 1000 == 60) {
                let minion = new Mob(this.base.body.x, this.base.body.y, this)
                this.army.push(minion)
            }
            if (this.spawner % 1000 == 80) {
                let minion = new Mob(this.base.body.x, this.base.body.y, this)
                this.army.push(minion)
            }
            if (this.spawner % 1000 == 100) {
                let minion = new Mob(this.base.body.x, this.base.body.y, this)
                this.army.push(minion)
            }
            this.spawner++
            this.burial()
            this.command()
            this.burial()
        }
        command() {
            for (let t = 0; t < this.army.length; t++) {
                this.army[t].drawbar()
            }
            for (let t = 0; t < this.army.length; t++) {
                this.army[t].draw()
            }
            for (let t = 0; t < this.army.length; t++) {
                this.army[t].drawbar()
            }
        }
        burial() {
            for (let t = 0; t < this.army.length; t++) {
                if (this.army[t].health <= 0) {
                    this.army.splice(t, 1)
                }
            }
            for (let t = 0; t < this.army.length; t++) {
                this.army[t].drawbar()
            }

        }
        cooldown() {
            this.slamcooldown--
            this.shieldcooldown--
            this.hookcooldown--
            this.ultcooldown--
            if (this.hookcooldown <= 0) {
                this.dashstate = -1
            }
        }
        regen() {
            if (this.ultrun > 0) {
                this.ult = 1
            } else {
                this.ult = 0
            }
            this.marshal()
            if (this.health > 0) {
                if (this.ult == 1) {
                    this.mana += this.mps
                    this.health += this.hps
                    this.mana += this.mps
                    this.health += this.hps
                    this.movespeedbase = 1.8
                } else {
                    this.movespeedbase = 1
                }
                this.mana += this.mps
                this.health += this.hps
                if (this.health > this.healthmax) {
                    this.health = this.healthmax
                }
                if (this.mana > this.manamax) {
                    this.mana = this.manamax
                }
            } else {
                this.ult = 0
                this.ultrun = 0
                if (this == players[0]) {
                    canvas_context.translate(this.body.x - this.spawnpoint.x, this.body.y - this.spawnpoint.y)
                }
                this.health = this.healthmax
                this.mana = this.manamax
                this.body.y = this.spawnpoint.y
                this.body.x = this.spawnpoint.x
                this.moveto.x = this.body.x + 1
                this.moveto.y = this.body.y + 1
                this.speedbonus = 0
            }
            this.speedbonus *= .999
        }

        control(to) {
            if (this.locked <= 0) {
                if (this == players[0]) {
                    this.moveto.x = this.body.x + (to.x - (canvas.width * .5))
                    this.moveto.y = this.body.y + (to.y - (canvas.height * .5))
                } else {
                    this.moveto.x = to.x
                    this.moveto.y = to.y
                }
            }
            if (this.body.doesPerimeterTouch(this.dashtarget)) {
                this.locked = 0
            }
            if (Math.round(this.locked) == 0) {
                this.speedbonus = 0
            }
        }
        drive() {
            if (typeof this.speedbonus == "undefined") {
                this.speedbonus = 0
            }
            if (this.locked <= 0 || this.locked == this.lockholder) {
                this.body.xmom = 0 - (this.body.x - this.moveto.x)
                this.body.ymom = 0 - (this.body.y - this.moveto.y)

                // if(Math.sqrt(Math.abs(this.body.xmom*this.body.xmom)+Math.abs(this.body.ymom*this.body.ymom)) != 0){
                let k = 0
                while (Math.sqrt(Math.abs(this.body.xmom * this.body.xmom) + Math.abs(this.body.ymom * this.body.ymom)) > (this.movespeedbase + this.speedbonus)) {
                    this.body.xmom *= 0.98
                    this.body.ymom *= 0.98
                    if (k == 10000) {
                        break
                    }
                }
                k = 0
                while (Math.sqrt(Math.abs(this.body.xmom * this.body.xmom) + Math.abs(this.body.ymom * this.body.ymom)) < (this.movespeedbase + this.speedbonus)) {
                    this.body.xmom *= 1.02
                    this.body.ymom *= 1.02
                    if (k == 10000) {
                        break
                    }
                }
            }
            if (this.body.doesPerimeterTouch(this.dashtarget)) {
                this.locked = 0
            }
            if (Math.round(this.locked) == 0) {
                this.speedbonus = 0
            }
        }
        gamepadSkillsAdapter(to) {

            let towards = new Point(0, 0)
            towards.x = (Math.cos(gamepad_angles().left) * 100) + 360
            towards.y = (Math.sin(gamepad_angles().left) * 100) + 360

            let link = new LineOP(this.body, towards)
            link.draw()

            if (gamepadAPI.buttonsStatus.includes('Left-Trigger')) {
                this.hooks(towards)
            }
            if (gamepadAPI.buttonsStatus.includes('Right-Trigger')) {
                // towards.x = (Math.cos(gamepad_angles().left) * this.gluerange) + 360
                // towards.y = (Math.sin(gamepad_angles().left) * this.gluerange) + 360
                this.shielder(towards)
            }
            if (gamepadAPI.buttonsStatus.includes('RB')) {

                towards.x = (Math.cos(gamepad_angles().left) * this.fliprange) + this.body.x
                towards.y = (Math.sin(gamepad_angles().left) * this.fliprange) + this.body.y
                this.slam(towards)
            }
            if (gamepadAPI.buttonsStatus.includes('LB')) {
                this.ulting(towards)
            }
        }
        skillsAdapter(to) {
            if (this == players[0]) {
                if (keysPressed['q']) {
                    this.hooks(to)
                }
                if (keysPressed['w']) {
                    this.shielder(to)
                }
                if (keysPressed['e']) {
                    this.slam(to)
                }
                if (keysPressed['r']) {
                    this.ulting(to)
                }
            } else {
                let fuzz = {}
                fuzz.x = ((Math.random() - .5) * 10) + players[0].body.x
                fuzz.y = ((Math.random() - .5) * 10) + players[0].body.y
                this.ulting(fuzz)
                this.slam(fuzz)

                if (this.mana > this.flipcost + Math.max(this.gascost, this.gluecost)) {
                    if (Math.random() < .003) {
                        if (this.health < this.maxhealth - this.flippower) {
                            this.shielder(fuzz)
                        }
                    }
                }
                // fuzz.x = ((Math.random() - .5) * this.gluerange * .7) + this.body.x
                // fuzz.y = ((Math.random() - .5) * this.gluerange * .7) + this.body.y
                if (!beam1.isPointInside(fuzz) && !beam2.isPointInside(fuzz)) {
                    if (Math.random() < .005) {
                        this.hooks(fuzz)
                    } else if (this.health > this.healthmax * .5) {
                        if (this.dashstate == 0) {
                            this.hooks(fuzz)
                        }
                    }
                }
            }

        }
        ulting(to) {
            if (this.mana >= this.ultcost) {
                if (this.ultcooldown <= 0) {
                    this.ult = 1
                    this.ultcooldown = this.ultdrain
                    this.mana -= this.ultcost
                }
            }

        }
        slamdraw() {
            for (let t = 0; t < this.slams.length; t++) {
                this.slams[t].move()
                this.slams[t].draw()
                this.slams[t].life -= .2
            }
            for (let t = 0; t < this.slams.length; t++) {
                if (this.slams[t].life <= 0) {
                    this.slams.splice(t, 1)
                }
            }

        }
        slam(to) {
            if (this.mana >= this.ultcost) {
                if (this.ultcooldown <= 0) {
                    // this.mana -= this.ultcost
                    // this.ultcooldown -= this.ultdrain
                }
            }
        }
        shielder(to) {
            if (this.mana >= this.shieldcost) {
                if (this.shieldcooldown <= 0) {
                    this.speedboost = .45
                    this.activeshield = this.shieldpower
                    this.shieldcooldown = this.shielddrain
                }
            }
        }
        hooks(to) {

            if (this.hookcooldown <= 0) {
                if (this.dashstate == -1) {
                    if (this.mana > this.hookcost) {
                        if (this.hookcooldown <= 0) {
                            let pin = new Hook(this.body, to, this)
                            this.hooklist.push(pin)
                            this.mana -= this.hookcost
                            this.hookcooldown = this.hookdrain
                            this.dashstate = 0
                        }
                    }
                }
            }
        }
        hookdraw() {
            for (let t = 0; t < this.hooklist.length; t++) {
                this.hooklist[t].move()
                this.hooklist[t].draw()
                this.hooklist[t].life -= 1
            }
            for (let t = 0; t < this.hooklist.length; t++) {
                if (this.hooklist[t].life <= 0) {
                    this.hooklist.splice(t, 1)
                }
            }
        }
        draw() {
            if (this == players[0]) {
                canvas_context.fillStyle = "gold"
                canvas_context.font = "20px arial"
                canvas_context.fillText(`${this.gold}`, this.body.x - 340, this.body.y - 340)
            }

            if (this == players[0]) {
                let towards = new Point(0, 0)
                if (players[0].pincushion == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 100) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 100) + this.body.y
                } else if (players[0].gasbag == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 50) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 50) + this.body.y
                } else if (players[0].blindmonk == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 100) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 100) + this.body.y
                } else if (players[0].robofister == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 200) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 200) + this.body.y
                } else if (players[0].foxghost == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 120) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 120) + this.body.y
                } else if (players[0].aliensquid == 1) {
                    towards.x = (Math.cos(gamepad_angles().left) * 120) + this.body.x
                    towards.y = (Math.sin(gamepad_angles().left) * 120) + this.body.y
                }

                let link = new LineOP(this.body, towards, "white", 1)
                link.draw()
            }

            this.regen()
            this.drive()
            this.locked--
            let check = new LineOP(this.moveto, this.body)
            if (check.hypotenuse() > (.7 * (this.movespeedbase + this.speedbonus))) {
                this.body.move()
            } else if (this.locked > 0) {
                this.body.move()
            }

            if (keysPressed['e']) {
                if (this == players[0]) {
                    let circ = new Circle(this.body.x, this.body.y, this.gluerange, "black")
                    canvas_context.strokeStyle = circ.color
                    canvas_context.beginPath()
                    canvas_context.arc(circ.x, circ.y, circ.radius, 0, Math.PI * 2, true)
                    canvas_context.stroke()
                    canvas_context.closePath()
                }
            }
            this.body.draw()
            this.basic()
            if (this.activeshield > 0) {
                let shield = new Circle(this.body.x, this.body.y, (this.activeshield * .020), "yellow")
                shield.draw()
            }
            this.healthbar = new Rectangle(this.body.x - this.body.radius, this.body.y - (this.body.radius * 2), this.body.radius * 2, this.body.radius * .25, "green")
            this.healthbar.width = (this.health / this.healthmax) * this.body.radius * 2
            this.manabar = new Rectangle(this.body.x - this.body.radius, this.body.y - (this.body.radius * 1.6), this.body.radius * 2, this.body.radius * .25, "red")
            this.manabar.width = (this.mana / this.manamax) * this.body.radius * 2
            this.healthbar.draw()
            this.manabar.draw()
            this.slamdraw()
            this.hookdraw()
            this.cooldown()
            this.collide()
        }
        basic() {
            this.basictimer++
            let min = this.basicrange
            this.basictarget = {}
            for (let t = 0; t < players.length; t++) {
                if (players[t] != this) {
                    for (let k = 0; k < players[t].army.length; k++) {
                        let link = new LineOP(this.body, players[t].army[k].body)
                        if (link.hypotenuse() <= min) {
                            min = link.hypotenuse()
                            this.basictarget = players[t].army[k]
                        }
                        let link2 = new LineOP(this.body, players[t].body)
                        if (link2.hypotenuse() <= this.basicrange) {
                            this.basictarget = players[t]
                        }
                    }
                }
            }

            this.basicAttack()
        }
        basicAttack() {
            if (this.basictarget.health > 0) {
                if (this.basictimer % this.basicrate == 0) {
                    this.basictarget.health -= this.basicdamage
                }
                if (this.basictimer % this.basicrate <= 9) {
                    let link = new LineOP(this.body, this.basictarget.body, "black", 4)
                    link.draw()
                }
            }
        }
        collide() {
            let dummy = this.health
            for (let t = 0; t < players.length; t++) {
                if (this != players[t]) {
                    if (players[t].gasbag == 1) {
                        for (let k = 0; k < players[t].gasses.length; k++) {
                            if (players[t].gasses[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].gasdamage)
                            }
                        }
                        for (let k = 0; k < players[t].glues.length; k++) {
                            if (players[t].glues[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].gluedamage)
                                this.speedbonus = players[t].gluedrop
                            }
                        }
                    } else if (players[t].pincushion == 1) {
                        for (let k = 0; k < players[t].spears.length; k++) {
                            if (players[t].spears[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].speardamage - (players[t].spears[k].life))
                                players[t].spears[k].life = 0
                            } else if (players[t].spears[k].shaft.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].speardamage - (players[t].spears[k].life))
                                players[t].spears[k].life = 0
                            }
                        }
                        for (let k = 0; k < players[t].traps.length; k++) {
                            if (players[t].traps[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].trapdamage)
                                this.speedbonus = players[t].trapdrop
                                players[t].traps[k].life = 0
                            }
                        }
                    } else if (players[t].blindmonk == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                this.speedbonus = players[t].slamdrop
                            }
                        }
                        for (let k = 0; k < players[t].orblist.length; k++) {
                            if (players[t].orblist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].orbdamage)
                                players[t].dashtarget.x = this.body.x
                                players[t].dashtarget.y = this.body.y
                                players[t].dashstate = 1
                                players[t].orblist[k].life = 0
                            }
                        }
                    } else if (players[t].robofister == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                this.speedbonus = players[t].slamdrop
                            }
                        }
                        for (let k = 0; k < players[t].hooklist.length; k++) {
                            if (players[t].hooklist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].hookdamage)
                                this.dashtarget.x = players[t].body.x
                                this.dashtarget.y = players[t].body.y
                                this.moveto.x = players[t].body.x
                                this.moveto.y = players[t].body.y
                                this.moveto.radius = players[t].body.radius
                                this.speedbonus = 7
                                let link = new LineOP(this.body, this.dashtarget)
                                let hookdot = (link.hypotenuse()) / (this.movespeedbase + this.speedbonus)
                                this.locked = Math.round(hookdot)
                                this.lockholder = Math.round(hookdot)
                                players[t].hooklist[k].life = 0
                                ////console.log(this)
                            }
                        }
                    } else if (players[t].aliensquid == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                this.speedbonus = players[t].slamdrop
                            }
                        }
                        for (let k = 0; k < players[t].spears.length; k++) {
                            if (players[t].spears[k].engage == 0) {
                                if (players[t].spears[k].body.doesPerimeterTouch(this.body)) {
                                    this.health -= players[t].speardamage
                                    players[t].spears[k].life = 0
                                }
                            } else {
                                if (players[t].spears[k].body1.doesPerimeterTouch(this.body)) {
                                    if (players[t].spears[k].life1 != 0) {
                                        this.health -= players[t].speardamage
                                        players[t].spears[k].life1 = 0
                                    }
                                }
                                if (players[t].spears[k].body2.doesPerimeterTouch(this.body)) {
                                    if (players[t].spears[k].life2 != 0) {
                                        this.health -= players[t].speardamage
                                        players[t].spears[k].life2 = 0
                                    }
                                }
                            }
                        }
                    } else if (players[t].foxghost == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                players[t].slamdamage = 0
                                players[t].theftcount++
                                if (players[t].theftcount >= 9) {
                                    players[t].theftcount = 0
                                    players[t].health += players[t].theftbonus
                                }
                            }
                        }
                        for (let k = 0; k < players[t].orblist.length; k++) {
                            if (players[t].orblist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].orbdamage)
                                players[t].theftcount++
                                if (players[t].theftcount >= 9) {
                                    players[t].theftcount = 0
                                    players[t].health += players[t].theftbonus
                                }
                            }
                        }
                        for (let k = 0; k < players[t].hooklist.length; k++) {
                            if (players[t].hooklist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].hookdamage)
                                this.dashtarget.x = players[t].body.x
                                this.dashtarget.y = players[t].body.y
                                this.moveto.x = players[t].body.x
                                this.moveto.y = players[t].body.y
                                this.moveto.radius = players[t].body.radius
                                this.speedbonus = 7
                                let link = new LineOP(this.body, this.dashtarget)
                                let hookdot = ((link.hypotenuse()) / (this.movespeedbase + this.speedbonus)) * 2
                                this.speedbonus = -.4
                                this.locked = Math.round(hookdot)
                                this.lockholder = Math.round(hookdot)
                                players[t].hooklist[k].life = 0
                                players[t].theftcount++
                                if (players[t].theftcount >= 9) {
                                    players[t].theftcount = 0
                                    players[t].health += players[t].theftbonus
                                }
                            }
                        }
                    } else if (players[t].demontaur == 1) {
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                players[t].health += (players[t].slamdamage) * .2
                            }
                        }
                        for (let k = 0; k < players[t].orblist.length; k++) {
                            if (players[t].orblist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].orbdamage)
                            }
                        }
                    } else if (players[t].inventrix == 1) {
                        for (let k = 0; k < players[t].hooklist.length; k++) {
                            if (players[t].hooklist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].hookdamage)
                                this.dashtarget.x = players[t].body.x
                                this.dashtarget.y = players[t].body.y
                                this.moveto.x = players[t].body.x
                                this.moveto.y = players[t].body.y
                                this.moveto.radius = players[t].body.radius
                                this.speedbonus = (-1 * (this.movespeedbase + this.speedboost)) + .0000001
                                let hookdot = 200
                                this.locked = Math.round(hookdot)
                                this.lockholder = Math.round(hookdot)
                                players[t].hooklist[k].life = 0
                            }
                        }
                        for (let k = 0; k < players[t].slams.length; k++) {
                            if (players[t].slams[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].slamdamage)
                                players[t].health += (players[t].slamdamage) * .2
                            }
                        }
                        for (let k = 0; k < players[t].orblist.length; k++) {
                            if (players[t].orblist[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].orbdamage)
                                players[t].orblist[k].life = 0
                            }
                        }
                    }else if (players[t].artsassin == 1) {
                        for (let k = 0; k < players[t].spears.length; k++) {
                                if (players[t].spears[k].body.doesPerimeterTouch(this.body)) {
                                    this.health -= players[t].speardamage
                                    
                                this.speedbonus = (-1 * (this.movespeedbase + this.speedboost)) + .0000001
                                let hookdot = 200
                                this.locked = Math.round(hookdot)
                                this.lockholder = Math.round(hookdot)
                                }
                        }
                        for (let k = 0; k < players[t].traps.length; k++) {
                            if (players[t].traps[k].body.doesPerimeterTouch(this.body)) {
                                this.health -= (players[t].trapdamage)
                                this.speedbonus = (-1 * (this.movespeedbase + this.speedboost)) + .0000001
                                let hookdot = 200
                                this.locked = Math.round(hookdot)
                                this.lockholder = Math.round(hookdot)
                                players[t].traps[k].life = 0
                            }
                        }
                    }
                    if (this.health <= 0) {
                        players[t].gold += this.goldvalue
                        break
                    }
                }
            }


            if (dummy > this.health) {
                if (this.activeshield > 0) {
                    if (this.activeshield >= dummy - this.health) {
                        this.activeshield -= dummy - this.health
                        this.health = dummy
                    } else {
                        this.health += this.activeshield
                        this.activeshield = 0
                    }
                }
            }
        }

    }


    let gasman = new Rectangle(100, 100, 200, 100, "green")

    let pingirl = new Rectangle(300, 100, 200, 100, "pink")
    let blindmonk = new Rectangle(100, 200, 200, 100, "grey")
    let robofister = new Rectangle(300, 200, 200, 100, "brown")
    let aliensquid = new Rectangle(100, 300, 200, 100, "purple")
    let foxghost = new Rectangle(300, 300, 200, 100, "white")
    let demontaur = new Rectangle(100, 400, 200, 100, "#00aaaa")
    let inventrix = new Rectangle(300, 400, 200, 100, "gold")
    let artsassin = new Rectangle(100, 500, 200, 100, "#444444")

    let player = new Pincushion(360, 360, "magenta")
    let enemy = new Pincushion(360, -500, "cyan")



    player.base = base1
    enemy.base = base2


    let players = []

    let beam1 = castBetween(rock1, rock2, 23, 100)
    let beam2 = castBetween(rock3, rock4, 23, 100)
    players.push(player)
    players.push(enemy)



    let count = 0


    let tower = new Tower(player.body.x - 110, player.body.y - 170, player)
    player.army.push(tower)
    let tower2 = new Tower(enemy.body.x + 110, enemy.body.y + 170, enemy)
    enemy.army.push(tower2)

    let selected = 0

    function main() {
        gamepadAPI.update()
        if (selected >= 2) {

            if (players[0].locked <= 0) {
                players[0].gamepadSkillsAdapter(new Point(0, 0))
            }
            // ////console.log(gamepad_angles())
            if (players[0].locked <= 0) {
                gamepad_control(players[0], players[0].movespeedbase + players[0].speedbonus + players[0].speedboost)
            } else {
                ////console.log(players[0].locked)
            }

            if (paused == -1) {
            } else {
                canvas_context.clearRect(-10000, -10000, canvas.width * 100, canvas.height * 100)  // refreshes the image
                canvas_context.fillStyle = "white"
                path.draw()
                base1.draw()
                base2.draw()
                rock1.draw()
                rock2.draw()
                beam1 = castBetween(rock1, rock2, 23, 100)
                beam2 = castBetween(rock3, rock4, 23, 100)

                for (let t = 0; t < players.length; t++) {
                    for (let k = 0; k < players.length; k++) {
                        if (players[t] != players[k]) {
                            for (let j = 0; j < players[k].army.length; j++) {
                                // players[k].army[j].body.radius -= 1
                                if (players[k].army[j].body.doesPerimeterTouch(players[t].body)) {
                                    // players[t].body.xmom *= .10
                                    // players[t].body.ymom *= .10
                                    // players[t].body.unmove()
                                    // players[t].body.xmom = 0
                                    // players[t].body.ymom = 0
                                    // players[t].moveto.x = players[t].body.x
                                    // players[t].moveto.y = players[t].body.y
                                    // players[t].body.x -= .001
                                    // players[t].control(players[t].body)
                                    // players[t].drive()
                                    // players[k].army[j].body.radius += 1
                                    // players[t].body.x += .001
                                    break
                                } else {
                                    // players[k].army[j].body.radius += 1
                                }
                            }
                        }
                    }
                }
                for (let t = 0; t < players.length; t++) {
                    if (players[t].gasbag == 1) {
                        players[t].gluedrawstager()
                    }
                }

                for (let t = 0; t < players.length; t++) {
                    players[t].draw()
                    if (beam1.isPointInside(players[t].body) || beam2.isPointInside(players[t].body) || base1.body.isPointInside(players[t].body) || base2.body.isPointInside(players[t].body)) {
                        players[t].body.unmove()
                        players[t].body.xmom = 0
                        players[t].body.ymom = 0
                        players[t].body.x -= .001
                        players[t].control(players[t].body)
                        // players[t].drive()
                        players[t].body.x += .001
                    }
                }



                let object = {}
                object.x = players[1].body.x + ((Math.random() - .5) * 120)
                object.y = players[1].body.y + ((Math.random() - .5) * 120)
                count++
                if (players[1].locked <= 0) {
                    players[1].skillsAdapter(object)
                }
                if (count % 40 == 0) {

                    let object = {}
                    object.x = ((Math.random() - .5) * 120) + players[1].body.x
                    object.y = ((Math.random() - .5) * 120) + players[1].body.y
                    if (Math.random() < .1) {
                        object.x = ((Math.random() - .5) * 120) + (players[0].body.x) //players[1].body.x +
                        object.y = ((Math.random() - .5) * 120) + (players[0].body.y) //players[1].body.y +
                    }
                    players[1].control(object)
                }

                for (let t = 0; t < players.length; t++) {
                    for (let k = 0; k < players[t].army.length; k++) {
                        players[t].army[k].drawbar()
                    }
                }
            }

        } else {
            if (selected == 0) {
                canvas_context.clearRect(-10000, -10000, canvas.width * 100, canvas.height * 100)  // refreshes the image
                canvas_context.fillStyle = "Gold"
                canvas_context.font = "20px arial"
                canvas_context.fillText(`Select your class`, 250, 75)
            } else if (selected == 1) {
                canvas_context.clearRect(-10000, -10000, canvas.width * 100, canvas.height * 100)  // refreshes the image
                canvas_context.fillStyle = "Red"
                canvas_context.font = "20px arial"
                canvas_context.fillText(`Select enemy class`, 250, 75)
            }

            gasman.draw()
            canvas_context.fillStyle = "Gold"
            canvas_context.fillText(`Gasman`, gasman.x + 50, gasman.y + 50)
            pingirl.draw()
            canvas_context.fillStyle = "black"
            canvas_context.fillText(`Pingirl`, pingirl.x + 50, pingirl.y + 50)
            blindmonk.draw()
            canvas_context.fillStyle = "black"
            canvas_context.fillText(`Blindmonk`, blindmonk.x + 50, blindmonk.y + 50)
            robofister.draw()
            canvas_context.fillStyle = "gold"
            canvas_context.fillText(`Robofister`, robofister.x + 50, robofister.y + 50)
            aliensquid.draw()
            canvas_context.fillStyle = "white"
            canvas_context.fillText(`Aliensquid`, aliensquid.x + 50, aliensquid.y + 50)
            foxghost.draw()
            canvas_context.fillStyle = "Purple"
            canvas_context.fillText(`Foxghost`, foxghost.x + 50, foxghost.y + 50)
            demontaur.draw()
            canvas_context.fillStyle = "silver"
            canvas_context.fillText(`Demontaur`, demontaur.x + 50, demontaur.y + 50)
            inventrix.draw()
            canvas_context.fillStyle = "Green"
            canvas_context.fillText(`Inventrix`, inventrix.x + 50, inventrix.y + 50)
            artsassin.draw()
            canvas_context.fillStyle = "crimson"
            canvas_context.fillText(`Artsassin`, artsassin.x + 50, artsassin.y + 50)
        }
    }
})