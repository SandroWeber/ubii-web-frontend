/**
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 * @author paulirish / http://paulirish.com/
 */

/* eslint-disable no-console */

import * as THREE from 'three';

let XRHubFirstPersonControls = function (object, domElement) {

    if (domElement === undefined) {
        console.warn('THREE.FirstPersonControls: The second parameter "domElement" is now mandatory.');
        domElement = document;
    }

    this.object = object;
    this.domElement = domElement;

    // API

    this.enabled = true;

    this.movementSpeed = 1.0;
    this.lookSpeed = 0.5;

    this.lookVertical = true;
    this.autoForward = false;

    this.activeLook = true;

    this.heightSpeed = false;
    this.heightCoef = 1.0;
    this.heightMin = 0.0;
    this.heightMax = 1.0;

    this.constrainVertical = false;
    this.verticalMin = 0;
    this.verticalMax = Math.PI;

    this.mouseDragOn = false;

    // internals

    this.autoSpeedFactor = 0.0;

    this.mouseX = 0;
    this.mouseY = 0;

    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;

    this.shiftKey = false;
    this.shiftMultiplier = 5;

    this.viewHalfX = 0;
    this.viewHalfY = 0;

    // private variables

    var lat = 0;
    var lon = 0;

    var lookDirection = new THREE.Vector3();
    var spherical = new THREE.Spherical();
    var target = new THREE.Vector3();

    //

    if (this.domElement !== document) {
        this.domElement.setAttribute('tabindex', - 1);
    }

    //

    this.handleResize = function () {
        if (this.domElement === document) {
            this.viewHalfX = window.innerWidth / 2;
            this.viewHalfY = window.innerHeight / 2;
        } else {
            this.viewHalfX = this.domElement.offsetWidth / 2;
            this.viewHalfY = this.domElement.offsetHeight / 2;
        }
    };

    this.getMousePosition = function (event) {
        let mouseX, mouseY;
        if (this.domElement === document) {
            mouseX = event.pageX - this.viewHalfX;
            mouseY = event.pageY - this.viewHalfY;
        } else {
            mouseX = event.pageX - this.domElement.offsetLeft - this.viewHalfX;
            mouseY = event.pageY - this.domElement.offsetTop - this.viewHalfY;
        }

        return [mouseX, mouseY];
    };

    this.onMouseDown = function (event) {
        if (this.domElement !== document) {
            this.domElement.focus();
        }

        event.preventDefault();
        event.stopPropagation();

        if (this.activeLook) {
            switch (event.button) {
                case 0: break;
                case 2: {
                    let mousePosition = this.getMousePosition(event);
                    this.mouseDownX = mousePosition[0];
                    this.mouseDownY = mousePosition[1];
                    this.mouseX = mousePosition[0];
                    this.mouseY = mousePosition[1];

                    this.mouseDragOn = true;
                    break;
                }
            }
        }
    };

    this.onMouseUp = function (event) {
        event.preventDefault();
        event.stopPropagation();

        if (this.activeLook) {
            switch (event.button) {
                case 0: break;
                case 2: {
                    this.mouseDragOn = false;
                    break;
                }
            }
        }

    };

    this.onMouseMove = function (event) {
        if (!this.mouseDragOn) {
            return;
        }

        let mousePosition = this.getMousePosition(event);
        this.mouseX = mousePosition[0];
        this.mouseY = mousePosition[1];
    };

    this.onKeyDown = function (event) {
        //event.preventDefault();

        switch (event.keyCode) {

            case 38: /*up*/
            case 87: /*W*/ this.moveForward = true; break;

            case 37: /*left*/
            case 65: /*A*/ this.moveLeft = true; break;

            case 40: /*down*/
            case 83: /*S*/ this.moveBackward = true; break;

            case 39: /*right*/
            case 68: /*D*/ this.moveRight = true; break;

            case 82: /*R*/ this.moveUp = true; break;
            case 70: /*F*/ this.moveDown = true; break;
        }

        if (event.shiftKey) {
            this.shiftKey = true;
        }
    };

    this.onKeyUp = function (event) {
        switch (event.keyCode) {

            case 38: /*up*/
            case 87: /*W*/ this.moveForward = false; break;

            case 37: /*left*/
            case 65: /*A*/ this.moveLeft = false; break;

            case 40: /*down*/
            case 83: /*S*/ this.moveBackward = false; break;

            case 39: /*right*/
            case 68: /*D*/ this.moveRight = false; break;

            case 82: /*R*/ this.moveUp = false; break;
            case 70: /*F*/ this.moveDown = false; break;

        }

        if (event.shiftKey) {
            this.shiftKey = false;
        }
    };

    this.lookAt = function (x, y, z) {

        if (x.isVector3) {

            target.copy(x);

        } else {

            target.set(x, y, z);

        }

        this.object.lookAt(target);

        setOrientation(this);

        return this;

    };

    this.updateRotation = function (delta) {
        if (!this.mouseDragOn) {
            return;
        }

        var actualLookSpeed = delta * this.lookSpeed;

        if (!this.activeLook) {
            actualLookSpeed = 0;
        }

        var verticalLookRatio = 1;

        if (this.constrainVertical) {
            verticalLookRatio = Math.PI / (this.verticalMax - this.verticalMin);
        }

        lon -= (this.mouseX - this.mouseDownX) * actualLookSpeed;
        if (this.lookVertical) lat -= (this.mouseY - this.mouseDownY) * actualLookSpeed * verticalLookRatio;

        lat = Math.max(- 85, Math.min(85, lat));

        var phi = THREE.Math.degToRad(90 - lat);
        var theta = THREE.Math.degToRad(lon);

        if (this.constrainVertical) {
            phi = THREE.Math.mapLinear(phi, 0, Math.PI, this.verticalMin, this.verticalMax);
        }

        var position = this.object.position;

        var targetPosition = new THREE.Vector3();

        targetPosition.setFromSphericalCoords(1, phi, theta).add(position);

        this.object.lookAt(targetPosition);
    };

    this.updatePosition = function (delta) {
        if (this.heightSpeed) {

            var y = THREE.Math.clamp(this.object.position.y, this.heightMin, this.heightMax);
            var heightDelta = y - this.heightMin;

            this.autoSpeedFactor = delta * (heightDelta * this.heightCoef);

        } else {
            this.autoSpeedFactor = 0.0;
        }

        var actualMoveSpeed = delta * this.movementSpeed;
        if (this.shiftKey) {
            actualMoveSpeed *= this.shiftMultiplier;
        }

        if (this.moveForward || (this.autoForward && !this.moveBackward)) this.object.translateZ(- (actualMoveSpeed + this.autoSpeedFactor));
        if (this.moveBackward) this.object.translateZ(actualMoveSpeed);

        if (this.moveLeft) this.object.translateX(- actualMoveSpeed);
        if (this.moveRight) this.object.translateX(actualMoveSpeed);

        if (this.moveUp) this.object.translateY(actualMoveSpeed);
        if (this.moveDown) this.object.translateY(- actualMoveSpeed);
    };

    this.update = function () {
        return function update(delta) {
            if (this.enabled === false) return;

            this.updatePosition(delta);
            this.updateRotation(delta);
        };
    }();

    function contextmenu(event) {

        event.preventDefault();

    }

    this.dispose = function () {

        this.domElement.removeEventListener('contextmenu', contextmenu, false);
        this.domElement.removeEventListener('mousedown', _onMouseDown, false);
        this.domElement.removeEventListener('mousemove', _onMouseMove, false);
        this.domElement.removeEventListener('mouseup', _onMouseUp, false);

        window.removeEventListener('keydown', _onKeyDown, false);
        window.removeEventListener('keyup', _onKeyUp, false);

    };

    var _onMouseMove = bind(this, this.onMouseMove);
    var _onMouseDown = bind(this, this.onMouseDown);
    var _onMouseUp = bind(this, this.onMouseUp);
    var _onKeyDown = bind(this, this.onKeyDown);
    var _onKeyUp = bind(this, this.onKeyUp);

    this.domElement.addEventListener('contextmenu', contextmenu, false);
    this.domElement.addEventListener('mousemove', _onMouseMove, false);
    this.domElement.addEventListener('mousedown', _onMouseDown, false);
    this.domElement.addEventListener('mouseup', _onMouseUp, false);

    window.addEventListener('keydown', _onKeyDown, false);
    window.addEventListener('keyup', _onKeyUp, false);

    function bind(scope, fn) {

        return function () {

            fn.apply(scope, arguments);

        };

    }

    function setOrientation(controls) {
        var quaternion = controls.object.quaternion;

        lookDirection.set(0, 0, - 1).applyQuaternion(quaternion);
        spherical.setFromVector3(lookDirection);

        lat = 90 - THREE.Math.radToDeg(spherical.phi);
        lon = THREE.Math.radToDeg(spherical.theta);
    }

    this.handleResize();

    setOrientation(this);

};

export default XRHubFirstPersonControls;