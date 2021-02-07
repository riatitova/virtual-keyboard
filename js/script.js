import { get } from "./storage.js";
import Keyboard from "./Keyboard.js";
import * as storage from "./storage.js";
const rowsOrder = [
  [
    "Backquote",
    "Digit1",
    "Digit2",
    "Digit3",
    "Digit4",
    "Digit5",
    "Digit6",
    "Digit7",
    "Digit8",
    "Digit9",
    "Digit0",
    "Minus",
    "Equal",
    "Delete",
  ],
  [
    "Tab",
    "KeyQ",
    "KeyW",
    "KeyE",
    "KeyR",
    "KeyT",
    "KeyY",
    "KeyU",
    "KeyI",
    "KeyO",
    "KeyP",
    "BracketLeft",
    "BracketRight",
    "Backspace",
  ],
  [
    "CapsLock",
    "KeyA",
    "KeyS",
    "KeyD",
    "KeyF",
    "KeyG",
    "KeyH",
    "KeyJ",
    "KeyK",
    "KeyL",
    "Semicolon",
    "Quote",
    "Backslash",
    "Enter",
  ],
  [
    "ShiftLeft",
    "IntlBackslash",
    "KeyZ",
    "KeyX",
    "KeyC",
    "KeyV",
    "KeyB",
    "KeyN",
    "KeyM",
    "Comma",
    "Period",
    "Slash",
    "Mic",
    "ShiftRight",
  ],
  [
    "ControlLeft",
    "Win",
    "AltLeft",
    "Space",
    "AltRight",
    "ArrowLeft",
    "Sounds",
    "ArrowRight",
    "ControlRight",
  ],
];
let isHidden = false;
const lang = get("kbLang", '"ru"');
//generate keyboard
new Keyboard(rowsOrder).init(lang).generateLayout();
//hide/show keyboard button
document.querySelector(".btn").addEventListener("click", showKeyboard);
function showKeyboard() {
  if (!isHidden) {
    document.querySelector(".keyboard").style.display = "none";
    isHidden = true;
  } else {
    document.querySelector(".keyboard").style.display = "grid";
    isHidden = false;
  }
}

//make sounds while typing

const keySound = {
  ".keyboard__key": [".keyPress", ".keyPressRu"],
  '[data-code="CapsLock"]': ".caps",
  '[data-code="ShiftLeft"]': ".Shift",
  '[data-code="ShiftRight"]': ".Shift",
  '[data-code="Backspace"]': ".del",
  '[data-code="Enter"]': ".enter",
};
const keySounds = Array.from(document.querySelectorAll(".keyboard__key"));
keySounds.forEach((key) =>
  key.addEventListener("transitionend", removeTransition)
);
document.addEventListener("keydown", playSound);
const keyboardKeyElems = document.querySelectorAll(".keyboard__key");
keyboardKeyElems.forEach((elem) => {
  elem.addEventListener("mousedown", playSound);
});

function removeTransition(e) {
  if (e.propertyName !== "transform") return;
  e.target.classList.remove("playing");
}

function playSound(e) {
  let match;
  let audio;
  let target;

  if (e.type.match(/mouse/)) target = e.target.closest(".keyboard__key");
  else {
    const keyObj = keySounds.find((key) => e.code === key.dataset.code);
    if (!keyObj) return;
    target = keyObj;
  }

  for (let prop in keySound) {
    if (prop !== ".keyboard__key") {
      match = target.matches(`${prop}`);
      if (match) {
        audio = document.querySelector(`${keySound[prop]}`);
        target.addEventListener("transitionend", removeTransition);
      }
    }
    if (!match && prop === ".keyboard__key") {
      if (storage.get("kbLang") == "en") {
        audio = document.querySelector(`${keySound[prop][0]}`);
      } else {
        audio = document.querySelector(`${keySound[prop][1]}`);
      }
      target.addEventListener("transitionend", removeTransition);
    }
  }

  if (!audio) return;

  target.classList.add("playing");
  audio.currentTime = 0;
  audio.play();
}

//voice





