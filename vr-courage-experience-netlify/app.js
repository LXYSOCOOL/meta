AFRAME.registerComponent('video-toggle', {
  init: function () {
    this.video = document.querySelector('#battleVideo');
    this.playButton = document.querySelector('#playButton');
    this.playIcon = document.querySelector('#playIcon');
    this.progressBar = document.querySelector('#progressBar');
    this.el.addEventListener('click', (event) => this.toggle(event));
    this.el.addEventListener('triggerdown', (event) => this.toggle(event));
  },
  toggle: function (event) {
    if (event) event.stopPropagation();
    if (!this.video) return;
    if (currentPageIndex !== 0 || !isVideoPageVisible()) {
      stopBattleVideo();
      return;
    }
    if (this.video.paused) {
      this.video.muted = false;
      this.video.play();
      this.playButton.setAttribute('visible', false);
      this.playIcon.setAttribute('visible', false);
    } else {
      this.video.pause();
      this.playButton.setAttribute('visible', true);
      this.playIcon.setAttribute('visible', true);
    }
  },
  tick: function () {
    if (!this.video || !this.progressBar || !this.video.duration) return;
    const trackWidth = 2.4;
    const pct = Math.max(0.01, this.video.currentTime / this.video.duration);
    this.progressBar.setAttribute('width', trackWidth * pct);
    this.progressBar.setAttribute('position', `${-1.2 + (trackWidth * pct) / 2} -0.75 0.05`);
  }
});

AFRAME.registerComponent('show-page', {
  schema: {
    show: { default: '' },
    hide: { default: '' },
    pauseVideo: { default: '' }
  },
  init: function () {
    this.el.addEventListener('click', () => this.switchPage());
    this.el.addEventListener('triggerdown', () => this.switchPage());
  },
  switchPage: function () {
    const showEl = document.querySelector(this.data.show);
    const hideEl = document.querySelector(this.data.hide);
    const video = document.querySelector(this.data.pauseVideo);
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
    if (hideEl) hideEl.setAttribute('visible', false);
    if (showEl) showEl.setAttribute('visible', true);
  }
});

const pageSelectors = [
  '#videoPage',
  '#modelPage',
  '#motherPage',
  '#chooseObjectPage',
  '#associateValuePage',
  '#loveObjectsPage',
  '#lovePeoplePage',
  '#reflectionPage'
];
let currentPageIndex = 0;
const pageSelections = {};
const pageRequirements = {
  3: 'object',
  4: 'value',
  5: 'loveObjects',
  6: 'lovePeople'
};

function stopBattleVideo() {
  const video = document.querySelector('#battleVideo');
  const playButton = document.querySelector('#playButton');
  const playIcon = document.querySelector('#playIcon');
  if (!video) return;
  video.pause();
  video.currentTime = 0;
  video.muted = true;
  if (playButton) playButton.setAttribute('visible', true);
  if (playIcon) playIcon.setAttribute('visible', true);
}

function isVideoPageVisible() {
  const videoPage = document.querySelector('#videoPage');
  return !!videoPage && videoPage.getAttribute('visible') !== false;
}

function setVideoInteraction(enabled) {
  ['#videoHitbox', '#playButton'].forEach((selector) => {
    const el = document.querySelector(selector);
    if (!el) return;
    if (enabled) {
      el.classList.add('clickable');
    } else {
      el.classList.remove('clickable');
    }
  });

  ['#leftController', '#rightController'].forEach((selector) => {
    const controller = document.querySelector(selector);
    if (controller && controller.components && controller.components.raycaster) {
      controller.components.raycaster.refreshObjects();
    }
  });
}

function hideSelectionBorders() {
  document.querySelectorAll('[id*="Border"]').forEach((border) => {
    border.setAttribute('visible', 'false');
    border.setAttribute('material', 'color: #2f62f4; opacity: 0; transparent: true; shader: flat');
  });
}

