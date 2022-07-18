# Introducing Epics.

My proposal here is to split pattern matching into a well defined epic. This will be the first
proposal following what may be a new process for us. That is, tracking groups of proposals
intentionally.

The goal of an epics process is
 * Ensure that we do not separate proposals from one another so that the context and meaning of
 their relationship is lost.
 * Ensure we are building from the language
 * Ensure we are working in small enough chunks that we have enough attention to attend to each
 one
 * Enable working on top of a clearly defined heirarchy of proposals

An epic builds relationships between proposals. They build a topology, and allow other, smaller
proposals to be considered as part of a whole. Identifying a Layer at which a proposal lives at
can help with implementation planning, as well as determining the design space we are working
with.

When an epic is accepted in committee: it is accepted as a layered structure where each layer has
explicit support from the committee for exploration. Some proposals on a given layer are critical
path, others are not. They are noted as such. Each proposal has it's own problem statement and
motivation.

Identifying the layers of an epic takes the following process:
* Determine what the core underlying functionality is.
* Identify its immediate dependants.
* Repeat until you have a tree of proposals.

Proposals can move up and down in an epic, as their requirements change.

Epics themselves have only 3 stages: Pending, In progress, and Completed.
* A Pending Epic is under discussion in the committee.
* An In Progress Epic has been accepted, and its constituent parts are being worked on.
* A Completed Epic had all critical parts completed and is considered done.

This will be pretty scary for the champions, especially the early stages. So, to quell some
fears, when all layers are applied, you will be able to write code like this:
* [Examples with fully applied pattern matching](complete.js)

What we want to answer here, is, how do we get there?


# Pattern matching: A layered perspective.

We need to start at the beginning. What is the underlying problem we want to solve, and what
builds on top of solving that problem?

Matcher helpers in isolation, without "match" or patterns
fundamentally, a pattern is a question that returns "yes" or "no".
We can implement this, at first, as functions. Functions are one of JavaScript's super powers. We
overlook them often because its so easy to take them for granted, but they really enable a lot of
things and are well understood by developers.


The layers for now, based on my review:

**Layer 1**:
  * Functionality: Enable basic support for complex matching through syntax
     * Base proposal (foundation)

**Layer 2**:
  * Functionality: Enable modifying the pass-through value
    * Custom Matchers (critical)
    * Fixing Switch / Introducing Match (arguably critical)
  * Functionality: Enable new contexts for complex matching
    * Catch guards,
    * etc.

**Layer 3**:
  * Functionality and Ergonomics: Introduce Pattern Matching Syntax for common matches.
    * Pattern Matching Syntax (critical)

**Layer 4**:
  * Ergonomics (readability): Remove unnecessary duplication for check & assign
    * Let-When statements (critical)

Each of these layers (and their associated critical proposals) would be part of the epic, and the
epic would only attain Completion if all layers had their critical parts fulfilled.


## Layer 1: Base Proposal,
No match syntax, no syntax. Only support for patterns.
This first part comes from [my analysis](https://docs.google.com/document/d/1dVaSGokKneIT3eDM41Uk67SyWtuLlTWcaJvOxsBX2i0/edit) of the current proposal's syntax

It would be a mistake for us to introduce something so far from what developers are used to, as
it will confuse developers about how existing syntax works. Instead, we can decompose the syntax
into two parts: The assignment, and the match. This can be done completely independently of the
match statement.

The necessary pieces:
 * Patterns:            a keyword when that takes a function that returns a true or false value

 * Assignable patterns: [let,const,var] _ when: if the `when` clause is true, then the assignment
                        keyword will destructure the object originally passed to when.

This gives us light weight matchers that are highly customizable. This addresses the problem
"there are no ways to match patterns beyond regular expressions for strings".
We also remove the need for parentheses.


```javascript
function isOk(response) {
  return response.status == 200;
}

function isOkPair(key, response) {
  return response.status == 200;
}

let { body } when isOk(response);
const { body } when isOk(response);
var { body } when isOk(response);

// the equivalent today would be:

let { body } = isOk(response) ? response : {};
const { body } = isOk(response) ? response : {};
var { body } = isOk(response) ? response : {};

// you get the idea. I'll use let for now.

// if we ever allow let statements in if statements, we can do this.
if (let { body } when isOk(value)) {
  handle(body);
}

// There is no equivalent today.

// note:

let foo = when isOK(value); // foo will be a boolean. This is also fine, but weird to use when here. Maybe it should be disallowed.
```

This can be used in many other cases
```javascript
const responses = [
  {status: 200, body: "a body"},
  /* ... etc */
]

// continue if isOk is not true
for (let { body } when isOk of responses) {
  handle(body);
}
```

The equivalent today
```javascript
for (let response of responses) {
  if (isOk(response) {
    handle(response.body);
  }
}
```

Again, if we ever allow assignment in this case
```javascript
while (let { body } when isOk(responses.pop())) {
  handle(body);
}
```

Equivalent today

```javascript
while (responses.length()) {
  const response = responses.pop();
  if (isOk(response) {
    handle(response.body);
  }
}
```

If we are doing object iteration, then likely we have a reason to check the url
and can handle that in a separate function.

```javascript
const responseList = {
  "myURl": {status: 200, body: "a body"},
  /* ... etc */
}

function isOkPair([key, response]) {
  if (inAllowList(url)) {
    return response.status == 200;
  }
  return false;
}

for (let [url, { body }] when isOkPair in responseList) {
  handle(body);
}
```

The equivalent today.
```javascript
for (let [url, response] of responses) {
  if (isOkPair([url, response]) {
    handle(response.body);
  }
}
```

## Layer 2: Fixing `switch`.

There are three problems in the initial problem statement that are being fixed here:

1) an explicit break is required in each case to avoid accidental fallthrough;
2) scoping is ambiguous (block-scoped variables inside one case are available in the scope of the others, unless curly braces are used);
3) the only comparison it can do is ===.

