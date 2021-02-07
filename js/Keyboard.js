import * as storage from "./storage.js";
import create from "./utils/create.js";
import language from "./layouts/index.js"; // { en, ru }
import Key from "./Key.js";

const main = create("main", "", [
  create("h1", "title", "Virtual Keyboard"),
  create("p", "hint", "Last language saves in localStorage"),
  create("button", "btn", "Hide/Show keyboard"),
]);

export default class Keyboard {
  constructor(rowsOrder) {
    this.rowsOrder = rowsOrder;
    this.keysPressed = {};
    this.isCaps = false;
    this.isSoundOn = true;
  }

  init(langCode) {
    this.keyBase = language[langCode];

    this.output = create(
      "textarea",
      "output",
      null,
      main,
      ["placeholder", "Start type something..."],
      ["rows", 5],
      ["cols", 50],
      ["spellcheck", false],
      ["autocorrect", "off"]
    );
    this.container = create("div", "keyboard", null, main, [
      "language",
      langCode,
    ]);
    document.body.prepend(main);
    return this;
  }

  generateLayout() {
    this.keyButtons = [];
    this.rowsOrder.forEach((row, i) => {
      const rowElement = create("div", "keyboard__row", null, this.container, [
        "row",
        i + 1,
      ]);
      rowElement.style.gridTemplateColumns = `repeat(${row.length}, 1fr)`;
      row.forEach((code) => {
        const keyObj = this.keyBase.find((key) => key.code === code);
        if (keyObj) {
          const keyButton = new Key(keyObj);
          this.keyButtons.push(keyButton);
          rowElement.appendChild(keyButton.div);
        }
      });
    });

    this.soundBtn = document.querySelector('[data-code="Sounds"]');
    this.soundBtn.addEventListener("click", this.turnOnOff);

    this.micBtn = document.querySelector('[data-code="Mic"]');
    this.micBtn.addEventListener("mousedown", this.enterVoice);

    document.addEventListener("keydown", this.handleEvent);
    document.addEventListener("keyup", this.handleEvent);

    this.container.addEventListener("mousedown", this.preHandleEvent);
    this.container.addEventListener("mouseup", this.preHandleEvent);
  }

  enterVoice() {
    this.voice = true;
    window.SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    let speak = new SpeechRecognition();

    speak.lang = storage.get("kbLang") || "ru";
    speak.interimResults = true;

    if (!this.voice) {
      speak.stop();
      console.log("stop");
    } else {
      speak.start();
      console.log("begin");
      speak.onresult = function (e) {
        let phrase = Array.from(e.results)
          .map((result) => result[0])
          .map((result) => result.transcript)
          .join("");

        if (e.results[0].isFinal) {
          document.querySelector(".output").innerHTML += phrase + " ";
        }
      };

     

      this.voice = false;
      speak.continuous = true;
    }
  }

  turnOnOff() {
    this.soundBtn = document.querySelector('[data-code="Sounds"]');
    if (this.isSoundOn) {
      this.isSoundOn = false;
      Array.from(document.querySelectorAll("audio")).forEach(function (audio) {
        audio.muted = true;
      });
      this.soundBtn.lastChild.textContent = "Sounds turnedOff";
    } else {
      Array.from(document.querySelectorAll("audio")).forEach(function (audio) {
        audio.muted = false;
      });
      this.isSoundOn = true;
      this.soundBtn.classList.add("active");
      this.soundBtn.lastChild.textContent = "Sounds turnedOn";
    }
  }

  preHandleEvent = (e) => {
    e.stopPropagation();
    const keyDiv = e.target.closest(".keyboard__key");
    if (!keyDiv) return;
    const {
      dataset: { code },
    } = keyDiv;

    keyDiv.addEventListener("mouseleave", this.resetButtonState);
    this.handleEvent({ code, type: e.type });
  };

  handleEvent = (e) => {
    if (e.stopPropagation) e.stopPropagation();
    const { code, type } = e;
    const keyObj = this.keyButtons.find((key) => key.code === code);
    if (!keyObj) return;
    this.output.focus();

    // НАЖАТИЕ КНОПКИ

    if (type.match(/keydown|mousedown/)) {
      if (!type.match(/mouse/)) e.preventDefault();

      if (code.match(/Control|Alt|Caps|Sounds|Shift|Mic/) && e.repeat) return;

      if (code.match(/Control/)) this.ctrKey = true;
      if (code.match(/Alt/)) this.altKey = true;
      if (code.match(/Control/) && this.altKey) this.switchLanguage();
      if (code.match(/Alt/) && this.ctrKey) this.switchLanguage();
      if (code.match(/Win/)) this.switchLanguage();

      if (code.match(/Shift/) && !this.shiftKey) {
        this.shiftKey = true;
        this.switchUpperCase(true);
      } else if (code.match(/Shift/) && this.shiftKey) {
        this.shiftKey = false;
        this.switchUpperCase(false);
        keyObj.div.classList.remove("active");
      }

      keyObj.div.classList.add("active");

      if (code.match(/Caps/) && !this.isCaps) {
        this.isCaps = true;
        this.switchUpperCase(true);
      } else if (code.match(/Caps/) && this.isCaps) {
        this.isCaps = false;
        this.switchUpperCase(false);
        keyObj.div.classList.remove("active");
      }

      if (!this.isCaps) {
        this.printToOutput(keyObj, this.shiftKey ? keyObj.shift : keyObj.small);
      } else if (this.isCaps) {
        if (this.shiftKey) {
          this.printToOutput(
            keyObj,
            keyObj.sub.innerHTML ? keyObj.shift : keyObj.small
          );
        } else {
          this.printToOutput(
            keyObj,
            !keyObj.sub.innerHTML ? keyObj.shift : keyObj.small
          );
        }
      }
      this.keysPressed[keyObj.code] = keyObj;
      // ОТЖАТИЕ КНОПКИ
    } else if (e.type.match(/keyup|mouseup/)) {
      this.resetPressedButtons(code);
      // if (code.match(/Shift/) && !this.keysPressed[code])
      // if (code.match(/Shift/)) {
      // this.shiftKey = false;
      // this.switchUpperCase(false);
      //  }
      if (code.match(/Control/)) this.ctrKey = false;
      if (code.match(/Alt/)) this.altKey = false;

      if (!code.match(/Caps/)) {
        if (!code.match(/Sounds/)) {
          if (!code.match(/Shift/)) {
            if (!code.match(/Mic/)) {
              keyObj.div.classList.remove("active");
            }
          }
        }
      }
    }
  };