function updatePageDots(activeIndex) {
  pageSelectors.forEach((selector, index) => {
    const dot = document.querySelector(`#dot${index}`);
    if (!dot) return;
    const isActive = index === activeIndex;
    const color = isActive ? '#62bdf5' : '#6b7280';
    dot.innerHTML = isActive
      ? `
        <a-plane width="0.09" height="0.036" material="color: ${color}; shader: flat"></a-plane>
        <a-circle position="-0.045 0 0.002" radius="0.018" material="color: ${color}; shader: flat"></a-circle>
        <a-circle position="0.045 0 0.002" radius="0.018" material="color: ${color}; shader: flat"></a-circle>
      `
      : `<a-circle radius="0.022" material="color: ${color}; shader: flat"></a-circle>`;
  });
}

function showPage(index) {
  const nextIndex = Math.max(0, Math.min(pageSelectors.length - 1, index));
  if (nextIndex !== 0) stopBattleVideo();
  currentPageIndex = nextIndex;

  pageSelectors.forEach((selector, pageIndex) => {
    const page = document.querySelector(selector);
    if (page) page.setAttribute('visible', pageIndex === currentPageIndex);
  });

  updatePageDots(currentPageIndex);
  setVideoInteraction(currentPageIndex === 0);
}

AFRAME.registerComponent('page-nav', {
  schema: {
    direction: { default: 1 }
  },
  init: function () {
    const go = (event) => {
      if (event) event.stopPropagation();
      const nextDirection = Number(this.data.direction) || 1;
      const requiredGroup = pageRequirements[currentPageIndex];
      if (nextDirection > 0 && requiredGroup && !pageSelections[requiredGroup]) return;
      showPage(currentPageIndex + this.data.direction);
    };
    this.el.addEventListener('click', go);
    this.el.addEventListener('triggerdown', go);
  }
});

AFRAME.registerComponent('select-option', {
  schema: {
    group: { default: '' },
    border: { default: '' },
    continueButton: { default: '' }
  },
  init: function () {
    const select = (event) => {
      if (event) event.stopPropagation();
      const group = this.data.group;
      if (!group) return;

      pageSelections[group] = true;
      document.querySelectorAll(`[select-option*="group: ${group}"]`).forEach((el) => {
        const data = el.getAttribute('select-option');
        const border = data && data.border ? document.querySelector(data.border) : null;
        if (border) {
          border.setAttribute('visible', 'false');
          border.setAttribute('material', 'color: #2f62f4; opacity: 0; transparent: true; shader: flat');
        }
      });

      const activeBorder = document.querySelector(this.data.border);
      const continueButton = document.querySelector(this.data.continueButton);
      if (activeBorder) {
        activeBorder.setAttribute('visible', 'true');
        activeBorder.setAttribute('material', 'color: #2f62f4; opacity: 1; transparent: false; shader: flat');
      }
      if (continueButton) continueButton.setAttribute('material', 'color: #2f62f4; shader: flat');
    };

    this.el.addEventListener('click', select);
    this.el.addEventListener('triggerdown', select);
  }
});

AFRAME.registerComponent('continue-if-selected', {
  schema: {
    group: { default: '' }
  },
  init: function () {
    const go = (event) => {
      if (event) event.stopPropagation();
      if (!pageSelections[this.data.group]) return;
      showPage(currentPageIndex + 1);
    };

    this.el.addEventListener('click', go);
    this.el.addEventListener('triggerdown', go);
  }
});

