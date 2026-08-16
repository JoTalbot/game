// Подставной DOM: настолько живой, чтобы поднять интерфейс игры.
//
// `ui.js` — 452 строки и 41 обращение к документу — не грузился НИ В
// ОДНОМ стенде: заглушка возвращала null на любой getElementById, и
// bind() падал бы на первой же кнопке. Весь интерфейс (сигила, небо,
// рассказ, кнопки, поле рта) не проверялся никогда. Это всплыло, когда
// человек сказал «небо и сигилу открывал», а отчёт писал 0: счётчики
// были немыми, и увидеть это можно было только чтением исходника.
//
// Здесь ровно столько DOM, сколько нужно игре: узлы, классы, текст,
// события, canvas 2D. Не эмулятор браузера — макет сцены, на которой
// интерфейс можно потрогать.
"use strict";

function classList(node) {
  return {
    add: function (c) { if (node._cls.indexOf(c) < 0) node._cls.push(c); },
    remove: function (c) {
      var i = node._cls.indexOf(c);
      if (i >= 0) node._cls.splice(i, 1);
    },
    toggle: function (c, on) {
      var has = node._cls.indexOf(c) >= 0;
      var want = on == null ? !has : !!on;
      if (want && !has) node._cls.push(c);
      if (!want && has) node._cls.splice(node._cls.indexOf(c), 1);
    },
    contains: function (c) { return node._cls.indexOf(c) >= 0; }
  };
}

function ctx2d() {
  var o = { calls: [], canvas: null };
  [
    "save", "restore", "beginPath", "closePath", "arc", "moveTo", "lineTo",
    "fill", "stroke", "fillText", "strokeText", "translate", "rotate", "scale",
    "setTransform", "transform", "resetTransform", "clearRect", "fillRect",
    "strokeRect", "rect", "quadraticCurveTo", "bezierCurveTo", "ellipse",
    "clip", "drawImage", "setLineDash", "arcTo", "putImageData"
  ].forEach(function (m) {
    o[m] = function () { o.calls.push(m); };
  });
  o.createRadialGradient = o.createLinearGradient = function () {
    o.calls.push("gradient");
    return { addColorStop: function () {} };
  };
  o.measureText = function (s) { return { width: String(s).length * 6 }; };
  o.getImageData = function () { return { data: [0, 0, 0, 0] }; };
  return o;
}

function makeNode(id, tag) {
  var node = {
    id: id || "",
    tagName: (tag || "div").toUpperCase(),
    _cls: [],
    _text: "",
    _html: "",
    _listeners: {},
    style: {},
    value: "",
    width: 280,
    height: 280,
    childNodes: [],
    children: []
  };
  node.classList = classList(node);
  Object.defineProperty(node, "textContent", {
    get: function () { return node._text; },
    set: function (v) { node._text = String(v); }
  });
  Object.defineProperty(node, "innerHTML", {
    get: function () { return node._html; },
    set: function (v) { node._html = String(v); }
  });
  node.addEventListener = function (type, fn) {
    (node._listeners[type] = node._listeners[type] || []).push(fn);
  };
  node.removeEventListener = function () {};
  // Позвать обработчик так, как это сделал бы палец человека.
  node.fire = function (type, ev) {
    var fns = node._listeners[type] || [];
    for (var i = 0; i < fns.length; i++) {
      fns[i].call(node, ev || { preventDefault: function () {}, stopPropagation: function () {} });
    }
    return fns.length;
  };
  node.appendChild = function (child) {
    node.children.push(child);
    node.childNodes.push(child);
    return child;
  };
  node.removeChild = function (child) {
    var i = node.children.indexOf(child);
    if (i >= 0) { node.children.splice(i, 1); node.childNodes.splice(i, 1); }
    return child;
  };
  node.getContext = function () {
    if (!node._ctx) { node._ctx = ctx2d(); node._ctx.canvas = node; }
    return node._ctx;
  };
  node.getBoundingClientRect = function () {
    return { left: 0, top: 0, width: node.width || 800, height: node.height || 600 };
  };
  node.toDataURL = function () { return "data:image/png;base64,"; };
  node.toBlob = function (cb) { cb(null); };
  node.select = function () {};
  node.focus = function () {};
  node.click = function () { node.fire("click"); };
  return node;
}

// Все узлы, которые ищет игра. Список взят из web/index.html: если там
// появится новый id, стенд честно вернёт для него живой узел, а не null.
var IDS = [
  "app", "stage", "depth-stage", "grain", "overlay", "brand", "season", "hint",
  "fit-debug", "hud-right", "mute-btn", "lang-btn", "sky-btn", "sigil-btn",
  "law", "title-screen", "word", "tag", "title-actions", "btn-continue",
  "btn-born", "whisper", "veil", "igra-line", "fate-screen", "fate-line",
  "fate-actions", "btn-release", "btn-become", "report-screen", "report-title",
  "report-sub", "report-asks", "report-note", "report-text", "report-actions",
  "report-copy", "report-close", "sigil-screen", "sigil-canvas", "sigil-name",
  "sigil-sub", "sigil-stats", "sigil-verses", "sigil-season", "sigil-actions",
  "sigil-close", "btn-report", "btn-share", "btn-forget", "mouth-wrap",
  "mouth-url"
];

function install() {
  var nodes = {};
  IDS.forEach(function (id) {
    nodes[id] = makeNode(id, id === "stage" || id.indexOf("canvas") >= 0 ? "canvas" : "div");
  });
  nodes["mouth-url"].tagName = "INPUT";
  // у #mouth-wrap первый узел — текст подписи, игра его переписывает
  nodes["mouth-wrap"].childNodes = [{ textContent: "рот " }];

  var doc = {
    _nodes: nodes,
    getElementById: function (id) { return nodes[id] || null; },
    querySelector: function (sel) {
      var id = String(sel).replace(/^#/, "");
      return nodes[id] || null;
    },
    querySelectorAll: function () { return []; },
    documentElement: { style: {}, lang: "ru" },
    body: makeNode("body", "body"),
    title: "",
    addEventListener: function () {},
    createElement: function (tag) { return makeNode("", tag); },
    execCommand: function () { return true; }
  };
  global.document = doc;
  return doc;
}

module.exports = { install: install, makeNode: makeNode, IDS: IDS };
