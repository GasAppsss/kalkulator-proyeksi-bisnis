/* ===== polyfill kecil untuk peramban lama (WebView dan browser ringan yang belum memahami API terbaru) ===== */
(function () {
  var EP = typeof Element !== 'undefined' ? Element.prototype : null;
  if (EP && !EP.replaceChildren) {
    EP.replaceChildren = function () {
      while (this.firstChild) this.removeChild(this.firstChild);
      if (arguments.length) this.append.apply(this, arguments);
    };
  }
  if (!Array.prototype.flat) {
    var ratakan = function (arr, depth, out) {
      for (var i = 0; i < arr.length; i++) {
        var v = arr[i];
        if (Array.isArray(v) && depth > 0) ratakan(v, depth - 1, out); else out.push(v);
      }
      return out;
    };
    Object.defineProperty(Array.prototype, 'flat', { configurable: true, writable: true, value: function flat(depth) { return ratakan(this, depth === undefined ? 1 : Number(depth), []); } });
  }
  if (!Array.prototype.includes) {
    Object.defineProperty(Array.prototype, 'includes', { configurable: true, writable: true, value: function includes(x, dari) { return this.indexOf(x, dari) !== -1; } });
  }
})();