Note: Match is actually optional. We don't actually need to introduce "match".
We just need to enable switch to use patterns and assignable patterns:



```javascript
function isGo(command) {
  const validDirections = ["north", "east", "south", "west"];
  return command[0] === "go" && validDirections.includes(command[1]);
}

function isTake(command) {
  const isValidItemString = /[a-z+ ball]/;
  return command[0] === "take"
         && isValidItemString.match(command[1])
         && command[1].weight;
}

switch (command) {
  let [, dir] when isGo: go(dir);
  let [, item] when isTake: take(item);
  default: lookAround();
}
```

But if we want to keep legacy behavior separate, then we can do this by introducing `match`. So
lets say we have a new statement match.

I am luke-warm on "killing switch". I think this isn't a worthwhile use of a keyword. Everything done
from this point on with match could equally be done with switch, and this would free match to be
used elsewhere.

```javascript
function isGo(command) {
  const validDirections = ["north", "east", "south", "west"];
  return command[0] === "go" && validDirections.includes(command[1]);
}

function isTake(command) {
  const isValidItemString = /[a-z+ ball]/;
  return command[0] === "take"
         && isValidItemString.match(command[1])
         && command[1].weight;
}

match (command) {
  let [, dir] when isGo: go(dir);
  let [, item] when isTake: take(item);
  default: lookAround();
}

function maybeRetry(res) {
  return res.status == 500 && !this.hasRetried;
}

match (res) {
  let { status, body, ...rest } when { status: 200}: handleData(body, rest)
  let { destination: url } when { status and status >= 300 and status < 400 }:
    handleRedirect(url)
  when maybeRetry.bind(this): { // can alternatively be a higher order function
    retry(req);
    this.hasRetried = true;
  }

  default: throwSomething();
}
```

With just these pieces, we can implement a more complex use case, which is Option matching!
This would make a good proposal! with Option, Ok, None, Error etc.

```javascript
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

  isSome() {
    return !!this.#hasValue;
  }

  isNone() {
    return !this.#hasValue;
  }

  static Some(val) {
    return new Option(true, val);
  }

  static None() {
    return new Option(false);
  }
}

// the is methods can of course be static, there is flexibility in how someone wants to implement this.
match (result) {
  let { value } when result.isSome: console.log(value());
  when result.isNone: console.log("none");
}
```

Similarily, builtins can all have an is<x> brand check
```javascript
match (value) {
  when Number.isNumber: ... // currently missing
  when BigInt.isBigInt: ... // currently missing
  when String.isString: ... // currently missing
  when Array.isArray: ...
  default: ...
}
```

The bar to implement this stuff by users is low, as we are just working with functions.

## Layer 2: Custom Matchers

There are cases where we want custom behavior -- where the object is not passed through
unmodified to the let statement. This can't be implemented with a function that returns true
or false. So what do we do here? In this case we want special behavior.

A good motivating example is regex. This is the motivating case for custom matchers.
Regex returns the matched value, and it would make sense for _this_ to be what we operate on,
rather than the initial value.

```javascript
Builtin Regex {
  static {
    Regex[Symbol.matcher] = (val) => ({
      matched: // ...,
      value: // ...,
    });
  }
}

match (arithmeticStr) {
  let { groups: [left, right]} when (/(?<left>\d+) \+ (?<right>\d+)/): process(left, right);
  let [, left, right] when (/(\d+) \* (\d+)/: process(left, right);
  default: ...
}
```

Custom matchers can be implemented in user code
```javascrpt
function equalityMatcher(goal, brand) {
  return function(test) {
    return goal.checkBrand(test) && goal === test;
  }
}

const LF = 0x0a;
const CR = 0x0d;

// These are now exotic strings. Use imagination for this one.
Object.setPrototypeOf(LF, Char);
Object.setPrototypeOf(CR, Char);
// or like whatever.
LF[Symbol.matcher] = equalityMatcher(LF);
CR[Symbol.matcher] = equalityMatcher(CR);

match (nextChar()) {
  when LF: ...
  when CR: ...
  default: ...
}
```

