/**
 * @author mrdoob / http://mrdoob.com
 * @author Mugen87 / https://github.com/Mugen87
 *
 * Based on @tojiro's vr-samples-utils.js
 */

/**
 * Most of the code taken from node_modules/three/examples/js/vr/WebVR.js
 * added export as module to be able to use import statement and make functions available in Vue component
 * removed deprecated code
 * improved formatting
 * added code to enable VR
 */

/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
/* eslint-disable no-redeclare */

var WebVR = {
  createButton: function (renderer, options) {
    if (options && options.frameOfReferenceType) {
      renderer.xr.setFrameOfReferenceType(options.frameOfReferenceType);
    }

    function showEnterVR(device) {
      button.style.display = '';
      button.style.cursor = 'pointer';
      button.style.left = 'calc(50% - 50px)';
      button.style.width = '100px';
      button.textContent = 'ENTER VR';

      button.onmouseenter = function () {
        button.style.opacity = '1.0';
      };

      button.onmouseleave = function () {
        button.style.opacity = '0.5';
      };

      button.onclick = function () {
        device.isPresenting
          ? device.exitPresent()
          : device.requestPresent([
            {
              source: renderer.domElement
            }
          ]);
      };

      renderer.xr.setDevice(device);
    }

    function showEnterXR(device) {
      var currentSession = null;

      function onSessionStarted(session) {
        session.addEventListener('end', onSessionEnded);

        renderer.xr.setSession(session);
        button.textContent = 'EXIT VR';

        currentSession = session;
      }

      function onSessionEnded(event) {
        currentSession.removeEventListener('end', onSessionEnded);

        renderer.xr.setSession(null);
        button.textContent = 'ENTER VR';

        currentSession = null;
      }

      button.style.display = '';
      button.style.cursor = 'pointer';
      button.style.left = 'calc(50% - 50px)';
      button.style.width = '100px';
      button.textContent = 'ENTER VR';

      button.onmouseenter = function () {
        button.style.opacity = '1.0';
      };

      button.onmouseleave = function () {
        button.style.opacity = '0.5';
      };

      button.onclick = function () {
        if (currentSession === null) {
          device
            .requestSession({
              immersive: true,
              exclusive: true /* DEPRECATED */
            })
            .then(onSessionStarted);
        } else {
          currentSession.end();
        }
      };

      renderer.xr.setDevice(device);
    }

    function showVRNotFound() {
      button.style.display = '';
      button.style.cursor = 'auto';
      button.style.left = 'calc(50% - 75px)';
      button.style.width = '150px';
      button.textContent = 'VR NOT FOUND';
      button.onmouseenter = null;
      button.onmouseleave = null;
      button.onclick = null;
      //renderer.xr.setDevice(null);
    }

    function stylizeElement(element) {
      element.style.position = 'absolute';
      element.style.bottom = '20px';
      element.style.padding = '12px 6px';
      element.style.border = '1px solid #fff';
      element.style.borderRadius = '4px';
      element.style.background = 'rgba(0,0,0,0.1)';
      element.style.color = '#fff';
      element.style.font = 'normal 13px sans-serif';
      element.style.textAlign = 'center';
      element.style.opacity = '0.5';
      element.style.outline = 'none';
      element.style.zIndex = '999';
    }

    if ('xr' in navigator) {
      var button = document.createElement('button');
      button.style.display = 'none';
      stylizeElement(button);

      navigator.xr
        .requestDevice()
        .then(function (device) {
          device
            .supportsSession({
              immersive: true,
              exclusive: true /* DEPRECATED */
            })
            .then(function () {
              showEnterXR(device);
            })
            .catch(showVRNotFound);
        })
        .catch(showVRNotFound);
      return button;
    } else if ('getVRDisplays' in navigator) {
      var button = document.createElement('button');
      button.style.display = 'none';

      stylizeElement(button);

      window.addEventListener(
        'vrdisplayconnect',
        function (event) {
          showEnterVR(event.display);
        },
        false
      );

      window.addEventListener(
        'vrdisplaydisconnect',
        function (event) {
          showVRNotFound();
        },
        false
      );

      window.addEventListener(
        'vrdisplaypresentchange',
        function (event) {
          button.textContent = event.display.isPresenting
            ? 'EXIT VR'
            : 'ENTER VR';
        },
        false
      );

      window.addEventListener(
        'vrdisplayactivate',
        function (event) {
          event.display.requestPresent([
            {
              source: renderer.domElement
            }
          ]);
        },
        false
      );

      navigator
        .getVRDisplays()
        .then(function (displays) {
          if (displays.length > 0) {
            showEnterVR(displays[0]);
          } else {
            showVRNotFound();
          }
        })
        .catch(showVRNotFound);
      return button;
    } else {
      var message = document.createElement('a');
      message.href = 'https://webvr.info';
      message.innerHTML = 'WEBVR NOT SUPPORTED';
      message.style.left = 'calc(50% - 90px)';
      message.style.width = '180px';
      message.style.textDecoration = 'none';
      stylizeElement(message);
      return message;
    }
  }
};

export default WebVR;
