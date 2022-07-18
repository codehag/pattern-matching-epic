//
// This includes all code samples written as they would be once the pattern matching epic is fully
// applied.

// Complex cases are delegate to simple function that return true or false.
function maybeRetry(res) {
  return res.status == 500 && !this.hasRetried;
}

// example 1
match (res) {
  let when { status: 200, body, ...rest }: handleData(body, rest)
  let { destination: url } when { status and status >= 300 and status < 400, destination}:
    handleRedirect(url)
  when maybeRetry.bind(this): { // can alternatively be a higher order function
    retry(req);
    this.hasRetried = true;
  }

  default: throwSomething();
}

// example 2
match (command) {
  let [, dir] when [ 'go', ('north' or 'east' or 'south' or 'west')]: go(dir);
  let [, item] when [ 'take', (/[a-z]+ ball/ and { weight })]: take(item);
  default: lookAround();


// example 3
match (res) {
  let when { data: [page] }: ...
  let when { data: [frontPage, ...pages ]}: ...
  default: { ... }
}

// example 4
match (arithmeticStr) {
  let { groups: [left, right]} when (/(?<left>\d+) \+ (?<right>\d+)/): process(left, right);
  let [, left, right] when (/(\d+) \* (\d+)/: process(left, right);
  default: ...
}

// example 5
const LF = 0x0a;
const CR = 0x0d;

match (nextChar()) {
  when LF: ...
  when CR: ...
  default: ...
}

// Option example
class Option {
  #value;
  #hasValue = false;

  constructor (hasValue, value) {
    this.#hasValue = !!hasValue;
    if (hasValue) {
      this.#value = value;
    }
  }

  get value() {
    if (this.#hasValue) return this.#value;
    throw new Exception('Can’t get the value of an Option.None.');
  }

  static Some(val) {
    return new Option(true, val);
  }

  static None() {
    return new Option(false);
  }

  static {
    Option.Some[Symbol.matcher] = (val) => ({
      matched: #hasValue in val && val.#hasValue,
      value: val.value,
    });

    Option.None[Symbol.matcher] = (val) => ({
      matched: #hasValue in val && !val.#hasValue
    });
  }
}

match (result) {
  // note, we are returning the unwrapped value, so we don't need destructuring
  let val when Option.Some: console.log(val);
  when Option.None: console.log("none");
}