This also means, we can now write option like so:

```javascript
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
```

## Layer 3: Pattern Matching Syntax
Introducing pattern matching. A short hand for describing object shapes, that can be used with
`when`.


### The (optional) Base Case: introducing `is`
Let's rewind a bit and consider an early case. Given this pattern:

```javascript
function isOk(response) {
  return response.status == 200;
}

let { body } when isOk(response);
```

What if we could rewrite it as:
```javascript
let { body } when response is { status: 200 };
```

We can also write it in if statements
```javascript
if (when response is { status: 200 }) {
  // ... do work when response matches something
}
```

In an unknown future, if potentially we allow the following:

```javascript
if ( let x = someMethod()) {
  // ... do work when x is not null
}
```

we could additionally allow:

```javascript
if ( let { body } when response is { status: 200 }) {
  // ... do work when body is not null
}
```

This is totally optional. This can, by the way, be dropped. Introducing an `is` keyword is totally optional.

### Implicit values
Going back to a more orthodox case, we have implicit values.

```javascript
match (command) {
  let [, dir] when [ 'go', ('north' or 'east' or 'south' or 'west')]: go(dir);
  let [, item] when [ 'take', (/[a-z]+ ball/ and { weight })]: take(item);
  default: lookAround();
}
```

However, implicit values can also apply to other proposals, as we are no longer tied to
the match statement. Consider
```javascript
try {
  something();
} catch when isStatus500 {
  // handle it one way...
} catch when isStatus402 {
  // handle the other way...
} catch (err) {
  // catch all...
}
```

Something like this could be a dependency of layer 2 work, and eventually get the same benefits
from layer 4 work.

```javascript
try {
  something();
} catch when {status: 500} {
  // handle it one way...
} catch when {status: 402} {
  // handle the other way...
} catch (err) {
  // catch all...
}
```


A more complex example is this one (without the if statement):
```javascript
match (res) {
  let { data: [page] } when { data: [page] }: ...
  let { data: [frontPage, ...pages ]} when { data: [frontPage, ...pages ]}: ...
  default: { ... }
}
```

This isn't ideal as we are repeating ourselves.
So, we might fall back on functions here:

```javascript
function hasOnePage(arg) { arg.data.length === 1 }
function hasMoreThanOnePage(arg) { arg.data.length > 1 }
match (res) {
  let { data: [page] } when hasOnePage: ...
  let { data: [frontPage, ...pages ]} when hasMoreThanOnePage: ...
  default: { ... }
}
```

We can consider primatives, where we can default to ===:
```javascript
const LF = 0x0a;
const CR = 0x0d;

// default to === for primatives
match (nextChar()) {
  when LF: ...
  when CR: ...
  default: ...
}

match (nextNum()) {
  when 1: ...
  when 2: ...
  default: ...
}

// works the same way in single matchers.
let nums = [1, 1, 1, 1, 1, 2, 1, 1, 1, 1]
while (when 1 is nums.pop()) {
  count++
}

// something additional to consider
const responses = [..alistofresponses];
while (let {body} when {status: 200} is responses.pop()) {
  handle(body);
}
```

## Layer 4: Let-When statements
One of the criticisms I have, for the current proposal, is the unforgiving conflation of
assignment and testing. The separation of these two parts allows this proposal to be split into
smaller chunks. However, there is a benefit to having conflation. recall this unfortunate example:


```javascript
match (res) {
  let { data: [page] } when { data: [page] }: ...
  let { data: [frontPage, ...pages ]} when { data: [frontPage, ...pages ]}: ...
  default: { ... }
}
```

This largely fell out of the previous proposals. However. this is a case where we want intentional
conflation. For that, we can have `let when`.

```javascript
match (res) {
  let when { data: [page] }: ...
  let when { data: [frontPage, ...pages ]}: ...
  default: { ... }
}
```

Since this has been worked on in a layered way, this applies to the language more broadly:

```javascript
while (let when {status: 200, body} is responses.pop()) {
  handle(body);
}
```

A couple of edge cases:
```javascript
let nums = [1, 1, 1, 1, 1, 2, 1, 1, 1, 1]
while (when 1 is nums.pop()) {
  count++
}

// this will throw, because you can't assign primitives.
while (let when 1 is nums.pop()) {
  count++
}

// this won't throw
while (let x when 1 is nums.pop()) {
  count += x
}
```

// Finally, we can have very intentional aliasing, without the shadowing issue:
```javascript
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
```

## Conclusion

We don't get 100% back to where we were with in the pattern matching proposal.  We get 90% of the way there, but
we also reuse existing structures and do it in a way that is learnable and consistent for programmers. Finally,
there is room to expand here, this is by no means the final shape of a potential epic.

I have to stop writing as my wrist is completely destroyed. I hope you will understand if I missed
stuff or mistyped (for example i know that parentheses may be necessary).
