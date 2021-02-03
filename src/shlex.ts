export interface ShlexOptions {
  mode: 'windows' | 'posix';
}

export function* split(str: string, opt?: ShlexOptions): Iterable<string> {
  opt = opt || {
    mode: process.platform === 'win32' ? 'windows' : 'posix',
  };
  const quoteChars = opt.mode === 'posix' ? '\'"' : '"';
  let escapeChars = '';
  if (opt.mode == 'posix') {
    escapeChars += '\\';
  }
  let quoteChar: string | undefined;
  let escapeChar: string | undefined;
  let token: string | undefined;
  let subquote: boolean = false;
  for (let i = 0; i < str.length; ++i) {
    const char = str.charAt(i);
    if (escapeChar) {
      if (char === '\n') {
        // Do nothing
      } else if (!quoteChar || char !== quoteChar || escapeChars.includes(char)) {
        token = (token || '') + char;
      } else {
        token = (token || '') + escapeChar + char;
      }
      // We parsed an escape seq. Reset to no escape
      escapeChar = undefined;
      continue;
    }

    if (escapeChars.includes(char)) {
      if (quoteChar && escapeChars.includes(quoteChar)) {
        // Ignore this.
      } else {
        // We're parsing an escape sequence.
        escapeChar = char;
        continue;
      }
    }

    if (quoteChar) {
      if (char === quoteChar) {
        // Reached the end of a sub-quoted token.
        if (subquote) {
          subquote = false;
          token = (token || '') + char;
        }
        // Reached the end of a quoted token.
        quoteChar = undefined;
        continue;
      }
      // Another quoted char
      token = (token || '') + char;
      continue;
    }

    if (quoteChars.includes(char)) {
      // Beginning of a sub-quoted token
      if (i > 0 && (opt.mode === 'posix' ? (str.substring(i - 1, i + 1) === "\\\'" || str.substring(i - 1, i + 1) === "\\\"") : str.substring(i - 1, i + 1) === "\\\"")) {
        subquote = true;
        quoteChar = char;
        // Accumulate
        token = (token || '') + char;
        continue;
      }
      // Beginning a new quoted token
      quoteChar = char;
      token = '';
      continue;
    }

    if (/[\t \n\r\f]/.test(char)) {
      if (token !== undefined) {
        yield quote(token, opt);
      }
      token = undefined;
      continue;
    }

    // Accumulate
    token = (token || '') + char;
  }

  if (token !== undefined) {
    yield quote(token, opt);
  }
}

export function quote(str: string, opt?: ShlexOptions): string {
  opt = opt || {
    mode: process.platform === 'win32' ? 'windows' : 'posix',
  };
  if (str == '') {
    return '""';
  }
  if (/[^\w@%\-+=:,./|]/.test(str)) {
    str = str.replace(/"/g, '\\"');
    return `"${str}"`;
  } else {
    return str;
  }
}