  resetButtonState = ({
    target: {
      dataset: { code },
    },
  }) => {
    //if (code.match(/Shift/)) {
    // this.shiftKey = false;
    // this.switchUpperCase(false);
    // this.keysPressed[code].div.classList.remove("active");
    // }
    if (code.match(/Control/)) this.ctrKey = false;
    if (code.match(/Alt/)) this.altKey = false;
    this.resetPressedButtons(code);
    this.output.focus();
  };

  resetPressedButtons = (targetCode) => {
    if (!this.keysPressed[targetCode]) return;
    if (targetCode.match(/Sounds/) && !this.isSoundOn) return;
    if (targetCode.match(/Mic/) && !this.voice) return;
    if (!this.isCaps && !this.shiftKey)
      this.keysPressed[targetCode].div.classList.remove("active");
    this.keysPressed[targetCode].div.removeEventListener(
      "mouseleave",
      this.resetButtonState
    );
    delete this.keysPressed[targetCode];
  };

  switchUpperCase(isTrue) {
    if (isTrue) {
      this.keyButtons.forEach((button) => {
        if (button.sub) {
          if (this.shiftKey) {
            button.sub.classList.add("sub-active");
            button.letter.classList.add("sub-inactive");
          }
        }

        if (
          !button.isFnKey &&
          this.isCaps &&
          !this.shiftKey &&
          !button.sub.innerHTML
        ) {
          button.letter.innerHTML = button.shift;
        } else if (!button.isFnKey && this.isCaps && this.shiftKey) {
          button.letter.innerHTML = button.small;
        } else if (!button.isFnKey && !button.sub.innerHTML) {
          button.letter.innerHTML = button.shift;
        }
      });
    } else {
      this.keyButtons.forEach((button) => {
        if (button.sub.innerHTML && !button.isFnKey) {
          button.sub.classList.remove("sub-active");
          button.letter.classList.remove("sub-inactive");

          if (!this.isCaps) {
            button.letter.innerHTML = button.small;
          } else if (!this.isCaps) {
            button.letter.innerHTML = button.shift;
          }
        } else if (!button.isFnKey) {
          if (this.isCaps) {
            button.letter.innerHTML = button.shift;
          } else {
            button.letter.innerHTML = button.small;
          }
        }
      });
    }
  }

  switchLanguage = () => {
    const langAbbr = Object.keys(language);
    let langIdx = langAbbr.indexOf(this.container.dataset.language);
    this.keyBase =
      langIdx + 1 < langAbbr.length
        ? language[langAbbr[(langIdx += 1)]]
        : language[langAbbr[(langIdx -= langIdx)]];

    this.container.dataset.language = langAbbr[langIdx];
    storage.set("kbLang", langAbbr[langIdx]);

    this.keyButtons.forEach((button) => {
      const keyObj = this.keyBase.find((key) => key.code === button.code);
      if (!keyObj) return;
      button.shift = keyObj.shift;
      button.small = keyObj.small;
      if (keyObj.shift && keyObj.shift.match(/[^a-zA-Zа-яА-ЯёЁ0-9]/g)) {
        button.sub.innerHTML = keyObj.shift;
      } else {
        button.sub.innerHTML = "";
      }
      button.letter.innerHTML = keyObj.small;
    });
    if (this.isCaps) this.switchUpperCase(true);
  };

  printToOutput(keyObj, symbol) {
    let cursorPos = this.output.selectionStart;
    const left = this.output.value.slice(0, cursorPos);

    let endSelection = this.output.selectionEnd;
    const right = this.output.value.slice(endSelection);

    const textHandlers = {
      Tab: () => {
        this.output.value = `${left}\t${right}`;
        cursorPos += 1;
      },
      ArrowLeft: () => {
        cursorPos = cursorPos - 1 >= 0 ? cursorPos - 1 : 0;
      },
      ArrowRight: () => {
        cursorPos += 1;
      },

      Enter: () => {
        this.output.value = `${left}\n${right}`;
        cursorPos += 1;
      },
      Delete: () => {
        this.output.value = `${left}${right.slice(1)}`;
      },
      Backspace: () => {
        this.output.value = `${left.slice(0, -1)}${right}`;
        cursorPos -= 1;
      },
      Space: () => {
        this.output.value = `${left} ${right}`;
        cursorPos += 1;
      },
    };
    if (textHandlers[keyObj.code]) textHandlers[keyObj.code]();
    else if (!keyObj.isFnKey) {
      cursorPos += 1;
      this.output.value = `${left}${symbol || ""}${right}`;
    }
    this.output.setSelectionRange(cursorPos, cursorPos);
  }
}