AFRAME.registerComponent('model-manipulator', {
  schema: {
    hitbox: { default: '' },
    leftController: { default: '#leftController' },
    rightController: { default: '#rightController' }
  },
  init: function () {
    this.mouseDragging = false;
    this.lastX = 0;
    this.activeController = null;
    this.lastControllerX = null;

    this.hitbox = document.querySelector(this.data.hitbox) || this.el;
    this.leftController = document.querySelector(this.data.leftController);
    this.rightController = document.querySelector(this.data.rightController);

    this.hitbox.addEventListener('mousedown', (event) => this.start(event));
    this.hitbox.addEventListener('touchstart', (event) => this.start(event));
    this.hitbox.addEventListener('mouseup', () => this.stop());
    this.hitbox.addEventListener('mouseleave', () => this.stop());
    this.hitbox.addEventListener('touchend', () => this.stop());

    window.addEventListener('mousemove', (event) => this.move(event.clientX));
    window.addEventListener('touchmove', (event) => {
      if (event.touches.length) this.move(event.touches[0].clientX);
    });
    window.addEventListener('mouseup', () => this.stop());

    [this.leftController, this.rightController].forEach((controller) => {
      if (!controller) return;
      controller.addEventListener('triggerdown', () => this.startController(controller));
      controller.addEventListener('triggerup', () => this.stopController(controller));
      controller.addEventListener('gripdown', () => this.startController(controller));
      controller.addEventListener('gripup', () => this.stopController(controller));
    });
  },
  start: function (event) {
    this.mouseDragging = true;
    this.lastX = event.clientX || (event.touches && event.touches[0].clientX) || 0;
  },
  stop: function () {
    this.mouseDragging = false;
  },
  move: function (x) {
    if (!this.mouseDragging) return;
    const rotation = this.el.getAttribute('rotation');
    rotation.y += (x - this.lastX) * 0.45;
    this.el.setAttribute('rotation', rotation);
    this.lastX = x;
  },
  startController: function (controller) {
    if (!this.isPointingAtHitbox(controller)) return;
    this.activeController = controller;
    this.lastControllerX = null;
  },
  stopController: function (controller) {
    if (this.activeController === controller) {
      this.activeController = null;
      this.lastControllerX = null;
    }
  },
  isPointingAtHitbox: function (controller) {
    const raycaster = controller.components && controller.components.raycaster;
    if (!raycaster) return false;
    const intersections = raycaster.intersections || [];
    return intersections.some((hit) => hit.object && hit.object.el === this.hitbox);
  },
  controllerWorldPosition: function (controller) {
    const position = new THREE.Vector3();
    controller.object3D.getWorldPosition(position);
    return position;
  },
  tick: function () {
    if (!this.activeController) return;
    const handPosition = this.controllerWorldPosition(this.activeController);
    if (!handPosition) return;
    if (this.lastControllerX === null) {
      this.lastControllerX = handPosition.x;
      return;
    }

    const rotation = this.el.getAttribute('rotation');
    rotation.y += (handPosition.x - this.lastControllerX) * 120;
    this.el.setAttribute('rotation', rotation);
    this.lastControllerX = handPosition.x;
  }
});

AFRAME.registerComponent('fit-gltf', {
  schema: {
    height: { default: 2 },
    status: { default: '#modelStatus' },
    align: { default: 'center' },
    floorY: { default: -0.5 }
  },
  init: function () {
    const status = document.querySelector(this.data.status);
    this.el.addEventListener('model-loaded', () => {
      if (status) status.setAttribute('visible', false);
      const root = this.el.object3D;
      if (!root) return;

      root.position.set(0, 0, 0);
      root.scale.set(1, 1, 1);
      root.updateWorldMatrix(true, true);

      const inverseRoot = new THREE.Matrix4().copy(root.matrixWorld).invert();
      const box = new THREE.Box3();
      box.makeEmpty();

      root.traverse((node) => {
        if (!node.isMesh || !node.geometry) return;
        if (!node.geometry.boundingBox) node.geometry.computeBoundingBox();
        const meshBox = node.geometry.boundingBox.clone();
        meshBox.applyMatrix4(node.matrixWorld);
        meshBox.applyMatrix4(inverseRoot);
        box.union(meshBox);
      });

      if (box.isEmpty()) return;
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);

      const maxAxis = Math.max(size.x, size.y, size.z);
      if (!maxAxis) return;

      const scale = this.data.height / maxAxis;
      root.scale.setScalar(scale);
      const y = this.data.align === 'floor'
        ? this.data.floorY - (box.min.y * scale)
        : -center.y * scale;
      root.position.set(-center.x * scale, y, -center.z * scale);
    });
    this.el.addEventListener('model-error', () => {
      if (status) status.setAttribute('value', 'Model failed to load. Use http://127.0.0.1:8080 instead of file://');
    });
  }
});

window.addEventListener('DOMContentLoaded', () => {
  hideSelectionBorders();
  showPage(0);
});
