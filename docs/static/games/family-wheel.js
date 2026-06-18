(function () {
  'use strict';

  var COLORS = [
    '#7c3aed', '#e11d48', '#0891b2', '#16a34a', '#ca8a04',
    '#db2777', '#2563eb', '#ea580c', '#0d9488', '#9333ea',
  ];

  function polar(cx, cy, angle, radius) {
    var rad = (angle - 90) * Math.PI / 180;
    return {
      x: cx + Math.cos(rad) * radius,
      y: cy + Math.sin(rad) * radius,
    };
  }

  function segmentPath(cx, cy, r, start, end) {
    var p1 = polar(cx, cy, start, r);
    var p2 = polar(cx, cy, end, r);
    var large = end - start > 180 ? 1 : 0;
    return [
      'M', cx, cy,
      'L', p1.x, p1.y,
      'A', r, r, 0, large, 1, p2.x, p2.y,
      'Z',
    ].join(' ');
  }

  function FamilyWheel(opts) {
    this.rotor = document.getElementById(opts.rotorId);
    this.disc = document.getElementById(opts.discId);
    this.spinBtn = opts.spinBtnId ? document.getElementById(opts.spinBtnId) : null;
    this.segments = opts.segments || [];
    this.rotation = 0;
    this.spinning = false;
    this.cx = 100;
    this.cy = 100;
    this.r = 92;
    this.onResult = opts.onResult || function () {};
    if (this.spinBtn) {
      var self = this;
      this.spinBtn.addEventListener('click', function () { self.spin(); });
    }
    this.rebuild();
  }

  FamilyWheel.prototype.rebuild = function () {
    if (!this.rotor) return;
    var segs = this.segments;
    if (!segs.length) {
      this.rotor.innerHTML = '';
      return;
    }
    var slice = 360 / segs.length;
    this.rotor.innerHTML = '';
    var self = this;
    segs.forEach(function (seg, i) {
      var start = i * slice;
      var end = start + slice;
      var mid = start + slice / 2;
      var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', segmentPath(self.cx, self.cy, self.r, start, end));
      path.setAttribute('fill', seg.color || COLORS[i % COLORS.length]);
      path.setAttribute('stroke', '#fff');
      path.setAttribute('stroke-width', '2');
      self.rotor.appendChild(path);

      var labelPos = polar(self.cx, self.cy, mid, self.r * 0.62);
      var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', labelPos.x);
      text.setAttribute('y', labelPos.y + 4);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', '#fff');
      text.setAttribute('font-size', seg.label && seg.label.length > 4 ? '8' : '10');
      text.setAttribute('font-weight', '700');
      text.textContent = seg.label || '';
      self.rotor.appendChild(text);
    });

    var hub = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    hub.setAttribute('cx', this.cx);
    hub.setAttribute('cy', this.cy);
    hub.setAttribute('r', '16');
    hub.setAttribute('fill', '#fff');
    hub.setAttribute('stroke', 'rgba(91,33,182,0.2)');
    hub.setAttribute('stroke-width', '2');
    this.rotor.appendChild(hub);
    this.rotor.style.transformOrigin = this.cx + 'px ' + this.cy + 'px';
    this.rotor.style.transition = 'none';
    this.rotor.style.transform = 'rotate(' + this.rotation + 'deg)';
  };

  FamilyWheel.prototype.setSegments = function (segments) {
    if (!segments || segments.length !== this.segments.length) {
      this.rotation = 0;
    }
    this.segments = segments;
    this.rebuild();
  };

  FamilyWheel.prototype.indexAtRotation = function () {
    var n = this.segments.length;
    if (!n) return 0;
    var slice = 360 / n;
    var norm = ((this.rotation % 360) + 360) % 360;
    var atPointer = (360 - norm) % 360;
    var index = Math.floor(atPointer / slice) % n;
    return index;
  };

  FamilyWheel.prototype.spin = function () {
    var self = this;
    return new Promise(function (resolve) {
      if (self.spinning || !self.segments.length || !self.rotor) {
        resolve(null);
        return;
      }
      self.spinning = true;
      if (self.disc) self.disc.classList.add('is-spinning');
      if (self.spinBtn) {
        self.spinBtn.disabled = true;
        self.spinBtn.classList.add('is-spinning');
      }

      var n = self.segments.length;
      var slice = 360 / n;
      var index = Math.floor(Math.random() * n);
      var extra = 1800 + Math.floor(Math.random() * 360);
      var target = extra + (n - index - 0.5) * slice;
      self.rotation += target;
      self.rotor.style.transition = 'transform 3.4s cubic-bezier(0.12, 0.84, 0.22, 1)';
      self.rotor.style.transform = 'rotate(' + self.rotation + 'deg)';

      setTimeout(function () {
        self.spinning = false;
        if (self.disc) self.disc.classList.remove('is-spinning');
        if (self.spinBtn) {
          self.spinBtn.disabled = false;
          self.spinBtn.classList.remove('is-spinning');
        }
        index = self.indexAtRotation();
        var seg = self.segments[index];
        self.onResult(seg, index);
        resolve(seg);
      }, 3500);
    });
  };

  window.MopanFamilyWheel = FamilyWheel;
  window.MopanFamilyWheelColors = COLORS;
})();
