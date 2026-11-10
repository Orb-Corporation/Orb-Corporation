(function () {
  "use strict";

  var editor = document.getElementById("orb-editor");
  var runButton = document.getElementById("orb-run");
  var resetButton = document.getElementById("orb-reset");
  var output = document.getElementById("orb-output");
  var status = document.getElementById("orb-status");

  if (!editor || !runButton || !resetButton || !output || !status) return;

  var starter = 'fn main() {\n    println("Hello, World!");\n}';
  var MAX_SOURCE = 12000;
  var MAX_TOKENS = 2500;
  var MAX_OUTPUT = 6000;

  function PreviewError(message, token) {
    this.name = "PreviewError";
    this.message = message;
    this.line = token ? token.line : 1;
    this.column = token ? token.column : 1;
  }
  PreviewError.prototype = Object.create(Error.prototype);
  PreviewError.prototype.constructor = PreviewError;

  function tokenize(source) {
    if (source.length > MAX_SOURCE) {
      throw new PreviewError("Source is too long for this browser preview.");
    }

    var tokens = [];
    var i = 0;
    var line = 1;
    var column = 1;

    function advance() {
      var ch = source[i++];
      if (ch === "\n") {
        line++;
        column = 1;
      } else {
        column++;
      }
      return ch;
    }

    function add(type, value, startLine, startColumn) {
      tokens.push({ type: type, value: value, line: startLine, column: startColumn });
      if (tokens.length > MAX_TOKENS) {
        throw new PreviewError("This example has too many tokens for the browser preview.");
      }
    }

    while (i < source.length) {
      var ch = source[i];

      if (/\s/.test(ch)) {
        advance();
        continue;
      }

      if (ch === "/" && source[i + 1] === "/") {
        while (i < source.length && source[i] !== "\n") advance();
        continue;
      }

      if (ch === "/" && source[i + 1] === "*") {
        var commentLine = line;
        var commentColumn = column;
        advance();
        advance();
        var closed = false;
        while (i < source.length) {
          if (source[i] === "*" && source[i + 1] === "/") {
            advance();
            advance();
            closed = true;
            break;
          }
          advance();
        }
        if (!closed) {
          throw new PreviewError("Unclosed block comment.", { line: commentLine, column: commentColumn });
        }
        continue;
      }

      var startLine = line;
      var startColumn = column;

      if (ch === '"') {
        advance();
        var raw = "";
        var closedString = false;
        while (i < source.length) {
          ch = advance();
          if (ch === '"') {
            closedString = true;
            break;
          }
          if (ch === "\\") {
            if (i >= source.length) break;
            raw += ch + advance();
          } else {
            raw += ch;
          }
        }
        if (!closedString) {
          throw new PreviewError("Unclosed string literal.", { line: startLine, column: startColumn });
        }
        add("string", decodeString(raw, { line: startLine, column: startColumn }), startLine, startColumn);
        continue;
      }

      if (/[0-9]/.test(ch)) {
        var number = "";
        while (i < source.length && /[0-9_]/.test(source[i])) number += advance();
        if (source[i] === "." && /[0-9]/.test(source[i + 1] || "")) {
          number += advance();
          while (i < source.length && /[0-9_]/.test(source[i])) number += advance();
        }
        var parsedNumber = Number(number.replace(/_/g, ""));
        if (!Number.isFinite(parsedNumber)) {
          throw new PreviewError("Invalid numeric literal.", { line: startLine, column: startColumn });
        }
        add("number", parsedNumber, startLine, startColumn);
        continue;
      }

      if (/[A-Za-z_]/.test(ch)) {
        var identifier = "";
        while (i < source.length && /[A-Za-z0-9_]/.test(source[i])) identifier += advance();
        add("identifier", identifier, startLine, startColumn);
        continue;
      }

      if (ch === ":" && source[i + 1] === "=") {
        advance();
        advance();
        add("symbol", ":=", startLine, startColumn);
        continue;
      }

      if ("(){};,:=+-*/%".indexOf(ch) !== -1) {
        add("symbol", advance(), startLine, startColumn);
        continue;
      }

      throw new PreviewError('Unsupported character "' + ch + '".', { line: startLine, column: startColumn });
    }

    add("eof", "", line, column);
    return tokens;
  }

  function decodeString(raw, token) {
    var result = "";
    for (var i = 0; i < raw.length; i++) {
      var ch = raw[i];
      if (ch !== "\\") {
        result += ch;
        continue;
      }

      i++;
      var escape = raw[i];
      var simple = {
        n: "\n",
        t: "\t",
        r: "\r",
        0: "\0",
        "\\": "\\",
        '"': '"'
      };

      if (Object.prototype.hasOwnProperty.call(simple, escape)) {
        result += simple[escape];
      } else if (escape === "x") {
        var hex = raw.slice(i + 1, i + 3);
        if (!/^[0-9a-fA-F]{2}$/.test(hex)) {
          throw new PreviewError("Expected two hexadecimal digits after \\x.", token);
        }
        result += String.fromCharCode(parseInt(hex, 16));
        i += 2;
      } else {
        throw new PreviewError("Unsupported string escape sequence.", token);
      }
    }
    return result;
  }

  function Parser(tokens) {
    this.tokens = tokens;
    this.index = 0;
    this.variables = Object.create(null);
    this.output = "";
  }

  Parser.prototype.current = function () {
    return this.tokens[this.index];
  };

  Parser.prototype.is = function (type, value) {
    var token = this.current();
    return token.type === type && (value === undefined || token.value === value);
  };

  Parser.prototype.take = function () {
    return this.tokens[this.index++];
  };

  Parser.prototype.expect = function (type, value, message) {
    if (!this.is(type, value)) {
      var token = this.current();
      throw new PreviewError(message || ("Expected " + (value || type) + "."), token);
    }
    return this.take();
  };

  Parser.prototype.run = function () {
    this.expect("identifier", "fn", 'The preview expects a "fn main() { ... }" entry point.');
    this.expect("identifier", "main", 'The preview only runs a "main" function.');
    this.expect("symbol", "(");
    this.expect("symbol", ")");
    this.expect("symbol", "{");

    while (!this.is("symbol", "}") && !this.is("eof")) {
      this.statement();
    }

    this.expect("symbol", "}", "Expected the closing brace for main.");
    this.expect("eof", "", "Only one main function is supported by this preview.");
    return this.output;
  };

  Parser.prototype.statement = function () {
    if (this.is("identifier", "return")) {
      this.take();
      this.expect("symbol", ";");
      return;
    }

    if (this.is("identifier", "print") || this.is("identifier", "println")) {
      this.printStatement();
      return;
    }

    if (this.is("identifier")) {
      this.variableStatement();
      return;
    }

    throw new PreviewError("Expected a variable declaration, print/println call, or return.", this.current());
  };

  Parser.prototype.printStatement = function () {
    var name = this.take().value;
    this.expect("symbol", "(");
    var values = [];

    if (!this.is("symbol", ")")) {
      values.push(this.expression());
      while (this.is("symbol", ",")) {
        this.take();
        values.push(this.expression());
      }
    }

    this.expect("symbol", ")");
    this.expect("symbol", ";");
    for (var i = 0; i < values.length; i++) {
      this.output += String(values[i]);
    }
    if (name === "println") this.output += "\n";

    if (this.output.length > MAX_OUTPUT) {
      throw new PreviewError("Program output exceeded the browser preview limit.");
    }
  };

  Parser.prototype.variableStatement = function () {
    var name = this.expect("identifier").value;
    if (Object.prototype.hasOwnProperty.call(this.variables, name)) {
      throw new PreviewError('Variable "' + name + '" is already declared.', this.tokens[this.index - 1]);
    }

    if (this.is("symbol", ":=")) {
      this.take();
    } else if (this.is("symbol", ":")) {
      this.take();
      this.expect("identifier", undefined, "Expected a type name after ':'.");
      this.expect("symbol", "=");
    } else {
      throw new PreviewError("The browser preview supports declarations with := or : type =.", this.current());
    }

    this.variables[name] = this.expression();
    this.expect("symbol", ";");
  };

  Parser.prototype.expression = function () {
    return this.additive();
  };

  Parser.prototype.additive = function () {
    var value = this.multiplicative();
    while (this.is("symbol", "+") || this.is("symbol", "-")) {
      var operator = this.take().value;
      var right = this.multiplicative();
      if (typeof value !== "number" || typeof right !== "number") {
        throw new PreviewError("Arithmetic operators in this preview require numeric values.", this.tokens[this.index - 1]);
      }
      value = operator === "+" ? value + right : value - right;
    }
    return value;
  };

  Parser.prototype.multiplicative = function () {
    var value = this.unary();
    while (this.is("symbol", "*") || this.is("symbol", "/") || this.is("symbol", "%")) {
      var token = this.take();
      var right = this.unary();
      if (typeof value !== "number" || typeof right !== "number") {
        throw new PreviewError("Arithmetic operators in this preview require numeric values.", token);
      }
      if ((token.value === "/" || token.value === "%") && right === 0) {
        throw new PreviewError("Division by zero.", token);
      }
      if (token.value === "*") value *= right;
      else if (token.value === "/") value = Math.trunc(value / right);
      else value %= right;
    }
    return value;
  };

  Parser.prototype.unary = function () {
    if (this.is("symbol", "-")) {
      this.take();
      var value = this.unary();
      if (typeof value !== "number") throw new PreviewError("Unary '-' requires a number.", this.tokens[this.index - 1]);
      return -value;
    }
    return this.primary();
  };

  Parser.prototype.primary = function () {
    var token = this.current();

    if (this.is("number") || this.is("string")) {
      this.take();
      return token.value;
    }

    if (this.is("identifier", "true") || this.is("identifier", "false")) {
      this.take();
      return token.value === "true";
    }

    if (this.is("identifier")) {
      this.take();
      if (!Object.prototype.hasOwnProperty.call(this.variables, token.value)) {
        throw new PreviewError('Unknown variable "' + token.value + '".', token);
      }
      return this.variables[token.value];
    }

    if (this.is("symbol", "(")) {
      this.take();
      var value = this.expression();
      this.expect("symbol", ")");
      return value;
    }

    throw new PreviewError("Expected a literal, variable, or parenthesised expression.", token);
  };

  function execute(source) {
    var parser = new Parser(tokenize(source));
    return parser.run();
  }

  runButton.addEventListener("click", function () {
    status.textContent = "Running…";
    output.textContent = "";
    try {
      var result = execute(editor.value);
      output.textContent = result || "(no output)";
      status.textContent = "Preview finished";
    } catch (error) {
      if (error instanceof PreviewError) {
        output.textContent = "Preview error (line " + error.line + ", column " + error.column + "):\n" + error.message;
      } else {
        output.textContent = "The browser preview could not process this program.";
      }
      status.textContent = "Error";
    }
  });

  resetButton.addEventListener("click", function () {
    editor.value = starter;
    output.textContent = "Your program's output will appear here.";
    status.textContent = "Ready";
    editor.focus();
  });

  editor.addEventListener("keydown", function (event) {
    if (event.key === "Tab") {
      event.preventDefault();
      var start = editor.selectionStart;
      var end = editor.selectionEnd;
      editor.setRangeText("    ", start, end, "end");
    }
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      runButton.click();
    }
  });

  runButton.click();
})();