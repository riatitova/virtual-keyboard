
import create from './utils/create.js';

export default class Key {
  constructor({ small, shift, code }) {
    this.code = code;
    this.small = small;
    this.shift = shift;
    this.isFnKey = Boolean(small.match(/Ctrl|arr|Alt|Shift|Tab|Bcksp|Del|Enter|Caps|Win|en|рус|mic|sounds/));

    if (shift && shift.match(/[^a-zA-Zа-яА-ЯёЁ0-9]/)) {
      this.sub = create('div', 'sub', this.shift);
    } else {
      this.sub = create('div', 'sub', '');
    }

    this.letter = create('div', 'letter', small);
    this.div = create('div', 'keyboard__key', [this.sub, this.letter], null, ['code', this.code],
      this.isFnKey ? ['fn', 'true'] : ['fn', 'false']); // нужен, чтобы в разметке стилизовать функциональные клавиши отдельно
  }
}
